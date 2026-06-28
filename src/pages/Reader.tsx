import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBookById } from '../lib/storage';
import type { Book } from '../lib/storage';
import { PdfReader } from '../components/PdfReader';
import { EpubReader } from '../components/EpubReader';

import type { ReaderTheme, CustomColors } from '../lib/theme';
import { getCustomColors, saveCustomColors } from '../lib/theme';

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

  const [customColors, setCustomColors] = useState<CustomColors>(() => getCustomColors());

  const changeTheme = (newTheme: ReaderTheme) => {
    setTheme(newTheme);
    localStorage.setItem('lexiq-theme', newTheme);
  };

  const handleCustomColorsChange = (colors: CustomColors) => {
    saveCustomColors(colors);
    setCustomColors(colors);
  };

  useEffect(() => {
    const isMobileDevice = /Mobi|Android|iPhone/i.test(navigator.userAgent) || window.innerWidth < 640;
    if (!isMobileDevice) return;

    const enterFS = async () => {
      try {
        const docEl = document.documentElement;
        if (docEl.requestFullscreen) {
          if (!document.fullscreenElement) {
            await docEl.requestFullscreen();
          }
        } else if ((docEl as any).webkitRequestFullscreen) {
          if (!(document as any).webkitFullscreenElement) {
            await (docEl as any).webkitRequestFullscreen();
          }
        }
      } catch (err) {
        console.warn("Fullscreen request failed (requires direct user gesture):", err);
      }
    };

    // Try immediately
    enterFS();
    
    // Fallback: try on first user interaction
    const handleFirstTouch = () => {
      enterFS();
      document.removeEventListener('touchstart', handleFirstTouch);
      document.removeEventListener('click', handleFirstTouch);
    };

    document.addEventListener('touchstart', handleFirstTouch);
    document.addEventListener('click', handleFirstTouch);

    return () => {
      document.removeEventListener('touchstart', handleFirstTouch);
      document.removeEventListener('click', handleFirstTouch);
      // Clean up and exit fullscreen
      if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
        try {
          if (document.exitFullscreen) {
            document.exitFullscreen();
          } else if ((document as any).webkitExitFullscreen) {
            (document as any).webkitExitFullscreen();
          }
        } catch (_) {}
      }
    };
  }, []);

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
    return (
      <PdfReader 
        file={book.file} 
        bookId={id!} 
        onClose={handleClose} 
        theme={theme} 
        customColors={customColors}
        onThemeChange={changeTheme} 
        onCustomColorsChange={handleCustomColorsChange}
      />
    );
  }

  if (book.type === 'epub') {
    return (
      <EpubReader 
        file={book.file} 
        bookId={id!} 
        onClose={handleClose} 
        theme={theme} 
        customColors={customColors}
        onThemeChange={changeTheme} 
        onCustomColorsChange={handleCustomColorsChange}
      />
    );
  }

  return null;
}
