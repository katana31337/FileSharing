import { SessionHistoryRepository, SessionHistory, SessionFile, SessionText } from '../repositories/SessionHistoryRepository';
export declare class SessionHistoryService {
    private repository;
    constructor(repository: SessionHistoryRepository);
    /**
     * Получить историю сессии
     */
    getSessionHistory(sessionId: string): Promise<SessionHistory>;
    /**
     * Добавить файл в историю сессии
     */
    addFileToHistory(sessionId: string, shortUrl: string, fileName: string, fileSize: number, expiresInDays: number): Promise<SessionFile>;
    /**
     * Добавить текст в историю сессии
     */
    addTextToHistory(sessionId: string, shortUrl: string, title: string, expiresInDays: number): Promise<SessionText>;
    /**
     * Удалить файл из истории сессии
     */
    removeFileFromHistory(sessionId: string, shortUrl: string): Promise<void>;
    /**
     * Удалить текст из истории сессии
     */
    removeTextFromHistory(sessionId: string, shortUrl: string): Promise<void>;
    /**
     * Очистить всю историю сессии
     */
    clearSessionHistory(sessionId: string): Promise<void>;
    /**
     * Очистить просроченные записи
     */
    cleanupExpired(): Promise<void>;
}
//# sourceMappingURL=SessionHistoryService.d.ts.map