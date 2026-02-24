import React, { useState } from 'react';
import { useStore } from '../store';
import { Folder, Trash2, ArrowRight, Brain, Clock, PlusCircle } from 'lucide-react';

export const SpaceManager = () => {
  const { spaces, createSpace, switchSpace, deleteSpace, activeSpaceId } = useStore();
  const [newSpaceName, setNewSpaceName] = useState('');

  const handleCreateSpace = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSpaceName.trim()) {
      createSpace(newSpaceName.trim());
      setNewSpaceName('');
    }
  };

  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
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
      {/* Ambient backgrounds same as MindMapCanvas */}
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
        {/* Header */}
        <div style={{
          padding: '40px',
          background: 'rgba(255,255,255,0.02)',
          borderBottom: '1px solid var(--color-border-subtle)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
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
              <Brain size={40} className="text-accent-bright" />
              MindMap Spaces
            </h1>
            <p style={{ color: 'var(--color-text-secondary)', margin: '8px 0 0 0', fontSize: '16px' }}>
              Choose a workspace or create a new one to start mapping your thoughts.
            </p>
          </div>

          <form onSubmit={handleCreateSpace} style={{ display: 'flex', gap: '12px' }}>
            <div style={{ position: 'relative' }}>
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
                onFocus={(e) => e.target.style.borderColor = 'var(--color-accent-bright)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-border-subtle)'}
              />
            </div>
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
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <PlusCircle size={20} />
              Create
            </button>
          </form>
        </div>

        {/* Content */}
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
              <div
                key={space.id}
                className="space-card"
                onClick={() => switchSpace(space.id)}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--color-border-subtle)',
                  borderRadius: '24px',
                  padding: '24px',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  position: 'relative',
                  boxShadow: activeSpaceId === space.id ? '0 0 30px var(--color-accent-glow)' : 'none',
                  borderColor: activeSpaceId === space.id ? 'var(--color-accent-bright)' : 'var(--color-border-subtle)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.transform = 'translateY(-8px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '16px',
                    background: 'var(--color-accent-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--color-accent-bright)',
                  }}>
                    <Brain size={24} />
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Are you sure you want to delete "${space.name}"?`)) {
                        deleteSpace(space.id);
                      }
                    }}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: 'rgba(239, 68, 68, 0.8)',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div style={{ marginTop: '8px' }}>
                  <h3 style={{ 
                    margin: 0, 
                    fontSize: '20px', 
                    fontWeight: 700, 
                    color: 'var(--color-text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {space.name}
                  </h3>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    color: 'var(--color-text-secondary)', 
                    fontSize: '12px',
                    marginTop: '8px' 
                  }}>
                    <Clock size={12} />
                    {formatDate(space.lastModified)}
                  </div>
                </div>

                <div style={{ 
                  marginTop: 'auto', 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--color-accent-bright)',
                }}>
                  <span>{space.nodes.length} nodes</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Open <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
