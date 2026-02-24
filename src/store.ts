import { create } from 'zustand';
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { temporal } from 'zundo';
import { get, set as idbSet, del } from 'idb-keyval';
import {
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  addEdge,
  type OnNodesChange,
  type OnEdgesChange,
  type OnConnect,
  applyNodeChanges,
  applyEdgeChanges,
  Position,
} from '@xyflow/react';
import { nanoid } from 'nanoid';
import dagre from '@dagrejs/dagre';

export type MindMapNodeData = {
  label: string;
  collapsed?: boolean;
  color?: string;
  depth?: number;
  shape?: 'rect' | 'pill' | 'diamond' | 'hexagon' | 'capsule';
  branchMasterId?: string;
  isManualColor?: boolean;
  useBranchColor?: boolean;
  isTask?: boolean;
  isCompleted?: boolean;
  mood?: string;
};

export type AppNode = Node<MindMapNodeData>;

export type Space = {
  id: string;
  name: string;
  nodes: AppNode[];
  edges: Edge[];
  createdAt: number;
  lastModified: number;
};

export type AppState = {
  nodes: AppNode[];
  edges: Edge[];
  spaces: Space[];
  activeSpaceId: string | null;
  createSpace: (name: string) => void;
  deleteSpace: (id: string | null) => void;
  switchSpace: (id: string) => void;
  updateSpaceName: (id: string, name: string) => void;
  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  addNode: (parentNodeId: string, label?: string) => void;
  addSibling: (nodeId: string, label?: string) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
  updateNodeShape: (nodeId: string, shape: 'rect' | 'pill' | 'diamond' | 'hexagon' | 'capsule') => void;
  selectNode: (nodeId: string) => void;
  deleteNode: (nodeId: string) => void;
  toggleCollapse: (nodeId: string) => void;
  depthColors: string[];
  setDepthColor: (depth: number, color: string) => void;
  updateNodeColor: (nodeId: string, color: string | undefined, mood?: string) => void;
  updateEdgeLabel: (edgeId: string, label: string) => void;
  recalculateDepths: () => void;
  importData: (nodes: AppNode[], edges: Edge[]) => void;
  layoutDagre: (direction?: 'LR' | 'RL' | 'TB' | 'BT' | 'radial') => void;
  layoutDirection: 'LR' | 'RL' | 'TB' | 'BT' | 'radial';
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  activePaletteName: string;
  editingNodeId: string | null;
  setEditingNodeId: (nodeId: string | null) => void;
  bulkAddNodes: (parentNodeId: string, labels: string[]) => void;
  isBrainstorming: boolean;
  setBrainstorming: (value: boolean) => void;
  reparentNode: (nodeId: string, newParentId: string) => void;
  toggleTask: (nodeId: string) => void;
  toggleComplete: (nodeId: string) => void;
  colorMode: 'branch' | 'depth';
  setColorMode: (mode: 'branch' | 'depth') => void;
  branchColors: string[];
  setBranchColor: (index: number, color: string) => void;
  applyPalette: (palette: { name: string, depth: string[], branch: string[] }) => void;
  exitSpace: () => void;
};

const DEFAULT_DEPTH_COLORS = [
  '#7c3aed', // Level 0 (Root)
  '#a855f7', // Level 1
  '#ec4899', // Level 2
  '#ef4444', // Level 3
  '#f59e0b', // Level 4
  '#10b981', // Level 5
];

const BRANCH_COLORS = [
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#3b82f6', // Blue
  '#06b6d4', // Cyan
  '#8b5cf6', // Violet
];

