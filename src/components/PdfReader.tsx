import { useState, useEffect, useRef, useCallback } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import type { ReaderTheme, CustomColors } from '../lib/theme';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PdfReaderProps {
  file: File;
  bookId: string;
  onClose: () => void;
  theme: ReaderTheme;
  customColors: CustomColors;
  onThemeChange: (theme: ReaderTheme) => void;
  onCustomColorsChange: (colors: CustomColors) => void;
}

import { getShell } from '../lib/theme';
import { updateBookProgress, logReadingActivity } from '../lib/storage';
import { ReaderToolbar } from './reader/ReaderToolbar';
import { ReaderProgress } from './reader/ReaderProgress';

export function PdfReader({ 
  file, 
  bookId, 
  onClose, 
  theme, 
  customColors, 
  onThemeChange, 
  onCustomColorsChange 
}: PdfReaderProps) {
  const [numPages,    setNumPages]   = useState<number | null>(null);
  const [pageNumber,  setPageNumber] = useState<number>(() => {
    const saved = localStorage.getItem(`lexiq-pdf-page-${bookId}`);
    return saved ? parseInt(saved, 10) : 1;
  });
  const [scale,      setScale]      = useState(1.2);
  const [fileUrl,    setFileUrl]    = useState<string | null>(null);
  const [pageInput,  setPageInput]  = useState('');

  // Responsive check
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 640);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const containerRef  = useRef<HTMLDivElement>(null);
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

  const shell = getShell(theme);
  const progress = numPages ? (pageNumber / numPages) * 100 : 0;

  // Track progress
  useEffect(() => {
    if (numPages) {
      updateBookProgress(bookId, progress);
    }
  }, [bookId, progress, numPages]);

  // Track reading session time
  useEffect(() => {
    let lastLogTime = Date.now();
    
    const logTime = () => {
      if (document.hidden) return; // Don't log if tab is backgrounded
      const now = Date.now();
      const elapsedMinutes = (now - lastLogTime) / 60000;
      if (elapsedMinutes >= 1) {
        logReadingActivity(elapsedMinutes);
        lastLogTime = now;
      }
    };
    
    const interval = setInterval(logTime, 60000);
    
    const handleUnload = () => {
      const now = Date.now();
      const elapsedMinutes = (now - lastLogTime) / 60000;
      if (elapsedMinutes > 0.1 && !document.hidden) {
        logReadingActivity(elapsedMinutes);
      }
    };
    
    window.addEventListener('beforeunload', handleUnload);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
      handleUnload();
    };
  }, [bookId]);

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

  return (
    <div
      style={{ backgroundColor: shell.bg, color: shell.text }}
      className="flex flex-col h-screen w-full overflow-hidden relative"
    >
      {/* ── Top progress bar ─────────────────────────────────── */}
      <ReaderProgress theme={theme} progress={progress} />

      {/* ── Toolbar ──────────────────────────────────────────── */}
      <ReaderToolbar
        title={file.name.replace(/\.pdf$/i, '')}
        theme={theme}
        customColors={customColors}
        onThemeChange={onThemeChange}
        onCustomColorsChange={onCustomColorsChange}
        onClose={onClose}
      >
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
      </ReaderToolbar>

      {/* ── PDF Content ───────────────────────────────────────── */}
      <div
        ref={containerRef}
        style={{ backgroundColor: shell.bg, paddingTop: isMobile ? '64px' : '54px', paddingBottom: '60px' }}
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
