import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { getAllBookMetadata, deleteBook, saveBook, ensureCoverImage } from '../lib/storage';
import type { BookMetadata } from '../lib/storage';
import { UploadDropzone } from '../components/UploadDropzone';
import { Header } from '../components/common/Header';
import { BookCard } from '../components/library/BookCard';

export function Library() {
  const [books, setBooks] = useState<BookMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

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
      
      <Header 
        maxWidthClass="max-w-5xl"
        rightContent={
          <>
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
          </>
        }
      />

      <main className="page-enter relative z-10 flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 pb-20">
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
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 md:gap-8">
              {books.map(book => (
                <BookCard 
                  key={book.id} 
                  book={book} 
                  onDelete={handleDelete} 
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
