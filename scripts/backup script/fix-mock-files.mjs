#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixMockFiles() {
  console.log('🔧 Fixing mock files...\n');

  const projectRoot = process.cwd();
  const mockDir = path.join(projectRoot, 'src/core/tempo/mocks');

  // Fix viem.ts
  const viemPath = path.join(mockDir, 'viem.ts');
  const viemContent = `// Mock for viem - PROPER EXPORTS
export const http = () => ({});
export const createPublicClient = () => ({});
export const createWalletClient = () => ({});
export const custom = () => ({});
export const parseEther = (value: string) => BigInt(Math.floor(parseFloat(value) * 1e18));
export const formatEther = (value: bigint) => (Number(value) / 1e18).toString();

// Types
export type PublicClient = ReturnType<typeof createPublicClient>;
export type WalletClient = ReturnType<typeof createWalletClient>;
export type Transport = ReturnType<typeof http>;
export type Chain = any;\n`;

  // Fix wagmi.ts
  const wagmiPath = path.join(mockDir, 'wagmi.ts');
  const wagmiContent = `// Mock for wagmi packages
export const createConfig = (params: any) => ({
  chains: [params.chains || []],
  connectors: [],
  transports: {},
});

export const webAuthn = {
  createConfig,
};

export const http = () => ({});
export const createPublicClient = () => ({});
export const createWalletClient = () => ({});
export const custom = () => ({});

// Types
export type Config = ReturnType<typeof createConfig>;
export type UseAccountReturnType = {
  address?: string;
  isConnected: boolean;
  isConnecting: boolean;
};\n`;

  // Fix tempo-chains.ts
  const tempoChainsPath = path.join(mockDir, 'tempo-chains.ts');
  const tempoChainsContent = `// Mock for tempo.ts/chains
export const tempoModerato = {
  id: 42429,
  name: 'Tempo Testnet',
  network: 'tempo',
  nativeCurrency: {
    decimals: 18,
    name: 'Tempo',
    symbol: 'TEMPO',
  },
  rpcUrls: {
    public: { http: ['https://rpc.testnet.tempo.xyz'] },
    default: { http: ['https://rpc.testnet.tempo.xyz'] },
  },
};

export const TEMPO_TESTNET = tempoModerato;
export const getChainConfig = () => tempoModerato;

// Types
export type Chain = typeof tempoModerato;\n`;

  try {
    // Fix viem.ts
    await fs.writeFile(viemPath, viemContent);
    console.log('✅ Fixed viem.ts');

    // Fix wagmi.ts
    await fs.writeFile(wagmiPath, wagmiContent);
    console.log('✅ Fixed wagmi.ts');

    // Fix tempo-chains.ts
    await fs.writeFile(tempoChainsPath, tempoChainsContent);
    console.log('✅ Fixed tempo-chains.ts');

    // Fix index.ts
    const indexPath = path.join(mockDir, 'index.ts');
    const indexContent = `// Mock index file - clean exports
export * from './tempo-chains';
export * from './wagmi';
export * from './viem';\n`;

    await fs.writeFile(indexPath, indexContent);
    console.log('✅ Fixed index.ts');

    console.log('\n🎉 All mock files fixed!');
    console.log('\n🔍 Now test TypeScript:');
    console.log('   npx tsc --noEmit');
  } catch (error) {
    console.error(`❌ Error fixing mock files: ${error.message}`);
  }
}

fixMockFiles().catch(console.error);
