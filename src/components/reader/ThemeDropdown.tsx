import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { THEME_META, getShell } from '../../lib/theme';
import type { ReaderTheme } from '../../pages/Reader';

interface ThemeDropdownProps {
  theme: ReaderTheme;
  onThemeChange: (theme: ReaderTheme) => void;
  onOpenChange?: (isOpen: boolean) => void;
}

export function ThemeDropdown({ theme, onThemeChange, onOpenChange }: ThemeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const shell = getShell(theme);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!dropdownRef.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next && onOpenChange) {
      onOpenChange(next);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        style={{ color: shell.text, borderColor: isOpen ? shell.accent : shell.border }}
        className="reader-ctrl-btn flex items-center gap-1 px-2 py-1.5 border rounded-lg text-[11px] font-medium"
        title="Change theme"
      >
        <span
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: shell.bg, border: `1.5px solid ${shell.border}` }}
        />
        <span className="hidden sm:inline">{THEME_META.find(t => t.value === theme)?.label}</span>
        <ChevronDown
          size={10}
          style={{
            opacity:    0.5,
            transform:  isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform 150ms ease',
          }}
        />
      </button>
      {isOpen && (
        <div
          style={{ backgroundColor: shell.surface, borderColor: shell.border }}
          className="absolute right-0 top-full mt-2 border rounded-xl shadow-2xl z-[70] py-1 w-28 overflow-hidden"
        >
          {THEME_META.map(t => {
            const s = getShell(t.value);
            return (
              <button
                key={t.value}
                onClick={() => { onThemeChange(t.value); setIsOpen(false); }}
                style={{
                  backgroundColor: theme === t.value ? `${shell.accent}22` : 'transparent',
                  color:           theme === t.value ? shell.accent : shell.text,
                }}
                className="reader-ctrl-btn w-full text-left px-3 py-2 text-[11px] flex items-center gap-2"
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: s.bg, border: `1.5px solid ${s.border}` }}
                />
                {t.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
