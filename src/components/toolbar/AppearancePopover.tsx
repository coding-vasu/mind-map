import React, { useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Palette, Zap, Layout, RotateCcw } from 'lucide-react';
import { rgbaToHex } from '../../utils/color';

interface AppearancePopoverProps {
  selectedNodes: { id: string; data: { color?: string; shape?: 'rect' | 'pill' | 'diamond' | 'hexagon' | 'capsule' } }[];
  updateNodeColor: (nodeId: string, color: string | undefined, mood?: string) => void;
  updateNodeShape: (nodeId: string, shape: 'rect' | 'pill' | 'diamond' | 'hexagon' | 'capsule') => void;
  depthColors: string[];
  setDepthColor: (depth: number, color: string) => void;
  recalculateDepths: () => void;
  colorMode: 'branch' | 'depth';
  setColorMode: (mode: 'branch' | 'depth') => void;
  applyPalette: (palette: { name: string; depth: string[]; branch: string[] }) => void;
  activePaletteName: string;
  palettes: readonly { name: string; depth: string[]; branch: string[] }[];
  nodeMoods: readonly { name: string; color: string; icon: React.ReactNode }[];
  nodeShapes: readonly { name: string; value: 'rect' | 'pill' | 'diamond' | 'hexagon' | 'capsule'; icon: React.ReactNode }[];
  layerLabels: string[];
}

/**
 * Appearance and Styling Popover for the Toolbar
 */
export const AppearancePopover: React.FC<AppearancePopoverProps> = ({
  selectedNodes,
  updateNodeColor,
  updateNodeShape,
  depthColors,
  setDepthColor,
  recalculateDepths,
  colorMode,
  setColorMode,
  applyPalette,
  activePaletteName,
  palettes,
  nodeMoods,
  nodeShapes,
  layerLabels
}) => {
  const [activeTab, setActiveTab] = useState<'theme' | 'style' | 'layers'>('theme');

  const handleShapeChange = (shape: 'rect' | 'pill' | 'diamond' | 'hexagon' | 'capsule') => {
    selectedNodes.forEach((node) => updateNodeShape(node.id, shape));
  };

  const handleColorChange = (color: string | undefined, mood?: string) => {
    selectedNodes.forEach((node) => updateNodeColor(node.id, color, mood));
  };

  return (
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
            {(['theme', 'style', 'layers'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '10px',
                  border: 'none',
                  background: activeTab === tab ? 'var(--color-bg-glass-hover)' : 'transparent',
                  color: activeTab === tab ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
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
                {tab === 'theme' ? <Palette size={14} /> : tab === 'style' ? <Zap size={14} /> : <Layout size={14} />}
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '420px', overflowY: 'auto' }}>
            {activeTab === 'theme' && (
              <div className="animate-in fade-in slide-in-from-top-1 duration-200" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-primary)', fontWeight: 700 }}>Color Logic</span>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>How colors flow across the map</span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '4px', borderRadius: '12px', border: '1px solid var(--color-border-subtle)' }}>
                    {(['branch', 'depth'] as const).map(mode => (
                      <button 
                        key={mode}
                        onClick={() => setColorMode(mode)}
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '8px',
                          border: 'none',
                          background: colorMode === mode ? 'var(--color-accent-soft)' : 'transparent',
                          color: colorMode === mode ? 'var(--color-text-accent)' : 'var(--color-text-muted)',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        {mode.charAt(0).toUpperCase() + mode.slice(1)}es
                      </button>
                    ))}
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
                      >
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {p.branch.slice(0, 3).map((c: string, i: number) => (
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
                      >
                        <div style={{ color: mood.color }}>{mood.icon}</div>
                        <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--color-text-secondary)' }}>{mood.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ height: '1px', background: 'var(--color-border-subtle)', opacity: 0.5 }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-primary)', fontWeight: 700 }}>Topic Geometry</span>
                    <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Physical structure</span>
                  </div>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                    {nodeShapes.map((shape) => (
                      <button
                        key={shape.value}
                        onClick={() => handleShapeChange(shape.value)}
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
  );
};
