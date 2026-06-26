import { useState, useEffect, useRef } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X, ChevronDown } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import type { ReaderTheme } from '../pages/Reader';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PdfReaderProps {
  file: File;
  onClose: () => void;
  theme: ReaderTheme;
  onThemeChange: (theme: ReaderTheme) => void;
}

export function PdfReader({ file, onClose, theme, onThemeChange }: PdfReaderProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.2);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setFileUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  const goToPrevPage = () => setPageNumber(prev => Math.max(prev - 1, 1));
  const goToNextPage = () => setPageNumber(prev => Math.min(prev + 1, numPages || 1));
  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.6));

  if (!fileUrl) return null;

  // Derive styles based on theme
  const getThemeStyles = () => {
    switch (theme) {
      case 'paper':
        return { bg: 'bg-[#fcfaf2]', text: 'text-slate-800', surface: 'bg-white', border: 'border-slate-200', filter: '' };
      case 'sepia':
        return { bg: 'bg-[#f5e6ce]', text: 'text-[#433422]', surface: 'bg-[#fcf2df]', border: 'border-[#e0d0b8]', filter: 'sepia(100%) brightness(90%) hue-rotate(350deg)' };
      case 'ink':
      default:
        return { bg: 'bg-ink-bg', text: 'text-ink-text', surface: 'bg-ink-surface', border: 'border-ink-border', filter: 'invert(100%) hue-rotate(180deg) contrast(90%)' };
    }
  };

  const themeStyles = getThemeStyles();

  return (
    <div className={`flex flex-col h-screen w-full ${themeStyles.bg} overflow-hidden relative selection:bg-ink-accent/30 transition-colors duration-300`}>
      {/* Header Toolbar */}
      <div className={`absolute top-0 left-0 right-0 z-10 ${themeStyles.surface}/90 backdrop-blur-md border-b ${themeStyles.border} p-4 flex items-center justify-between transition-colors duration-300`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className={`p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors ${themeStyles.text}`}
            title="Close Book"
          >
            <X size={20} />
          </button>
          <div className={`font-serif font-medium ${themeStyles.text} truncate max-w-[150px] md:max-w-md`}>
            {file.name}
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <div className="relative mr-1">
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
          <div className="w-px h-4 bg-black/10 dark:bg-white/10 mx-1"></div>
          <button onClick={zoomOut} className={`p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors ${themeStyles.text}`}>
            <ZoomOut size={16} />
          </button>
          <span className={`text-xs font-mono font-medium w-12 text-center ${themeStyles.text}`}>{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} className={`p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors ${themeStyles.text}`}>
            <ZoomIn size={16} />
          </button>
        </div>
      </div>

      {/* PDF Content Area */}
      <div className={`flex-1 overflow-auto flex justify-center pt-24 pb-24 ${themeStyles.bg}`} ref={containerRef}>
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          className="flex flex-col items-center"
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ink-accent"></div>
            </div>
          }
        >
          <div style={{ filter: themeStyles.filter }} className="transition-all duration-300">
            <Page 
              pageNumber={pageNumber} 
              scale={scale} 
              className="shadow-2xl border border-ink-border/30 rounded"
              renderTextLayer={true}
              renderAnnotationLayer={true}
            />
          </div>
        </Document>
      </div>

      {/* Bottom Navigation */}
      {numPages && (
        <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-10 ${themeStyles.surface} border ${themeStyles.border} px-6 py-3 flex items-center gap-6 rounded-full shadow-2xl transition-colors duration-300`}>
          <button 
            onClick={goToPrevPage} 
            disabled={pageNumber <= 1}
            className={`p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${themeStyles.text}`}
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className={`text-xs font-semibold tracking-wider ${themeStyles.text} uppercase opacity-80`}>
            Page {pageNumber} of {numPages}
          </div>
          
          <button 
            onClick={goToNextPage} 
            disabled={pageNumber >= numPages}
            className={`p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${themeStyles.text}`}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
