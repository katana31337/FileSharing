// ==========================================
// Репозиторий для работы с настройками админ-панели
// ==========================================

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

export class AdminSettingsRepository {
  constructor(private pool: Pool) {}

  /**
   * Получить все настройки из БД
   */
  async getAllSettings(): Promise<AdminSettings> {
    const result = await this.pool.query(
      'SELECT key, value FROM admin_settings'
    );

    const settingsMap: Record<string, string> = {};
    for (const row of result.rows) {
      settingsMap[row.key] = row.value;
    }

    return {
      maxFileSize: parseInt(settingsMap.max_file_size || '104857600'),
      minExpirationDays: parseInt(settingsMap.min_expiration_days || '1'),
      maxExpirationDays: parseInt(settingsMap.max_expiration_days || '30'),
      defaultExpirationDays: parseInt(settingsMap.default_expiration_days || '7'),
      expirationButtons: JSON.parse(settingsMap.expiration_buttons || '[1,3,7,14,30]'),
      sessionDurationDays: parseInt(settingsMap.session_duration_days || '7'),
      adminLogin: settingsMap.admin_login || '',
      adminPassword: settingsMap.admin_password || '',
      adminSecretPath: settingsMap.admin_secret_path || '',
      logo: settingsMap.logo || '',
      logoType: (settingsMap.logo_type as 'none' | 'file' | 'url') || 'none',
    };
  }

  /**
   * Обновить настройку
   */
  async updateSetting(key: string, value: string): Promise<void> {
    await this.pool.query(
      `INSERT INTO admin_settings (key, value)
       VALUES ($1, $2)
       ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
      [key, value]
    );
  }

  /**
   * Обновить все настройки
   */
  async updateAllSettings(settings: Partial<AdminSettings>): Promise<void> {
    const updates: Array<[string, string]> = [];

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
    if (settings.adminSecretPath !== undefined) {
      updates.push(['admin_secret_path', settings.adminSecretPath]);
    }
    if (settings.logo !== undefined) {
      updates.push(['logo', settings.logo]);
    }
    if (settings.logoType !== undefined) {
      updates.push(['logo_type', settings.logoType]);
    }

    for (const [key, value] of updates) {
      await this.updateSetting(key, value);
    }
  }

  /**
   * Сбросить все настройки к значениям по умолчанию
   */
  async resetToDefaults(): Promise<void> {
    const defaults: Array<[string, string]> = [
      ['max_file_size', '104857600'],
      ['min_expiration_days', '1'],
      ['max_expiration_days', '30'],
      ['default_expiration_days', '7'],
      ['expiration_buttons', '[1,3,7,14,30]'],
      ['session_duration_days', '7'],
      ['admin_login', ''],
      ['admin_password', ''],
      ['admin_secret_path', ''],
      ['logo', ''],
      ['logo_type', 'none'],
    ];

    for (const [key, value] of defaults) {
      await this.updateSetting(key, value);
    }
  }
}
