import { useCallback, useState } from 'react';
import { UploadCloud, FileText, BookOpen } from 'lucide-react';

interface UploadDropzoneProps {
  onFileUpload: (file: File) => void;
}

export function UploadDropzone({ onFileUpload }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      validateAndUpload(file);
    }
  }, [onFileUpload]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      validateAndUpload(file);
    }
  };

  const validateAndUpload = (file: File) => {
    const validTypes = ['application/pdf', 'application/epub+zip'];
    const validExtensions = ['.pdf', '.epub'];
    
    if (validTypes.includes(file.type) || validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))) {
      onFileUpload(file);
    } else {
      alert("Please upload a valid PDF or EPUB file.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full p-4">
      <label 
        className={`group relative w-full max-w-xl p-6 sm:p-12 flex flex-col items-center justify-center rounded-2xl border cursor-pointer overflow-hidden ${
          isDragging 
            ? 'border-ink-accent bg-ink-surface/95 scale-[1.02] shadow-2xl shadow-ink-accent/20' 
            : 'border-ink-border/50 bg-ink-surface/70 shadow-xl backdrop-blur-md'
        }`}
        style={{transition: 'border-color 200ms ease, background-color 200ms ease, box-shadow 200ms ease, transform 200ms var(--ease-out)'}}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          className="hidden" 
          accept=".pdf,.epub,application/pdf,application/epub+zip"
          onChange={handleFileChange}
        />
        
        {/* Animated Background Glow */}
        <div 
          className={`absolute inset-0 bg-gradient-to-b from-ink-accent/5 to-transparent pointer-events-none ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
          style={{transition: 'opacity 200ms ease'}}
        />

        <div 
          className={`w-12 h-12 rounded-full border flex items-center justify-center mb-6 z-10 ${
            isDragging 
              ? 'border-ink-accent bg-ink-accent text-ink-bg' 
              : 'border-ink-border/70 text-ink-text-muted'
          }`}
          style={{transition: 'border-color 200ms ease, background-color 200ms ease, color 200ms ease'}}
        >
          <UploadCloud className={`w-5 h-5 ${isDragging ? 'scale-110' : ''}`} style={{transition: 'transform 200ms var(--ease-out)'}} />
        </div>
        
        <h2 className="font-serif text-2xl font-medium mb-2 z-10 text-ink-text group-hover:text-ink-text transition-colors">
          {isDragging ? 'Drop it here' : 'Click or drag your book'}
        </h2>
        <p className="text-ink-text-muted text-sm mb-8 z-10 tracking-wide">
          EPUB & PDF formats supported
        </p>
        
        <div className="flex gap-4 z-10">
          <div 
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-ink-bg/50 border border-ink-border/50 text-xs font-semibold tracking-widest uppercase text-ink-text-muted backdrop-blur-sm"
            style={{transition: 'border-color 150ms ease'}}
          >
            <FileText size={12} className="text-ink-accent/70" /> PDF
          </div>
          <div 
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-ink-bg/50 border border-ink-border/50 text-xs font-semibold tracking-widest uppercase text-ink-text-muted backdrop-blur-sm"
            style={{transition: 'border-color 150ms ease'}}
          >
            <BookOpen size={12} className="text-ink-accent/70" /> EPUB
          </div>
        </div>
      </label>
    </div>
  );
}
