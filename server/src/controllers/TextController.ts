// ==========================================
// Text Controller — HTTP обработка для текстов
// ==========================================

import { Request, Response } from 'express';
import { TextService } from '../services/TextService.js';

export class TextController {
  constructor(private textService: TextService) {}

  /**
   * POST /api/texts — создание сниппета
   */
  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, content, language, expiresInDays } = req.body;

      if (!content) {
        res.status(400).json({ error: 'Содержимое обязательно' });
        return;
      }

      const snippet = await this.textService.createSnippet(
        title || 'Untitled',
        content,
        language || 'text',
        expiresInDays || 7,
      );

      res.status(201).json({
        id: snippet.id,
        shortUrl: snippet.shortUrl,
        title: snippet.title,
        language: snippet.language,
        expiresAt: snippet.expiresAt,
        viewUrl: `/s/${snippet.shortUrl}`,
      });
    } catch (error: any) {
      if (error.message?.includes('Срок хранения') || error.message?.includes('Содержимое') || error.message?.includes('размер')) {
        res.status(400).json({ error: error.message });
        return;
      }
      console.error('Create text error:', error);
      res.status(500).json({ error: 'Ошибка создания сниппета' });
    }
  };

  /**
   * GET /api/texts/:shortUrl — получение сниппета
   */
  get = async (req: Request, res: Response): Promise<void> => {
    try {
      const { shortUrl } = req.params;
      const snippet = await this.textService.getSnippetByShortUrl(shortUrl);

      if (!snippet) {
        res.status(404).json({ error: 'Сниппет не найден или срок хранения истёк' });
        return;
      }

      res.json({
        id: snippet.id,
        shortUrl: snippet.shortUrl,
        title: snippet.title,
        content: snippet.content,
        language: snippet.language,
        createdAt: snippet.createdAt,
        expiresAt: snippet.expiresAt,
      });
    } catch (error) {
      console.error('Get text error:', error);
      res.status(500).json({ error: 'Ошибка получения сниппета' });
    }
  };

  /**
   * DELETE /api/texts/:shortUrl — удаление сниппета
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { shortUrl } = req.params;
      const deleted = await this.textService.deleteSnippet(shortUrl);

      if (!deleted) {
        res.status(404).json({ error: 'Сниппет не найден' });
        return;
      }

      res.json({ message: 'Сниппет удалён' });
    } catch (error) {
      console.error('Delete text error:', error);
      res.status(500).json({ error: 'Ошибка удаления сниппета' });
    }
  };
}
