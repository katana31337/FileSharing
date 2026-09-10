import '@testing-library/jest-dom/vitest';
import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Mock alert and confirm for happy-dom
const mockAlert = vi.fn();
const mockConfirm = vi.fn(() => true);

global.alert = mockAlert;
global.confirm = mockConfirm;

// Also mock window.alert for consistency
if (typeof window !== 'undefined') {
  window.alert = mockAlert;
  window.confirm = mockConfirm;
}

// Cleanup after each test to prevent memory leaks and unhandled errors
afterEach(() => {
  cleanup();
});

// Mock requestAnimationFrame for framer-motion
if (typeof window !== 'undefined') {
  window.requestAnimationFrame = (callback) => {
    return setTimeout(callback, 0) as unknown as number;
  };
  
  window.cancelAnimationFrame = (id) => {
    clearTimeout(id);
  };
}
