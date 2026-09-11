// ==========================================
// Маршруты API
// ==========================================
import { Router } from 'express';
import multer from 'multer';
// Настройка multer для загрузки файлов в память
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 100 * 1024 * 1024, // 100 MB
    },
});
export function createRoutes(sessionHistoryController, adminSettingsController, fileController, textController) {
    const router = Router();
    // File routes
    router.post('/files', upload.single('file'), fileController.upload.bind(fileController));
    router.get('/files/:shortUrl', fileController.getInfo.bind(fileController));
    router.get('/files/:shortUrl/download', fileController.download.bind(fileController));
    router.delete('/files/:shortUrl', fileController.delete.bind(fileController));
    // Text routes
    router.post('/texts', textController.create.bind(textController));
    router.get('/texts/:shortUrl', textController.get.bind(textController));
    router.delete('/texts/:shortUrl', textController.delete.bind(textController));
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
    // Health check
    router.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });
    return router;
}
//# sourceMappingURL=index.js.map