const initialNodes: AppNode[] = [
  {
    id: 'root',
    type: 'mindmap',
    data: { label: 'MindMap Explorer', depth: 0 },
    position: { x: 0, y: 0 },
    width: 220,
    height: 80,
  },
  // Branch 1: Visuals (Level 1)
  {
    id: 'visuals',
    type: 'mindmap',
    data: { label: 'Visual System', depth: 1, color: 'rgba(139, 92, 246, 0.6)' },
    position: { x: 250, y: -150 },
    width: 180,
    height: 60,
  },
  {
    id: 'glass',
    type: 'mindmap',
    data: { label: 'Glassmorphism', depth: 2 },
    position: { x: 500, y: -200 },
    width: 160,
    height: 60,
  },
  {
    id: 'colors',
    type: 'mindmap',
    data: { label: 'Dynamic Colors', depth: 2 },
    position: { x: 500, y: -100 },
    width: 160,
    height: 60,
  },
  {
    id: 'depth-colors',
    type: 'mindmap',
    data: { label: 'Depth Palettes', depth: 3 },
    position: { x: 750, y: -100 },
    width: 140,
    height: 50,
  },
  
  // Branch 2: Features (Level 1)
  {
    id: 'features',
    type: 'mindmap',
    data: { label: 'Core Features', depth: 1, color: 'rgba(16, 185, 129, 0.6)' },
    position: { x: 250, y: 50 },
    width: 180,
    height: 60,
  },
  {
    id: 'layout',
    type: 'mindmap',
    data: { label: 'Auto Layout', depth: 2 },
    position: { x: 500, y: 0 },
    width: 160,
    height: 60,
  },
  {
    id: 'dagre',
    type: 'mindmap',
    data: { label: 'Dagre Engine', depth: 3 },
    position: { x: 750, y: -25 },
    width: 140,
    height: 50,
  },
  {
    id: 'persistence',
    type: 'mindmap',
    data: { label: 'Data Persistence', depth: 2 },
    position: { x: 500, y: 100 },
    width: 160,
    height: 60,
  },
  {
    id: 'indexeddb',
    type: 'mindmap',
    data: { label: 'IndexedDB', depth: 3 },
    position: { x: 750, y: 100 },
    width: 140,
    height: 50,
  },

  // Branch 3: Roadmap (Level 1, Collapsed)
  {
    id: 'roadmap',
    type: 'mindmap',
    data: { label: 'Future Roadmap', depth: 1, color: 'rgba(120, 80, 5, 0.6)' },
    position: { x: 250, y: 200 },
    width: 180,
    height: 60,
  },
  {
    id: 'ai-brain',
    type: 'mindmap',
    data: { label: 'AI Intelligence', depth: 2 },
    position: { x: 500, y: 175 },
    width: 160,
    height: 60,
  },
  {
    id: 'collab',
    type: 'mindmap',
    data: { label: 'Real-time Collab', depth: 2 },
    position: { x: 500, y: 225 },
    width: 160,
    height: 60,
  },

  // Floating Node
  {
    id: 'floating-tip',
    type: 'mindmap',
    data: { label: 'Pro Tip: Double click nodes to edit text', depth: 0 },
    position: { x: 0, y: 250 },
    width: 160,
    height: 60,
  },
];

const initialEdges: Edge[] = [
  // Root connections with labels
  { id: 'e-root-v', source: 'root', target: 'visuals', type: 'custom', label: 'aesthetic' },
  { id: 'e-root-f', source: 'root', target: 'features', type: 'custom', label: 'logic' },
  { id: 'e-root-r', source: 'root', target: 'roadmap', type: 'custom', label: 'future' },
  
  // Visuals branch
  { id: 'e-v-g', source: 'visuals', target: 'glass', type: 'custom' },
  { id: 'e-v-c', source: 'visuals', target: 'colors', type: 'custom' },
  { id: 'e-c-d', source: 'colors', target: 'depth-colors', type: 'custom', label: 'auto' },
  
  // Features branch
  { id: 'e-f-l', source: 'features', target: 'layout', type: 'custom' },
  { id: 'e-l-d', source: 'layout', target: 'dagre', type: 'custom', label: 'fast' },
  { id: 'e-f-p', source: 'features', target: 'persistence', type: 'custom' },
  { id: 'e-p-i', source: 'persistence', target: 'indexeddb', type: 'custom' },
  
  // Roadmap branch
  { id: 'e-r-a', source: 'roadmap', target: 'ai-brain', type: 'custom' },
  { id: 'e-r-c', source: 'roadmap', target: 'collab', type: 'custom' },
];

// IndexedDB storage adapter for Zustand
const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await idbSet(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name);
  },
};

