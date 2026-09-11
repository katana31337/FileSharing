import { describe, it, expect, beforeEach } from 'vitest';
import { 
  getAdminSettings, 
  saveAdminSettings, 
  resetAdminSettings,
  formatFileSize,
  parseFileSize,
  type AdminSettings 
} from './adminService';

describe('adminService', () => {
  beforeEach(() => {
    resetAdminSettings();
  });

  describe('getAdminSettings', () => {
    it('should return default settings when no settings saved', () => {
      const settings = getAdminSettings();
      expect(settings.maxFileSize).toBe(100 * 1024 * 1024); // 100 MB
      expect(settings.minExpirationDays).toBe(1);
      expect(settings.maxExpirationDays).toBe(30);
      expect(settings.defaultExpirationDays).toBe(7);
      expect(settings.expirationButtons).toEqual([1, 3, 7, 14, 30]);
    });

    it('should return saved settings', () => {
      const customSettings: Partial<AdminSettings> = {
        maxFileSize: 500 * 1024 * 1024, // 500 MB
        expirationButtons: [1, 5, 10],
      };
      saveAdminSettings(customSettings);
      
      const settings = getAdminSettings();
      expect(settings.maxFileSize).toBe(500 * 1024 * 1024);
      expect(settings.expirationButtons).toEqual([1, 5, 10]);
    });
  });

  describe('saveAdminSettings', () => {
    it('should save settings to localStorage', () => {
      const settings: Partial<AdminSettings> = {
        maxFileSize: 1000 * 1024 * 1024, // 1000 MB
        expirationButtons: [1, 2, 3, 4, 5],
      };
      
      saveAdminSettings(settings);
      
      const saved = localStorage.getItem('fileshare_admin_settings');
      expect(saved).toBeTruthy();
      
      const parsed = JSON.parse(saved!);
      expect(parsed.maxFileSize).toBe(1000 * 1024 * 1024);
      expect(parsed.expirationButtons).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes correctly', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(500)).toBe('500 B');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });

    it('should format large sizes correctly', () => {
      expect(formatFileSize(100 * 1024 * 1024)).toBe('100 MB');
      expect(formatFileSize(500 * 1024 * 1024)).toBe('500 MB');
      expect(formatFileSize(1000 * 1024 * 1024)).toBe('1000 MB');
    });
  });

  describe('parseFileSize', () => {
    it('should parse file size strings correctly', () => {
      expect(parseFileSize('100MB')).toBe(100 * 1024 * 1024);
      expect(parseFileSize('1GB')).toBe(1024 * 1024 * 1024);
      expect(parseFileSize('500KB')).toBe(500 * 1024);
      expect(parseFileSize('100 MB')).toBe(100 * 1024 * 1024);
      expect(parseFileSize('1 GB')).toBe(1024 * 1024 * 1024);
    });

    it('should return 0 for invalid input', () => {
      expect(parseFileSize('invalid')).toBe(0);
      expect(parseFileSize('')).toBe(0);
      expect(parseFileSize('100')).toBe(0); // No unit
    });
  });

  describe('expirationButtons', () => {
    it('should save and load expiration buttons', () => {
      const buttons = [1, 3, 7, 10];
      saveAdminSettings({ expirationButtons: buttons });
      
      const settings = getAdminSettings();
      expect(settings.expirationButtons).toEqual(buttons);
    });

    it('should handle custom button values', () => {
      const buttons = [1, 2, 5, 10, 15, 20];
      saveAdminSettings({ expirationButtons: buttons });
      
      const settings = getAdminSettings();
      expect(settings.expirationButtons).toEqual(buttons);
      expect(settings.expirationButtons).toHaveLength(6);
    });
  });
});
