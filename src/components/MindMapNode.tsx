import { useState, useEffect, memo, useMemo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Plus, Minus, CheckSquare, Square, Lightbulb, CheckCircle2, AlertTriangle, Clock, CircleDot } from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

import { useStore } from '../store';
import { type AppNode } from '../store/types';
import { adjustAlpha } from '../utils/color';

/**
 * Custom MindMap Node component for React Flow
 */
export const MindMapNode = memo(({ id, data, selected }: NodeProps<AppNode>) => {
  const [isEditing, setIsEditing] = useState(false);
  
  // Store actions and state
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
  
  // Task progress calculation
  const { childTasks, progress, isFullyCompleted } = useMemo(() => {
    const children = nodes.filter(n => edges.some(e => e.source === id && e.target === n.id));
    const tasks = children.filter(n => n.data.isTask);
    const completed = tasks.filter(n => n.data.isCompleted);
    return {
      childTasks: tasks,
      progress: tasks.length > 0 ? (completed.length / tasks.length) * 100 : 0,
      isFullyCompleted: tasks.length > 0 && completed.length === tasks.length
    };
  }, [id, nodes, edges]);
  
  const depth = data.depth ?? 0;
  
  // Color determination logic
  const nodeColor = useMemo(() => {
    if (data.mood || data.isManualColor) {
      return data.color || depthColors[depth] || depthColors[0];
    }
    if (colorMode === 'branch') {
      return data.color || depthColors[depth] || depthColors[0];
    }
    return depthColors[depth] || depthColors[0];
  }, [data.mood, data.isManualColor, data.color, depth, depthColors, colorMode]);
  
  const isRoot = id === 'root';
  const outgoingEdges = edges.filter(e => e.source === id);
  const hasChildren = outgoingEdges.length > 0;

  // Handle position logic based on layout
  const { targetPos, sourcePos, isVertical, isReverse } = useMemo(() => {
    let tp = Position.Left;
    let sp = Position.Right;
    let vert = false;
    let rev = false;

    if (layoutDirection === 'TB') {
      tp = Position.Top; sp = Position.Bottom; vert = true;
    } else if (layoutDirection === 'BT') {
      tp = Position.Bottom; sp = Position.Top; vert = true; rev = true;
    } else if (layoutDirection === 'RL') {
      tp = Position.Right; sp = Position.Left; rev = true;
    } else if (layoutDirection === 'radial' && !isRoot) {
      const node = nodes.find(n => n.id === id);
      if (node && node.position.x < 0) {
        tp = Position.Right; sp = Position.Left; rev = true;
      }
    }
    return { targetPos: tp, sourcePos: sp, isVertical: vert, isReverse: rev };
  }, [layoutDirection, id, isRoot, nodes]);

  // Editor initialization
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

  // Sync editor content with data updates
  useEffect(() => {
    if (editor && data.label !== editor.getHTML()) {
      editor.commands.setContent(data.label);
    }
  }, [data.label, editor]);

  // Focus effect for editing mode
  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
      if (isEditing) editor.commands.focus('end');
    }
  }, [isEditing, editor]);

  // Remote trigger for editing (e.g., via keyboard shortcut)
  useEffect(() => {
    if (editingNodeId === id) {
      const timer = setTimeout(() => setIsEditing(true), 0);
      return () => clearTimeout(timer);
    }
  }, [editingNodeId, id]);

  // Auto-edit newly created nodes
  useEffect(() => {
    if (selected && data.label === 'New Topic') {
      const timer = setTimeout(() => setIsEditing(true), 0);
      return () => clearTimeout(timer);
    }
  }, [selected, data.label]);

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

  const shapeStyles = useMemo(() => {
    switch (data.shape) {
      case 'diamond': return { clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)', borderRadius: 0, minWidth: '100px', minHeight: '80px' };
      case 'hexagon': return { clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)', borderRadius: 0, minWidth: '120px' };
      case 'capsule': return { borderRadius: '100px', padding: '12px 24px' };
      case 'pill': return { borderRadius: '24px', padding: '8px 20px' };
      default: return { borderRadius: isRoot ? '16px' : '12px', padding: '8px 20px' };
    }
  }, [data.shape, isRoot]);

  const collapseButtonStyle = isVertical 
    ? { bottom: isReverse ? 'auto' : '-10px', top: isReverse ? '-10px' : 'auto', left: '50%', transform: 'translateX(-50%)' }
    : { right: isReverse ? 'auto' : '-10px', left: isReverse ? '-10px' : 'auto', top: '50%', transform: 'translateY(-50%)' };

  return (
    <div
      className={`mind-map-node animate-node-in ${isRoot ? 'node-root' : 'node-default'} ${selected ? 'node-selected' : ''}`}
      onDoubleClick={() => setIsEditing(true)}
      style={{
        textAlign: 'center',
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: selected ? 'var(--color-accent-soft)' : (isRoot ? 'var(--color-accent-soft)' : 'var(--color-bg-surface)'),
        boxShadow: selected
          ? `0 0 calc(var(--glow-spread) * 1.5) ${adjustAlpha(nodeColor, theme === 'light' ? 0.15 : 0.4)}, 0 0 0 2px ${nodeColor}`
          : `var(--shadow-node), 0 0 calc(var(--glow-spread) / 2) ${adjustAlpha(nodeColor, theme === 'light' ? 0.05 : 0.2)}`,
        borderColor: nodeColor,
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
          opacity: isRoot ? 0 : 1,
          pointerEvents: isRoot ? 'none' : 'auto',
          top: isVertical ? (targetPos === Position.Top ? '0px' : 'auto') : '50%',
          bottom: isVertical ? (targetPos === Position.Bottom ? '0px' : 'auto') : 'auto',
          left: isVertical ? '50%' : (targetPos === Position.Left ? '0px' : 'auto'),
          right: isVertical ? 'auto' : (targetPos === Position.Right ? '0px' : 'auto'),
          transform: isVertical ? 'translateX(-50%)' : 'translateY(-50%)',
          background: nodeColor,
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
            <div style={{ display: 'flex', color: nodeColor, opacity: 0.8 }}>
              {getMoodIcon()}
            </div>
          )}
          <EditorContent 
            editor={editor} 
            className="tiptap-editor"
            onKeyDown={(e) => {
              if (isEditing && e.key === 'Escape') {
                setIsEditing(false);
                editor?.commands.blur();
              }
            }}
          />
        </div>
        
        {/* Progress Bar for Task Nodes */}
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

      {/* Collapse/Expand Toggle */}
      {hasChildren && (
        <button
          className="nodrag"
          onClick={(e: React.MouseEvent) => { e.stopPropagation(); toggleCollapse(id); }}
          style={{
            position: 'absolute',
            ...collapseButtonStyle,
            background: 'var(--color-bg-base)',
            border: `1.5px solid ${nodeColor}`,
            borderRadius: '50%',
            width: '20px',
            height: '20px',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
            color: nodeColor,
            zIndex: 10,
            boxShadow: 'var(--shadow-node)',
            transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            opacity: 0.9,
            display: 'flex',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = nodeColor;
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.transform = `${collapseButtonStyle.transform} scale(1.2)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'var(--color-bg-base)';
            e.currentTarget.style.color = nodeColor;
            e.currentTarget.style.transform = collapseButtonStyle.transform;
          }}
        >
          {data.collapsed ? <Plus size={12} strokeWidth={3} /> : <Minus size={12} strokeWidth={3} />}
        </button>
      )}

      {/* Connection Handles */}
      {isRoot && layoutDirection === 'radial' ? (
        <>
          <Handle type="source" position={Position.Left} id="left" style={{ left: '-4px', top: '50%', transform: 'translateY(-50%)' }} />
          <Handle type="source" position={Position.Right} id="right" style={{ right: '-4px', top: '50%', transform: 'translateY(-50%)' }} />
        </>
      ) : (
        <Handle 
          type="source" 
          position={sourcePos} 
          style={{ 
            opacity: 0,
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
