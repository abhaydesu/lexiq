import { useState, useEffect } from 'react';
import localforage from 'localforage';
import { UploadDropzone } from './components/UploadDropzone';
import { PdfReader } from './components/PdfReader';
import { EpubReader } from './components/EpubReader';
import { BookOpen } from 'lucide-react';

type FileType = 'pdf' | 'epub' | null;

function App() {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<FileType>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize and load saved book
  useEffect(() => {
    const loadSavedBook = async () => {
      try {
        const savedFile = await localforage.getItem<File>('savedBook');
        if (savedFile) {
          setFile(savedFile);
          determineAndSetFileType(savedFile);
        }
      } catch (error) {
        console.error('Failed to load book from storage:', error);
      } finally {
        setIsInitializing(false);
      }
    };
    
    loadSavedBook();
  }, []);

  const determineAndSetFileType = (f: File) => {
    if (f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')) {
      setFileType('pdf');
    } else if (f.type === 'application/epub+zip' || f.name.toLowerCase().endsWith('.epub')) {
      setFileType('epub');
    } else {
      setFileType(null);
    }
  };

  const handleFileUpload = async (newFile: File) => {
    setFile(newFile);
    determineAndSetFileType(newFile);
    try {
      await localforage.setItem('savedBook', newFile);
    } catch (error) {
      console.error('Failed to save book to storage:', error);
    }
  };

  const handleClose = async () => {
    setFile(null);
    setFileType(null);
    try {
      await localforage.removeItem('savedBook');
    } catch (error) {
      console.error('Failed to remove book from storage:', error);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-900 text-slate-100 flex flex-col">
      {/* Show header only if no file is open */}
      {!file && (
        <header className="p-6 border-b border-white/5 flex items-center gap-3">
          <BookOpen className="text-primary-500" size={32} />
          <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
            Lexiq Reader
          </span>
        </header>
      )}

      <main className="flex-1 flex flex-col relative">
        {!file && <UploadDropzone onFileUpload={handleFileUpload} />}
        
        {file && fileType === 'pdf' && (
          <PdfReader file={file} onClose={handleClose} />
        )}
        
        {file && fileType === 'epub' && (
          <EpubReader file={file} onClose={handleClose} />
        )}

        {file && fileType === null && (
          <div className="flex flex-col items-center justify-center h-[80vh]">
            <p className="text-red-400 text-xl mb-4">Unsupported file format.</p>
            <button 
              onClick={handleClose}
              className="px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
