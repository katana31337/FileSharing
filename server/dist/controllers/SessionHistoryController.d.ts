import { Request, Response } from 'express';
import { SessionHistoryService } from '../services/SessionHistoryService';
export declare class SessionHistoryController {
    private service;
    constructor(service: SessionHistoryService);
    /**
     * GET /api/session/history
     * Получить историю сессии
     */
    getHistory(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/session/history/file
     * Добавить файл в историю сессии
     */
    addFile(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/session/history/text
     * Добавить текст в историю сессии
     */
    addText(req: Request, res: Response): Promise<void>;
    /**
     * DELETE /api/session/history/file/:shortUrl
     * Удалить файл из истории сессии
     */
    removeFile(req: Request, res: Response): Promise<void>;
    /**
     * DELETE /api/session/history/text/:shortUrl
     * Удалить текст из истории сессии
     */
    removeText(req: Request, res: Response): Promise<void>;
    /**
     * DELETE /api/session/history
     * Очистить всю историю сессии
     */
    clearHistory(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=SessionHistoryController.d.ts.map