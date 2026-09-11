import { Pool } from 'pg';
export interface AdminSettingsRow {
    key: string;
    value: string;
    updated_at: Date;
}
export interface AdminSettings {
    maxFileSize: number;
    minExpirationDays: number;
    maxExpirationDays: number;
    defaultExpirationDays: number;
    expirationButtons: number[];
    sessionDurationDays: number;
    adminLogin: string;
    adminPassword: string;
    adminSecretPath: string;
    logo: string;
    logoType: 'none' | 'file' | 'url';
}
export declare class AdminSettingsRepository {
    private pool;
    constructor(pool: Pool);
    /**
     * Получить все настройки из БД
     */
    getAllSettings(): Promise<AdminSettings>;
    /**
     * Обновить настройку
     */
    updateSetting(key: string, value: string): Promise<void>;
    /**
     * Обновить все настройки
     */
    updateAllSettings(settings: Partial<AdminSettings>): Promise<void>;
    /**
     * Сбросить все настройки к значениям по умолчанию
     */
    resetToDefaults(): Promise<void>;
}
//# sourceMappingURL=AdminSettingsRepository.d.ts.map