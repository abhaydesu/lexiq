import localforage from 'localforage';
import { v4 as uuidv4 } from 'uuid';
import ePub from 'epubjs';
import * as pdfjsLib from 'pdfjs-dist';

export type BookStatus = 'want-to-read' | 'reading' | 'finished' | 'abandoned';

export interface BookMetadata {
  id: string;
  name: string;
  type: 'pdf' | 'epub';
  size: number;
  addedAt: number;
  coverImage?: string; // Base64 data URL
  status?: BookStatus; // Made optional for backward compatibility
  progress?: number; // 0 to 100
  lastRead?: number; // Timestamp of last read/interaction
}

export interface Book extends BookMetadata {
  file: File;
}

const METADATA_KEY = 'lexiq_library_metadata';
const ACTIVITY_KEY = 'lexiq_reading_activity';
const GOAL_KEY = 'lexiq_reading_goal';

async function extractEpubCover(file: File): Promise<string | undefined> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const book = ePub();
    await book.open(arrayBuffer, 'binary');
    const coverUrl = await book.coverUrl();
    if (coverUrl) {
      const response = await fetch(coverUrl);
      const blob = await response.blob();
      return await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    }
  } catch (err) {
    console.warn("Failed to extract EPUB cover:", err);
  }
  return undefined;
}

async function extractPdfCover(file: File): Promise<string | undefined> {
  try {
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
    }
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    
    const viewport = page.getViewport({ scale: 1.0 });
    const targetWidth = 300; // Generate a small thumbnail to save space
    const scale = Math.min(targetWidth / viewport.width, 1.0);
    const scaledViewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return undefined;
    
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;
    
    await page.render({
      canvasContext: ctx,
      viewport: scaledViewport,
      // @ts-ignore - some pdfjs-dist type definitions require the canvas property explicitly
      canvas: canvas
    }).promise;
    
    return canvas.toDataURL('image/jpeg', 0.8);
  } catch (err) {
    console.warn("Failed to extract PDF cover:", err);
  }
  return undefined;
}

function toStoredBlob(file: File): Blob {
  return file.slice(0, file.size, file.type || 'application/octet-stream');
}

function toBookFile(value: unknown, metadata: BookMetadata): File | null {
  if (value instanceof File) {
    return value;
  }

  if (value instanceof Blob) {
    const mimeType = value.type || (metadata.type === 'epub' ? 'application/epub+zip' : 'application/pdf');
    return new File([value], metadata.name, {
      type: mimeType,
      lastModified: metadata.addedAt,
    });
  }

  if (
    value &&
    typeof value === 'object' &&
    'size' in value &&
    'type' in value &&
    typeof (value as { size?: unknown }).size === 'number'
  ) {
    const maybeBlob = value as Blob;
    const mimeType = maybeBlob.type || (metadata.type === 'epub' ? 'application/epub+zip' : 'application/pdf');
    return new File([maybeBlob], metadata.name, {
      type: mimeType,
      lastModified: metadata.addedAt,
    });
  }

  if (value instanceof ArrayBuffer || (value && (value as any).buffer instanceof ArrayBuffer)) {
    const mimeType = metadata.type === 'epub' ? 'application/epub+zip' : 'application/pdf';
    return new File([value as BlobPart], metadata.name, {
      type: mimeType,
      lastModified: metadata.addedAt,
    });
  }

  console.warn('Failed to parse stored book file:', value);

  return null;
}

export async function saveBook(file: File): Promise<BookMetadata> {
  let type: 'pdf' | 'epub' = 'pdf';
  if (file.type === 'application/epub+zip' || file.name.toLowerCase().endsWith('.epub')) {
    type = 'epub';
  }

  const id = uuidv4();
  const coverImage = type === 'epub' ? await extractEpubCover(file) : await extractPdfCover(file);

  const metadata: BookMetadata = {
    id,
    name: file.name,
    type,
    size: file.size,
    addedAt: Date.now(),
    coverImage,
    status: 'want-to-read',
    progress: 0,
  };

  // Persist a Blob instead of a File for better browser compatibility.
  await localforage.setItem(`lexiq_file_${id}`, toStoredBlob(file));

  // Update metadata list
  const allMetadata = await getAllBookMetadata();
  allMetadata.push(metadata);
  allMetadata.sort((a, b) => b.addedAt - a.addedAt); // Sort newest first
  await localforage.setItem(METADATA_KEY, allMetadata);

  return metadata;
}

