const express = require('express');
const router = express.Router();
const PoetryNode = require('../models/PoetryNode');

// 1. 获取所有诗树的根节点
router.get('/trees', async (req, res) => {
  console.log('--- Received request for /api/trees ---'); // 日志1：检查请求是否收到
  try {
    console.log('Querying database for root nodes...'); // 日志2：检查是否开始查询
    const roots = await PoetryNode.find({ isRoot: true }).sort({ createdAt: -1 });
    console.log('Database query finished. Found roots:', roots); // 日志3：检查查询结果
    
    res.json(roots);
  } catch (err) {
    console.error('!!! Error in /api/trees:', err.message); // 日志4：检查是否有错误
    res.status(500).send('Server Error');
  }
});

// 2. 获取一棵完整的诗树（递归填充）
router.get('/tree/:id', async (req, res) => {
  try {
    // Mongoose 的 populate 可以递归填充
    const tree = await PoetryNode.findById(req.params.id).populate({
      path: 'children',
      populate: {
        path: 'children',
        populate: {
          path: 'children'
        }
      }
    });
    res.json(tree);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// 3. 创建一棵新的诗树（创建一个根节点）
router.post('/trees', async (req, res) => {
  try {
    const { text, author } = req.body;
    // 使用 HSL 颜色，只随机化色相(H)，保持饱和度(S)和亮度(L)一致，颜色更和谐
    const randomHue = Math.floor(Math.random() * 360);
    const color = `hsl(${randomHue}, 70%, 80%)`;

    const newNode = new PoetryNode({
      text,
      author,
      isRoot: true,
      color: color, // <-- 存储生成的颜色
    });
    const savedNode = await newNode.save();
    res.json(savedNode);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// 4. 在某个节点下添加一个新的子节点（诗行）
router.post('/nodes/:parentId', async (req, res) => {
  try {
    // 从请求体中解构出 isAnonymous
    const { text, author, isAnonymous } = req.body; 
    const parentNode = await PoetryNode.findById(req.params.parentId);

    if (!parentNode) {
      return res.status(404).json({ msg: 'Parent node not found' });
    }

    // 创建新节点时，传入 isAnonymous
    const newNode = new PoetryNode({ text, author, isAnonymous }); 
    const savedChild = await newNode.save();
    
    parentNode.children.push(savedChild._id);
    await parentNode.save();
    
    res.json(savedChild);
  } catch (err) {
    res.status(500).send('Server Error');
  }
});

// 5. 更新（编辑）一个节点
router.put('/nodes/:id', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ msg: 'Text is required' });
    }

    
    const updatedNode = await PoetryNode.findByIdAndUpdate(
      req.params.id,
      { $set: { text: text } },
      { new: true } // 返回更新后的文档
    );

    if (!updatedNode) {
      return res.status(404).json({ msg: 'Node not found' });
    }

    res.json(updatedNode);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// 6. 删除一个节点 (及其所有子孙)
// 这是一个递归删除函数
async function deleteNodeAndChildren(nodeId) {
  const node = await PoetryNode.findById(nodeId);
  if (!node) return;

  // 递归删除所有子节点
  if (node.children && node.children.length > 0) {
    for (const childId of node.children) {
      await deleteNodeAndChildren(childId);
    }
  }

  // 删除自己
  await PoetryNode.findByIdAndDelete(nodeId);
}

router.delete('/nodes/:id', async (req, res) => {
  try {
    const nodeIdToDelete = req.params.id;
    
    // 1. 找到要删除的节点，确保它存在
    const nodeToDelete = await PoetryNode.findById(nodeIdToDelete);
    if (!nodeToDelete) {
      return res.status(404).json({ msg: 'Node not found' });
    }

    // 2. 找到这个节点的父节点
    const parentNode = await PoetryNode.findOne({ children: nodeIdToDelete });

    // 3. 如果父节点存在，就从父节点的 children 数组中移除该节点的 ID
    if (parentNode) {
      parentNode.children.pull(nodeIdToDelete);
      await parentNode.save();
    }

    // 4. 调用递归函数，删除该节点及其所有子孙
    await deleteNodeAndChildren(nodeIdToDelete);
    
    res.json({ msg: 'Node hierarchy deleted successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// 7. 获取所有完整的诗树
router.get('/trees/full', async (req, res) => {
  try {
    const roots = await PoetryNode.find({ isRoot: true }).sort({ createdAt: -1 });
    
    // 递归填充函数
    const populateChildren = async (node) => {
      if (!node || !node.children || node.children.length === 0) {
        return node;
      }
      const populatedNode = await node.populate('children');
      populatedNode.children = await Promise.all(
        populatedNode.children.map(child => populateChildren(child))
      );
      return populatedNode;
    };

    const fullTrees = await Promise.all(roots.map(root => populateChildren(root)));
    
    res.json(fullTrees);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// GET /api/trees/:rootId/random-path - 获取一棵树的一条随机路径
router.get('/trees/:rootId/random-path', async (req, res) => {
  try {
    const { rootId } = req.params;
    const allNodes = new Map();
    const leafNodes = [];

    // 递归函数，用于遍历整棵树
    async function traverse(nodeId) {
      const node = await PoetryNode.findById(nodeId).lean(); // .lean() 提高性能
      if (!node) return;

      allNodes.set(node._id.toString(), node);

      if (!node.children || node.children.length === 0) {
        leafNodes.push(node); // 这是一个叶子节点
        return;
      }

      for (const childId of node.children) {
        await traverse(childId);
      }
    }

    await traverse(rootId);

    if (leafNodes.length === 0) {
      const rootNode = allNodes.get(rootId);
      return res.json(rootNode ? [rootNode] : []);
    }

    // 随机选择一个叶子节点
    const randomLeaf = leafNodes[Math.floor(Math.random() * leafNodes.length)];

    // 从叶子节点向上回溯，构建路径
    const path = [];
    let currentNodeId = randomLeaf._id.toString();
    while (currentNodeId) {
      const node = allNodes.get(currentNodeId);
      path.unshift(node); // 加到数组开头，以保持从根到叶的顺序

      // 找到当前节点的父节点
      let parentId = null;
      for (const [pId, pNode] of allNodes.entries()) {
        if (pNode.children.some(childId => childId.toString() === currentNodeId)) {
          parentId = pId;
          break;
        }
      }
      currentNodeId = parentId;
    }
    
    res.json(path);

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;