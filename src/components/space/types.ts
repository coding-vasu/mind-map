/** Shared types for the Space dashboard components */
export type SidebarFilter = 'recents' | 'all' | 'favorites' | 'personal';
export type ViewMode = 'grid' | 'list';

/** Utility: format a timestamp as relative time */
export const timeAgo = (timestamp: number, now: number): string => {
  const diff = now - timestamp;
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  if (diff < 604_800_000) return `${Math.floor(diff / 86_400_000)}d ago`;
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(timestamp));
};
