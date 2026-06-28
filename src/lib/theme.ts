export type ReaderTheme = 'ink' | 'paper' | 'sepia' | 'custom';

export const THEME_META: { value: ReaderTheme; label: string }[] = [
  { value: 'ink',   label: 'Ink'   },
  { value: 'paper', label: 'Paper' },
  { value: 'sepia', label: 'Sepia' },
  { value: 'custom', label: 'Custom' },
];

export interface CustomColors {
  bg: string;
  text: string;
}

export function getCustomColors(): CustomColors {
  try {
    const saved = localStorage.getItem('lexiq-custom-colors');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (_) {}
  // Default to a cozy warm sand/paper color if not set
  return { bg: '#f4f0e6', text: '#2c2b29' };
}

export function saveCustomColors(colors: CustomColors) {
  localStorage.setItem('lexiq-custom-colors', JSON.stringify(colors));
}

function isColorDark(hex: string): boolean {
  try {
    const c = hex.replace('#', '');
    const r = parseInt(c.substring(0, 2), 16);
    const g = parseInt(c.substring(2, 4), 16);
    const b = parseInt(c.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  } catch (_) {
    return false;
  }
}

export function getShell(theme: ReaderTheme) {
  switch (theme) {
    case 'paper': return { 
      bg: '#fcfaf2', surface: '#ffffff', border: '#e2e8f0', 
      text: '#000000', muted: '#64748b', accent: '#b45309',
      filter: ''
    };
    case 'sepia': return { 
      bg: '#f5e6ce', surface: '#fcf2df', border: '#ddc89a', 
      text: '#000000', muted: '#9b7b55', accent: '#8b5e3c',
      filter: 'sepia(100%) brightness(90%) hue-rotate(350deg)'
    };
    case 'custom': {
      const colors = getCustomColors();
      const isDark = isColorDark(colors.bg);
      return {
        bg: colors.bg,
        surface: isDark ? '#1a1c22' : '#ffffff',
        border: isDark ? '#2c2f36' : '#e2e8f0',
        text: colors.text,
        muted: isDark ? '#8c929e' : '#64748b',
        accent: '#d97706',
        filter: isDark ? 'invert(100%) hue-rotate(180deg) contrast(90%)' : ''
      };
    }
    default: return { 
      bg: '#111215', surface: '#1a1c22', border: '#2c2f36', 
      text: '#e8e6e3', muted: '#8c929e', accent: '#d97706',
      filter: 'invert(100%) hue-rotate(180deg) contrast(90%)'
    };
  }
}
