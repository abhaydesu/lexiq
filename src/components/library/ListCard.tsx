import type { BookMetadata } from '../../lib/storage';
import { BookOpen } from 'lucide-react';

interface ListCardProps {
  title: string;
  books: BookMetadata[];
  onClick: () => void;
}

export function ListCard({ title, books, onClick }: ListCardProps) {
  // Take up to 4 books for the thumbnail grid
  const thumbnails = books.slice(0, 4);

  return (
    <button 
      onClick={onClick}
      className="btn-press flex items-center gap-5 p-4 rounded-3xl bg-ink-surface/40 hover:bg-ink-surface/80 border border-ink-border/30 hover:border-ink-border/60 transition-all group w-full text-left"
    >
      {/* 2x2 Thumbnail Grid */}
      <div className="w-24 h-24 shrink-0 bg-ink-surface/50 rounded-2xl overflow-hidden shadow-inner p-1.5 grid grid-cols-2 grid-rows-2 gap-1.5 relative border border-ink-border/50">
        {thumbnails.length === 0 ? (
          <div className="col-span-2 row-span-2 flex items-center justify-center text-ink-text-muted/50">
            <BookOpen size={24} />
          </div>
        ) : (
          thumbnails.map((book, i) => (
            <div key={i} className="bg-ink-bg rounded-lg overflow-hidden relative border border-ink-border/30 shadow-sm w-full h-full">
              {book.coverImage ? (
                <img src={book.coverImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-ink-surface/50 flex flex-col p-1">
                   <span className="text-[5px] text-ink-text opacity-50 uppercase tracking-widest">{book.type}</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* List Info */}
      <div className="flex flex-col justify-center h-full">
        <h4 className="editorial-title text-xl font-medium text-ink-text group-hover:text-ink-accent transition-colors">{title}</h4>
        <span className="text-sm font-medium text-ink-text-muted mt-1">{books.length} {books.length === 1 ? 'Book' : 'Books'}</span>
      </div>
    </button>
  );
}
