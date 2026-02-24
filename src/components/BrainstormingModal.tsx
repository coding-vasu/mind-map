import { useState, useRef, useEffect, useMemo } from 'react';
import { useStore } from '../store';
import { useReactFlow } from '@xyflow/react';
import { Zap, X, CornerDownLeft } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';

export const BrainstormingModal = () => {
  const { isBrainstorming, setBrainstorming, bulkAddNodes, nodes } = useStore();
  const { fitView } = useReactFlow();
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
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
    setTimeout(() => fitView({ duration: 800 }), 100);
  };

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
    <div className="fixed inset-0 z-200 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="glass-panel w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-accent-bright)' }}
      >
        <div className="px-6 py-4 flex items-center justify-between border-b border-border-subtle">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-accent-soft text-accent-bright">
              <Zap size={18} fill="currentColor" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Brainstorming Mode</h3>
              <p className="text-[10px] text-text-secondary">Adding to: <span className="text-accent-bright font-bold">{selectedNode?.data.label.replace(/<[^>]*>/g, '') || 'Root'}</span></p>
            </div>
          </div>
          <button 
            onClick={() => setBrainstorming(false)}
            className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-text-secondary"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type your ideas here...&#10;One per line&#10;Example:&#10;Marketing Strategy&#10;Product Launch&#10;User Research"
            className="w-full h-48 bg-transparent border-none outline-none resize-none text-text-primary placeholder:text-text-muted font-display text-base leading-relaxed"
          />
        </div>

        <div className="px-6 py-4 bg-white/5 flex items-center justify-between border-t border-border-subtle">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[10px] text-text-secondary">
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 font-mono">⌘</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/10 font-mono">Enter</kbd>
              <span>to Generate</span>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={!text.trim()}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent-bright text-white rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all shadow-lg shadow-accent-bright/20 disabled:opacity-50 disabled:scale-100"
          >
            Generate Nodes
            <CornerDownLeft size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
