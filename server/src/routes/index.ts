// ==========================================
// Маршруты API
// ==========================================

import { Router } from 'express';
import { SessionHistoryController } from '../controllers/SessionHistoryController.js';

export function createRoutes(sessionHistoryController: SessionHistoryController): Router {
  const router = Router();

  // Session history routes
  router.get('/session/history', sessionHistoryController.getHistory.bind(sessionHistoryController));
  router.post('/session/history/file', sessionHistoryController.addFile.bind(sessionHistoryController));
  router.post('/session/history/text', sessionHistoryController.addText.bind(sessionHistoryController));
  router.delete('/session/history/file/:shortUrl', sessionHistoryController.removeFile.bind(sessionHistoryController));
  router.delete('/session/history/text/:shortUrl', sessionHistoryController.removeText.bind(sessionHistoryController));
  router.delete('/session/history', sessionHistoryController.clearHistory.bind(sessionHistoryController));

  return router;
}
