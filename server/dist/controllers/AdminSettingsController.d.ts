import { Request, Response } from 'express';
import { AdminSettingsService } from '../services/AdminSettingsService';
export declare class AdminSettingsController {
    private service;
    constructor(service: AdminSettingsService);
    /**
     * GET /api/admin/settings
     * Получить все настройки
     */
    getSettings(req: Request, res: Response): Promise<void>;
    /**
     * PUT /api/admin/settings
     * Обновить настройки
     */
    updateSettings(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/admin/settings/reset
     * Сбросить все настройки к значениям по умолчанию
     */
    resetSettings(req: Request, res: Response): Promise<void>;
    /**
     * POST /api/admin/settings/validate
     * Проверить учётные данные
     */
    validateCredentials(req: Request, res: Response): Promise<void>;
    /**
     * GET /api/admin/settings/has-credentials
     * Проверить, настроены ли учётные данные
     */
    hasCredentials(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=AdminSettingsController.d.ts.map