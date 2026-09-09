import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

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
