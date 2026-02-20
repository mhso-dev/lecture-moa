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

// Properly mock localStorage for zustand persist middleware
// Zustand's persist middleware checks for storage availability at module load time
// We need to mock it before any zustand store modules are imported

const localStorageStore: Record<string, string> = {};

const localStorageMock = {
  getItem: vi.fn((key: string) => localStorageStore[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageStore[key] = String(value);
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageStore[key];
  }),
  clear: vi.fn(() => {
    Object.keys(localStorageStore).forEach(key => delete localStorageStore[key]);
  }),
  get length() {
    return Object.keys(localStorageStore).length;
  },
  key: vi.fn((index: number) => Object.keys(localStorageStore)[index] ?? null),
};

// Set on global before any modules are loaded
(global as any).localStorage = localStorageMock;
Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
  enumerable: true,
});

// Mock ResizeObserver for Radix UI components
class ResizeObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

global.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;

// Mock pointer capture for Radix UI
Element.prototype.hasPointerCapture = vi.fn();
Element.prototype.setPointerCapture = vi.fn();
Element.prototype.releasePointerCapture = vi.fn();

// Mock scrollTo
Element.prototype.scrollIntoView = vi.fn();
window.scrollTo = vi.fn();
