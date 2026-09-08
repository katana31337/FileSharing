export type ContentType = 'file' | 'text' | 'image';

export interface ShareItem {
  id: string;
  shortUrl: string;
  type: ContentType;
  name: string;
  size: number;
  mimeType: string;
  createdAt: string;
  expiresAt: string;
  expiresInDays: number;
  downloads: number;
}

export interface UploadOptions {
  expiresInDays: number;
  maxDownloads?: number;
  password?: string;
}

export interface TextSnippet {
  id: string;
  shortUrl: string;
  content: string;
  language: string;
  title: string;
  createdAt: string;
  expiresAt: string;
  expiresInDays: number;
}

export type StorageProvider = 'local' | 's3' | 'gcs';

export interface AppConfig {
  maxFileSize: number; // bytes
  maxExpirationDays: number;
  shortUrlLength: number;
  storageProvider: StorageProvider;
}
