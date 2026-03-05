import React, { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import Fuse from 'fuse.js';
import { useReactFlow } from '@xyflow/react';
import { type AppNode } from '../../store/types';
import { stripHtml } from '../../utils/color';

interface SearchInputProps {
  nodes: AppNode[];
}

/**
 * Search component with fuzzy finding and keyboard navigation
 */
export const SearchInput: React.FC<SearchInputProps> = ({ nodes }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const { setNodes, setCenter } = useReactFlow();

  const fuseIndex = useMemo(() => new Fuse(nodes, {
    keys: ['data.label'],
    threshold: 0.4,
    distance: 100,
  }), [nodes]);

  const searchResults = useMemo(() => {
    if (query.trim() === "") return [];
    return fuseIndex.search(query).map(r => r.item as AppNode).slice(0, 8);
  }, [query, fuseIndex]);

  const handleSelect = (node: AppNode) => {
    setNodes((nds) => nds.map(n => ({
      ...n, 
      selected: n.id === node.id
    })));
    setCenter(node.position.x + 70, node.position.y + 20, { zoom: 1.5, duration: 800 });
    setQuery('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (searchResults.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selectedNode = selectedIndex >= 0 ? searchResults[selectedIndex] : searchResults[0];
        if (selectedNode) handleSelect(selectedNode);
      } else if ((e.key === 'Tab' || e.key === 'ArrowRight') && selectedIndex <= 0) {
        const firstLabel = stripHtml((searchResults[0].data?.label as string) || '');
        if (firstLabel.toLowerCase().startsWith(query.toLowerCase())) {
          e.preventDefault();
          setQuery(firstLabel);
        }
      }
    }
    if (e.key === 'Escape') {
      setQuery('');
    }
  };

  const ghostText = useMemo(() => {
    if (!query || searchResults.length === 0) return '';
    const firstResult = stripHtml((searchResults[0].data?.label as string) || '');
    if (firstResult.toLowerCase().startsWith(query.toLowerCase())) {
      return firstResult.slice(query.length);
    }
    return '';
  }, [query, searchResults]);

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        background: 'transparent',
        borderRadius: '10px',
        padding: '0 4px',
        border: 'none',
        transition: 'all 0.2s',
        width: query ? '180px' : '120px',
      }}>
        <Search size={14} color="var(--color-text-secondary)" />
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search nodes..."
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--color-text-primary)',
              fontSize: '12px',
              padding: '6px 8px',
              width: '100%',
              outline: 'none',
              fontWeight: 500,
            }}
          />
          {ghostText && (
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '10px',
              color: 'var(--color-text-muted)',
              pointerEvents: 'none',
              fontSize: '13px',
              fontWeight: 500,
              whiteSpace: 'pre'
            }}>
              <span style={{ color: 'transparent' }}>{query}</span>
              {ghostText}
            </div>
          )}
        </div>
      </div>

      {searchResults.length > 0 && (
        <div className="glass-panel" style={{
          position: 'absolute',
          bottom: '100%',
          left: 0,
          width: '100%',
          marginBottom: '12px',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          border: '1px solid var(--color-border-subtle)',
          zIndex: 100
        }}>
          {searchResults.map((result, idx) => (
            <button
              key={result.id}
              onClick={() => handleSelect(result)}
              onMouseEnter={() => setSelectedIndex(idx)}
              style={{
                width: '100%',
                padding: '10px 16px',
                textAlign: 'left',
                background: selectedIndex === idx ? 'var(--color-bg-glass-hover)' : 'transparent',
                border: 'none',
                color: 'var(--color-text-primary)',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: result.data.color || 'var(--color-accent-bright)' }} />
              {stripHtml(result.data.label)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
