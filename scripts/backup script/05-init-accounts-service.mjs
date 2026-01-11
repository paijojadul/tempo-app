#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const serviceFile = path.join(ROOT, 'src/modules/accounts/service.ts');

console.log('Initializing accounts service (dummy async)...');

fs.mkdirSync(path.dirname(serviceFile), { recursive: true });

const content = `export async function fetchAccountsCount(): Promise<number> {
  // dummy async (simulate network)
  await new Promise((r) => setTimeout(r, 500))
  return Math.floor(Math.random() * 10)
}
`;

fs.writeFileSync(serviceFile, content);
console.log('✓ accounts/service.ts created');
