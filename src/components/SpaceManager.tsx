import React, { useState } from 'react';
import { Folder, Brain, PlusCircle } from 'lucide-react';

import { useStore } from '../store';
import { SpaceCard } from './space/SpaceCard';

/**
 * Entry point dashboard for managing different mind map workspaces (Spaces)
 */
export const SpaceManager: React.FC = () => {
  const { spaces, createSpace, switchSpace, deleteSpace, activeSpaceId } = useStore();
  const [newSpaceName, setNewSpaceName] = useState('');

  const handleCreateSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSpaceName.trim()) {
      createSpace(newSpaceName.trim());
      setNewSpaceName('');
    }
  };

  const handleDeleteSpace = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      deleteSpace(id);
    }
  };

  return (
    <div className="space-manager-container" style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      background: 'var(--color-bg-base)',
    }}>
      {/* Background Visuals */}
      <div className="ambient-background">
        <div className="ambient-blob ambient-blob-1" />
        <div className="ambient-blob ambient-blob-2" />
        <div className="ambient-blob ambient-blob-3" />
      </div>
      <div className="vignette-overlay" />

      <div className="glass-panel animate-slide-in" style={{
        width: '90%',
        maxWidth: '1000px',
        height: '80vh',
        borderRadius: '32px',
        border: '1px solid var(--color-border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxShadow: '0 40px 100px rgba(0,0,0,0.5)',
        zIndex: 10,
      }}>
        {/* Dashboard Header */}
        <div style={{
          padding: '40px',
          background: 'rgba(255,255,255,0.02)',
          borderBottom: '1px solid var(--color-border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          <div>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: 800, 
              margin: 0, 
              color: 'var(--color-text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px'
            }}>
              <Brain size={40} color="var(--color-accent-bright)" />
              MindMap Spaces
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', margin: '8px 0 0 0', fontSize: '16px' }}>
              Choose a workspace or create a new one to start mapping your thoughts.
            </p>
          </div>

          <form onSubmit={handleCreateSpace} style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              placeholder="New space name..."
              value={newSpaceName}
              onChange={(e) => setNewSpaceName(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--color-border-subtle)',
                borderRadius: '16px',
                padding: '12px 20px',
                color: 'var(--color-text-primary)',
                fontSize: '15px',
                width: '240px',
                outline: 'none',
                transition: 'all 0.2s',
              }}
            />
            <button
              type="submit"
              disabled={!newSpaceName.trim()}
              style={{
                background: 'var(--color-accent-bright)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                padding: '0 24px',
                fontWeight: 700,
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                opacity: newSpaceName.trim() ? 1 : 0.5,
              }}
            >
              <PlusCircle size={20} />
              Create
            </button>
          </form>
        </div>

        {/* Spaces Grid */}
        <div style={{
          flex: 1,
          padding: '40px',
          overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '24px',
          alignContent: 'start',
        }}>
          {spaces.length === 0 ? (
            <div style={{
              gridColumn: '1 / -1',
              height: '300px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-secondary)',
              gap: '20px',
            }}>
              <Folder size={64} opacity={0.2} />
              <p style={{ fontSize: '18px' }}>No spaces found. Create your first one above!</p>
            </div>
          ) : (
            spaces.map((space) => (
              <SpaceCard 
                key={space.id}
                space={space}
                isActive={activeSpaceId === space.id}
                onSwitch={switchSpace}
                onDelete={handleDeleteSpace}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
