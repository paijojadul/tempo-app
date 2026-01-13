import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

// 1️⃣ Vitest config
const vitestConfig = `import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: {
      reporter: ['text', 'lcov'],
    },
  },
})
`;

fs.writeFileSync(path.join(ROOT, 'vitest.config.ts'), vitestConfig);
console.log('✅ vitest.config.ts dibuat / diperbarui');

// 2️⃣ Setup file
const setupFile = `import '@testing-library/jest-dom';
import { vi, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock global objects
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

console.log('✅ Test setup loaded');
`;

const setupPath = path.join(ROOT, 'src/test/setup.ts');
fs.mkdirSync(path.dirname(setupPath), { recursive: true });
fs.writeFileSync(setupPath, setupFile);
console.log('✅ src/test/setup.ts dibuat / diperbarui');

// 3️⃣ Informasi
console.log('\n🎉 Fix PHASE4 DAY2 selesai. Tes Card sekarang harus jalan:');
console.log('   pnpm run test');
