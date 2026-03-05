import { useEffect, useRef } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { MindMapCanvas } from './components/MindMapCanvas';
import { SpaceManager } from './components/SpaceManager';
import { useStore } from './store';

function App() {
  const { activeSpaceId, createSpace, theme } = useStore();
  const migrationRan = useRef(false);

  // Apply theme to document root whenever it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // One-time migration: if legacy nodes exist with no spaces, migrate them into a default space
  useEffect(() => {
    if (migrationRan.current) return;
    const state = useStore.getState();
    if (state.spaces.length === 0 && state.nodes.length > 0 && state.nodes.some(n => n.id === 'root')) {
      migrationRan.current = true;
      const legacyNodes = state.nodes;
      const legacyEdges = state.edges;
      createSpace('My First Mind Map');
      // Re-read state after createSpace has run and overwrite with the legacy data
      useStore.getState().importData(legacyNodes, legacyEdges);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <ReactFlowProvider>
      {activeSpaceId ? <MindMapCanvas /> : <SpaceManager />}
    </ReactFlowProvider>
  );
}

export default App;
