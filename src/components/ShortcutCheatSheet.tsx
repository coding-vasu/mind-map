import { HelpCircle, X } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';

const ShortcutGroup = ({ title, shortcuts }: { title: string; shortcuts: { key: string; label: string }[] }) => (
  <div style={{ marginBottom: '24px' }}>
    <h3 style={{ 
      fontSize: '11px', 
      color: 'var(--color-text-secondary)', 
      fontWeight: 800, 
      textTransform: 'uppercase', 
      letterSpacing: '0.1em',
      marginBottom: '12px',
      borderBottom: '1px solid var(--color-border-subtle)',
      paddingBottom: '4px'
    }}>
      {title}
    </h3>
    <div style={{ display: 'grid', gap: '10px' }}>
      {shortcuts.map((s, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '13px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>{s.label}</span>
          <kbd style={{ 
            background: 'var(--color-bg-surface)', 
            border: '1px solid var(--color-border-subtle)', 
            borderBottom: '2px solid var(--color-border-active)',
            padding: '4px 10px', 
            borderRadius: '8px', 
            fontSize: '11px', 
            color: 'var(--color-text-accent)',
            fontFamily: 'var(--font-mono)',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: '28px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            letterSpacing: '0.02em'
          }}>
            {s.key}
          </kbd>
        </div>
      ))}
    </div>
  </div>
);

export const ShortcutCheatSheet = () => {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button 
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '46px',
            height: '46px',
            borderRadius: '50%',
            background: 'var(--color-bg-glass)',
            border: '1px solid var(--color-border-active)',
            color: 'var(--color-accent-bright)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 100,
            backdropFilter: 'blur(16px)',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1) rotate(10deg)';
            e.currentTarget.style.boxShadow = '0 0 20px var(--color-accent-soft)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)';
          }}
        >
          <HelpCircle size={24} />
        </button>
      </Dialog.Trigger>
      
      <Dialog.Portal>
        <Dialog.Overlay 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'var(--color-bg-overlay)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            animation: 'fade-in 0.3s ease-out'
          }}
        />
        <Dialog.Content 
          className="glass-panel"
          style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '95vw',
            maxWidth: '520px',
            maxHeight: '90vh',
            padding: '32px',
            zIndex: 1001,
            overflowY: 'auto',
            border: '1px solid var(--color-border-active)',
            animation: 'slide-up 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <div>
              <Dialog.Title style={{ fontSize: '26px', fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                Keyboard Shortcuts
              </Dialog.Title>
              <Dialog.Description style={{ fontSize: '14px', color: 'var(--color-text-secondary)', marginTop: '6px', fontWeight: 500 }}>
                Master the speed of thought.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button 
                className="button-icon" 
                style={{ width: '40px', height: '40px', borderRadius: '14px', border: '1px solid var(--color-border-subtle)' }}
              >
                <X size={20} />
              </button>
            </Dialog.Close>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <ShortcutGroup 
              title="Navigation" 
              shortcuts={[
                { key: 'Arrows', label: 'Move Selection' },
                { key: 'Space', label: 'Edit Node' },
                { key: 'Tab', label: 'Add Child Topic' },
                { key: 'Enter', label: 'Add Sibling Topic' },
                { key: 'B', label: 'Toggle Brainstorm Mode' },
              ]}
            />
            
            <ShortcutGroup 
              title="Actions" 
              shortcuts={[
                { key: '⌘ + Z', label: 'Undo' },
                { key: '⌘ + ⇧ + Z', label: 'Redo' },
                { key: 'Del / Backspace', label: 'Delete Selection' },
              ]}
            />

            <ShortcutGroup 
              title="Interactions" 
              shortcuts={[
                { key: 'Dbl Click', label: 'Recenter View / Edit Node' },
                { key: 'Drag & Drop', label: 'Reparent Node (Drop on target)' },
              ]}
            />
          </div>

          <div style={{ 
            marginTop: '24px', 
            padding: '18px', 
            background: 'var(--color-accent-soft)', 
            borderRadius: '20px',
            border: '1px solid var(--color-border-active)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            boxShadow: 'inset 0 0 20px rgba(255,255,255,0.05)'
          }}>
            <div style={{ 
              width: '36px', 
              height: '36px', 
              borderRadius: '12px', 
              background: 'var(--color-accent-bright)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 12px var(--color-accent-soft)',
              fontSize: '18px'
            }}>
              💡
            </div>
            <span style={{ fontSize: '13.5px', color: 'var(--color-text-primary)', fontWeight: 600, lineHeight: 1.5 }}>
              Hold <strong>Shift</strong> while dragging to select multiple nodes.
            </span>
          </div>
        </Dialog.Content>

      </Dialog.Portal>
    </Dialog.Root>
  );
};
