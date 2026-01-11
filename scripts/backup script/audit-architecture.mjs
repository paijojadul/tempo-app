#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');

class ArchitectureAuditor {
  constructor() {
    this.violations = [];
    this.rules = this.defineRules();
    this.stats = {
      filesScanned: 0,
      importsChecked: 0,
      violationsBySeverity: { critical: 0, warning: 0 },
    };
  }

  defineRules() {
    return {
      DEPENDENCY_FLOW: {
        name: 'Dependency Flow',
        description: 'Aliran dependency harus: app → modules → core → shared',
        severity: 'critical',
        check: this.checkDependencyFlow.bind(this),
      },
      MODULE_ISOLATION: {
        name: 'Module Isolation',
        description: 'Module tidak boleh import dari module lain',
        severity: 'critical',
        check: this.checkModuleIsolation.bind(this),
      },
      FILE_SEPARATION: {
        name: 'File Separation',
        description: 'Setiap file harus punya 1 tanggung jawab utama',
        severity: 'warning',
        check: this.checkFileSeparation.bind(this),
      },
      CORE_TEMPO_ACCESS: {
        name: 'Core Tempo Access',
        description: 'Hanya service.ts yang boleh akses core/tempo langsung',
        severity: 'critical',
        check: this.checkCoreTempoAccess.bind(this),
      },
      TYPE_SAFETY: {
        name: 'Type Safety',
        description: 'Semua file harus punya tipe yang jelas',
        severity: 'warning',
        check: this.checkTypeSafety.bind(this),
      },
    };
  }

  async scanProject() {
    console.log('🔍 Scanning Tempo Blockchain architecture...\n');

    const files = await this.getAllTsFiles(SRC_DIR);
    this.stats.filesScanned = files.length;

    console.log(`📁 Found ${files.length} TypeScript files`);

    // Scan dengan progress bar
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const progress = Math.round(((i + 1) / files.length) * 100);
      process.stdout.write(`\r📄 Scanning files... ${progress}%`);

      await this.analyzeFile(file);
    }

