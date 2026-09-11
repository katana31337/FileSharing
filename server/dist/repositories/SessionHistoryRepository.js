// ==========================================
// Репозиторий для работы с историей сессий
// ==========================================
export class SessionHistoryRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    /**
     * Получить историю сессии
     */
    async getSessionHistory(sessionId) {
        const filesResult = await this.pool.query(`SELECT * FROM session_files 
       WHERE session_id = $1 AND expires_at > NOW()
       ORDER BY uploaded_at DESC`, [sessionId]);
        const textsResult = await this.pool.query(`SELECT * FROM session_texts 
       WHERE session_id = $1 AND expires_at > NOW()
       ORDER BY uploaded_at DESC`, [sessionId]);
        return {
            files: filesResult.rows,
            texts: textsResult.rows,
        };
    }
    /**
     * Добавить файл в историю сессии
     */
    async addFileToHistory(sessionId, shortUrl, fileName, fileSize, expiresAt) {
        const result = await this.pool.query(`INSERT INTO session_files (session_id, short_url, file_name, file_size, expires_at)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`, [sessionId, shortUrl, fileName, fileSize, expiresAt]);
        return result.rows[0];
    }
    /**
     * Добавить текст в историю сессии
     */
    async addTextToHistory(sessionId, shortUrl, title, expiresAt) {
        const result = await this.pool.query(`INSERT INTO session_texts (session_id, short_url, title, expires_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`, [sessionId, shortUrl, title, expiresAt]);
        return result.rows[0];
    }
    /**
     * Удалить файл из истории сессии
     */
    async removeFileFromHistory(sessionId, shortUrl) {
        await this.pool.query(`DELETE FROM session_files 
       WHERE session_id = $1 AND short_url = $2`, [sessionId, shortUrl]);
    }
    /**
     * Удалить текст из истории сессии
     */
    async removeTextFromHistory(sessionId, shortUrl) {
        await this.pool.query(`DELETE FROM session_texts 
       WHERE session_id = $1 AND short_url = $2`, [sessionId, shortUrl]);
    }
    /**
     * Очистить всю историю сессии
     */
    async clearSessionHistory(sessionId) {
        await this.pool.query(`DELETE FROM session_files WHERE session_id = $1`, [sessionId]);
        await this.pool.query(`DELETE FROM session_texts WHERE session_id = $1`, [sessionId]);
    }
    /**
     * Очистить просроченные записи
     */
    async cleanupExpired() {
        await this.pool.query(`DELETE FROM session_files WHERE expires_at < NOW()`);
        await this.pool.query(`DELETE FROM session_texts WHERE expires_at < NOW()`);
    }
}
//# sourceMappingURL=SessionHistoryRepository.js.map