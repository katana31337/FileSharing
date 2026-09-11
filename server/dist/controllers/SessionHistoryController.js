// ==========================================
// Контроллер для работы с историей сессий
// ==========================================
export class SessionHistoryController {
    service;
    constructor(service) {
        this.service = service;
    }
    /**
     * GET /api/session/history
     * Получить историю сессии
     */
    async getHistory(req, res) {
        try {
            const sessionId = req.cookies?.session_id;
            if (!sessionId) {
                res.status(401).json({ error: 'Session ID not found' });
                return;
            }
            const history = await this.service.getSessionHistory(sessionId);
            res.json(history);
        }
        catch (error) {
            console.error('Error getting session history:', error);
            res.status(500).json({ error: 'Failed to get session history' });
        }
    }
    /**
     * POST /api/session/history/file
     * Добавить файл в историю сессии
     */
    async addFile(req, res) {
        try {
            const sessionId = req.cookies?.session_id;
            if (!sessionId) {
                res.status(401).json({ error: 'Session ID not found' });
                return;
            }
            const { shortUrl, fileName, fileSize, expiresInDays } = req.body;
            if (!shortUrl || !fileName || !fileSize || !expiresInDays) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }
            const file = await this.service.addFileToHistory(sessionId, shortUrl, fileName, fileSize, expiresInDays);
            res.json(file);
        }
        catch (error) {
            console.error('Error adding file to history:', error);
            res.status(500).json({ error: 'Failed to add file to history' });
        }
    }
    /**
     * POST /api/session/history/text
     * Добавить текст в историю сессии
     */
    async addText(req, res) {
        try {
            const sessionId = req.cookies?.session_id;
            if (!sessionId) {
                res.status(401).json({ error: 'Session ID not found' });
                return;
            }
            const { shortUrl, title, expiresInDays } = req.body;
            if (!shortUrl || !title || !expiresInDays) {
                res.status(400).json({ error: 'Missing required fields' });
                return;
            }
            const text = await this.service.addTextToHistory(sessionId, shortUrl, title, expiresInDays);
            res.json(text);
        }
        catch (error) {
            console.error('Error adding text to history:', error);
            res.status(500).json({ error: 'Failed to add text to history' });
        }
    }
    /**
     * DELETE /api/session/history/file/:shortUrl
     * Удалить файл из истории сессии
     */
    async removeFile(req, res) {
        try {
            const sessionId = req.cookies?.session_id;
            if (!sessionId) {
                res.status(401).json({ error: 'Session ID not found' });
                return;
            }
            const { shortUrl } = req.params;
            await this.service.removeFileFromHistory(sessionId, shortUrl);
            res.json({ success: true });
        }
        catch (error) {
            console.error('Error removing file from history:', error);
            res.status(500).json({ error: 'Failed to remove file from history' });
        }
    }
    /**
     * DELETE /api/session/history/text/:shortUrl
     * Удалить текст из истории сессии
     */
    async removeText(req, res) {
        try {
            const sessionId = req.cookies?.session_id;
            if (!sessionId) {
                res.status(401).json({ error: 'Session ID not found' });
                return;
            }
            const { shortUrl } = req.params;
            await this.service.removeTextFromHistory(sessionId, shortUrl);
            res.json({ success: true });
        }
        catch (error) {
            console.error('Error removing text from history:', error);
            res.status(500).json({ error: 'Failed to remove text from history' });
        }
    }
    /**
     * DELETE /api/session/history
     * Очистить всю историю сессии
     */
    async clearHistory(req, res) {
        try {
            const sessionId = req.cookies?.session_id;
            if (!sessionId) {
                res.status(401).json({ error: 'Session ID not found' });
                return;
            }
            await this.service.clearSessionHistory(sessionId);
            res.json({ success: true });
        }
        catch (error) {
            console.error('Error clearing session history:', error);
            res.status(500).json({ error: 'Failed to clear session history' });
        }
    }
}
//# sourceMappingURL=SessionHistoryController.js.map