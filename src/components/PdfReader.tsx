import { useState, useEffect, useRef, useCallback } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, ChevronDown } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import type { ReaderTheme } from '../pages/Reader';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PdfReaderProps {
  file: File;
  bookId: string;
  onClose: () => void;
  theme: ReaderTheme;
  onThemeChange: (theme: ReaderTheme) => void;
}

const THEME_META: { value: ReaderTheme; label: string }[] = [
  { value: 'ink',   label: 'Ink'   },
  { value: 'paper', label: 'Paper' },
  { value: 'sepia', label: 'Sepia' },
];

function getShell(theme: ReaderTheme) {
  switch (theme) {
    case 'paper': return {
      bg: '#fcfaf2', surface: '#ffffff', border: '#e2e8f0',
      text: '#000000', muted: '#64748b', accent: '#b45309',
      filter: '',
    };
    case 'sepia': return {
      bg: '#f5e6ce', surface: '#fcf2df', border: '#ddc89a',
      text: '#000000', muted: '#9b7b55', accent: '#8b5e3c',
      filter: 'sepia(100%) brightness(90%) hue-rotate(350deg)',
    };
    default: return {
      bg: '#111215', surface: '#1a1c22', border: '#2c2f36',
      text: '#ffffff', muted: '#8c929e', accent: '#d97706',
      filter: 'invert(100%) hue-rotate(180deg) contrast(90%)',
    };
  }
}

