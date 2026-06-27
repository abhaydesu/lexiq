import { useState, useEffect, useRef } from 'react';
import { Pencil, Trash2, Check, X } from 'lucide-react';

export interface HighlightMenuProps {
  x: number;
  y: number;
  height?: number;
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
  height = 0,
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
      const menuWidth = rect.width || 240;
      const menuHeight = rect.height || 45;
      const isMobile = window.innerWidth < 640;
      
      let left: number;
      let top: number;
      
      if (isMobile) {
        // On mobile, center the menu horizontally in the viewport
        left = (window.innerWidth - menuWidth) / 2;
        // Position below the selection to avoid native browser selection tooltip overlap
        top = y + height + 16;
      } else {
        // On desktop, center above the selection
        left = x - menuWidth / 2;
        top = y - menuHeight - 12;
      }

      // Keep inside screen bounds
      if (left < 8) left = 8;
      if (left + menuWidth > window.innerWidth - 8) {
        left = window.innerWidth - menuWidth - 8;
      }
      if (top < 8) {
        // If it goes off the top screen, position it below selection instead
        top = y + 25; 
      }

      setOffset({ left, top });
    }
  }, [x, y, height, showNoteInput]);

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
        zIndex: 230,
        transformOrigin: 'bottom center',
        transition: 'top 150ms var(--ease-out), left 150ms var(--ease-out)',
      }}
      className="flex flex-col border rounded-xl shadow-2xl overflow-hidden min-w-[220px] sm:min-w-[260px] max-w-[320px] select-none highlight-menu-pop"
    >
      {/* Menu Bar */}
      <div className="flex items-center justify-between p-2 gap-2">
        {/* Colors bubbles */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {COLORS.map(c => (
            <button
              key={c.value}
              onClick={() => setSelectedColor(c.value)}
              style={{ backgroundColor: c.value }}
              className="w-6 h-6 sm:w-5 sm:h-5 rounded-full relative cursor-pointer border border-black/10 transition-transform active:scale-90"
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
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowNoteInput(prev => !prev)}
            style={{ color: showNoteInput ? shell.accent : shell.muted }}
            className={`btn-press p-2 sm:p-1.5 rounded-lg ${showNoteInput ? 'bg-black/5 dark:bg-white/5' : ''}`}
            title="Add Note"
          >
            <Pencil size={14} />
          </button>
          
          {onDelete && (
            <button
              onClick={onDelete}
              style={{ color: '#ef5350' }}
              className="btn-press p-2 sm:p-1.5 rounded-lg"
              title="Delete Highlight"
            >
              <Trash2 size={14} />
            </button>
          )}

          <button
            onClick={() => onSave(selectedColor, note.trim() || undefined)}
            style={{ color: shell.accent }}
            className="btn-press p-2 sm:p-1.5 rounded-lg"
            title="Save Highlight"
          >
            <Check size={15} className="font-bold" />
          </button>

          <button
            onClick={onClose}
            style={{ color: shell.muted }}
            className="btn-press p-2 sm:p-1.5 rounded-lg"
            title="Cancel"
          >
            <X size={15} />
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
              borderColor: shell.border,
              fontSize: '13px',
            }}
            placeholder="Write a note..."
            rows={2}
            className="w-full p-2 border rounded-lg focus:outline-none focus:border-amber-500 resize-none font-sans"
            autoFocus
          />
        </div>
      )}
    </div>
  );
}
