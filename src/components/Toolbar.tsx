import { useStore, type AppNode } from '../store';
import { Layout, Download, Upload, Trash2, Plus, Palette, Undo2, Redo2, Search, RotateCcw, Image, GitBranchPlus, Square, Edit2, Sun, Moon, ArrowRight, ArrowDown, ArrowLeft, ArrowUp, Zap, CircleDot, Lightbulb, CheckCircle2, AlertTriangle, Clock, Diamond, Hexagon, Home } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useRef, useMemo, useState, useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import Fuse from 'fuse.js';
import { useStore as useZustandStore } from 'zustand';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Popover from '@radix-ui/react-popover';
import { toPng } from 'html-to-image';

const rgbaToHex = (rgba: string): string => {
  const match = rgba.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
  if (!match) return '#7c3aed';
  const r = parseInt(match[1]).toString(16).padStart(2, '0');
  const g = parseInt(match[2]).toString(16).padStart(2, '0');
  const b = parseInt(match[3]).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
};

const ToolbarButton = ({ 
  onClick, 
  icon, 
  title, 
  disabled = false, 
  active = false 
}: { 
  onClick: () => void; 
  icon: React.ReactNode; 
  title: string; 
  disabled?: boolean;
  active?: boolean;
}) => (
  <Tooltip.Provider delayDuration={400}>
    <Tooltip.Root>
      <Tooltip.Trigger asChild>
        <button 
          className="dock-item" 
          onClick={onClick} 
          disabled={disabled}
          style={{ 
            color: active ? 'var(--color-accent-bright)' : 'var(--color-text-secondary)',
            background: active ? 'var(--color-bg-glass-hover)' : 'transparent',
            boxShadow: active ? '0 0 20px var(--color-accent-glow)' : 'none',
            border: active ? '1px solid var(--color-accent-bright)' : '1px solid transparent',
            opacity: disabled ? 0.4 : 1,
            cursor: disabled ? 'not-allowed' : 'pointer',
            padding: '8px',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
            position: 'relative',
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.transform = 'scale(1.15) translateY(-4px)';
              e.currentTarget.style.background = 'var(--color-bg-glass-hover)';
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled) {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.background = active ? 'var(--color-bg-glass-hover)' : 'transparent';
            }
          }}
        >
          {icon}
        </button>
      </Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content 
          className="glass-panel" 
          sideOffset={14}
          style={{ 
            padding: '6px 12px', 
            fontSize: '12px', 
            fontWeight: 600,
            fontFamily: 'var(--font-body)',
            color: 'var(--color-text-primary)',
            zIndex: 100,
            animation: 'slide-up 0.2s ease-out'
          }}
        >
          {title}
          <Tooltip.Arrow style={{ fill: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)' }} />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  </Tooltip.Provider>
);

