import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';

interface ToolbarButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  disabled?: boolean;
  active?: boolean;
}

/**
 * A reusable button for the toolbar with built-in tooltip and consistent styling
 */
export const ToolbarButton: React.FC<ToolbarButtonProps> = ({ 
  onClick, 
  icon, 
  title, 
  disabled = false, 
  active = false 
}) => {
  return (
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
              padding: '6px',
              borderRadius: '10px',
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
};
