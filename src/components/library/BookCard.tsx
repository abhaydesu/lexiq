import { Link } from 'react-router-dom';
import { BookOpen, FileText, Trash2 } from 'lucide-react';
import type { BookMetadata } from '../../lib/storage';

interface BookCardProps {
  book: BookMetadata;
  onDelete: (e: React.MouseEvent, id: string) => void;
}

export function BookCard({ book, onDelete }: BookCardProps) {
  return (
    <Link 
      to={`/read/${book.id}`}
      className="stagger-item group relative flex flex-col gap-3 cursor-pointer"
    >
      {/* Delete Button — fast exit, no :hover on touch */}
      <button 
        onClick={(e) => onDelete(e, book.id)}
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
  );
}
