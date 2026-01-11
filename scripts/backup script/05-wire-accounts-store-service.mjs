#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const storeFile = path.join(ROOT, 'src/modules/accounts/store.ts');

console.log('Wiring accounts store to service...');

if (!fs.existsSync(storeFile)) {
  console.error('❌ accounts/store.ts not found');
  process.exit(1);
}

const content = `import { create } from 'zustand'
import { fetchAccountsCount } from './service'

type AccountsState = {
  count: number
  loading: boolean
  load: () => Promise<void>
  reset: () => void
}

export const useAccountsStore = create<AccountsState>((set) => ({
  count: 0,
  loading: false,

  load: async () => {
    set({ loading: true })
    const value = await fetchAccountsCount()
    set({ count: value, loading: false })
  },

  reset: () => set({ count: 0 }),
}))
`;

fs.writeFileSync(storeFile, content);
console.log('✓ accounts/store.ts updated');
