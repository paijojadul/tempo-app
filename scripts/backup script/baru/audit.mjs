#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ArchitectureAuditor {
  constructor() {
    this.projectRoot = process.cwd();
    this.srcPath = path.join(this.projectRoot, 'src');
    this.violations = [];
    this.stats = { filesScanned: 0, violations: 0 };
  }

  async run() {
    console.log('🔍 ARCHITECTURE AUDIT - Tempo Blockchain\n');
    console.log('═'.repeat(80));

    await this.scanProject();
    this.generateReport();
  }

  async scanProject() {
    const files = await this.getAllTsFiles(this.srcPath);
    this.stats.filesScanned = files.length;

    console.log(`📁 Scanning ${files.length} TypeScript files...\n`);

    for (const file of files) {
      await this.analyzeFile(file);
    }
  }

  async getAllTsFiles(dir) {
    const files = [];

    try {
      const items = await fs.readdir(dir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dir, item.name);

        if (item.isDirectory()) {
          // Skip node_modules and hidden directories
          if (!item.name.includes('node_modules') && !item.name.startsWith('.')) {
            files.push(...(await this.getAllTsFiles(fullPath)));
          }
        } else if (item.name.endsWith('.ts') || item.name.endsWith('.tsx')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Skip inaccessible directories
    }

    return files;
  }

  async analyzeFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const relativePath = path.relative(this.projectRoot, filePath);

      // Check 1: Cross-module imports
      if (filePath.includes('src/modules/')) {
        const moduleName = relativePath.split('/')[2]; // src/modules/<name>/...
        const imports = this.extractImports(content);

        for (const imp of imports) {
          if (imp.includes('../modules/')) {
            const importedModule = imp.match(/\.\.\/modules\/([^/]+)/)?.[1];
            if (importedModule && importedModule !== moduleName) {
              this.violations.push({
                type: 'CROSS_MODULE_IMPORT',
                severity: 'HIGH',
                file: relativePath,
                issue: `Module "${moduleName}" imports from "${importedModule}"`,
                fix: `Move shared logic to src/shared/ or src/core/`,
              });
            }
          }
        }
      }

      // Check 2: UI accessing core/tempo directly
      if (filePath.includes('ui.tsx') && content.includes('getTempoClient')) {
        this.violations.push({
          type: 'UI_ACCESSING_CORE',
          severity: 'HIGH',
          file: relativePath,
          issue: 'UI component accessing Tempo directly',
          fix: 'Move Tempo logic to service.ts',
        });
      }

      // Check 3: Store doing API calls
      if (
        filePath.includes('store.ts') &&
        (content.includes('fetch(') || content.includes('axios.'))
      ) {
        this.violations.push({
          type: 'STORE_API_CALLS',
          severity: 'MEDIUM',
          file: relativePath,
          issue: 'Store contains API/Tempo logic',
          fix: 'Move API calls to service.ts',
        });
      }

      // Check 4: Type safety (any types)
      if (content.includes(': any') || content.includes('as any')) {
        this.violations.push({
          type: 'TYPE_SAFETY',
          severity: 'LOW',
          file: relativePath,
          issue: 'Using "any" type',
          fix: 'Replace with specific types',
        });
      }
    } catch (error) {
      // Skip unreadable files
    }
  }

  extractImports(content) {
    const imports = [];
    const regex = /from\s+['"](\.\.?\/[^'"]+)['"]/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      imports.push(match[1]);
    }

    return imports;
  }

  generateReport() {
    console.log('📊 AUDIT RESULTS:\n');
    console.log(`Files scanned: ${this.stats.filesScanned}`);
    console.log(`Violations found: ${this.violations.length}`);

    if (this.violations.length === 0) {
      console.log('\n🎉 EXCELLENT! No architecture violations found.');
      console.log('Your Tempo project is well-structured! 🚀');
      return;
    }

    // Group by severity
    const high = this.violations.filter((v) => v.severity === 'HIGH');
    const medium = this.violations.filter((v) => v.severity === 'MEDIUM');
    const low = this.violations.filter((v) => v.severity === 'LOW');

    if (high.length > 0) {
      console.log('\n🚨 HIGH PRIORITY ISSUES:');
      high.forEach((v, i) => {
        console.log(`\n${i + 1}. ${v.file}`);
        console.log(`   Issue: ${v.issue}`);
        console.log(`   Fix: ${v.fix}`);
      });
    }

    if (medium.length > 0) {
      console.log('\n⚠️  MEDIUM PRIORITY ISSUES:');
      medium.forEach((v, i) => {
        console.log(`\n${i + 1}. ${v.file}`);
        console.log(`   Issue: ${v.issue}`);
        console.log(`   Fix: ${v.fix}`);
      });
    }

    if (low.length > 0) {
      console.log('\n💡 LOW PRIORITY ISSUES:');
      console.log(`(${low.length} type safety issues - fix when refactoring)`);
    }

    console.log('\n' + '═'.repeat(80));
    console.log('💡 RECOMMENDATIONS:');

    if (high.length > 0) {
      console.log('\n1. Fix high priority issues first');
      console.log('   Run: node scripts/fix-module.mjs --all');
    }

    if (medium.length > 0) {
      console.log('\n2. Refactor stores and services');
      console.log('   Use: node scripts/dev-tools-ultimate.mjs generate service <name>');
    }

    console.log('\n3. Run quick fix: node scripts/dev-tools-ultimate.mjs fix');
    console.log('4. Re-audit: node scripts/audit.mjs');

    console.log('\n' + '═'.repeat(80));
  }
}

// Run audit
(async () => {
  try {
    const auditor = new ArchitectureAuditor();
    await auditor.run();
  } catch (error) {
    console.error('❌ Audit failed:', error.message);
    process.exit(1);
  }
})();

// Export for use in dev-tools-ultimate.mjs
export { ArchitectureAuditor };
