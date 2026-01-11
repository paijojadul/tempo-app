#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const clientFile = path.join(ROOT, 'src/core/tempo/client.ts');

console.log('Initializing Tempo client (read-only)...');

const content = `import { Tempo } from '@tempoxyz/tempo-ts'
import { TEMPO_TESTNET } from './chains'

let client: Tempo | null = null

export function getTempoClient() {
  if (client) return client

  client = new Tempo({
    chainId: TEMPO_TESTNET.id,
  })

  return client
}
`;

fs.writeFileSync(clientFile, content);
console.log('✓ core/tempo/client.ts updated');
