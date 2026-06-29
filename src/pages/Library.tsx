import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { getAllBookMetadata, deleteBook, saveBook, ensureCoverImage, updateBookName, updateBookStatus, getReadingActivity } from '../lib/storage';
import type { BookMetadata, BookStatus } from '../lib/storage';
import { UploadDropzone } from '../components/UploadDropzone';
import { Header } from '../components/common/Header';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { RenameDialog } from '../components/common/RenameDialog';
import { BookCard } from '../components/library/BookCard';
import { TrackingOverview } from '../components/library/TrackingOverview';
import { ReadingLists } from '../components/library/ReadingLists';

export function Library() {
  const [activeTab, setActiveTab] = useState<'overview' | 'lists' | 'all'>('overview');
  const [books, setBooks] = useState<BookMetadata[]>([]);
  const [activity, setActivity] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [bookToDelete, setBookToDelete] = useState<string | null>(null);
  const [bookToRename, setBookToRename] = useState<{ id: string; name: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning";
    if (hr < 18) return "Good afternoon";
    return "Good evening";
  };

  useEffect(() => {
    loadBooks();
  }, []);

  const loadBooks = async () => {
    setIsLoading(true);
    try {
      const [data, activityData] = await Promise.all([
        getAllBookMetadata(),
        getReadingActivity()
      ]);
      
      setBooks(data.sort((a, b) => b.addedAt - a.addedAt));
      setActivity(activityData);

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

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault(); // Prevent navigating to the reader
    e.stopPropagation();
    setBookToDelete(id);
  };

  const confirmDelete = async () => {
    if (bookToDelete) {
      await deleteBook(bookToDelete);
      loadBooks();
      setBookToDelete(null);
    }
  };

  const cancelDelete = () => {
    setBookToDelete(null);
  };

  const handleRenameClick = (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    setBookToRename({ id, name });
  };

  const handleRenameConfirm = async (newName: string) => {
    if (bookToRename) {
      await updateBookName(bookToRename.id, newName);
      loadBooks();
      setBookToRename(null);
    }
  };

  const handleRenameCancel = () => {
    setBookToRename(null);
  };

  const handleStatusChange = async (_e: React.MouseEvent, id: string, status: BookStatus) => {
    await updateBookStatus(id, status);
    loadBooks();
  };

  return (
    <div className="min-h-screen bg-ink-bg text-ink-text flex flex-col selection:bg-ink-accent/30 selection:text-white transition-colors duration-300 relative overflow-hidden">
      
      {/* Full-Screen Background Image for Library Hero */}
      <div 
        className="absolute top-0 left-0 w-full h-[60vh] z-0 transition-opacity duration-700 ease-in-out bg-no-repeat"
        style={{
          backgroundImage: `url('/dither-header.png')`,
          backgroundPosition: 'bottom center',
          backgroundSize: 'cover',
          opacity: 0.8
        }}
      />
      {/* Multi-stop gradient fade */}
      <div className="absolute top-0 left-0 w-full h-[60vh] z-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 w-full h-[30vh] bg-gradient-to-t from-ink-bg to-transparent" />
        <div className="absolute top-0 left-0 w-full h-[60vh] bg-ink-bg/30" />
      </div>

      <Header 
        isFixed={false}
        splitMode={false}
        maxWidthClass="max-w-4xl"
        centerContent={
          <div className="hidden md:flex items-center gap-6 px-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`text-sm font-medium tracking-wide transition-colors ${
                activeTab === 'overview' ? 'text-ink-accent' : 'text-ink-text hover:text-ink-text-muted'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('lists')}
              className={`text-sm font-medium tracking-wide transition-colors ${
                activeTab === 'lists' ? 'text-ink-accent' : 'text-ink-text hover:text-ink-text-muted'
              }`}
            >
              Lists
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`text-sm font-medium tracking-wide transition-colors ${
                activeTab === 'all' ? 'text-ink-accent' : 'text-ink-text hover:text-ink-text-muted'
              }`}
            >
              Ebooks
            </button>
          </div>
        }
        rightContent={
          <>
            <button
              onClick={handleButtonClick}
              className="btn-pill px-5 py-2 bg-ink-text text-ink-bg flex items-center gap-2 shadow-sm"
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

      <section className="relative z-10 flex flex-col items-center justify-center pt-8 pb-16 px-6 text-center">
        <h1 className="text-5xl md:text-6xl font-serif text-ink-text mb-4 tracking-tight drop-shadow-sm">{getGreeting()}</h1>
        <p className="text-ink-text-muted text-base font-medium">Welcome back to your library. Dive right in.</p>
      </section>

      <main className="page-enter relative z-10 flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 pb-20 mt-0">
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
          <div className="flex flex-col animate-fade-in">
            {/* Tab Content */}
            {activeTab === 'overview' && (
              <TrackingOverview books={books} activity={activity} />
            )}

            {activeTab === 'lists' && (
              <ReadingLists 
                books={books}
                onDelete={handleDelete}
                onRename={handleRenameClick}
                onStatusChange={handleStatusChange}
              />
            )}

            {activeTab === 'all' && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 md:gap-8 animate-fade-in pt-2">
                {books.map(book => (
                  <BookCard 
                    key={book.id} 
                    book={book} 
                    onDelete={handleDelete} 
                    onRename={handleRenameClick}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}

          </div>
        )}
      </main>

      <ConfirmDialog 
        isOpen={bookToDelete !== null}
        title="Delete Book"
        message="Are you sure you want to delete this book? This action cannot be undone and will remove all associated highlights and notes."
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      <RenameDialog
        isOpen={bookToRename !== null}
        initialValue={bookToRename?.name || ''}
        onConfirm={handleRenameConfirm}
        onCancel={handleRenameCancel}
      />
    </div>
  );
}
