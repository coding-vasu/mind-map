import { 
  type Edge, 
  type Node, 
  type OnNodesChange, 
  type OnEdgesChange, 
  type OnConnect,
} from '@xyflow/react';

/**
 * Data associated with a MindMap node
 */
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

/**
 * A MindMap node using the @xyflow/react type
 */
export type AppNode = Node<MindMapNodeData>;

/**
 * A workspace containing nodes and edges
 */
export type Space = {
  id: string;
  name: string;
  nodes: AppNode[];
  edges: Edge[];
  createdAt: number;
  lastModified: number;
};

/**
 * The main application state interface
 */
export interface AppState {
  nodes: AppNode[];
  edges: Edge[];
  spaces: Space[];
  activeSpaceId: string | null;
  
  // Space Actions
  createSpace: (name: string) => void;
  deleteSpace: (id: string | null) => void;
  switchSpace: (id: string) => void;
  updateSpaceName: (id: string, name: string) => void;
  exitSpace: () => void;

  // React Flow Handlers
  onNodesChange: OnNodesChange<AppNode>;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
  
  // Node Actions
  addNode: (parentNodeId: string, label?: string) => void;
  addSibling: (nodeId: string, label?: string) => void;
  bulkAddNodes: (parentNodeId: string, labels: string[]) => void;
  updateNodeLabel: (nodeId: string, label: string) => void;
  updateNodeShape: (nodeId: string, shape: 'rect' | 'pill' | 'diamond' | 'hexagon' | 'capsule') => void;
  updateNodeColor: (nodeId: string, color: string | undefined, mood?: string) => void;
  selectNode: (nodeId: string) => void;
  deleteNode: (nodeId: string) => void;
  toggleCollapse: (nodeId: string) => void;
  reparentNode: (nodeId: string, newParentId: string) => void;
  toggleTask: (nodeId: string) => void;
  toggleComplete: (nodeId: string) => void;
  editingNodeId: string | null;
  setEditingNodeId: (nodeId: string | null) => void;

  // Edge Actions
  updateEdgeLabel: (edgeId: string, label: string) => void;

  // Utilities & Layout
  layoutDagre: (direction?: 'LR' | 'RL' | 'TB' | 'BT' | 'radial') => void;
  layoutDirection: 'LR' | 'RL' | 'TB' | 'BT' | 'radial';
  recalculateDepths: () => void;
  importData: (nodes: AppNode[], edges: Edge[]) => void;

  // Styling & Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  colorMode: 'branch' | 'depth';
  setColorMode: (mode: 'branch' | 'depth') => void;
  depthColors: string[];
  setDepthColor: (depth: number, color: string) => void;
  branchColors: string[];
  setBranchColor: (index: number, color: string) => void;
  activePaletteName: string;
  applyPalette: (palette: { name: string, depth: string[], branch: string[] }) => void;

  // Global State
  isBrainstorming: boolean;
  setBrainstorming: (value: boolean) => void;
}
