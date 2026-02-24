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
 * Arranges nodes using the Dagre layout engine
 * @param nodes Current nodes
 * @param edges Current edges
 * @param direction Layout direction
 */
export const getLayoutedElements = (
  nodes: AppNode[],
  edges: Edge[],
  direction: LayoutDirection = 'LR'
): LayoutResult => {
  if (direction === 'radial') {
    return getRadialLayout(nodes, edges);
  }

  const dg = new dagre.graphlib.Graph();
  dg.setDefaultEdgeLabel(() => ({}));
  dg.setGraph({ rankdir: direction, nodesep: 80, ranksep: 160 });

  const activeNodes = nodes.filter(n => !n.hidden);
  const activeEdges = edges.filter(e => !e.hidden);

  activeNodes.forEach((n) => {
    const isRoot = n.id === 'root';
    const w = isRoot ? 220 : (activeEdges.some(e => e.source === n.id) ? 180 : 140);
    const h = isRoot ? 80 : (activeEdges.some(e => e.source === n.id) ? 60 : 50);
    dg.setNode(n.id, { width: w, height: h });
  });

  activeEdges.forEach((e) => {
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
    if (pos && !n.hidden) {
      return {
        ...n,
        position: { x: pos.x - (pos.width / 2), y: pos.y - (pos.height / 2) },
        sourcePosition: s,
        targetPosition: t,
      };
    }
    return n;
  });

  const nextEdges = edges.map(e => ({ ...e, sourceHandle: null }));

  return { nodes: nextNodes, edges: nextEdges };
};

/**
 * Simplified radial/centered layout implementation
 */
function getRadialLayout(nodes: AppNode[], edges: Edge[]): LayoutResult {
  const rootNode = nodes.find(n => n.id === 'root');
  if (!rootNode) return { nodes, edges };

  const activeEdges = edges.filter(e => !e.hidden);
  const rootChildren = activeEdges.filter(e => e.source === 'root').map(e => e.target);
  const leftChildren = rootChildren.slice(0, Math.ceil(rootChildren.length / 2));
  const rightChildren = rootChildren.slice(Math.ceil(rootChildren.length / 2));

  /**
   * Layout a specific subtree with a given direction
   */
  const layoutSubtree = (children: string[], rankdir: 'LR' | 'RL') => {
    const g = new dagre.graphlib.Graph();
    g.setDefaultEdgeLabel(() => ({}));
    g.setGraph({ rankdir, nodesep: 80, ranksep: 120 });

    const subtreeNodes: string[] = [...children];
    
    /**
     * Recursively find all descendants of a node.
     */
    const getDescendants = (id: string) => {
      const cds = activeEdges.filter(e => e.source === id).map(e => e.target);
      cds.forEach(cid => { subtreeNodes.push(cid); getDescendants(cid); });
    };
    children.forEach(getDescendants);

    nodes.forEach(n => {
      if (subtreeNodes.includes(n.id) && !n.hidden) g.setNode(n.id, { width: 180, height: 60 });
    });

    activeEdges.forEach(e => {
      if (subtreeNodes.includes(e.source) && subtreeNodes.includes(e.target)) g.setEdge(e.source, e.target);
      if (e.source === 'root' && children.includes(e.target)) {
         if (!g.hasNode('__root')) g.setNode('__root', { width: 1, height: 1 });
         g.setEdge('__root', e.target);
      }
    });

    dagre.layout(g);
    return { g, subtreeNodes };
  };

  /**
   * Layout the left and right subtrees independently based on the root node's children.
   */
  const { g: leftGraph } = layoutSubtree(leftChildren, 'RL');
  const { g: rightGraph } = layoutSubtree(rightChildren, 'LR');

  const nextNodes = nodes.map(node => {
    if (leftGraph.hasNode(node.id)) {
      const nPos = leftGraph.node(node.id);
      const rPos = leftGraph.node('__root') || { x: 0, y: 0 };
      return {
        ...node,
        position: { x: (nPos.x - rPos.x) - 200 - (nPos.width / 2), y: (nPos.y - rPos.y) - (nPos.height / 2) },
        sourcePosition: Position.Left,
        targetPosition: Position.Right,
      };
    } else if (rightGraph.hasNode(node.id)) {
      const nPos = rightGraph.node(node.id);
      const rPos = rightGraph.node('__root') || { x: 0, y: 0 };
      return {
        ...node,
        position: { x: (nPos.x - rPos.x) + 200 - (nPos.width / 2), y: (nPos.y - rPos.y) - (nPos.height / 2) },
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
      };
    } else if (node.id === 'root') {
      return { ...node, position: { x: -110, y: -40 } };
    }
    return node;
  });

  const nextEdges = edges.map(edge => {
    if (edge.source === 'root') {
      return {
        ...edge,
        sourceHandle: leftChildren.includes(edge.target) ? 'left' : rightChildren.includes(edge.target) ? 'right' : null
      };
    }
    return { ...edge, sourceHandle: null };
  });

  return { nodes: nextNodes, edges: nextEdges };
}
