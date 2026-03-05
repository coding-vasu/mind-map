import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Brain, 
  PlusCircle, 
  ChevronRight,
  Search,
  X
} from 'lucide-react';

import { useStore } from '../store';
import { SpaceCard } from './space/SpaceCard';
import { SpaceSidebar } from './space/SpaceSidebar';
import { SpaceTopbar } from './space/SpaceTopbar';
import type { Space } from '../store/types';
import { SpaceListRow } from './space/SpaceListRow';

type SidebarFilter = string;
type ViewMode = 'grid' | 'list';


/**
 * Entry point dashboard for managing different mind map workspaces (Spaces)
 * Fully functional Figma-style dashboard
 */
export const SpaceManager: React.FC = () => {
  const { spaces, createSpace, switchSpace, deleteSpace, activeSpaceId, theme, activeWorkspaceId, workspaces } = useStore();

  // UI State
  const [activeFilter, setActiveFilter] = useState<SidebarFilter>(activeWorkspaceId || 'personal');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [favorites, setFavorites] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('mm-favorites');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [isCreating, setIsCreating] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');
  const createInputRef = useRef<HTMLInputElement>(null);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Focus the create input when it appears
  useEffect(() => {
    if (isCreating && createInputRef.current) {
      createInputRef.current.focus();
    }
  }, [isCreating]);

  // Persist favorites
  useEffect(() => {
    localStorage.setItem('mm-favorites', JSON.stringify([...favorites]));
  }, [favorites]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleCreateSpace = useCallback((name?: string) => {
    const finalName = (name || newSpaceName).trim();
    if (finalName) {
      createSpace(finalName);
      setNewSpaceName('');
      setIsCreating(false);
    }
  }, [createSpace, newSpaceName]);

  const handleCreateKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleCreateSpace();
    if (e.key === 'Escape') {
      setIsCreating(false);
      setNewSpaceName('');
    }
  };

  const handleDeleteSpace = useCallback((id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteSpace(id);
      setFavorites(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [deleteSpace]);

  // Filter spaces based on sidebar option and search
  const filteredSpaces = React.useMemo((): Space[] => {
    let result = [...spaces];
    
    if (searchQuery.trim()) {
      result = result.filter(s => 
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    switch (activeFilter) {
      case 'recents':
        return result.sort((a, b) => b.lastModified - a.lastModified);
      case 'all':
        return result.sort((a, b) => a.name.localeCompare(b.name));
      case 'favorites':
        return result.filter(s => favorites.has(s.id)).sort((a, b) => b.lastModified - a.lastModified);
      case 'personal':
        return result.filter(s => s.workspaceId === 'personal').sort((a, b) => a.createdAt - b.createdAt);
      default:
        // Assume it's a workspace ID
        return result.filter(s => s.workspaceId === activeFilter).sort((a, b) => b.lastModified - a.lastModified);
    }
  }, [spaces, searchQuery, activeFilter, favorites]);

  const filterLabel: Record<string, string> = {
    recents: 'Recents',
    all: 'All Mind Maps',
    favorites: 'Favorites',
  };

  // Resolve dynamic workplace names for the label
  const activeWorkspaceName = workspaces.find(w => w.id === activeFilter)?.name;
  const currentFilterLabel = filterLabel[activeFilter] || activeWorkspaceName || activeFilter;

  const isEmpty = filteredSpaces.length === 0;
  const hasSpaces = spaces.length > 0;

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      background: 'var(--color-bg-base)',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--font-body)',
    }}>
      {/* Background Visuals */}
      <div className="ambient-background">
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
        <div className="ambient-blob ambient-blob-3" />
      </div>
      <div className="vignette-overlay" />

      {/* Main Layout */}
      <div style={{
        flex: 1,
        display: 'flex',
        width: '100%',
        height: '100%',
        zIndex: 10,
      }}>
        {/* Sidebar */}
        <SpaceSidebar 
          activeFilter={activeFilter} 
          onFilterChange={setActiveFilter}
          spaces={spaces}
          favorites={favorites}
        />

        {/* Main Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
          {/* Topbar */}
          <SpaceTopbar 
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onCreate={() => setIsCreating(true)}
          />

          {/* Content */}
          <div style={{ flex: 1, padding: '32px 40px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', fontSize: '13px' }}>
              <span style={{ cursor: 'pointer' }} onClick={() => setActiveFilter('all')}>Home</span>
              <ChevronRight size={14} />
              <span style={{ color: 'var(--color-text-primary)', fontWeight: 600 }}>{currentFilterLabel}</span>
              {searchQuery && (
                <>
                  <ChevronRight size={14} />
                  <span style={{ color: 'var(--color-accent-bright)', fontWeight: 600 }}>
                    Search: "{searchQuery}"
                  </span>
                  <button
                    onClick={() => setSearchQuery('')}
                    style={{ 
                      background: 'none', border: 'none', cursor: 'pointer', 
                      color: 'var(--color-text-muted)', padding: '0 4px',
                      display: 'flex', alignItems: 'center'
                    }}
                  >
                    <X size={12} />
                  </button>
                </>
              )}
            </div>

            {/* Content area */}
            {!hasSpaces && !isCreating ? (
              // First-time empty state
              <EmptyState onCreate={() => setIsCreating(true)} />
            ) : (isEmpty && !isCreating && searchQuery) ? (
              // Filtered empty state (search/favorites)
              <FilteredEmptyState filter={activeFilter} searchQuery={searchQuery} onClear={() => { setSearchQuery(''); setActiveFilter('all'); }} />
            ) : (
              <>
                {viewMode === 'grid' ? (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                    gap: '20px',
                    alignContent: 'start',
                  }}>
                    {filteredSpaces.map(space => (
                      <SpaceCard
                        key={space.id}
                        space={space}
                        isActive={activeSpaceId === space.id}
                        isFavorite={favorites.has(space.id)}
                        onSwitch={switchSpace}
                        onDelete={handleDeleteSpace}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                    {/* Create New Card (only in non-filtered modes) */}
                    {!searchQuery && activeFilter !== 'favorites' && (
                      <NewSpaceCard 
                        isCreating={isCreating}
                        newSpaceName={newSpaceName}
                        inputRef={createInputRef}
                        onNameChange={setNewSpaceName}
                        onKeyDown={handleCreateKeyDown}
                        onCommit={() => handleCreateSpace()}
                        onCancel={() => { setIsCreating(false); setNewSpaceName(''); }}
                        onStartCreating={() => setIsCreating(true)}
                      />
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {/* List Header */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 100px 120px 80px 40px',
                      gap: '16px',
                      padding: '8px 16px',
                      fontSize: '11px',
                      fontWeight: 700,
                      color: 'var(--color-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}>
                      <span>Name</span>
                      <span>Nodes</span>
                      <span>Last Modified</span>
                      <span>Created</span>
                      <span />
                    </div>
                    {filteredSpaces.map(space => (
                      <SpaceListRow
                        key={space.id}
                        space={space}
                        isActive={activeSpaceId === space.id}
                        isFavorite={favorites.has(space.id)}
                        onSwitch={switchSpace}
                        onDelete={handleDeleteSpace}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                    {/* Inline Create Row for List View */}
                    {!searchQuery && activeFilter !== 'favorites' && (
                      <div style={{ marginTop: '8px' }}>
                        {isCreating ? (
                          <div style={{ 
                            display: 'flex', gap: '12px', alignItems: 'center', 
                            padding: '12px 16px', borderRadius: '12px', 
                            background: 'var(--color-bg-surface)',
                            border: '1px solid var(--color-accent-bright)'
                          }}>
                            <div style={{ 
                              width: '36px', height: '36px', borderRadius: '10px', 
                              background: 'var(--color-accent-soft)', display: 'flex', 
                              alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent-bright)'
                            }}>
                              <Brain size={18} />
                            </div>
                            <input
                              ref={createInputRef}
                              value={newSpaceName}
                              onChange={e => setNewSpaceName(e.target.value)}
                              onKeyDown={handleCreateKeyDown}
                              placeholder="New mind map name..."
                              style={{ 
                                flex: 1, background: 'transparent', border: 'none', 
                                outline: 'none', color: 'white', fontSize: '14px' 
                              }}
                            />
                            <button onClick={() => { setIsCreating(false); setNewSpaceName(''); }} style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
                            <button onClick={() => handleCreateSpace()} disabled={!newSpaceName.trim()} style={{ background: 'var(--color-accent-bright)', border: 'none', color: 'white', borderRadius: '8px', padding: '6px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', opacity: newSpaceName.trim() ? 1 : 0.5 }}>Create</button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setIsCreating(true)}
                            style={{
                              width: '100%', display: 'flex', alignItems: 'center', gap: '12px',
                              padding: '12px 16px', borderRadius: '12px', cursor: 'pointer',
                              background: 'transparent', border: '1px dashed var(--color-border-subtle)',
                              color: 'var(--color-text-muted)', transition: 'all 0.15s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--color-accent-bright)'; e.currentTarget.style.color = 'var(--color-accent-bright)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border-subtle)'; e.currentTarget.style.color = 'var(--color-text-muted)'; }}
                          >
                            <PlusCircle size={18} />
                            <span style={{ fontSize: '14px', fontWeight: 600 }}>Add new mind map</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Sub-components ──────────────────────────────────────────

const EmptyState: React.FC<{ onCreate: () => void }> = ({ onCreate }) => (
  <div style={{
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '24px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '24px',
    border: '2px dashed var(--color-border-subtle)',
    padding: '80px 40px',
    textAlign: 'center',
    minHeight: '400px',
  }}>
    <div style={{
      width: '88px', height: '88px', borderRadius: '28px',
      background: 'var(--color-accent-soft)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--color-accent-bright)',
      boxShadow: '0 0 40px var(--color-accent-soft)',
    }}>
      <Brain size={44} />
    </div>
    <div>
      <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-text-primary)', margin: '0 0 10px 0' }}>
        No mind maps yet
      </h2>
      <p style={{ fontSize: '15px', color: 'var(--color-text-muted)', maxWidth: '380px', margin: 0, lineHeight: 1.6 }}>
        Create your first mind map to start organizing your thoughts and ideas beautifully.
      </p>
    </div>
    <button
      onClick={onCreate}
      style={{
        background: 'var(--color-accent-bright)', color: 'white', border: 'none',
        borderRadius: '14px', padding: '14px 32px', fontWeight: 700, fontSize: '15px',
        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
        transition: 'all 0.2s', boxShadow: '0 8px 30px -8px var(--color-accent-bright)',
      }}
      onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
      onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
    >
      <PlusCircle size={20} />
      Create your first mind map
    </button>
  </div>
);

const FilteredEmptyState: React.FC<{ 
  filter: SidebarFilter; 
  searchQuery: string; 
  onClear: () => void;
}> = ({ filter, searchQuery, onClear }) => (
  <div style={{
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: '16px', minHeight: '300px', textAlign: 'center'
  }}>
    <Search size={48} color="var(--color-text-muted)" style={{ opacity: 0.3 }} />
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 8px 0' }}>
        {searchQuery ? `No results for "${searchQuery}"` : filter === 'favorites' ? 'No favorites yet' : 'Nothing here'}
      </h3>
      <p style={{ fontSize: '14px', color: 'var(--color-text-muted)', margin: 0 }}>
        {searchQuery ? 'Try a different search term.' : filter === 'favorites' ? 'Star a mind map to add it to favorites.' : ''}
      </p>
    </div>
    <button
      onClick={onClear}
      style={{
        background: 'var(--color-accent-soft)', color: 'var(--color-accent-bright)',
        border: '1px solid var(--color-border-active)', borderRadius: '10px',
        padding: '8px 20px', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
      }}
    >
      Clear filters
    </button>
  </div>
);

interface NewSpaceCardProps {
  isCreating: boolean;
  newSpaceName: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onNameChange: (v: string) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onCommit: () => void;
  onCancel: () => void;
  onStartCreating: () => void;
}

const NewSpaceCard: React.FC<NewSpaceCardProps> = ({
  isCreating, newSpaceName, inputRef, onNameChange, onKeyDown, onCommit, onCancel, onStartCreating
}) => {
  if (isCreating) {
    return (
      <div style={{
        background: 'var(--color-bg-surface)',
        border: '2px solid var(--color-accent-bright)',
        borderRadius: '16px', height: '220px', display: 'flex',
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '24px',
        boxShadow: '0 0 30px var(--color-accent-soft)',
      }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '14px',
          background: 'var(--color-accent-soft)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', color: 'var(--color-accent-bright)',
        }}>
          <Brain size={24} />
        </div>
        <input
          ref={inputRef}
          value={newSpaceName}
          onChange={e => onNameChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Mind map name..."
          style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--color-border-active)',
            borderRadius: '10px', padding: '10px 16px', color: 'var(--color-text-primary)',
            fontSize: '14px', width: '100%', outline: 'none', textAlign: 'center',
          }}
        />
        <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, background: 'transparent', border: '1px solid var(--color-border-subtle)',
              borderRadius: '8px', padding: '8px', color: 'var(--color-text-muted)',
              fontSize: '13px', fontWeight: 600, cursor: 'pointer',
            }}
          >Cancel</button>
          <button
            onClick={onCommit}
            disabled={!newSpaceName.trim()}
            style={{
              flex: 1, background: 'var(--color-accent-bright)', border: 'none',
              borderRadius: '8px', padding: '8px', color: 'white',
              fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              opacity: newSpaceName.trim() ? 1 : 0.5,
            }}
          >Create</button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onStartCreating}
      style={{
        background: 'rgba(255,255,255,0.01)', border: '2px dashed var(--color-border-subtle)',
        borderRadius: '16px', height: '220px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '12px',
        color: 'var(--color-text-muted)', transition: 'all 0.2s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
        e.currentTarget.style.borderColor = 'var(--color-accent-bright)';
        e.currentTarget.style.color = 'var(--color-accent-bright)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.01)';
        e.currentTarget.style.borderColor = 'var(--color-border-subtle)';
        e.currentTarget.style.color = 'var(--color-text-muted)';
      }}
    >
      <PlusCircle size={32} />
      <span style={{ fontWeight: 600, fontSize: '14px' }}>New Mind Map</span>
    </div>
  );
};
