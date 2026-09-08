// ==========================================
// PostgreSQL Repository Implementation
// (SOLID: LSP — реализация интерфейса)
// ==========================================

import { Pool } from 'pg';
import { IFileRepository, ITextRepository } from './interfaces.js';
import { ShareItem, TextSnippet, CreateFileInput, CreateTextInput } from '../models/index.js';

export class PostgresFileRepository implements IFileRepository {
  constructor(private pool: Pool) {}

  async create(input: CreateFileInput, shortUrl: string): Promise<ShareItem> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

    const result = await this.pool.query(
      `INSERT INTO files (id, short_url, name, size, mime_type, storage_path, expires_at, max_downloads, password)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [shortUrl, input.name, input.size, input.mimeType, input.storagePath, expiresAt, input.maxDownloads || null, input.password || null],
    );

    return this.mapRow(result.rows[0]);
  }

  async findByShortUrl(shortUrl: string): Promise<ShareItem | null> {
    const result = await this.pool.query('SELECT * FROM files WHERE short_url = $1', [shortUrl]);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async findById(id: string): Promise<ShareItem | null> {
    const result = await this.pool.query('SELECT * FROM files WHERE id = $1', [id]);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async incrementDownloads(id: string): Promise<void> {
    await this.pool.query('UPDATE files SET download_count = download_count + 1 WHERE id = $1', [id]);
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM files WHERE id = $1', [id]);
  }

  async findExpired(): Promise<ShareItem[]> {
    const result = await this.pool.query('SELECT * FROM files WHERE expires_at < NOW()');
    return result.rows.map(this.mapRow);
  }

  private mapRow(row: any): ShareItem {
    return {
      id: row.id,
      shortUrl: row.short_url,
      type: row.mime_type?.startsWith('image/') ? 'image' : 'file',
      name: row.name,
      size: row.size,
      mimeType: row.mime_type,
      storagePath: row.storage_path,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
      maxDownloads: row.max_downloads,
      downloadCount: row.download_count || 0,
      password: row.password,
    };
  }
}

export class PostgresTextRepository implements ITextRepository {
  constructor(private pool: Pool) {}

  async create(input: CreateTextInput, shortUrl: string): Promise<TextSnippet> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + input.expiresInDays);

    const result = await this.pool.query(
      `INSERT INTO text_snippets (id, short_url, title, content, language, expires_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)
       RETURNING *`,
      [shortUrl, input.title, input.content, input.language, expiresAt],
    );

    return this.mapRow(result.rows[0]);
  }

  async findByShortUrl(shortUrl: string): Promise<TextSnippet | null> {
    const result = await this.pool.query('SELECT * FROM text_snippets WHERE short_url = $1', [shortUrl]);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM text_snippets WHERE id = $1', [id]);
  }

  async findExpired(): Promise<TextSnippet[]> {
    const result = await this.pool.query('SELECT * FROM text_snippets WHERE expires_at < NOW()');
    return result.rows.map(this.mapRow);
  }

  private mapRow(row: any): TextSnippet {
    return {
      id: row.id,
      shortUrl: row.short_url,
      title: row.title,
      content: row.content,
      language: row.language,
      createdAt: row.created_at,
      expiresAt: row.expires_at,
    };
  }
}
