import * as api from './api';
import type { ServerAdminSettings } from './api';

export interface AdminSettings {
  maxFileSize: number; // в байтах
  minExpirationDays: number;
  maxExpirationDays: number;
  defaultExpirationDays: number;
  adminLogin: string;
  adminPassword: string;
  adminSecretPath: string; // Секретный путь для доступа к админке
  logo: string; // Data URL (base64) или URL логотипа
  logoType: 'none' | 'file' | 'url'; // Тип источника логотипа
}

const SETTINGS_KEY = 'fileshare_admin_settings';

// Настройки по умолчанию (используются если не заданы через install.sh)
const DEFAULT_SETTINGS: AdminSettings = {
  maxFileSize: 100 * 1024 * 1024, // 100 MB
  minExpirationDays: 1,
  maxExpirationDays: 30,
  defaultExpirationDays: 7,
  adminLogin: 'admin',
  adminPassword: 'admin123',
  adminSecretPath: 'admin',
  logo: '',
  logoType: 'none',
};

// Флаг для определения, использовать ли API
let useApi = true;

// ============================================
// Получение настроек
// ============================================
// Сначала пробуем получить из API (PostgreSQL)
// Если API недоступен, используем localStorage (fallback)
// ============================================
export async function getAdminSettingsAsync(): Promise<AdminSettings> {
  if (useApi) {
    try {
      const settings = await api.getAdminSettings();
      // Объединяем с локальными настройками (логин/пароль хранятся локально)
      const localSettings = getAdminSettingsLocal();
      return {
        ...settings,
        adminLogin: localSettings.adminLogin,
        adminPassword: localSettings.adminPassword,
      };
    } catch (error) {
      console.log('API недоступен, используем localStorage');
      useApi = false;
    }
  }
  return getAdminSettingsLocal();
}

// Синхронная версия для обратной совместимости
export function getAdminSettings(): AdminSettings {
  return getAdminSettingsLocal();
}

function getAdminSettingsLocal(): AdminSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading admin settings:', error);
  }
  return DEFAULT_SETTINGS;
}

// ============================================
// Сохранение настроек
// ============================================
// Сохраняем в API (PostgreSQL) и локально
// Логин/пароль всегда хранятся локально для безопасности
// ============================================
export async function saveAdminSettingsAsync(settings: AdminSettings): Promise<AdminSettings> {
  // Сохраняем логин/пароль локально (не отправляем на сервер)
  const localSettings = { ...settings };
  saveAdminSettingsLocal(localSettings);
  
  if (useApi) {
    try {
      // Отправляем на сервер только настройки без учётных данных
      const serverSettings: ServerAdminSettings = {
        maxFileSize: settings.maxFileSize,
        minExpirationDays: settings.minExpirationDays,
        maxExpirationDays: settings.maxExpirationDays,
        defaultExpirationDays: settings.defaultExpirationDays,
        adminSecretPath: settings.adminSecretPath,
        logo: settings.logo,
        logoType: settings.logoType,
      };
      const savedSettings = await api.updateAdminSettings(serverSettings);
      return {
        ...savedSettings,
        adminLogin: settings.adminLogin,
        adminPassword: settings.adminPassword,
      };
    } catch (error) {
      console.log('API недоступен, сохраняем только локально');
      useApi = false;
    }
  }
  return settings;
}

// Синхронная версия для обратной совместимости
export function saveAdminSettings(settings: AdminSettings): void {
  saveAdminSettingsLocal(settings);
}

function saveAdminSettingsLocal(settings: AdminSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving admin settings:', error);
  }
}

// ============================================
// Сброс настроек
// ============================================
export async function resetAdminSettingsAsync(): Promise<AdminSettings> {
  if (useApi) {
    try {
      const settings = await api.resetAdminSettings();
      const localSettings = getAdminSettingsLocal();
      return {
        ...settings,
        adminLogin: localSettings.adminLogin,
        adminPassword: localSettings.adminPassword,
      };
    } catch (error) {
      console.log('API недоступен, сбрасываем только локально');
      useApi = false;
    }
  }
  resetAdminSettingsLocal();
  return DEFAULT_SETTINGS;
}

// Синхронная версия для обратной совместимости
export function resetAdminSettings(): void {
  resetAdminSettingsLocal();
}

function resetAdminSettingsLocal(): void {
  localStorage.removeItem(SETTINGS_KEY);
}

export function validateAdminCredentials(login: string, password: string): boolean {
  const settings = getAdminSettings();
  return login === settings.adminLogin && password === settings.adminPassword;
}

export function getAdminSecretPath(): string {
  const settings = getAdminSettings();
  return settings.adminSecretPath;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function parseFileSize(sizeStr: string): number {
  const units: Record<string, number> = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024,
  };

  const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
  if (!match) return 0;

  const value = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  
  return Math.floor(value * (units[unit] || 0));
}
