import dagre from '@dagrejs/dagre';
import { type Edge, Position } from '@xyflow/react';
import { type AppNode } from '../store/types';

/**
 * Layout directions supported by the Dagre engine
 */
export type LayoutDirection = 'LR' | 'RL' | 'TB' | 'BT' | 'radial';

/**
 * Result of the layout calculation
 */
export interface LayoutResult {
  nodes: AppNode[];
  edges: Edge[];
}

/**
 * Arranges nodes using the Dagre layout engine, supporting multiple roots with individual directions
 */
export const getLayoutedElements = (
  nodes: AppNode[],
  edges: Edge[],
  globalDirection: LayoutDirection = 'TB'
): LayoutResult => {
  const activeNodes = nodes.filter(n => !n.hidden);
  const activeEdges = edges.filter(e => !e.hidden);

  // 1. Identify all root nodes
  const roots = activeNodes.filter(n => !activeEdges.some(e => e.target === n.id));
  
  if (roots.length === 0 && activeNodes.length > 0) {
    // Fallback if there's a cycle or something weird, treat the first node as root for layout
    roots.push(activeNodes[0]);
  }

  const finalNodes = [...nodes];
  const finalEdges: Edge[] = [...edges].map(e => ({ ...e, sourceHandle: null }));

  roots.forEach((root) => {
    const direction = root.data.layoutDirection || globalDirection;
    
    // Store original root position to anchor the layout
    const originalRootPos = { x: root.position.x, y: root.position.y };
    
    // Identify participants in this root's tree
    const treeNodeIds = new Set<string>();
    const treeEdges: Edge[] = [];
    
    const collectTree = (nodeId: string) => {
      if (treeNodeIds.has(nodeId)) return;
      treeNodeIds.add(nodeId);
      activeEdges.forEach(e => {
        if (e.source === nodeId) {
          treeEdges.push(e);
          collectTree(e.target);
        }
      });
    };
    collectTree(root.id);

    const treeNodes = activeNodes.filter(n => treeNodeIds.has(n.id));

    let layoutResult: LayoutResult;
    if (direction === 'radial') {
      layoutResult = getRadialLayout(treeNodes, treeEdges, root.id);
    } else {
      layoutResult = getDagreLayout(treeNodes, treeEdges, direction, root.id);
    }

    // After layout, find the root's new calculated position
    const layoutedRoot = layoutResult.nodes.find(n => n.id === root.id);
    if (!layoutedRoot) return;

    // Calculate how much the root moved from the origin (or its layouted position)
    // and apply a correction so its final position matches its original position
    const dx = originalRootPos.x - layoutedRoot.position.x;
    const dy = originalRootPos.y - layoutedRoot.position.y;

    // Apply offset to all nodes in this specific tree
    layoutResult.nodes.forEach(ln => {
      const idx = finalNodes.findIndex(fn => fn.id === ln.id);
      if (idx !== -1) {
        finalNodes[idx] = {
          ...finalNodes[idx],
          position: { x: ln.position.x + dx, y: ln.position.y + dy },
          sourcePosition: ln.sourcePosition,
          targetPosition: ln.targetPosition,
        };
      }
    });

    layoutResult.edges.forEach(le => {
      const idx = finalEdges.findIndex(fe => fe.id === le.id);
      if (idx !== -1) {
        finalEdges[idx] = { ...finalEdges[idx], sourceHandle: le.sourceHandle };
      }
    });
  });

  return { nodes: finalNodes, edges: finalEdges };
};

/**
 * Common Dagre logic for a single tree
 */
