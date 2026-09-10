// ==========================================
// Контроллер настроек админки
// ==========================================

import { Request, Response } from 'express';
import { AdminSettingsService } from '../services/AdminSettingsService.js';

export class AdminSettingsController {
  constructor(private service: AdminSettingsService) {}

  // GET /api/admin/settings - Получить настройки
  getSettings = async (_req: Request, res: Response): Promise<void> => {
    try {
      const settings = await this.service.getSettings();
      res.json(settings);
    } catch (error) {
      console.error('Ошибка получения настроек:', error);
      res.status(500).json({ error: 'Ошибка получения настроек' });
    }
  };

  // PUT /api/admin/settings - Обновить настройки
  updateSettings = async (req: Request, res: Response): Promise<void> => {
    try {
      const settings = await this.service.updateSettings(req.body);
      res.json(settings);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Ошибка обновления настроек' });
      }
    }
  };

  // POST /api/admin/settings/reset - Сбросить настройки
  resetSettings = async (_req: Request, res: Response): Promise<void> => {
    try {
      const settings = await this.service.resetSettings();
      res.json(settings);
    } catch (error) {
      console.error('Ошибка сброса настроек:', error);
      res.status(500).json({ error: 'Ошибка сброса настроек' });
    }
  };
}
