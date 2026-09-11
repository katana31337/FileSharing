// ==========================================
// Сервис для работы с настройками админ-панели
// ==========================================

import { AdminSettingsRepository, AdminSettings } from '../repositories/AdminSettingsRepository';

export class AdminSettingsService {
  constructor(private repository: AdminSettingsRepository) {}

  /**
   * Получить все настройки
   */
  async getSettings(): Promise<AdminSettings> {
    return this.repository.getAllSettings();
  }

  /**
   * Обновить настройки
   */
  async updateSettings(settings: Partial<AdminSettings>): Promise<AdminSettings> {
    // Валидация
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
      const currentSettings = await this.repository.getAllSettings();
      const minDays = settings.minExpirationDays ?? currentSettings.minExpirationDays;
      const maxDays = settings.maxExpirationDays ?? currentSettings.maxExpirationDays;

      if (settings.defaultExpirationDays < minDays || settings.defaultExpirationDays > maxDays) {
        throw new Error('Срок хранения по умолчанию должен быть между минимальным и максимальным');
      }
    }

    if (settings.expirationButtons !== undefined) {
      if (settings.expirationButtons.length === 0) {
        throw new Error('Должна быть хотя бы одна кнопка срока хранения');
      }
    }

    if (settings.sessionDurationDays !== undefined) {
      if (settings.sessionDurationDays < 1 || settings.sessionDurationDays > 365) {
        throw new Error('Срок жизни сессии должен быть от 1 до 365 дней');
      }
    }

    // Обновляем настройки
    await this.repository.updateAllSettings(settings);

    // Возвращаем обновлённые настройки
    return this.repository.getAllSettings();
  }

  /**
   * Сбросить все настройки к значениям по умолчанию
   */
  async resetToDefaults(): Promise<AdminSettings> {
    await this.repository.resetToDefaults();
    return this.repository.getAllSettings();
  }

  /**
   * Проверить учётные данные администратора
   */
  async validateCredentials(login: string, password: string): Promise<boolean> {
    const settings = await this.repository.getAllSettings();
    return settings.adminLogin === login && settings.adminPassword === password;
  }

  /**
   * Проверить, настроены ли учётные данные
   */
  async hasCredentials(): Promise<boolean> {
    const settings = await this.repository.getAllSettings();
    return settings.adminLogin !== '' && settings.adminPassword !== '';
  }
}
