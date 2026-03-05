import React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Share2, Image as ImageIcon, Download, Upload } from 'lucide-react';

interface IOPopoverProps {
  onExportImage: () => void;
  onExportJSON: () => void;
  onImportClick: () => void;
}

/**
 * Compact File/Export Actions Popover
 */
export const IOPopover: React.FC<IOPopoverProps> = ({
  onExportImage,
  onExportJSON,
  onImportClick,
}) => {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button 
          className="dock-item" 
          title="File & Export Operations"
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--color-text-primary)',
            padding: '6px',
            borderRadius: '10px',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.15) translateY(-4px)'; e.currentTarget.style.background = 'var(--color-bg-glass-hover)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.background = 'transparent'; }}
        >
          <Share2 size={18} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content 
          className="glass-panel animate-slide-in" 
          sideOffset={14}
          style={{ 
            padding: '8px', 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '4px', 
            zIndex: 100, 
            borderRadius: '16px',
            minWidth: '200px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}
        >
          <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', padding: '6px 8px' }}>
            File & Sharing
          </span>
          
          <button 
            onClick={onExportImage}
            className="context-menu-item"
            style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', border: 'none', background: 'transparent', color: 'var(--color-text-primary)', padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <ImageIcon size={16} className="text-violet-400" />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span>Export as Image</span>
              <span style={{ fontSize: '10px', opacity: 0.5, fontWeight: 500 }}>High-Res PNG</span>
            </div>
          </button>

          <button 
            onClick={onExportJSON}
            className="context-menu-item"
            style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', border: 'none', background: 'transparent', color: 'var(--color-text-primary)', padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <Download size={16} className="text-emerald-400" />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span>Save Map File</span>
              <span style={{ fontSize: '10px', opacity: 0.5, fontWeight: 500 }}>Portable JSON format</span>
            </div>
          </button>

          <div style={{ height: '1px', background: 'var(--color-border-subtle)', margin: '4px 8px' }} />

          <button 
            onClick={onImportClick}
            className="context-menu-item"
            style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%', border: 'none', background: 'transparent', color: 'var(--color-text-primary)', padding: '10px', borderRadius: '10px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <Upload size={16} className="text-amber-400" />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span>Open Map File</span>
              <span style={{ fontSize: '10px', opacity: 0.5, fontWeight: 500 }}>Import from JSON</span>
            </div>
          </button>

          <Popover.Arrow style={{ fill: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};
