// ==========================================
// File Service — бизнес-логика для файлов
// (SOLID: SRP — только файловая логика)
// ==========================================
import { nanoid } from 'nanoid';
export class FileService {
    fileRepository;
    storageProvider;
    constructor(fileRepository, storageProvider) {
        this.fileRepository = fileRepository;
        this.storageProvider = storageProvider;
    }
    /**
     * Загрузить файл
     */
    async uploadFile(fileStream, filename, size, mimeType, expiresInDays, maxDownloads, password) {
        console.log('[FileService] Начало загрузки файла:', { filename, size, mimeType, expiresInDays });
        // Validate expiration (max 30 days)
        if (expiresInDays < 1 || expiresInDays > 30) {
            throw new Error('Срок хранения должен быть от 1 до 30 дней');
        }
        // Save file to storage
        console.log('[FileService] Сохранение файла в хранилище...');
        const storagePath = await this.storageProvider.save(fileStream, filename, mimeType);
        console.log('[FileService] ✅ Файл сохранён в хранилище:', storagePath);
        // Generate short URL
        const shortUrl = nanoid(7);
        console.log('[FileService] Сгенерирован shortUrl:', shortUrl);
        // Save metadata to DB
        const input = {
            name: filename,
            size,
            mimeType,
            storagePath,
            expiresInDays,
            maxDownloads,
            password,
        };
        console.log('[FileService] Сохранение метаданных в БД...');
        const result = await this.fileRepository.create(input, shortUrl);
        console.log('[FileService] ✅ Метаданные сохранены в БД');
        return result;
    }
    /**
     * Получить информацию о файле по короткой ссылке
     */
    async getFileByShortUrl(shortUrl) {
        const item = await this.fileRepository.findByShortUrl(shortUrl);
        if (!item)
            return null;
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
    async downloadFile(shortUrl) {
        const item = await this.getFileByShortUrl(shortUrl);
        if (!item)
            return null;
        const stream = await this.storageProvider.getStream(item.storagePath);
        await this.fileRepository.incrementDownloads(item.id);
        return { item, stream };
    }
    /**
     * Удалить файл
     */
    async deleteFile(shortUrl) {
        const item = await this.fileRepository.findByShortUrl(shortUrl);
        if (!item)
            return false;
        await this.cleanup(item);
        return true;
    }
    /**
     * Очистка просроченных файлов (для cron job)
     */
    async cleanupExpired() {
        const expired = await this.fileRepository.findExpired();
        for (const item of expired) {
            await this.cleanup(item);
        }
        return expired.length;
    }
    async cleanup(item) {
        await this.storageProvider.delete(item.storagePath);
        await this.fileRepository.delete(item.id);
    }
}
//# sourceMappingURL=FileService.js.map