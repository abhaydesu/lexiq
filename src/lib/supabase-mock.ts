import { v4 as uuidv4 } from 'uuid';

// ==========================================
// DATABASE SCHEMA DEFINITIONS
// ==========================================

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface CloudBook {
  id: string;
  user_id: string;
  title: string;
  author?: string;
  cover_url?: string;
  storage_path: string; // Path in the Supabase Storage bucket
  file_type: 'epub' | 'pdf';
  file_size: number;
  created_at: string;
}

export interface Highlight {
  id: string;
  user_id: string;
  book_id: string;
  cfi_range: string; // The pointer to the exact text location in EPUB
  text: string;      // The highlighted text
  note?: string;     // Optional user note
  color: string;     // Hex color of the highlight
  created_at: string;
}

export interface ReadingProgress {
  id: string;
  user_id: string;
  book_id: string;
  current_cfi: string;
  percentage: number;
  updated_at: string;
}


// ==========================================
// MOCK SUPABASE CLIENT (API SIMULATION)
// ==========================================

class MockSupabaseClient {
  private mockUser: User | null = null;
  private mockBooks: CloudBook[] = [];
  private mockHighlights: Highlight[] = [];

  // Simulate authentication
  async signUp(email: string): Promise<User> {
    console.log(`[Mock API] Signing up user: ${email}`);
    this.mockUser = { id: uuidv4(), email, created_at: new Date().toISOString() };
    return this.mockUser;
  }

  async signIn(email: string): Promise<User> {
    console.log(`[Mock API] Signing in user: ${email}`);
    this.mockUser = { id: uuidv4(), email, created_at: new Date().toISOString() };
    return this.mockUser;
  }

  async signOut(): Promise<void> {
    console.log(`[Mock API] Signing out`);
    this.mockUser = null;
  }

  getCurrentUser(): User | null {
    return this.mockUser;
  }

  // Simulate syncing a book to the cloud
  async syncBook(title: string, type: 'epub' | 'pdf', size: number): Promise<CloudBook> {
    if (!this.mockUser) throw new Error("Must be logged in to sync books");
    
    console.log(`[Mock API] Uploading ${title} to Cloud Storage...`);
    
    const newBook: CloudBook = {
      id: uuidv4(),
      user_id: this.mockUser.id,
      title,
      storage_path: `books/${this.mockUser.id}/${uuidv4()}.${type}`,
      file_type: type,
      file_size: size,
      created_at: new Date().toISOString()
    };
    
    this.mockBooks.push(newBook);
    return newBook;
  }

  // Simulate fetching highlights for a book
  async getHighlights(bookId: string): Promise<Highlight[]> {
    console.log(`[Mock API] Fetching highlights for book ${bookId}`);
    return this.mockHighlights.filter(h => h.book_id === bookId);
  }

  // Simulate creating a highlight
  async createHighlight(
    bookId: string,
    cfiRange: string,
    text: string,
    color: string = '#ffd54f',
    note?: string
  ): Promise<Highlight> {
    if (!this.mockUser) throw new Error("Must be logged in to highlight");

    console.log(`[Mock API] Saving highlight to database...`);
    const newHighlight: Highlight = {
      id: uuidv4(),
      user_id: this.mockUser.id,
      book_id: bookId,
      cfi_range: cfiRange,
      text,
      color,
      note,
      created_at: new Date().toISOString()
    };

    this.mockHighlights.push(newHighlight);
    return newHighlight;
  }
}

export const supabaseMock = new MockSupabaseClient();
