import { getShell } from '../../lib/theme';
import type { ReaderTheme } from '../../lib/theme';

interface ReaderProgressProps {
  theme: ReaderTheme;
  progress: number;
}

export function ReaderProgress({ theme, progress }: ReaderProgressProps) {
  const shell = getShell(theme);
  
  return (
    <div style={{ backgroundColor: shell.border }} className="absolute top-0 left-0 right-0 h-[2px] z-[60]">
      <div
        style={{
          width:           `${progress}%`,
          backgroundColor: shell.accent,
          transition:      'width 500ms cubic-bezier(0.23,1,0.32,1)',
        }}
        className="h-full"
      />
    </div>
  );
}
