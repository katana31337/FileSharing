export interface AdminSettings {
  maxFileSize: number; // в байтах
  minExpirationDays: number;
  maxExpirationDays: number;
  defaultExpirationDays: number;
  adminPassword: string;
  logo: string; // Data URL (base64) или URL логотипа
  logoType: 'none' | 'file' | 'url'; // Тип источника логотипа
}

const SETTINGS_KEY = 'fileshare_admin_settings';

const DEFAULT_SETTINGS: AdminSettings = {
  maxFileSize: 100 * 1024 * 1024, // 100 MB
  minExpirationDays: 1,
  maxExpirationDays: 30,
  defaultExpirationDays: 7,
  adminPassword: 'admin123', // Временный пароль, нужно изменить!
  logo: '',
  logoType: 'none',
};

export function getAdminSettings(): AdminSettings {
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

export function saveAdminSettings(settings: AdminSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving admin settings:', error);
  }
}

export function resetAdminSettings(): void {
  localStorage.removeItem(SETTINGS_KEY);
}

export function validateAdminPassword(password: string): boolean {
  const settings = getAdminSettings();
  return password === settings.adminPassword;
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
