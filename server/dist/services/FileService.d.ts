import { IFileRepository } from '../repositories/interfaces.js';
import { IStorageProvider } from '../storage/interfaces.js';
import { ShareItem } from '../models/index.js';
import { Readable } from 'stream';
export declare class FileService {
    private fileRepository;
    private storageProvider;
    constructor(fileRepository: IFileRepository, storageProvider: IStorageProvider);
    /**
     * Загрузить файл
     */
    uploadFile(fileStream: Readable, filename: string, size: number, mimeType: string, expiresInDays: number, maxDownloads?: number, password?: string): Promise<ShareItem>;
    /**
     * Получить информацию о файле по короткой ссылке
     */
    getFileByShortUrl(shortUrl: string): Promise<ShareItem | null>;
    /**
     * Скачать файл
     */
    downloadFile(shortUrl: string): Promise<{
        item: ShareItem;
        stream: Readable;
    } | null>;
    /**
     * Удалить файл
     */
    deleteFile(shortUrl: string): Promise<boolean>;
    /**
     * Очистка просроченных файлов (для cron job)
     */
    cleanupExpired(): Promise<number>;
    private cleanup;
}
//# sourceMappingURL=FileService.d.ts.map