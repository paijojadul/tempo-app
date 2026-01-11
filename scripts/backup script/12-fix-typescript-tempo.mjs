import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

console.log('══════════════════════════════════════');
console.log('🛠️  TYPESCRIPT FIX: TEMPO CLIENT');
console.log('══════════════════════════════════════\n');

/* -------------------------------------------------- */
/* FIX 1: src/core/tempo/client.ts */
/* -------------------------------------------------- */

const tempoClientFile = path.join(ROOT, 'src/core/tempo/client.ts');

const tempoClientContent = `// src/core/tempo/client.ts
import { createPublicClient, http, type PublicClient } from 'viem'
import { TEMPO_TESTNET } from './chains'

let client: PublicClient | null = null

export function getTempoClient(): PublicClient {
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

fs.writeFileSync(tempoClientFile, tempoClientContent, 'utf8');
console.log('✔ fixed typing:', path.relative(ROOT, tempoClientFile));

/* -------------------------------------------------- */
/* FIX 2: src/modules/accounts/service.ts */
/* -------------------------------------------------- */

const accountsServiceFile = path.join(ROOT, 'src/modules/accounts/service.ts');

let accountsServiceContent = fs.readFileSync(accountsServiceFile, 'utf8');

// hapus assignment variabel yang tidak dipakai
accountsServiceContent = accountsServiceContent.replace(
  /const tempo = getTempoClient\(\)/,
  'getTempoClient()'
);

fs.writeFileSync(accountsServiceFile, accountsServiceContent, 'utf8');
console.log('✔ removed unused variable:', path.relative(ROOT, accountsServiceFile));

console.log('\n✅ TYPESCRIPT ERRORS FIXED');
console.log('══════════════════════════════════════');
