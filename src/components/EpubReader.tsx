import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ReactReader, ReactReaderStyle } from 'react-reader';
import { X, ChevronDown } from 'lucide-react';
import type { ReaderTheme } from '../pages/Reader';

interface EpubReaderProps {
  file: File;
  onClose: () => void;
  theme: ReaderTheme;
  onThemeChange: (theme: ReaderTheme) => void;
}

export function EpubReader({ file, onClose, theme, onThemeChange }: EpubReaderProps) {
  const [location, setLocation] = useState<string | number>(0);
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const renditionRef = useRef<any>(null);

  useEffect(() => {
    const loadFile = async () => {
      const data = await file.arrayBuffer();
      setBuffer(data);
    };
    loadFile();
  }, [file]);

  const getThemeStyles = () => {
    switch (theme) {
      case 'paper':
        return { bg: 'bg-[#fcfaf2]', text: 'text-slate-800', surface: 'bg-white', border: 'border-slate-200' };
      case 'sepia':
        return { bg: 'bg-[#f5e6ce]', text: 'text-[#433422]', surface: 'bg-[#fcf2df]', border: 'border-[#e0d0b8]' };
      case 'ink':
      default:
        return { bg: 'bg-ink-bg', text: 'text-ink-text', surface: 'bg-ink-surface', border: 'border-ink-border' };
    }
  };

  const themeStyles = getThemeStyles();

  const readerStyles = useMemo(() => ({
    ...ReactReaderStyle,
    readerArea: {
      ...ReactReaderStyle.readerArea,
      backgroundColor: theme === 'paper' ? '#fcfaf2' : theme === 'sepia' ? '#f5e6ce' : '#111215',
    },
    container: {
      ...ReactReaderStyle.container,
      backgroundColor: theme === 'paper' ? '#fcfaf2' : theme === 'sepia' ? '#f5e6ce' : '#111215',
    },
    tocArea: {
      ...ReactReaderStyle.tocArea,
      backgroundColor: theme === 'paper' ? '#ffffff' : theme === 'sepia' ? '#fcf2df' : '#1a1c22',
      color: theme === 'paper' ? '#1e293b' : theme === 'sepia' ? '#433422' : '#e8e6e3',
    },
    tocButtonExpanded: {
      ...ReactReaderStyle.tocButtonExpanded,
      backgroundColor: theme === 'paper' ? '#f1f5f9' : theme === 'sepia' ? '#e0d0b8' : '#2c2f36',
    },
    tocButtonBar: {
      ...ReactReaderStyle.tocButtonBar,
      background: theme === 'paper' ? '#1e293b' : theme === 'sepia' ? '#433422' : '#e8e6e3',
    },
  }), [theme]);

  const themesRegisteredRef = useRef(false);

  const getRendition = useCallback((rendition: any) => {
    renditionRef.current = rendition;
    
    if (!themesRegisteredRef.current) {
      const registerTheme = (name: string, bg: string, text: string) => {
        rendition.themes.register(name, {
          body: {
            background: `${bg} !important`,
            color: `${text} !important`,
            fontFamily: '"Plus Jakarta Sans", sans-serif !important',
          },
          p: {
            color: `${text} !important`,
            fontSize: '18px !important',
            lineHeight: '1.62 !important',
          },
          h1: { color: `${text} !important`, fontFamily: '"Lora", serif !important' },
          h2: { color: `${text} !important`, fontFamily: '"Lora", serif !important' },
          h3: { color: `${text} !important`, fontFamily: '"Lora", serif !important' },
          a: { color: '#d97706 !important' },
        });
      };

      registerTheme('ink', '#111215', '#e8e6e3');
      registerTheme('paper', '#fcfaf2', '#1e293b');
      registerTheme('sepia', '#f5e6ce', '#433422');
      themesRegisteredRef.current = true;
    }

    rendition.themes.select(theme);
  }, [theme]);

  useEffect(() => {
    if (renditionRef.current) {
      renditionRef.current.themes.select(theme);
    }
  }, [theme]);

  if (!buffer) {
    return (
      <div className={`flex items-center justify-center h-screen ${themeStyles.bg}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ink-accent"></div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen w-full ${themeStyles.bg} relative transition-colors duration-300`}>
      {/* Header */}
      <div className={`absolute top-0 left-0 right-0 z-50 ${themeStyles.surface}/90 backdrop-blur-md border-b ${themeStyles.border} p-4 flex items-center justify-between transition-colors duration-300`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className={`p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors ${themeStyles.text}`}
            title="Close Book"
          >
            <X size={20} />
          </button>
          <div className={`font-serif font-medium ${themeStyles.text} truncate max-w-[200px] md:max-w-md`}>
            {file.name}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={theme}
              onChange={(e) => onThemeChange(e.target.value as ReaderTheme)}
              className={`appearance-none bg-transparent hover:bg-black/5 dark:hover:bg-white/5 rounded-lg pl-3 pr-8 py-1.5 text-xs font-medium tracking-wide uppercase transition-colors outline-none cursor-pointer border ${themeStyles.border} ${themeStyles.text}`}
            >
              <option value="ink" className="bg-ink-surface text-ink-text">Ink</option>
              <option value="paper" className="bg-white text-slate-800">Paper</option>
              <option value="sepia" className="bg-[#fcf2df] text-[#433422]">Sepia</option>
            </select>
            <div className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${themeStyles.text}`}>
              <ChevronDown size={14} />
            </div>
          </div>
        </div>
      </div>

      {/* Reader Area */}
      <div className="flex-1 relative pt-16">
        <ReactReader
          url={buffer}
          title={file.name}
          location={location}
          locationChanged={(epubcifi: string) => setLocation(epubcifi)}
          getRendition={getRendition}
          epubOptions={{
            flow: 'paginated',
            manager: 'continuous'
          }}
          readerStyles={readerStyles}
        />
      </div>
    </div>
  );
}
