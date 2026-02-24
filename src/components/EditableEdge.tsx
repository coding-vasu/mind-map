import { BaseEdge, EdgeLabelRenderer, getBezierPath, type EdgeProps } from '@xyflow/react';
import { useState, memo } from 'react';
import { useStore } from '../store';

const adjustAlpha = (color: string, alpha: number): string => {
  if (!color) return 'rgba(168, 85, 247, 0.35)';
  if (color.startsWith('var')) return color;
  if (color.startsWith('rgba')) {
    return color.replace(/[\d.]+\)$/g, `${alpha})`);
  }
  if (color.startsWith('#')) {
    const hex = color.length === 4 
      ? '#' + color[1] + color[1] + color[2] + color[2] + color[3] + color[3]
      : color;
    return `${hex}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`;
  }
  return color;
};

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
  
  const sourceColor = sourceNode?.data.color || 
                      (sourceNode?.data.depth !== undefined ? depthColors[sourceNode.data.depth] : 'rgba(168, 85, 247, 0.35)');
                      
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const [isHovered, setIsHovered] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const isActive = isHovered || isEditing || selected;
  const [draftText, setDraftText] = useState((label as string) || '');
  const updateEdgeLabel = useStore((state) => state.updateEdgeLabel);

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
            ? `drop-shadow(0 0 calc(var(--glow-spread) / 4) color-mix(in srgb, ${sourceColor}, transparent calc(100% - var(--glow-opacity) * 100%)))` 
            : undefined,
          cursor: 'pointer'
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
              className="glass-panel"
              style={{
                padding: '4px 10px',
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--color-text-primary)',
                background: 'var(--color-bg-overlay)',
                backdropFilter: 'blur(8px)',
                borderRadius: '20px',
                border: isEditing ? '1.5px solid var(--color-accent-bright)' : '1px solid var(--color-border-subtle)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                cursor: 'text',
                lineHeight: 1,
                whiteSpace: 'nowrap',
                animation: 'nodeIn 0.2s ease-out'
              }}
              onDoubleClick={onDoubleClick}
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
                <span style={{ fontFamily: 'var(--font-body)' }}>{displayText}</span>
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

EditableEdge.displayName = 'EditableEdge';
