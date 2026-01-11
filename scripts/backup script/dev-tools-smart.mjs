import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';

class SmartDevTools {
  constructor() {
    this.projectRoot = process.cwd();
  }

  async run() {
    console.log('🧠 SMART Dev Tools - Deep Diagnostics\n');

    await this.checkDependencies();
    await this.checkImports();
    await this.checkConfigs();
    await this.checkBuild();

    console.log('\n══════════════════════════════════════════════════════');
    console.log('🎯 RECOMMENDATIONS:');
    await this.showRecommendations();
  }

  async checkDependencies() {
    console.log('📦 DEPENDENCY CHECK:');

    try {
      const pkg = JSON.parse(await fs.readFile('package.json', 'utf-8'));
      const required = ['react', 'typescript', 'vite', 'viem', 'zustand'];

      required.forEach((dep) => {
        const hasDep = pkg.dependencies?.[dep] || pkg.devDependencies?.[dep];
        console.log(`  ${hasDep ? '✅' : '❌'} ${dep}`);
      });
    } catch (error) {
      console.log('  ❌ Cannot read package.json');
    }
  }

  async checkImports() {
    console.log('\n🔗 IMPORT CHECK:');

    try {
      const tsconfig = JSON.parse(await fs.readFile('tsconfig.json', 'utf-8'));
      const hasAlias = tsconfig.compilerOptions?.paths?.['@/*'];
      console.log(`  ${hasAlias ? '✅' : '❌'} Path alias @/* configured`);

      if (!hasAlias) {
        console.log('  💡 Add to tsconfig.json: "paths": { "@/*": ["./src/*"] }');
      }
    } catch {
      console.log('  ❌ Cannot check tsconfig.json');
    }
  }

  async checkConfigs() {
    console.log('\n⚙️  CONFIG CHECK:');

    const configs = [
      { file: 'tsconfig.json', required: true },
      { file: 'vite.config.ts', required: true },
      { file: 'eslint.config.js', required: false },
      { file: '.prettierrc', required: false },
    ];

    for (const config of configs) {
      try {
        await fs.access(config.file);
        console.log(`  ✅ ${config.file} exists`);
      } catch {
        console.log(
          `  ${config.required ? '❌' : '⚠️ '} ${config.file} ${config.required ? 'MISSING' : 'not found'}`
        );
      }
    }
  }

  async checkBuild() {
    console.log('\n🏗️  BUILD CHECK:');

    try {
      await this.runCommand(['npx', 'tsc', '--noEmit', '--skipLibCheck']);
      console.log('  ✅ TypeScript compilation OK');
    } catch {
      console.log('  ❌ TypeScript errors found (run: npx tsc --noEmit)');
    }
  }

  async showRecommendations() {
    console.log('\n💡 COMMON ISSUES & FIXES:');
    console.log('\n1. Import errors (@/shared/ui):');
    console.log('   • Cek tsconfig.json → "paths": { "@/*": ["./src/*"] }');
    console.log('   • Atau use relative: import { X } from "../../shared/ui"');

    console.log('\n2. getTempoClient() errors:');
    console.log('   • Install viem: pnpm add viem');
    console.log('   • Import from index.ts: import { getTempoClient } from "../../core/tempo"');

    console.log('\n3. Type errors (PublicClient, etc):');
    console.log('   • Check imports in the file');
    console.log('   • Install type definitions: pnpm add -D @types/node @types/react');

    console.log('\n🔧 QUICK FIXES:');
    console.log('  • pnpm install (reinstall all)');
    console.log('  • node scripts/fix-all-errors.mjs');
    console.log('  • Delete node_modules && pnpm install');
  }

  async runCommand(cmd) {
    return new Promise((resolve, reject) => {
      const child = spawn(cmd[0], cmd.slice(1), { stdio: 'pipe' });
      let output = '';

      child.stdout.on('data', (data) => (output += data));
      child.stderr.on('data', (data) => (output += data));

      child.on('close', (code) => {
        if (code === 0) resolve(output);
        else reject(new Error(`Command failed: ${output}`));
      });
    });
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tools = new SmartDevTools();
  await tools.run();
}

export default SmartDevTools;
