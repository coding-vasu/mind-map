import { useState, useRef, useEffect, useMemo } from 'react';
import { useStore } from '../store';
import { useReactFlow } from '@xyflow/react';
import { Zap, X, CornerDownLeft, Trash2, Layout, Sparkles, PlusCircle } from 'lucide-react';
import { useHotkeys } from 'react-hotkeys-hook';
import { stripHtml } from '../utils/color';

/**
 * Revamped Brainstorming Panel.
 * Enhanced for intuitive, live interaction.
 */
export const BrainstormingModal = () => {
  const { isBrainstorming, setBrainstorming, bulkAddNodes, nodes, addNode, layoutDagre } = useStore();
  const { fitView } = useReactFlow();
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Target the currently selected node, fallback to root
  const selectedNode = useMemo(() => 
    nodes.find(n => n.selected) || nodes.find(n => n.id === 'root'),
    [nodes]
  );

  const lines = useMemo(() => text.split('\n').filter(l => l.trim()), [text]);

  const handleGenerate = () => {
    if (!text.trim() || !selectedNode) return;
    bulkAddNodes(selectedNode.id, lines);
    setText('');
    setBrainstorming(false);
    
    // Smoothly focus on the new results
    setTimeout(() => fitView({ duration: 800 }), 100);
  };

  const handleAddLive = () => {
    if (!text.trim() || !selectedNode) return;
    const currentLines = text.split('\n');
    const lastLine = currentLines[currentLines.length - 1].trim();
    
    if (lastLine) {
      addNode(selectedNode.id, lastLine);
      setText(prev => prev.split('\n').slice(0, -1).join('\n') + (prev.includes('\n') ? '\n' : ''));
      setTimeout(() => fitView({ duration: 400 }), 50);
    }
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
    <div className="fixed inset-y-0 right-0 z-1000 w-[420px] flex animate-spring-slide-in">
      <div 
        className="h-full w-full frosted-glass border-l border-white/10 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.3)] overflow-hidden"
        style={{ background: 'var(--color-bg-surface)' }}
      >
        {/* Header Section */}
        <div className="p-8 pb-6 border-b border-white/5 bg-white/2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/20">
                <Sparkles size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-white leading-none tracking-tight">BRAINSTORM</h2>
                <span className="text-[10px] font-bold text-violet-400 tracking-[0.2em] uppercase">Rapid Entry Mode</span>
              </div>
            </div>
            <button 
              onClick={() => setBrainstorming(false)}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all duration-200"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex gap-2">
            {/* Context Display */}
            <div className="flex-1 flex items-center gap-3 p-4 rounded-2xl bg-white/3 border border-white/5">
              <div className="w-2 h-2 rounded-full bg-violet-500 animate-pulse shadow-[0_0_8px_var(--color-accent-bright)]" />
              <div className="flex flex-col">
                <span className="text-[10px] uppercase font-black text-white/30 tracking-wider">Target Node</span>
                <span className="text-sm font-bold text-violet-100 truncate max-w-[160px]">
                  {stripHtml(selectedNode?.data.label || '') || 'Root'}
                </span>
              </div>
            </div>

            {/* Layout Quick Toggle */}
            <button 
              onClick={() => layoutDagre()}
              className="flex items-center justify-center p-4 rounded-2xl bg-white/3 border border-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all group"
              title="Organize map"
            >
              <Layout size={20} className="group-active:scale-90" />
            </button>
          </div>
        </div>

        {/* Input area */}
        <div className="flex-1 flex flex-col p-8 pt-6 overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Thought Stream</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-[10px] font-bold bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-500/20 text-violet-400">
                <Zap size={10} />
                <span>{lines.length} {lines.length === 1 ? 'Idea' : 'Ideas'}</span>
              </div>
              <button 
                onClick={() => setText('')}
                disabled={!text}
                title="Clear all"
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-colors disabled:opacity-0"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          
          <div className="relative flex-1 group min-h-0">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => {
                const newVal = e.target.value;
                setText(newVal);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey && text.trim()) {
                  e.preventDefault();
                  handleAddLive();
                }
              }}
              placeholder={"What's on your mind?\n\nPress ENTER to add instantly\nShift+Enter for a new line\n\nExample:\nPhase 1: Research\nPhase 2: Design"}
              className="w-full h-full bg-white/2 border border-white/5 rounded-2xl p-6 text-white text-lg leading-relaxed placeholder:text-white/10 focus:outline-none focus:border-violet-500/30 focus:bg-white/4 transition-all resize-none group-hover:border-white/10 scrollbar-hide"
              style={{ fontFamily: 'var(--font-display)' }}
            />
            {!text && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center opacity-20">
                <PlusCircle size={48} className="text-white/5 mb-4" strokeWidth={1} />
                <p className="text-xs text-center text-white/40 max-w-[200px] leading-relaxed">
                  Ideas are added live as you press Enter. CMD+Enter to finish and close.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-8 pt-4 border-t border-white/5 bg-white/2">
          <button
            onClick={handleGenerate}
            disabled={!text.trim()}
            className="w-full h-16 rounded-2xl bg-linear-to-r from-violet-600 to-fuchsia-600 flex items-center justify-center gap-3 text-white font-black text-lg shadow-xl shadow-violet-600/20 hover:shadow-violet-600/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-20 disabled:scale-100 disabled:shadow-none"
          >
            FINISH SESSION
            <CornerDownLeft size={20} />
          </button>
          
          <div className="mt-6 flex flex-col gap-3">
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
               <span className="text-white/20">Add Live</span>
               <div className="flex items-center gap-1.5">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 font-mono text-white/40">ENTER</kbd>
               </div>
            </div>
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
               <span className="text-white/20">Finish & Close</span>
               <div className="flex items-center gap-1.5 text-violet-400">
                  <kbd className="px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 font-mono">CMD</kbd>
                  <span className="opacity-50">+</span>
                  <kbd className="px-1.5 py-0.5 rounded bg-violet-500/10 border border-violet-500/20 font-mono">ENTER</kbd>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