export function PdfReader({ file, bookId, onClose, theme, onThemeChange }: PdfReaderProps) {
  const [numPages,    setNumPages]   = useState<number | null>(null);
  const [pageNumber,  setPageNumber] = useState<number>(() => {
    const saved = localStorage.getItem(`lexiq-pdf-page-${bookId}`);
    return saved ? parseInt(saved, 10) : 1;
  });
  const [scale,      setScale]      = useState(1.2);
  const [fileUrl,    setFileUrl]    = useState<string | null>(null);
  const [pageInput,  setPageInput]  = useState('');
  const [themeOpen,  setThemeOpen]  = useState(false);

  const containerRef  = useRef<HTMLDivElement>(null);
  const themeRef      = useRef<HTMLDivElement>(null);
  const numPagesRef   = useRef<number>(0);
  const pageNumberRef = useRef<number>(pageNumber);
  const leftArrowRef  = useRef<HTMLButtonElement>(null);
  const rightArrowRef = useRef<HTMLButtonElement>(null);

  // Keep refs in sync
  useEffect(() => { pageNumberRef.current = pageNumber; }, [pageNumber]);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Close theme dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!themeRef.current?.contains(e.target as Node)) setThemeOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const jumpToPage = useCallback((targetPage: number) => {
    const max  = numPagesRef.current || 1;
    const next = Math.max(1, Math.min(targetPage, max));
    if (next !== pageNumberRef.current) {
      pageNumberRef.current = next;
      setPageNumber(next);
      localStorage.setItem(`lexiq-pdf-page-${bookId}`, String(next));
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [bookId]);

  const lastNavTime = useRef(0);
  // Stable navigate function using refs — no stale closures
  const navigate = useCallback((delta: number) => {
    const now = Date.now();
    if (now - lastNavTime.current < 200) return;
    lastNavTime.current = now;
    jumpToPage(pageNumberRef.current + delta);
  }, [jumpToPage]);

  // Keyboard navigation and zoom shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when focused on an input
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      // Prevent multiple page turns if key is held down
      if (e.repeat) return;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        leftArrowRef.current?.click();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        rightArrowRef.current?.click();
      }

      if ((e.ctrlKey || e.metaKey) && e.key === '=') {
        e.preventDefault();
        setScale(s => parseFloat(Math.min(s + 0.15, 3).toFixed(2)));
      }
      if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        setScale(s => parseFloat(Math.max(s - 0.15, 0.5).toFixed(2)));
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

  function onDocumentLoadSuccess({ numPages: n }: { numPages: number }) {
    setNumPages(n);
    numPagesRef.current = n;
    // Clamp saved page to valid range
    setPageNumber(p => {
      const clamped = Math.max(1, Math.min(p, n));
      pageNumberRef.current = clamped;
      return clamped;
    });
  }

  const goToPage = useCallback((raw: string | number) => {
    const n = typeof raw === 'string' ? parseInt(raw, 10) : raw;
    if (!isNaN(n)) jumpToPage(n);
  }, [jumpToPage]);

  const handlePageInputBlur = () => {
    if (pageInput !== '') {
      goToPage(pageInput);
    }
    setPageInput('');
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
    if (e.key === 'Escape') {
      setPageInput('');
      (e.target as HTMLInputElement).blur();
    }
  };

  if (!fileUrl) return null;

  const shell    = getShell(theme);
  const progress = numPages ? (pageNumber / numPages) * 100 : 0;

  return (
    <div
      style={{ backgroundColor: shell.bg, color: shell.text }}
      className="flex flex-col h-screen w-full overflow-hidden relative"
    >
      {/* ── Top progress bar ─────────────────────────────────── */}
      <div style={{ backgroundColor: shell.border }} className="absolute top-0 left-0 right-0 h-[2px] z-20">
        <div
          style={{
            width:           `${progress}%`,
            backgroundColor: shell.accent,
            transition:      'width 300ms cubic-bezier(0.23,1,0.32,1)',
          }}
          className="h-full"
        />
      </div>

      {/* ── Toolbar ──────────────────────────────────────────── */}
      <div
        style={{ backgroundColor: `${shell.surface}f0`, borderColor: shell.border }}
        className="absolute top-[2px] left-0 right-0 z-10 border-b backdrop-blur-md flex items-center justify-between px-3 py-2.5 gap-4"
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
            className="text-[11px] truncate hidden sm:block max-w-[180px] select-none"
          >
            {file.name.replace(/\.pdf$/i, '')}
          </span>
        </div>

        {/* Right: zoom + theme */}
        <div className="flex items-center gap-0.5 shrink-0">
          {/* Zoom */}
          <button
            onClick={() => setScale(s => parseFloat(Math.max(s - 0.15, 0.5).toFixed(2)))}
            style={{ color: shell.text }}
            className="reader-ctrl-btn btn-press p-2"
            title="Zoom out (Ctrl −)"
          >
            <ZoomOut size={15} />
          </button>
          <span
            style={{ color: shell.muted }}
            className="text-[11px] font-mono tabular-nums w-9 text-center select-none"
          >
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale(s => parseFloat(Math.min(s + 0.15, 3).toFixed(2)))}
            style={{ color: shell.text }}
            className="reader-ctrl-btn btn-press p-2"
            title="Zoom in (Ctrl +)"
          >
            <ZoomIn size={15} />
          </button>

          <div style={{ backgroundColor: shell.border }} className="w-px h-4 mx-1.5 shrink-0" />

          {/* Theme dropdown */}
          <div className="relative" ref={themeRef}>
            <button
              onClick={() => setThemeOpen(o => !o)}
              style={{ color: shell.text, borderColor: themeOpen ? shell.accent : shell.border }}
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
                  transform:  themeOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 150ms ease',
                }}
              />
            </button>
            {themeOpen && (
              <div
                style={{ backgroundColor: shell.surface, borderColor: shell.border }}
                className="absolute right-0 top-full mt-2 border rounded-xl shadow-2xl z-[70] py-1 w-28 overflow-hidden"
              >
                {THEME_META.map(t => {
                  const s = getShell(t.value);
                  return (
                    <button
                      key={t.value}
                      onClick={() => { onThemeChange(t.value); setThemeOpen(false); }}
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
        </div>
      </div>

      {/* ── PDF Content ───────────────────────────────────────── */}
      <div
        ref={containerRef}
        style={{ backgroundColor: shell.bg, paddingTop: '54px', paddingBottom: '60px' }}
        className="flex-1 overflow-auto flex justify-center"
      >
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          className="flex flex-col items-center"
          loading={
            <div className="flex items-center justify-center h-64">
              <div
                className="w-7 h-7 rounded-full animate-spin"
                style={{ border: `2px solid ${shell.border}`, borderBottomColor: shell.accent }}
              />
            </div>
          }
        >
          {/* key={pageNumber} triggers the pdf-page-enter animation on page change */}
          <div
            key={pageNumber}
            className="pdf-page-enter"
            style={{ filter: shell.filter, transition: 'filter 300ms ease' }}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              className="shadow-2xl"
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </div>
        </Document>
      </div>

      {/* ── Bottom navigation bar ─────────────────────────────── */}
      {numPages && (
        <div
          style={{ borderColor: shell.border, backgroundColor: `${shell.surface}f0` }}
          className="absolute bottom-0 left-0 right-0 border-t backdrop-blur-md px-4 py-2.5 flex items-center justify-center gap-3"
        >
          <button
            ref={leftArrowRef}
            onClick={() => navigate(-1)}
            disabled={pageNumber <= 1}
            style={{ color: shell.text }}
            className="reader-ctrl-btn btn-press p-1.5 rounded-full disabled:opacity-30 disabled:cursor-not-allowed"
            title="Previous page (←)"
          >
            <ChevronLeft size={18} />
          </button>

          {/* Page indicator with jump-to input */}
          <div className="flex items-center gap-1.5">
            <span style={{ color: shell.muted }} className="text-[11px] select-none">Page</span>
            <input
              type="text"
              inputMode="numeric"
              value={pageInput !== '' ? pageInput : pageNumber}
              onFocus={() => setPageInput(String(pageNumber))}
              onChange={e => setPageInput(e.target.value)}
              onKeyDown={handlePageInputKeyDown}
              onBlur={handlePageInputBlur}
              style={{
                backgroundColor: shell.surface,
                borderColor:     shell.border,
                color:           shell.text,
                outline:         'none',
              }}
              className="w-10 text-center text-[11px] font-mono tabular-nums rounded-md border py-0.5 focus:border-current"
              title="Type a page number and press Enter"
            />
            <span style={{ color: shell.muted }} className="text-[11px] select-none">of {numPages}</span>
          </div>

          <button
            ref={rightArrowRef}
            onClick={() => navigate(1)}
            disabled={pageNumber >= numPages}
            style={{ color: shell.text }}
            className="reader-ctrl-btn btn-press p-1.5 rounded-full disabled:opacity-30 disabled:cursor-not-allowed"
            title="Next page (→)"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
