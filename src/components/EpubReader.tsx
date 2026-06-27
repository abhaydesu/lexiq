import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ReactReader, ReactReaderStyle } from 'react-reader';
import { ChevronDown, ChevronLeft, ChevronRight, Minus, Plus, Type, Highlighter, BookOpen, Trash2 } from 'lucide-react';
import type { ReaderTheme } from '../pages/Reader';
import { v4 as uuidv4 } from 'uuid';
import { HighlightMenu } from './reader/HighlightMenu';
import type { Highlight } from '../lib/supabase-mock';

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
  const [fontFamily, setFontFamily] = useState<FontFamily>(() => {
    return (localStorage.getItem('lexiq-font-family') as FontFamily) || 'sans';
  });
  const [fontSize, setFontSize] = useState(() => {
    return parseInt(localStorage.getItem('lexiq-font-size') || '17', 10);
  });

  // Progress
  const [currentLoc,   setCurrentLoc]   = useState(0);
  const [totalLocs,    setTotalLocs]    = useState(0);
  const [loadingLocs,  setLoadingLocs]  = useState(false);

  // Highlights
  const [highlights, setHighlights] = useState<Highlight[]>(() => {
    try {
      const data = localStorage.getItem(`lexiq-highlights-${bookId}`);
      return data ? JSON.parse(data) : [];
    } catch (_) {
      return [];
    }
  });

  const [selection, setSelection] = useState<{
    cfiRange: string;
    text: string;
    x: number;
    y: number;
    contents: any;
  } | null>(null);
  const [editingHighlight, setEditingHighlight] = useState<Highlight | null>(null);
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'chapters' | 'highlights'>('chapters');

  const highlightsRef = useRef<Highlight[]>(highlights);
  useEffect(() => { highlightsRef.current = highlights; }, [highlights]);

  const bookIdRef = useRef<string>(bookId);
  useEffect(() => { bookIdRef.current = bookId; }, [bookId]);

  // Save highlights whenever they change
  useEffect(() => {
    localStorage.setItem(`lexiq-highlights-${bookId}`, JSON.stringify(highlights));
  }, [highlights, bookId]);

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

  // Highlight handling functions
  const handleHighlightClick = useCallback((e: MouseEvent, h: Highlight) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rendition = renditionRef.current;
    if (!rendition) return;
    
    try {
      const contentsList = rendition.getContents() || [];
      const contents = contentsList[0]; 
      const iframe = contents?.document?.defaultView?.frameElement as HTMLIFrameElement;
      if (!iframe || !contents) return;

      const iframeRect = iframe.getBoundingClientRect();
      const range = contents.range(h.cfi_range);
      if (!range) return;
      const rect = range.getBoundingClientRect();
      
      const x = iframeRect.left + rect.left + rect.width / 2;
      const y = iframeRect.top + rect.top;

      setEditingHighlight(h);
      setSelection({
        cfiRange: h.cfi_range,
        text: h.text,
        x,
        y,
        contents,
      });
      setShowHighlightMenu(true);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const applyHighlightsToRendition = useCallback(() => {
    const rendition = renditionRef.current;
    if (!rendition) return;

    highlightsRef.current.forEach(h => {
      try {
        rendition.annotations.remove(h.cfi_range, 'highlight');
        rendition.annotations.remove(h.cfi_range, 'mark');

        rendition.annotations.add(
          'highlight',
          h.cfi_range,
          { id: h.id },
          (e: MouseEvent) => handleHighlightClick(e, h),
          'epubjs-hl',
          { fill: h.color, 'fill-opacity': '0.35', style: 'mix-blend-mode: multiply; cursor: pointer;' }
        );

        if (h.note) {
          rendition.annotations.add(
            'mark',
            h.cfi_range,
            { id: h.id },
            (e: MouseEvent) => handleHighlightClick(e, h)
          );
        }
      } catch (e) {
        console.error("Failed to apply highlight:", e);
      }
    });
  }, [handleHighlightClick]);

  const deleteHighlight = useCallback((id: string) => {
    const target = highlights.find(h => h.id === id);
    if (target && renditionRef.current) {
      try {
        renditionRef.current.annotations.remove(target.cfi_range, 'highlight');
        renditionRef.current.annotations.remove(target.cfi_range, 'mark');
      } catch (e) {
        console.error("Failed to remove annotation:", e);
      }
    }
    setHighlights(prev => prev.filter(h => h.id !== id));
    setShowHighlightMenu(false);
    setSelection(null);
    setEditingHighlight(null);
  }, [highlights]);

  const handleSaveHighlight = useCallback((color: string, note?: string) => {
    if (!selection) return;

    if (editingHighlight) {
      setHighlights(prev => prev.map(h => 
        h.id === editingHighlight.id 
          ? { ...h, color, note, created_at: new Date().toISOString() }
          : h
      ));
    } else {
      const newHighlight: Highlight = {
        id: uuidv4(),
        user_id: 'mock-user',
        book_id: bookIdRef.current,
        cfi_range: selection.cfiRange,
        text: selection.text,
        color,
        note,
        created_at: new Date().toISOString(),
      };
      setHighlights(prev => [...prev, newHighlight]);
    }
    
    // Clear selection UI
    if (selection.contents) {
      selection.contents.window.getSelection().removeAllRanges();
    }
    setShowHighlightMenu(false);
    setSelection(null);
    setEditingHighlight(null);
  }, [selection, editingHighlight]);

  const handleCancelHighlight = useCallback(() => {
    if (selection && selection.contents) {
      selection.contents.window.getSelection().removeAllRanges();
    }
    setShowHighlightMenu(false);
    setSelection(null);
    setEditingHighlight(null);
  }, [selection]);

  const handleContainerClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const button = target.closest('button');
    
    const isToggle = button && button.style.position === 'absolute' && (button.style.left === '10px' || button.style.left === '-246px');
    const isBackdrop = target.style.position === 'absolute' && target.style.left === '256px' && target.style.zIndex === '1';
    const isChapterLink = button && 
                         button.closest('div[style*="border-right"]') !== null && 
                         !button.classList.contains('sidebar-tab-btn') &&
                         !button.classList.contains('sidebar-delete-btn');

    if (isToggle) {
      setIsSidebarOpen(prev => !prev);
    } else if (isBackdrop) {
      setIsSidebarOpen(false);
    } else if (isChapterLink) {
      setIsSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('click', handleContainerClick);
    return () => document.removeEventListener('click', handleContainerClick);
  }, [handleContainerClick]);

  // Sync highlights to rendition when layout changes (font size, font family, highlights)
  useEffect(() => {
    applyHighlightsToRendition();
    
    // Also run after a short delay to allow browser layout reflow to complete
    const timer = setTimeout(() => {
      applyHighlightsToRendition();
    }, 150);

    return () => clearTimeout(timer);
  }, [highlights, fontFamily, fontSize, applyHighlightsToRendition]);

  // Re-sync highlights on window resize to match the new container bounds
  useEffect(() => {
    const handleResize = () => {
      setTimeout(() => {
        applyHighlightsToRendition();
      }, 150);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [applyHighlightsToRendition]);

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
    localStorage.setItem('lexiq-font-size', clamped.toString());
    renditionRef.current?.themes.fontSize(`${clamped}px`);
  }, []);

  const applyFontFamily = useCallback((family: FontFamily) => {
    setFontFamily(family);
    localStorage.setItem('lexiq-font-family', family);
    renditionRef.current?.themes.override('font-family', `${FONT_STACKS[family]} !important`);
    
    // Force immediate update on currently rendered pages
    try {
      const contentsList: any[] = renditionRef.current?.getContents ? renditionRef.current.getContents() : [];
      contentsList.forEach((contents: any) => {
        if (contents?.document?.body) {
          contents.document.body.style.setProperty('font-family', FONT_STACKS[family], 'important');
        }
      });
    } catch (_) {}
  }, []);

  // Ref so that the rendered callback can read the latest theme without stale closure
  const themeRef2 = useRef<ReaderTheme>(theme);
  useEffect(() => { themeRef2.current = theme; }, [theme]);
  
  const fontRef2 = useRef<FontFamily>(fontFamily);
  useEffect(() => { fontRef2.current = fontFamily; }, [fontFamily]);

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
    rendition.themes.override('font-family', `${FONT_STACKS[fontFamily]} !important`);
    rendition.themes.fontSize(`${fontSize}px`);

    // After every page render, strip all inline color styles from book HTML
    rendition.on('rendered', () => {
      const currentTheme = themeRef2.current;
      const currentFont = fontRef2.current;
      const textColor = currentTheme === 'ink' ? '#ffffff' : '#000000';
      try {
        const contentsList: any[] = rendition.getContents ? rendition.getContents() : [];
        contentsList.forEach((contents: any) => {
          const doc: Document | undefined = contents?.document;
          if (!doc) return;
          
          if (doc.body) {
            doc.body.style.setProperty('font-family', FONT_STACKS[currentFont], 'important');
          }
          stripInlineColors(doc, textColor);
        });
        applyHighlightsToRendition();
      } catch (_) {}
    });

    // Listen for text selection to show the highlight menu
    rendition.on('selected', (cfiRange: string, contents: any) => {
      const selectionObj = contents.window.getSelection();
      const text = selectionObj.toString().trim();
      if (!text) return;

      const range = selectionObj.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      const iframe = contents.document.defaultView.frameElement as HTMLIFrameElement;
      if (!iframe) return;

      const iframeRect = iframe.getBoundingClientRect();
      const x = iframeRect.left + rect.left + rect.width / 2;
      const y = iframeRect.top + rect.top;

      setSelection({
        cfiRange,
        text,
        x,
        y,
        contents,
      });
      setShowHighlightMenu(true);
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
        /* Force font inheritance for all non-code elements */
        *:not(body):not(pre):not(pre *):not(code):not(code *) {
          font-family: inherit !important;
        }
        /* All non-code, non-link elements (but NOT body itself) inherit body color.
           Excluding body prevents the * selector from clobbering the theme's body color. */
        *:not(body):not(pre):not(pre *):not(code):not(code *):not(a[href]):not(a[href] *) {
          color: inherit !important;
        }
        /* Style highlights to be clickable */
        .epubjs-hl {
          cursor: pointer !important;
          pointer-events: auto !important;
        }
        /* Style note marks (small document icon) */
        a[ref="epubjs-mk"] {
          display: inline-block !important;
          width: 14px !important;
          height: 14px !important;
          background-color: #d97706 !important;
          border-radius: 9999px !important;
          cursor: pointer !important;
          z-index: 10 !important;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='8' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'%3E%3C/path%3E%3C/svg%3E") !important;
          background-repeat: no-repeat !important;
          background-position: center !important;
          margin-left: 3px !important;
          transform: translateY(2px) !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.3) !important;
          transition: transform 100ms ease !important;
        }
        a[ref="epubjs-mk"]:hover {
          transform: translateY(2px) scale(1.15) !important;
        }
      `;

      // Also set body color immediately and synchronously so it takes effect before paint
      const currentTheme = themeRef2.current;
      const currentFont = fontRef2.current;
      const bodyColor = currentTheme === 'ink' ? '#ffffff' : '#000000';
      if (doc.body) {
        doc.body.style.setProperty('color', bodyColor, 'important');
        doc.body.style.setProperty('font-family', FONT_STACKS[currentFont], 'important');
      }

      // Hide selection menu when clicking inside the iframe
      doc.addEventListener('click', () => {
        const selectionObj = contents.window.getSelection();
        if (selectionObj && selectionObj.isCollapsed) {
          setShowHighlightMenu(false);
          setSelection(null);
        }
      });

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
      paddingTop:      '100px',
      transition:      'background-color 300ms var(--ease-out), border-color 300ms var(--ease-out)',
    },
    tocAreaButton: {
      ...ReactReaderStyle.tocAreaButton,
      fontFamily:      'inherit',
      fontSize:        '12px',
      color:           shell.muted,
      borderBottom:    `1px solid ${shell.border}22`,
      padding:         '12px 20px',
      transition:      'all 180ms ease',
    },
    tocButtonExpanded: {
      ...ReactReaderStyle.tocButtonExpanded,
      backgroundColor: 'transparent',
      left: '-246px',
    },
    tocButtonBar: {
      ...ReactReaderStyle.tocButtonBar,
      background: shell.text,
      transition: 'none',
    },
    // Hide the built-in react-reader arrows and title; we use our own
    arrow: { display: 'none' },
    titleArea: { display: 'none' },
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
        className="epub-reader-container flex-1 relative overflow-hidden"
        style={{ paddingTop: '52px', paddingBottom: '36px' }}
      >
        <ReactReader
          url={buffer}
          title=""
          location={location}
          locationChanged={handleLocationChange}
          getRendition={getRendition}
          epubOptions={{ flow: 'paginated' }}
          readerStyles={readerStyles}
        />

        {/* Custom Sidebar Overlay inside the TOC sidebar space */}
        {isSidebarOpen && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: '52px',
              bottom: '36px',
              width: '256px',
              zIndex: 45,
              backgroundColor: shell.surface,
              borderRight: `1px solid ${shell.border}`,
              display: 'flex',
              flexDirection: 'column',
              pointerEvents: 'none',
            }}
          >
            {/* Tab Selector */}
            <div className="flex border-b" style={{ borderColor: shell.border, paddingLeft: '50px', pointerEvents: 'auto' }}>
              <button
                onClick={() => setSidebarTab('chapters')}
                style={{
                  color: sidebarTab === 'chapters' ? shell.accent : shell.muted,
                  borderBottomColor: sidebarTab === 'chapters' ? shell.accent : 'transparent',
                }}
                className="sidebar-tab-btn flex-1 py-3.5 text-[10px] font-bold border-b-2 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <BookOpen size={11} />
                Chapters
              </button>
              <button
                onClick={() => setSidebarTab('highlights')}
                style={{
                  color: sidebarTab === 'highlights' ? shell.accent : shell.muted,
                  borderBottomColor: sidebarTab === 'highlights' ? shell.accent : 'transparent',
                }}
                className="sidebar-tab-btn flex-1 py-3.5 text-[10px] font-bold border-b-2 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Highlighter size={11} />
                Notes ({highlights.length})
              </button>
            </div>

            {/* Highlights List Tab content (covers TOC if active) */}
            {sidebarTab === 'highlights' && (
              <div 
                style={{ pointerEvents: 'auto', backgroundColor: shell.surface }}
                className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 bg-ink-surface"
              >
                {highlights.length === 0 ? (
                  <div style={{ color: shell.muted }} className="text-[10px] text-center py-10 select-none">
                    No highlights or notes yet.<br />Select text to create one.
                  </div>
                ) : (
                  highlights.map(h => (
                    <div
                      key={h.id}
                      style={{ backgroundColor: `${h.color}15`, borderColor: shell.border }}
                      className="p-2 border rounded-lg flex flex-col gap-1.5 relative group hover:border-amber-500/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1">
                          <span style={{ backgroundColor: h.color }} className="w-2 h-2 rounded-full shrink-0" />
                          <span style={{ color: shell.muted }} className="text-[8px] font-mono select-none">
                            {new Date(h.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteHighlight(h.id);
                          }}
                          style={{ color: shell.muted }}
                          className="sidebar-delete-btn opacity-0 group-hover:opacity-100 hover:!text-red-500 p-0.5 rounded transition-opacity cursor-pointer"
                          title="Delete highlight"
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                      
                      <p
                        onClick={() => {
                          renditionRef.current?.display(h.cfi_range);
                        }}
                        className="text-[10px] leading-relaxed line-clamp-3 italic cursor-pointer hover:underline text-left"
                      >
                        "{h.text}"
                      </p>

                      {h.note && (
                        <div 
                          style={{ borderLeftColor: h.color, color: shell.text }}
                          className="text-[9px] pl-2 py-0.5 border-l-2 leading-relaxed bg-black/5 dark:bg-white/5 rounded-r text-left"
                        >
                          {h.note}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

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

      {/* Floating Highlight / Selection Menu */}
      {showHighlightMenu && selection && (
        <HighlightMenu
          x={selection.x}
          y={selection.y}
          onSave={handleSaveHighlight}
          onDelete={editingHighlight ? () => deleteHighlight(editingHighlight.id) : undefined}
          onClose={handleCancelHighlight}
          initialColor={editingHighlight?.color}
          initialNote={editingHighlight?.note}
          shell={shell}
        />
      )}
    </div>
  );
}
