import React from 'react';
import { Brain, Trash2, Clock, ArrowRight } from 'lucide-react';
import { type Space } from '../../store/types';

interface SpaceCardProps {
  space: Space;
  isActive: boolean;
  onSwitch: (id: string) => void;
  onDelete: (id: string, name: string) => void;
}

/**
 * Individual card representing a MindMap space
 */
export const SpaceCard: React.FC<SpaceCardProps> = ({ 
  space, 
  isActive, 
  onSwitch, 
  onDelete 
}) => {
  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(timestamp));
  };

  return (
    <div
      className="space-card"
      onClick={() => onSwitch(space.id)}
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
        boxShadow: isActive ? '0 0 30px var(--color-accent-glow)' : 'none',
        borderColor: isActive ? 'var(--color-accent-bright)' : 'var(--color-border-subtle)',
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
            onDelete(space.id, space.name);
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
  );
};
