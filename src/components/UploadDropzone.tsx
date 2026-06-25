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
    <div className="flex flex-col items-center justify-center min-h-[60vh] w-full p-6">
      <div className="text-center mb-10 max-w-lg">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
          Your Personal Library
        </h1>
        <p className="text-slate-400 text-lg">
          Upload your favorite books in PDF or EPUB format and start reading instantly in a distraction-free environment.
        </p>
      </div>

      <div 
        className={`glass-panel w-full max-w-2xl p-12 flex flex-col items-center justify-center transition-all duration-300 ${
          isDragging ? 'border-primary-500 scale-105 bg-surface-700/80 shadow-primary-500/20 shadow-2xl' : 'hover:border-slate-500 hover:bg-surface-700/50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <UploadCloud className={`w-20 h-20 mb-6 transition-colors duration-300 ${isDragging ? 'text-primary-400' : 'text-slate-500'}`} />
        <h2 className="text-2xl font-semibold mb-2">Drag & Drop your book here</h2>
        <p className="text-slate-400 mb-8">Supports PDF and EPUB</p>
        
        <div className="flex gap-4 mb-8">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 text-sm text-slate-300">
            <FileText size={16} className="text-red-400" /> PDF
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700 text-sm text-slate-300">
            <BookOpen size={16} className="text-green-400" /> EPUB
          </div>
        </div>

        <label className="cursor-pointer relative overflow-hidden group">
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-600 to-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          <span className="relative px-8 py-4 bg-primary-600 rounded-xl font-medium shadow-lg hover:shadow-xl transition-all duration-300 inline-block text-white">
            Browse Files
          </span>
          <input 
            type="file" 
            className="hidden" 
            accept=".pdf,.epub,application/pdf,application/epub+zip"
            onChange={handleFileChange}
          />
        </label>
      </div>
    </div>
  );
}
