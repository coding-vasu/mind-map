import React from 'react';
import { 
  Clock, 
  LayoutGrid, 
  Star, 
  FolderOpen,
  Brain
} from 'lucide-react';
import { useStore } from '../../store';
import type { Space } from '../../store/types';

type SidebarFilter = 'recents' | 'all' | 'favorites' | 'personal';

interface SpaceSidebarProps {
  activeFilter: SidebarFilter;
  onFilterChange: (filter: SidebarFilter) => void;
  spaces: Space[];
  favorites: Set<string>;
}

interface SidebarItemProps {
  icon: React.ReactElement<{ size?: number }>;
  label: string;
  active?: boolean;
  onClick?: () => void;
  badge?: string | number;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick, badge }) => (
  <div
    onClick={onClick}
    role="button"
    style={{
      display: 'flex', alignItems: 'center', gap: '12px', padding: '9px 12px',
      borderRadius: '10px', cursor: 'pointer',
      transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
      background: active ? 'var(--color-accent-soft)' : 'transparent',
      color: active ? 'var(--color-accent-bright)' : 'var(--color-text-secondary)',
      fontWeight: active ? 600 : 500, fontSize: '14px', userSelect: 'none',
    }}
    onMouseEnter={e => {
      if (!active) {
        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
        e.currentTarget.style.color = 'var(--color-text-primary)';
      }
    }}
    onMouseLeave={e => {
      if (!active) {
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'var(--color-text-secondary)';
      }
    }}
  >
    <div style={{ display: 'flex', alignItems: 'center', opacity: active ? 1 : 0.65 }}>
      {React.cloneElement(icon, { size: 17 })}
    </div>
    <span style={{ flex: 1 }}>{label}</span>
    {badge !== undefined && (
      <span style={{
        fontSize: '11px', minWidth: '20px', textAlign: 'center',
        background: active ? 'var(--color-accent-bright)' : 'rgba(255,255,255,0.07)',
        color: active ? 'white' : 'var(--color-text-muted)',
        padding: '1px 7px', borderRadius: '20px', fontWeight: 700,
      }}>
        {badge}
      </span>
    )}
  </div>
);

const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{
    fontSize: '10px', fontWeight: 700, color: 'var(--color-text-muted)',
    paddingLeft: '12px', marginBottom: '6px', marginTop: '20px',
    textTransform: 'uppercase', letterSpacing: '0.07em',
  }}>
    {children}
  </div>
);

export const SpaceSidebar: React.FC<SpaceSidebarProps> = ({
  activeFilter,
  onFilterChange,
  spaces,
  favorites,
}) => {
  const { toggleTheme, theme } = useStore();
  const favCount = spaces.filter(s => favorites.has(s.id)).length;

  return (
    <div style={{
      width: '240px', minWidth: '240px', height: '100%',
      borderRight: '1px solid var(--color-border-subtle)',
      display: 'flex', flexDirection: 'column', padding: '16px 10px',
      background: 'rgba(255, 255, 255, 0.01)', zIndex: 20, gap: '2px',
    }}>
      {/* App Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '8px 12px', marginBottom: '16px',
      }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '10px',
          background: 'linear-gradient(135deg, var(--color-accent-bright) 0%, #3b82f6 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px var(--color-accent-soft)',
        }}>
          <Brain size={18} color="white" />
        </div>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.01em' }}>MindFlow</div>
          <div style={{ fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 500 }}>v2.0 • Pro</div>
        </div>
      </div>

      {/* Navigation */}
      <SectionLabel>Library</SectionLabel>
      <SidebarItem icon={<Clock />} label="Recents" active={activeFilter === 'recents'} onClick={() => onFilterChange('recents')} />
      <SidebarItem icon={<LayoutGrid />} label="All Mind Maps" active={activeFilter === 'all'} onClick={() => onFilterChange('all')} badge={spaces.length} />
      <SidebarItem icon={<Star />} label="Favorites" active={activeFilter === 'favorites'} onClick={() => onFilterChange('favorites')} badge={favCount > 0 ? favCount : undefined} />

      <SectionLabel>Workspaces</SectionLabel>
      <SidebarItem icon={<FolderOpen />} label="Personal" active={activeFilter === 'personal'} onClick={() => onFilterChange('personal')} badge={spaces.length} />

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      <div style={{ borderTop: '1px solid var(--color-border-subtle)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '2px', marginBottom: '8px' }}>
        {/* Theme toggle */}
        <div
          onClick={toggleTheme}
          role="button"
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '9px 12px', borderRadius: '10px', cursor: 'pointer',
            transition: 'all 0.15s', color: 'var(--color-text-secondary)', fontSize: '14px', fontWeight: 500,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--color-text-primary)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-text-secondary)'; }}
        >
          <div style={{ width: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </div>
          <span style={{ flex: 1 }}>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          {/* Toggle pill */}
          <div style={{
            width: '36px', height: '20px', borderRadius: '10px',
            background: theme === 'light' ? 'var(--color-accent-bright)' : 'rgba(255,255,255,0.1)',
            position: 'relative', transition: 'all 0.2s',
          }}>
            <div style={{
              width: '16px', height: '16px', borderRadius: '50%', background: 'white',
              position: 'absolute', top: '2px',
              left: theme === 'light' ? '18px' : '2px',
              transition: 'all 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }} />
          </div>
        </div>
      </div>
    </div>
  );
};
