import localforage from 'localforage';
import { v4 as uuidv4 } from 'uuid';
import ePub from 'epubjs';
import * as pdfjsLib from 'pdfjs-dist';

export interface BookMetadata {
  id: string;
  name: string;
  type: 'pdf' | 'epub';
  size: number;
  addedAt: number;
  coverImage?: string; // Base64 data URL
}

export interface Book extends BookMetadata {
  file: File;
}

const METADATA_KEY = 'lexiq_library_metadata';

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
  };

  // Save the file blob individually to prevent large array serialization issues
  await localforage.setItem(`lexiq_file_${id}`, file);

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

  const file = await localforage.getItem<File>(`lexiq_file_${id}`);
  if (!file) {
    // Cleanup orphaned metadata if file is missing
    await deleteBook(id);
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
  
  const file = await localforage.getItem<File>(`lexiq_file_${id}`);
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