function getDagreLayout(nodes: AppNode[], edges: Edge[], direction: LayoutDirection, rootId: string): LayoutResult {
  const dg = new dagre.graphlib.Graph();
  dg.setDefaultEdgeLabel(() => ({}));
  dg.setGraph({ rankdir: direction, nodesep: 80, ranksep: 160 });

  nodes.forEach((n) => {
    const isRoot = n.id === rootId;
    const w = isRoot ? 220 : (edges.some(e => e.source === n.id) ? 180 : 140);
    const h = isRoot ? 80 : (edges.some(e => e.source === n.id) ? 60 : 50);
    dg.setNode(n.id, { width: w, height: h });
  });

  edges.forEach((e) => {
    dg.setEdge(e.source, e.target);
  });

  dagre.layout(dg);

  const getHandles = (d: string) => {
    if (d === 'TB') return { s: Position.Bottom, t: Position.Top };
    if (d === 'BT') return { s: Position.Top, t: Position.Bottom };
    if (d === 'RL') return { s: Position.Left, t: Position.Right };
    return { s: Position.Right, t: Position.Left };
  };

  const { s, t } = getHandles(direction);

  const nextNodes = nodes.map((n) => {
    const pos = dg.node(n.id);
    return {
      ...n,
      position: { x: pos.x - (pos.width / 2), y: pos.y - (pos.height / 2) },
      sourcePosition: s,
      targetPosition: t,
    };
  });

  return { nodes: nextNodes, edges: edges.map(e => ({ ...e, sourceHandle: null })) };
}

/**
 * Radial layout logic for a single tree
 */
function getRadialLayout(nodes: AppNode[], edges: Edge[], rootId: string): LayoutResult {
  const rootNode = nodes.find(n => n.id === rootId);
  if (!rootNode) return { nodes, edges };

  const rootChildren = edges.filter(e => e.source === rootId).map(e => e.target);
  const leftChildren = rootChildren.slice(0, Math.ceil(rootChildren.length / 2));
  const rightChildren = rootChildren.slice(Math.ceil(rootChildren.length / 2));

  const layoutSubtree = (children: string[], rankdir: 'LR' | 'RL') => {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir, nodesep: 80, ranksep: 120 });

    const subtreeNodes: string[] = [...children];
    const getDescendants = (id: string) => {
      const cds = edges.filter(e => e.source === id).map(e => e.target);
      cds.forEach(cid => { subtreeNodes.push(cid); getDescendants(cid); });
    };
    children.forEach(getDescendants);

    nodes.forEach(n => {
      if (subtreeNodes.includes(n.id)) g.setNode(n.id, { width: 180, height: 60 });
    });

    edges.forEach(e => {
      if (subtreeNodes.includes(e.source) && subtreeNodes.includes(e.target)) g.setEdge(e.source, e.target);
      if (e.source === rootId && children.includes(e.target)) {
         if (!g.hasNode('__root')) g.setNode('__root', { width: 1, height: 1 });
         g.setEdge('__root', e.target);
      }
    });

    dagre.layout(g);
    return { g, subtreeNodes };
  };

  const { g: leftGraph } = layoutSubtree(leftChildren, 'RL');
  const { g: rightGraph } = layoutSubtree(rightChildren, 'LR');

  const nextNodes = nodes.map(node => {
    if (leftGraph.hasNode(node.id)) {
      const nPos = leftGraph.node(node.id);
      const rPos = leftGraph.node('__root') || { x: 0, y: 0 };
      return {
        ...node,
        position: { x: (nPos.x - rPos.x) - 300 - (nPos.width / 2), y: (nPos.y - rPos.y) - (nPos.height / 2) },
        sourcePosition: Position.Left,
        targetPosition: Position.Right,
      };
    } else if (rightGraph.hasNode(node.id)) {
      const nPos = rightGraph.node(node.id);
      const rPos = rightGraph.node('__root') || { x: 0, y: 0 };
      return {
        ...node,
        position: { x: (nPos.x - rPos.x) + 300 - (nPos.width / 2), y: (nPos.y - rPos.y) - (nPos.height / 2) },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };
    } else if (node.id === rootId) {
      return { ...node, position: { x: -110, y: -40 } };
    }
    return node;
  });

  const nextEdges = edges.map(edge => {
    if (edge.source === rootId) {
      return {
        ...edge,
        sourceHandle: leftChildren.includes(edge.target) ? 'left' : rightChildren.includes(edge.target) ? 'right' : null
      };
    }
    return { ...edge, sourceHandle: null };
  });

  return { nodes: nextNodes, edges: nextEdges };
}
