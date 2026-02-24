import { useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  Panel,
  SelectionMode,
  MiniMap,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useStore, type AppNode } from '../store';
import { useReactFlow } from '@xyflow/react';
import { MindMapNode } from './MindMapNode';
import { EditableEdge } from './EditableEdge';
import { Toolbar } from './Toolbar';
import { useHotkeys } from 'react-hotkeys-hook';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { Plus, Layout, Trash2, GitBranchPlus, CheckSquare } from 'lucide-react';
import { BrainstormingModal } from './BrainstormingModal';
import { ShortcutCheatSheet } from './ShortcutCheatSheet';

const nodeTypes = {
  mindmap: MindMapNode,
};

const edgeTypes = {
  custom: EditableEdge,
};

export const MindMapCanvas = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    addSibling,
    deleteNode,
    layoutDagre,
    selectNode,
    setEditingNodeId,
    layoutDirection,
    setBrainstorming,
    isBrainstorming,
    toggleTask,
    reparentNode,
    depthColors,
  } = useStore();
  
  const { fitView, getIntersectingNodes, getNodes } = useReactFlow();

  const [helperLines, setHelperLines] = useState<{ horizontal?: number; vertical?: number }>({});
  const [minimapHoverNode, setMinimapHoverNode] = useState<AppNode | null>(null);
  const [minimapPos, setMinimapPos] = useState({ x: 0, y: 0 });

  const handleMinimapMouseMove = (event: React.MouseEvent) => {
    const mapElement = event.currentTarget.getBoundingClientRect();
    const rx = (event.clientX - mapElement.left) / mapElement.width;
    const ry = (event.clientY - mapElement.top) / mapElement.height;
    
    const allNodes = getNodes().filter(n => !n.hidden);
    if (allNodes.length === 0) return;

    // Use default dimensions if measured ones are missing to prevent NaN
    const xMin = Math.min(...allNodes.map(n => n.position.x));
    const xMax = Math.max(...allNodes.map(n => n.position.x + (n.measured?.width || 180)));
    const yMin = Math.min(...allNodes.map(n => n.position.y));
    const yMax = Math.max(...allNodes.map(n => n.position.y + (n.measured?.height || 60)));

    const width = xMax - xMin;
    const height = yMax - yMin;
    
    // MiniMap internal coordinate mapping with standard 15% padding
    const padding = 0.15;
    const targetX = xMin - width * padding + rx * width * (1 + 2 * padding);
    const targetY = yMin - height * padding + ry * height * (1 + 2 * padding);

    let closestNode = null;
    let minDistance = Infinity;

    for (const node of allNodes) {
      const nx = node.position.x + (node.measured?.width || 180) / 2;
      const ny = node.position.y + (node.measured?.height || 60) / 2;
      const dist = Math.sqrt(Math.pow(nx - targetX, 2) + Math.pow(ny - targetY, 2));
      
      if (dist < minDistance) {
        minDistance = dist;
        closestNode = node;
      }
    }

    if (closestNode && minDistance < 300) {
      setMinimapHoverNode(closestNode as AppNode);
      setMinimapPos({ x: event.clientX, y: event.clientY });
    } else {
      setMinimapHoverNode(null);
    }
  };

  // Helper lines handler
  const onNodeDrag = (_: React.MouseEvent, node: Node) => {
    const verticalLines: number[] = [];
    const horizontalLines: number[] = [];
    
    nodes.filter(n => n.id !== node.id && !n.hidden).forEach(targetNode => {
      // Sensitivity threshold
      const threshold = 5;

      // Vertical alignments (X)
      if (Math.abs(targetNode.position.x - node.position.x) < threshold) {
        verticalLines.push(targetNode.position.x);
      }
      // Center vertical
      if (Math.abs((targetNode.position.x + 90) - (node.position.x + 90)) < threshold) {
        verticalLines.push(targetNode.position.x + 90);
      }

      // Horizontal alignments (Y)
      if (Math.abs(targetNode.position.y - node.position.y) < threshold) {
        horizontalLines.push(targetNode.position.y);
      }
      // Center horizontal
      if (Math.abs((targetNode.position.y + 30) - (node.position.y + 30)) < threshold) {
        horizontalLines.push(targetNode.position.y + 30);
      }
    });

    setHelperLines({
      horizontal: horizontalLines.length > 0 ? horizontalLines[0] : undefined,
      vertical: verticalLines.length > 0 ? verticalLines[0] : undefined,
    });
  };

  const onNodeDragStop = (_: React.MouseEvent, node: AppNode) => {
    setHelperLines({});
    const intersections = getIntersectingNodes(node);
    const dropTarget = intersections.find(n => n.id !== node.id);
    if (dropTarget) {
      reparentNode(node.id, dropTarget.id);
    }
  };

  const selectedNodes = useMemo(() => nodes.filter((n) => n.selected), [nodes]);

  useHotkeys('backspace, delete', () => {
    selectedNodes.forEach((node) => deleteNode(node.id));
  }, { enableOnFormTags: false }, [selectedNodes, deleteNode]);

  useHotkeys('tab', (e) => {
    e.preventDefault();
    if (selectedNodes.length === 1) {
      addNode(selectedNodes[0].id);
    }
  }, { enableOnFormTags: false }, [selectedNodes, addNode]);

  useHotkeys('enter', (e) => {
    e.preventDefault();
    if (selectedNodes.length === 1 && selectedNodes[0].id !== 'root') {
      addSibling(selectedNodes[0].id);
    }
  }, { enableOnFormTags: false }, [selectedNodes, addSibling]);

  useHotkeys('meta+z, ctrl+z', (e) => {
    e.preventDefault();
    useStore.temporal.getState().undo();
  }, { enableOnFormTags: false }, []);

  useHotkeys('meta+shift+z, ctrl+shift+z', (e) => {
    e.preventDefault();
    useStore.temporal.getState().redo();
  }, { enableOnFormTags: false }, []);

  useHotkeys('space', (e) => {
    e.preventDefault();
    if (selectedNodes.length === 1) {
      setEditingNodeId(selectedNodes[0].id);
    }
  }, { enableOnFormTags: false }, [selectedNodes, setEditingNodeId]);

  // Arrow Key Navigation - Updated for directions
  useHotkeys('up', (e) => {
    e.preventDefault();
    if (selectedNodes.length !== 1) return;
    const current = selectedNodes[0];
    const siblings = edges.filter(e => e.source === edges.find(ed => ed.target === current.id)?.source).map(e => e.target);
    const idx = siblings.indexOf(current.id);
    if (idx > 0) selectNode(siblings[idx - 1]);
    else if (layoutDirection === 'BT') {
        const childEdge = edges.find(e => e.source === current.id);
        if (childEdge) selectNode(childEdge.target);
    } else if (layoutDirection === 'TB') {
        const parentEdge = edges.find(e => e.target === current.id);
        if (parentEdge) selectNode(parentEdge.source);
    }
  }, { enableOnFormTags: false }, [selectedNodes, edges, selectNode, layoutDirection]);

  useHotkeys('down', (e) => {
    e.preventDefault();
    if (selectedNodes.length !== 1) return;
    const current = selectedNodes[0];
    const siblings = edges.filter(e => e.source === edges.find(ed => ed.target === current.id)?.source).map(e => e.target);
    const idx = siblings.indexOf(current.id);
    if (idx < siblings.length - 1) selectNode(siblings[idx + 1]);
    else if (layoutDirection === 'TB') {
        const childEdge = edges.find(e => e.source === current.id);
        if (childEdge) selectNode(childEdge.target);
    } else if (layoutDirection === 'BT') {
        const parentEdge = edges.find(e => e.target === current.id);
        if (parentEdge) selectNode(parentEdge.source);
    }
  }, { enableOnFormTags: false }, [selectedNodes, edges, selectNode, layoutDirection]);

  useHotkeys('left', (e) => {
    e.preventDefault();
    if (selectedNodes.length !== 1) return;
    const current = selectedNodes[0];
    
    if (layoutDirection === 'radial') {
      if (current.id === 'root') {
        const leftChildren = edges.filter(e => e.source === 'root' && e.sourceHandle === 'left').map(e => e.target);
        if (leftChildren.length > 0) selectNode(leftChildren[0]);
      } else if (current.position.x < 0) {
        // On left side, left is outwards (to children)
        const childEdge = edges.find(e => e.source === current.id);
        if (childEdge) selectNode(childEdge.target);
      } else {
        // On right side, left is inwards (to parent)
        const parentEdge = edges.find(e => e.target === current.id);
        if (parentEdge) selectNode(parentEdge.source);
      }
      return;
    }

    if (layoutDirection === 'LR') {
        const parentEdge = edges.find(e => e.target === current.id);
        if (parentEdge) selectNode(parentEdge.source);
    } else if (layoutDirection === 'RL') {
        const childEdge = edges.find(e => e.source === current.id);
        if (childEdge) selectNode(childEdge.target);
    }
  }, { enableOnFormTags: false }, [selectedNodes, edges, selectNode, layoutDirection]);

  useHotkeys('right', (e) => {
    e.preventDefault();
    if (selectedNodes.length !== 1) return;
    const current = selectedNodes[0];

    if (layoutDirection === 'radial') {
      if (current.id === 'root') {
        const rightChildren = edges.filter(e => e.source === 'root' && e.sourceHandle === 'right').map(e => e.target);
        if (rightChildren.length > 0) selectNode(rightChildren[0]);
      } else if (current.position.x < 0) {
        // On left side, right is inwards (to parent)
        const parentEdge = edges.find(e => e.target === current.id);
        if (parentEdge) selectNode(parentEdge.source);
      } else {
        // On right side, right is outwards (to children)
        const childEdge = edges.find(e => e.source === current.id);
        if (childEdge) selectNode(childEdge.target);
      }
      return;
    }

    if (layoutDirection === 'LR') {
        const childEdge = edges.find(e => e.source === current.id);
        if (childEdge) selectNode(childEdge.target);
    } else if (layoutDirection === 'RL') {
        const parentEdge = edges.find(e => e.target === current.id);
        if (parentEdge) selectNode(parentEdge.source);
    }
  }, { enableOnFormTags: false }, [selectedNodes, edges, selectNode, layoutDirection]);

  useHotkeys('b', (e) => {
    e.preventDefault();
    setBrainstorming(!isBrainstorming);
  }, { enableOnFormTags: false }, [isBrainstorming, setBrainstorming]);

  useEffect(() => {
    layoutDagre();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'transparent', position: 'relative' }}>
      <div className="ambient-background">
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
        <div className="ambient-blob ambient-blob-3" />
      </div>
      <div className="vignette-overlay" />
      
      <ContextMenu.Root>
        <ContextMenu.Trigger asChild>
          <div 
            style={{ width: '100%', height: '100%' }}
            onDoubleClick={() => fitView({ duration: 800 })}
          >
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              defaultEdgeOptions={{ type: 'custom' }}
              fitView
              selectionMode={SelectionMode.Partial}
              connectionRadius={30}
              minZoom={0.05}
              maxZoom={4}
              onNodeDrag={onNodeDrag}
              onNodeDragStop={onNodeDragStop}
              snapToGrid
              snapGrid={[14, 14]}
            >
              {helperLines.horizontal !== undefined && (
                <div 
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    top: helperLines.horizontal,
                    height: '1px',
                    borderTop: '1px dashed var(--color-accent-bright)',
                    opacity: 0.5,
                    zIndex: 10,
                    pointerEvents: 'none',
                    transform: `translateY(var(--rf-node-y))`
                  }}
                />
              )}
              {helperLines.vertical !== undefined && (
                <div 
                  style={{
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    left: helperLines.vertical,
                    width: '1px',
                    borderLeft: '1px dashed var(--color-accent-bright)',
                    opacity: 0.5,
                    zIndex: 10,
                    pointerEvents: 'none'
                  }}
                />
              )}
              <Background 
                id="minor"
                variant={BackgroundVariant.Dots} 
                color="var(--canvas-grid)" 
                gap={28} 
                size={1.2} 
                style={{ opacity: 0.2 }}
              />
              <Background 
                id="major"
                variant={BackgroundVariant.Lines} 
                color="var(--canvas-grid)" 
                gap={140} 
                size={1} 
                style={{ opacity: 0.1 }}
              />
              <Controls showInteractive={false} />
              
              <div onMouseMove={handleMinimapMouseMove} onMouseLeave={() => setMinimapHoverNode(null)}>
                <MiniMap
                  position="top-right"
                  nodeStrokeColor="transparent"
                  nodeColor={(n: AppNode) => {
                    if (n?.data?.color) return n.data.color;
                    const depth = n?.data?.depth ?? 0;
                    return depthColors?.[depth] ?? '#7c3aed';
                  }}
                  nodeStrokeWidth={3}
                  maskColor="var(--minimap-mask)"
                  maskStrokeColor="var(--color-border-active)"
                  style={{
                    borderRadius: '20px',
                    background: 'var(--color-bg-surface)',
                    border: '1.5px solid var(--color-border-active)',
                    boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
                    cursor: 'crosshair'
                  }}
                  zoomable
                  pannable
                />
              </div>

              {minimapHoverNode && (
                <div style={{
                  position: 'fixed',
                  left: minimapPos.x,
                  top: minimapPos.y < 200 ? minimapPos.y + 30 : minimapPos.y - 70, // Show below if near top
                  transform: 'translateX(-50%)',
                  padding: '12px 18px',
                  background: 'var(--color-bg-glass)',
                  backdropFilter: 'blur(30px)',
                  border: '1px solid var(--color-border-active)',
                  borderRadius: '14px',
                  color: 'var(--color-text-primary)',
                  fontSize: '13px',
                  fontWeight: 600,
                  pointerEvents: 'none',
                  zIndex: 20000,
                  boxShadow: '0 15px 50px rgba(0,0,0,0.7)',
                  animation: 'slide-up 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  whiteSpace: 'nowrap',
                  borderBottom: `3px solid ${(minimapHoverNode.style?.background as string) || (depthColors ? depthColors[minimapHoverNode.data.depth ?? 0] : '#7c3aed')}`
                }}>
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    background: (minimapHoverNode.style?.background as string) || (depthColors ? depthColors[minimapHoverNode.data.depth ?? 0] : '#7c3aed'),
                    boxShadow: `0 0 15px ${(minimapHoverNode.style?.background as string) || (depthColors ? depthColors[minimapHoverNode.data.depth ?? 0] : '#7c3aed')}`
                  }} />
                  {String(minimapHoverNode.data.label || 'Untitled Node').replace(/<[^>]*>?/gm, '')}
                </div>
              )}

              <Panel position="bottom-center">
                <Toolbar />
              </Panel>
              <BrainstormingModal />
            </ReactFlow>
          </div>
        </ContextMenu.Trigger>
        <ContextMenu.Portal>
          <ContextMenu.Content 
            className="glass-panel animate-slide-in" 
            style={{ 
              minWidth: '220px', 
              padding: '6px', 
              zIndex: 100,
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
          >
            <ContextMenu.Item 
              className="context-menu-item"
              onSelect={() => {
                if (selectedNodes.length === 1) addNode(selectedNodes[0].id);
              }}
              disabled={selectedNodes.length !== 1}
            >
              <Plus size={15} /> Add Child Node
            </ContextMenu.Item>

            <ContextMenu.Item 
              className="context-menu-item"
              onSelect={() => {
                if (selectedNodes.length === 1 && selectedNodes[0].id !== 'root') addSibling(selectedNodes[0].id);
              }}
              disabled={selectedNodes.length !== 1 || selectedNodes[0].id === 'root'}
            >
              <GitBranchPlus size={15} /> Add Sibling Node
            </ContextMenu.Item>

            <ContextMenu.Item 
              className="context-menu-item"
              onSelect={() => {
                if (selectedNodes.length === 1) toggleTask(selectedNodes[0].id);
              }}
              disabled={selectedNodes.length !== 1}
            >
              <CheckSquare size={15} /> Toggle Task Mode
            </ContextMenu.Item>
            
            <ContextMenu.Item 
              className="context-menu-item"
              onSelect={() => layoutDagre()}
            >
              <Layout size={15} /> Auto Layout Graph
            </ContextMenu.Item>
            
            <ContextMenu.Separator style={{ height: '1px', background: 'var(--color-border-subtle)', margin: '4px 8px' }} />
            
            <ContextMenu.Item 
              className="context-menu-item danger"
              onSelect={() => selectedNodes.forEach(n => deleteNode(n.id))}
              disabled={selectedNodes.length === 0}
            >
              <Trash2 size={15} /> Delete Selected
            </ContextMenu.Item>
            
          </ContextMenu.Content>
        </ContextMenu.Portal>
      </ContextMenu.Root>
      <ShortcutCheatSheet />
    </div>
  );
};
