import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { temporal } from 'zundo';
import { 
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';
import { nanoid } from 'nanoid';
import { getLayoutedElements } from './utils/layout';

import { 
  type AppState, 
  type AppNode, 
  type Space,
} from './store/types';
import { 
  DEFAULT_DEPTH_COLORS, 
  BRANCH_COLORS, 
} from './store/initialData';
import { idbStorage } from './store/middleware/idbStorage';

/**
 * Main application store using Zustand
 * Features:
 * - Immer for immutable state updates
 * - Persistence using IndexedDB
 * - Temporal (Undo/Redo) support
 * - Mind map logic (Auto-layout, depth calculation, space management)
 */
export const useStore = create<AppState>()(
  temporal(
    persist(
      immer((set, get) => ({
        // --- Core State ---
        nodes: [],
        edges: [],
        spaces: [],
        activeSpaceId: null,
        branchColors: BRANCH_COLORS,
        
        // --- Core State ---
        layoutDirection: 'TB',
        theme: 'dark' as 'light' | 'dark',
        activePaletteName: 'Aura',
        editingNodeId: null as string | null,
        isBrainstorming: false,
        colorMode: 'branch' as 'branch' | 'depth',
        depthColors: DEFAULT_DEPTH_COLORS,

        // --- Workspace Management ---
        workspaces: [
          { id: 'personal', name: 'Personal', type: 'personal', createdAt: Date.now() }
        ],
        activeWorkspaceId: 'personal',

        createWorkspace: (name) => {
          set((state) => {
            const newWS = {
              id: nanoid(),
              name,
              type: 'project' as const,
              createdAt: Date.now()
            };
            state.workspaces.push(newWS);
          });
        },

        switchWorkspace: (id) => {
          set((state) => {
            state.activeWorkspaceId = id;
          });
        },

        updateWorkspaceName: (id, name) => {
          set((state) => {
             const ws = state.workspaces.find(w => w.id === id);
             if (ws) ws.name = name;
          });
        },

        deleteWorkspace: (id) => {
          set((state) => {
             if (id === 'personal') return; // Cannot delete default
             const wsIndex = state.workspaces.findIndex(w => w.id === id);
             if (wsIndex !== -1) {
               state.workspaces.splice(wsIndex, 1);
             }
             
             // Delete all spaces in that workspace
             let i = state.spaces.length;
             while (i--) {
               if (state.spaces[i].workspaceId === id) {
                 state.spaces.splice(i, 1);
               }
             }
             
             if (state.activeWorkspaceId === id) state.activeWorkspaceId = 'personal';
          });
        },

        // --- Space Management ---

        /**
         * Create a new workspace/space
         * @param name - Display name for the space
         */
        createSpace: (name: string) => {
          set((state) => {
            const rootNode: AppNode = {
              id: 'root-' + nanoid(),
              type: 'mindmap',
              data: { 
                label: name, 
                depth: 0, 
                shape: 'pill' 
              },
              position: { x: 0, y: 0 },
              width: 220,
              height: 80,
            };

            const newSpace: Space = {
              id: nanoid(),
              name,
              nodes: [rootNode],
              edges: [],
              createdAt: Date.now(),
              lastModified: Date.now(),
              theme: state.theme,
              workspaceId: state.activeWorkspaceId || 'personal',
            };
            state.spaces.push(newSpace);
            state.activeSpaceId = newSpace.id;
            state.nodes = newSpace.nodes;
            state.edges = newSpace.edges;
          });
          const self = get() as AppState;
          self.layoutDagre('TB');
        },

        /**
         * Delete a space by ID
         * @param id - ID of the space to delete (defaults to active space)
         */
        deleteSpace: (id: string | null) => {
          set((state) => {
            const spaceId = id || state.activeSpaceId;
            if (!spaceId) return;
            
            const index = state.spaces.findIndex((s) => s.id === spaceId);
            if (index !== -1) {
              state.spaces.splice(index, 1);
            }
            
            if (state.activeSpaceId === spaceId) {
              state.activeSpaceId = null;
              state.nodes = [];
              state.edges = [];
            }
          });
        },

        /**
         * Switch to a different workspace
         * @param id - Target space ID
         */
        switchSpace: (id: string) => {
          set((state) => {
            // Persist current state to active space before switching
            if (state.activeSpaceId) {
              const currentSpace = state.spaces.find((s) => s.id === state.activeSpaceId);
              if (currentSpace) {
                currentSpace.nodes = state.nodes;
                currentSpace.edges = state.edges;
                currentSpace.lastModified = Date.now();
                currentSpace.theme = state.theme;
              }
            }

            const nextSpace = state.spaces.find((s) => s.id === id);
            if (nextSpace) {
              state.activeSpaceId = id;
              state.nodes = nextSpace.nodes;
              state.edges = nextSpace.edges;
              if (nextSpace.theme) state.theme = nextSpace.theme;
            }
          });
        },

        /**
         * Update the name of a specific space
         */
        updateSpaceName: (id: string, name: string) => {
          set((state) => {
            const space = state.spaces.find((s) => s.id === id);
            if (space) space.name = name;
          });
        },

        /**
         * Exit current space to the selection screen
         */
        exitSpace: () => {
          set((state) => {
            if (state.activeSpaceId) {
              const currentSpace = state.spaces.find((s) => s.id === state.activeSpaceId);
              if (currentSpace) {
                currentSpace.nodes = state.nodes;
                currentSpace.edges = state.edges;
                currentSpace.lastModified = Date.now();
                currentSpace.theme = state.theme;
              }
            }
            state.activeSpaceId = null;
            state.nodes = [];
            state.edges = [];
          });
        },

        // --- Node Operations ---

        /**
         * Add a new root node (independent mind map)
         */
        addRootNode: (label = 'New Mind Map', position) => {
          const newNodeId = nanoid();
          const newNode: AppNode = {
            id: newNodeId,
            type: 'mindmap',
            data: { 
              label, 
              depth: 0, 
              shape: 'pill'
            },
            position: position || { x: Math.random() * 400 - 200, y: Math.random() * 400 - 200 },
            width: 220,
            height: 80,
          };

          set((draft) => {
            draft.nodes.forEach(n => { n.selected = false; });
            const nodeWithSelection = { ...newNode, selected: true };
            draft.nodes.push(nodeWithSelection);
          });

          const self = get() as AppState;
          self.recalculateDepths();
        },

        /**
         * Add a new child node
         */
        addNode: (parentNodeId: string, label = 'New Topic') => {
          const state = get() as AppState;
          const parentNode = state.nodes.find((n) => n.id === parentNodeId);
          if (!parentNode) return;

          const newNodeId = nanoid();
          const depth = (parentNode.data.depth ?? 0) + 1;
          
          let color = parentNode.data.color;
          let branchMasterId = parentNode.data.branchMasterId;

          const isRoot = !state.edges.some(e => e.target === parentNodeId);

          if (isRoot) {
            color = BRANCH_COLORS[state.edges.filter(e => e.source === parentNodeId).length % BRANCH_COLORS.length];
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

          const self = get() as AppState;
          self.layoutDagre(self.layoutDirection);
        },

        /**
         * Add a sibling to an existing node
         */
        addSibling: (nodeId: string, label = 'New Topic') => {
          const state = get() as AppState;
          const edgeToNode = state.edges.find(e => e.target === nodeId);
          if (!edgeToNode) return;
          state.addNode(edgeToNode.source, label);
        },

        /**
         * Add multiple nodes at once (e.g., from brainstorming)
         */
        bulkAddNodes: (parentNodeId: string, labels: string[]) => {
          const state = get() as AppState;
          const parentNode = state.nodes.find((n) => n.id === parentNodeId);
          if (!parentNode) return;

          // Temporarily pause undo/redo recording for bulk performance
          const { pause, resume } = useStore.temporal.getState();
          pause();

          set((draft) => {
            labels.forEach((label, index) => {
              if (!label.trim()) return;
              const newNodeId = nanoid();
              const depth = (parentNode.data.depth ?? 0) + 1;
              let color = parentNode.data.color;
              let branchMasterId = parentNode.data.branchMasterId;

              const isRoot = !state.edges.some(e => e.target === parentNodeId);

              if (isRoot) {
                 const existingRootChildren = state.edges.filter(e => e.source === parentNodeId).length;
                 color = BRANCH_COLORS[(existingRootChildren + index) % BRANCH_COLORS.length];
                 branchMasterId = newNodeId;
              }

              draft.nodes.push({
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
              draft.edges.push({ id: `e-${parentNodeId}-${newNodeId}`, source: parentNodeId, target: newNodeId, type: 'custom' });
            });
          });

          const self = get() as AppState;
          self.layoutDagre(self.layoutDirection);
          resume();
        },

        /**
         * Delete a node and all its descendants
         */
        deleteNode: (nodeId: string) => {
          const { edges } = get() as AppState;
          
          const getDescendantIds = (parentId: string): string[] => {
            const children = edges.filter(e => e.source === parentId).map(e => e.target);
            return children.reduce((acc, cid) => [...acc, cid, ...getDescendantIds(cid)], [] as string[]);
          };

          const idsToDelete = [nodeId, ...getDescendantIds(nodeId)];
          set((draft) => {
            draft.nodes = draft.nodes.filter(n => !idsToDelete.includes(n.id));
            draft.edges = draft.edges.filter(e => !idsToDelete.includes(e.source) && !idsToDelete.includes(e.target));
          });
        },

        /**
         * Collapse or expand a node's subtree
         */
        toggleCollapse: (nodeId: string) => {
          const { edges, layoutDagre } = get() as AppState;
          
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
            if (n) n.data.collapsed = !n.data.collapsed;
            draft.nodes.forEach(node => {
              node.hidden = isNodeHidden(node.id, draft.nodes as AppNode[]);
            });
            draft.edges.forEach(edge => {
              edge.hidden = isNodeHidden(edge.target, draft.nodes as AppNode[]);
            });
          });
          
          layoutDagre();
        },


        // --- React Flow Handlers ---

        onNodesChange: (changes) => {
          set((state) => {
            const nextNodes = applyNodeChanges(changes, state.nodes as AppNode[]);
            
            // Sanitize number values to prevent NaN issues in rendering
            state.nodes = nextNodes.map(node => ({
              ...node,
              position: {
                x: isNaN(node.position.x) ? 0 : node.position.x,
                y: isNaN(node.position.y) ? 0 : node.position.y,
              },
              width: isNaN(node.width ?? 0) ? (!state.edges.some(e => e.target === node.id) ? 220 : 180) : node.width,
              height: isNaN(node.height ?? 0) ? (!state.edges.some(e => e.target === node.id) ? 80 : 60) : node.height,
            }));
          });
        },

        onEdgesChange: (changes) => {
          set((state) => {
            state.edges = applyEdgeChanges(changes, state.edges);
          });
        },

        onConnect: (connection) => {
          set((state) => {
            state.edges = addEdge(connection, state.edges);
          });
        },

        // --- Layout & Logic ---

        /**
         * Auto-layout the mind map using Dagre
         * @param direction Layout direction (LR, RL, TB, BT, radial)
         */
        layoutDagre: (direction) => {
          const { layoutDirection: globalDir } = get() as AppState;
          
          set((draft) => {
            let wasAnyRootUpdated = false;

            if (direction) {
              const selectedRootIds = new Set<string>();
              draft.nodes.filter(n => n.selected).forEach(selectedNode => {
                // Find root of this node
                let current: AppNode = selectedNode as AppNode;
                while (true) {
                  const parentEdge = draft.edges.find(e => e.target === current.id);
                  if (!parentEdge) break;
                  const parent = draft.nodes.find(n => n.id === parentEdge.source);
                  if (!parent) break;
                  current = parent;
                }
                selectedRootIds.add(current.id);
              });

              selectedRootIds.forEach(rootId => {
                const root = draft.nodes.find(n => n.id === rootId);
                if (root) {
                  root.data.layoutDirection = direction;
                  wasAnyRootUpdated = true;
                }
              });

              // If no specific tree was targeted, update the global setting
              if (!wasAnyRootUpdated) {
                draft.layoutDirection = direction;
              }
            }

            const activeDirection = direction || globalDir;
            const { nodes: nextNodes, edges: nextEdges } = getLayoutedElements(draft.nodes as AppNode[], draft.edges, activeDirection);

            draft.nodes = nextNodes;
            draft.edges = nextEdges;
            
            // Only update the global default if we didn't update a specific root 
            // OR if there are no nodes yet (initializing)
            if (direction && (!wasAnyRootUpdated || draft.nodes.length === 0)) {
               draft.layoutDirection = direction;
            }
          });
        },

        /**
         * Refresh depths and branch metadata for all nodes
         */
        recalculateDepths: () => {
          set((state) => {
            const { nodes, edges, branchColors } = state;

            const updateSubtree = (id: string, depth: number, bId?: string, bColor?: string, rootColorMode?: 'branch' | 'depth') => {
              const node = nodes.find(n => n.id === id);
              if (!node) return;
              
              node.data.depth = depth;
              node.data.branchMasterId = bId;
              
              const activeColorMode = rootColorMode || state.colorMode;
              if (!node.data.isManualColor && node.data.useBranchColor !== false) {
                if (activeColorMode === 'branch') node.data.color = bColor;
                else node.data.color = state.depthColors[depth % state.depthColors.length];
              }

              const children = edges.filter(e => e.source === id).map(e => e.target);
              children.forEach(cid => {
                let nextBId = bId;
                let nextBColor = bColor;
                
                // If the parent is a root, this child starts a new branch
                const isParentRoot = !edges.some(e => e.target === id);
                if (isParentRoot) {
                  nextBId = cid;
                  const cNode = nodes.find(n => n.id === cid);
                  if (cNode?.data.color && cNode.data.isManualColor) nextBColor = cNode.data.color;
                  else if (cNode?.data.useBranchColor !== false) {
                    const idx = edges.filter(e => e.source === id).findIndex(e => e.target === cid);
                    nextBColor = branchColors[idx % branchColors.length];
                  }
                }
                updateSubtree(cid, depth + 1, nextBId, nextBColor, activeColorMode);
              });
            };

            const roots = nodes.filter(n => !edges.some(e => e.target === n.id));
            
            roots.forEach(root => {
              const activeColorMode = root.data.colorMode || state.colorMode;
              const rootChildren = edges.filter(e => e.source === root.id).map(e => e.target);
              rootChildren.forEach((cid, idx) => {
                const cNode = nodes.find(n => n.id === cid);
                const color = cNode?.data.color || branchColors[idx % branchColors.length];
                updateSubtree(cid, 1, cid, color, activeColorMode);
              });

              root.data.depth = 0;
              delete root.data.branchMasterId;
              if (!root.data.isManualColor) {
                 if (activeColorMode === 'depth') root.data.color = state.depthColors[0];
                 else delete root.data.color;
              }
            });
          });
        },

        // --- Simple Setters ---

        updateNodeLabel: (id, label) => { set((draft) => { const n = draft.nodes.find(x => x.id === id); if (n) n.data.label = label; }); },
        updateNodeShape: (id, shape) => { set((draft) => { const n = draft.nodes.find(x => x.id === id); if (n) n.data.shape = shape; }); },
        updateNodeColor: (id, color, mood) => {
          set((draft) => {
            const n = draft.nodes.find(x => x.id === id);
            if (n) {
              n.data.color = color;
              n.data.mood = mood;
              n.data.isManualColor = !!color;
              n.data.useBranchColor = !color;
            }
          });
        },
        selectNode: (id) => { set((draft) => { draft.nodes.forEach(n => { n.selected = n.id === id; }); }); },
        updateEdgeLabel: (id, label) => { set((draft) => { const e = draft.edges.find(x => x.id === id); if (e) e.label = label; }); },
        toggleTheme: () => { set((state) => { state.theme = state.theme === 'light' ? 'dark' : 'light'; }); },
        setEditingNodeId: (id) => { set((state) => { state.editingNodeId = id; }); },
        setBrainstorming: (val) => { set((state) => { state.isBrainstorming = val; }); },
        setDepthColor: (depth, color) => { set((state) => { state.depthColors[depth] = color; }); },
        setColorMode: (mode) => { 
          set((state) => { 
            state.colorMode = mode; 
            // Also update selected root if any
            const selectedNodes = state.nodes.filter(n => n.selected);
            if (selectedNodes.length > 0) {
              let current = selectedNodes[0];
              while (true) {
                const parentEdge = state.edges.find(e => e.target === current.id);
                if (!parentEdge) break;
                const parent = state.nodes.find(n => n.id === parentEdge.source);
                if (!parent) break;
                current = parent;
              }
              const root = state.nodes.find(n => n.id === current.id);
              if (root) root.data.colorMode = mode;
            }
          }); 
          const self = get() as AppState; self.recalculateDepths();
        },
        setBranchColor: (idx, color) => { 
          set((state) => { state.branchColors[idx] = color; }); 
          const self = get() as AppState; self.recalculateDepths(); 
        },
        applyPalette: (palette) => {
          set((state) => {
            state.depthColors = palette.depth;
            state.branchColors = palette.branch;
            state.activePaletteName = palette.name;

            // Also update selected root if any
            const selectedNodes = state.nodes.filter(n => n.selected);
            if (selectedNodes.length > 0) {
              let current = selectedNodes[0];
              while (true) {
                const parentEdge = state.edges.find(e => e.target === current.id);
                if (!parentEdge) break;
                const parent = state.nodes.find(n => n.id === parentEdge.source);
                if (!parent) break;
                current = parent;
              }
              const root = state.nodes.find(n => n.id === current.id);
              if (root) root.data.activePaletteName = palette.name;
            }
          });
          const self = get() as AppState; self.recalculateDepths();
        },
        importData: (nodes, edges) => {
          set((draft) => {
            draft.nodes = nodes.map(n => ({
              ...n,
              position: { x: isNaN(n.position.x) ? 0 : n.position.x, y: isNaN(n.position.y) ? 0 : n.position.y },
              width: isNaN(n.width ?? 0) ? (!draft.edges.some(e => e.target === n.id) ? 220 : 180) : n.width,
              height: isNaN(n.height ?? 0) ? (!draft.edges.some(e => e.target === n.id) ? 80 : 60) : n.height,
            }));
            draft.edges = edges;
          });
          const self = get() as AppState; self.recalculateDepths();
        },
        toggleTask: (id) => {
          set((draft) => {
            const n = draft.nodes.find(x => x.id === id);
            if (n) { n.data.isTask = !n.data.isTask; if (n.data.isTask && n.data.isCompleted === undefined) n.data.isCompleted = false; }
          });
        },
        toggleComplete: (id) => { set((draft) => { const n = draft.nodes.find(x => x.id === id); if (n) n.data.isCompleted = !n.data.isCompleted; }); },
        reparentNode: (nodeId, newParentId) => {
          if (nodeId === newParentId) return;
          const state = get() as AppState;
          const getDescendants = (id: string): string[] => {
            const children = state.edges.filter(e => e.source === id).map(e => e.target);
            return children.reduce((acc, cid) => [...acc, cid, ...getDescendants(cid)], [] as string[]);
          };
          if (getDescendants(nodeId).includes(newParentId)) return;
          set((draft) => {
            draft.edges = draft.edges.filter(e => e.target !== nodeId);
            draft.edges.push({ id: `e-${newParentId}-${nodeId}`, source: newParentId, target: nodeId, type: 'custom' });
          });
          const self = get() as AppState; self.recalculateDepths(); self.layoutDagre();
        },
      })),
      {
        name: 'mindmap-app-persistence',
        storage: createJSONStorage(() => idbStorage),
        partialize: (state: AppState) => ({ 
          nodes: state.nodes, 
          edges: state.edges, 
          theme: state.theme,
          spaces: state.spaces,
          activeSpaceId: state.activeSpaceId,
          depthColors: state.depthColors,
          branchColors: state.branchColors,
          colorMode: state.colorMode,
          activePaletteName: state.activePaletteName
        }),
      }
    ),
    { limit: 100 } // Undo/Redo limit
  )
);
