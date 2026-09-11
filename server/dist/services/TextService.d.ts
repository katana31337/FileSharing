import { ITextRepository } from '../repositories/interfaces.js';
import { TextSnippet } from '../models/index.js';
export declare class TextService {
    private textRepository;
    constructor(textRepository: ITextRepository);
    /**
     * Создать текстовый сниппет
     */
    createSnippet(title: string, content: string, language: string, expiresInDays: number): Promise<TextSnippet>;
    /**
     * Получить сниппет по короткой ссылке
     */
    getSnippetByShortUrl(shortUrl: string): Promise<TextSnippet | null>;
    /**
     * Удалить сниппет
     */
    deleteSnippet(shortUrl: string): Promise<boolean>;
    /**
     * Очистка просроченных сниппетов
     */
    cleanupExpired(): Promise<number>;
}
//# sourceMappingURL=TextService.d.ts.map