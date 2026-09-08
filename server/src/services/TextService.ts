// ==========================================
// Text Service — бизнес-логика для текстов
// (SOLID: SRP — только текстовая логика)
// ==========================================

import { nanoid } from 'nanoid';
import { ITextRepository } from '../repositories/interfaces.js';
import { TextSnippet, CreateTextInput } from '../models/index.js';

export class TextService {
  constructor(
    private textRepository: ITextRepository,
  ) {}

  /**
   * Создать текстовый сниппет
   */
  async createSnippet(
    title: string,
    content: string,
    language: string,
    expiresInDays: number,
  ): Promise<TextSnippet> {
    // Validate expiration
    if (expiresInDays < 1 || expiresInDays > 30) {
      throw new Error('Срок хранения должен быть от 1 до 30 дней');
    }

    // Validate content
    if (!content || content.trim().length === 0) {
      throw new Error('Содержимое не может быть пустым');
    }

    // Limit content size (1MB)
    if (content.length > 1_000_000) {
      throw new Error('Максимальный размер текста — 1 МБ');
    }

    const shortUrl = nanoid(7);

    const input: CreateTextInput = {
      title: title || 'Untitled',
      content,
      language: language || 'text',
      expiresInDays,
    };

    return this.textRepository.create(input, shortUrl);
  }

  /**
   * Получить сниппет по короткой ссылке
   */
  async getSnippetByShortUrl(shortUrl: string): Promise<TextSnippet | null> {
    const snippet = await this.textRepository.findByShortUrl(shortUrl);
    if (!snippet) return null;

    // Check expiration
    if (new Date() > snippet.expiresAt) {
      await this.textRepository.delete(snippet.id);
      return null;
    }

    return snippet;
  }

  /**
   * Удалить сниппет
   */
  async deleteSnippet(shortUrl: string): Promise<boolean> {
    const snippet = await this.textRepository.findByShortUrl(shortUrl);
    if (!snippet) return false;

    await this.textRepository.delete(snippet.id);
    return true;
  }

  /**
   * Очистка просроченных сниппетов
   */
  async cleanupExpired(): Promise<number> {
    const expired = await this.textRepository.findExpired();
    for (const snippet of expired) {
      await this.textRepository.delete(snippet.id);
    }
    return expired.length;
  }
}
