import { IStorageProvider } from './interfaces.js';
import { Readable } from 'stream';
export declare class LocalStorageProvider implements IStorageProvider {
    private basePath;
    constructor(basePath: string);
    save(file: Buffer | Readable, filename: string, _mimeType: string): Promise<string>;
    getStream(storagePath: string): Promise<Readable>;
    getBuffer(storagePath: string): Promise<Buffer>;
    delete(storagePath: string): Promise<void>;
    exists(storagePath: string): Promise<boolean>;
}
//# sourceMappingURL=LocalStorageProvider.d.ts.map