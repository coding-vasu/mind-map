import React, { useState } from 'react';
import { Trash2, Clock, Star } from 'lucide-react';
import { type Space } from '../../store/types';
import { SpacePreview } from './SpacePreview';

const getTimeAgo = (timestamp: number): string => {
  const diff = new Date().getTime() - timestamp;
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(timestamp));
};

interface SpaceCardProps {
  space: Space;
  isActive: boolean;
  isFavorite: boolean;
  onSwitch: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onToggleFavorite: (id: string) => void;
}

/**
 * Individual file card representing a MindMap space in grid view
 */
export const SpaceCard: React.FC<SpaceCardProps> = ({ 
  space, isActive, isFavorite, onSwitch, onDelete, onToggleFavorite 
}) => {
  const [hovered, setHovered] = useState(false);

  // Generate a deterministic gradient for each space based on name
  const hue = Math.abs(space.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 360;
  const gradient = `radial-gradient(circle at 20% 20%, hsl(${hue},70%,20%), transparent 70%), radial-gradient(circle at 80% 70%, hsl(${(hue+120)%360},70%,20%), transparent 70%)`;

  const hasNodes = space.nodes && space.nodes.length > 0;

  return (
    <div
      onClick={() => onSwitch(space.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--color-bg-surface)',
        border: `1px solid ${isActive ? 'var(--color-accent-bright)' : hovered ? 'rgba(168,85,247,0.4)' : 'var(--color-border-subtle)'}`,
        borderRadius: '16px', cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        height: '220px',
        transform: hovered ? 'translateY(-6px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: hovered
          ? '0 20px 40px -12px rgba(0, 0, 0, 0.5), 0 0 20px rgba(168,85,247,0.15)'
          : '0 4px 12px rgba(0, 0, 0, 0.2)',
        position: 'relative',
        zIndex: hovered ? 20 : 1,
      }}
    >
      {/* Thumbnail */}
      <div style={{
        flex: 1, position: 'relative', display: 'flex',
        alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        background: '#0a0a0f',
        borderBottom: '1px solid var(--color-border-subtle)',
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.4, background: gradient }} />
        
        {/* The Actual Preview */}
        <div style={{ 
          position: 'absolute', inset: '10px', 
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.5s ease',
          transform: hovered ? 'scale(1.1)' : 'scale(1)',
        }}>
          {hasNodes ? (
            <SpacePreview space={space} width={240} height={120} />
          ) : (
            <div style={{
              width: '64px', height: '64px', borderRadius: '18px',
              background: `linear-gradient(135deg, hsl(${hue},60%,40%), hsl(${hue},60%,20%))`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: `hsl(${hue},80%,90%)`,
              fontSize: '28px', fontWeight: 900,
              border: '1px solid rgba(255,255,255,0.2)',
              boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
            }}>
              {space.name.trim().charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        {/* Floating ID badge or similar if needed, but let's keep it clean */}

        {/* Hover action buttons */}
        {hovered && (
          <div
            style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', gap: '6px' }}
            onClick={e => e.stopPropagation()}
          >
            <ActionBtn
              icon={<Star size={13} fill={isFavorite ? 'currentColor' : 'none'} />}
              color={isFavorite ? '#f59e0b' : undefined}
              title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              onClick={() => onToggleFavorite(space.id)}
            />
            <ActionBtn
              icon={<Trash2 size={13} />}
              title="Delete"
              onClick={() => onDelete(space.id, space.name)}
            />
          </div>
        )}
      </div>

      {/* Info footer */}
      <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{
            fontSize: '14px', fontWeight: 700, color: 'var(--color-text-primary)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80%',
          }}>
            {space.name}
          </span>
          {isFavorite && <Star size={12} fill="#f59e0b" color="#f59e0b" />}
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          color: 'var(--color-text-muted)', fontSize: '11px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={11} />
            <span>{getTimeAgo(space.lastModified)}</span>
          </div>
          <span style={{
            background: 'rgba(255,255,255,0.06)', border: '1px solid var(--color-border-subtle)',
            padding: '1px 7px', borderRadius: '20px', fontWeight: 600,
          }}>
            {space.nodes.length} nodes
          </span>
        </div>
      </div>

      {isActive && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
          background: 'var(--color-accent-bright)',
        }} />
      )}
    </div>
  );
};

const ActionBtn: React.FC<{
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
  color?: string;
}> = ({ icon, onClick, title, color }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      width: '28px', height: '28px',
      background: 'rgba(10, 10, 20, 0.75)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '8px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: color || 'rgba(255,255,255,0.85)',
      transition: 'all 0.15s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'rgba(20, 20, 40, 0.95)'}
    onMouseLeave={e => e.currentTarget.style.background = 'rgba(10, 10, 20, 0.75)'}
  >
    {icon}
  </button>
);
