import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  getCurrentSession, 
  getSessionHistory, 
  addFileToHistory,
  addTextToHistory,
  removeFileFromHistory,
  removeTextFromHistory,
  clearSessionHistory,
  destroySession,
  getSessionInfo,
  type Session,
  type SessionHistory
} from './sessionService';

// Mock для document.cookie
const mockCookies: Record<string, string> = {};

Object.defineProperty(document, 'cookie', {
  get: () => Object.entries(mockCookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; '),
  set: (cookie: string) => {
    const [nameValue] = cookie.split(';');
    const [name, value] = nameValue.split('=');
    if (value === '' || cookie.includes('expires=Thu, 01 Jan 1970')) {
      delete mockCookies[name];
    } else {
      mockCookies[name] = value;
    }
  },
});

describe('sessionService', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.keys(mockCookies).forEach(key => delete mockCookies[key]);
  });

  describe('getCurrentSession', () => {
    it('should create new session if no cookie exists', () => {
      const session = getCurrentSession();
      
      expect(session).toBeDefined();
      expect(session.id).toMatch(/^sess_/);
      expect(session.createdAt).toBeDefined();
      expect(session.expiresAt).toBeDefined();
      
      // Проверяем, что cookie создан
      expect(document.cookie).toContain('fileshare_session_id=');
    });

    it('should return existing session if cookie exists', () => {
      const session1 = getCurrentSession();
      const session2 = getCurrentSession();
      
      expect(session1.id).toBe(session2.id);
    });

    it('should create new session if existing session expired', () => {
      // Создаём сессию с истёкшим сроком
      const expiredSession: Session = {
        id: 'sess_expired',
        createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      };
      
      localStorage.setItem('session_sess_expired', JSON.stringify(expiredSession));
      mockCookies['fileshare_session_id'] = 'sess_expired';
      
      const session = getCurrentSession();
      
      // Должна создаться новая сессия
      expect(session.id).not.toBe('sess_expired');
    });
  });

  describe('getSessionHistory', () => {
    it('should return empty history for new session', () => {
      getCurrentSession(); // Создаём сессию
      const history = getSessionHistory();
      
      expect(history).toBeDefined();
      expect(history.files).toEqual([]);
      expect(history.texts).toEqual([]);
    });

    it('should return existing history', () => {
      getCurrentSession(); // Создаём сессию
      
      addFileToHistory({
        shortUrl: 'abc123',
        name: 'test.pdf',
        size: 1024,
        expiresAt: new Date().toISOString(),
      });
      
      const history = getSessionHistory();
      
      expect(history.files).toHaveLength(1);
      expect(history.files[0].shortUrl).toBe('abc123');
    });
  });

  describe('addFileToHistory', () => {
    it('should add file to history', () => {
      getCurrentSession(); // Создаём сессию
      
      addFileToHistory({
        shortUrl: 'abc123',
        name: 'document.pdf',
        size: 1048576,
        expiresAt: new Date().toISOString(),
      });
      
      const history = getSessionHistory();
      
      expect(history.files).toHaveLength(1);
      expect(history.files[0].shortUrl).toBe('abc123');
      expect(history.files[0].name).toBe('document.pdf');
      expect(history.files[0].size).toBe(1048576);
      expect(history.files[0].uploadedAt).toBeDefined();
    });

    it('should add multiple files to history', () => {
      getCurrentSession(); // Создаём сессию
      
      addFileToHistory({
        shortUrl: 'abc123',
        name: 'file1.pdf',
        size: 1024,
        expiresAt: new Date().toISOString(),
      });
      
      addFileToHistory({
        shortUrl: 'def456',
        name: 'file2.pdf',
        size: 2048,
        expiresAt: new Date().toISOString(),
      });
      
      const history = getSessionHistory();
      
      expect(history.files).toHaveLength(2);
    });
  });

  describe('addTextToHistory', () => {
    it('should add text to history', () => {
      getCurrentSession(); // Создаём сессию
      
      addTextToHistory({
        shortUrl: 'xyz789',
        title: 'My Code',
        expiresAt: new Date().toISOString(),
      });
      
      const history = getSessionHistory();
      
      expect(history.texts).toHaveLength(1);
      expect(history.texts[0].shortUrl).toBe('xyz789');
      expect(history.texts[0].title).toBe('My Code');
      expect(history.texts[0].uploadedAt).toBeDefined();
    });
  });

  describe('removeFileFromHistory', () => {
    it('should remove file from history', () => {
      getCurrentSession(); // Создаём сессию
      
      addFileToHistory({
        shortUrl: 'abc123',
        name: 'test.pdf',
        size: 1024,
        expiresAt: new Date().toISOString(),
      });
      
      addFileToHistory({
        shortUrl: 'def456',
        name: 'test2.pdf',
        size: 2048,
        expiresAt: new Date().toISOString(),
      });
      
      removeFileFromHistory('abc123');
      
      const history = getSessionHistory();
      
      expect(history.files).toHaveLength(1);
      expect(history.files[0].shortUrl).toBe('def456');
    });
  });

  describe('removeTextFromHistory', () => {
    it('should remove text from history', () => {
      getCurrentSession(); // Создаём сессию
      
      addTextToHistory({
        shortUrl: 'xyz789',
        title: 'Code 1',
        expiresAt: new Date().toISOString(),
      });
      
      addTextToHistory({
        shortUrl: 'uvw321',
        title: 'Code 2',
        expiresAt: new Date().toISOString(),
      });
      
      removeTextFromHistory('xyz789');
      
      const history = getSessionHistory();
      
      expect(history.texts).toHaveLength(1);
      expect(history.texts[0].shortUrl).toBe('uvw321');
    });
  });

  describe('clearSessionHistory', () => {
    it('should clear all history', () => {
      getCurrentSession(); // Создаём сессию
      
      addFileToHistory({
        shortUrl: 'abc123',
        name: 'test.pdf',
        size: 1024,
        expiresAt: new Date().toISOString(),
      });
      
      addTextToHistory({
        shortUrl: 'xyz789',
        title: 'Code',
        expiresAt: new Date().toISOString(),
      });
      
      clearSessionHistory();
      
      const history = getSessionHistory();
      
      expect(history.files).toHaveLength(0);
      expect(history.texts).toHaveLength(0);
    });
  });

  describe('destroySession', () => {
    it('should destroy session and clear data', () => {
      getCurrentSession(); // Создаём сессию
      
      addFileToHistory({
        shortUrl: 'abc123',
        name: 'test.pdf',
        size: 1024,
        expiresAt: new Date().toISOString(),
      });
      
      destroySession();
      
      // Cookie должен быть удалён
      expect(document.cookie).not.toContain('fileshare_session_id=');
      
      // История должна быть очищена
      const history = getSessionHistory();
      expect(history.files).toHaveLength(0);
    });
  });

  describe('getSessionInfo', () => {
    it('should return session info', () => {
      getCurrentSession(); // Создаём сессию
      
      addFileToHistory({
        shortUrl: 'abc123',
        name: 'test.pdf',
        size: 1024,
        expiresAt: new Date().toISOString(),
      });
      
      addTextToHistory({
        shortUrl: 'xyz789',
        title: 'Code',
        expiresAt: new Date().toISOString(),
      });
      
      const info = getSessionInfo();
      
      expect(info.id).toBeDefined();
      expect(info.createdAt).toBeDefined();
      expect(info.expiresAt).toBeDefined();
      expect(info.filesCount).toBe(1);
      expect(info.textsCount).toBe(1);
    });
  });
});
