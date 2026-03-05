import React, { useState, memo, useMemo } from 'react';
import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react';
import { useStore } from '../store';
import { adjustAlpha } from '../utils/color';

/**
 * Custom editable edge component for the mind map.
 * Supports double-click to edit labels and dynamic coloring based on source node.
 */
export const EditableEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  label,
  source,
  selected,
}: EdgeProps) => {
  const sourceNode = useStore((state) => state.nodes.find(n => n.id === source));
  const depthColors = useStore((state) => state.depthColors);
  const updateEdgeLabel = useStore((state) => state.updateEdgeLabel);
  
  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [draftText, setDraftText] = useState((label as string) || '');

  // Determine edge color based on source node or hierarchy depth
  const sourceColor = useMemo(() => {
    if (sourceNode?.data.color) return sourceNode.data.color;
    const depth = sourceNode?.data.depth ?? 0;
    return depthColors[depth] || 'rgba(124, 58, 237, 0.4)';
  }, [sourceNode, depthColors]);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isActive = isHovered || isEditing || selected;

  const onDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraftText((label as string) || '');
    setIsEditing(true);
  };

  const onBlur = () => {
    setIsEditing(false);
    updateEdgeLabel(id, draftText);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      setIsEditing(false);
      updateEdgeLabel(id, draftText);
    }
  };

  const displayText = isEditing ? draftText : (label as string) || '';
  const showLabel = displayText || isEditing;

  return (
    <>
      <BaseEdge 
        path={edgePath} 
        markerEnd={markerEnd} 
        interactionWidth={30}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ 
          ...style, 
          stroke: isActive ? adjustAlpha(sourceColor, 0.9) : adjustAlpha(sourceColor, 0.4), 
          strokeWidth: isActive ? 2.5 : 1.5,
          filter: isActive 
            ? `drop-shadow(0 0 8px ${adjustAlpha(sourceColor, 0.4)})` 
            : undefined,
          borderColor: sourceColor,
          cursor: 'pointer',
        }} 
      />
      
      {showLabel && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
              zIndex: isEditing ? 100 : 20,
            }}
          >
            <div
              className={`glass-panel ${isEditing ? 'active' : ''}`}
              onDoubleClick={onDoubleClick}
              style={{
                padding: '4px 12px',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                borderRadius: '20px',
                border: isEditing ? '1.5px solid var(--color-accent-bright)' : '1px solid var(--color-border-subtle)',
                boxShadow: isActive ? '0 4px 15px rgba(0,0,0,0.2)' : '0 2px 8px rgba(0,0,0,0.1)',
                cursor: 'text',
                lineHeight: 1,
                whiteSpace: 'nowrap',
              }}
            >
              {isEditing ? (
                <input
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                  onBlur={onBlur}
                  onKeyDown={onKeyDown}
                  autoFocus
                  className="nodrag nopan"
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--color-text-primary)',
                    fontFamily: 'var(--font-body)',
                    outline: 'none',
                    width: `${Math.max(draftText.length * 8, 40)}px`,
                    textAlign: 'center',
                    padding: 0,
                  }}
                />
              ) : (
                <span>{displayText}</span>
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

EditableEdge.displayName = 'EditableEdge';
