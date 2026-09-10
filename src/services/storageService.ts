import { ShareItem, TextSnippet, UploadOptions } from '../types';
import { generateShortUrl, generateId } from '../utils/shortUrl';
import * as api from './api';

const STORAGE_KEY_FILES = 'fileshare_files';
const STORAGE_KEY_TEXTS = 'fileshare_texts';
const STORAGE_KEY_BLOBS = 'fileshare_blobs';

// Флаг для определения, использовать ли API
let useApi = true;
let apiCheckInProgress = false;

// Проверка доступности API с retry логикой
export async function checkApiAvailability(retryCount = 0): Promise<boolean> {
  if (apiCheckInProgress) {
    // Ждём завершения текущей проверки
    while (apiCheckInProgress) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return useApi;
  }
  
  apiCheckInProgress = true;
  
  try {
    const available = await api.healthCheck();
    useApi = available;
    console.log(`%c[FileShare] API ${available ? '✅ доступен' : '❌ недоступен'}, используем ${available ? 'backend' : 'localStorage'}`, 
      `color: ${available ? 'green' : 'red'}; font-weight: bold;`);
    
    // Если API недоступен, пробуем ещё раз несколько раз
    if (!available && retryCount < 3) {
      console.log(`%c[FileShare] Повторная проверка API через 2 секунды... (попытка ${retryCount + 1}/3)`, 
        'color: orange;');
      await new Promise(resolve => setTimeout(resolve, 2000));
      apiCheckInProgress = false;
      return checkApiAvailability(retryCount + 1);
    }
    
    return available;
  } catch (error) {
    console.error('%c[FileShare] Ошибка проверки API:', 'color: red; font-weight: bold;', error);
    useApi = false;
    
    // При ошибке тоже пробуем ещё раз
    if (retryCount < 3) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      apiCheckInProgress = false;
      return checkApiAvailability(retryCount + 1);
    }
    
    return false;
  } finally {
    apiCheckInProgress = false;
  }
}

// Инициализация при загрузке
checkApiAvailability();

// Экспортируем функцию для принудительной проверки
export async function ensureApiAvailable(): Promise<boolean> {
  if (useApi) {
    // Проверяем ещё раз, что API действительно доступен
    try {
      const available = await api.healthCheck();
      useApi = available;
      return available;
    } catch {
      useApi = false;
      return false;
    }
  }
  return false;
}

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

// Загрузка файла через API или localStorage
export async function saveFile(
  file: File, 
  options: UploadOptions,
  onProgress?: (progress: number) => void
): Promise<ShareItem> {
  if (useApi) {
    try {
      const response = await api.uploadFile(file, options.expiresInDays, onProgress);
      
      const item: ShareItem = {
        id: response.id,
        shortUrl: response.shortUrl,
        type: file.type.startsWith('image/') ? 'image' : 'file',
        name: response.name,
        size: response.size,
        mimeType: response.mimeType,
        createdAt: new Date().toISOString(),
        expiresAt: response.expiresAt,
        expiresInDays: options.expiresInDays,
        downloads: 0,
      };

      // Сохраняем метаданные локально для истории
      const files = getItems<ShareItem>(STORAGE_KEY_FILES);
      files.push(item);
      setItems(STORAGE_KEY_FILES, files);

      return item;
    } catch (error) {
      console.error('API ошибка, переключаемся на localStorage:', error);
      useApi = false;
    }
  }

  // Fallback на localStorage
  return saveFileLocal(file, options, onProgress);
}

// Локальное сохранение (fallback)
function saveFileLocal(
  file: File, 
  options: UploadOptions,
  onProgress?: (progress: number) => void
): Promise<ShareItem> {
  return new Promise((resolve) => {
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

    const files = getItems<ShareItem>(STORAGE_KEY_FILES);
    files.push(item);
    setItems(STORAGE_KEY_FILES, files);

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
        console.warn('Storage quota exceeded');
        if (onProgress) onProgress(100);
        resolve(item);
      }
    };
    
    reader.onerror = () => {
      resolve(item);
    };
    
    reader.readAsDataURL(file);
  });
}

