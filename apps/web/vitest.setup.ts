/**
 * Vitest Setup File
 * Configures test environment before running tests
 */

import { vi } from 'vitest';
import '@testing-library/jest-dom/vitest';

// Set required environment variables before any imports
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:3001/api/v1';
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-testing';
process.env.NEXTAUTH_URL = 'http://localhost:3000';
process.env.SKIP_ENV_VALIDATION = 'true';

// Properly mock localStorage for zustand persist middleware
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    get length() {
      return Object.keys(store).length;
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
  };
})();

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// Also define on window for zustand's createJSONStorage
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// Mock ResizeObserver for Radix UI components
// Use plain function constructor to avoid Vite SSR transform issues
// with class syntax and vi.fn() which get converted to arrow functions
function ResizeObserverMock(this: Record<string, unknown>) {
  this.observe = vi.fn();
  this.unobserve = vi.fn();
  this.disconnect = vi.fn();
}
global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

// Mock pointer capture for Radix UI
Element.prototype.hasPointerCapture = vi.fn();
Element.prototype.setPointerCapture = vi.fn();
Element.prototype.releasePointerCapture = vi.fn();

// Mock scrollTo
Element.prototype.scrollIntoView = vi.fn();
window.scrollTo = vi.fn();
