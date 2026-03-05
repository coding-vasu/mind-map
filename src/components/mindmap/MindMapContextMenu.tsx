import React from 'react';
import * as ContextMenu from '@radix-ui/react-context-menu';
import { Plus, Layout, Trash2, GitBranchPlus, CheckSquare } from 'lucide-react';
import { type AppNode } from '../../store/types';

interface MindMapContextMenuProps {
  children: React.ReactNode;
  selectedNodes: AppNode[];
  addRootNode: (label?: string, position?: { x: number, y: number }) => void;
  addNode: (parentNodeId: string) => void;
  addSibling: (nodeId: string) => void;
  toggleTask: (nodeId: string) => void;
  layoutDagre: () => void;
  deleteNode: (nodeId: string) => void;
}

/**
 * Context menu for the mind map canvas
 */
export const MindMapContextMenu: React.FC<MindMapContextMenuProps> = ({
  children,
  selectedNodes,
  addRootNode,
  addNode,
  addSibling,
  toggleTask,
  layoutDagre,
  deleteNode,
}) => {
  return (
    <ContextMenu.Root>
      <ContextMenu.Trigger asChild>
        {children}
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
              // We want to add a root at the cursor position
              addRootNode();
            }}
          >
            <GitBranchPlus size={15} /> Add New Mind Map
          </ContextMenu.Item>

          <ContextMenu.Separator style={{ height: '1px', background: 'var(--color-border-subtle)', margin: '4px 8px' }} />

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
  );
};
