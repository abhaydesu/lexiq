import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBookById } from '../lib/storage';
import type { Book } from '../lib/storage';
import { PdfReader } from '../components/PdfReader';
import { EpubReader } from '../components/EpubReader';

export type ReaderTheme = 'ink' | 'paper' | 'sepia';

export function Reader() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [book, setBook] = useState<Book | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize theme from localStorage or default to 'ink'
  const [theme, setTheme] = useState<ReaderTheme>(() => {
    const savedTheme = localStorage.getItem('lexiq-theme');
    return (savedTheme as ReaderTheme) || 'ink';
  });

  const changeTheme = (newTheme: ReaderTheme) => {
    setTheme(newTheme);
    localStorage.setItem('lexiq-theme', newTheme);
  };

  useEffect(() => {
    if (!id) {
      navigate('/library');
      return;
    }

    const loadBook = async () => {
      try {
        const data = await getBookById(id);
        if (data) {
          setBook(data);
        } else {
          setError('Book not found or could not be loaded.');
        }
      } catch (err) {
        console.error(err);
        setError('An error occurred while loading the book.');
      } finally {
        setIsLoading(false);
      }
    };

    loadBook();
  }, [id, navigate]);

  const handleClose = () => {
    navigate('/library');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-ink-bg">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ink-accent"></div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-ink-bg text-ink-text">
        <p className="text-red-400 text-xl mb-4 font-serif">{error || 'Unknown error'}</p>
        <button 
          onClick={handleClose}
          className="px-6 py-3 bg-ink-surface hover:bg-ink-border/50 border border-ink-border text-xs uppercase tracking-wider font-semibold rounded-lg transition-colors"
        >
          Return to Library
        </button>
      </div>
    );
  }

  if (book.type === 'pdf') {
    return <PdfReader file={book.file} onClose={handleClose} theme={theme} onThemeChange={changeTheme} />;
  }

  if (book.type === 'epub') {
    return <EpubReader file={book.file} onClose={handleClose} theme={theme} onThemeChange={changeTheme} />;
  }

  return null;
}
