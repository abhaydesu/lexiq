import { X } from 'lucide-react';
import { getShell } from '../../lib/theme';
import type { ReaderTheme } from '../../pages/Reader';
import { ThemeDropdown } from './ThemeDropdown';

interface ReaderToolbarProps {
  title: string;
  theme: ReaderTheme;
  onThemeChange: (theme: ReaderTheme) => void;
  onClose: () => void;
  children?: React.ReactNode;
  onThemeDropdownOpenChange?: (isOpen: boolean) => void;
}

export function ReaderToolbar({ 
  title, 
  theme, 
  onThemeChange, 
  onClose, 
  children,
  onThemeDropdownOpenChange
}: ReaderToolbarProps) {
  const shell = getShell(theme);
  
  return (
    <div
      style={{ backgroundColor: `${shell.surface}f0`, borderColor: shell.border }}
      className="absolute top-[2px] left-0 right-0 z-[210] border-b backdrop-blur-md flex items-center justify-between px-2 sm:px-3 py-2 sm:py-2.5 gap-2 sm:gap-4"
    >
      {/* Left: back + title */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          onClick={onClose}
          style={{ color: shell.text }}
          className="reader-ctrl-btn btn-press p-2 shrink-0"
          title="Back to library"
        >
          <X size={18} />
        </button>
        <span
          style={{ color: shell.muted }}
          className="text-[11px] truncate hidden sm:block max-w-[220px] select-none"
        >
          {title.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Right: custom controls + theme */}
      <div className="flex items-center gap-0.5 shrink-0">
        {children}
        
        {children && <div style={{ backgroundColor: shell.border }} className="w-px h-4 mx-1.5 shrink-0" />}

        <ThemeDropdown 
          theme={theme} 
          onThemeChange={onThemeChange} 
          onOpenChange={onThemeDropdownOpenChange}
        />
      </div>
    </div>
  );
}
