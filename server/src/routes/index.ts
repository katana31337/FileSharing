// ==========================================
// Маршруты API
// ==========================================

import { Router } from 'express';
import { SessionHistoryController } from '../controllers/SessionHistoryController.js';
import { AdminSettingsController } from '../controllers/AdminSettingsController.js';

export function createRoutes(
  sessionHistoryController: SessionHistoryController,
  adminSettingsController: AdminSettingsController
): Router {
  const router = Router();

  // Session history routes
  router.get('/session/history', sessionHistoryController.getHistory.bind(sessionHistoryController));
  router.post('/session/history/file', sessionHistoryController.addFile.bind(sessionHistoryController));
  router.post('/session/history/text', sessionHistoryController.addText.bind(sessionHistoryController));
  router.delete('/session/history/file/:shortUrl', sessionHistoryController.removeFile.bind(sessionHistoryController));
  router.delete('/session/history/text/:shortUrl', sessionHistoryController.removeText.bind(sessionHistoryController));
  router.delete('/session/history', sessionHistoryController.clearHistory.bind(sessionHistoryController));

  // Admin settings routes
  router.get('/admin/settings', adminSettingsController.getSettings.bind(adminSettingsController));
  router.put('/admin/settings', adminSettingsController.updateSettings.bind(adminSettingsController));
  router.post('/admin/settings/reset', adminSettingsController.resetSettings.bind(adminSettingsController));
  router.post('/admin/settings/validate', adminSettingsController.validateCredentials.bind(adminSettingsController));
  router.get('/admin/settings/has-credentials', adminSettingsController.hasCredentials.bind(adminSettingsController));

  return router;
}
