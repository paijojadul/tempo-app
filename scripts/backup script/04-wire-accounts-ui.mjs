#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const uiFile = path.join(ROOT, 'src/modules/accounts/ui.tsx');

console.log('Wiring Accounts UI to accounts store...');

if (!fs.existsSync(uiFile)) {
  console.error('❌ accounts/ui.tsx not found');
  process.exit(1);
}

const content = `import { useAccountsStore } from './store'

export function AccountsUI() {
  const count = useAccountsStore((s) => s.count)
  const inc = useAccountsStore((s) => s.inc)
  const reset = useAccountsStore((s) => s.reset)

  return (
    <div>
      <h2>Accounts Module</h2>
      <p>count: {count}</p>
      <button onClick={inc}>+</button>
      <button onClick={reset}>reset</button>
    </div>
  )
}
`;

fs.writeFileSync(uiFile, content);
console.log('✓ accounts/ui.tsx wired');
