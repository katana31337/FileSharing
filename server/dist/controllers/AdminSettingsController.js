// ==========================================
// Контроллер для работы с настройками админ-панели
// ==========================================
export class AdminSettingsController {
    service;
    constructor(service) {
        this.service = service;
    }
    /**
     * GET /api/admin/settings
     * Получить все настройки
     */
    async getSettings(req, res) {
        try {
            const settings = await this.service.getSettings();
            // Не возвращаем пароль в ответе
            const { adminPassword, ...safeSettings } = settings;
            res.json(safeSettings);
        }
        catch (error) {
            console.error('Error getting admin settings:', error);
            res.status(500).json({ error: 'Failed to get admin settings' });
        }
    }
    /**
     * PUT /api/admin/settings
     * Обновить настройки
     */
    async updateSettings(req, res) {
        try {
            const settings = await this.service.updateSettings(req.body);
            // Не возвращаем пароль в ответе
            const { adminPassword, ...safeSettings } = settings;
            res.json(safeSettings);
        }
        catch (error) {
            if (error instanceof Error) {
                res.status(400).json({ error: error.message });
            }
            else {
                res.status(500).json({ error: 'Failed to update admin settings' });
            }
        }
    }
    /**
     * POST /api/admin/settings/reset
     * Сбросить все настройки к значениям по умолчанию
     */
    async resetSettings(req, res) {
        try {
            const settings = await this.service.resetToDefaults();
            // Не возвращаем пароль в ответе
            const { adminPassword, ...safeSettings } = settings;
            res.json(safeSettings);
        }
        catch (error) {
            console.error('Error resetting admin settings:', error);
            res.status(500).json({ error: 'Failed to reset admin settings' });
        }
    }
    /**
     * POST /api/admin/settings/validate
     * Проверить учётные данные
     */
    async validateCredentials(req, res) {
        try {
            const { login, password } = req.body;
            if (!login || !password) {
                res.status(400).json({ error: 'Login and password are required' });
                return;
            }
            const isValid = await this.service.validateCredentials(login, password);
            res.json({ valid: isValid });
        }
        catch (error) {
            console.error('Error validating credentials:', error);
            res.status(500).json({ error: 'Failed to validate credentials' });
        }
    }
    /**
     * GET /api/admin/settings/has-credentials
     * Проверить, настроены ли учётные данные
     */
    async hasCredentials(req, res) {
        try {
            const hasCreds = await this.service.hasCredentials();
            res.json({ hasCredentials: hasCreds });
        }
        catch (error) {
            console.error('Error checking credentials:', error);
            res.status(500).json({ error: 'Failed to check credentials' });
        }
    }
}
//# sourceMappingURL=AdminSettingsController.js.map