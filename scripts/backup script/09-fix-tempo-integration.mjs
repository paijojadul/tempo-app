// scripts/09-fix-tempo-integration.mjs
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const TEMPO_DIR = path.join(ROOT, 'src/core/tempo');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 created: ${dir}`);
  }
}

function writeFile(filePath, content) {
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✏️  written: ${path.relative(ROOT, filePath)}`);
}

console.log('══════════════════════════════════════');
console.log('🔧 FIXING TEMPO INTEGRATION');
console.log('══════════════════════════════════════\n');

/**
 * 1️⃣ Ensure folder exists
 */
ensureDir(TEMPO_DIR);

/**
 * 2️⃣ chains.ts (safe overwrite)
 */
writeFile(
  path.join(TEMPO_DIR, 'chains.ts'),
  `// src/core/tempo/chains.ts

export const TEMPO_TESTNET = {
  id: 42429,
  name: 'Tempo Testnet',
}
`
);

/**
 * 3️⃣ client.ts (MISSING FILE → ROOT CAUSE)
 */
writeFile(
  path.join(TEMPO_DIR, 'client.ts'),
  `// src/core/tempo/client.ts
import { createPublicClient, http } from 'viem'
import { tempo } from 'tempo.ts/chains'

let client = null

export function getTempoClient() {
  if (client) return client

  client = createPublicClient({
    chain: tempo({
      chainId: 42429,
      feeToken: '0x20c0000000000000000000000000000000000001',
    }),
    transport: http('https://rpc.testnet.tempo.xyz'),
  })

  return client
}
`
);

/**
 * 4️⃣ index.ts (public API)
 */
writeFile(
  path.join(TEMPO_DIR, 'index.ts'),
  `export * from './chains'
export * from './client'
export * from './wallet'
`
);

console.log('\n✅ TEMPO INTEGRATION FIXED');
console.log('➡️ Next: pnpm dev');
console.log('══════════════════════════════════════');
