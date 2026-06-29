import { useState } from 'react';
import type { BookMetadata, BookStatus } from '../../lib/storage';
import { ListCard } from './ListCard';
import { BookCard } from './BookCard';
import { ChevronLeft } from 'lucide-react';

interface ReadingListsProps {
  books: BookMetadata[];
  onDelete: (e: React.MouseEvent, id: string) => void;
  onRename: (e: React.MouseEvent, id: string, name: string) => void;
  onStatusChange: (e: React.MouseEvent, id: string, status: BookStatus) => void;
}

export function ReadingLists({ books, onDelete, onRename, onStatusChange }: ReadingListsProps) {
  const [activeList, setActiveList] = useState<BookStatus | null>(null);

  if (activeList) {
    const listBooks = books.filter(b => b.status === activeList);
    const listTitles: Record<BookStatus, string> = {
      'want-to-read': 'Want to Read',
      'reading': 'Currently Reading',
      'finished': 'Finished',
      'abandoned': 'Did Not Finish'
    };

    return (
      <div className="animate-fade-in mt-6">
        <button 
          onClick={() => setActiveList(null)}
          className="flex items-center gap-2 text-sm font-medium text-ink-text-muted hover:text-ink-text mb-8 transition-colors"
        >
          <ChevronLeft size={16} />
          Back to lists
        </button>
        
        <h2 className="editorial-title text-3xl font-medium drop-shadow-md mb-8">{listTitles[activeList]}</h2>
        
        {listBooks.length === 0 ? (
          <div className="text-ink-text-muted text-center py-16 bg-ink-surface/30 rounded-3xl border border-ink-border/30">
            No books in this list.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 md:gap-8">
            {listBooks.map(book => (
              <BookCard 
                key={book.id} 
                book={book} 
                onDelete={onDelete} 
                onRename={onRename}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const reading = books.filter(b => b.status === 'reading');
  const wantToRead = books.filter(b => b.status === 'want-to-read');
  const finished = books.filter(b => b.status === 'finished');
  const abandoned = books.filter(b => b.status === 'abandoned');

  return (
    <div className="flex flex-col gap-12 animate-fade-in mt-6">
      <section>
        <h3 className="editorial-title text-2xl font-medium mb-6">Reading status lists</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <ListCard title="Want to Read" books={wantToRead} onClick={() => setActiveList('want-to-read')} />
          <ListCard title="Currently Reading" books={reading} onClick={() => setActiveList('reading')} />
          <ListCard title="Finished" books={finished} onClick={() => setActiveList('finished')} />
          <ListCard title="Did Not Finish" books={abandoned} onClick={() => setActiveList('abandoned')} />
        </div>
      </section>
      
      {/* Visual placeholder for future custom lists */}
      <section>
        <h3 className="editorial-title text-2xl font-medium mb-6 text-ink-text-muted/50">Custom lists</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <button 
            onClick={() => window.alert('Custom lists creation will be enabled in a future update!')}
            className="flex items-center gap-5 p-4 rounded-3xl bg-ink-surface/10 hover:bg-ink-surface/30 border border-ink-border/20 border-dashed hover:border-ink-border/50 transition-all w-full text-left text-ink-text-muted hover:text-ink-text"
          >
            <div className="w-24 h-24 shrink-0 bg-ink-surface/20 rounded-2xl flex items-center justify-center">
              <span className="text-3xl font-light">+</span>
            </div>
            <h4 className="editorial-title text-xl font-medium">New list</h4>
          </button>
        </div>
      </section>
    </div>
  );
}
