// ============================================
// Сервис настроек админ-панели
// ============================================
// Получает и сохраняет настройки через API
// Настройки хранятся в PostgreSQL
// ============================================

const API_BASE_URL = '/api';

export interface AdminSettings {
  maxFileSize: number; // в байтах
  minExpirationDays: number;
  maxExpirationDays: number;
  defaultExpirationDays: number;
  expirationButtons: number[]; // Массив значений для кнопок (в днях)
  sessionDurationDays: number; // Срок жизни сессии в днях
  adminLogin: string;
  adminPassword: string;
  adminSecretPath: string;
  logo: string;
  logoType: 'none' | 'file' | 'url';
}

const DEFAULT_SETTINGS: AdminSettings = {
  maxFileSize: 100 * 1024 * 1024, // 100 MB
  minExpirationDays: 1,
  maxExpirationDays: 30,
  defaultExpirationDays: 7,
  expirationButtons: [1, 3, 7, 14, 30],
  sessionDurationDays: 7,
  adminLogin: '',
  adminPassword: '',
  adminSecretPath: '',
  logo: '',
  logoType: 'none',
};

// Кэш настроек для быстрого доступа
let cachedSettings: AdminSettings | null = null;

/**
 * Получить настройки из API
 */
export async function getAdminSettings(): Promise<AdminSettings> {
  // Если есть кэш, возвращаем его
  if (cachedSettings) {
    return cachedSettings;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/admin/settings`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch admin settings');
    }

    const settings: AdminSettings = await response.json();
    
    // Кэшируем настройки
    cachedSettings = settings;
    
    console.log('%c[AdminService] 📥 Настройки загружены из API:', 'color: blue;', settings);
    
    return settings;
  } catch (error) {
    console.error('Error fetching admin settings:', error);
    // Возвращаем настройки по умолчанию при ошибке
    return DEFAULT_SETTINGS;
  }
}

/**
 * Сохранить настройки через API
 */
export async function saveAdminSettings(settings: Partial<AdminSettings>): Promise<AdminSettings> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/settings`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(settings),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save admin settings');
    }

    const updatedSettings: AdminSettings = await response.json();
    
    // Обновляем кэш
    cachedSettings = updatedSettings;
    
    console.log('%c[AdminService] 💾 Настройки сохранены в API:', 'color: green;', updatedSettings);
    
    return updatedSettings;
  } catch (error) {
    console.error('Error saving admin settings:', error);
    throw error;
  }
}

/**
 * Сбросить настройки к значениям по умолчанию
 */
export async function resetAdminSettings(): Promise<AdminSettings> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/settings/reset`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to reset admin settings');
    }

    const settings: AdminSettings = await response.json();
    
    // Обновляем кэш
    cachedSettings = settings;
    
    console.log('%c[AdminService] 🔄 Настройки сброшены:', 'color: orange;', settings);
    
    return settings;
  } catch (error) {
    console.error('Error resetting admin settings:', error);
    throw error;
  }
}

/**
 * Проверить учётные данные
 */
export async function validateCredentials(login: string, password: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/settings/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ login, password }),
    });

    if (!response.ok) {
      throw new Error('Failed to validate credentials');
    }

    const result = await response.json();
    return result.valid;
  } catch (error) {
    console.error('Error validating credentials:', error);
    return false;
  }
}

/**
 * Проверить, настроены ли учётные данные
 */
export async function hasCredentials(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/settings/has-credentials`, {
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to check credentials');
    }

    const result = await response.json();
    return result.hasCredentials;
  } catch (error) {
    console.error('Error checking credentials:', error);
    return false;
  }
}

/**
 * Очистить кэш настроек
 */
export function clearSettingsCache(): void {
  cachedSettings = null;
  console.log('%c[AdminService] 🧹 Кэш настроек очищен', 'color: orange;');
}

/**
 * Форматирование размера файла
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Парсинг размера файла
 */
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
