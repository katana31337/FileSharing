import { Pool } from 'pg';
import { AdminSettings } from './AdminSettingsRepository.js';
export declare class PostgresAdminSettingsRepository {
    private pool;
    constructor(pool: Pool);
    getSettings(): Promise<AdminSettings>;
    updateSettings(settings: Partial<AdminSettings>): Promise<AdminSettings>;
    resetSettings(): Promise<AdminSettings>;
}
//# sourceMappingURL=PostgresAdminSettingsRepository.d.ts.map