// ==========================================
// File Service — бизнес-логика для файлов
// (SOLID: SRP — только файловая логика)
// ==========================================

import { nanoid } from 'nanoid';
import { IFileRepository } from '../repositories/interfaces.js';
import { IStorageProvider } from '../storage/interfaces.js';
import { ShareItem, CreateFileInput } from '../models/index.js';
import { Readable } from 'stream';

export class FileService {
  constructor(
    private fileRepository: IFileRepository,
    private storageProvider: IStorageProvider,
  ) {}

  /**
   * Загрузить файл
   */
  async uploadFile(
    fileStream: Readable,
    filename: string,
    size: number,
    mimeType: string,
    expiresInDays: number,
    maxDownloads?: number,
    password?: string,
  ): Promise<ShareItem> {
    // Validate expiration (max 30 days)
    if (expiresInDays < 1 || expiresInDays > 30) {
      throw new Error('Срок хранения должен быть от 1 до 30 дней');
    }

    // Save file to storage
    const storagePath = await this.storageProvider.save(fileStream, filename, mimeType);

    // Generate short URL
    const shortUrl = nanoid(7);

    // Save metadata to DB
    const input: CreateFileInput = {
      name: filename,
      size,
      mimeType,
      storagePath,
      expiresInDays,
      maxDownloads,
      password,
    };

    return this.fileRepository.create(input, shortUrl);
  }

  /**
   * Получить информацию о файле по короткой ссылке
   */
  async getFileByShortUrl(shortUrl: string): Promise<ShareItem | null> {
    const item = await this.fileRepository.findByShortUrl(shortUrl);
    if (!item) return null;

    // Check expiration
    if (new Date() > item.expiresAt) {
      await this.cleanup(item);
      return null;
    }

    // Check max downloads
    if (item.maxDownloads && item.downloadCount >= item.maxDownloads) {
      await this.cleanup(item);
      return null;
    }

    return item;
  }

  /**
   * Скачать файл
   */
  async downloadFile(shortUrl: string): Promise<{ item: ShareItem; stream: Readable } | null> {
    const item = await this.getFileByShortUrl(shortUrl);
    if (!item) return null;

    const stream = await this.storageProvider.getStream(item.storagePath);
    await this.fileRepository.incrementDownloads(item.id);

    return { item, stream };
  }

  /**
   * Удалить файл
   */
  async deleteFile(shortUrl: string): Promise<boolean> {
    const item = await this.fileRepository.findByShortUrl(shortUrl);
    if (!item) return false;

    await this.cleanup(item);
    return true;
  }

  /**
   * Очистка просроченных файлов (для cron job)
   */
  async cleanupExpired(): Promise<number> {
    const expired = await this.fileRepository.findExpired();
    for (const item of expired) {
      await this.cleanup(item);
    }
    return expired.length;
  }

  private async cleanup(item: ShareItem): Promise<void> {
    await this.storageProvider.delete(item.storagePath);
    await this.fileRepository.delete(item.id);
  }
}
