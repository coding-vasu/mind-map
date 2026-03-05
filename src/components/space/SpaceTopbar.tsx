import React, { useRef, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  LayoutGrid, 
  List,
  X,
} from 'lucide-react';

type ViewMode = 'grid' | 'list';

interface SpaceTopbarProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onCreate: () => void;
}

export const SpaceTopbar: React.FC<SpaceTopbarProps> = ({
  viewMode,
  onViewModeChange,
  searchQuery,
  onSearchChange,
  onCreate,
}) => {
  const searchRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Cmd+K or / to focus search
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  return (
    <div style={{
      height: '65px', padding: '0 40px',
      borderBottom: '1px solid var(--color-border-subtle)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'rgba(255, 255, 255, 0.01)', flexShrink: 0,
    }}>
      {/* Search */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        background: 'rgba(255,255,255,0.04)',
        border: `1px solid ${searchQuery ? 'var(--color-accent-bright)' : 'var(--color-border-subtle)'}`,
        borderRadius: '10px', padding: '8px 14px', width: '280px',
        transition: 'all 0.2s',
      }}>
        <Search size={15} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
        <input
          ref={searchRef}
          type="text"
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search mind maps..."
          style={{
            background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--color-text-primary)', fontSize: '13px',
            fontFamily: 'var(--font-body)', flex: 1, minWidth: 0,
          }}
        />
        {searchQuery ? (
          <button
            onClick={() => onSearchChange('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', padding: 0 }}
          >
            <X size={14} />
          </button>
        ) : (
          <kbd style={{ fontSize: '10px', padding: '2px 5px', flexShrink: 0 }}>⌘K</kbd>
        )}
      </div>

      {/* Right side actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* View Mode Toggle */}
        <div style={{
          display: 'flex', background: 'rgba(255,255,255,0.04)',
          borderRadius: '10px', padding: '3px', border: '1px solid var(--color-border-subtle)',
        }}>
          {(['grid', 'list'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              title={`${mode} view`}
              style={{
                width: '32px', height: '32px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', border: 'none', cursor: 'pointer',
                borderRadius: '7px', transition: 'all 0.15s',
                background: viewMode === mode ? 'var(--color-accent-soft)' : 'transparent',
                color: viewMode === mode ? 'var(--color-accent-bright)' : 'var(--color-text-muted)',
              }}
            >
              {mode === 'grid' ? <LayoutGrid size={16} /> : <List size={16} />}
            </button>
          ))}
        </div>

        {/* Create button */}
        <button
          onClick={onCreate}
          style={{
            background: 'var(--color-accent-bright)', color: 'white', border: 'none',
            padding: '0 20px', height: '40px', borderRadius: '10px', fontWeight: 700,
            fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px',
            cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 4px 16px -4px var(--color-accent-bright)',
            fontFamily: 'var(--font-body)',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px -4px var(--color-accent-bright)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 16px -4px var(--color-accent-bright)'; }}
        >
          <Plus size={18} strokeWidth={3} />
          New Mind Map
        </button>
      </div>
    </div>
  );
};
