import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Trash2, Plus, Sun, Moon } from 'lucide-react';
import { getAllBookMetadata, deleteBook, saveBook, ensureCoverImage } from '../lib/storage';
import type { BookMetadata } from '../lib/storage';
import { UploadDropzone } from '../components/UploadDropzone';
import { useTheme } from '../components/ThemeProvider';

export function Library() {
  const [books, setBooks] = useState<BookMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    setIsLoading(true);
    try {
      const data = await getAllBookMetadata();
      setBooks(data.sort((a, b) => b.addedAt - a.addedAt));

      // Retroactively fetch missing covers in the background
      const missingCovers = data.filter(b => !b.coverImage);
      if (missingCovers.length > 0) {
        let updated = false;
        for (const book of missingCovers) {
          const cover = await ensureCoverImage(book.id);
          if (cover) updated = true;
        }
        if (updated) {
          const newMetadata = await getAllBookMetadata();
          setBooks(newMetadata.sort((a, b) => b.addedAt - a.addedAt));
        }
      }
    } catch (error) {
      console.error('Failed to load books:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (file: File) => {
    try {
      const newBook = await saveBook(file);
      navigate(`/read/${newBook.id}`);
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to save the book.');
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // Prevent navigating to the reader
    e.stopPropagation();
    
    if (confirm('Are you sure you want to delete this book?')) {
      await deleteBook(id);
      loadBooks();
    }
  };

  return (
    <div className="min-h-screen bg-ink-bg text-ink-text flex flex-col selection:bg-ink-accent/30 selection:text-white transition-colors duration-300 relative">
      
      {/* Floating Pill Header */}
      <div className="w-full pt-6 px-4 md:px-6 relative z-20 flex justify-center mb-8">
        <header className="w-full max-w-5xl px-3 py-2 flex items-center justify-between bg-ink-surface/70 backdrop-blur-xl border border-ink-border/50 rounded-full shadow-lg shadow-black/10" style={{transition: 'background-color 300ms var(--ease-out), border-color 300ms var(--ease-out)'}}>
          <Link to="/" className="logo-link flex items-center pl-4">
            <span className="logo-text text-xl font-semibold tracking-wide drop-shadow-sm" style={{transition: 'color 200ms ease'}}>
              <span className="font-serif">lex<span className='italic'>iq</span></span>
            </span>
          </Link>
          
          <div className="flex items-center gap-2 pr-1">
            <button 
              onClick={toggleTheme}
              className="btn-press p-2 rounded-full text-ink-text"
              style={{backgroundColor: 'transparent'}}
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button
              onClick={handleButtonClick}
              className="btn-pill px-5 py-2.5 bg-ink-text text-ink-bg flex items-center gap-2"
            >
              <Plus size={14} />
              Add book
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.epub"
              className="hidden"
            />
          </div>
        </header>
      </div>

      <main className="page-enter relative z-10 flex-1 max-w-6xl mx-auto w-full px-6 pb-20">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ink-text/50"></div>
          </div>
        ) : books.length === 0 ? (
          <div className="max-w-xl mx-auto mt-20 text-center">
            <h2 className="editorial-title text-2xl font-medium mb-3 text-ink-text">Your shelf is empty.</h2>
            <p className="text-sm text-ink-text-muted mb-8">Drop in an EPUB or PDF to begin.</p>
            <UploadDropzone onFileUpload={handleUpload} />
          </div>
        ) : (
          <>
            <div className="mb-10 flex items-center justify-between">
              <h2 className="editorial-title text-3xl font-medium drop-shadow-md">Your Library</h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8">
              {books.map(book => (
                <Link 
                  key={book.id} 
                  to={`/read/${book.id}`}
                  className="stagger-item group relative flex flex-col gap-3 cursor-pointer"
                >
                  {/* Delete Button — fast exit, no :hover on touch */}
                  <button 
                    onClick={(e) => handleDelete(e, book.id)}
                    className="book-delete btn-press absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white/70 opacity-0 z-20 backdrop-blur-sm"
                    style={{transition: 'opacity 150ms ease, color 150ms ease, background-color 150ms ease, transform 160ms var(--ease-out)'}}
                    title="Delete Book"
                  >
                    <Trash2 size={14} />
                  </button>

                  {/* Book Cover / Spine */}
                  <div 
                    className="book-cover aspect-[3/4] w-full rounded-xl bg-ink-surface/70 border border-ink-border/50 flex flex-col justify-between relative overflow-hidden shadow-lg"
                    style={{transition: 'border-color 200ms ease, box-shadow 200ms ease'}}
                  >
                    {book.coverImage ? (
                       <img 
                         src={book.coverImage} 
                         alt={book.name} 
                         className="book-cover-img absolute inset-0 w-full h-full object-cover"
                       />
                    ) : (
                      <>
                        {/* Fallback Visual Spine effect */}
                        <div className="absolute left-0 top-0 bottom-0 w-3 bg-gradient-to-r from-black/50 to-transparent border-r border-black/20 z-10" />
                        <div className="pl-6 pt-5 pr-4 flex flex-col gap-2 relative z-10">
                          <span className="text-[9px] uppercase tracking-widest text-ink-text-muted font-bold">
                            {book.type}
                          </span>
                          <h3 className="font-serif font-medium text-sm md:text-base line-clamp-4 leading-snug text-ink-text" style={{transition: 'color 200ms ease'}}>
                            {book.name}
                          </h3>
                        </div>
                      </>
                    )}
                    
                    {/* Bottom metadata overlay */}
                    <div 
                      className="book-meta absolute bottom-0 left-0 w-full p-3 flex items-center justify-between text-[10px] text-white/90 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-8 z-10"
                      style={{opacity: 0.8, transition: 'opacity 150ms ease'}}
                    >
                      <span className="font-medium drop-shadow-md">{(book.size / 1024 / 1024).toFixed(1)} MB</span>
                      {book.type === 'pdf' ? (
                        <FileText size={12} className="text-white drop-shadow-md" />
                      ) : (
                        <BookOpen size={12} className="text-white drop-shadow-md" />
                      )}
                    </div>
                  </div>
                  
                  {/* Below Cover Label */}
                  <div className="text-xs text-ink-text-muted px-1 flex flex-col items-start gap-1">
                    <span className="font-medium text-ink-text line-clamp-1 w-full">{book.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
