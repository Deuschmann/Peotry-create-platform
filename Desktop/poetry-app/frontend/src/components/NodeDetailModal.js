import React from 'react';
import './NodeDetailModal.css';

const NodeDetailModal = ({ show, node, isOwner, onClose, onAdd, onEdit, onDelete, onExplore, onEnterClippingMode }) => {
  if (!show || !node) {
    return null;
  }

  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={handleModalClick}>
        <button className="modal-close-btn" onClick={onClose}>×</button>
        
        <div className="modal-poem-line">
          <p>"{node.text}"</p>
        </div>
        
        <div className="modal-author-info">
          {node.isAnonymous ? "—— 匿名" : `—— ${node.author}`}
        </div>
        
        <div className="modal-actions">
          <button onClick={onExplore}>路径探索</button>
          <button onClick={onEnterClippingMode}>进入剪辑</button>
          <button onClick={() => onAdd(node._id)}>续写分支</button>
          {isOwner && <button onClick={() => onEdit(node)}>编辑此句</button>}
          {isOwner && <button onClick={() => onDelete(node._id)} className="delete">删除此句</button>}
        </div>
      </div>
    </div>
  );
};

export default NodeDetailModal;