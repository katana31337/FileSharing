// ==========================================
// Сервис настроек админки
// ==========================================

import { IAdminSettingsRepository, AdminSettings } from '../repositories/AdminSettingsRepository.js';

export class AdminSettingsService {
  constructor(private repository: IAdminSettingsRepository) {}

  async getSettings(): Promise<AdminSettings> {
    return this.repository.getSettings();
  }

  async updateSettings(settings: Partial<AdminSettings>): Promise<AdminSettings> {
    // Валидация значений
    if (settings.maxFileSize !== undefined && settings.maxFileSize < 1024) {
      throw new Error('Максимальный размер файла должен быть не менее 1 KB');
    }

    if (settings.minExpirationDays !== undefined && settings.minExpirationDays < 1) {
      throw new Error('Минимальный срок хранения должен быть не менее 1 дня');
    }

    if (settings.maxExpirationDays !== undefined && settings.maxExpirationDays > 365) {
      throw new Error('Максимальный срок хранения не может превышать 365 дней');
    }

    if (settings.minExpirationDays !== undefined && settings.maxExpirationDays !== undefined) {
      if (settings.minExpirationDays > settings.maxExpirationDays) {
        throw new Error('Минимальный срок хранения не может превышать максимальный');
      }
    }

    if (settings.defaultExpirationDays !== undefined) {
      const currentSettings = await this.repository.getSettings();
      const minDays = settings.minExpirationDays ?? currentSettings.minExpirationDays;
      const maxDays = settings.maxExpirationDays ?? currentSettings.maxExpirationDays;

      if (settings.defaultExpirationDays < minDays || settings.defaultExpirationDays > maxDays) {
        throw new Error('Срок хранения по умолчанию должен быть между минимальным и максимальным');
      }
    }

    return this.repository.updateSettings(settings);
  }

  async resetSettings(): Promise<AdminSettings> {
    return this.repository.resetSettings();
  }
}
