import { useState, useEffect, useRef } from 'react';
import { pdfjs, Document, Page } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PdfReaderProps {
  file: File;
  onClose: () => void;
}

export function PdfReader({ file, onClose }: PdfReaderProps) {
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

  return (
    <div className="flex flex-col h-screen w-full bg-surface-900 overflow-hidden relative">
      {/* Header Toolbar */}
      <div className="absolute top-0 left-0 right-0 z-10 glass-panel !rounded-none !border-x-0 !border-t-0 p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Close Book"
          >
            <X size={24} className="text-slate-300" />
          </button>
          <div className="font-medium text-slate-200 truncate max-w-[200px] md:max-w-md">
            {file.name}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={zoomOut} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ZoomOut size={20} className="text-slate-300" />
          </button>
          <span className="text-sm font-medium w-12 text-center">{Math.round(scale * 100)}%</span>
          <button onClick={zoomIn} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ZoomIn size={20} className="text-slate-300" />
          </button>
        </div>
      </div>

      {/* PDF Content Area */}
      <div className="flex-1 overflow-auto bg-surface-900 flex justify-center pt-24 pb-24" ref={containerRef}>
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          className="flex flex-col items-center"
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          }
        >
          <Page 
            pageNumber={pageNumber} 
            scale={scale} 
            className="shadow-2xl"
            renderTextLayer={true}
            renderAnnotationLayer={true}
          />
        </Document>
      </div>

      {/* Bottom Navigation */}
      {numPages && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 glass-panel px-6 py-3 flex items-center gap-6 rounded-full shadow-2xl">
          <button 
            onClick={goToPrevPage} 
            disabled={pageNumber <= 1}
            className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={24} />
          </button>
          
          <div className="text-sm font-medium text-slate-200">
            Page {pageNumber} of {numPages}
          </div>
          
          <button 
            onClick={goToNextPage} 
            disabled={pageNumber >= numPages}
            className="p-2 hover:bg-white/10 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}
    </div>
  );
}
