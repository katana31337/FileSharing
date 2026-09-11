// ==========================================
// PostgreSQL реализация репозитория настроек
// ==========================================
export class PostgresAdminSettingsRepository {
    pool;
    constructor(pool) {
        this.pool = pool;
    }
    async getSettings() {
        const result = await this.pool.query('SELECT key, value FROM admin_settings');
        const settings = {};
        for (const row of result.rows) {
            settings[row.key] = row.value;
        }
        return {
            maxFileSize: parseInt(settings.max_file_size || '104857600'),
            minExpirationDays: parseInt(settings.min_expiration_days || '1'),
            maxExpirationDays: parseInt(settings.max_expiration_days || '30'),
            defaultExpirationDays: parseInt(settings.default_expiration_days || '7'),
            expirationButtons: JSON.parse(settings.expiration_buttons || '[1,3,7,14,30]'),
            sessionDurationDays: parseInt(settings.session_duration_days || '7'),
            adminLogin: settings.admin_login || '',
            adminPassword: settings.admin_password || '',
            adminSecretPath: settings.admin_secret_path || 'admin',
            logo: settings.logo || '',
            logoType: settings.logo_type || 'none',
        };
    }
    async updateSettings(settings) {
        const updates = [];
        if (settings.maxFileSize !== undefined) {
            updates.push(['max_file_size', settings.maxFileSize.toString()]);
        }
        if (settings.minExpirationDays !== undefined) {
            updates.push(['min_expiration_days', settings.minExpirationDays.toString()]);
        }
        if (settings.maxExpirationDays !== undefined) {
            updates.push(['max_expiration_days', settings.maxExpirationDays.toString()]);
        }
        if (settings.defaultExpirationDays !== undefined) {
            updates.push(['default_expiration_days', settings.defaultExpirationDays.toString()]);
        }
        if (settings.adminSecretPath !== undefined) {
            updates.push(['admin_secret_path', settings.adminSecretPath]);
        }
        if (settings.logo !== undefined) {
            updates.push(['logo', settings.logo]);
        }
        if (settings.logoType !== undefined) {
            updates.push(['logo_type', settings.logoType]);
        }
        if (settings.expirationButtons !== undefined) {
            updates.push(['expiration_buttons', JSON.stringify(settings.expirationButtons)]);
        }
        if (settings.sessionDurationDays !== undefined) {
            updates.push(['session_duration_days', settings.sessionDurationDays.toString()]);
        }
        if (settings.adminLogin !== undefined) {
            updates.push(['admin_login', settings.adminLogin]);
        }
        if (settings.adminPassword !== undefined) {
            updates.push(['admin_password', settings.adminPassword]);
        }
        for (const [key, value] of updates) {
            await this.pool.query(`INSERT INTO admin_settings (key, value) 
         VALUES ($1, $2) 
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`, [key, value]);
        }
        return this.getSettings();
    }
    async resetSettings() {
        const defaultSettings = [
            ['max_file_size', '104857600'],
            ['min_expiration_days', '1'],
            ['max_expiration_days', '30'],
            ['default_expiration_days', '7'],
            ['expiration_buttons', '[1,3,7,14,30]'],
            ['session_duration_days', '7'],
            ['admin_login', ''],
            ['admin_password', ''],
            ['admin_secret_path', 'admin'],
            ['logo', ''],
            ['logo_type', 'none'],
        ];
        for (const [key, value] of defaultSettings) {
            await this.pool.query(`UPDATE admin_settings SET value = $1, updated_at = NOW() WHERE key = $2`, [value, key]);
        }
        return this.getSettings();
    }
}
//# sourceMappingURL=PostgresAdminSettingsRepository.js.map