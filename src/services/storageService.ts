import { ShareItem, TextSnippet, UploadOptions } from '../types';
import { generateShortUrl, generateId } from '../utils/shortUrl';

const STORAGE_KEY_FILES = 'fileshare_files';
const STORAGE_KEY_TEXTS = 'fileshare_texts';
const STORAGE_KEY_BLOBS = 'fileshare_blobs';

function getItems<T>(key: string): T[] {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function setItems<T>(key: string, items: T[]): void {
  localStorage.setItem(key, JSON.stringify(items));
}

export function saveFile(
  file: File, 
  options: UploadOptions,
  onProgress?: (progress: number) => void
): Promise<ShareItem> {
  return new Promise((resolve, reject) => {
    const id = generateId();
    const shortUrl = generateShortUrl();
    const now = new Date();
    const expires = new Date(now.getTime() + options.expiresInDays * 24 * 60 * 60 * 1000);

    const item: ShareItem = {
      id,
      shortUrl,
      type: file.type.startsWith('image/') ? 'image' : 'file',
      name: file.name,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      expiresInDays: options.expiresInDays,
      downloads: 0,
    };

    // Save file metadata
    const files = getItems<ShareItem>(STORAGE_KEY_FILES);
    files.push(item);
    setItems(STORAGE_KEY_FILES, files);

    // Save file blob as data URL (for demo purposes)
    const reader = new FileReader();
    
    reader.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = (event.loaded / event.total) * 100;
        onProgress(progress);
      }
    };
    
    reader.onload = () => {
      const blobs = JSON.parse(localStorage.getItem(STORAGE_KEY_BLOBS) || '{}');
      blobs[id] = reader.result;
      try {
        localStorage.setItem(STORAGE_KEY_BLOBS, JSON.stringify(blobs));
        if (onProgress) onProgress(100);
        resolve(item);
      } catch (e) {
        console.warn('Storage quota exceeded, file may not persist');
        if (onProgress) onProgress(100);
        resolve(item);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Ошибка чтения файла'));
    };
    
    reader.readAsDataURL(file);
  });
}

export function saveTextSnippet(content: string, title: string, language: string, options: UploadOptions): TextSnippet {
  const id = generateId();
  const shortUrl = generateShortUrl();
  const now = new Date();
  const expires = new Date(now.getTime() + options.expiresInDays * 24 * 60 * 60 * 1000);

  const snippet: TextSnippet = {
    id,
    shortUrl,
    content,
    language,
    title: title || 'Untitled snippet',
    createdAt: now.toISOString(),
    expiresAt: expires.toISOString(),
    expiresInDays: options.expiresInDays,
  };

  const texts = getItems<TextSnippet>(STORAGE_KEY_TEXTS);
  texts.push(snippet);
  setItems(STORAGE_KEY_TEXTS, texts);

  return snippet;
}

export function getFileByShortUrl(shortUrl: string): { item: ShareItem; dataUrl: string } | null {
  const files = getItems<ShareItem>(STORAGE_KEY_FILES);
  const item = files.find(f => f.shortUrl === shortUrl);
  if (!item) return null;

  // Check expiration
  if (new Date(item.expiresAt) < new Date()) return null;

  // Get blob data
  const blobs = JSON.parse(localStorage.getItem(STORAGE_KEY_BLOBS) || '{}');
  const dataUrl = blobs[item.id];
  if (!dataUrl) return null;

  // Increment downloads
  item.downloads += 1;
  setItems(STORAGE_KEY_FILES, files.map(f => f.id === item.id ? item : f));

  return { item, dataUrl };
}

export function getTextByShortUrl(shortUrl: string): TextSnippet | null {
  const texts = getItems<TextSnippet>(STORAGE_KEY_TEXTS);
  const snippet = texts.find(t => t.shortUrl === shortUrl);
  if (!snippet) return null;

  // Check expiration
  if (new Date(snippet.expiresAt) < new Date()) return null;

  return snippet;
}

export function getAllFiles(): ShareItem[] {
  const files = getItems<ShareItem>(STORAGE_KEY_FILES);
  return files.filter(f => new Date(f.expiresAt) > new Date())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getAllTexts(): TextSnippet[] {
  const texts = getItems<TextSnippet>(STORAGE_KEY_TEXTS);
  return texts.filter(t => new Date(t.expiresAt) > new Date())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function deleteItem(id: string, type: 'file' | 'text'): void {
  if (type === 'file') {
    const files = getItems<ShareItem>(STORAGE_KEY_FILES).filter(f => f.id !== id);
    setItems(STORAGE_KEY_FILES, files);
    const blobs = JSON.parse(localStorage.getItem(STORAGE_KEY_BLOBS) || '{}');
    delete blobs[id];
    localStorage.setItem(STORAGE_KEY_BLOBS, JSON.stringify(blobs));
  } else {
    const texts = getItems<TextSnippet>(STORAGE_KEY_TEXTS).filter(t => t.id !== id);
    setItems(STORAGE_KEY_TEXTS, texts);
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatExpiration(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days <= 0) return 'Истёк';
  if (days === 1) return '1 день';
  if (days < 5) return `${days} дня`;
  return `${days} дней`;
}
