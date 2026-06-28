import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { THEME_META, getShell } from '../../lib/theme';
import type { ReaderTheme, CustomColors } from '../../lib/theme';

interface ThemeDropdownProps {
  theme: ReaderTheme;
  customColors: CustomColors;
  onThemeChange: (theme: ReaderTheme) => void;
  onCustomColorsChange: (colors: CustomColors) => void;
  onOpenChange?: (isOpen: boolean) => void;
}

export function ThemeDropdown({ 
  theme, 
  customColors, 
  onThemeChange, 
  onCustomColorsChange, 
  onOpenChange 
}: ThemeDropdownProps) {
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

  const handleColorChange = (key: 'bg' | 'text', val: string) => {
    const nextColors = { ...customColors, [key]: val };
    onCustomColorsChange(nextColors);
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
          className="absolute right-0 top-full mt-2 border rounded-xl shadow-2xl z-[70] py-1 w-36 overflow-hidden flex flex-col"
        >
          <div className="flex flex-col py-1">
            {THEME_META.map(t => {
              const s = getShell(t.value);
              return (
                <button
                  key={t.value}
                  onClick={() => { onThemeChange(t.value); }}
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

          {theme === 'custom' && (
            <div 
              className="border-t px-3 py-2 flex flex-col gap-2 bg-black/[0.02] dark:bg-white/[0.02]"
              style={{ borderColor: shell.border }}
            >
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-wider font-semibold text-ink-text-muted">Background</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customColors.bg}
                    onChange={(e) => handleColorChange('bg', e.target.value)}
                    className="w-5 h-5 rounded border border-black/10 cursor-pointer overflow-hidden p-0 bg-transparent"
                  />
                  <span className="text-[10px] font-mono select-all">{customColors.bg}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[9px] uppercase tracking-wider font-semibold text-ink-text-muted">Text Color</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customColors.text}
                    onChange={(e) => handleColorChange('text', e.target.value)}
                    className="w-5 h-5 rounded border border-black/10 cursor-pointer overflow-hidden p-0 bg-transparent"
                  />
                  <span className="text-[10px] font-mono select-all">{customColors.text}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
