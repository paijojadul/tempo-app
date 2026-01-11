#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const appFile = path.join(ROOT, 'src/app/App.tsx');

console.log('Wiring App to global store...');

if (!fs.existsSync(appFile)) {
  console.error('❌ src/app/App.tsx not found');
  process.exit(1);
}

const content = `import { useAppStore } from '../core/store'
import { AccountsUI } from '../modules/accounts'

export function App() {
  const isReady = useAppStore((s) => s.isReady)

  if (!isReady) {
    return (
      <button onClick={() => useAppStore.getState().setReady()}>
        Init App
      </button>
    )
  }

  return <AccountsUI />
}
`;

fs.writeFileSync(appFile, content);

console.log('✓ App.tsx wired to store');
