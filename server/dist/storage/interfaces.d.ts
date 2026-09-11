import { Readable } from 'stream';
export interface IStorageProvider {
    /**
     * Сохранить файл и вернуть путь к нему
     */
    save(file: Buffer | Readable, filename: string, mimeType: string): Promise<string>;
    /**
     * Получить файл как stream
     */
    getStream(storagePath: string): Promise<Readable>;
    /**
     * Получить файл как buffer
     */
    getBuffer(storagePath: string): Promise<Buffer>;
    /**
     * Удалить файл
     */
    delete(storagePath: string): Promise<void>;
    /**
     * Проверить существование файла
     */
    exists(storagePath: string): Promise<boolean>;
}
//# sourceMappingURL=interfaces.d.ts.map