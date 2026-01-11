#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class TempoClientFixer {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.srcPath = path.join(projectRoot, 'src');
    this.fixesApplied = [];
  }

  async run() {
    console.log('🔧 Fixing getTempoClient Issues...\n');

    await this.checkCoreTempoClient();
    await this.fixAccountsService();
    await this.fixTransactionsService();
    await this.fixTestImport();
    await this.generateReport();
  }

  async checkCoreTempoClient() {
    console.log('1. Checking core/tempo/client.ts...');
    const clientPath = path.join(this.srcPath, 'core/tempo/client.ts');

    try {
      const content = await fs.readFile(clientPath, 'utf-8');

      // Pastikan export function getTempoClient ada
      if (!content.includes('export function getTempoClient')) {
        console.log('  ❌ getTempoClient function not found in client.ts');
        console.log('  Creating proper implementation...');

        const properContent = `import { createPublicClient, http, type PublicClient } from 'viem';
import { TEMPO_TESTNET } from './chains';

let client: PublicClient | null = null;

export function getTempoClient(): PublicClient {
  if (client) return client;

  client = createPublicClient({
    chain: TEMPO_TESTNET,
    transport: http('https://rpc.testnet.tempo.xyz'),
  });

  return client;
}\n`;

        await fs.writeFile(clientPath, properContent);
        console.log('  ✅ Created proper getTempoClient implementation');
        this.fixesApplied.push('Created getTempoClient in core/tempo/client.ts');
      } else {
        console.log('  ✅ getTempoClient function exists');
      }
    } catch (error) {
      console.log(`  ❌ Cannot read client.ts: ${error.message}`);
      await this.createTempoClient();
    }
  }

  async createTempoClient() {
    console.log('  Creating tempo client file...');
    const clientPath = path.join(this.srcPath, 'core/tempo/client.ts');

    const content = `import { createPublicClient, http, type PublicClient } from 'viem';
import { TEMPO_TESTNET } from './chains';

let client: PublicClient | null = null;

export function getTempoClient(): PublicClient {
  if (client) return client;

  client = createPublicClient({
    chain: TEMPO_TESTNET,
    transport: http('https://rpc.testnet.tempo.xyz'),
  });

  return client;
}\n`;

    await fs.writeFile(clientPath, content);
    console.log('  ✅ Created core/tempo/client.ts');
    this.fixesApplied.push('Created core/tempo/client.ts');
  }

  async fixAccountsService() {
    console.log('2. Fixing accounts/service.ts...');
    const filePath = path.join(this.srcPath, 'modules/accounts/service.ts');

    try {
      let content = await fs.readFile(filePath, 'utf-8');

      // Hapus semua import yang salah
      content = content.replace(/import.*getTempoClient.*\n/g, '');

      // Tambahkan import yang benar
      const importStatement = `import { getTempoClient } from '../../core/tempo';\n`;

      // Cari baris pertama yang bukan import
      const lines = content.split('\n');
      let importEndIndex = 0;

      for (let i = 0; i < lines.length; i++) {
        if (!lines[i].startsWith('import ') && !lines[i].startsWith('//')) {
          importEndIndex = i;
          break;
        }
      }

      lines.splice(importEndIndex, 0, importStatement);
      content = lines.join('\n');

      // Perbaiki pemanggilan getTempoClient
      content = content.replace(/getTempoClient\(\)/g, 'getTempoClient()');

      await fs.writeFile(filePath, content);
      console.log('  ✅ Fixed accounts/service.ts imports');
      this.fixesApplied.push('Fixed getTempoClient import in accounts/service.ts');
    } catch (error) {
      console.log(`  ❌ Cannot fix accounts/service.ts: ${error.message}`);
    }
  }

  async fixTransactionsService() {
    console.log('3. Fixing transactions/service.ts...');
    const filePath = path.join(this.srcPath, 'modules/transactions/service.ts');

    try {
      let content = await fs.readFile(filePath, 'utf-8');

      // Hapus semua import yang salah
      content = content.replace(/import.*getTempoClient.*\n/g, '');

      // Tambahkan import yang benar
      const importStatement = `import { getTempoClient } from '../../core/tempo';\n`;

      // Tambahkan di atas file
      if (!content.includes('import { getTempoClient }')) {
        content = importStatement + content;
      }

      // Perbaiki pemanggilan getTempoClient
      content = content.replace(
        /const _client = getTempoClient\(\);/g,
        'const client = getTempoClient();'
      );

      await fs.writeFile(filePath, content);
      console.log('  ✅ Fixed transactions/service.ts imports');
      this.fixesApplied.push('Fixed getTempoClient import in transactions/service.ts');
    } catch (error) {
      console.log(`  ❌ Cannot fix transactions/service.ts: ${error.message}`);
    }
  }

  async fixTestImport() {
    console.log('4. Fixing test-import.ts...');
    const filePath = path.join(this.srcPath, 'test-import.ts');

    try {
      // Buat file yang lebih sederhana tanpa await di top-level
      const content = `// Test import file
console.log('=== Import Test Results ===');

// Import dengan require untuk menghindari top-level await
import('./core/tempo/client')
  .then(({ getTempoClient }) => {
    console.log('1. getTempoClient:', typeof getTempoClient === 'function' ? '✅ OK' : '❌ FAIL');
  })
  .catch((error: any) => {
    console.log('1. getTempoClient: ❌ FAIL -', error.message);
  });

import('./core/store')
  .then(({ useAppStore }) => {
    console.log('2. useAppStore:', typeof useAppStore === 'function' ? '✅ OK' : '❌ FAIL');
  })
  .catch((error: any) => {
    console.log('2. useAppStore: ❌ FAIL -', error.message);
  });

import('./modules/accounts')
  .then(({ AccountsUI }) => {
    console.log('3. AccountsUI:', typeof AccountsUI === 'function' ? '✅ OK' : '❌ FAIL');
  })
  .catch((error: any) => {
    console.log('3. AccountsUI: ❌ FAIL -', error.message);
  });

// Tambahkan export kosong untuk membuat file menjadi module
export {};\n`;

      await fs.writeFile(filePath, content);
      console.log('  ✅ Fixed test-import.ts');
      this.fixesApplied.push('Fixed test-import.ts with proper imports');
    } catch (error) {
      console.log(`  ❌ Cannot fix test-import.ts: ${error.message}`);
    }
  }

  async generateReport() {
    console.log('\n📋 TEMPO CLIENT FIX REPORT');
    console.log('═'.repeat(80));

    if (this.fixesApplied.length > 0) {
      console.log(`\n✅ Fixes Applied (${this.fixesApplied.length}):`);
      this.fixesApplied.forEach((fix, index) => {
        console.log(`  ${index + 1}. ${fix}`);
      });
    } else {
      console.log('\n🎉 No fixes needed!');
    }

    console.log('\n🔍 Quick Verification:');
    console.log('  Run: npx tsc --noEmit src/modules/accounts/service.ts');
    console.log('  Should show no errors for getTempoClient');

    console.log('\n' + '═'.repeat(80));
  }
}

// Run fixer
try {
  const fixer = new TempoClientFixer();
  await fixer.run();
} catch (error) {
  console.error('❌ Error fixing tempo client:', error.message);
  process.exit(1);
}
