// Vitest global setup for DOM polyfills and mocks

// Polyfill URL.createObjectURL used in tests
if (typeof (globalThis as any).URL === 'undefined') {
  (globalThis as any).URL = {};
}
if (typeof (globalThis as any).URL.createObjectURL === 'undefined') {
  (globalThis as any).URL.createObjectURL = () => 'blob:fake-url';
}

// Mock localStorage if not present (some test environments stub it)
const globalAny: any = globalThis;
if (!globalAny.localStorage) {
  let store: Record<string, string> = {};
  globalAny.localStorage = {
    getItem(key: string) { return store[key] ?? null; },
    setItem(key: string, value: string) { store[key] = String(value); },
    removeItem(key: string) { delete store[key]; },
    clear() { store = {}; }
  };
}

// Basic console polyfills for tests that expect them
if (!globalAny.crypto) {
  globalAny.crypto = { getRandomValues: (arr: Uint8Array) => arr.fill(42) };
}
