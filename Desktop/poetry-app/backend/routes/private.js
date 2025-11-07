const express = require('express');
const router = express.Router();
const PrivatePoem = require('../models/PrivatePoem');
const PoetryNode = require('../models/PoetryNode');

// --- START: 添加路由内部追踪器 ---
// 这个中间件会在任何请求进入此文件时首先执行
router.use((req, res, next) => {
  console.log(`[PRIVATE ROUTE LOG] Request reached private.js file with URL: ${req.originalUrl}`);
  next(); // 将请求传递给下面的具体路由
});
// --- END: 添加路由内部追踪器 ---


// GET /api/private/poems - 获取某个用户的所有个人作品
router.get('/poems', async (req, res) => {
  // 在目标函数内部再加一个，确认是否精确匹配
  console.log('[PRIVATE ROUTE LOG] Matched the GET /poems route handler.'); 
  
  try {
    const { author } = req.query;
    console.log(`[PRIVATE ROUTE LOG] Searching for poems by author: ${author}`);

    if (!author) {
      console.log('[PRIVATE ROUTE LOG] Author query parameter is missing.');
      return res.status(400).json({ msg: 'Author nickname is required' });
    }
    const poems = await PrivatePoem.find({ authorNickname: author }).sort({ updatedAt: -1 });
    console.log(`[PRIVATE ROUTE LOG] Found ${poems.length} poems.`);
    res.json(poems);
  } catch (err) {
    console.error('[PRIVATE ROUTE ERROR] Error in GET /poems:', err.message);
    res.status(500).send('Server Error');
  }
});

// POST /api/private/poems - 创建一首新的个人作品
router.post('/poems', async (req, res) => {
  console.log('[PRIVATE ROUTE LOG] Matched the POST /poems route handler.');
  try {
    const { title, content, authorNickname } = req.body;
    const newPoem = new PrivatePoem({ title, content, authorNickname });
    const savedPoem = await newPoem.save();
    res.json(savedPoem);
  } catch (err) {
    console.error('[PRIVATE ROUTE ERROR] Error in POST /poems:', err.message);
    res.status(500).send('Server Error');
  }
});

// PUT /api/private/poems/:id - 更新一首个人作品
router.put('/poems/:id', async (req, res) => {
  console.log(`[PRIVATE ROUTE LOG] Matched the PUT /poems/${req.params.id} route handler.`);
  try {
    const { title, content } = req.body;
    const updatedPoem = await PrivatePoem.findByIdAndUpdate(
      req.params.id,
      { $set: { title, content, updatedAt: Date.now() } },
      { new: true }
    );
    res.json(updatedPoem);
  } catch (err) {
    console.error(`[PRIVATE ROUTE ERROR] Error in PUT /poems/${req.params.id}:`, err.message);
    res.status(500).send('Server Error');
  }
});

// DELETE /api/private/poems/:id - 删除一首个人作品
router.delete('/poems/:id', async (req, res) => {
  console.log(`[PRIVATE ROUTE LOG] Matched the DELETE /poems/${req.params.id} route handler.`);
  try {
    await PrivatePoem.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Poem deleted' });
  } catch (err) {
    console.error(`[PRIVATE ROUTE ERROR] Error in DELETE /poems/${req.params.id}:`, err.message);
    res.status(500).send('Server Error');
  }
});

// POST /api/private/publish - 发布功能
router.post('/publish', async (req, res) => {
  console.log('[PRIVATE ROUTE LOG] Matched the POST /publish route handler.');
  try {
    const { content, authorNickname } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ msg: 'Content cannot be empty' });
    }

    const lines = content.trim().split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) {
      return res.status(400).json({ msg: 'No valid lines to publish' });
    }

    const randomHue = Math.floor(Math.random() * 360);
    const color = `hsl(${randomHue}, 80%, 75%)`;

    const rootNode = new PoetryNode({
      text: lines[0],
      author: authorNickname,
      isRoot: true,
      color: color,
    });
    let parentNode = await rootNode.save();

    for (let i = 1; i < lines.length; i++) {
      const childNode = new PoetryNode({
        text: lines[i],
        author: authorNickname,
      });
      const savedChild = await childNode.save();
      
      parentNode.children.push(savedChild._id);
      await parentNode.save();
      
      parentNode = savedChild;
    }

    res.status(201).json({ msg: 'Successfully published to the public square!', rootId: rootNode._id });

  } catch (err) {
    console.error('[PRIVATE ROUTE ERROR] Error in POST /publish:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;