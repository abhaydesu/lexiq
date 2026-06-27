import { useState, useEffect, useRef } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';

export interface HighlightMenuProps {
  x: number;
  y: number;
  onSave: (color: string, note?: string) => void;
  onDelete?: () => void;
  onClose: () => void;
  shell: {
    bg: string;
    surface: string;
    border: string;
    text: string;
    muted: string;
    accent: string;
  };
  initialColor?: string;
  initialNote?: string;
}

const COLORS = [
  { name: 'yellow', value: '#ffd54f', text: '#2d2715' },
  { name: 'green',  value: '#81c784', text: '#1b2c1c' },
  { name: 'pink',   value: '#f06292', text: '#2e151d' },
  { name: 'blue',   value: '#4fc3f7', text: '#15252d' },
  { name: 'purple', value: '#ba68c8', text: '#271729' },
];

export function HighlightMenu({
  x,
  y,
  onSave,
  onDelete,
  onClose,
  shell,
  initialColor,
  initialNote,
}: HighlightMenuProps) {
  const [selectedColor, setSelectedColor] = useState(initialColor || COLORS[0].value);
  const [note, setNote] = useState(initialNote || '');
  const [showNoteInput, setShowNoteInput] = useState(!!initialNote);
  const menuRef = useRef<HTMLDivElement>(null);

  // Position offset to center menu above selection
  const [offset, setOffset] = useState({ left: x, top: y });

  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const menuWidth = rect.width || 280;
      const menuHeight = rect.height || 45;
      
      // Attempt to center the menu horizontally and position it 12px above the selection
      let left = x - menuWidth / 2;
      let top = y - menuHeight - 12;

      // Keep inside screen bounds
      if (left < 16) left = 16;
      if (left + menuWidth > window.innerWidth - 16) {
        left = window.innerWidth - menuWidth - 16;
      }
      if (top < 16) {
        // If it goes off the top screen, position it below selection instead
        top = y + 25; 
      }

      setOffset({ left, top });
    }
  }, [x, y, showNoteInput]);

  return (
    <div
      ref={menuRef}
      style={{
        position: 'absolute',
        left: `${offset.left}px`,
        top: `${offset.top}px`,
        backgroundColor: shell.surface,
        borderColor: shell.border,
        color: shell.text,
        zIndex: 100,
        transformOrigin: 'bottom center',
        transition: 'transform 150ms var(--ease-out), opacity 150ms ease, top 150ms var(--ease-out), left 150ms var(--ease-out)',
      }}
      className="flex flex-col border rounded-xl shadow-2xl overflow-hidden min-w-[260px] max-w-[320px] select-none highlight-menu-pop"
    >
      {/* Menu Bar */}
      <div className="flex items-center justify-between p-2 gap-2.5">
        {/* Colors bubbles */}
        <div className="flex items-center gap-2">
          {COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => setSelectedColor(c.value)}
              style={{ backgroundColor: c.value }}
              className="w-5 h-5 rounded-full relative cursor-pointer border border-black/10 transition-transform active:scale-90 hover:scale-105"
            >
              {selectedColor === c.value && (
                <Check
                  size={11}
                  className="absolute inset-0 m-auto"
                  style={{ color: c.text }}
                />
              )}
            </button>
          ))}
        </div>

        <div style={{ backgroundColor: shell.border }} className="w-px h-5 shrink-0" />

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowNoteInput(prev => !prev)}
            style={{ color: showNoteInput ? shell.accent : shell.muted }}
            className={`btn-press p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 ${showNoteInput ? 'bg-black/5 dark:bg-white/5' : ''}`}
            title="Add Note"
          >
            <Pencil size={13} />
          </button>
          
          {onDelete && (
            <button
              onClick={onDelete}
              style={{ color: '#ef5350' }}
              className="btn-press p-1.5 rounded-lg hover:bg-red-500/10"
              title="Delete Highlight"
            >
              <Trash2 size={13} />
            </button>
          )}

          <button
            onClick={() => onSave(selectedColor, note.trim() || undefined)}
            style={{ color: shell.accent }}
            className="btn-press p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
            title="Save Highlight"
          >
            <Check size={14} className="font-bold" />
          </button>

          <button
            onClick={onClose}
            style={{ color: shell.muted }}
            className="btn-press p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
            title="Cancel"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Note input slide down */}
      {showNoteInput && (
        <div 
          style={{ borderColor: shell.border }}
          className="border-t p-2 flex flex-col gap-1.5 bg-black/2 dark:bg-white/2"
        >
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            style={{ 
              backgroundColor: shell.bg, 
              color: shell.text, 
              borderColor: shell.border 
            }}
            placeholder="Write a note..."
            rows={2}
            className="w-full text-[11px] p-2 border rounded-lg focus:outline-none focus:border-amber-500 resize-none font-sans"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
