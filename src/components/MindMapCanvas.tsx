import { useEffect, useMemo, useState, useRef } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  SelectionMode,
  MiniMap,
  useReactFlow,
  type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useStore } from '../store';
import { type AppNode } from '../store/types';
import { MindMapNode } from './MindMapNode';
import { EditableEdge } from './EditableEdge';
import { Toolbar } from './Toolbar';
import { BrainstormingModal } from './BrainstormingModal';
import { ShortcutCheatSheet } from './ShortcutCheatSheet';
import { MindMapContextMenu } from './mindmap/MindMapContextMenu';
import { useMindMapHotkeys } from '../hooks/useMindMapHotkeys';
import { stripHtml } from '../utils/color';

const nodeTypes = {
  mindmap: MindMapNode,
};

const edgeTypes = {
  custom: EditableEdge,
};

/**
 * Main MindMap Canvas component
 * Handles the React Flow instance, custom node/edge types, and interactions
 */
export const MindMapCanvas = () => {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addRootNode,
    addNode,
    addSibling,
    deleteNode,
    layoutDagre,
    toggleTask,
    reparentNode,
    depthColors,
  } = useStore();
  
  const { fitView, getIntersectingNodes, getNodes } = useReactFlow();

  // Local state for UI helpers
  const [helperLines, setHelperLines] = useState<{ horizontal?: number; vertical?: number }>({});
  const [minimapHoverNode, setMinimapHoverNode] = useState<AppNode | null>(null);
  const [minimapPos, setMinimapPos] = useState({ x: 0, y: 0 });

  // Track node count to trigger fitView on creation
  const lastNodesCount = useRef(nodes.length);

  // Auto-fit view when a new node is created
  useEffect(() => {
    if (nodes.length > lastNodesCount.current) {
      // Small timeout to ensure the new node is measured by React Flow
      const timer = setTimeout(() => {
        fitView({ duration: 500, padding: 0.2 });
      }, 100);
      lastNodesCount.current = nodes.length;
      return () => clearTimeout(timer);
    }
    lastNodesCount.current = nodes.length;
  }, [nodes.length, fitView]);

  // Initialize custom hotkeys
  useMindMapHotkeys();

  const selectedNodes = useMemo(() => nodes.filter((n) => n.selected), [nodes]);

  /**
   * Handle snapping and helper lines during node drag
   */
  const onNodeDrag = (_: React.MouseEvent, node: Node) => {
    const verticalLines: number[] = [];
    const horizontalLines: number[] = [];
    
    nodes.filter(n => n.id !== node.id && !n.hidden).forEach(targetNode => {
      const threshold = 5;

      // X-alignment
      if (Math.abs(targetNode.position.x - node.position.x) < threshold) {
        verticalLines.push(targetNode.position.x);
      }
      // Center X-alignment
      if (Math.abs((targetNode.position.x + 90) - (node.position.x + 90)) < threshold) {
        verticalLines.push(targetNode.position.x + 90);
      }

      // Y-alignment
      if (Math.abs(targetNode.position.y - node.position.y) < threshold) {
        horizontalLines.push(targetNode.position.y);
      }
      // Center Y-alignment
      if (Math.abs((targetNode.position.y + 30) - (node.position.y + 30)) < threshold) {
        horizontalLines.push(targetNode.position.y + 30);
      }
    });

    setHelperLines({
      horizontal: horizontalLines.length > 0 ? horizontalLines[0] : undefined,
      vertical: verticalLines.length > 0 ? verticalLines[0] : undefined,
    });
  };

  /**
   * Handle node reparenting on drop
   */
  const onNodeDragStop = (_: React.MouseEvent, node: AppNode) => {
    setHelperLines({});
    const intersections = getIntersectingNodes(node);
    const dropTarget = intersections.find(n => n.id !== node.id);
    if (dropTarget) {
      reparentNode(node.id, dropTarget.id);
    }
  };

  /**
   * Minimap mouse movement for node preview logic
   */
  const handleMinimapMouseMove = (event: React.MouseEvent) => {
    const mapElement = event.currentTarget.getBoundingClientRect();
    const rx = (event.clientX - mapElement.left) / mapElement.width;
    const ry = (event.clientY - mapElement.top) / mapElement.height;
    
    const allNodes = getNodes().filter(n => !n.hidden);
    if (allNodes.length === 0) return;

    const xMin = Math.min(...allNodes.map(n => n.position.x));
    const xMax = Math.max(...allNodes.map(n => n.position.x + (n.measured?.width || 180)));
    const yMin = Math.min(...allNodes.map(n => n.position.y));
    const yMax = Math.max(...allNodes.map(n => n.position.y + (n.measured?.height || 60)));

    const width = xMax - xMin;
    const height = yMax - yMin;
    
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

  useEffect(() => {
    layoutDagre();
  }, [layoutDagre]);

  return (
    <div style={{ width: '100vw', height: '100vh', background: 'transparent', position: 'relative' }}>
      {/* Visual background layers */}
      <div className="ambient-background">
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
        <div className="ambient-blob ambient-blob-3" />
      </div>
      <div className="vignette-overlay" />
      
      <MindMapContextMenu
        selectedNodes={selectedNodes}
        addRootNode={addRootNode}
        addNode={addNode}
        addSibling={addSibling}
        toggleTask={toggleTask}
        layoutDagre={layoutDagre}
        deleteNode={deleteNode}
      >
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
            {/* Helper Alignment Lines */}
            {helperLines.horizontal !== undefined && (
              <div style={{ position: 'absolute', left: 0, right: 0, top: helperLines.horizontal, height: '1px', borderTop: '1px dashed var(--color-accent-bright)', opacity: 0.5, zIndex: 10, pointerEvents: 'none', transform: `translateY(var(--rf-node-y))` }} />
            )}
            {helperLines.vertical !== undefined && (
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: helperLines.vertical, width: '1px', borderLeft: '1px dashed var(--color-accent-bright)', opacity: 0.5, zIndex: 10, pointerEvents: 'none' }} />
            )}

            <Background id="minor" variant={BackgroundVariant.Dots} color="var(--canvas-grid)" gap={28} size={1.2} style={{ opacity: 0.2 }} />
            <Background id="major" variant={BackgroundVariant.Lines} color="var(--canvas-grid)" gap={140} size={1} style={{ opacity: 0.1 }} />
            
            <Controls showInteractive={false} />
            
            {/* Custom Interactive Minimap */}
            <div onMouseMove={handleMinimapMouseMove} onMouseLeave={() => setMinimapHoverNode(null)}>
              <MiniMap
                position="top-right"
                nodeStrokeColor="transparent"
                nodeColor={(n: AppNode) => n?.data?.color || depthColors?.[n?.data?.depth ?? 0] || '#7c3aed'}
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
                zoomable pannable
              />
            </div>

            {/* Minimap Hover Tooltip */}
            {minimapHoverNode && (
              <div style={{
                position: 'fixed',
                left: minimapPos.x,
                top: minimapPos.y < 200 ? minimapPos.y + 30 : minimapPos.y - 70,
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
                borderBottom: `3px solid ${minimapHoverNode.data.color || depthColors[minimapHoverNode.data.depth ?? 0] || '#7c3aed'}`
              }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: minimapHoverNode.data.color || depthColors[minimapHoverNode.data.depth ?? 0] || '#7c3aed', boxShadow: `0 0 15px ${minimapHoverNode.data.color || depthColors[minimapHoverNode.data.depth ?? 0] || '#7c3aed'}` }} />
                {stripHtml(String(minimapHoverNode.data.label || 'Untitled Node'))}
              </div>
            )}

            <BrainstormingModal />
          </ReactFlow>
        </div>
      </MindMapContextMenu>

      <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 100 }}>
        <Toolbar />
      </div>
      
      <ShortcutCheatSheet />
    </div>
  );
};
