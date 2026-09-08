// ==========================================
// Local Filesystem Storage Provider
// Реализация IStorageProvider для локального FS
// ==========================================

import { IStorageProvider } from './interfaces.js';
import { Readable } from 'stream';
import { createReadStream, createWriteStream, unlink, access } from 'fs/promises';
import { pipeline } from 'stream/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';

export class LocalStorageProvider implements IStorageProvider {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
    // Ensure base directory exists
    mkdir(basePath, { recursive: true }).catch(() => {});
  }

  async save(file: Buffer | Readable, filename: string, _mimeType: string): Promise<string> {
    const storagePath = `files/${Date.now()}-${filename}`;
    const fullPath = join(this.basePath, storagePath);
    
    // Ensure directory exists
    const dir = join(this.basePath, 'files');
    await mkdir(dir, { recursive: true });

    if (Buffer.isBuffer(file)) {
      const writeStream = createWriteStream(fullPath);
      await pipeline(Readable.from(file), writeStream);
    } else {
      const writeStream = createWriteStream(fullPath);
      await pipeline(file, writeStream);
    }

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
