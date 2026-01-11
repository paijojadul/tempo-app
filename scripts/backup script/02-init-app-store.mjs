#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();

const storeDir = path.join(ROOT, 'src/core/store');
const appStoreFile = path.join(storeDir, 'app.store.ts');
const indexFile = path.join(storeDir, 'index.ts');

console.log('Initializing core app store...');

// pastikan folder ada
fs.mkdirSync(storeDir, { recursive: true });

// app.store.ts
if (!fs.existsSync(appStoreFile)) {
  fs.writeFileSync(
    appStoreFile,
    `import { create } from 'zustand'

type AppState = {
  isReady: boolean
  setReady: () => void
}

export const useAppStore = create<AppState>((set) => ({
  isReady: false,
  setReady: () => set({ isReady: true }),
}))
`
  );
  console.log('✓ created app.store.ts');
} else {
  console.log('• app.store.ts already exists, skipped');
}

// index.ts
if (!fs.existsSync(indexFile)) {
  fs.writeFileSync(
    indexFile,
    `export { useAppStore } from './app.store'
`
  );
  console.log('✓ created index.ts');
} else {
  console.log('• index.ts already exists, skipped');
}

console.log('App store initialized.');
