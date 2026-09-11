// ==========================================
// Text Service — бизнес-логика для текстов
// (SOLID: SRP — только текстовая логика)
// ==========================================
import { nanoid } from 'nanoid';
export class TextService {
    textRepository;
    constructor(textRepository) {
        this.textRepository = textRepository;
    }
    /**
     * Создать текстовый сниппет
     */
    async createSnippet(title, content, language, expiresInDays) {
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
        const input = {
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
    async getSnippetByShortUrl(shortUrl) {
        const snippet = await this.textRepository.findByShortUrl(shortUrl);
        if (!snippet)
            return null;
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
    async deleteSnippet(shortUrl) {
        const snippet = await this.textRepository.findByShortUrl(shortUrl);
        if (!snippet)
            return false;
        await this.textRepository.delete(snippet.id);
        return true;
    }
    /**
     * Очистка просроченных сниппетов
     */
    async cleanupExpired() {
        const expired = await this.textRepository.findExpired();
        for (const snippet of expired) {
            await this.textRepository.delete(snippet.id);
        }
        return expired.length;
    }
}
//# sourceMappingURL=TextService.js.map