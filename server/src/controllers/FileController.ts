// ==========================================
// File Controller — HTTP обработка запросов
// (SOLID: SRP — только HTTP-логика для файлов)
// ==========================================

import { Request, Response } from 'express';
import { FileService } from '../services/FileService.js';

export class FileController {
  constructor(private fileService: FileService) {}

  /**
   * POST /api/files — загрузка файла
   */
  upload = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Файл не предоставлен' });
        return;
      }

      const { expiresInDays, maxDownloads, password } = req.body;
      const days = parseInt(expiresInDays) || 7;

      const item = await this.fileService.uploadFile(
        req.file.stream || require('stream').Readable.from(req.file.buffer),
        req.file.originalname,
        req.file.size,
        req.file.mimetype,
        days,
        maxDownloads ? parseInt(maxDownloads) : undefined,
        password || undefined,
      );

      res.status(201).json({
        id: item.id,
        shortUrl: item.shortUrl,
        name: item.name,
        size: item.size,
        mimeType: item.mimeType,
        expiresAt: item.expiresAt,
        downloadUrl: `/s/${item.shortUrl}`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Ошибка загрузки файла' });
    }
  };

  /**
   * GET /api/files/:shortUrl — информация о файле
   */
  getInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { shortUrl } = req.params;
      const item = await this.fileService.getFileByShortUrl(shortUrl);

      if (!item) {
        res.status(404).json({ error: 'Файл не найден или срок хранения истёк' });
        return;
      }

      res.json({
        id: item.id,
        shortUrl: item.shortUrl,
        name: item.name,
        size: item.size,
        mimeType: item.mimeType,
        type: item.type,
        createdAt: item.createdAt,
        expiresAt: item.expiresAt,
        downloadCount: item.downloadCount,
      });
    } catch (error) {
      console.error('Get info error:', error);
      res.status(500).json({ error: 'Ошибка получения информации' });
    }
  };

  /**
   * GET /api/files/:shortUrl/download — скачивание файла
   */
  download = async (req: Request, res: Response): Promise<void> => {
    try {
      const { shortUrl } = req.params;
      const result = await this.fileService.downloadFile(shortUrl);

      if (!result) {
        res.status(404).json({ error: 'Файл не найден или срок хранения истёк' });
        return;
      }

      const { item, stream } = result;
      res.setHeader('Content-Type', item.mimeType);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(item.name)}"`);
      res.setHeader('Content-Length', item.size.toString());

      stream.pipe(res);
    } catch (error) {
      console.error('Download error:', error);
      res.status(500).json({ error: 'Ошибка скачивания файла' });
    }
  };

  /**
   * DELETE /api/files/:shortUrl — удаление файла
   */
  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { shortUrl } = req.params;
      const deleted = await this.fileService.deleteFile(shortUrl);

      if (!deleted) {
        res.status(404).json({ error: 'Файл не найден' });
        return;
      }

      res.json({ message: 'Файл удалён' });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ error: 'Ошибка удаления файла' });
    }
  };
}
