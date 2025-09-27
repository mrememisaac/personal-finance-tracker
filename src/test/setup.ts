import '@testing-library/jest-dom';

// Mock crypto.randomUUID for tests
if (!globalThis.crypto) {
  globalThis.crypto = {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
  } as any;
}