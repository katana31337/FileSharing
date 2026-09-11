import { Pool } from 'pg';
export interface SessionFile {
    id: string;
    session_id: string;
    short_url: string;
    file_name: string;
    file_size: number;
    uploaded_at: Date;
    expires_at: Date;
}
export interface SessionText {
    id: string;
    session_id: string;
    short_url: string;
    title: string;
    uploaded_at: Date;
    expires_at: Date;
}
export interface SessionHistory {
    files: SessionFile[];
    texts: SessionText[];
}
export declare class SessionHistoryRepository {
    private pool;
    constructor(pool: Pool);
    /**
     * Получить историю сессии
     */
    getSessionHistory(sessionId: string): Promise<SessionHistory>;
    /**
     * Добавить файл в историю сессии
     */
    addFileToHistory(sessionId: string, shortUrl: string, fileName: string, fileSize: number, expiresAt: Date): Promise<SessionFile>;
    /**
     * Добавить текст в историю сессии
     */
    addTextToHistory(sessionId: string, shortUrl: string, title: string, expiresAt: Date): Promise<SessionText>;
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
//# sourceMappingURL=SessionHistoryRepository.d.ts.map