// Создание текстового сниппета через API или localStorage
export async function saveTextSnippet(
  content: string, 
  title: string, 
  language: string, 
  options: UploadOptions
): Promise<TextSnippet> {
  if (useApi) {
    try {
      const response = await api.createTextSnippet(title, content, language, options.expiresInDays);
      
      const snippet: TextSnippet = {
        id: response.id,
        shortUrl: response.shortUrl,
        content,
        language,
        title: title || 'Untitled snippet',
        createdAt: new Date().toISOString(),
        expiresAt: response.expiresAt,
        expiresInDays: options.expiresInDays,
      };

      const texts = getItems<TextSnippet>(STORAGE_KEY_TEXTS);
      texts.push(snippet);
      setItems(STORAGE_KEY_TEXTS, texts);

      return snippet;
    } catch (error) {
      console.error('API ошибка, переключаемся на localStorage:', error);
      useApi = false;
    }
  }

  // Fallback на localStorage
  return saveTextSnippetLocal(content, title, language, options);
}

function saveTextSnippetLocal(
  content: string, 
  title: string, 
  language: string, 
  options: UploadOptions
): TextSnippet {
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

// Получение файла по короткой ссылке
export async function getFileByShortUrl(shortUrl: string): Promise<{ item: ShareItem; dataUrl: string } | null> {
  // Сначала пробуем через API
  if (useApi) {
    try {
      const info = await api.getFileInfo(shortUrl);
      
      const item: ShareItem = {
        id: info.id,
        shortUrl: info.shortUrl,
        type: info.type,
        name: info.name,
        size: info.size,
        mimeType: info.mimeType,
        createdAt: info.createdAt,
        expiresAt: info.expiresAt,
        expiresInDays: Math.ceil((new Date(info.expiresAt).getTime() - new Date(info.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
        downloads: info.downloadCount,
      };

      // Скачиваем файл как blob и конвертируем в data URL
      const blob = await api.downloadFile(shortUrl);
      const dataUrl = await blobToDataUrl(blob);

      return { item, dataUrl };
    } catch (error) {
      console.log('Файл не найден в API, проверяем localStorage');
    }
  }

  // Fallback на localStorage
  return getFileByShortUrlLocal(shortUrl);
}

function getFileByShortUrlLocal(shortUrl: string): { item: ShareItem; dataUrl: string } | null {
  const files = getItems<ShareItem>(STORAGE_KEY_FILES);
  const item = files.find(f => f.shortUrl === shortUrl);
  if (!item) return null;

  if (new Date(item.expiresAt) < new Date()) return null;

  const blobs = JSON.parse(localStorage.getItem(STORAGE_KEY_BLOBS) || '{}');
  const dataUrl = blobs[item.id];
  if (!dataUrl) return null;

  item.downloads += 1;
  setItems(STORAGE_KEY_FILES, files.map(f => f.id === item.id ? item : f));

  return { item, dataUrl };
}

// Получение текстового сниппета
export async function getTextByShortUrl(shortUrl: string): Promise<TextSnippet | null> {
  if (useApi) {
    try {
      const snippet = await api.getTextSnippet(shortUrl);
      return {
        id: snippet.id,
        shortUrl: snippet.shortUrl,
        content: snippet.content,
        language: snippet.language,
        title: snippet.title,
        createdAt: snippet.createdAt,
        expiresAt: snippet.expiresAt,
        expiresInDays: Math.ceil((new Date(snippet.expiresAt).getTime() - new Date(snippet.createdAt).getTime()) / (1000 * 60 * 60 * 24)),
      };
    } catch (error) {
      console.log('Сниппет не найден в API, проверяем localStorage');
    }
  }

  return getTextByShortUrlLocal(shortUrl);
}

function getTextByShortUrlLocal(shortUrl: string): TextSnippet | null {
  const texts = getItems<TextSnippet>(STORAGE_KEY_TEXTS);
  const snippet = texts.find(t => t.shortUrl === shortUrl);
  if (!snippet) return null;

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

// Утилита для конвертации Blob в Data URL
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
