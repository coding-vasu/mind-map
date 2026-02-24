import React, { useRef, useMemo, useEffect } from 'react';
import { 
  Download, 
  Upload, 
  Trash2, 
  Plus, 
  Undo2, 
  Redo2, 
  Moon, 
  Sun, 
  Edit2, 
  Zap, 
  GitBranchPlus, 
  Image,
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

/**
 * Main Toolbar component that provides controls for the mind map
 */
export const Toolbar: React.FC = () => {
  const {
    nodes,
    edges,
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
  } = useStore(useShallow((state) => ({
    nodes: state.nodes,
    edges: state.edges,
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

  // Static Configuration
  const nodeMoods = useMemo(() => [
    { name: 'Neutral', color: theme === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)', icon: <CircleDot size={14} /> },
    { name: 'Idea', color: 'rgba(124, 58, 237, 0.6)', icon: <Lightbulb size={14} /> },
    { name: 'Task', color: 'rgba(59, 130, 246, 0.6)', icon: <CheckCircle2 size={14} /> },
    { name: 'Alert', color: 'rgba(239, 68, 68, 0.6)', icon: <AlertTriangle size={14} /> },
    { name: 'Pending', color: 'rgba(245, 158, 11, 0.6)', icon: <Clock size={14} /> },
    { name: 'Solved', color: 'rgba(16, 185, 129, 0.6)', icon: <CheckCircle2 size={14} /> },
  ], [theme]);

  const layerLabels = ['Primary', 'Major', 'Minor', 'Branch', 'Detail', 'Twig'];

  const nodeShapes = [
    { name: 'Classic', value: 'rect', icon: <Square size={14} /> },
    { name: 'Pill', value: 'pill', icon: <div style={{ width: '14px', height: '10px', borderRadius: '5px', border: '1.5px solid currentColor' }} /> },
    { name: 'Diamond', value: 'diamond', icon: <Diamond size={14} /> },
    { name: 'Hexagon', value: 'hexagon', icon: <Hexagon size={14} /> },
    { name: 'Capsule', value: 'capsule', icon: <div style={{ width: '16px', height: '10px', borderRadius: '10px', background: 'currentColor', opacity: 0.5 }} /> },
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
    const element = document.querySelector('.react-flow__viewport') as HTMLElement;
    if (!element) return;
    toPng(element, {
      backgroundColor: theme === 'dark' ? '#0a0a0f' : '#f4f4f9',
      cacheBust: true,
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = 'mindmap.png';
        link.href = dataUrl;
        link.click();
      })
      .catch(err => console.error('Image export failed:', err));
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

  return (
    <div className="frosted-glass animate-slide-in" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 6px',
      borderRadius: '32px',
    }}>
      {/* Home & Space Name */}
      <div style={{ display: 'flex', gap: '4px', padding: '0 8px', borderRight: '1px solid var(--color-border-subtle)', alignItems: 'center' }}>
        <ToolbarButton onClick={exitSpace} title="All Spaces" icon={<Home size={20} />} />
        {activeSpace && (
          <div style={{ 
            fontSize: '13px', 
            fontWeight: 700, 
            color: 'var(--color-text-primary)',
            padding: '0 8px',
            maxWidth: '120px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            opacity: 0.8
          }}>
            {activeSpace.name}
          </div>
        )}
      </div>

      {/* Node Actions */}
      <div style={{ display: 'flex', gap: '4px', padding: '0 8px', borderRight: '1px solid var(--color-border-subtle)' }}>
        <ToolbarButton 
          onClick={() => setBrainstorming(!isBrainstorming)} 
          title="Brainstorm Mode (B)" 
          active={isBrainstorming}
          icon={<Zap size={20} fill={isBrainstorming ? 'currentColor' : 'none'} />} 
        />
        <div style={{ width: '1px', height: '24px', background: 'var(--color-border-subtle)', margin: '0 4px' }} />
        <ToolbarButton 
          onClick={() => addNode(selectedNodes[0]?.id || 'root')} 
          title="Add Child (Tab)" 
          icon={<Plus size={20} />} 
        />
        <ToolbarButton 
          onClick={() => selectedNodes[0] && addSibling(selectedNodes[0].id)} 
          title="Add Sibling (Enter)" 
          disabled={selectedNodes.length === 0 || selectedNodes[0].id === 'root'} 
          icon={<GitBranchPlus size={20} />} 
        />
        <ToolbarButton 
          onClick={() => deleteNode(selectedNodes[0].id)} 
          title="Delete Node (Del)" 
          disabled={selectedNodes.length === 0 || selectedNodes[0].id === 'root'} 
          icon={<Trash2 size={20} />} 
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
      <div style={{ display: 'flex', gap: '4px', padding: '0 8px', borderRight: '1px solid var(--color-border-subtle)' }}>
        <ToolbarButton onClick={undo} title="Undo (⌘Z)" disabled={pastStates.length === 0} icon={<Undo2 size={20} />} />
        <ToolbarButton onClick={redo} title="Redo (⌘⇧Z)" disabled={futureStates.length === 0} icon={<Redo2 size={20} />} />
        <ToolbarButton 
          onClick={toggleTheme} 
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`} 
          icon={theme === 'light' ? <Moon size={20} /> : <Sun size={20} />} 
        />
      </div>

      {/* Overlays (Appearance & Layout) */}
      <div style={{ display: 'flex', gap: '4px', padding: '0 8px', borderRight: '1px solid var(--color-border-subtle)' }}>
        <LayoutPopover layoutDagre={layoutDagre} layoutDirection={layoutDirection} />
        <AppearancePopover 
          selectedNodes={selectedNodes}
          updateNodeColor={updateNodeColor}
          updateNodeShape={updateNodeShape}
          depthColors={depthColors}
          setDepthColor={setDepthColor}
          recalculateDepths={recalculateDepths}
          colorMode={colorMode}
          setColorMode={setColorMode}
          applyPalette={applyPalette}
          activePaletteName={activePaletteName}
          palettes={palettes}
          nodeMoods={nodeMoods}
          nodeShapes={nodeShapes}
          layerLabels={layerLabels}
        />
      </div>

      {/* IO Actions */}
      <div style={{ display: 'flex', gap: '4px', padding: '0 8px', borderRight: '1px solid var(--color-border-subtle)' }}>
        <ToolbarButton onClick={onExportImage} title="Export Image" icon={<Image size={20} />} />
        <ToolbarButton onClick={onExport} title="Save File" icon={<Download size={20} />} />
        <ToolbarButton onClick={() => fileInputRef.current?.click()} title="Open File" icon={<Upload size={20} />} />
        <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".json" onChange={handleFileChange} />
      </div>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '16px', paddingRight: '12px', minWidth: '240px' }}>
        <SearchInput nodes={nodes} />
      </div>
    </div>
  );
};
