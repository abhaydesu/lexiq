import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ReactReader, ReactReaderStyle } from 'react-reader';
import { ChevronDown, ChevronLeft, ChevronRight, Minus, Plus, Type } from 'lucide-react';
import type { ReaderTheme } from '../pages/Reader';

interface EpubReaderProps {
  file: File;
  bookId: string;
  onClose: () => void;
  theme: ReaderTheme;
  onThemeChange: (theme: ReaderTheme) => void;
}

type FontFamily = 'sans' | 'serif' | 'mono';

const FONT_STACKS: Record<FontFamily, string> = {
  sans:  '"GeistSans", system-ui, -apple-system, sans-serif',
  serif: 'Georgia, "Times New Roman", Palatino, serif',
  mono:  '"ui-monospace", "SFMono-Regular", Menlo, monospace',
};

const FONT_LABELS: Record<FontFamily, string> = {
  sans: 'Sans-serif',
  serif: 'Serif',
  mono: 'Monospace',
};

import { getShell } from '../lib/theme';
import { ReaderToolbar } from './reader/ReaderToolbar';
import { ReaderProgress } from './reader/ReaderProgress';

export function EpubReader({ file, bookId, onClose, theme, onThemeChange }: EpubReaderProps) {
  const [location, setLocation] = useState<string | number>(() =>
    localStorage.getItem(`lexiq-pos-${bookId}`) ?? 0,
  );
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const renditionRef   = useRef<any>(null);
  const registeredRef  = useRef(false);

  // Typography
  const [fontFamily, setFontFamily] = useState<FontFamily>('sans');
  const [fontSize,   setFontSize]   = useState(17);

  // Progress
  const [currentLoc,   setCurrentLoc]   = useState(0);
  const [totalLocs,    setTotalLocs]    = useState(0);
  const [loadingLocs,  setLoadingLocs]  = useState(false);

  // Dropdowns
  const [fontOpen,  setFontOpen]  = useState(false);
  const fontRef  = useRef<HTMLDivElement>(null);

  // Load EPUB buffer
  useEffect(() => { file.arrayBuffer().then(setBuffer); }, [file]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!fontRef.current?.contains(e.target  as Node)) setFontOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Keyboard navigation
  const leftArrowRef = useRef<HTMLButtonElement>(null);
  const rightArrowRef = useRef<HTMLButtonElement>(null);

  const lastNavTime = useRef(0);
  const navigate = useCallback((direction: 'prev' | 'next') => {
    const now = Date.now();
    if (now - lastNavTime.current < 200) return;
    lastNavTime.current = now;
    if (direction === 'prev') {
      renditionRef.current?.prev();
    } else {
      renditionRef.current?.next();
    }
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (e.repeat) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        leftArrowRef.current?.click();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        rightArrowRef.current?.click();
      }
    };

    const blockKeyup = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('keydown', handler);
    document.addEventListener('keyup', blockKeyup, true);
    return () => {
      document.removeEventListener('keydown', handler);
      document.removeEventListener('keyup', blockKeyup, true);
    };
  }, []);

  // Apply theme when it changes — also re-strip inline colors so the new text color takes effect
  useEffect(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;

    rendition.themes.select(theme);

    const textColor = theme === 'ink' ? '#ffffff' : '#000000';

    // getContents() returns the currently rendered section(s) — the correct epubjs API
    const applyToContents = () => {
      try {
        const contentsList: any[] = rendition.getContents ? rendition.getContents() : [];
        contentsList.forEach((contents: any) => {
          const doc: Document | undefined = contents?.document;
          if (!doc) return;

          // 1. Update the body color inline style — beats everything else
          if (doc.body) doc.body.style.setProperty('color', textColor, 'important');

          // 2. Strip any book inline color styles from non-code, non-link elements
          doc.querySelectorAll('*').forEach((el: Element) => {
            const htmlEl = el as HTMLElement;
            if (htmlEl === doc.body) return;
            if (htmlEl.closest('pre') || htmlEl.closest('code')) return;
            if (htmlEl.tagName === 'A' && htmlEl.hasAttribute('href')) return;
            if (htmlEl.style.color) htmlEl.style.removeProperty('color');
          });
        });
      } catch (_) {}
    };

    // Run immediately (for current content) and also after epubjs re-renders with new theme CSS
    applyToContents();
    requestAnimationFrame(applyToContents);
  }, [theme]);




  // Imperatively apply font size / family
  const applyFontSize = useCallback((size: number) => {
    const clamped = Math.max(12, Math.min(28, size));
    setFontSize(clamped);
    renditionRef.current?.themes.fontSize(`${clamped}px`);
  }, []);

  const applyFontFamily = useCallback((family: FontFamily) => {
    setFontFamily(family);
    renditionRef.current?.themes.override('font-family', FONT_STACKS[family]);
  }, []);

  // Ref so that the rendered callback can read the latest theme without stale closure
  const themeRef2 = useRef<ReaderTheme>(theme);
  useEffect(() => { themeRef2.current = theme; }, [theme]);

  // Strip inline color styles from every text node in the iframe document.
  // This is the only reliable way to defeat inline style="color:..." in book HTML.
  const stripInlineColors = useCallback((doc: Document, textColor: string) => {
    // Remove inline color from every element except <pre>/<code> descendants
    const all = doc.querySelectorAll('*');
    all.forEach((el: Element) => {
      const htmlEl = el as HTMLElement;
      // Skip code/pre descendants — keep syntax highlighting
      if (htmlEl.closest('pre') || htmlEl.closest('code')) return;
      // Skip actual hyperlinks — we want them colored
      if (htmlEl.tagName === 'A' && htmlEl.hasAttribute('href')) return;
      if (htmlEl.style.color) {
        htmlEl.style.removeProperty('color');
      }
    });
    // Also ensure body inherits correctly
    const body = doc.body;
    if (body) {
      body.style.setProperty('color', textColor, 'important');
    }
  }, []);

  // Called once by ReactReader when the rendition is created
  const getRendition = useCallback((rendition: any) => {
    renditionRef.current = rendition;

    if (!registeredRef.current) {
      const reg = (name: string, bg: string, text: string, link: string) =>
        rendition.themes.register(name, {
          body: {
            background: `${bg} !important`,
            color:      `${text} !important`,
            padding:    '0 !important',
          },
          'a[href]': { color: `${link} !important` },
        });

      reg('ink',   '#111215', '#ffffff', '#d97706');
      reg('paper', '#fcfaf2', '#000000', '#b45309');
      reg('sepia', '#f5e6ce', '#000000', '#8b5e3c');
      registeredRef.current = true;
    }

    rendition.themes.select(theme);

    // After every page render, strip all inline color styles from book HTML
    rendition.on('rendered', () => {
      const currentTheme = themeRef2.current;
      const textColor = currentTheme === 'ink' ? '#ffffff' : '#000000';
      try {
        const contentsList: any[] = rendition.getContents ? rendition.getContents() : [];
        contentsList.forEach((contents: any) => {
          const doc: Document | undefined = contents?.document;
          if (doc) stripInlineColors(doc, textColor);
        });
      } catch (_) {}
    });



    // Attach key listener to iframe document using hook to capture before epubjs/browser default handlers
    rendition.hooks.content.register((contents: any) => {
      const doc = contents.document;

      // Inject a style tag that handles inheritance — belt-and-suspenders with the JS strip above
      let styleEl = doc.getElementById('lexiq-custom-styles') as HTMLStyleElement | null;
      if (!styleEl) {
        const newEl = doc.createElement('style') as HTMLStyleElement;
        newEl.id = 'lexiq-custom-styles';
        doc.head.appendChild(newEl);
        styleEl = newEl;
      }
      (styleEl as HTMLStyleElement).textContent = `
        /* All non-code, non-link elements (but NOT body itself) inherit body color.
           Excluding body prevents the * selector from clobbering the theme's body color. */
        *:not(body):not(pre):not(pre *):not(code):not(code *):not(a[href]):not(a[href] *) {
          color: inherit !important;
        }
      `;

      // Also set body color immediately and synchronously so it takes effect before paint
      const currentTheme = themeRef2.current;
      const bodyColor = currentTheme === 'ink' ? '#ffffff' : '#000000';
      if (doc.body) doc.body.style.setProperty('color', bodyColor, 'important');

      doc.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          e.stopPropagation();
          if (e.repeat) return;
          if (e.key === 'ArrowLeft') {
            leftArrowRef.current?.click();
          } else {
            rightArrowRef.current?.click();
          }
        }
      }, true);

      // Block keyup inside the iframe to stop any default library keyup handlers from double-triggering
      doc.addEventListener('keyup', (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          e.stopPropagation();
        }
      }, true);
    });

    // Generate locations for progress tracking
    setLoadingLocs(true);
    rendition.book.locations
      .generate(1024)
      .then((locs: string[]) => {
        setTotalLocs(locs.length);
        // Calculate initial page number now that locations are generated
        try {
          const currentCfi = rendition.currentLocation()?.start?.cfi;
          if (currentCfi) {
            const loc = rendition.book.locations.locationFromCfi(currentCfi);
            if (typeof loc === 'number' && loc >= 0) {
              setCurrentLoc(loc);
            }
          }
        } catch (_) {}
      })
      .catch(console.warn)
      .finally(() => setLoadingLocs(false));
  }, []); // intentionally empty — called once at mount

  const handleLocationChange = useCallback((cfi: string) => {
    setLocation(cfi);
    if (cfi) {
      localStorage.setItem(`lexiq-pos-${bookId}`, cfi);
      try {
        const loc = renditionRef.current?.book?.locations?.locationFromCfi(cfi);
        if (typeof loc === 'number' && loc >= 0) setCurrentLoc(loc);
      } catch (_) {}
    }
  }, [bookId]);

  const shell    = getShell(theme);
  const displayPage = totalLocs > 0 ? Math.max(1, Math.min(currentLoc + 1, totalLocs)) : 0;
  const progress = totalLocs > 0 ? Math.min((displayPage / totalLocs) * 100, 100) : 0;

  const readerStyles = useMemo(() => ({
    ...ReactReaderStyle,
    readerArea: {
      ...ReactReaderStyle.readerArea,
      backgroundColor: shell.bg,
    },
    container: {
      ...ReactReaderStyle.container,
      backgroundColor: shell.bg,
    },
    tocArea: {
      ...ReactReaderStyle.tocArea,
      backgroundColor: shell.surface,
      color:           shell.text,
      borderRight:     `1px solid ${shell.border}`,
    },
    tocButtonExpanded: {
      ...ReactReaderStyle.tocButtonExpanded,
      backgroundColor: shell.surface,
    },
    tocButtonBar: {
      ...ReactReaderStyle.tocButtonBar,
      background: shell.border,
    },
    // Hide the built-in react-reader arrows; we use our own
    arrow: { display: 'none' },
  }), [shell]);

  if (!buffer) {
    return (
      <div style={{ backgroundColor: shell.bg }} className="flex items-center justify-center h-screen">
        <div
          className="w-7 h-7 rounded-full animate-spin"
          style={{ border: `2px solid ${shell.border}`, borderBottomColor: shell.accent }}
        />
      </div>
    );
  }

  return (
    <div
      style={{ backgroundColor: shell.bg, color: shell.text }}
      className="flex flex-col h-screen w-full relative overflow-hidden"
    >
      {/* ── Top progress bar ─────────────────────────────────── */}
      <ReaderProgress theme={theme} progress={progress} />

      {/* ── Toolbar ──────────────────────────────────────────── */}
      <ReaderToolbar
        title={file.name.replace(/\.epub$/i, '')}
        theme={theme}
        onThemeChange={onThemeChange}
        onClose={onClose}
        onThemeDropdownOpenChange={(isOpen) => isOpen && setFontOpen(false)}
      >
        {/* Font size */}
        <button
          onClick={() => applyFontSize(fontSize - 2)}
          style={{ color: shell.text }}
          className="reader-ctrl-btn btn-press p-2"
          title="Smaller text"
        >
          <Minus size={13} />
        </button>
        <span
          style={{ color: shell.muted }}
          className="text-[11px] font-mono tabular-nums w-6 text-center select-none"
        >
          {fontSize}
        </span>
        <button
          onClick={() => applyFontSize(fontSize + 2)}
          style={{ color: shell.text }}
          className="reader-ctrl-btn btn-press p-2"
          title="Larger text"
        >
          <Plus size={13} />
        </button>

        <div style={{ backgroundColor: shell.border }} className="w-px h-4 mx-1.5 shrink-0" />

        {/* Font family dropdown */}
        <div className="relative" ref={fontRef}>
          <button
            onClick={() => setFontOpen(o => !o)}
            style={{ color: shell.text, borderColor: fontOpen ? shell.accent : shell.border }}
            className="reader-ctrl-btn flex items-center gap-1 px-2 py-1.5 border rounded-lg text-[11px] font-medium"
            title="Change typeface"
          >
            <Type size={12} />
            <span className="hidden sm:inline">{fontFamily === 'sans' ? 'Sans' : fontFamily === 'serif' ? 'Serif' : 'Mono'}</span>
            <ChevronDown
              size={10}
              style={{
                opacity:    0.5,
                transform:  fontOpen ? 'rotate(180deg)' : 'none',
                transition: 'transform 150ms ease',
              }}
            />
          </button>
          {fontOpen && (
            <div
              style={{ backgroundColor: shell.surface, borderColor: shell.border }}
              className="absolute right-0 top-full mt-2 border rounded-xl shadow-2xl z-[70] py-1 w-36 overflow-hidden"
            >
              {(['sans', 'serif', 'mono'] as FontFamily[]).map(f => (
                <button
                  key={f}
                  onClick={() => { applyFontFamily(f); setFontOpen(false); }}
                  style={{
                    backgroundColor: fontFamily === f ? `${shell.accent}22` : 'transparent',
                    color:           fontFamily === f ? shell.accent : shell.text,
                  }}
                  className="reader-ctrl-btn w-full text-left px-3 py-2 text-[11px]"
                >
                  {FONT_LABELS[f]}
                </button>
              ))}
            </div>
          )}
        </div>
      </ReaderToolbar>

      {/* ── Reader area ──────────────────────────────────────── */}
      <div
        className="flex-1 relative overflow-hidden"
        style={{ paddingTop: '52px', paddingBottom: '36px' }}
      >
        <ReactReader
          url={buffer}
          title={file.name}
          location={location}
          locationChanged={handleLocationChange}
          getRendition={getRendition}
          epubOptions={{ flow: 'paginated' }}
          readerStyles={readerStyles}
        />

        {/* Floating nav arrows (outside iframe, so they receive pointer events) */}
        <button
          ref={leftArrowRef}
          onClick={() => navigate('prev')}
          style={{ color: shell.text }}
          className="reader-nav-btn reader-nav-btn--left"
          aria-label="Previous page"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          ref={rightArrowRef}
          onClick={() => navigate('next')}
          style={{ color: shell.text }}
          className="reader-nav-btn reader-nav-btn--right"
          aria-label="Next page"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* ── Bottom progress indicator ─────────────────────────── */}
      <div
        style={{ borderColor: shell.border, backgroundColor: `${shell.surface}cc` }}
        className="absolute bottom-0 left-0 right-0 border-t backdrop-blur-sm flex items-center justify-center py-2 px-6 gap-2"
      >
        <span
          style={{ color: shell.muted }}
          className="text-[10px] font-mono tabular-nums tracking-wide select-none"
        >
          {loadingLocs
            ? <span className="animate-pulse opacity-60">computing progress…</span>
            : totalLocs > 0
              ? `${displayPage} / ${totalLocs} · ${Math.round(progress)}%`
              : '—'}
        </span>
      </div>
    </div>
  );
}
