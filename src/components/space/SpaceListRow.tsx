import React, { useState } from 'react';
import { Star, Trash2, Clock } from 'lucide-react';
import type { Space } from '../../store/types';

const getTimeAgo = (timestamp: number): string => {
  const diff = new Date().getTime() - timestamp;
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(timestamp));
};

const formatDate = (ts: number) =>
  new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(ts));

interface SpaceListRowProps {
  space: Space;
  isActive: boolean;
  isFavorite: boolean;
  onSwitch: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onToggleFavorite: (id: string) => void;
}

/**
 * List view row for a MindMap space
 */
export const SpaceListRow: React.FC<SpaceListRowProps> = ({
  space, isActive, isFavorite, onSwitch, onDelete, onToggleFavorite
}) => {
  const [hovered, setHovered] = useState(false);
  const hue = Math.abs(space.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % 360;

  const initials = space.name.trim().charAt(0).toUpperCase();

  return (
    <div
      onClick={() => onSwitch(space.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 100px 120px 80px 64px',
        gap: '16px',
        alignItems: 'center',
        padding: '10px 16px',
        borderRadius: '12px',
        cursor: 'pointer',
        background: hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        border: `1px solid ${hovered ? 'var(--color-border-subtle)' : 'transparent'}`,
        transition: 'all 0.15s',
      }}
    >
      {/* Name + Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
          background: `linear-gradient(135deg, hsl(${hue},60%,30%), hsl(${hue},60%,15%))`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: `hsl(${hue},80%,85%)`,
          fontSize: '14px', fontWeight: 800,
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        }}>
          {initials}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: '14px', fontWeight: 600, color: 'var(--color-text-primary)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {space.name}
          </div>
          {isActive && (
            <div style={{ fontSize: '11px', color: 'var(--color-accent-bright)', fontWeight: 600 }}>
              ● Active
            </div>
          )}
        </div>
      </div>

      {/* Nodes */}
      <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
        {space.nodes.length} nodes
      </div>

      {/* Last Modified */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-text-muted)', fontSize: '12px' }}>
        <Clock size={12} />
        {getTimeAgo(space.lastModified)}
      </div>

      {/* Created */}
      <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
        {formatDate(space.createdAt)}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={e => e.stopPropagation()}>
        {hovered && (
          <>
            <ActionIcon
              icon={<Star size={13} fill={isFavorite ? 'currentColor' : 'none'} />}
              color={isFavorite ? '#f59e0b' : undefined}
              onClick={() => onToggleFavorite(space.id)}
              title={isFavorite ? 'Unfavorite' : 'Favorite'}
            />
            <ActionIcon
              icon={<Trash2 size={13} />}
              onClick={() => onDelete(space.id, space.name)}
              title="Delete"
            />
          </>
        )}
      </div>
    </div>
  );
};

const ActionIcon: React.FC<{ 
  icon: React.ReactNode; 
  onClick: () => void; 
  title: string; 
  color?: string;
}> = ({ icon, onClick, title, color }) => (
  <button
    onClick={onClick}
    title={title}
    style={{
      width: '26px', height: '26px',
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid var(--color-border-subtle)',
      borderRadius: '6px', cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: color || 'var(--color-text-muted)', transition: 'all 0.15s',
    }}
    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
  >
    {icon}
  </button>
);
