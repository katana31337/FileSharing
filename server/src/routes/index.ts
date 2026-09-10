// ==========================================
// Routes — определение маршрутов API
// ==========================================

import { Router } from 'express';
import multer from 'multer';
import { FileController } from '../controllers/FileController.js';
import { TextController } from '../controllers/TextController.js';
import { AdminSettingsController } from '../controllers/AdminSettingsController.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100 MB
  },
});

export function createRoutes(
  fileController: FileController,
  textController: TextController,
  adminSettingsController: AdminSettingsController,
): Router {
  const router = Router();

  // === File routes ===
  router.post('/files', upload.single('file'), fileController.upload);
  router.get('/files/:shortUrl', fileController.getInfo);
  router.get('/files/:shortUrl/download', fileController.download);
  router.delete('/files/:shortUrl', fileController.delete);

  // === Text routes ===
  router.post('/texts', textController.create);
  router.get('/texts/:shortUrl', textController.get);
  router.delete('/texts/:shortUrl', textController.delete);

  // === Admin settings routes ===
  router.get('/admin/settings', adminSettingsController.getSettings);
  router.put('/admin/settings', adminSettingsController.updateSettings);
  router.post('/admin/settings/reset', adminSettingsController.resetSettings);

  // === Health check ===
  router.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
    });
  });

  return router;
}
