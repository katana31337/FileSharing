// ==========================================
// Сервис для работы с историей сессий
// ==========================================

import { SessionHistoryRepository, SessionHistory, SessionFile, SessionText } from '../repositories/SessionHistoryRepository';

export class SessionHistoryService {
  constructor(private repository: SessionHistoryRepository) {}

  /**
   * Получить историю сессии
   */
  async getSessionHistory(sessionId: string): Promise<SessionHistory> {
    return this.repository.getSessionHistory(sessionId);
  }

  /**
   * Добавить файл в историю сессии
   */
  async addFileToHistory(
    sessionId: string,
    shortUrl: string,
    fileName: string,
    fileSize: number,
    expiresInDays: number
  ): Promise<SessionFile> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    return this.repository.addFileToHistory(
      sessionId,
      shortUrl,
      fileName,
      fileSize,
      expiresAt
    );
  }

  /**
   * Добавить текст в историю сессии
   */
  async addTextToHistory(
    sessionId: string,
    shortUrl: string,
    title: string,
    expiresInDays: number
  ): Promise<SessionText> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    return this.repository.addTextToHistory(
      sessionId,
      shortUrl,
      title,
      expiresAt
    );
  }

  /**
   * Удалить файл из истории сессии
   */
  async removeFileFromHistory(sessionId: string, shortUrl: string): Promise<void> {
    return this.repository.removeFileFromHistory(sessionId, shortUrl);
  }

  /**
   * Удалить текст из истории сессии
   */
  async removeTextFromHistory(sessionId: string, shortUrl: string): Promise<void> {
    return this.repository.removeTextFromHistory(sessionId, shortUrl);
  }

  /**
   * Очистить всю историю сессии
   */
  async clearSessionHistory(sessionId: string): Promise<void> {
    return this.repository.clearSessionHistory(sessionId);
  }

  /**
   * Очистить просроченные записи
   */
  async cleanupExpired(): Promise<void> {
    return this.repository.cleanupExpired();
  }
}
