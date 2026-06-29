import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, FileText, Trash2, Pencil, CheckCircle2, ChevronDown } from 'lucide-react';
import type { BookMetadata, BookStatus } from '../../lib/storage';

interface BookCardProps {
  book: BookMetadata;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onRename: (e: React.MouseEvent, id: string, name: string) => void;
  onStatusChange: (e: React.MouseEvent, id: string, status: BookStatus) => void;
}

export function BookCard({ book, onDelete, onRename, onStatusChange }: BookCardProps) {
  const cleanName = book.name.replace(/_/g, ' ');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMenuClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(!menuOpen);
  };

  const handleStatusUpdate = (e: React.MouseEvent, status: BookStatus) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(false);
    onStatusChange(e, book.id, status);
  };

  return (
    <Link 
      to={`/read/${book.id}`}
      className="stagger-item group relative flex flex-col gap-3 cursor-pointer"
    >
      {/* Delete Button — fast exit, no :hover on touch */}
      <button 
        onClick={(e) => onDelete(e, book.id)}
        className="book-delete btn-press absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white/70 opacity-0 z-20 backdrop-blur-sm hover:text-white"
        style={{transition: 'opacity 150ms ease, color 150ms ease, background-color 150ms ease, transform 160ms var(--ease-out)'}}
        title="Delete Book"
      >
        <Trash2 size={14} />
      </button>

      {/* Rename Button */}
      <button 
        onClick={(e) => onRename(e, book.id, book.name)}
        className="book-delete btn-press absolute top-2 right-9 p-1.5 rounded-full bg-black/60 text-white/70 opacity-0 z-20 backdrop-blur-sm hover:text-white"
        style={{transition: 'opacity 150ms ease, color 150ms ease, background-color 150ms ease, transform 160ms var(--ease-out)'}}
        title="Rename Book"
      >
        <Pencil size={14} />
      </button>

      {/* Book Cover / Spine */}
      <div 
        className="book-cover aspect-[3/4] w-full rounded-xl bg-ink-surface/80 backdrop-blur-xl border border-ink-border/50 flex flex-col justify-between relative overflow-hidden shadow-lg"
        style={{transition: 'border-color 200ms ease, box-shadow 200ms ease'}}
      >
        {/* Floating Status Badge */}
        <div className="absolute top-2 left-2 z-30" ref={menuRef}>
          <button 
            onClick={handleMenuClick}
            className={`btn-press flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold backdrop-blur-md shadow-sm transition-colors ${
              book.status === 'finished' ? 'bg-ink-accent/90 text-white' : 'bg-black/60 text-white/90 hover:bg-black/80'
            }`}
            title="Change Status"
          >
            {book.status === 'reading' && book.progress !== undefined ? (
              <>{Math.round(book.progress)}% <ChevronDown size={10} className="opacity-70" /></>
            ) : book.status === 'reading' ? (
              <>Reading <ChevronDown size={10} className="opacity-70" /></>
            ) : book.status === 'finished' ? (
              <>Finished <ChevronDown size={10} className="opacity-70" /></>
            ) : book.status === 'abandoned' ? (
              <>DNF <ChevronDown size={10} className="opacity-70" /></>
            ) : (
              <>Want to Read <ChevronDown size={10} className="opacity-70" /></>
            )}
          </button>

          {menuOpen && (
            <div className="absolute top-full left-0 mt-1 w-36 bg-ink-surface border border-ink-border shadow-xl rounded-lg py-1 text-xs font-medium text-ink-text z-40 overflow-hidden">
              <button onClick={(e) => handleStatusUpdate(e, 'want-to-read')} className="w-full text-left px-3 py-1.5 hover:bg-ink-bg flex items-center justify-between">
                Want to read {book.status === 'want-to-read' && <CheckCircle2 size={12} className="text-ink-accent" />}
              </button>
              <button onClick={(e) => handleStatusUpdate(e, 'reading')} className="w-full text-left px-3 py-1.5 hover:bg-ink-bg flex items-center justify-between">
                Reading {book.status === 'reading' && <CheckCircle2 size={12} className="text-ink-accent" />}
              </button>
              <button onClick={(e) => handleStatusUpdate(e, 'finished')} className="w-full text-left px-3 py-1.5 hover:bg-ink-bg flex items-center justify-between">
                Finished {book.status === 'finished' && <CheckCircle2 size={12} className="text-ink-accent" />}
              </button>
              <button onClick={(e) => handleStatusUpdate(e, 'abandoned')} className="w-full text-left px-3 py-1.5 hover:bg-ink-bg flex items-center justify-between">
                Did Not Finish {book.status === 'abandoned' && <CheckCircle2 size={12} className="text-ink-accent" />}
              </button>
            </div>
          )}
        </div>
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
                {cleanName}
              </h3>
            </div>
          </>
        )}
        
        {/* Bottom metadata overlay */}
        <div 
          className="book-meta absolute bottom-0 left-0 w-full p-3 flex flex-col justify-end text-[10px] text-white/90 bg-gradient-to-t from-black/90 via-black/40 to-transparent pt-12 z-10"
          style={{opacity: 0.8, transition: 'opacity 150ms ease'}}
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-medium drop-shadow-md">{(book.size / 1024 / 1024).toFixed(1)} MB</span>
            {book.type === 'pdf' ? (
              <FileText size={12} className="text-white drop-shadow-md" />
            ) : (
              <BookOpen size={12} className="text-white drop-shadow-md" />
            )}
          </div>
          {/* Progress bar overlay */}
          {book.progress !== undefined && book.progress > 0 && book.status !== 'finished' && (
            <div className="w-full h-1.5 bg-white/30 rounded-full overflow-hidden mt-1 shadow-inner">
              <div 
                className="h-full bg-ink-accent rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${book.progress}%` }} 
              />
            </div>
          )}
        </div>
      </div>
      
      {/* Below Cover Label */}
      <div className="text-xs text-ink-text-muted px-1 mt-2 flex flex-col items-start gap-1 w-full">
        <span className="font-medium text-ink-text line-clamp-2 w-full leading-tight">{cleanName}</span>
      </div>
    </Link>
  );
}
