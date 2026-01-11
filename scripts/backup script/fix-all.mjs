#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class AllFixer {
  constructor() {
    this.scripts = [
      { name: '🔧 Fix Structure', script: 'fix-structure.mjs' },
      { name: '🔍 Fix Audit Issues', script: 'fix-audit-issues.mjs' },
      { name: '📦 Check Cross-Module', script: 'check-cross-module-imports.mjs' },
    ];
  }

  async run() {
    console.log('🚀 Running Complete Fix Suite...\n');
    console.log('═'.repeat(80));

    for (const { name, script } of this.scripts) {
      console.log(`\n${name}`);
      console.log('─'.repeat(40));

      await this.runScript(script);
    }

    console.log('\n' + '═'.repeat(80));
    console.log('\n✅ All fixes completed!');
    console.log('\n📋 Final Steps:');
    console.log('1. Run: node scripts/audit.mjs (to verify)');
    console.log('2. Run: node scripts/validate-deps.mjs (dependency check)');
    console.log('3. Review TODO comments in fixed files');
    console.log('4. Implement shared logic in core/ or shared/');
  }

  runScript(scriptName) {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, scriptName);
      const child = spawn('node', [scriptPath], {
        stdio: 'inherit',
        shell: true,
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Script ${scriptName} failed with code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }
}

// Run all fixes
try {
  const fixer = new AllFixer();
  await fixer.run();
} catch (error) {
  console.error('\n❌ Error running fixes:', error.message);
  console.log('\n💡 Try running scripts individually:');
  console.log('  1. node scripts/fix-audit-issues.mjs');
  console.log('  2. node scripts/fix-structure.mjs');
  console.log('  3. node scripts/check-cross-module-imports.mjs');
  process.exit(1);
}
