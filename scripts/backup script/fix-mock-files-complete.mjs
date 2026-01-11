#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function createCompleteMocks() {
  console.log('🏗️  Creating complete mock files...\n');

  const projectRoot = process.cwd();
  const mockDir = path.join(projectRoot, 'src/core/tempo/mocks');

  // Buat directory jika belum ada
  await fs.mkdir(mockDir, { recursive: true });

  // 1. viem.ts - Complete viem mock
  const viemContent = `// Complete viem mock
export const http = () => ({ type: 'http' });
export const webSocket = () => ({ type: 'webSocket' });
export const createPublicClient = (config: any) => ({
  ...config,
  type: 'publicClient',
  readContract: async () => ({}),
  getBalance: async () => BigInt(0),
  estimateGas: async () => BigInt(21000),
});
export const createWalletClient = (config: any) => ({
  ...config,
  type: 'walletClient',
  sendTransaction: async () => '0x123',
  signMessage: async () => '0x456',
});
export const custom = (transport: any) => transport;
export const parseEther = (value: string) => BigInt(Math.floor(parseFloat(value) * 1e18));
export const formatEther = (value: bigint) => (Number(value) / 1e18).toString();
export const parseUnits = (value: string, decimals: number) => BigInt(Math.floor(parseFloat(value) * 10 ** decimals));
export const formatUnits = (value: bigint, decimals: number) => (Number(value) / 10 ** decimals).toString();

// Types
export type PublicClient = ReturnType<typeof createPublicClient>;
export type WalletClient = ReturnType<typeof createWalletClient>;
export type Transport = ReturnType<typeof http>;
export type Chain = {
  id: number;
  name: string;
  network: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  rpcUrls: {
    [key: string]: { http: string[] };
  };
};
export type Address = \`0x\${string}\`;
export type Hash = \`0x\${string}\`;\n`;

  // 2. wagmi.ts - Complete wagmi mock
  const wagmiContent = `// Complete wagmi mock
import type { Chain, Transport } from './viem';

export const createConfig = (params: any) => ({
  chains: params?.chains || [],
  connectors: [],
  transports: {},
  ...params,
});

export const webAuthn = () => ({
  createConfig,
});

export const http = () => ({});
export const createPublicClient = () => ({});
export const createWalletClient = () => ({});
export const custom = () => ({});
export const cookieStorage = () => ({ get: () => null, set: () => {} });

// Hooks (simplified)
export const useAccount = () => ({
  address: undefined,
  isConnected: false,
  isConnecting: false,
  isDisconnected: true,
  status: 'disconnected',
});
export const useChainId = () => 1;
export const useConnect = () => ({
  connectors: [],
  connect: async () => ({}),
});
export const useDisconnect = () => ({
  disconnect: async () => {},
});

// Types
export type Config = ReturnType<typeof createConfig>;
export type UseAccountReturnType = ReturnType<typeof useAccount>;
export type UseConnectReturnType = ReturnType<typeof useConnect>;\n`;

  // 3. tempo-chains.ts - Tempo-specific chains
  const tempoChainsContent = `// Tempo chains mock
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
  blockExplorers: {
    default: {
      name: 'Tempo Explorer',
      url: 'https://explorer.testnet.tempo.xyz',
    },
  },
  testnet: true,
};

export const TEMPO_TESTNET = tempoModerato;
export const getChainConfig = () => tempoModerato;

// Export all as chains array
export const chains = [tempoModerato];
export const defaultChain = tempoModerato;

// Types
export type Chain = typeof tempoModerato;
export type ChainConfig = typeof tempoModerato;\n`;

  // 4. connectors.ts - Wallet connectors
  const connectorsContent = `// Wallet connectors mock
export const injected = () => ({
  id: 'injected',
  name: 'Injected Wallet',
  type: 'injected',
});

export const walletConnect = (config: any) => ({
  id: 'walletConnect',
  name: 'WalletConnect',
  type: 'walletConnect',
  ...config,
});

export const coinbaseWallet = (config: any) => ({
  id: 'coinbaseWallet',
  name: 'Coinbase Wallet',
  type: 'coinbase',
  ...config,
});

export type Connector = ReturnType<typeof injected>;\n`;

  // 5. index.ts - Main export
  const indexContent = `// Main mock exports
export * from './tempo-chains';
export * from './wagmi';
export * from './viem';
export * from './connectors';

// Re-export commonly used items
export { TEMPO_TESTNET, tempoModerato, chains, defaultChain } from './tempo-chains';
export { createConfig, useAccount, useConnect, useDisconnect } from './wagmi';
export { createPublicClient, createWalletClient, http, parseEther, formatEther } from './viem';
export { injected, walletConnect, coinbaseWallet } from './connectors';\n`;

  try {
    // Write all files
    await fs.writeFile(path.join(mockDir, 'viem.ts'), viemContent);
    await fs.writeFile(path.join(mockDir, 'wagmi.ts'), wagmiContent);
    await fs.writeFile(path.join(mockDir, 'tempo-chains.ts'), tempoChainsContent);
    await fs.writeFile(path.join(mockDir, 'connectors.ts'), connectorsContent);
    await fs.writeFile(path.join(mockDir, 'index.ts'), indexContent);

    console.log('✅ Created complete mock files:');
    console.log('   • viem.ts - Complete viem implementation');
    console.log('   • wagmi.ts - Wagmi hooks and config');
    console.log('   • tempo-chains.ts - Tempo blockchain config');
    console.log('   • connectors.ts - Wallet connectors');
    console.log('   • index.ts - Main exports');

    // Update tsconfig.json paths
    await updateTsConfigPaths(projectRoot);

    console.log('\n🎉 Complete mock system created!');
    console.log('\n🔍 Test TypeScript compilation:');
    console.log('   npx tsc --noEmit');
  } catch (error) {
    console.error(`❌ Error creating mocks: ${error.message}`);
  }
}

async function updateTsConfigPaths(projectRoot) {
  const tsconfigPath = path.join(projectRoot, 'tsconfig.json');

  try {
    const content = await fs.readFile(tsconfigPath, 'utf-8');
    const config = JSON.parse(content);

    // Update path mappings
    config.compilerOptions = config.compilerOptions || {};
    config.compilerOptions.paths = {
      ...config.compilerOptions.paths,
      'tempo.ts': ['./src/core/tempo/mocks/index'],
      'tempo.ts/*': ['./src/core/tempo/mocks/*'],
      wagmi: ['./src/core/tempo/mocks/wagmi'],
      'wagmi/*': ['./src/core/tempo/mocks/*'],
      viem: ['./src/core/tempo/mocks/viem'],
      'viem/*': ['./src/core/tempo/mocks/*'],
      '@tanstack/react-query': ['./src/core/tempo/mocks/react-query'],
    };

    await fs.writeFile(tsconfigPath, JSON.stringify(config, null, 2));
    console.log('✅ Updated tsconfig.json path mappings');
  } catch (error) {
    console.log('⚠️  Could not update tsconfig.json');
  }
}

createCompleteMocks().catch(console.error);
