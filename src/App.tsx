import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import { MindMapCanvas } from './components/MindMapCanvas';
import { SpaceManager } from './components/SpaceManager';
import { useStore } from './store';

function App() {
  const { activeSpaceId, spaces, nodes, edges, createSpace } = useStore();

  // Migration logic: If there are existing nodes but no spaces, create a default space
  useEffect(() => {
    if (spaces.length === 0 && nodes.length > 0 && nodes.some(n => n.id === 'root')) {
      // We have data but no spaces. Create a default one.
      const name = "My First Mind Map";
      createSpace(name);
      
      const state = useStore.getState();
      state.importData(nodes, edges);
    }
  }, [spaces.length, nodes, edges, createSpace]); 

  return (
    <ReactFlowProvider>
      {activeSpaceId ? <MindMapCanvas /> : <SpaceManager />}
    </ReactFlowProvider>
  );
}

export default App;
