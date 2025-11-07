import React from 'react';
import './ReaderModal.css';

const ReaderModal = ({ show, path, isLoading, onClose, onRefresh, source }) => {
  if (!show) {
    return null;
  }

  const handleCopy = () => {
    if (path.length === 0) return;
    const textToCopy = path.map(node => node.text).join('\n');
    navigator.clipboard.writeText(textToCopy)
      .then(() => alert('诗歌已复制到剪贴板！'))
      .catch(err => {
        console.error('Copy failed', err);
        alert('复制失败，请检查浏览器权限。');
      });
  };

  const title = source === 'clip' ? '我的剪辑' : '随机漫步';

  return (
    <div className="reader-modal-overlay" onClick={onClose}>
      <div className="reader-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="reader-modal-close-btn" onClick={onClose}>×</button>
        
        <h3 className="reader-modal-title">{title}</h3>
        
        <div className="reader-modal-body">
          {isLoading ? (
            <p className="loading-text">正在生成诗篇...</p>
          ) : (
            path.map(node => (
              <div key={node._id} className="reader-poem-line">
                <p>{node.text}</p>
              </div>
            ))
          )}
        </div>
        
        <div className="reader-modal-actions">
          {source === 'random' && <button onClick={onRefresh} disabled={isLoading}>再来一条</button>}
          <button onClick={handleCopy} disabled={isLoading || path.length === 0}>复制</button>
        </div>
      </div>
    </div>
  );
};

export default ReaderModal;