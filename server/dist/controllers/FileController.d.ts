import { Request, Response } from 'express';
import { FileService } from '../services/FileService.js';
export declare class FileController {
    private fileService;
    constructor(fileService: FileService);
    /**
     * POST /api/files — загрузка файла
     */
    upload: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/files/:shortUrl — информация о файле
     */
    getInfo: (req: Request, res: Response) => Promise<void>;
    /**
     * GET /api/files/:shortUrl/download — скачивание файла
     */
    download: (req: Request, res: Response) => Promise<void>;
    /**
     * DELETE /api/files/:shortUrl — удаление файла
     */
    delete: (req: Request, res: Response) => Promise<void>;
}
//# sourceMappingURL=FileController.d.ts.map