export const useStore = create<AppState>()(
  temporal(
    persist(
      immer((set, get) => ({
        nodes: [],
        edges: [],
        spaces: [],
        activeSpaceId: null,
        createSpace: (name: string) => {
          set((state) => {
            const newSpace: Space = {
              id: nanoid(),
              name,
              nodes: initialNodes,
              edges: initialEdges,
              createdAt: Date.now(),
              lastModified: Date.now(),
            };
            state.spaces.push(newSpace);
            state.activeSpaceId = newSpace.id;
            state.nodes = newSpace.nodes;
            state.edges = newSpace.edges;
          });
          (get() as AppState).layoutDagre('TB');
        },
        deleteSpace: (id: string | null) => {
          set((state) => {
            const spaceId = id || state.activeSpaceId;
            if (!spaceId) return;
            state.spaces = state.spaces.filter((s) => s.id !== spaceId);
            if (state.activeSpaceId === spaceId) {
              state.activeSpaceId = null;
              state.nodes = [];
              state.edges = [];
            }
          });
        },
        switchSpace: (id: string) => {
          set((state) => {
            // Save current state to the active space before switching
            if (state.activeSpaceId) {
              const currentSpace = state.spaces.find((s) => s.id === state.activeSpaceId);
              if (currentSpace) {
                currentSpace.nodes = state.nodes;
                currentSpace.edges = state.edges;
                currentSpace.lastModified = Date.now();
              }
            }

            const nextSpace = state.spaces.find((s) => s.id === id);
            if (nextSpace) {
              state.activeSpaceId = id;
              state.nodes = nextSpace.nodes;
              state.edges = nextSpace.edges;
            }
          });
        },
        updateSpaceName: (id: string, name: string) => {
          set((state) => {
            const space = state.spaces.find((s) => s.id === id);
            if (space) space.name = name;
          });
        },
        layoutDirection: 'TB',
        theme: 'dark' as 'light' | 'dark',
        activePaletteName: 'Aura',
        toggleTheme: () => {
          set((state) => {
            state.theme = state.theme === 'light' ? 'dark' : 'light';
          });
        },
        editingNodeId: null as string | null,
        setEditingNodeId: (nodeId: string | null) => {
          set((draft) => {
            draft.editingNodeId = nodeId;
          });
        },
        bulkAddNodes: (parentNodeId: string, labels: string[]) => {
          const state = get() as AppState;
          const parentNode = state.nodes.find((n) => n.id === parentNodeId);
          if (!parentNode) return;

          const { pause, resume } = (useStore as unknown as { temporal: { getState: () => { pause: () => void, resume: () => void } } }).temporal.getState();
          pause();
          set((draft) => {
            const newNodes: AppNode[] = [];
            const newEdges: Edge[] = [];
            
            labels.forEach((label, index) => {
              if (!label.trim()) return;
              const newNodeId = nanoid();
              const depth = (parentNode.data.depth ?? 0) + 1;
              let color = parentNode.data.color;
              let branchMasterId = parentNode.data.branchMasterId;

              if (parentNodeId === 'root') {
                 // Distribute colors for new root children
                 const existingRootChildren = state.edges.filter(e => e.source === 'root').length;
                 color = BRANCH_COLORS[(existingRootChildren + index) % BRANCH_COLORS.length];
                 branchMasterId = newNodeId;
              }

              newNodes.push({
                id: newNodeId,
                type: 'mindmap',
                data: { 
                  label, 
                  depth, 
                  color,
                  branchMasterId,
                  isManualColor: false,
                  useBranchColor: true,
                  shape: parentNode.data.shape || 'pill'
                },
                position: { x: parentNode.position.x + 250, y: parentNode.position.y + (index * 60) },
              });
              newEdges.push({ id: `e-${parentNodeId}-${newNodeId}`, source: parentNodeId, target: newNodeId, type: 'custom' });
            });

            draft.nodes.push(...newNodes);
            draft.edges.push(...newEdges);
          });

          (get() as AppState).layoutDagre((get() as AppState).layoutDirection);
          resume();
        },
        isBrainstorming: false,
        setBrainstorming: (value: boolean) => set((state) => { state.isBrainstorming = value; }),
        depthColors: DEFAULT_DEPTH_COLORS,
        setDepthColor: (depth: number, color: string) => {
          set((state) => {
            state.depthColors[depth] = color;
          });
        },
        recalculateDepths: () => {
          set((state) => {
            const nodes = state.nodes;
            const edges = state.edges;

            const updateNodeData = (nodeId: string, currentDepth: number, branchMasterId?: string, branchColor?: string) => {
              const node = nodes.find(n => n.id === nodeId);
              if (node) {
                node.data.depth = currentDepth;
                node.data.branchMasterId = branchMasterId;
                
                if (!node.data.isManualColor && node.data.useBranchColor !== false) {
                  node.data.color = branchColor;
                }

                const children = edges.filter(e => e.source === nodeId).map(e => e.target);
                
                children.forEach(childId => {
                  let nextBranchId = branchMasterId;
                  let nextBranchColor = branchColor;
                  
                  if (nodeId === 'root') {
                    nextBranchId = childId;
                    const childNode = nodes.find(n => n.id === childId);
                    if (childNode?.data.color && childNode.data.isManualColor) {
                      nextBranchColor = childNode.data.color;
                    } else if (childNode?.data.useBranchColor) {
                      const childIndex = edges.filter(e => e.source === 'root').findIndex(e => e.target === childId);
                      nextBranchColor = state.branchColors[childIndex % state.branchColors.length];
                    }
                  }
                  
                  updateNodeData(childId, currentDepth + 1, nextBranchId, nextBranchColor);
                });
              }
            };

            const rootChildren = edges.filter(e => e.source === 'root').map(e => e.target);
            rootChildren.forEach((childId, index) => {
              const childNode = nodes.find(n => n.id === childId);
              const assignedColor = childNode?.data.color || state.branchColors[index % state.branchColors.length];
              updateNodeData(childId, 1, childId, assignedColor);
            });

            const rootNode = nodes.find(n => n.id === 'root');
            if (rootNode) {
              rootNode.data.depth = 0;
              delete rootNode.data.branchMasterId;
              delete rootNode.data.color;
            }
          });
        },
        onNodesChange: (changes: NodeChange<AppNode>[]) => {
          set((state) => {
            const safeChanges = changes.filter(change => 
              !(change.type === 'remove' && change.id === 'root')
            );
            const nextNodes = applyNodeChanges(safeChanges, state.nodes as AppNode[]);
            
            // Sanitize positions and dimensions to prevent NaN
            state.nodes = nextNodes.map(node => {
              const x = isNaN(node.position.x) ? 0 : node.position.x;
              const y = isNaN(node.position.y) ? 0 : node.position.y;
              const w = isNaN(node.width ?? 0) ? (node.id === 'root' ? 220 : 180) : node.width;
              const h = isNaN(node.height ?? 0) ? (node.id === 'root' ? 80 : 60) : node.height;
              
              if (isNaN(node.position.x) || isNaN(node.position.y)) {
                console.warn(`Sanitized NaN position for node ${node.id}`);
              }

              return {
                ...node,
                position: { x, y },
                width: w,
                height: h,
              };
            });
          });
        },
        onEdgesChange: (changes: EdgeChange[]) => {
          set((state) => {
            state.edges = applyEdgeChanges(changes, state.edges);
          });
        },
        onConnect: (connection: Connection) => {
          set((state) => {
            state.edges = addEdge(connection, state.edges);
          });
        },
        addNode: (parentNodeId: string, label = 'New Topic') => {
          const state = get() as AppState;
          const parentNode = state.nodes.find((n) => n.id === parentNodeId);
          if (!parentNode) return;

          const newNodeId = nanoid();
          const depth = (parentNode.data.depth ?? 0) + 1;
          
          let color = parentNode.data.color;
          let branchMasterId = parentNode.data.branchMasterId;

          if (parentNodeId === 'root') {
            color = BRANCH_COLORS[state.edges.filter(e => e.source === 'root').length % BRANCH_COLORS.length];
            branchMasterId = newNodeId;
          }

          const newNode: AppNode = {
            id: newNodeId,
            type: 'mindmap',
            data: { 
              label, 
              depth, 
              color,
              branchMasterId,
              isManualColor: false,
              useBranchColor: true,
              shape: parentNode.data.shape || 'pill'
            },
            position: { x: parentNode.position.x + 250, y: parentNode.position.y },
          };

          set((draft) => {
            draft.nodes.forEach(n => { n.selected = false; });
            const nodeWithSelection = { ...newNode, selected: true };
            draft.nodes.push(nodeWithSelection);
            draft.edges.push({ id: `e-${parentNodeId}-${newNodeId}`, source: parentNodeId, target: newNodeId, type: 'custom' });
          });

          (get() as AppState).layoutDagre((get() as AppState).layoutDirection);
        },
        addSibling: (nodeId: string, label = 'New Topic') => {
          if (nodeId === 'root') return;
          const state = get() as AppState;
          const edgeToNode = state.edges.find(e => e.target === nodeId);
          if (!edgeToNode) return;
          const parentNodeId = edgeToNode.source;
          state.addNode(parentNodeId, label);
        },
        updateNodeLabel: (nodeId: string, label: string) => {
          set((draft) => {
            const node = draft.nodes.find(n => n.id === nodeId);
            if (node) node.data.label = label;
          });
        },
        updateNodeShape: (nodeId: string, shape: 'rect' | 'pill' | 'diamond' | 'hexagon' | 'capsule') => {
          set((draft) => {
            const node = draft.nodes.find(n => n.id === nodeId);
            if (node) node.data.shape = shape;
          });
        },
        selectNode: (nodeId: string) => {
          set((draft) => {
            draft.nodes.forEach(n => {
              n.selected = n.id === nodeId;
            });
          });
        },
        deleteNode: (nodeId: string) => {
            if (nodeId === 'root') return;
            const { edges } = get() as AppState;
            const getAllDescendantIds = (parentId: string): string[] => {
              const children = edges.filter(e => e.source === parentId).map(e => e.target);
              return children.reduce((acc, childId) => {
                return [...acc, childId, ...getAllDescendantIds(childId)];
              }, [] as string[]);
            };

            const idsToDelete = [nodeId, ...getAllDescendantIds(nodeId)];
            set((draft) => {
              draft.nodes = draft.nodes.filter(n => !idsToDelete.includes(n.id));
              draft.edges = draft.edges.filter(e => 
                !idsToDelete.includes(e.source) && !idsToDelete.includes(e.target)
              );
            });
        },
        toggleCollapse: (nodeId: string) => {
          const { nodes, edges } = get() as AppState;
          const node = nodes.find((n) => n.id === nodeId);
          if (!node) return;

          const isCollapsed = !node.data.collapsed;
          const isNodeHidden = (id: string, currentNodes: readonly AppNode[]): boolean => {
            const incomingEdges = edges.filter(e => e.target === id);
            if (incomingEdges.length === 0) return false;
            const parentId = incomingEdges[0].source;
            const parent = currentNodes.find(n => n.id === parentId);
            if (!parent) return false;
            if (parent.data.collapsed) return true;
            return isNodeHidden(parentId, currentNodes);
          };

          set((draft) => {
            const n = draft.nodes.find(x => x.id === nodeId);
            if (n) n.data.collapsed = isCollapsed;
            draft.nodes.forEach(n => {
              n.hidden = isNodeHidden(n.id, draft.nodes as AppNode[]);
            });
            draft.edges.forEach(e => {
              e.hidden = isNodeHidden(e.target, draft.nodes as AppNode[]);
            });
          });
        },
        layoutDagre: (direction) => {
          const state = get() as AppState;
          const dir = direction || state.layoutDirection;
          
          set((draft) => {
            draft.layoutDirection = dir;
          });

          const { nodes, edges } = get() as AppState;

          if (dir === 'radial') {
            // Simplified Radial/Centered Layout
            // Root in center, subtrees split left and right
            const rootNode = nodes.find(n => n.id === 'root');
            if (!rootNode) return;

            const rootChildren = edges.filter(e => e.source === 'root').map(e => e.target);
            const leftChildren = rootChildren.slice(0, Math.ceil(rootChildren.length / 2));
            const rightChildren = rootChildren.slice(Math.ceil(rootChildren.length / 2));

            const layoutSubtree = (children: string[], rankdir: 'LR' | 'RL') => {
              const g = new dagre.graphlib.Graph();
              g.setDefaultEdgeLabel(() => ({}));
              g.setGraph({ rankdir, nodesep: 80, ranksep: 120 });

              const subtreeNodes: string[] = [...children];
              const getDescendants = (id: string) => {
                const cds = edges.filter(e => e.source === id).map(e => e.target);
                cds.forEach(cid => {
                  subtreeNodes.push(cid);
                  getDescendants(cid);
                });
              };
              children.forEach(getDescendants);

              nodes.forEach(n => {
                if (subtreeNodes.includes(n.id) && !n.hidden) {
                  g.setNode(n.id, { width: 180, height: 60 });
                }
              });

              edges.forEach(e => {
                if (subtreeNodes.includes(e.source) && subtreeNodes.includes(e.target) && !e.hidden) {
                  g.setEdge(e.source, e.target);
                }
                // Also add edges from the virtual root to first level children
                if (e.source === 'root' && children.includes(e.target)) {
                   // We add a dummy root to anchor the subtree layout
                   if (!g.hasNode('__root')) g.setNode('__root', { width: 1, height: 1 });
                   g.setEdge('__root', e.target);
                }
              });

              dagre.layout(g);
              return g;
            };

            const leftGraph = layoutSubtree(leftChildren, 'RL');
            const rightGraph = layoutSubtree(rightChildren, 'LR');

            set((draft) => {
              draft.nodes.forEach(node => {
                let nodePos;
                const isRoot = node.id === 'root';
                
                if (leftGraph.hasNode(node.id)) {
                  nodePos = leftGraph.node(node.id);
                  const rootPos = leftGraph.node('__root') || { x: 0, y: 0 };
                  node.position = {
                    x: (nodePos.x - rootPos.x) - 200 - (nodePos.width / 2),
                    y: (nodePos.y - rootPos.y) - (nodePos.height / 2),
                  };
                  node.sourcePosition = Position.Left;
                  node.targetPosition = Position.Right;
                } else if (rightGraph.hasNode(node.id)) {
                  nodePos = rightGraph.node(node.id);
                  const rootPos = rightGraph.node('__root') || { x: 0, y: 0 };
                  node.position = {
                    x: (nodePos.x - rootPos.x) + 200 - (nodePos.width / 2),
                    y: (nodePos.y - rootPos.y) - (nodePos.height / 2),
                  };
                  node.sourcePosition = Position.Right;
                  node.targetPosition = Position.Left;
                } else if (isRoot) {
                  node.position = { x: -110, y: -40 };
                }
              });

              draft.edges.forEach(edge => {
                if (edge.source === 'root') {
                  if (leftChildren.includes(edge.target)) {
                    edge.sourceHandle = 'left';
                  } else if (rightChildren.includes(edge.target)) {
                    edge.sourceHandle = 'right';
                  } else {
                    edge.sourceHandle = null;
                  }
                } else {
                  edge.sourceHandle = null;
                }
              });
            });
            return;
          }

          const dagreGraph = new dagre.graphlib.Graph();
          dagreGraph.setDefaultEdgeLabel(() => ({}));
          dagreGraph.setGraph({ rankdir: dir, nodesep: 80, ranksep: 160 });

          nodes.forEach((node) => {
            if (!node.hidden) {
              const isRoot = node.id === 'root';
              const outgoingEdges = edges.filter(e => e.source === node.id);
              const isLeaf = outgoingEdges.length === 0 && !isRoot;

              // Use exact dimensions to ensure alignment
              let width = node.width || 160;
              let height = node.height || 60;
              
              if (isRoot) { width = 220; height = 80; }
              else if (isLeaf) { width = 140; height = 50; }
              else { width = 180; height = 60; }

              dagreGraph.setNode(node.id, { width, height });
            }
          });

          edges.forEach((edge) => {
            if (!edge.hidden) {
              dagreGraph.setEdge(edge.source, edge.target);
            }
          });

          dagre.layout(dagreGraph);

          set((draft) => {
            const getPos = (d: string) => {
              switch(d) {
                case 'TB': return { s: Position.Bottom, t: Position.Top };
                case 'BT': return { s: Position.Top, t: Position.Bottom };
                case 'RL': return { s: Position.Left, t: Position.Right };
                default: return { s: Position.Right, t: Position.Left };
              }
            };
            const { s, t } = getPos(dir);

            draft.nodes.forEach((node) => {
              const nodeWithPosition = dagreGraph.node(node.id);
              if (nodeWithPosition) {
                node.position = {
                  x: nodeWithPosition.x - (nodeWithPosition.width / 2),
                  y: nodeWithPosition.y - (nodeWithPosition.height / 2),
                };
                node.sourcePosition = s;
                node.targetPosition = t;
              }
            });

            draft.edges.forEach(edge => {
              edge.sourceHandle = null;
            });
          });
        },
        updateNodeColor: (nodeId: string, color: string | undefined, mood?: string) => {
          set((draft) => {
            const node = draft.nodes.find(n => n.id === nodeId);
            if (node) {
              node.data.color = color;
              node.data.mood = mood;
              if (color === undefined) {
                node.data.isManualColor = false;
                node.data.useBranchColor = false;
              } else {
                node.data.isManualColor = true;
                node.data.useBranchColor = false;
              }
            }
          });
        },
        updateEdgeLabel: (edgeId: string, label: string) => {
          set((draft) => {
            const edge = draft.edges.find(e => e.id === edgeId);
            if (edge) edge.label = label;
          });
        },
        importData: (nodes: AppNode[], edges: Edge[]) => {
          set((draft) => {
             draft.nodes = nodes.map(n => ({
               ...n,
               position: {
                 x: isNaN(n.position.x) ? 0 : n.position.x,
                 y: isNaN(n.position.y) ? 0 : n.position.y,
               },
               width: isNaN(n.width ?? 0) ? (n.id === 'root' ? 220 : 180) : n.width,
               height: isNaN(n.height ?? 0) ? (n.id === 'root' ? 80 : 60) : n.height,
             }));
             draft.edges = edges;
             const calculateDepth = (nodeId: string, currentDepth: number) => {
               const node = draft.nodes.find(n => n.id === nodeId);
               if (node) {
                 node.data.depth = currentDepth;
                 const children = draft.edges.filter(e => e.source === nodeId).map(e => e.target);
                 children.forEach(childId => calculateDepth(childId, currentDepth + 1));
               }
             };
             calculateDepth('root', 0);
          });
        },
        reparentNode: (nodeId, newParentId) => {
          if (nodeId === 'root' || nodeId === newParentId) return;
          const state = get() as AppState;
          const getAllDescendants = (id: string): string[] => {
            const children = state.edges.filter(e => e.source === id).map(e => e.target);
            return children.reduce((acc, cid) => [...acc, cid, ...getAllDescendants(cid)], [] as string[]);
          };
          if (getAllDescendants(nodeId).includes(newParentId)) return;
          set((draft) => {
            draft.edges = draft.edges.filter(e => e.target !== nodeId);
            draft.edges.push({ id: `e-${newParentId}-${nodeId}`, source: newParentId, target: nodeId, type: 'custom' });
          });
          const updated = get() as AppState;
          updated.recalculateDepths();
          updated.layoutDagre();
        },
        toggleTask: (nodeId) => {
          set((draft) => {
            const node = draft.nodes.find(n => n.id === nodeId);
            if (node) {
              node.data.isTask = !node.data.isTask;
              if (node.data.isTask && node.data.isCompleted === undefined) node.data.isCompleted = false;
            }
          });
        },
        toggleComplete: (nodeId) => {
          set((draft) => {
            const node = draft.nodes.find(n => n.id === nodeId);
            if (node) node.data.isCompleted = !node.data.isCompleted;
          });
        },
        colorMode: 'branch' as 'branch' | 'depth',
        setColorMode: (mode) => {
          set((state) => {
            state.colorMode = mode;
          });
        },
        branchColors: BRANCH_COLORS,
        setBranchColor: (index, color) => {
          set((state) => {
            state.branchColors[index] = color;
          });
          (get() as AppState).recalculateDepths();
        },
        applyPalette: (palette) => {
          set((state) => {
            state.depthColors = palette.depth;
            state.branchColors = palette.branch;
            state.activePaletteName = palette.name;
          });
          (get() as AppState).recalculateDepths();
        },
        exitSpace: () => {
          set((state) => {
            if (state.activeSpaceId) {
              const currentSpace = state.spaces.find((s) => s.id === state.activeSpaceId);
              if (currentSpace) {
                currentSpace.nodes = state.nodes;
                currentSpace.edges = state.edges;
                currentSpace.lastModified = Date.now();
              }
            }
            state.activeSpaceId = null;
            state.nodes = [];
            state.edges = [];
          });
        },
      })),
      {
        name: 'mindmap-idb-storage',
        storage: createJSONStorage(() => idbStorage),
        partialize: (state: AppState) => ({ 
          nodes: state.nodes, 
          edges: state.edges, 
          theme: state.theme,
          spaces: state.spaces,
          activeSpaceId: state.activeSpaceId
        }),
      }
    ),
    {
      limit: 50,
    }
  )
);

// For debugging
if (typeof window !== 'undefined') {
  (window as unknown as Record<string, unknown>).useStore = useStore;
}


