#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ImportAnalyzer {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.srcPath = path.join(projectRoot, 'src');
    this.importMap = new Map();
  }

  async run() {
    console.log('🔍 Analyzing Cross-Module Imports...\n');

    await this.scanAllImports();
    await this.analyzeCrossModuleImports();
    await this.suggestFixes();
  }

  async scanAllImports() {
    const modulesDir = path.join(this.srcPath, 'modules');

    try {
      const modules = await fs.readdir(modulesDir);

      for (const module of modules) {
        const modulePath = path.join(modulesDir, module);
        const stat = await fs.stat(modulePath);

        if (stat.isDirectory()) {
          await this.scanModuleImports(module, modulePath);
        }
      }
    } catch (error) {
      console.log(`❌ Error scanning modules: ${error.message}`);
    }
  }

  async scanModuleImports(moduleName, modulePath) {
    const files = await fs.readdir(modulePath);

    for (const file of files) {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const filePath = path.join(modulePath, file);
        await this.analyzeFileImports(moduleName, file, filePath);
      }
    }
  }

  async analyzeFileImports(moduleName, fileName, filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const importRegex = /import\s+(?:{[^}]+}|\w+)\s+from\s+['"]([^'"]+)['"]/g;
      const matches = [...content.matchAll(importRegex)];

      for (const match of matches) {
        const importPath = match[1];

        // Hanya track import dari module lain
        if (importPath.startsWith('../')) {
          const parts = importPath.split('/');
          const targetModule = parts[1];

          if (
            targetModule &&
            targetModule !== moduleName &&
            targetModule !== 'core' &&
            targetModule !== 'shared'
          ) {
            const key = `${moduleName}/${fileName}`;
            if (!this.importMap.has(key)) {
              this.importMap.set(key, []);
            }

            this.importMap.get(key).push({
              importPath,
              targetModule,
              line: this.getLineNumber(content, match.index),
            });
          }
        }
      }
    } catch (error) {
      console.log(`  ⚠️  Cannot read ${moduleName}/${fileName}: ${error.message}`);
    }
  }

  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  async analyzeCrossModuleImports() {
    if (this.importMap.size === 0) {
      console.log('✅ No cross-module imports found!\n');
      return;
    }

    console.log('❌ Cross-Module Imports Found:\n');

    for (const [file, imports] of this.importMap.entries()) {
      console.log(`📄 ${file}:`);

      // Group by target module
      const grouped = imports.reduce((acc, imp) => {
        if (!acc[imp.targetModule]) acc[imp.targetModule] = [];
        acc[imp.targetModule].push(imp);
        return acc;
      }, {});

      Object.entries(grouped).forEach(([targetModule, moduleImports]) => {
        console.log(`  → Imports from ${targetModule}:`);
        moduleImports.forEach((imp) => {
          console.log(`    • Line ${imp.line}: ${imp.importPath}`);
        });
      });
      console.log('');
    }
  }

  async suggestFixes() {
    console.log('💡 Fix Suggestions:\n');

    // Analisis umum
    const moduleDeps = new Map();

    for (const [file, imports] of this.importMap.entries()) {
      const [sourceModule] = file.split('/');

      for (const imp of imports) {
        if (!moduleDeps.has(sourceModule)) {
          moduleDeps.set(sourceModule, new Set());
        }
        moduleDeps.get(sourceModule).add(imp.targetModule);
      }
    }

    if (moduleDeps.size > 0) {
      console.log('Module Dependencies:');
      for (const [source, targets] of moduleDeps.entries()) {
        console.log(`  • ${source} → ${Array.from(targets).join(', ')}`);
      }
      console.log('');

      console.log('Recommended Actions:');
      console.log('1. Identify Shared Logic:');

      // Cari pola umum
      const allTargets = new Set();
      for (const [, targets] of moduleDeps) {
        targets.forEach((t) => allTargets.add(t));
      }

      const commonTargets = Array.from(allTargets).filter((target) => {
        let count = 0;
        for (const [, targets] of moduleDeps) {
          if (targets.has(target)) count++;
        }
        return count > 1;
      });

      if (commonTargets.length > 0) {
        console.log(`   • Modules commonly importing from: ${commonTargets.join(', ')}`);
        console.log(`   → Consider moving shared logic to core/ or shared/`);
      }

      console.log('\n2. Create Shared Modules:');
      console.log('   • src/shared/api/ - For shared API calls');
      console.log('   • src/shared/utils/ - For utility functions');
      console.log('   • src/core/services/ - For blockchain services');

      console.log('\n3. Immediate Fixes:');
      console.log('   • Run: node scripts/fix-audit-issues.mjs');
      console.log('   • Review each cross-module import');
      console.log('   • Refactor shared logic');
    }
  }
}

// Run analyzer
try {
  const analyzer = new ImportAnalyzer();
  await analyzer.run();
} catch (error) {
  console.error('❌ Error running import analyzer:', error.message);
  process.exit(1);
}
