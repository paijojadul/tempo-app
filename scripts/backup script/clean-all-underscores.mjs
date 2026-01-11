#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function cleanAllUnderscores() {
  console.log('🧹 CLEANING ALL UNDERSCORES FROM PROJECT\n');
  console.log('═'.repeat(80));

  const projectRoot = process.cwd();
  const filesFixed = [];

  // 1. FIX SOURCE CODE FILES
  console.log('🔧 FIXING SOURCE CODE FILES:');
  await fixSourceCodeFiles(projectRoot, filesFixed);

  // 2. FIX MOCK FILES
  console.log('\n🔧 FIXING MOCK FILES:');
  await fixMockFiles(projectRoot, filesFixed);

  // 3. SUMMARY
  console.log('\n' + '═'.repeat(80));
  console.log(`\n✅ CLEANUP COMPLETE: Fixed ${filesFixed.length} files`);

  if (filesFixed.length > 0) {
    console.log('\n📁 Files fixed:');
    filesFixed.slice(0, 10).forEach((file) => console.log(`  • ${file}`));
    if (filesFixed.length > 10) {
      console.log(`  • ... and ${filesFixed.length - 10} more`);
    }
  }

  console.log('\n🔍 Now test TypeScript:');
  console.log('   npx tsc --noEmit');
}

async function fixSourceCodeFiles(projectRoot, filesFixed) {
  const sourceFiles = [
    // App files
    'src/app/App.tsx',

    // Core files
    'src/core/store/app.store.ts',
    'src/core/tempo/chains.ts',
    'src/core/tempo/client.ts',
    'src/core/tempo/index.ts',
    'src/core/tempo/wallet.ts',

    // Modules
    'src/modules/accounts/service.ts',
    'src/modules/accounts/store.ts',
    'src/modules/accounts/ui.tsx',
    'src/modules/accounts/index.ts',

    'src/modules/transactions/service.ts',
    'src/modules/transactions/store.ts',
    'src/modules/transactions/ui.tsx',
    'src/modules/transactions/index.ts',

    'src/modules/exchange/service.ts',
    'src/modules/exchange/store.ts',
    'src/modules/exchange/ui.tsx',
    'src/modules/exchange/index.ts',

    'src/modules/issuance/service.ts',
    'src/modules/issuance/store.ts',
    'src/modules/issuance/ui.tsx',
    'src/modules/issuance/index.ts',

    'src/modules/payments/service.ts',
    'src/modules/payments/store.ts',
    'src/modules/payments/ui.tsx',
    'src/modules/payments/index.ts',

    // Shared
    'src/shared/ui/Button.tsx',
    'src/shared/ui/components/Card.tsx',
    'src/shared/utils.ts',

    // Test files
    'src/test-import.ts',
  ];

  for (const file of sourceFiles) {
    const filePath = path.join(projectRoot, file);

    try {
      await fs.access(filePath);
      let content = await fs.readFile(filePath, 'utf-8');
      const originalContent = content;

      // REMOVE ALL DOUBLE UNDERSCORES (__)
      content = content.replace(/__(\w+)/g, '$1');

      // REMOVE SINGLE UNDERSCORE from exports and declarations
      const lines = content.split('\n');
      let modified = false;

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];

        // Fix export statements
        if (line.includes('export') && line.includes('_')) {
          line = line.replace(
            /export (const|function|class|type|interface|let|var) _(\w+)/g,
            'export $1 $2'
          );
          line = line.replace(/export \{ _(\w+)/g, 'export { $1');
          line = line.replace(/_(\w+), /g, '$1, ');
          line = line.replace(/, _(\w+)/g, ', $1');
          line = line.replace(/_(\w+) \}/g, '$1 }');
        }

        // Fix variable declarations (but keep if it's intentionally unused)
        if (!line.trim().startsWith('//') && !line.includes('// _')) {
          line = line.replace(/(const|let|var|function|class) _(\w+)(?=\s*[=:(;])/g, '$1 $2');
        }

        // Fix imports referencing underscored names
        line = line.replace(/import.*\{.*_(\w+).*\}/g, (match) => {
          return match.replace(/_(\w+)/g, '$1');
        });

        if (line !== lines[i]) {
          lines[i] = line;
          modified = true;
        }
      }

      if (modified) {
        content = lines.join('\n');
      }

      if (content !== originalContent) {
        await fs.writeFile(filePath, content);
        console.log(`  ✅ ${file}`);
        filesFixed.push(file);
      }
    } catch (error) {
      // File doesn't exist, skip
    }
  }
}

async function fixMockFiles(projectRoot, filesFixed) {
  const mockDir = path.join(projectRoot, 'src/core/tempo/mocks');

  try {
    await fs.access(mockDir);

    // Recreate clean mock files
    const mockFiles = {
      'tempo-chains.ts': `// Clean tempo chains mock
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
export const getChainConfig = () => tempoModerato;\n`,

      'wagmi.ts': `// Clean wagmi mock
export const createConfig = () => ({});
export const http = () => ({});
export const createPublicClient = () => ({});
export const createWalletClient = () => ({});
export const custom = () => ({});

// Simple hooks for TypeScript
export const useAccount = () => ({ address: undefined, isConnected: false });
export const useConnect = () => ({ connect: async () => {} });
export const useDisconnect = () => ({ disconnect: async () => {} });\n`,

      'viem.ts': `// Clean viem mock
export const http = () => ({});
export const createPublicClient = () => ({});
export const createWalletClient = () => ({});
export const custom = () => ({});
export const parseEther = () => BigInt(0);
export const formatEther = () => '0';\n`,

      'connectors.ts': `// Clean connectors mock
export const injected = () => ({ id: 'injected', name: 'Injected' });
export const walletConnect = () => ({ id: 'walletConnect', name: 'WalletConnect' });\n`,

      'index.ts': `// Clean index - NO duplicate exports
export { tempoModerato, TEMPO_TESTNET, getChainConfig } from './tempo-chains';
export { createConfig, http, createPublicClient, createWalletClient, custom, useAccount, useConnect, useDisconnect } from './wagmi';
export { http as viemHttp, createPublicClient as viemCreatePublicClient, createWalletClient as viemCreateWalletClient, custom as viemCustom, parseEther, formatEther } from './viem';
export { injected, walletConnect } from './connectors';\n`,
    };

    for (const [fileName, content] of Object.entries(mockFiles)) {
      const filePath = path.join(mockDir, fileName);
      await fs.writeFile(filePath, content);
      console.log(`  ✅ mocks/${fileName}`);
      filesFixed.push(`src/core/tempo/mocks/${fileName}`);
    }
  } catch (error) {
    console.log(`  ⚠️  Mock directory not found: ${error.message}`);
  }
}

cleanAllUnderscores().catch(console.error);
