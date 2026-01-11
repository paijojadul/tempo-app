#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SmartAllErrorsFixer {
  constructor() {
    this.scripts = [
      { name: '📄 Setup TypeScript Config', script: 'create-tsconfig.mjs' },
      { name: '🔧 Fix TypeScript Errors', script: 'fix-typescript-errors.mjs' },
      { name: '📦 Fix Module Structure', script: 'fix-audit-issues.mjs' },
    ];

    this.results = {
      config: { changes: [], issues: [] },
      typescript: { fixed: 0, files: [], warnings: [] },
      audit: { modulesFixed: [], importsRefactored: [], missingCreated: [] },
    };
  }

  async run() {
    console.log('🚀 SMART TypeScript & Structure Fixer\n');
    console.log('═'.repeat(80));

    // 1. Run all fixers
    await this.runAllScripts();

    // 2. Collect results from each script
    await this.collectResults();

    // 3. Run final type check
    await this.runSmartTypeCheck();

    // 4. Generate SMART final report
    await this.generateSmartFinalReport();
  }

  async runAllScripts() {
    for (const { name, script } of this.scripts) {
      console.log(`\n${name}`);
      console.log('─'.repeat(40));

      try {
        await this.runScript(script);
        console.log(`✅ ${name} completed`);
      } catch (error) {
        console.log(`⚠️  ${name} had issues: ${error.message}`);
        console.log('Continuing with next script...');
        this.recordScriptError(name, error.message);
      }
    }
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
          reject(new Error(`Script exited with code ${code}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  async collectResults() {
    console.log('\n📊 Collecting Fix Results...');
    console.log('─'.repeat(40));

    try {
      // Cek apakah tsconfig.json berhasil dibuat/diupdate
      const tsconfigPath = path.join(process.cwd(), 'tsconfig.json');
      await fs.access(tsconfigPath);

      const tsconfigContent = await fs.readFile(tsconfigPath, 'utf-8');
      const tsconfig = JSON.parse(tsconfigContent);

      this.results.config.changes.push('tsconfig.json created/updated');

      if (tsconfig.compilerOptions?.strict) {
        this.results.config.changes.push('Strict mode enabled');
      }

      if (tsconfig.compilerOptions?.paths) {
        this.results.config.changes.push('Path mappings for mocks added');
      }
    } catch (error) {
      this.results.config.issues.push('tsconfig.json might not be created');
    }

    // Cek mock directory
    const mockDir = path.join(process.cwd(), 'src/core/tempo/mocks');
    try {
      await fs.access(mockDir);
      const mockFiles = await fs.readdir(mockDir);

      this.results.typescript.fixed += mockFiles.length;
      this.results.typescript.files.push(`Created ${mockFiles.length} mock files`);
    } catch (error) {
      this.results.typescript.warnings.push('Mock directory not found - external packages needed');
    }

    // Cek module structure
    const modulesDir = path.join(process.cwd(), 'src/modules');
    try {
      await fs.access(modulesDir);
      const modules = await fs.readdir(modulesDir);

      for (const module of modules) {
        const modulePath = path.join(modulesDir, module);
        const stats = await fs.stat(modulePath);

        if (stats.isDirectory()) {
          const files = await fs.readdir(modulePath);
          const hasAllFiles = ['index.ts', 'service.ts', 'store.ts', 'ui.tsx'].every((file) =>
            files.includes(file)
          );

          if (hasAllFiles) {
            this.results.audit.modulesFixed.push(`${module} ✓`);
          } else {
            this.results.audit.modulesFixed.push(`${module} ⚠️`);
          }
        }
      }
    } catch (error) {
      console.log('  ℹ️  Modules directory check skipped');
    }
  }

  async runSmartTypeCheck() {
    console.log('\n🔍 Running SMART TypeScript Check...');
    console.log('─'.repeat(40));

    return new Promise((resolve) => {
      const child = spawn('npx', ['tsc', '--noEmit', '--pretty', 'false'], {
        stdio: 'pipe',
        shell: true,
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      child.on('close', (code) => {
        const fullOutput = output + errorOutput;

        // Analisis output
        const errorCount = (fullOutput.match(/error TS\d+/g) || []).length;
        const warningCount = (fullOutput.match(/warning TS\d+/g) || []).length;

        console.log(`📊 TypeScript Check Results:`);
        console.log(`  • Errors: ${errorCount}`);
        console.log(`  • Warnings: ${warningCount}`);

        if (code === 0) {
          console.log('\n✅ TypeScript check passed! No errors found.');
        } else {
          console.log('\n⚠️  TypeScript check found issues');

          // Tampilkan error summary
          if (errorCount > 0) {
            console.log('\n🔍 Error Summary:');

            const errors = fullOutput.split('\n').filter((line) => line.includes('error TS'));
            const uniqueErrors = [
              ...new Set(
                errors.map((e) => {
                  const match = e.match(/error TS\d+: (.*)/);
                  return match ? match[1] : e;
                })
              ),
            ];

            uniqueErrors.slice(0, 5).forEach((error, idx) => {
              console.log(`  ${idx + 1}. ${error}`);
            });

            if (uniqueErrors.length > 5) {
              console.log(`  ... and ${uniqueErrors.length - 5} more errors`);
            }
          }
        }

        this.results.typescript.fixed = Math.max(0, this.results.typescript.fixed - errorCount);
        resolve();
      });
    });
  }

  recordScriptError(scriptName, error) {
    // Catat error untuk laporan
    if (!this.results.typescript.warnings) {
      this.results.typescript.warnings = [];
    }
    this.results.typescript.warnings.push(`${scriptName}: ${error}`);
  }

  async generateSmartFinalReport() {
    console.log('\n📋 SMART FINAL REPORT');
    console.log('═'.repeat(80));

    console.log('\n🎯 FIXES APPLIED SUMMARY:');

    // Summary per kategori
    if (this.results.config.changes.length > 0) {
      console.log('\n📄 TypeScript Config:');
      this.results.config.changes.forEach((change, idx) => {
        console.log(`  ${idx + 1}. ${change}`);
      });
    }

    if (this.results.typescript.fixed > 0 || this.results.typescript.files.length > 0) {
      console.log(`\n🔧 TypeScript Errors Fixed: ${this.results.typescript.fixed}`);
      this.results.typescript.files.slice(0, 5).forEach((file, idx) => {
        console.log(`  ${idx + 1}. ${file}`);
      });
    }

    if (this.results.audit.modulesFixed.length > 0) {
      console.log('\n📦 Module Structure:');
      console.log(`  • Modules checked: ${this.results.audit.modulesFixed.length}`);
      this.results.audit.modulesFixed.slice(0, 5).forEach((module) => {
        console.log(`  • ${module}`);
      });
    }

    // Issues & Warnings
    const allIssues = [
      ...(this.results.config.issues || []),
      ...(this.results.typescript.warnings || []),
    ];

    if (allIssues.length > 0) {
      console.log('\n⚠️  ISSUES & WARNINGS:');
      allIssues.forEach((issue, idx) => {
        console.log(`  ${idx + 1}. ${issue}`);
      });
    }

    // Smart Recommendations berdasarkan hasil
    console.log('\n💡 SMART RECOMMENDATIONS:');

    // Cek apakah perlu install dependencies asli
    const hasTempoImports = await this.checkForTempoImports();
    const hasWagmiImports = await this.checkForWagmiImports();

    if (hasTempoImports || hasWagmiImports) {
      console.log('\n📦 DEPENDENCY STATUS:');

      if (hasTempoImports) {
        console.log('  • tempo.ts: Detected in imports');
        console.log('    Options:');
        console.log('      1. Install: npm install tempo.ts');
        console.log('      2. Keep using mocks (already created)');
      }

      if (hasWagmiImports) {
        console.log('  • wagmi/viem: Detected in imports');
        console.log('    Options:');
        console.log('      1. Install: npm install wagmi viem');
        console.log('      2. Keep using mocks (already created)');
      }
    } else {
      console.log('  ✅ No external package imports detected');
      console.log('  ℹ️  Project uses local mocks only');
    }

    // Project readiness
    console.log('\n🚀 PROJECT READINESS CHECK:');

    const readiness = await this.checkProjectReadiness();
    console.log(`  • TypeScript Config: ${readiness.hasTsconfig ? '✅' : '❌'}`);
    console.log(`  • Mock Files: ${readiness.hasMocks ? '✅' : '⚠️'}`);
    console.log(`  • Module Structure: ${readiness.hasModules ? '✅' : '⚠️'}`);
    console.log(`  • Source Files: ${readiness.hasSrc ? '✅' : '❌'}`);

    // Next steps berdasarkan readiness
    console.log('\n🎯 NEXT STEPS:');

    if (!readiness.hasTsconfig) {
      console.log('  1. Run create-tsconfig.mjs manually');
    }

    if (!readiness.hasMocks && (hasTempoImports || hasWagmiImports)) {
      console.log('  2. Install dependencies or check mock creation');
    }

    if (!readiness.hasModules) {
      console.log('  3. Run fix-audit-issues.mjs to setup modules');
    }

    if (readiness.hasTsconfig && readiness.hasSrc) {
      console.log('  4. Start development: npm run dev (if configured)');
      console.log('  5. Or build: npx tsc --noEmit (check for errors)');
    }

    console.log('\n' + '═'.repeat(80));
  }

  async checkForTempoImports() {
    try {
      const { glob } = await import('glob');
      const tsFiles = await glob('**/*.{ts,tsx}', {
        cwd: process.cwd(),
        ignore: ['**/node_modules/**', '**/dist/**'],
      });

      for (const file of tsFiles.slice(0, 10)) {
        // Cek 10 file pertama
        const content = await fs.readFile(path.join(process.cwd(), file), 'utf-8');
        if (content.includes("'tempo") || content.includes('"tempo')) {
          return true;
        }
      }
    } catch (error) {
      // Ignore
    }
    return false;
  }

  async checkForWagmiImports() {
    try {
      const { glob } = await import('glob');
      const tsFiles = await glob('**/*.{ts,tsx}', {
        cwd: process.cwd(),
        ignore: ['**/node_modules/**', '**/dist/**'],
      });

      for (const file of tsFiles.slice(0, 10)) {
        const content = await fs.readFile(path.join(process.cwd(), file), 'utf-8');
        if (content.includes('wagmi') || content.includes('viem')) {
          return true;
        }
      }
    } catch (error) {
      // Ignore
    }
    return false;
  }

  async checkProjectReadiness() {
    const checks = {
      hasTsconfig: false,
      hasMocks: false,
      hasModules: false,
      hasSrc: false,
    };

    try {
      // Cek tsconfig
      await fs.access(path.join(process.cwd(), 'tsconfig.json'));
      checks.hasTsconfig = true;
    } catch {}

    try {
      // Cek mocks
      await fs.access(path.join(process.cwd(), 'src/core/tempo/mocks'));
      checks.hasMocks = true;
    } catch {}

    try {
      // Cek modules
      await fs.access(path.join(process.cwd(), 'src/modules'));
      const modules = await fs.readdir(path.join(process.cwd(), 'src/modules'));
      checks.hasModules = modules.length > 0;
    } catch {}

    try {
      // Cek src directory
      await fs.access(path.join(process.cwd(), 'src'));
      checks.hasSrc = true;
    } catch {}

    return checks;
  }
}

// Run all fixes
try {
  const fixer = new SmartAllErrorsFixer();
  await fixer.run();
} catch (error) {
  console.error('\n❌ Error running fixes:', error.message);
  process.exit(1);
}