    console.log('\n✅ Scan completed!\n');
  }

  async getAllTsFiles(dir) {
    const files = [];
    try {
      const items = await fs.readdir(dir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dir, item.name);

        if (item.isDirectory()) {
          // Skip node_modules dan hidden folders
          if (!item.name.includes('node_modules') && !item.name.startsWith('.')) {
            files.push(...(await this.getAllTsFiles(fullPath)));
          }
        } else if (item.name.endsWith('.ts') || item.name.endsWith('.tsx')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      console.warn(`  ⚠️  Cannot access ${dir}: ${error.message}`);
    }

    return files;
  }

  extractImports(content) {
    const imports = [];
    const patterns = [
      /from\s+['"](.+?)['"]/g, // ES6 imports
      /require\(['"](.+?)['"]\)/g, // CommonJS (jarang)
    ];

    patterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        imports.push(match[1]);
        this.stats.importsChecked++;
      }
    });

    return imports;
  }

  getFileCategory(filePath) {
    const relativePath = path.relative(SRC_DIR, filePath);

    if (relativePath.startsWith('app/')) return { layer: 'app', type: 'application' };
    if (relativePath.startsWith('modules/')) {
      const moduleName = relativePath.split('/')[1];
      return { layer: 'module', module: moduleName, type: 'feature' };
    }
    if (relativePath.startsWith('core/')) return { layer: 'core', type: 'infrastructure' };
    if (relativePath.startsWith('shared/')) return { layer: 'shared', type: 'utilities' };

    return { layer: 'unknown', type: 'other' };
  }

  checkDependencyFlow(filePath, content, imports) {
    const fileCategory = this.getFileCategory(filePath);
    const relativePath = path.relative(SRC_DIR, filePath);

    // Aturan aliran dependency
    const allowedImports = {
      app: ['modules', 'core', 'shared', 'node_modules'],
      module: ['core', 'shared', 'node_modules'],
      core: ['shared', 'node_modules'],
      shared: ['node_modules'],
    };

    imports.forEach((importSrc) => {
      if (!importSrc.startsWith('.')) return; // Skip package imports

      const importPath = path.resolve(path.dirname(filePath), importSrc);
      const importCategory = this.getFileCategory(importPath);

      if (!allowedImports[fileCategory.layer]?.includes(importCategory.layer)) {
        this.violations.push({
          rule: 'DEPENDENCY_FLOW',
          severity: 'critical',
          file: relativePath,
          import: path.relative(SRC_DIR, importPath),
          message: `Layer "${fileCategory.layer}" tidak boleh import dari "${importCategory.layer}"`,
          fix: `Pindahkan logic ke ${fileCategory.layer === 'module' ? 'core/' : 'shared/'} layer`,
        });
      }
    });
  }

  checkModuleIsolation(filePath, content, imports) {
    const fileCategory = this.getFileCategory(filePath);
    if (fileCategory.layer !== 'module') return;

    const relativePath = path.relative(SRC_DIR, filePath);
    const currentModule = fileCategory.module;

    imports.forEach((importSrc) => {
      if (importSrc.includes('../modules/')) {
        const importMatch = importSrc.match(/\.\.\/modules\/([^/]+)/);
        if (importMatch && importMatch[1] !== currentModule) {
          this.violations.push({
            rule: 'MODULE_ISOLATION',
            severity: 'critical',
            file: relativePath,
            import: importSrc,
            message: `Module "${currentModule}" tidak boleh import dari module "${importMatch[1]}"`,
            fix: `Ekstrak shared logic ke core/ atau shared/ directory`,
          });
        }
      }
    });
  }

  checkFileSeparation(filePath, content, imports) {
    const filename = path.basename(filePath);
    const relativePath = path.relative(SRC_DIR, filePath);

    // Rule: ui.tsx hanya untuk UI
    if (filename === 'ui.tsx') {
      const hasBusinessLogic = /getTempoClient|fetch[A-Z]|post[A-Z]|put[A-Z]|delete[A-Z]/.test(
        content
      );

      if (hasBusinessLogic) {
        this.violations.push({
          rule: 'FILE_SEPARATION',
          severity: 'warning',
          file: relativePath,
          message: 'ui.tsx mengandung business logic (pindahkan ke service.ts)',
          fix: 'Pindahkan logic ke service.ts, biarkan UI hanya handle rendering',
        });
      }
    }

    // Rule: service.ts hanya untuk external calls
    if (filename === 'service.ts') {
      const hasUiReferences =
        imports.some((imp) => imp.includes('.tsx')) ||
        /useState|useEffect|return\s*\(/.test(content);

      if (hasUiReferences) {
        this.violations.push({
          rule: 'FILE_SEPARATION',
          severity: 'warning',
          file: relativePath,
          message: 'service.ts mengandung UI logic',
          fix: 'Pisahkan UI logic ke file terpisah',
        });
      }
    }

    // Rule: store.ts hanya state management
    if (filename === 'store.ts') {
      const hasApiCalls = /fetch\(|axios\.|\.get\(|\.post\(/.test(content);
      const hasTempoDirect = /getTempoClient/.test(content);

      if (hasApiCalls || hasTempoDirect) {
        this.violations.push({
          rule: 'FILE_SEPARATION',
          severity: 'warning',
          file: relativePath,
          message: 'store.ts mengandung API/Tempo logic',
          fix: 'Pindahkan API calls ke service.ts',
        });
      }
    }
  }

  checkCoreTempoAccess(filePath, content, imports) {
    const filename = path.basename(filePath);
    const relativePath = path.relative(SRC_DIR, filePath);

    // File yang diizinkan akses core/tempo
    const allowedFiles = ['service.ts', 'tempo.ts', 'client.ts'];
    const isCoreTempoFile = filePath.includes('core/tempo/');

    if (!allowedFiles.includes(filename) && !isCoreTempoFile) {
      const hasTempoImport = imports.some(
        (imp) => imp.includes('core/tempo') || imp.includes('../core/tempo')
      );

      if (hasTempoImport) {
        this.violations.push({
          rule: 'CORE_TEMPO_ACCESS',
          severity: 'critical',
          file: relativePath,
          message: 'Hanya service.ts yang boleh akses core/tempo langsung',
          fix: 'Gunakan service layer sebagai perantara',
        });
      }
    }
  }

  checkTypeSafety(filePath, content) {
    const filename = path.basename(filePath);
    const relativePath = path.relative(SRC_DIR, filePath);

    // Cek: File tanpa tipe (any)
    const hasAnyType = /:\s*any\b|\bas any\b/.test(content);
    const hasUnsafeCast = /as\s+any\b/.test(content);

    if (hasAnyType || hasUnsafeCast) {
      this.violations.push({
        rule: 'TYPE_SAFETY',
        severity: 'warning',
        file: relativePath,
        message: 'Menggunakan tipe "any" (kurang type-safe)',
        fix: 'Ganti "any" dengan tipe yang spesifik',
      });
    }

    // Cek: Missing return types
    if (!filename.endsWith('.test.ts') && !filename.endsWith('.spec.ts')) {
      const functionsWithoutReturn =
        /(function|const\s+\w+\s*=\s*\(|export\s+(?:async\s+)?function)\s+[\w]+\s*\([^)]*\)\s*(?::{.*?})?\s*{/g;

      let match;
      while ((match = functionsWithoutReturn.exec(content)) !== null) {
        const funcStart = match.index;
        const afterFunc = content.substring(funcStart, funcStart + 200);

        if (!afterFunc.match(/\)\s*:\s*\w+/)) {
          this.violations.push({
            rule: 'TYPE_SAFETY',
            severity: 'warning',
            file: relativePath,
            message: 'Function tanpa return type',
            fix: 'Tambahkan return type (: ReturnType)',
          });
          break;
        }
      }
    }
  }

  async analyzeFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const imports = this.extractImports(content);

      // Jalankan semua rule checks
      Object.values(this.rules).forEach((rule) => {
        rule.check(filePath, content, imports);
      });
    } catch (error) {
      console.warn(`  ⚠️  Cannot analyze ${filePath}: ${error.message}`);
    }
  }

  generateReport() {
    console.log('='.repeat(80));
    console.log('🏗️  ARCHITECTURE AUDIT REPORT - TEMPO BLOCKCHAIN');
    console.log('='.repeat(80));

    // Stats
    console.log('\n📊 STATISTICS:');
    console.log(`   Files scanned: ${this.stats.filesScanned}`);
    console.log(`   Imports checked: ${this.stats.importsChecked}`);
    console.log(`   Total violations: ${this.violations.length}`);

    const critical = this.violations.filter((v) => v.severity === 'critical').length;
    const warnings = this.violations.filter((v) => v.severity === 'warning').length;

    console.log(`   Critical issues: ${critical}`);
    console.log(`   Warnings: ${warnings}`);

    if (this.violations.length === 0) {
      console.log('\n🎉 SANGAT BAIK! Semua aturan arsitektur terpenuhi.');
      console.log('   Kodebase Tempo dalam kondisi prima! 🚀');
      console.log('='.repeat(80));
      return true;
    }

    // Group violations by rule
    console.log('\n📋 VIOLATIONS DETAILS:');
    console.log('='.repeat(80));

    Object.values(this.rules).forEach((rule) => {
      const ruleViolations = this.violations.filter((v) => v.rule === rule.name);

      if (ruleViolations.length > 0) {
        const icon = rule.severity === 'critical' ? '❌' : '⚠️';
        console.log(`\n${icon} ${rule.name.toUpperCase()} (${ruleViolations.length} issues)`);
        console.log(`   ${rule.description}`);

        ruleViolations.forEach((violation, index) => {
          console.log(`\n   ${index + 1}. ${violation.file}`);
          if (violation.import) {
            console.log(`      Import: ${violation.import}`);
          }
          console.log(`      Issue: ${violation.message}`);
          console.log(`      Fix: ${violation.fix}`);
        });
      }
    });

    // Summary & recommendations
    console.log('\n' + '='.repeat(80));
    console.log('💡 RECOMMENDATIONS:');

    if (critical > 0) {
      console.log('\n🚨 CRITICAL ISSUES FOUND!');
      console.log('   Harus diperbaiki sebelum merge ke main branch.');
      console.log('\n   Quick actions:');
      console.log('   1. Run: npm run fix-dependencies');
      console.log('   2. Review dependency flows');
      console.log('   3. Check module boundaries');
      return false;
    } else {
      console.log('\n⚠️  WARNINGS ONLY');
      console.log('   Architecture is acceptable but could be optimized.');
      console.log('\n   Improvement suggestions:');
      console.log('   1. Add missing TypeScript types');
      console.log('   2. Separate concerns better');
      console.log('   3. Run: npm run fix-dependencies -- --suggest');
      return true;
    }
  }

  async run() {
    console.log('🚀 Starting architecture audit...\n');

    await this.scanProject();
    const isClean = this.generateReport();

    // Update stats
    this.violations.forEach((v) => {
      this.stats.violationsBySeverity[v.severity]++;
    });

    return isClean;
  }
}

// Command line interface
async function main() {
  try {
    const auditor = new ArchitectureAuditor();
    const isClean = await auditor.run();

    // Exit code untuk CI/CD
    process.exit(isClean ? 0 : 1);
  } catch (error) {
    console.error('\n❌ Audit failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Export untuk penggunaan modular
export { ArchitectureAuditor };

// Run jika dieksekusi langsung
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🏗️  Tempo Blockchain Architecture Auditor

Usage:
  node scripts/audit-architecture.mjs [options]

Options:
  --help, -h     Show this help message
  --verbose, -v  Show detailed output
  --json         Output results as JSON
  --fix          Attempt automatic fixes

Examples:
  node scripts/audit-architecture.mjs
  node scripts/audit-architecture.mjs --verbose
  node scripts/audit-architecture.mjs --json > audit-report.json
    `);
    process.exit(0);
  }

  main();
}
