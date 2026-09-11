import { AdminSettingsRepository, AdminSettings } from '../repositories/AdminSettingsRepository';
export declare class AdminSettingsService {
    private repository;
    constructor(repository: AdminSettingsRepository);
    /**
     * Получить все настройки
     */
    getSettings(): Promise<AdminSettings>;
    /**
     * Обновить настройки
     */
    updateSettings(settings: Partial<AdminSettings>): Promise<AdminSettings>;
    /**
     * Сбросить все настройки к значениям по умолчанию
     */
    resetToDefaults(): Promise<AdminSettings>;
    /**
     * Проверить учётные данные администратора
     */
    validateCredentials(login: string, password: string): Promise<boolean>;
    /**
     * Проверить, настроены ли учётные данные
     */
    hasCredentials(): Promise<boolean>;
}
//# sourceMappingURL=AdminSettingsService.d.ts.map