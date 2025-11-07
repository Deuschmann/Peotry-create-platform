import React, { useRef } from 'react';
import { hierarchy, tree } from 'd3-hierarchy';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 120;

const NodeDisplay = ({ nodeData, onNodeClick, onNodeDoubleClick, isHighlighted, color, isClipped, isClippingMode }) => {
  const clickTimeout = useRef(null);

  const handleClick = (e) => {
    e.stopPropagation();
    if (isClippingMode) {
      onNodeClick(nodeData);
      return;
    }
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
      onNodeDoubleClick(nodeData);
    } else {
      clickTimeout.current = setTimeout(() => {
        clickTimeout.current = null;
      }, 250);
    }
  };
  
  const handleRightClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onNodeClick(nodeData);
  };
  
  const nodeStyle = {
    color: color || '#e2e8f0',
    textShadow: `0 0 7px ${color || 'rgba(144, 205, 244, 0.7)'}`,
  };
  
  const displayClass = `node-display ${!isHighlighted ? 'dimmed' : ''} ${isClipped ? 'clipped' : ''}`;

  return (
    <div
      className={displayClass}
      style={nodeStyle}
      onContextMenu={handleRightClick}
      onClick={handleClick}
    >
      {nodeData.text}
      {isClipped && <div className="clip-checkmark">✓</div>}
    </div>
  );
};

const TreeLayout = ({ data, color, onNodeClick, onNodeDoubleClick, highlightedIds, isClippingMode, clippedIds }) => {
  if (!data) return null;

  const root = hierarchy(data, d => d.children);
  const treeLayout = tree().nodeSize([NODE_WIDTH, NODE_HEIGHT]);
  const treeData = treeLayout(root);
  const nodes = treeData.descendants();
  const links = treeData.links();

  const isHighlightActive = highlightedIds.size > 0;

  let minX = 0, maxX = 0, minY = 0, maxY = 0;
  nodes.forEach(node => { minX = Math.min(minX, node.x); maxX = Math.max(maxX, node.x); minY = Math.min(minY, node.y); maxY = Math.max(maxY, node.y); });
  const layoutWidth = maxX - minX + NODE_WIDTH;
  const layoutHeight = maxY - minY + NODE_HEIGHT;
  const offsetX = -minX + (NODE_WIDTH / 2);
  const offsetY = NODE_HEIGHT / 2;
  
  return (
    <div style={{ position: 'relative', width: `${layoutWidth}px`, height: `${layoutHeight}px` }}>
       <svg width={layoutWidth} height={layoutHeight} style={{ position: 'absolute', top: 0, left: 0, zIndex: 0 }}>
        <g transform={`translate(${offsetX}, ${offsetY})`}>
          {links.map((link, i) => {
            const isLinkHighlighted = isHighlightActive && highlightedIds.has(link.source.data._id) && highlightedIds.has(link.target.data._id);
            return (
              <path
                key={i}
                className={`link ${isHighlightActive && !isLinkHighlighted ? 'dimmed' : ''}`}
                d={`M${link.source.x},${link.source.y} C${link.source.x},${(link.source.y + link.target.y) / 2} ${link.target.x},${(link.source.y + link.target.y) / 2} ${link.target.x},${link.target.y}`}
                fill="none"
                stroke={color || "#4a5568"}
                strokeWidth="1.5"
              />
            );
          })}
        </g>
      </svg>
      <div style={{ position: 'relative', zIndex: 1 }}>
        {nodes.map((node) => {
          const isHighlighted = !isHighlightActive || highlightedIds.has(node.data._id);
          const isClipped = clippedIds.has(node.data._id);
          return (
            <div
              key={node.data._id}
              style={{ position: 'absolute', transform: 'translate(-50%, -50%)', left: `${node.x + offsetX}px`, top: `${node.y + offsetY}px` }}
              onClick={(e) => e.stopPropagation()}
              onContextMenu={(e) => e.stopPropagation()}
              onDoubleClick={(e) => e.stopPropagation()}
            >
              <NodeDisplay 
                nodeData={node.data} 
                onNodeClick={onNodeClick}
                onNodeDoubleClick={(nodeData) => onNodeDoubleClick(nodeData, root)}
                isHighlighted={isHighlighted}
                color={color}
                isClipped={isClipped}
                isClippingMode={isClippingMode}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TreeLayout;