export const Toolbar = () => {
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

  const activeSpace = useMemo(() => spaces.find(s => s.id === activeSpaceId), [spaces, activeSpaceId]);


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
  ];

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

  const selectedNodes = useMemo(() => nodes.filter((n) => n.selected), [nodes]);
  const selectedEdges = useMemo(() => edges.filter((e) => e.selected), [edges]);
  
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
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'theme' | 'style' | 'layers'>('theme');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  
  const { getNodes, setNodes, setCenter } = useReactFlow();

  const handleSearchResultClick = (node: AppNode) => {
    setNodes((nds) => nds.map(n => ({
      ...n, 
      selected: n.id === node.id
    })));
    setCenter(node.position.x + 70, node.position.y + 20, { zoom: 1.5, duration: 800 });
    setLocalSearchQuery('');
  };

  const handleShapeChange = (shape: 'rect' | 'pill' | 'diamond' | 'hexagon' | 'capsule') => {
    selectedNodes.forEach((node) => updateNodeShape(node.id, shape));
  };

  const handleColorChange = (color: string | undefined, mood?: string) => {
    selectedNodes.forEach((node) => updateNodeColor(node.id, color, mood));
  };

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
      .catch((err) => {
        console.error('Image export failed:', err);
      });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        try {
          const data = JSON.parse(content);
          if (data.nodes && data.edges) {
            importData(data.nodes, data.edges);
          }
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

  const searchResults = useMemo(() => {
    if (localSearchQuery.trim() === "") return [];

    const fuse = new Fuse(getNodes(), { 
      keys: ['data.label'], 
      threshold: 0.4,
      distance: 100,
    });
    const results = fuse.search(localSearchQuery);
    return results.map(r => r.item as AppNode).slice(0, 8);
  }, [localSearchQuery, getNodes]);


  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (searchResults.length > 0) {
      const ghostText = getGhostText();
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selectedNode = selectedIndex >= 0 ? searchResults[selectedIndex] : searchResults[0];
        if (selectedNode) handleSearchResultClick(selectedNode);
      } else if ((e.key === 'Tab' || e.key === 'ArrowRight') && ghostText && selectedIndex <= 0) {
        e.preventDefault();
        const firstLabel = (searchResults[0].data?.label as string) || '';
        setLocalSearchQuery(firstLabel);
      }
    }
    if (e.key === 'Escape') {
      setLocalSearchQuery('');
    }
  };

  const getGhostText = () => {
    if (!localSearchQuery || searchResults.length === 0) return '';
    const firstResult = (searchResults[0].data?.label as string) || '';
    if (firstResult.toLowerCase().startsWith(localSearchQuery.toLowerCase())) {
      return firstResult.slice(localSearchQuery.length);
    }
    return '';
  };

  return (
    <div className="glass-panel animate-slide-in" style={{
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 6px',
      zIndex: 10,
      margin: '0 auto 32px auto',
      borderRadius: '32px',
      border: '1px solid var(--color-border-subtle)',
      boxShadow: 'var(--shadow-dock)',
      background: 'var(--color-bg-glass)',
      transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
    }}>
      <div style={{ display: 'flex', gap: '4px', padding: '0 8px', borderRight: '1px solid var(--color-border-subtle)', alignItems: 'center' }}>
        <ToolbarButton 
          onClick={() => exitSpace()} 
          title="All Spaces" 
          icon={<Home size={20} />} 
        />
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

      <div style={{ display: 'flex', gap: '4px', padding: '0 8px', borderRight: '1px solid var(--color-border-subtle)' }}>
        <ToolbarButton 
          onClick={() => setBrainstorming(!isBrainstorming)} 
          title="Brainstorm Mode (B)" 
          active={isBrainstorming}
          icon={<Zap size={20} fill={isBrainstorming ? 'currentColor' : 'none'} />} 
        />
        <div className="dock-divider" style={{ width: '1px', height: '24px', background: 'var(--color-border-subtle)', margin: '0 4px' }} />
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

      <div style={{ display: 'flex', gap: '4px', padding: '0 8px', borderRight: '1px solid var(--color-border-subtle)' }}>
        <ToolbarButton 
          onClick={() => undo()} 
          title="Undo (⌘Z)" 
          disabled={pastStates.length === 0}
          icon={<Undo2 size={20} />} 
        />
        <ToolbarButton 
          onClick={() => redo()} 
          title="Redo (⌘⇧Z)" 
          disabled={futureStates.length === 0}
          icon={<Redo2 size={20} />} 
        />
        <ToolbarButton 
          onClick={toggleTheme} 
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`} 
          icon={theme === 'light' ? <Moon size={20} /> : <Sun size={20} />} 
        />
      </div>

      <div style={{ display: 'flex', gap: '4px', padding: '0 8px', borderRight: '1px solid var(--color-border-subtle)' }}>
        <Popover.Root>
          <Popover.Trigger asChild>
            <button 
              className="dock-item" 
              title="Layout Options"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--color-text-primary)',
                padding: '8px',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <Layout size={20} />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content 
              className="glass-panel animate-slide-in" 
              sideOffset={14}
              style={{ 
                padding: '12px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '8px', 
                zIndex: 100, 
                borderRadius: '20px',
                minWidth: '180px'
              }}
            >
              <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 4px 4px 4px' }}>Layout Mode</span>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button 
                  onClick={() => layoutDagre('LR')}
                  className="layout-option"
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px 8px', borderRadius: '12px',
                    background: layoutDirection === 'LR' ? 'var(--color-bg-glass-hover)' : 'rgba(255,255,255,0.03)',
                    border: layoutDirection === 'LR' ? '1px solid var(--color-accent-bright)' : '1px solid rgba(255,255,255,0.05)',
                    color: layoutDirection === 'LR' ? 'var(--color-accent-bright)' : 'var(--color-text-primary)',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <ArrowRight size={18} />
                  <span style={{ fontSize: '10px', fontWeight: 600 }}>Horizontal</span>
                </button>
                <button 
                  onClick={() => layoutDagre('RL')}
                  className="layout-option"
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px 8px', borderRadius: '12px',
                    background: layoutDirection === 'RL' ? 'var(--color-bg-glass-hover)' : 'rgba(255,255,255,0.03)',
                    border: layoutDirection === 'RL' ? '1px solid var(--color-accent-bright)' : '1px solid rgba(255,255,255,0.05)',
                    color: layoutDirection === 'RL' ? 'var(--color-accent-bright)' : 'var(--color-text-primary)',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <ArrowLeft size={18} />
                  <span style={{ fontSize: '10px', fontWeight: 600 }}>Reverse</span>
                </button>
                <button 
                  onClick={() => layoutDagre('TB')}
                  className="layout-option"
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px 8px', borderRadius: '12px',
                    background: layoutDirection === 'TB' ? 'var(--color-bg-glass-hover)' : 'rgba(255,255,255,0.03)',
                    border: layoutDirection === 'TB' ? '1px solid var(--color-accent-bright)' : '1px solid rgba(255,255,255,0.05)',
                    color: layoutDirection === 'TB' ? 'var(--color-accent-bright)' : 'var(--color-text-primary)',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <ArrowDown size={18} />
                  <span style={{ fontSize: '10px', fontWeight: 600 }}>Vertical</span>
                </button>
                <button 
                  onClick={() => layoutDagre('BT')}
                  className="layout-option"
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px 8px', borderRadius: '12px',
                    background: layoutDirection === 'BT' ? 'var(--color-bg-glass-hover)' : 'rgba(255,255,255,0.03)',
                    border: layoutDirection === 'BT' ? '1px solid var(--color-accent-bright)' : '1px solid rgba(255,255,255,0.05)',
                    color: layoutDirection === 'BT' ? 'var(--color-accent-bright)' : 'var(--color-text-primary)',
                    cursor: 'pointer', transition: 'all 0.2s'
                  }}
                >
                  <ArrowUp size={18} />
                  <span style={{ fontSize: '10px', fontWeight: 600 }}>Bottom-Up</span>
                </button>
              </div>
              


              <Popover.Arrow style={{ fill: 'var(--color-bg-surface)' }} />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
        
        <Popover.Root>
          <Popover.Trigger asChild>
            <button 
              className="dock-item" 
              disabled={selectedNodes.length === 0} 
              title="Appearance & Mood"
              style={{
                background: 'transparent',
                border: 'none',
                color: selectedNodes.length > 0 ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                padding: '8px',
                borderRadius: '12px',
                cursor: selectedNodes.length > 0 ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            >
              <Palette size={20} />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content 
              className="glass-panel animate-slide-in" 
              sideOffset={14}
              style={{ 
                padding: '0', 
                display: 'flex', 
                flexDirection: 'column', 
                zIndex: 100, 
                minWidth: '280px', 
                borderRadius: '24px',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                border: '1px solid var(--color-border-subtle)'
              }}
            >
              {/* COMPACT TABS HEADER */}
              <div style={{ 
                display: 'flex', 
                background: 'rgba(255,255,255,0.03)', 
                borderBottom: '1px solid var(--color-border-subtle)',
                padding: '4px'
              }}>
                <button
                  onClick={() => setActiveTab('theme')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '10px',
                    border: 'none',
                    background: activeTab === 'theme' ? 'var(--color-bg-glass-hover)' : 'transparent',
                    color: activeTab === 'theme' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    fontSize: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <Palette size={14} />
                  Theme
                </button>
                <button
                  onClick={() => setActiveTab('style')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '10px',
                    border: 'none',
                    background: activeTab === 'style' ? 'var(--color-bg-glass-hover)' : 'transparent',
                    color: activeTab === 'style' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    fontSize: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <Zap size={14} />
                  Topic
                </button>
                <button
                  onClick={() => setActiveTab('layers')}
                  style={{
                    flex: 1,
                    padding: '8px',
                    borderRadius: '10px',
                    border: 'none',
                    background: activeTab === 'layers' ? 'var(--color-bg-glass-hover)' : 'transparent',
                    color: activeTab === 'layers' ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                    fontSize: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <Layout size={14} />
                  Layers
                </button>
              </div>

              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '420px', overflowY: 'auto' }}>
                {activeTab === 'theme' && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-200" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* COLOR SYSTEM LOGIC SECTION */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-primary)', fontWeight: 700 }}>Color Logic</span>
                        <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>How colors flow across the map</span>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px', border: '1px solid var(--color-border-subtle)' }}>
                        <button 
                          onClick={() => setColorMode('branch')}
                          style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '8px',
                            border: 'none',
                            background: colorMode === 'branch' ? 'var(--color-accent-soft)' : 'transparent',
                            color: colorMode === 'branch' ? 'var(--color-text-accent)' : 'var(--color-text-muted)',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          Branches
                        </button>
                        <button 
                          onClick={() => setColorMode('depth')}
                          style={{
                            flex: 1,
                            padding: '8px',
                            borderRadius: '8px',
                            border: 'none',
                            background: colorMode === 'depth' ? 'var(--color-accent-soft)' : 'transparent',
                            color: colorMode === 'depth' ? 'var(--color-text-accent)' : 'var(--color-text-muted)',
                            fontSize: '11px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                          }}
                        >
                          Layers
                        </button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        {palettes.map((p) => (
                          <button
                            key={p.name}
                            onClick={() => applyPalette(p)}
                            style={{
                              padding: '10px 4px',
                              borderRadius: '12px',
                              background: activePaletteName === p.name ? 'var(--color-accent-soft)' : 'rgba(255,255,255,0.03)',
                              border: activePaletteName === p.name ? '1px solid var(--color-accent-bright)' : '1px solid var(--color-border-subtle)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              boxShadow: activePaletteName === p.name ? '0 0 15px var(--color-accent-glow)' : 'none'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = p.branch[0]}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--color-border-subtle)'}
                          >
                            <div style={{ display: 'flex', gap: '2px' }}>
                              {p.branch.slice(0, 3).map((c, i) => (
                                <div key={i} style={{ width: '8px', height: '8px', borderRadius: '2px', background: c }} />
                              ))}
                            </div>
                            <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>{p.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'style' && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-200" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* TOPIC MOOD SECTION */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                          <span style={{ fontSize: '12px', color: 'var(--color-text-primary)', fontWeight: 700 }}>Topic Mood</span>
                          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Semantic highlights</span>
                        </div>
                        <button 
                          onClick={() => {
                            handleColorChange(undefined);
                            recalculateDepths();
                          }}
                          title="Inherit from layer"
                          style={{ 
                            padding: '6px', 
                            borderRadius: '8px', 
                            background: 'rgba(255,255,255,0.05)', 
                            border: '1px solid var(--color-border-subtle)',
                            color: 'var(--color-text-secondary)',
                            cursor: 'pointer'
                          }}
                        >
                          <RotateCcw size={14} />
                        </button>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        {nodeMoods.map((mood) => (
                          <button
                            key={mood.name}
                            onClick={() => handleColorChange(mood.color, mood.name)}
                            style={{
                              padding: '10px 4px',
                              borderRadius: '12px',
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid var(--color-border-subtle)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              color: mood.color
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = mood.color;
                              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
                              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                            }}
                          >
                            <div style={{ color: mood.color }}>{mood.icon}</div>
                            <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>{mood.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ height: '1px', background: 'var(--color-border-subtle)', opacity: 0.5 }} />

                    {/* TOPIC GEOMETRY SECTION */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-primary)', fontWeight: 700 }}>Topic Geometry</span>
                        <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Physical structure</span>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                        {nodeShapes.map((shape) => (
                          <button
                            key={shape.value}
                            onClick={() => handleShapeChange(shape.value as 'rect' | 'pill' | 'diamond' | 'hexagon' | 'capsule')}
                            style={{
                              padding: '10px 4px',
                              borderRadius: '12px',
                              background: 'rgba(255,255,255,0.03)',
                              border: '1px solid var(--color-border-subtle)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              gap: '8px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              color: 'var(--color-text-primary)'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.borderColor = 'var(--color-accent-bright)';
                              e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
                              e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                            }}
                          >
                            <div style={{ color: 'var(--color-accent-bright)' }}>{shape.icon}</div>
                            <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>{shape.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'layers' && (
                  <div className="animate-in fade-in slide-in-from-top-1 duration-200" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* LAYER HIGHLIGHTS SECTION */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '12px', color: 'var(--color-text-primary)', fontWeight: 700 }}>Layer Palette</span>
                        <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Fine-grained layer colors</span>
                      </div>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                        {depthColors.map((dc, i) => (
                          <div key={i} style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '10px',
                            background: 'rgba(255,255,255,0.03)',
                            padding: '6px 10px',
                            borderRadius: '12px',
                            border: '1px solid var(--color-border-subtle)'
                          }}>
                            <div style={{ position: 'relative', width: '24px', height: '24px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--color-border-subtle)', flexShrink: 0 }}>
                              <input 
                                type="color" 
                                value={rgbaToHex(dc)}
                                onChange={(e) => {
                                  const hex = e.target.value;
                                  const r = parseInt(hex.slice(1, 3), 16);
                                  const g = parseInt(hex.slice(3, 5), 16);
                                  const b = parseInt(hex.slice(5, 7), 16);
                                  setDepthColor(i, `rgba(${r}, ${g}, ${b}, 0.6)`);
                                }}
                                style={{
                                  position: 'absolute',
                                  top: '-10px',
                                  left: '-10px',
                                  width: 'calc(100% + 20px)',
                                  height: 'calc(100% + 20px)',
                                  padding: 0,
                                  border: 'none',
                                  background: 'transparent',
                                  cursor: 'pointer',
                                }}
                              />
                            </div>
                            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {layerLabels[i] || `Level ${i}`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Popover.Arrow style={{ fill: 'var(--color-bg-surface)' }} />
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
      </div>

      <div style={{ display: 'flex', gap: '4px', padding: '0 8px', borderRight: '1px solid var(--color-border-subtle)' }}>
        <ToolbarButton onClick={onExportImage} title="Export Image" icon={<Image size={20} />} />
        <ToolbarButton onClick={onExport} title="Save File" icon={<Download size={20} />} />
        <ToolbarButton onClick={() => fileInputRef.current?.click()} title="Open File" icon={<Upload size={20} />} />
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          accept=".json"
          onChange={handleFileChange}
        />
      </div>

      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px', 
        paddingLeft: '16px',
        paddingRight: '12px',
        minWidth: '240px',
        position: 'relative'
      }}>
        <Search size={18} color="var(--color-text-muted)" />
        <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
          {getGhostText() && (
            <div style={{
              position: 'absolute',
              left: 4,
              color: 'var(--color-text-muted)',
              fontSize: '14px',
              fontFamily: 'var(--font-body)',
              fontWeight: 500,
              pointerEvents: 'none',
              opacity: 0.5,
              whiteSpace: 'pre',
              zIndex: 0,
              display: 'flex',
              alignItems: 'center',
              height: '100%'
            }}>
              <span style={{ color: 'transparent' }}>{localSearchQuery}</span>
              {getGhostText()}
            </div>
          )}
          <input
            className="search-input"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-primary)',
              fontSize: '14px',
              fontFamily: 'var(--font-body)',
              outline: 'none',
              width: '100%',
              fontWeight: 500,
              position: 'relative',
              zIndex: 1,
              padding: '10px 4px'
            }}
            placeholder="Search nodes..."
            value={localSearchQuery}
            onChange={(e) => {
              setLocalSearchQuery(e.target.value);
              setSelectedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
          />
        </div>
        
        {searchResults.length > 0 && (
          <div className="glass-panel animate-slide-in" style={{
            position: 'absolute',
            bottom: 'calc(100% + 12px)',
            left: '0px',
            right: '0px',
            maxHeight: '400px',
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: '8px',
            zIndex: 1000,
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            border: '1px solid var(--color-border-subtle)',
            background: 'var(--color-bg-overlay)',
            backdropFilter: 'blur(32px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
          }}>
            <style>
              {`
                .glass-panel::-webkit-scrollbar { width: 6px; }
                .glass-panel::-webkit-scrollbar-track { background: transparent; }
                .glass-panel::-webkit-scrollbar-thumb { background: var(--color-border-subtle); border-radius: 10px; }
              `}
            </style>
            <div style={{ 
              padding: '6px 12px', 
              fontSize: '9px', 
              fontWeight: 900, 
              color: 'var(--color-text-muted)', 
              textTransform: 'uppercase', 
              letterSpacing: '0.12em',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid var(--color-border-subtle)',
              marginBottom: '4px',
              paddingBottom: '8px'
            }}>
              <span style={{ color: 'var(--color-accent-bright)' }}>Results</span>
              <div style={{ display: 'flex', gap: '10px', opacity: 0.6 }}>
                <span>↑↓ Navigate</span>
                <span>⇥ Complete</span>
                <span>↵ Select</span>
              </div>
            </div>
            {searchResults.map((node, index) => (
              <button
                key={node.id}
                onClick={() => handleSearchResultClick(node)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: index === selectedIndex ? 'var(--color-bg-glass-hover)' : 'transparent',
                  border: '1px solid',
                  borderColor: index === selectedIndex ? 'var(--color-accent-bright)' : 'transparent',
                  color: index === selectedIndex ? 'var(--color-accent-bright)' : 'var(--color-text-primary)',
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  boxShadow: index === selectedIndex ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
                  transform: index === selectedIndex ? 'translateX(4px)' : 'translateX(0)',
                  outline: 'none'
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div style={{ 
                  width: '10px', 
                  height: '10px', 
                  borderRadius: '3px', 
                  background: (node.style?.background as string) || (depthColors ? depthColors[node.data.depth ?? 0] : 'var(--color-accent-bright)'),
                  boxShadow: `0 0 12px ${(node.style?.background as string) || (depthColors ? depthColors[node.data.depth ?? 0] : 'var(--color-accent-bright)')}`
                }} />
                <span style={{ 
                  flex: 1, 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'nowrap',
                  fontWeight: index === selectedIndex ? 600 : 400
                }}>
                  {(node.data?.label as string) || 'Untitled Node'}
                </span>
                {index === selectedIndex && (
                  <ArrowRight size={14} style={{ opacity: 0.6 }} />
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
