import React, { useRef, useMemo, useEffect } from 'react';
import { 
  Trash2, 
  Plus, 
  Undo2, 
  Redo2, 
  Moon, 
  Sun, 
  Edit2, 
  Zap, 
  GitBranchPlus, 
  Home,
  CircleDot,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Square,
  Diamond,
  Hexagon
} from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useStore as useZustandStore } from 'zustand';
import { toPng } from 'html-to-image';

import { useStore } from '../store';
import { ToolbarButton } from './toolbar/ToolbarButton';
import { SearchInput } from './toolbar/SearchInput';
import { LayoutPopover } from './toolbar/LayoutPopover';
import { AppearancePopover } from './toolbar/AppearancePopover';
import { IOPopover } from './toolbar/IOPopover';

/**
 * Main Toolbar component that provides controls for the mind map
 */
export const Toolbar: React.FC = () => {
  const {
    nodes,
    edges,
    addRootNode,
    addNode,
    addSibling,
    deleteNode,
    layoutDagre,
    layoutDirection,
    updateNodeColor,
    updateNodeShape,
    importData,
    depthColors,
    setDepthColor,
    recalculateDepths,
    updateEdgeLabel,
    theme,
    toggleTheme,
    isBrainstorming,
    setBrainstorming,
    colorMode,
    setColorMode,
    applyPalette,
    activePaletteName,
    exitSpace,
    spaces,
    activeSpaceId,
    updateSpaceName,
  } = useStore(useShallow((state) => ({
    nodes: state.nodes,
    edges: state.edges,
    addRootNode: state.addRootNode,
    addNode: state.addNode,
    addSibling: state.addSibling,
    deleteNode: state.deleteNode,
    layoutDagre: state.layoutDagre,
    layoutDirection: state.layoutDirection,
    updateNodeColor: state.updateNodeColor,
    updateNodeShape: state.updateNodeShape,
    importData: state.importData,
    depthColors: state.depthColors,
    setDepthColor: state.setDepthColor,
    recalculateDepths: state.recalculateDepths,
    updateEdgeLabel: state.updateEdgeLabel,
    theme: state.theme,
    toggleTheme: state.toggleTheme,
    isBrainstorming: state.isBrainstorming,
    setBrainstorming: state.setBrainstorming,
    colorMode: state.colorMode,
    setColorMode: state.setColorMode,
    applyPalette: state.applyPalette,
    activePaletteName: state.activePaletteName,
    exitSpace: state.exitSpace,
    spaces: state.spaces,
    activeSpaceId: state.activeSpaceId,
    updateSpaceName: state.updateSpaceName,
  })));


  const { undo, redo, pastStates, futureStates } = useZustandStore(
    useStore.temporal,
    useShallow((state) => ({
      undo: state.undo,
      redo: state.redo,
      pastStates: state.pastStates,
      futureStates: state.futureStates,
    }))
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeSpace = useMemo(() => spaces.find(s => s.id === activeSpaceId), [spaces, activeSpaceId]);
  const selectedNodes = useMemo(() => nodes.filter((n) => n.selected), [nodes]);
  const selectedEdges = useMemo(() => edges.filter((e) => e.selected), [edges]);
  
  // Calculate the layout direction for the selected node's root
  const displayLayoutDirection = useMemo(() => {
    if (selectedNodes.length === 0) return layoutDirection;
    
    // Find the root node for the first selected node
    let current = selectedNodes[0];
    const processedIds = new Set<string>();
    
    while (current) {
      if (processedIds.has(current.id)) break;
      processedIds.add(current.id);
      
      const parentEdge = edges.find(e => e.target === current.id);
      if (!parentEdge) break;
      const parent = nodes.find(n => n.id === parentEdge.source);
      if (!parent) break;
      current = parent;
    }
    
    return current?.data?.layoutDirection || layoutDirection;
  }, [selectedNodes, nodes, edges, layoutDirection]);

  // Calculate the color mode and palette for the selected node's root
  const { displayColorMode, displayPaletteName } = useMemo(() => {
    if (selectedNodes.length === 0) return { displayColorMode: colorMode, displayPaletteName: activePaletteName };
    
    // Find the root node for the first selected node
    let current = selectedNodes[0];
    const processedIds = new Set<string>();
    
    while (current) {
      if (processedIds.has(current.id)) break;
      processedIds.add(current.id);
      
      const parentEdge = edges.find(e => e.target === current.id);
      if (!parentEdge) break;
      const parent = nodes.find(n => n.id === parentEdge.source);
      if (!parent) break;
      current = parent;
    }
    
    return {
      displayColorMode: current?.data?.colorMode || colorMode,
      displayPaletteName: current?.data?.activePaletteName || activePaletteName
    };
  }, [selectedNodes, nodes, edges, colorMode, activePaletteName]);

  // Static Configuration
  const nodeMoods = useMemo(() => [
    { name: 'Neutral', color: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)', icon: <CircleDot size={12} /> },
    { name: 'Idea', color: 'rgba(124, 58, 237, 0.6)', icon: <Lightbulb size={12} /> },
    { name: 'Task', color: 'rgba(59, 130, 246, 0.6)', icon: <CheckCircle2 size={12} /> },
    { name: 'Alert', color: 'rgba(239, 68, 68, 0.6)', icon: <AlertTriangle size={12} /> },
    { name: 'Pending', color: 'rgba(245, 158, 11, 0.6)', icon: <Clock size={12} /> },
    { name: 'Solved', color: 'rgba(16, 185, 129, 0.6)', icon: <CheckCircle2 size={12} /> },
  ], [theme]);

  const layerLabels = ['Primary', 'Major', 'Minor', 'Branch', 'Detail', 'Twig'];

  const nodeShapes = [
    { name: 'Classic', value: 'rect', icon: <Square size={12} /> },
    { name: 'Pill', value: 'pill', icon: <div style={{ width: '12px', height: '8px', borderRadius: '4px', border: '1.2px solid currentColor' }} /> },
    { name: 'Diamond', value: 'diamond', icon: <Diamond size={12} /> },
    { name: 'Hexagon', value: 'hexagon', icon: <Hexagon size={12} /> },
    { name: 'Capsule', value: 'capsule', icon: <div style={{ width: '14px', height: '8px', borderRadius: '8px', background: 'currentColor', opacity: 0.5 }} /> },
  ] as const;

  const palettes = useMemo(() => [
    { 
      name: 'Aura', 
      depth: ['#7c3aed', '#a855f7', '#ec4899', '#ef4444', '#f59e0b', '#10b981'],
      branch: ['#a855f7', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#06b6d4']
    },
    {
      name: 'Oceanic',
      depth: ['#0369a1', '#0ea5e9', '#06b6d4', '#10b981', '#f43f5e', '#fb923c'],
      branch: ['#0369a1', '#06b6d4', '#14b8a6', '#10b981', '#f43f5e', '#fb923c', '#8b5cf6']
    },
    {
      name: 'Cyber',
      depth: ['#06b6d4', '#d946ef', '#facc15', '#4ade80', '#f43f5e', '#8b5cf6'],
      branch: ['#06b6d4', '#d946ef', '#facc15', '#4ade80', '#f43f5e', '#8b5cf6', '#0ea5e9']
    }
  ], []);

  // Handlers
  const onExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ nodes, edges }, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "mindmap.json");
    document.body.appendChild(downloadAnchorNode); 
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const onExportImage = () => {
    // Target the viewport to avoid capturing ambient blobs and heavy background effects
    const viewportElement = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!viewportElement) return;

    // Hide UI elements during capture
    const reactFlow = document.querySelector('.react-flow') as HTMLElement;
    const controls = reactFlow?.querySelector('.react-flow__controls') as HTMLElement;
    const minimap = reactFlow?.querySelector('.react-flow__minimap') as HTMLElement;
    const attribution = reactFlow?.querySelector('.react-flow__attribution') as HTMLElement;

    if (controls) controls.style.display = 'none';
    if (minimap) minimap.style.display = 'none';
    if (attribution) attribution.style.display = 'none';

    // Capture the refined viewport
    toPng(viewportElement, {
      backgroundColor: theme === 'dark' ? '#0a0a0f' : '#f8f9ff',
      cacheBust: true,
      pixelRatio: 1.5, // Balanced for quality vs memory
      skipFonts: true,
      filter: (node) => {
        // Skip any UI elements or heavy effects that might have leaked into the viewport
        if (node.classList?.contains('react-flow__controls')) return false;
        if (node.classList?.contains('react-flow__minimap')) return false;
        return true;
      }
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `mindmap-${activeSpace?.name || 'capture'}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch(err => {
        console.error('Image capture failed:', err);
        alert('Capture failed. For large maps, try zooming in closer to a specific section before exporting.');
      })
      .finally(() => {
        if (controls) controls.style.display = 'flex';
        if (minimap) minimap.style.display = 'block';
        if (attribution) attribution.style.display = 'block';
      });
  };

  const onExportJSON = () => {
    onExport();
  };

  const onImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target?.result as string);
          if (data.nodes && data.edges) importData(data.nodes, data.edges);
        } catch (err) {
          console.error('Failed to import data:', err);
        }
      };
      reader.readAsText(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const [isRenamingSpace, setIsRenamingSpace] = React.useState(false);
  const spaceRenameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenamingSpace && spaceRenameInputRef.current) {
      spaceRenameInputRef.current.focus();
      spaceRenameInputRef.current.select();
    }
  }, [isRenamingSpace]);

  return (
    <div className="frosted-glass animate-slide-in" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '2px',
      padding: '2px 4px',
      borderRadius: '24px',
    }}>
      {/* Home & Space Name */}
      <div style={{ display: 'flex', gap: '2px', padding: '0 6px', borderRight: '1px solid var(--color-border-subtle)', alignItems: 'center' }}>
        <ToolbarButton onClick={exitSpace} title="All Spaces" icon={<Home size={18} />} />
        {activeSpace && (
          isRenamingSpace ? (
            <input
              ref={spaceRenameInputRef}
              value={activeSpace.name}
              onChange={(e) => updateSpaceName(activeSpace.id, e.target.value)}
              onBlur={() => setIsRenamingSpace(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsRenamingSpace(false);
                if (e.key === 'Escape') setIsRenamingSpace(false);
              }}
              style={{ 
                fontSize: '13px', 
                fontWeight: 700, 
                color: 'var(--color-text-primary)',
                padding: '2px 8px',
                maxWidth: '120px',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid var(--color-accent-bright)',
                outline: 'none',
                borderRadius: '6px',
              }}
            />
          ) : (
            <div 
              onDoubleClick={() => setIsRenamingSpace(true)}
              style={{ 
                fontSize: '13px', 
                fontWeight: 700, 
                color: 'var(--color-text-primary)',
                padding: '2px 8px',
                maxWidth: '120px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                opacity: 0.8,
                cursor: 'pointer',
                borderRadius: '4px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              title="Double click to rename"
            >
              {activeSpace.name}
            </div>
          )
        )}
      </div>

      {/* Node Actions */}
      <div style={{ display: 'flex', gap: '2px', padding: '0 6px', borderRight: '1px solid var(--color-border-subtle)' }}>
        <ToolbarButton 
          onClick={() => setBrainstorming(!isBrainstorming)} 
          title="Brainstorm Mode (B)" 
          active={isBrainstorming}
          icon={<Zap size={18} fill={isBrainstorming ? 'currentColor' : 'none'} />} 
        />
        <ToolbarButton 
          onClick={() => addRootNode()} 
          title="Add New Mind Map (Option+N)" 
          icon={<GitBranchPlus size={18} />} 
        />
        <div style={{ width: '1px', height: '20px', background: 'var(--color-border-subtle)', margin: '0 2px' }} />
        <ToolbarButton 
          onClick={() => addNode(selectedNodes[0]?.id || 'root')} 
          title="Add Child (Tab)" 
          icon={<Plus size={18} />} 
        />
        <ToolbarButton 
          onClick={() => selectedNodes[0] && addSibling(selectedNodes[0].id)} 
          title="Add Sibling (Enter)" 
          disabled={selectedNodes.length === 0 || selectedNodes[0].id === 'root'} 
          icon={<GitBranchPlus size={18} />} 
        />
        <ToolbarButton 
          onClick={() => deleteNode(selectedNodes[0].id)} 
          title="Delete Node (Del)" 
          disabled={selectedNodes.length === 0 || selectedNodes[0].id === 'root'} 
          icon={<Trash2 size={18} />} 
        />
      </div>

      {/* Edge Editing */}
      {selectedEdges.length === 1 && (
        <div style={{ display: 'flex', gap: '8px', padding: '0 12px', alignItems: 'center', borderRight: '1px solid var(--color-border-subtle)' }}>
          <Edit2 size={16} color="var(--color-text-secondary)" />
          <input
            style={{
              background: 'var(--color-bg-base)',
              border: 'none',
              borderRadius: '8px',
              color: 'var(--color-text-primary)',
              fontSize: '12px',
              padding: '6px 10px',
              outline: 'none',
              width: '120px',
              fontFamily: 'var(--font-mono)'
            }}
            placeholder="Link label..."
            value={(selectedEdges[0].label as string) || ''}
            onChange={(e) => updateEdgeLabel(selectedEdges[0].id, e.target.value)}
          />
        </div>
      )}

      {/* History & Theme */}
      <div style={{ display: 'flex', gap: '2px', padding: '0 6px', borderRight: '1px solid var(--color-border-subtle)' }}>
        <ToolbarButton onClick={undo} title="Undo (⌘Z)" disabled={pastStates.length === 0} icon={<Undo2 size={18} />} />
        <ToolbarButton onClick={redo} title="Redo (⌘⇧Z)" disabled={futureStates.length === 0} icon={<Redo2 size={18} />} />
        <ToolbarButton 
          onClick={toggleTheme} 
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`} 
          icon={theme === 'light' ? <Moon size={18} /> : <Sun size={18} />} 
        />
      </div>

      {/* Overlays (Appearance & Layout) */}
      <div style={{ display: 'flex', gap: '2px', padding: '0 6px', borderRight: '1px solid var(--color-border-subtle)' }}>
        <LayoutPopover layoutDagre={layoutDagre} layoutDirection={displayLayoutDirection} />
        <AppearancePopover 
          selectedNodes={selectedNodes}
          updateNodeColor={updateNodeColor}
          updateNodeShape={updateNodeShape}
          depthColors={depthColors}
          setDepthColor={setDepthColor}
          recalculateDepths={recalculateDepths}
          colorMode={displayColorMode}
          setColorMode={setColorMode}
          applyPalette={applyPalette}
          activePaletteName={displayPaletteName}
          palettes={palettes}
          nodeMoods={nodeMoods}
          nodeShapes={nodeShapes}
          layerLabels={layerLabels}
        />
      </div>

      {/* IO Actions */}
      <div style={{ display: 'flex', gap: '2px', padding: '0 6px' }}>
        <IOPopover 
          onExportImage={onExportImage}
          onExportJSON={onExportJSON}
          onImportClick={onImportClick}
        />
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json" onChange={handleFileChange} />
      </div>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', paddingLeft: '4px', paddingRight: '4px' }}>
        <SearchInput nodes={nodes} />
      </div>
    </div>
  );
};
