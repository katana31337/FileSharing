export interface AdminSettings {
  maxFileSize: number; // в байтах
  minExpirationDays: number;
  maxExpirationDays: number;
  defaultExpirationDays: number;
  expirationButtons: number[]; // Массив значений для кнопок (в днях)
  adminLogin: string;
  adminPassword: string;
  adminSecretPath: string;
  logo: string;
  logoType: 'none' | 'file' | 'url';
}

const SETTINGS_KEY = 'fileshare_admin_settings';

const DEFAULT_SETTINGS: AdminSettings = {
  maxFileSize: 100 * 1024 * 1024, // 100 MB
  minExpirationDays: 1,
  maxExpirationDays: 30,
  defaultExpirationDays: 7,
  expirationButtons: [1, 3, 7, 14, 30], // Значения кнопок по умолчанию
  adminLogin: '',
  adminPassword: '',
  adminSecretPath: '',
  logo: '',
  logoType: 'none',
};

export function getAdminSettings(): AdminSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (error) {
    console.error('Error loading admin settings:', error);
  }
  return DEFAULT_SETTINGS;
}

export function saveAdminSettings(settings: Partial<AdminSettings>): void {
  try {
    const current = getAdminSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error saving admin settings:', error);
  }
}

export function resetAdminSettings(): void {
  localStorage.removeItem(SETTINGS_KEY);
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
