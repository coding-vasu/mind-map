import { useState, useEffect, memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useStore, type AppNode } from '../store';
import { Plus, Minus, CheckSquare, Square, Lightbulb, CheckCircle2, AlertTriangle, Clock, CircleDot } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

const adjustAlpha = (color: string, alpha: number): string => {
  if (!color || color.startsWith('var')) return color;
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

export const MindMapNode = memo(({ id, data, selected }: NodeProps<AppNode>) => {
  const [isEditing, setIsEditing] = useState(false);
  const updateNodeLabel = useStore((state) => state.updateNodeLabel);
  const toggleCollapse = useStore((state) => state.toggleCollapse);
  const theme = useStore((state) => state.theme);
  const edges = useStore((state) => state.edges);
  const depthColors = useStore((state) => state.depthColors);
  const editingNodeId = useStore((state) => state.editingNodeId);
  const setEditingNodeId = useStore((state) => state.setEditingNodeId);
  const layoutDirection = useStore((state) => state.layoutDirection);
  const nodes = useStore((state) => state.nodes);
  const toggleComplete = useStore((state) => state.toggleComplete);
  const colorMode = useStore((state) => state.colorMode);
  
  const childNodes = nodes.filter(n => edges.some(e => e.source === id && e.target === n.id));
  const childTasks = childNodes.filter(n => n.data.isTask);
  const completedTasks = childTasks.filter(n => n.data.isCompleted);
  const progress = childTasks.length > 0 ? (completedTasks.length / childTasks.length) * 100 : 0;
  const isFullyCompleted = childTasks.length > 0 && completedTasks.length === childTasks.length;
  
  const depth = data.depth ?? 0;
  
  // Color system logic
  const depthColor = data.mood || data.isManualColor
    ? (data.color || depthColors[depth] || depthColors[0])
    : (colorMode === 'branch' 
        ? (data.color || depthColors[depth] || depthColors[0])
        : (depthColors[depth] || depthColors[0])
      );
  
  const incomingEdges = edges.filter(e => e.target === id);
  const outgoingEdges = edges.filter(e => e.source === id);
  const isRoot = id === 'root';
  const isLeaf = outgoingEdges.length === 0 && !isRoot;
  const isFloating = incomingEdges.length === 0 && !isRoot;
  const isBranch = !isRoot && !isLeaf && !isFloating;
  const hasChildren = outgoingEdges.length > 0;

  const nodeTypeClass = isRoot ? 'node-root' : 
                       isBranch ? 'node-branch' : 
                       isLeaf ? 'node-leaf' : 
                       isFloating ? 'node-floating' : 'node-default';

  // Determine positions based on layout direction
  let targetPos = Position.Left;
  let sourcePos = Position.Right;
  let isVertical = false;
  let isReverse = false;

  if (layoutDirection === 'TB') {
    targetPos = Position.Top;
    sourcePos = Position.Bottom;
    isVertical = true;
  } else if (layoutDirection === 'BT') {
    targetPos = Position.Bottom;
    sourcePos = Position.Top;
    isVertical = true;
    isReverse = true;
  } else if (layoutDirection === 'RL') {
    targetPos = Position.Right;
    sourcePos = Position.Left;
    isReverse = true;
  } else if (layoutDirection === 'radial' && !isRoot) {
    const node = nodes.find(n => n.id === id);
    if (node && node.position.x < 0) {
      targetPos = Position.Right;
      sourcePos = Position.Left;
      isReverse = true;
    }
  }

  const buttonStyle = isVertical 
    ? {
        bottom: isReverse ? 'auto' : '-10px',
        top: isReverse ? '-10px' : 'auto',
        left: '50%',
        transform: 'translateX(-50%)',
      }
    : {
        right: isReverse ? 'auto' : '-10px',
        left: isReverse ? '-10px' : 'auto',
        top: '50%',
        transform: 'translateY(-50%)',
      };

  const editor = useEditor({
    extensions: [StarterKit],
    content: data.label,
    editable: isEditing,
    onBlur: ({ editor: e }) => {
      setIsEditing(false);
      if (editingNodeId === id) setEditingNodeId(null);
      updateNodeLabel(id, e.getHTML());
    },
  });

  useEffect(() => {
    if (editor && data.label !== editor.getHTML()) {
      editor.commands.setContent(data.label);
    }
  }, [data.label, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
      if (isEditing) {
        editor.commands.focus('end');
      }
    }
  }, [isEditing, editor]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (editingNodeId === id) {
        setIsEditing(true);
      } else {
        setIsEditing(false);
      }
    }, 10);
    return () => clearTimeout(timer);
  }, [editingNodeId, id]);

  // Auto-edit newly created nodes
  useEffect(() => {
    if (selected && data.label === 'New Topic') {
      const timer = setTimeout(() => setIsEditing(true), 10);
      return () => clearTimeout(timer);
    }
  }, [selected, data.label]);

  const onDoubleClick = () => {
    setIsEditing(true);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (isEditing && e.key === 'Escape') {
      setIsEditing(false);
      editor?.commands.blur();
    }
  };
  const getMoodIcon = () => {
    switch (data.mood) {
      case 'Idea': return <Lightbulb size={16} />;
      case 'Task': return <CheckCircle2 size={16} />;
      case 'Alert': return <AlertTriangle size={16} />;
      case 'Pending': return <Clock size={16} />;
      case 'Solved': return <CheckCircle2 size={16} />;
      case 'Neutral': return <CircleDot size={16} />;
      default: return null;
    }
  };
  const getShapeStyles = () => {
    switch (data.shape) {
      case 'diamond':
        return {
          clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          borderRadius: 0,
          minWidth: '100px',
          minHeight: '80px'
        };
      case 'hexagon':
        return {
          clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
          borderRadius: 0,
          minWidth: '120px'
        };
      case 'capsule':
        return {
          borderRadius: '100px',
          padding: '12px 24px'
        };
      case 'pill':
        return {
          borderRadius: '24px',
          padding: '8px 20px'
        };
      default:
        return {
          borderRadius: isRoot ? '16px' : '12px',
          padding: '8px 20px'
        };
    }
  };

  const shapeStyles = getShapeStyles();

  return (
    <div
      className={`mind-map-node animate-node-in ${nodeTypeClass} ${selected ? 'node-selected' : ''}`}
      onDoubleClick={onDoubleClick}
      style={{
        textAlign: 'center',
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: selected 
          ? 'var(--color-accent-soft)' 
          : (isRoot ? 'var(--color-accent-soft)' : 'var(--color-bg-surface)'),
        boxShadow: selected
          ? `0 0 calc(var(--glow-spread) * 1.5) ${adjustAlpha(depthColor, theme === 'light' ? 0.15 : 0.4)}, 0 0 0 2px ${depthColor}`
          : `var(--shadow-node), 0 0 calc(var(--glow-spread) / 2) ${adjustAlpha(depthColor, theme === 'light' ? 0.05 : 0.2)}`,
        borderColor: depthColor,
        borderWidth: isRoot || selected ? '2.5px' : '1.5px',
        ...shapeStyles,
        transform: selected ? 'scale(1.04)' : 'scale(1)',
        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
        zIndex: selected ? 50 : 1,
      }}
    >
      <Handle 
        type="target" 
        position={targetPos} 
        style={{ 
          opacity: isRoot || isFloating ? 0 : 1,
          pointerEvents: isRoot || isFloating ? 'none' : 'auto',
          top: isVertical ? (targetPos === Position.Top ? '0px' : 'auto') : '50%',
          bottom: isVertical ? (targetPos === Position.Bottom ? '0px' : 'auto') : 'auto',
          left: isVertical ? '50%' : (targetPos === Position.Left ? '0px' : 'auto'),
          right: isVertical ? 'auto' : (targetPos === Position.Right ? '0px' : 'auto'),
          transform: isVertical ? 'translateX(-50%)' : 'translateY(-50%)',
          background: depthColor,
          width: '8px',
          height: '8px',
          border: '2px solid var(--color-bg-base)',
        }} 
      />
      
      <div style={{ minWidth: '80px', cursor: isEditing ? 'text' : 'pointer' }} className={isEditing ? 'nodrag' : ''}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          {data.isTask && (
            <button 
              className="nodrag"
              onClick={(e) => { e.stopPropagation(); toggleComplete(id); }}
              style={{ padding: 0, background: 'none', border: 'none', cursor: 'pointer', color: data.isCompleted ? 'var(--color-status-done)' : 'var(--color-text-muted)', display: 'flex' }}
            >
              {data.isCompleted ? <CheckSquare size={18} /> : <Square size={18} />}
            </button>
          )}
          {data.mood && (
            <div style={{ display: 'flex', color: depthColor, opacity: 0.8 }}>
              {getMoodIcon()}
            </div>
          )}
          <EditorContent 
            editor={editor} 
            className="tiptap-editor"
            onKeyDown={onKeyDown}
          />
        </div>
        
        {childTasks.length > 0 && (
          <div style={{ width: '100%', height: '4px', background: 'var(--color-bg-base)', borderRadius: '2px', marginTop: '8px', overflow: 'hidden', position: 'relative' }}>
            <div 
              style={{ 
                width: `${progress}%`, 
                height: '100%', 
                background: isFullyCompleted ? 'var(--color-status-done)' : 'var(--color-accent-bright)',
                transition: 'width 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                boxShadow: isFullyCompleted ? '0 0 10px var(--color-status-done)' : 'none'
              }} 
            />
          </div>
        )}
      </div>

      {hasChildren && (
        <button
          className="nodrag"
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); toggleCollapse(id); }}
          style={{
            position: 'absolute',
            ...buttonStyle,
            background: 'var(--color-bg-base)',
            border: `1.5px solid ${depthColor}`,
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            color: depthColor,
            zIndex: 10,
            boxShadow: 'var(--shadow-node)',
            transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            opacity: 0.9,
            display: 'flex',
            visibility: 'visible'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = `${buttonStyle.transform} scale(1.2)`;
            e.currentTarget.style.background = depthColor;
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.boxShadow = `0 0 15px ${adjustAlpha(depthColor, 0.6)}`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = buttonStyle.transform;
            e.currentTarget.style.background = 'var(--color-bg-base)';
            e.currentTarget.style.color = depthColor;
            e.currentTarget.style.boxShadow = 'var(--shadow-node)';
          }}
        >
          {data.collapsed ? (
             <Plus size={12} strokeWidth={3} />
          ) : (
            <Minus size={12} strokeWidth={3} />
          )}
        </button>
      )}

      {isRoot && layoutDirection === 'radial' ? (
        <>
          <Handle 
            type="source" 
            position={Position.Left} 
            id="left" 
            style={{ left: '-4px', top: '50%', transform: 'translateY(-50%)', opacity: 1, visibility: 'visible' }} 
          />
          <Handle 
            type="source" 
            position={Position.Right} 
            id="right" 
            style={{ right: '-4px', top: '50%', transform: 'translateY(-50%)', opacity: 1, visibility: 'visible' }} 
          />
        </>
      ) : (
        <Handle 
          type="source" 
          position={sourcePos} 
          style={{ 
            opacity: 0,
            visibility: 'visible',
            pointerEvents: 'auto',
            top: isVertical ? (sourcePos === Position.Top ? '0px' : 'auto') : '50%',
            bottom: isVertical ? (sourcePos === Position.Bottom ? '0px' : 'auto') : 'auto',
            left: isVertical ? '50%' : (sourcePos === Position.Left ? '0px' : 'auto'),
            right: isVertical ? 'auto' : (sourcePos === Position.Right ? '0px' : 'auto'),
            transform: isVertical ? 'translateX(-50%)' : 'translateY(-50%)',
            zIndex: 20
          }} 
        />
      )}
    </div>
  );
});

MindMapNode.displayName = 'MindMapNode';
