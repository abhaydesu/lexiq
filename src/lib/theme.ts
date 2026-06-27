import type { ReaderTheme } from '../pages/Reader';

export const THEME_META: { value: ReaderTheme; label: string }[] = [
  { value: 'ink',   label: 'Ink'   },
  { value: 'paper', label: 'Paper' },
  { value: 'sepia', label: 'Sepia' },
];

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
    default: return { 
      bg: '#111215', surface: '#1a1c22', border: '#2c2f36', 
      text: '#ffffff', muted: '#8c929e', accent: '#d97706',
      filter: 'invert(100%) hue-rotate(180deg) contrast(90%)'
    };
  }
}
