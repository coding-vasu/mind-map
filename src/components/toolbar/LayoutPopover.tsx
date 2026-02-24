import React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Layout as LayoutIcon, ArrowRight, ArrowLeft, ArrowDown, ArrowUp } from 'lucide-react';

interface LayoutPopoverProps {
  layoutDagre: (direction: 'LR' | 'RL' | 'TB' | 'BT' | 'radial') => void;
  layoutDirection: 'LR' | 'RL' | 'TB' | 'BT' | 'radial';
}

/**
 * Layout options popover for controlling the mind map organization
 */
export const LayoutPopover: React.FC<LayoutPopoverProps> = ({
  layoutDagre,
  layoutDirection,
}) => {
  const options = [
    { dir: 'LR' as const, icon: <ArrowRight size={18} />, label: 'Horizontal' },
    { dir: 'RL' as const, icon: <ArrowLeft size={18} />, label: 'Reverse' },
    { dir: 'TB' as const, icon: <ArrowDown size={18} />, label: 'Vertical' },
    { dir: 'BT' as const, icon: <ArrowUp size={18} />, label: 'Bottom-Up' },
  ];

  return (
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
          <LayoutIcon size={20} />
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
          <span style={{ fontSize: '11px', color: 'var(--color-text-secondary)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '0 4px 4px 4px' }}>
            Layout Mode
          </span>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {options.map((opt) => (
              <button 
                key={opt.dir}
                onClick={() => layoutDagre(opt.dir)}
                className="layout-option"
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', padding: '12px 8px', borderRadius: '12px',
                  background: layoutDirection === opt.dir ? 'var(--color-bg-glass-hover)' : 'rgba(255,255,255,0.03)',
                  border: layoutDirection === opt.dir ? '1px solid var(--color-accent-bright)' : '1px solid rgba(255,255,255,0.05)',
                  color: layoutDirection === opt.dir ? 'var(--color-accent-bright)' : 'var(--color-text-primary)',
                  cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                {opt.icon}
                <span style={{ fontSize: '10px', fontWeight: 600 }}>{opt.label}</span>
              </button>
            ))}
          </div>
          <Popover.Arrow style={{ fill: 'var(--color-bg-surface)' }} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
