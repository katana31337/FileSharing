// ==========================================
// Сервис для работы с историей сессий
// ==========================================
export class SessionHistoryService {
    repository;
    constructor(repository) {
        this.repository = repository;
    }
    /**
     * Получить историю сессии
     */
    async getSessionHistory(sessionId) {
        return this.repository.getSessionHistory(sessionId);
    }
    /**
     * Добавить файл в историю сессии
     */
    async addFileToHistory(sessionId, shortUrl, fileName, fileSize, expiresInDays) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);
        return this.repository.addFileToHistory(sessionId, shortUrl, fileName, fileSize, expiresAt);
    }
    /**
     * Добавить текст в историю сессии
     */
    async addTextToHistory(sessionId, shortUrl, title, expiresInDays) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expiresInDays);
        return this.repository.addTextToHistory(sessionId, shortUrl, title, expiresAt);
    }
    /**
     * Удалить файл из истории сессии
     */
    async removeFileFromHistory(sessionId, shortUrl) {
        return this.repository.removeFileFromHistory(sessionId, shortUrl);
    }
    /**
     * Удалить текст из истории сессии
     */
    async removeTextFromHistory(sessionId, shortUrl) {
        return this.repository.removeTextFromHistory(sessionId, shortUrl);
    }
    /**
     * Очистить всю историю сессии
     */
    async clearSessionHistory(sessionId) {
        return this.repository.clearSessionHistory(sessionId);
    }
    /**
     * Очистить просроченные записи
     */
    async cleanupExpired() {
        return this.repository.cleanupExpired();
    }
}
//# sourceMappingURL=SessionHistoryService.js.map