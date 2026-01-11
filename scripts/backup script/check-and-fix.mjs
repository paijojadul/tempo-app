#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CheckAndFix {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.srcPath = path.join(projectRoot, 'src');
    this.issues = [];
  }

  async run() {
    console.log('🔍 Checking and Fixing Issues...\n');

    await this.checkCoreTempo();
    await this.checkServiceImports();
    await this.checkExports();

    if (this.issues.length > 0) {
      console.log('\n❌ Issues found:', this.issues.length);
      await this.fixIssues();
    } else {
      console.log('\n✅ No issues found!');
    }

    await this.runBuild();
  }

  async checkCoreTempo() {
    console.log('1. Checking core/tempo...');

    const files = ['client.ts', 'index.ts', 'chains.ts'];

    for (const file of files) {
      const filePath = path.join(this.srcPath, 'core/tempo', file);

      try {
        const content = await fs.readFile(filePath, 'utf-8');

        if (file === 'client.ts') {
          if (!content.includes('export function getTempoClient')) {
            this.issues.push(`Missing getTempoClient export in ${file}`);
          }
        }

        if (file === 'index.ts') {
          if (!content.includes('export { getTempoClient }')) {
            this.issues.push(`Missing getTempoClient re-export in ${file}`);
          }
        }

        console.log(`  ✅ ${file}: OK`);
      } catch (error) {
        this.issues.push(`Missing file: core/tempo/${file}`);
        console.log(`  ❌ ${file}: Missing`);
      }
    }
  }

  async checkServiceImports() {
    console.log('\n2. Checking service imports...');

    const modules = ['accounts', 'transactions'];

    for (const module of modules) {
      const filePath = path.join(this.srcPath, 'modules', module, 'service.ts');

      try {
        const content = await fs.readFile(filePath, 'utf-8');

        if (!content.includes("from '../../core/tempo'")) {
          this.issues.push(`Missing core/tempo import in ${module}/service.ts`);
          console.log(`  ❌ ${module}/service.ts: Missing import`);
        } else if (!content.includes('getTempoClient')) {
          this.issues.push(`getTempoClient not used in ${module}/service.ts`);
          console.log(`  ⚠️  ${module}/service.ts: Import exists but not used`);
        } else {
          console.log(`  ✅ ${module}/service.ts: OK`);
        }
      } catch (error) {
        this.issues.push(`Missing file: modules/${module}/service.ts`);
        console.log(`  ❌ ${module}/service.ts: Missing`);
      }
    }
  }

  async checkExports() {
    console.log('\n3. Checking exports...');

    const indexPath = path.join(this.srcPath, 'core/tempo/index.ts');

    try {
      const content = await fs.readFile(indexPath, 'utf-8');
      const lines = content.split('\n');

      const exports = lines.filter((line) => line.includes('export'));
      console.log(`  Found ${exports.length} exports`);

      if (exports.length < 3) {
        this.issues.push('Insufficient exports in core/tempo/index.ts');
      }
    } catch (error) {
      this.issues.push('Cannot read core/tempo/index.ts');
    }
  }

  async fixIssues() {
    console.log('\n🔧 Fixing issues...');

    for (const issue of this.issues) {
      console.log(`  Fixing: ${issue}`);

      if (issue.includes('Missing getTempoClient')) {
        await this.fixTempoClient();
      } else if (issue.includes('Missing core/tempo import')) {
        const module = issue.split('/')[1];
        await this.fixServiceImport(module);
      }
    }

    console.log('\n✅ Issues fixed!');
  }

  async fixTempoClient() {
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

    // Update index.ts
    const indexPath = path.join(this.srcPath, 'core/tempo/index.ts');
    const indexContent = `export * from './chains';
export * from './client';
export * from './wallet';

// Explicit exports
export { getTempoClient } from './client';
export { TEMPO_TESTNET } from './chains';
export { connectWallet } from './wallet';\n`;

    await fs.writeFile(indexPath, indexContent);
  }

  async fixServiceImport(module) {
    const servicePath = path.join(this.srcPath, 'modules', module, 'service.ts');

    try {
      let content = await fs.readFile(servicePath, 'utf-8');

      // Tambahkan import jika belum ada
      if (!content.includes("from '../../core/tempo'")) {
        content = `import { getTempoClient } from '../../core/tempo';\n\n${content}`;
      }

      await fs.writeFile(servicePath, content);
    } catch (error) {
      console.log(`  Cannot fix ${module}/service.ts: ${error.message}`);
    }
  }

  async runBuild() {
    console.log('\n🚀 Running build...');
    console.log('─'.repeat(40));

    return new Promise((resolve) => {
      const child = spawn('pnpm', ['run', 'build'], {
        stdio: 'inherit',
        shell: true,
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log('\n✅ Build successful!');
        } else {
          console.log(`\n❌ Build failed with code ${code}`);
        }
        resolve();
      });
    });
  }
}

// Run checker
try {
  const checker = new CheckAndFix();
  await checker.run();
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
