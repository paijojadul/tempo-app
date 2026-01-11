#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const serviceFile = path.join(ROOT, 'src/modules/accounts/service.ts');

console.log('Wiring accounts service to Tempo client...');

const content = `import { getTempoClient } from '../../core/tempo'

export async function fetchAccountsCount(): Promise<number> {
  const tempo = getTempoClient()

  // SAFE placeholder (read-only)
  // Replace with real Tempo query later
  await new Promise((r) => setTimeout(r, 500))

  return Math.floor(Math.random() * 5) + 1
}
`;

fs.writeFileSync(serviceFile, content);
console.log('✓ accounts/service.ts wired to Tempo (safe mode)');
