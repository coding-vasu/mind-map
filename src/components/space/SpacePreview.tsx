import React from 'react';
import { type Space } from '../../store/types';

interface SpacePreviewProps {
  space: Space;
  width: number;
  height: number;
}

/**
 * A lightweight SVG preview of a mind map space.
 * Renders nodes as small dots and edges as lines.
 */
export const SpacePreview: React.FC<SpacePreviewProps> = ({ space, width, height }) => {
  const { nodes, edges } = space;

  if (!nodes || nodes.length === 0) return null;

  // Calculate bounding box of nodes
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  nodes.forEach(node => {
    const x = node.position.x;
    const y = node.position.y;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  });

  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;
  const maxDim = Math.max(contentWidth, contentHeight, 1);

  const isSmall = width < 50;
  
  // Calculate a proportional node size
  // In grid view (large), we want subtle dots. In list view (small), we want chunky icons.
  const nodeSize = maxDim * (isSmall ? 0.12 : 0.04) + (isSmall ? 2 : 1);
  const padding = nodeSize * 2;

  const paddedMinX = minX - padding;
  const paddedMinY = minY - padding;
  const finalWidth = contentWidth + padding * 2;
  const finalHeight = contentHeight + padding * 2;

  // Scale and center matching the viewBox
  const viewBox = `${paddedMinX} ${paddedMinY} ${finalWidth} ${finalHeight}`;

  return (
    <svg 
      width={width} 
      height={height} 
      viewBox={viewBox} 
      preserveAspectRatio="xMidYMid meet"
      style={{ 
        filter: isSmall ? 'none' : 'drop-shadow(0 0 4px rgba(0,0,0,0.3))',
        opacity: isSmall ? 1 : 0.8,
        pointerEvents: 'none' 
      }}
    >
      <defs>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Edges */}
      {edges.map(edge => {
        const sourceNode = nodes.find(n => n.id === edge.source);
        const targetNode = nodes.find(n => n.id === edge.target);
        if (!sourceNode || !targetNode) return null;

        return (
          <line
            key={edge.id}
            x1={sourceNode.position.x}
            y1={sourceNode.position.y}
            x2={targetNode.position.x}
            y2={targetNode.position.y}
            stroke="var(--color-text-muted)"
            strokeWidth={nodeSize * 0.6}
            strokeOpacity={isSmall ? 0.8 : 0.4}
            strokeLinecap="round"
          />
        );
      })}

      {/* Nodes */}
      {nodes.map(node => {
        const color = node.data.color || 'var(--color-accent-bright)';
        const size = nodeSize;
        
        // Simplified shapes for preview
        if (node.data.shape === 'diamond') {
          return (
            <path
              key={node.id}
              d={`M ${node.position.x} ${node.position.y - size} L ${node.position.x + size} ${node.position.y} L ${node.position.x} ${node.position.y + size} L ${node.position.x - size} ${node.position.y} Z`}
              fill={color}
              fillOpacity={1}
            />
          );
        }
        
        if (node.data.shape === 'rect' || node.data.shape === 'hexagon') {
          return (
            <rect
              key={node.id}
              x={node.position.x - size}
              y={node.position.y - size / 2}
              width={size * 2}
              height={size}
              rx={size / 4}
              fill={color}
              fillOpacity={1}
            />
          );
        }

        return (
          <circle
            key={node.id}
            cx={node.position.x}
            cy={node.position.y}
            r={size}
            fill={color}
            fillOpacity={1}
            style={{ filter: isSmall ? 'none' : 'url(#glow)' }}
          />
        );
      })}
    </svg>
  );
};
