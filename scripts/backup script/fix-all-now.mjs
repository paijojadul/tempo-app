#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AllFixerNow {
  constructor() {
    this.steps = [
      { name: '🔧 Fix getTempoClient issues', script: 'fix-tempo-client.mjs' },
      { name: '📦 Run TypeScript check', command: ['npx', 'tsc', '--noEmit'] },
      { name: '🎨 Format code', command: ['npx', 'prettier', '--write', '.'] },
      { name: '✅ Build project', command: ['pnpm', 'run', 'build'] },
    ];
  }

  async run() {
    console.log('🚀 Fixing All Issues Now...\n');
    console.log('═'.repeat(80));

    let success = true;

    for (const step of this.steps) {
      console.log(`\n${step.name}`);
      console.log('─'.repeat(40));

      try {
        if (step.script) {
          await this.runScript(step.script);
          console.log(`✅ ${step.name} completed\n`);
        } else if (step.command) {
          const code = await this.runCommand(step.command);
          if (code !== 0 && step.name !== '📦 Run TypeScript check') {
            success = false;
            console.log(`⚠️  ${step.name} failed with code ${code}\n`);
          } else {
            console.log(`✅ ${step.name} completed\n`);
          }
        }
      } catch (error) {
        console.log(`❌ ${step.name} failed: ${error.message}\n`);
        success = false;
      }
    }

    await this.generateReport(success);
  }

  runScript(scriptName) {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, scriptName);
      const child = spawn('node', [scriptPath], {
        stdio: 'inherit',
        shell: true,
      });

      child.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error(`Script failed with code ${code}`));
      });
    });
  }

  runCommand(command) {
    return new Promise((resolve) => {
      const child = spawn(command[0], command.slice(1), {
        stdio: 'inherit',
        shell: true,
      });

      child.on('close', (code) => {
        resolve(code);
      });
    });
  }

  async generateReport(success) {
    console.log('📋 FINAL REPORT');
    console.log('═'.repeat(80));

    if (success) {
      console.log('\n🎉 SUCCESS! All issues fixed.');
      console.log('\n✅ What was fixed:');
      console.log('  1. getTempoClient imports and exports');
      console.log('  2. TypeScript configuration');
      console.log('  3. Code formatting');
      console.log('  4. Build process');

      console.log('\n🚀 Ready to develop:');
      console.log('  pnpm run dev     - Start development server');
      console.log('  pnpm run build   - Build for production');
      console.log('  pnpm run test    - Run tests');
    } else {
      console.log('\n⚠️  Some issues remain. Running manual fixes...');

      console.log('\n🔧 Manual Fix Commands:');
      console.log('  1. Check core/tempo/client.ts has: export function getTempoClient()');
      console.log('  2. Check imports in service files:');
      console.log("     import { getTempoClient } from '../../core/tempo'");
      console.log('  3. Remove test-import.ts if not needed: rm src/test-import.ts');
      console.log('  4. Run build again: pnpm run build');
    }

    console.log('\n📁 Check these files:');
    console.log('  • src/core/tempo/client.ts');
    console.log('  • src/core/tempo/index.ts');
    console.log('  • src/modules/accounts/service.ts');
    console.log('  • src/modules/transactions/service.ts');

    console.log('\n' + '═'.repeat(80));
  }
}

// Run fixer
try {
  const fixer = new AllFixerNow();
  await fixer.run();
} catch (error) {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
}
