import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Trash2, Check, X } from 'lucide-react';

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

  const handleColorClick = (colorValue: string) => {
    if (initialColor === colorValue) {
      if (onDelete) {
        onDelete();
      } else {
        onClose();
      }
    } else {
      setSelectedColor(colorValue);
      if (!showNoteInput) {
        onSave(colorValue, note.trim() || undefined);
      }
    }
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: 'absolute',
        left: `${offset.left}px`,
        top: `${offset.top}px`,
        zIndex: 230,
        transition: 'top 150ms var(--ease-out), left 150ms var(--ease-out)',
      }}
      className="flex flex-col items-center gap-2 select-none highlight-menu-pop"
    >
      {/* Container for Color Pill + Action Circles */}
      <div className="flex items-center gap-2">
        {/* Pill 1: Color Selection */}
        <div
          style={{
            backgroundColor: shell.surface,
            borderColor: shell.border,
            color: shell.text,
          }}
          className="flex items-center p-2 border rounded-full shadow-2xl shrink-0"
        >
          {/* Colors bubbles */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => handleColorClick(c.value)}
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
        </div>

        {/* Note Trigger Button */}
        <button
          onClick={() => setShowNoteInput(prev => !prev)}
          style={{
            backgroundColor: shell.surface,
            borderColor: shell.border,
            color: showNoteInput ? shell.accent : shell.muted,
          }}
          className={`w-9 h-9 rounded-full border shadow-2xl flex items-center justify-center cursor-pointer transition-transform active:scale-90 shrink-0 ${
            showNoteInput ? 'bg-black/5 dark:bg-white/5' : ''
          }`}
          title="Add Note"
        >
          <MessageSquare size={14} />
        </button>
        
        {/* Circle Button: Delete Highlight */}
        {onDelete && (
          <button
            onClick={onDelete}
            style={{
              backgroundColor: shell.surface,
              borderColor: shell.border,
              color: '#ef5350',
            }}
            className="w-9 h-9 rounded-full border shadow-2xl flex items-center justify-center cursor-pointer transition-transform active:scale-90 shrink-0"
            title="Delete Highlight"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Note Input Box floating directly below the button row */}
      {showNoteInput && (
        <div 
          style={{ 
            backgroundColor: shell.bg, 
            borderColor: shell.border,
            color: shell.text,
          }}
          className="p-2.5 border rounded-2xl shadow-2xl min-w-[210px] sm:min-w-[240px] max-w-[280px] animate-in fade-in slide-in-from-top-2 duration-150"
        >
          <div className="relative">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              style={{ 
                backgroundColor: 'transparent', 
                color: shell.text, 
                fontSize: '13px',
              }}
              placeholder="Write a note..."
              rows={2}
              className="w-full p-1 pb-10 border-none focus:outline-none resize-none font-sans"
              autoFocus
            />
            <div className="absolute bottom-1 right-1 flex items-center gap-1.5">
              <button
                onClick={() => setShowNoteInput(false)}
                style={{ borderColor: shell.border }}
                className="w-6 h-6 rounded-full border flex items-center justify-center text-ink-text-muted hover:text-ink-text transition-colors cursor-pointer bg-ink-surface/50"
                title="Cancel"
              >
                <X size={11} className="opacity-70" />
              </button>
              <button
                onClick={() => onSave(selectedColor, note.trim() || undefined)}
                style={{ backgroundColor: shell.accent, color: '#fff' }}
                className="w-6 h-6 rounded-full flex items-center justify-center transition-colors cursor-pointer hover:opacity-90 shadow-sm"
                title="Save"
              >
                <Check size={11} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