export async function getAllBookMetadata(): Promise<BookMetadata[]> {
  const metadataList = await localforage.getItem<BookMetadata[]>(METADATA_KEY);
  return metadataList || [];
}

export async function getBookById(id: string): Promise<Book | null> {
  const metadataList = await getAllBookMetadata();
  const metadata = metadataList.find(b => b.id === id);
  
  if (!metadata) return null;

  const storedFile = await localforage.getItem<unknown>(`lexiq_file_${id}`);
  
  if (storedFile === null) {
    console.error('Book file not found in storage for id:', id);
    return null;
  }
  
  const file = toBookFile(storedFile, metadata);
  if (!file) {
    console.error('Could not reconstruct file from storage for id:', id, 'storedFile:', storedFile);
    return null;
  }

  return { ...metadata, file };
}

export async function deleteBook(id: string): Promise<void> {
  // Remove file
  await localforage.removeItem(`lexiq_file_${id}`);
  
  // Remove metadata
  const metadataList = await getAllBookMetadata();
  const updatedMetadata = metadataList.filter(b => b.id !== id);
  await localforage.setItem(METADATA_KEY, updatedMetadata);
}

export async function ensureCoverImage(id: string): Promise<string | undefined> {
  const metadataList = await getAllBookMetadata();
  const metadataIndex = metadataList.findIndex(b => b.id === id);
  if (metadataIndex === -1) return undefined;
  
  if (metadataList[metadataIndex].coverImage) {
    return metadataList[metadataIndex].coverImage;
  }
  
  const storedFile = await localforage.getItem<unknown>(`lexiq_file_${id}`);
  const file = toBookFile(storedFile, metadataList[metadataIndex]);
  if (!file) return undefined;
  
  const coverImage = metadataList[metadataIndex].type === 'epub' 
    ? await extractEpubCover(file) 
    : await extractPdfCover(file);
    
  if (coverImage) {
    metadataList[metadataIndex].coverImage = coverImage;
    await localforage.setItem(METADATA_KEY, metadataList);
  }
  
  return coverImage;
}

export async function updateBookName(id: string, newName: string): Promise<void> {
  const metadataList = await getAllBookMetadata();
  const index = metadataList.findIndex(b => b.id === id);
  if (index !== -1) {
    metadataList[index].name = newName;
    await localforage.setItem(METADATA_KEY, metadataList);
  }
}

export async function updateBookProgress(id: string, progress: number, status?: BookStatus): Promise<void> {
  const metadataList = await getAllBookMetadata();
  const index = metadataList.findIndex(b => b.id === id);
  if (index !== -1) {
    metadataList[index].progress = Math.max(0, Math.min(100, Math.round(progress)));
    if (status) {
      metadataList[index].status = status;
    }
    // Automatically move to finished if progress is >= 100% and not already finished
    if (metadataList[index].progress >= 100 && metadataList[index].status !== 'finished') {
      metadataList[index].status = 'finished';
    } else if (metadataList[index].progress > 0 && metadataList[index].progress < 100 && (!metadataList[index].status || metadataList[index].status === 'want-to-read')) {
      metadataList[index].status = 'reading';
    }
    await localforage.setItem(METADATA_KEY, metadataList);
  }
}

export async function updateBookStatus(id: string, status: BookStatus): Promise<void> {
  const metadataList = await getAllBookMetadata();
  const index = metadataList.findIndex(b => b.id === id);
  if (index !== -1) {
    metadataList[index].status = status;
    metadataList[index].lastRead = Date.now();
    await localforage.setItem(METADATA_KEY, metadataList);
  }
}

export async function getReadingActivity(): Promise<Record<string, number>> {
  const activity = await localforage.getItem<Record<string, number>>(ACTIVITY_KEY);
  return activity || {};
}

export async function logReadingActivity(durationMinutes: number): Promise<void> {
  if (durationMinutes <= 0) return;
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const activity = await getReadingActivity();
  
  if (activity[dateStr]) {
    activity[dateStr] += durationMinutes;
  } else {
    activity[dateStr] = durationMinutes;
  }
  
  await localforage.setItem(ACTIVITY_KEY, activity);
}

export async function getReadingGoal(): Promise<number | null> {
  const goal = await localforage.getItem<number>(GOAL_KEY);
  return goal;
}

export async function setReadingGoal(goal: number): Promise<void> {
  await localforage.setItem(GOAL_KEY, goal);
}
