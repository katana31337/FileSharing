// ==========================================
// Local Filesystem Storage Provider
// Реализация IStorageProvider для локального FS
// ==========================================

import { IStorageProvider } from './interfaces.js';
import { Readable } from 'stream';
import { createReadStream, createWriteStream } from 'fs';
import { unlink, access, mkdir } from 'fs/promises';
import { pipeline } from 'stream/promises';
import { join } from 'path';

export class LocalStorageProvider implements IStorageProvider {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
    // Ensure base directory exists
    mkdir(basePath, { recursive: true }).catch(() => {});
  }

  async save(file: Buffer | Readable, filename: string, _mimeType: string): Promise<string> {
    console.log('[LocalStorageProvider] Начало сохранения файла:', { filename, basePath: this.basePath });
    
    const storagePath = `files/${Date.now()}-${filename}`;
    const fullPath = join(this.basePath, storagePath);
    console.log('[LocalStorageProvider] Путь для сохранения:', fullPath);
    
    // Ensure directory exists
    const dir = join(this.basePath, 'files');
    console.log('[LocalStorageProvider] Создание директории:', dir);
    await mkdir(dir, { recursive: true });
    console.log('[LocalStorageProvider] ✅ Директория создана');

    try {
      if (Buffer.isBuffer(file)) {
        console.log('[LocalStorageProvider] Файл является Buffer, конвертируем в stream...');
        const writeStream = createWriteStream(fullPath);
        await pipeline(Readable.from(file), writeStream);
      } else {
        console.log('[LocalStorageProvider] Файл является Readable stream...');
        const writeStream = createWriteStream(fullPath);
        await pipeline(file, writeStream);
      }
      console.log('[LocalStorageProvider] ✅ Файл успешно записан на диск');
    } catch (error) {
      console.error('[LocalStorageProvider] ❌ Ошибка записи файла:', error);
      throw error;
    }

    console.log('[LocalStorageProvider] Возвращаем storagePath:', storagePath);
    return storagePath;
  }

  async getStream(storagePath: string): Promise<Readable> {
    const fullPath = join(this.basePath, storagePath);
    return createReadStream(fullPath);
  }

  async getBuffer(storagePath: string): Promise<Buffer> {
    const fullPath = join(this.basePath, storagePath);
    const { readFile } = await import('fs/promises');
    return readFile(fullPath);
  }

  async delete(storagePath: string): Promise<void> {
    const fullPath = join(this.basePath, storagePath);
    try {
      await unlink(fullPath);
    } catch {
      // File might not exist
    }
  }

  async exists(storagePath: string): Promise<boolean> {
    const fullPath = join(this.basePath, storagePath);
    try {
      await access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}
