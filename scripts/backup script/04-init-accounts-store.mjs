#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const storeFile = path.join(ROOT, 'src/modules/accounts/store.ts');

console.log('Initializing accounts module store...');

// pastikan folder ada
fs.mkdirSync(path.dirname(storeFile), { recursive: true });

if (fs.existsSync(storeFile) && fs.readFileSync(storeFile, 'utf-8').trim() !== 'export {}') {
  console.log('• accounts/store.ts already initialized, skipped');
  process.exit(0);
}

const content = `import { create } from 'zustand'

type AccountsState = {
  count: number
  inc: () => void
  reset: () => void
}

export const useAccountsStore = create<AccountsState>((set) => ({
  count: 0,
  inc: () => set((s) => ({ count: s.count + 1 })),
  reset: () => set({ count: 0 }),
}))
`;

fs.writeFileSync(storeFile, content);
console.log('✓ accounts/store.ts created');
