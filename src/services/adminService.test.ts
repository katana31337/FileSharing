import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  getAdminSettings, 
  saveAdminSettings, 
  resetAdminSettings,
  validateAdminCredentials,
  formatFileSize,
  parseFileSize 
} from './adminService';

describe('adminService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getAdminSettings', () => {
    it('should return default settings when no settings saved', () => {
      const settings = getAdminSettings();
      expect(settings.maxFileSize).toBe(100 * 1024 * 1024);
      expect(settings.minExpirationDays).toBe(1);
      expect(settings.maxExpirationDays).toBe(30);
      expect(settings.defaultExpirationDays).toBe(7);
    });

    it('should return saved settings', () => {
      const customSettings = {
        maxFileSize: 50 * 1024 * 1024,
        minExpirationDays: 2,
        maxExpirationDays: 14,
        defaultExpirationDays: 5,
        adminLogin: 'testuser',
        adminPassword: 'testpass',
        adminSecretPath: 'secret',
        logo: '',
        logoType: 'none' as const,
      };
      saveAdminSettings(customSettings);
      
      const settings = getAdminSettings();
      expect(settings.maxFileSize).toBe(50 * 1024 * 1024);
      expect(settings.adminLogin).toBe('testuser');
    });
  });

  describe('saveAdminSettings', () => {
    it('should save settings to localStorage', () => {
      const settings = {
        maxFileSize: 200 * 1024 * 1024,
        minExpirationDays: 1,
        maxExpirationDays: 60,
        defaultExpirationDays: 10,
        adminLogin: 'admin',
        adminPassword: 'password',
        adminSecretPath: 'admin',
        logo: '',
        logoType: 'none' as const,
      };
      
      saveAdminSettings(settings);
      
      const saved = localStorage.getItem('fileshare_admin_settings');
      expect(saved).toBeTruthy();
      expect(JSON.parse(saved!)).toEqual(settings);
    });
  });

  describe('resetAdminSettings', () => {
    it('should remove settings from localStorage', () => {
      saveAdminSettings({
        maxFileSize: 100 * 1024 * 1024,
        minExpirationDays: 1,
        maxExpirationDays: 30,
        defaultExpirationDays: 7,
        adminLogin: 'admin',
        adminPassword: 'password',
        adminSecretPath: 'admin',
        logo: '',
        logoType: 'none' as const,
      });
      
      resetAdminSettings();
      
      const saved = localStorage.getItem('fileshare_admin_settings');
      expect(saved).toBeNull();
    });
  });

  describe('validateAdminCredentials', () => {
    it('should validate correct credentials', () => {
      saveAdminSettings({
        maxFileSize: 100 * 1024 * 1024,
        minExpirationDays: 1,
        maxExpirationDays: 30,
        defaultExpirationDays: 7,
        adminLogin: 'testuser',
        adminPassword: 'testpass',
        adminSecretPath: 'secret',
        logo: '',
        logoType: 'none' as const,
      });
      
      expect(validateAdminCredentials('testuser', 'testpass')).toBe(true);
    });

    it('should reject incorrect login', () => {
      saveAdminSettings({
        maxFileSize: 100 * 1024 * 1024,
        minExpirationDays: 1,
        maxExpirationDays: 30,
        defaultExpirationDays: 7,
        adminLogin: 'testuser',
        adminPassword: 'testpass',
        adminSecretPath: 'secret',
        logo: '',
        logoType: 'none' as const,
      });
      
      expect(validateAdminCredentials('wronguser', 'testpass')).toBe(false);
    });

    it('should reject incorrect password', () => {
      saveAdminSettings({
        maxFileSize: 100 * 1024 * 1024,
        minExpirationDays: 1,
        maxExpirationDays: 30,
        defaultExpirationDays: 7,
        adminLogin: 'testuser',
        adminPassword: 'testpass',
        adminSecretPath: 'secret',
        logo: '',
        logoType: 'none' as const,
      });
      
      expect(validateAdminCredentials('testuser', 'wrongpass')).toBe(false);
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
  });

  describe('parseFileSize', () => {
    it('should parse file size strings correctly', () => {
      expect(parseFileSize('100MB')).toBe(100 * 1024 * 1024);
      expect(parseFileSize('1GB')).toBe(1024 * 1024 * 1024);
      expect(parseFileSize('500KB')).toBe(500 * 1024);
      expect(parseFileSize('100 MB')).toBe(100 * 1024 * 1024);
    });

    it('should return 0 for invalid input', () => {
      expect(parseFileSize('invalid')).toBe(0);
      expect(parseFileSize('')).toBe(0);
    });
  });
});
