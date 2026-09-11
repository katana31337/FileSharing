import { Pool } from 'pg';
import { IFileRepository, ITextRepository } from './interfaces.js';
import { ShareItem, TextSnippet, CreateFileInput, CreateTextInput } from '../models/index.js';
export declare class PostgresFileRepository implements IFileRepository {
    private pool;
    constructor(pool: Pool);
    create(input: CreateFileInput, shortUrl: string): Promise<ShareItem>;
    findByShortUrl(shortUrl: string): Promise<ShareItem | null>;
    findById(id: string): Promise<ShareItem | null>;
    incrementDownloads(id: string): Promise<void>;
    delete(id: string): Promise<void>;
    findExpired(): Promise<ShareItem[]>;
    private mapRow;
}
export declare class PostgresTextRepository implements ITextRepository {
    private pool;
    constructor(pool: Pool);
    create(input: CreateTextInput, shortUrl: string): Promise<TextSnippet>;
    findByShortUrl(shortUrl: string): Promise<TextSnippet | null>;
    delete(id: string): Promise<void>;
    findExpired(): Promise<TextSnippet[]>;
    private mapRow;
}
//# sourceMappingURL=postgres.d.ts.map