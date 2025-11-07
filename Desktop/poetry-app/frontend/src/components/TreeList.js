import React, { useState, useEffect } from 'react';
import axios from 'axios';
import TreeLayout from './TreeLayout';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import NodeDetailModal from './NodeDetailModal';
import ReaderModal from './ReaderModal';
import './NodeDetailModal.css';
import './ReaderModal.css';

const TreeList = ({ nickname }) => {
  const [trees, setTrees] = useState([]);
  const [newTreeText, setNewTreeText] = useState('');
  const [modalState, setModalState] = useState({ show: false, node: null });
  const [highlightedIds, setHighlightedIds] = useState(new Set());
  const [readerState, setReaderState] = useState({ show: false, path: [], isLoading: false, rootId: null, source: '' });
  const [isClippingMode, setIsClippingMode] = useState(false);
  const [clippedPath, setClippedPath] = useState([]);

  const fetchFullTrees = async () => { try { const res = await axios.get('http://localhost:5001/api/trees/full'); setTrees(res.data); } catch (error) { console.error("Failed to fetch trees:", error); } };
  useEffect(() => { fetchFullTrees(); }, []);

  const handleCreateTree = async (e) => { e.preventDefault(); if (!newTreeText.trim() || !nickname) return; try { await axios.post('http://localhost:5001/api/trees', { text: newTreeText.trim(), author: nickname }); setNewTreeText(''); fetchFullTrees(); } catch (error) { console.error("Failed to create tree:", error); } };
  
  const closeModal = () => setModalState({ show: false, node: null });

  const handleAddNode = async (parentId) => { closeModal(); const text = prompt("请输入你的诗句：", "新的诗句"); if (text && text.trim()) { const isAnonymous = !window.confirm(`是否以 '${nickname}' 署名发布？`); try { await axios.post(`http://localhost:5001/api/nodes/${parentId}`, { text: text.trim(), author: nickname, isAnonymous }); fetchFullTrees(); } catch (error) { console.error("Failed to add node:", error); } } };
  const handleEditNode = async (node) => { closeModal(); if (!node) return; const newText = prompt("请修改你的诗句：", node.text); if (newText !== null && newText.trim() !== "") { try { await axios.put(`http://localhost:5001/api/nodes/${node._id}`, { text: newText.trim() }); fetchFullTrees(); } catch (error) { console.error("Failed to edit node:", error); } } };
  const handleDeleteNode = async (nodeId) => { closeModal(); if (!nodeId) return; if (window.confirm('确定要删除此句及其所有后续分支吗？')) { try { await axios.delete(`http://localhost:5001/api/nodes/${nodeId}`); fetchFullTrees(); } catch (error) { console.error("Failed to delete node:", error); } } };
  
  const handleOpenReader = () => { const rootId = modalState.node?.rootId; if (!rootId) return; setReaderState({ show: true, path: [], isLoading: true, rootId, source: 'random' }); fetchRandomPath(rootId); closeModal(); };
  const fetchRandomPath = async (rootId) => { if (!rootId) return; setReaderState(prev => ({ ...prev, isLoading: true })); try { const res = await axios.get(`http://localhost:5001/api/trees/${rootId}/random-path`); setReaderState(prev => ({ ...prev, path: res.data, isLoading: false })); } catch (error) { console.error("Failed to fetch random path", error); setReaderState(prev => ({ ...prev, isLoading: false })); } };
  const closeReader = () => setReaderState({ show: false, path: [], isLoading: false, rootId: null, source: '' });

  const handleEnterClippingMode = () => {
    closeModal();
    setIsClippingMode(true);
    setClippedPath([]);
    alert("已进入剪辑模式！单击诗句以选择/取消选择。");
  };

  const handleFinishClipping = () => {
    if (clippedPath.length === 0) { setIsClippingMode(false); return; }
    setReaderState({ show: true, path: clippedPath, isLoading: false, rootId: null, source: 'clip' });
    setIsClippingMode(false);
    setClippedPath([]);
  };
  
  const handleNodeClick = (nodeData, rootId) => {
    if (isClippingMode) {
      setClippedPath(currentPath => {
        const existingIndex = currentPath.findIndex(node => node._id === nodeData._id);
        if (existingIndex > -1) { return currentPath.filter(node => node._id !== nodeData._id); } 
        else { return [...currentPath, nodeData]; }
      });
      return;
    }
    if (highlightedIds.size > 0 && !highlightedIds.has(nodeData._id)) { return; }
    setModalState({ show: true, node: { ...nodeData, rootId } });
  };
  
  const handleNodeDoubleClick = (nodeData, rootOfTree) => {
    if (highlightedIds.has(nodeData._id) || highlightedIds.size > 0) {
      setHighlightedIds(new Set());
      return;
    }
    if (!rootOfTree) { return; }
    const nodeMap = new Map();
    const buildMap = (n) => { if (!n || !n.data) return; nodeMap.set(n.data._id, n); if (n.children) n.children.forEach(buildMap); };
    buildMap(rootOfTree);
    const idsToHighlight = new Set();
    let currentNode = nodeMap.get(nodeData._id);
    while (currentNode) { idsToHighlight.add(currentNode.data._id); currentNode = currentNode.parent; }
    const findChildren = (n) => { if (!n) return; idsToHighlight.add(n.data._id); if(n.children) n.children.forEach(findChildren); };
    findChildren(nodeMap.get(nodeData._id));
    setHighlightedIds(idsToHighlight);
  };
  
  return (
    <div>
      <div className="container">
        <h2>群体创作广场</h2>
        <form onSubmit={handleCreateTree}>
          <input type="text" value={newTreeText} onChange={(e) => setNewTreeText(e.target.value)} placeholder="发起一首新诗..." />
          <button type="submit">发起</button>
        </form>
      </div>
      <hr />
      
      {isClippingMode && (
        <div className="clipping-toolbar">
          <span>剪辑模式：已选择 {clippedPath.length} 句</span>
          <div>
            <button onClick={() => setClippedPath([])}>清空</button>
            <button onClick={handleFinishClipping} className="publish-btn">完成并阅读</button>
          </div>
        </div>
      )}
      
      <div className="panzoom-viewport" onClick={() => { if (highlightedIds.size > 0) setHighlightedIds(new Set()); }}>
        <TransformWrapper key={trees.length} initialScale={1} minScale={0.2} maxScale={2} limitToBounds={false} panning={{ velocityDisabled: true }} wheel={{ step: 0.2 }}>
          <TransformComponent wrapperStyle={{ width: '100%', height: '100%' }} contentStyle={{ width: 'fit-content' }}>
            <div className="poetry-forest">
              {trees.map(tree => (
                <div key={tree._id} className="poetry-tree-container">
                  <TreeLayout 
                    data={tree}
                    color={tree.color}
                    onNodeClick={(nodeData) => handleNodeClick(nodeData, tree._id)}
                    onNodeDoubleClick={handleNodeDoubleClick}
                    highlightedIds={highlightedIds}
                    isClippingMode={isClippingMode}
                    clippedIds={new Set(clippedPath.map(n => n._id))}
                  />
                </div>
              ))}
            </div>
          </TransformComponent>
        </TransformWrapper>
      </div>
      
      <NodeDetailModal show={modalState.show} node={modalState.node} isOwner={modalState.node?.author === nickname} onClose={closeModal} onAdd={handleAddNode} onEdit={handleEditNode} onDelete={handleDeleteNode} onExplore={handleOpenReader} onEnterClippingMode={handleEnterClippingMode} />
      <ReaderModal show={readerState.show} path={readerState.path} isLoading={readerState.isLoading} onClose={closeReader} onRefresh={() => fetchRandomPath(readerState.rootId)} source={readerState.source} />
    </div>
  );
};

export default TreeList;