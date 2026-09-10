// ==========================================
// Интерфейс репозитория настроек админки
// ==========================================

export interface AdminSettings {
  maxFileSize: number;
  minExpirationDays: number;
  maxExpirationDays: number;
  defaultExpirationDays: number;
  adminSecretPath: string;
  logo: string;
  logoType: 'none' | 'file' | 'url';
}

export interface IAdminSettingsRepository {
  getSettings(): Promise<AdminSettings>;
  updateSettings(settings: Partial<AdminSettings>): Promise<AdminSettings>;
  resetSettings(): Promise<AdminSettings>;
}
