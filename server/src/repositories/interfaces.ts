// ==========================================
// Repository Interfaces (SOLID: ISP + DIP)
// Каждый интерфейс — отдельная ответственность
// ==========================================

import { ShareItem, TextSnippet, CreateFileInput, CreateTextInput } from '../models/index.js';

/**
 * Интерфейс для работы с файлами в БД
 */
export interface IFileRepository {
  create(input: CreateFileInput, shortUrl: string): Promise<ShareItem>;
  findByShortUrl(shortUrl: string): Promise<ShareItem | null>;
  findById(id: string): Promise<ShareItem | null>;
  incrementDownloads(id: string): Promise<void>;
  delete(id: string): Promise<void>;
  findExpired(): Promise<ShareItem[]>;
}

/**
 * Интерфейс для работы с текстовыми сниппетами в БД
 */
export interface ITextRepository {
  create(input: CreateTextInput, shortUrl: string): Promise<TextSnippet>;
  findByShortUrl(shortUrl: string): Promise<TextSnippet | null>;
  delete(id: string): Promise<void>;
  findExpired(): Promise<TextSnippet[]>;
}
