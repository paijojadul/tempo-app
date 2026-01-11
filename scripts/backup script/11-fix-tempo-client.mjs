import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const FILE = path.join(ROOT, 'src/core/tempo/client.ts');

console.log('══════════════════════════════════════');
console.log('🔧 FIX TEMPO CLIENT (AUDIT RESULT)');
console.log('══════════════════════════════════════\n');

const content = `// src/core/tempo/client.ts
import { createPublicClient, http } from 'viem'
import { TEMPO_TESTNET } from './chains'

let client = null

export function getTempoClient() {
  if (client) return client

  client = createPublicClient({
    chain: {
      id: TEMPO_TESTNET.id,
      name: TEMPO_TESTNET.name,
      nativeCurrency: {
        name: 'Tempo',
        symbol: 'TEMPO',
        decimals: 18,
      },
      rpcUrls: {
        default: {
          http: ['https://rpc.testnet.tempo.xyz'],
        },
      },
    },
    transport: http(),
  })

  return client
}
`;

fs.writeFileSync(FILE, content, 'utf8');

console.log('✔ fixed:', path.relative(ROOT, FILE));
console.log('\n✅ tempo.ts dependency REMOVED from frontend');
console.log('══════════════════════════════════════');
