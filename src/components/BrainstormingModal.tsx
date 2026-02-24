import { useState, useRef, useEffect, useMemo } from 'react';
import { useStore } from '../store';
import { useReactFlow } from '@xyflow/react';
import { Zap, X, CornerDownLeft } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';
import { stripHtml } from '../utils/color';

/**
 * Rapid-fire node entry modal.
 * Allows users to type multiple ideas (one per line) and batch-add them as children of the selected node.
 */
export const BrainstormingModal = () => {
  const { isBrainstorming, setBrainstorming, bulkAddNodes, nodes } = useStore();
  const { fitView } = useReactFlow();
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Target the currently selected node, fallback to root
  const selectedNode = useMemo(() => 
    nodes.find(n => n.selected) || nodes.find(n => n.id === 'root'),
    [nodes]
  );

  const handleGenerate = () => {
    if (!text.trim() || !selectedNode) return;
    const labels = text.split('\n').filter(l => l.trim());
    bulkAddNodes(selectedNode.id, labels);
    setText('');
    setBrainstorming(false);
    
    // Smoothly focus on the new result
    setTimeout(() => fitView({ duration: 800 }), 100);
  };

  // Shortcut for quick generation
  useHotkeys('meta+enter, ctrl+enter', () => {
    if (isBrainstorming) handleGenerate();
  }, { enableOnFormTags: true });

  useEffect(() => {
    if (isBrainstorming) {
      textareaRef.current?.focus();
    }
  }, [isBrainstorming]);

  if (!isBrainstorming) return null;

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="glass-panel w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 ease-spring"
        style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-accent-bright)' }}
      >
        {/* Header */}
        <div style={{
          padding: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--color-border-subtle)',
          background: 'rgba(255,255,255,0.02)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'var(--color-accent-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-accent-bright)'
            }}>
              <Zap size={20} fill="currentColor" />
            </div>
            <div>
              <h3 style={{ 
                margin: 0, 
                fontSize: '14px', 
                fontWeight: 800, 
                color: 'var(--color-text-primary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Brainstorming Mode
              </h3>
              <p style={{ 
                margin: 0, 
                fontSize: '11px', 
                color: 'var(--color-text-secondary)',
                marginTop: '2px'
              }}>
                Adding to: <span style={{ color: 'var(--color-accent-bright)', fontWeight: 700 }}>{stripHtml(selectedNode?.data.label || '') || 'Root'}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={() => setBrainstorming(false)}
            className="button-icon"
            style={{ width: '32px', height: '32px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Input Area */}
        <div style={{ padding: '24px' }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"Type your ideas here...\nOne per line\n\nExample:\nMarketing Strategy\nProduct Launch\nUser Research"}
            style={{
              width: '100%',
              height: '240px',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              color: 'var(--color-text-primary)',
              fontFamily: 'var(--font-display)',
              fontSize: '16px',
              lineHeight: '1.6',
              padding: 0
            }}
          />
        </div>

        {/* Footer Actions */}
        <div style={{
          padding: '20px 24px',
          background: 'rgba(255,255,255,0.01)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid var(--color-border-subtle)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-secondary)', fontSize: '12px' }}>
            <kbd style={{ 
              background: 'var(--color-bg-glass)', 
              padding: '2px 6px', 
              borderRadius: '4px', 
              border: '1px solid var(--color-border-subtle)',
              fontFamily: 'var(--font-mono)'
            }}>⌘</kbd>
            <kbd style={{ 
              background: 'var(--color-bg-glass)', 
              padding: '2px 6px', 
              borderRadius: '4px', 
              border: '1px solid var(--color-border-subtle)',
              fontFamily: 'var(--font-mono)'
            }}>Enter</kbd>
            <span>to Generate</span>
          </div>
          
          <button
            onClick={handleGenerate}
            disabled={!text.trim()}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 24px',
              background: 'var(--color-accent-bright)',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              fontWeight: 800,
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: '0 8px 20px var(--color-accent-soft)',
              opacity: text.trim() ? 1 : 0.5,
              transform: text.trim() ? 'scale(1)' : 'scale(0.98)'
            }}
            onMouseEnter={(e) => text.trim() && (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => text.trim() && (e.currentTarget.style.transform = 'scale(1)')}
          >
            Generate Nodes
            <CornerDownLeft size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
