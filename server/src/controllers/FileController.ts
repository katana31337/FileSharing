// ==========================================
// File Controller — HTTP обработка запросов
// (SOLID: SRP — только HTTP-логика для файлов)
// ==========================================

import { Request, Response } from 'express';
import { Readable } from 'stream';
import { FileService } from '../services/FileService.js';
import { File as MulterFile } from 'multer';

// Расширяем тип Request для multer
interface RequestWithFile extends Request {
  file?: MulterFile;
}

export class FileController {
  constructor(private fileService: FileService) {}

  /**
   * POST /api/files — загрузка файла
   */
  upload = async (req: RequestWithFile, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).json({ error: 'Файл не предоставлен' });
        return;
      }

      const { expiresInDays, maxDownloads, password } = req.body;
      const days = parseInt(expiresInDays) || 7;

      console.log('[FileController] Получен файл:', {
        originalname: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
        hasBuffer: !!req.file.buffer,
        hasStream: !!req.file.stream
      });

      const fileStream = req.file.stream || Readable.from(req.file.buffer);
      
      console.log('[FileController] Вызов fileService.uploadFile...');
      
      const item = await this.fileService.uploadFile(
        fileStream,
        req.file.originalname,
        req.file.size,
        req.file.mimetype,
        days,
        maxDownloads ? parseInt(maxDownloads) : undefined,
        password || undefined,
      );

      console.log('[FileController] Файл успешно загружен:', item.shortUrl);

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
      console.error('[FileController] ❌ Upload error:', error);
      console.error('[FileController] Error stack:', error instanceof Error ? error.stack : 'No stack');
      
      // Определяем тип ошибки и возвращаем соответствующий статус
      let statusCode = 500;
      let errorMessage = 'Ошибка загрузки файла';
      let errorDetails = error instanceof Error ? error.message : 'Unknown error';
      
      // Ошибки базы данных
      if (errorDetails.includes('column') && errorDetails.includes('does not exist')) {
        statusCode = 500;
        errorMessage = 'Ошибка базы данных';
        errorDetails = 'Схема базы данных не соответствует ожидаемой. Обратитесь к администратору.';
      }
      // Ошибки хранилища
      else if (errorDetails.includes('EACCES') || errorDetails.includes('permission')) {
        statusCode = 500;
        errorMessage = 'Ошибка доступа к хранилищу';
        errorDetails = 'Нет прав для записи файлов. Обратитесь к администратору.';
      }
      else if (errorDetails.includes('ENOSPC')) {
        statusCode = 507;
        errorMessage = 'Недостаточно места';
        errorDetails = 'На сервере закончилось свободное место. Обратитесь к администратору.';
      }
      // Ошибки валидации
      else if (errorDetails.includes('Срок хранения')) {
        statusCode = 400;
        errorMessage = 'Неверные параметры';
      }
      
      res.status(statusCode).json({ 
        error: errorMessage,
        details: errorDetails
      });
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
