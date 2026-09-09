import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock alert and confirm for happy-dom
global.alert = vi.fn();
global.confirm = vi.fn(() => true);
