import { useHotkeys } from 'react-hotkeys-hook';
import { useStore } from '../store';

/**
 * Custom hook to handle all mind map related keyboard shortcuts
 */
export const useMindMapHotkeys = () => {
  const {
    nodes,
    edges,
    addNode,
    addSibling,
    deleteNode,
    selectNode,
    setEditingNodeId,
    layoutDirection,
    setBrainstorming,
    isBrainstorming,
  } = useStore();

  const selectedNodes = nodes.filter((n) => n.selected);

  // Delete node
  useHotkeys('backspace, delete', () => {
    selectedNodes.forEach((node) => deleteNode(node.id));
  }, { enableOnFormTags: false }, [selectedNodes, deleteNode]);

  // Add child
  useHotkeys('tab', (e) => {
    e.preventDefault();
    if (selectedNodes.length === 1) {
      addNode(selectedNodes[0].id);
    }
  }, { enableOnFormTags: false }, [selectedNodes, addNode]);

  // Add sibling
  useHotkeys('enter', (e) => {
    e.preventDefault();
    if (selectedNodes.length === 1 && selectedNodes[0].id !== 'root') {
      addSibling(selectedNodes[0].id);
    }
  }, { enableOnFormTags: false }, [selectedNodes, addSibling]);

  // Undo
  useHotkeys('meta+z, ctrl+z', (e) => {
    e.preventDefault();
    useStore.temporal.getState().undo();
  }, { enableOnFormTags: false }, []);

  // Redo
  useHotkeys('meta+shift+z, ctrl+shift+z', (e) => {
    e.preventDefault();
    useStore.temporal.getState().redo();
  }, { enableOnFormTags: false }, []);

  // Edit label
  useHotkeys('space', (e) => {
    e.preventDefault();
    if (selectedNodes.length === 1) {
      setEditingNodeId(selectedNodes[0].id);
    }
  }, { enableOnFormTags: false }, [selectedNodes, setEditingNodeId]);

  // Toggle Brainstorm mode
  useHotkeys('b', (e) => {
    e.preventDefault();
    setBrainstorming(!isBrainstorming);
  }, { enableOnFormTags: false }, [isBrainstorming, setBrainstorming]);

  // Navigation: UP
  useHotkeys('up', (e) => {
    e.preventDefault();
    if (selectedNodes.length !== 1) return;
    const current = selectedNodes[0];
    const siblings = edges.filter(e => e.source === edges.find(ed => ed.target === current.id)?.source).map(e => e.target);
    const idx = siblings.indexOf(current.id);
    
    if (idx > 0) {
      selectNode(siblings[idx - 1]);
    } else if (layoutDirection === 'BT') {
      const childEdge = edges.find(e => e.source === current.id);
      if (childEdge) selectNode(childEdge.target);
    } else if (layoutDirection === 'TB') {
      const parentEdge = edges.find(e => e.target === current.id);
      if (parentEdge) selectNode(parentEdge.source);
    }
  }, { enableOnFormTags: false }, [selectedNodes, edges, selectNode, layoutDirection]);

  // Navigation: DOWN
  useHotkeys('down', (e) => {
    e.preventDefault();
    if (selectedNodes.length !== 1) return;
    const current = selectedNodes[0];
    const siblings = edges.filter(e => e.source === edges.find(ed => ed.target === current.id)?.source).map(e => e.target);
    const idx = siblings.indexOf(current.id);
    
    if (idx < siblings.length - 1) {
      selectNode(siblings[idx + 1]);
    } else if (layoutDirection === 'TB') {
      const childEdge = edges.find(e => e.source === current.id);
      if (childEdge) selectNode(childEdge.target);
    } else if (layoutDirection === 'BT') {
      const parentEdge = edges.find(e => e.target === current.id);
      if (parentEdge) selectNode(parentEdge.source);
    }
  }, { enableOnFormTags: false }, [selectedNodes, edges, selectNode, layoutDirection]);

  // Navigation: LEFT
  useHotkeys('left', (e) => {
    e.preventDefault();
    if (selectedNodes.length !== 1) return;
    const current = selectedNodes[0];
    
    if (layoutDirection === 'radial') {
      if (current.id === 'root') {
        const leftChildren = edges.filter(e => e.source === 'root' && e.sourceHandle === 'left').map(e => e.target);
        if (leftChildren.length > 0) selectNode(leftChildren[0]);
      } else if (current.position.x < 0) {
        const childEdge = edges.find(e => e.source === current.id);
        if (childEdge) selectNode(childEdge.target);
      } else {
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

  // Navigation: RIGHT
  useHotkeys('right', (e) => {
    e.preventDefault();
    if (selectedNodes.length !== 1) return;
    const current = selectedNodes[0];

    if (layoutDirection === 'radial') {
      if (current.id === 'root') {
        const rightChildren = edges.filter(e => e.source === 'root' && e.sourceHandle === 'right').map(e => e.target);
        if (rightChildren.length > 0) selectNode(rightChildren[0]);
      } else if (current.position.x < 0) {
        const parentEdge = edges.find(e => e.target === current.id);
        if (parentEdge) selectNode(parentEdge.source);
      } else {
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
};
