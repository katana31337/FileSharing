import { describe, it, expect, beforeEach } from 'vitest';
import { generateShortUrl, generateId } from './shortUrl';

describe('shortUrl utilities', () => {
  describe('generateShortUrl', () => {
    it('should generate URL with default length of 7', () => {
      const url = generateShortUrl();
      expect(url).toHaveLength(7);
    });

    it('should generate URL with custom length', () => {
      const url = generateShortUrl(10);
      expect(url).toHaveLength(10);
    });

    it('should generate unique URLs', () => {
      const urls = new Set();
      for (let i = 0; i < 100; i++) {
        urls.add(generateShortUrl());
      }
      expect(urls.size).toBe(100);
    });

    it('should only contain alphanumeric characters', () => {
      const url = generateShortUrl(100);
      expect(url).toMatch(/^[A-Za-z0-9]+$/);
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const ids = new Set();
      for (let i = 0; i < 100; i++) {
        ids.add(generateId());
      }
      expect(ids.size).toBe(100);
    });

    it('should generate UUID format', () => {
      const id = generateId();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    });
  });
});
