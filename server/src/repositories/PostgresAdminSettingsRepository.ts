// ==========================================
// PostgreSQL реализация репозитория настроек
// ==========================================

import { Pool } from 'pg';
import { IAdminSettingsRepository, AdminSettings } from './AdminSettingsRepository.js';

export class PostgresAdminSettingsRepository implements IAdminSettingsRepository {
  constructor(private pool: Pool) {}

  async getSettings(): Promise<AdminSettings> {
    const result = await this.pool.query('SELECT key, value FROM admin_settings');
    
    const settings: Record<string, string> = {};
    for (const row of result.rows) {
      settings[row.key] = row.value;
    }

    return {
      maxFileSize: parseInt(settings.max_file_size || '104857600'),
      minExpirationDays: parseInt(settings.min_expiration_days || '1'),
      maxExpirationDays: parseInt(settings.max_expiration_days || '30'),
      defaultExpirationDays: parseInt(settings.default_expiration_days || '7'),
      adminSecretPath: settings.admin_secret_path || 'admin',
      logo: settings.logo || '',
      logoType: (settings.logo_type as 'none' | 'file' | 'url') || 'none',
    };
  }

  async updateSettings(settings: Partial<AdminSettings>): Promise<AdminSettings> {
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
      await this.pool.query(
        `INSERT INTO admin_settings (key, value) 
         VALUES ($1, $2) 
         ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = NOW()`,
        [key, value]
      );
    }

    return this.getSettings();
  }

  async resetSettings(): Promise<AdminSettings> {
    const defaultSettings: Array<[string, string]> = [
      ['max_file_size', '104857600'],
      ['min_expiration_days', '1'],
      ['max_expiration_days', '30'],
      ['default_expiration_days', '7'],
      ['admin_secret_path', 'admin'],
      ['logo', ''],
      ['logo_type', 'none'],
    ];

    for (const [key, value] of defaultSettings) {
      await this.pool.query(
        `UPDATE admin_settings SET value = $1, updated_at = NOW() WHERE key = $2`,
        [value, key]
      );
    }

    return this.getSettings();
  }
}
