#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');

class ModuleAuditor {
  constructor() {
    this.issues = [];
    this.stats = {
      modules: 0,
      files: 0,
      violations: 0,
    };
  }

  async run() {
    console.log('🔍 Auditing Tempo Modules...\n');

    const modules = await this.scanModules();
    this.stats.modules = modules.length;

    for (const module of modules) {
      await this.auditModule(module);
    }

    this.generateReport();
  }

  async scanModules() {
    const modulesPath = path.join(SRC_DIR, 'modules');
    const modules = [];

    try {
      const items = await fs.readdir(modulesPath, { withFileTypes: true });

      for (const item of items) {
        if (item.isDirectory()) {
          modules.push({
            name: item.name,
            path: path.join(modulesPath, item.name),
          });
        }
      }
    } catch (error) {
      console.error('❌ Cannot scan modules directory:', error.message);
    }

    return modules;
  }

  async auditModule(module) {
    console.log(`📦 Auditing module: ${module.name}`);

    const requiredFiles = ['index.ts', 'service.ts', 'store.ts', 'ui.tsx'];

    // Check file existence
    const existingFiles = [];
    for (const file of requiredFiles) {
      const filePath = path.join(module.path, file);
      try {
        await fs.access(filePath);
        existingFiles.push(file);
        this.stats.files++;
      } catch {
        this.issues.push({
          module: module.name,
          type: 'MISSING_FILE',
          severity: 'CRITICAL',
          message: `Missing required file: ${file}`,
          fix: `Create ${file} in modules/${module.name}/`,
        });
      }
    }

    // Audit each existing file
    for (const file of existingFiles) {
      await this.auditFile(module, file);
    }

    // Check module structure
    await this.checkModuleStructure(module);
  }

  async auditFile(module, filename) {
    const filePath = path.join(module.path, filename);

    try {
      const content = await fs.readFile(filePath, 'utf8');

      switch (filename) {
        case 'service.ts':
          await this.auditServiceFile(module.name, content, filePath);
          break;
        case 'store.ts':
          await this.auditStoreFile(module.name, content, filePath);
          break;
        case 'ui.tsx':
          await this.auditUIFile(module.name, content, filePath);
          break;
        case 'index.ts':
          await this.auditIndexFile(module.name, content, filePath);
          break;
      }
    } catch (error) {
      console.warn(`⚠️  Cannot read ${module.name}/${filename}:`, error.message);
    }
  }

  async auditServiceFile(moduleName, content, filePath) {
    const issues = [];
    const moduleCapitalized = this.capitalize(moduleName);

    // Check for Tempo client import
    if (!content.includes('getTempoClient')) {
      issues.push({
        type: 'SERVICE_PATTERN',
        severity: 'WARNING',
        message: 'Service file tidak menggunakan getTempoClient',
        fix: `Import dan gunakan getTempoClient dari '../../core/tempo'`,
      });
    }

    // Check for required functions
    const requiredFunction = `fetch${moduleCapitalized}Data`;
    if (!content.includes(requiredFunction)) {
      issues.push({
        type: 'MISSING_FUNCTION',
        severity: 'MEDIUM',
        message: `Service file seharusnya memiliki fungsi ${requiredFunction}()`,
        fix: `Tambahkan async function ${requiredFunction}() { ... }`,
      });
    }

    // Check for cross-module imports
    const crossModuleImport = /from\s+['"]\.\.\/\.\.\/modules\/(?!${moduleName}\/)/;
    if (crossModuleImport.test(content)) {
      issues.push({
        type: 'CROSS_MODULE_IMPORT',
        severity: 'CRITICAL',
        message: 'Service file mengimport dari module lain',
        fix: 'Pindahkan shared logic ke core/ atau shared/ directory',
      });
    }

    // Check for TODO comments
    const todoCount = (content.match(/TODO/g) || []).length;
    if (todoCount > 0) {
      issues.push({
        type: 'TODO_REMAINING',
        severity: 'INFO',
        message: `Ada ${todoCount} TODO comments yang perlu diselesaikan`,
        fix: 'Implement logic yang masih TODO',
      });
    }

    // Add issues to main list
    issues.forEach((issue) => {
      this.issues.push({
        module: moduleName,
        file: 'service.ts',
        ...issue,
      });
    });
  }

  async auditStoreFile(moduleName, content, filePath) {
    const issues = [];
    const moduleCapitalized = this.capitalize(moduleName);

    // Check for Zustand store
    if (!content.includes('create') || !content.includes('zustand')) {
      issues.push({
        type: 'STORE_PATTERN',
        severity: 'CRITICAL',
        message: 'Store file tidak menggunakan Zustand pattern',
        fix: 'Gunakan create dari zustand untuk membuat store',
      });
    }

    // Check for store hook
    const storeHook = `use${moduleCapitalized}Store`;
    if (!content.includes(storeHook)) {
      issues.push({
        type: 'MISSING_STORE_HOOK',
        severity: 'CRITICAL',
        message: `Store file harus export ${storeHook}`,
        fix: `Export const ${storeHook} = create(...)`,
      });
    }

    // Check for service imports
    if (!content.includes("from './service'")) {
      issues.push({
        type: 'SERVICE_INTEGRATION',
        severity: 'MEDIUM',
        message: 'Store tidak mengimport dari service.ts',
        fix: "Tambahkan import dari './service' untuk business logic",
      });
    }

    // Check for direct Tempo access (should not be here)
    if (content.includes('getTempoClient')) {
      issues.push({
        type: 'DIRECT_TEMPO_ACCESS',
        severity: 'HIGH',
        message: 'Store file mengakses Tempo langsung (harus lewat service)',
        fix: 'Pindahkan Tempo logic ke service.ts',
      });
    }

    // Check for UI logic in store
    if (content.includes('.tsx') || content.includes('useState') || content.includes('useEffect')) {
      issues.push({
        type: 'UI_LOGIC_IN_STORE',
        severity: 'MEDIUM',
        message: 'Store file mengandung UI logic',
        fix: 'Pindahkan UI logic ke ui.tsx',
      });
    }

    issues.forEach((issue) => {
      this.issues.push({
        module: moduleName,
        file: 'store.ts',
        ...issue,
      });
    });
  }

  async auditUIFile(moduleName, content, filePath) {
    const issues = [];
    const moduleCapitalized = this.capitalize(moduleName);

    // Check for component export
    const componentName = `${moduleCapitalized}UI`;
    if (
      !content.includes(`export function ${componentName}`) &&
      !content.includes(`export const ${componentName}`)
    ) {
      issues.push({
        type: 'MISSING_COMPONENT',
        severity: 'CRITICAL',
        message: `UI file harus export ${componentName} component`,
        fix: `Export function ${componentName}() { ... }`,
      });
    }

    // Check for store import
    if (!content.includes("from './store'")) {
      issues.push({
        type: 'STORE_INTEGRATION',
        severity: 'HIGH',
        message: 'UI tidak mengimport store',
        fix: "Tambahkan import { use${moduleCapitalized}Store } from './store'",
      });
    }

    // Check for direct Tempo access (should not be here)
    if (content.includes('getTempoClient')) {
      issues.push({
        type: 'DIRECT_TEMPO_ACCESS',
        severity: 'HIGH',
        message: 'UI file mengakses Tempo langsung (harus lewat store)',
        fix: 'Gunakan store hooks untuk akses data',
      });
    }

    // Check for business logic in UI
    const businessLogicPatterns = ['fetch(', 'axios.', 'getTempoClient', 'await.*fetch'];

    for (const pattern of businessLogicPatterns) {
      if (content.includes(pattern)) {
        issues.push({
          type: 'BUSINESS_LOGIC_IN_UI',
          severity: 'MEDIUM',
          message: 'UI file mengandung business logic',
          fix: 'Pindahkan business logic ke service.ts',
        });
        break;
      }
    }

    // Check for React hooks usage
    if (!content.includes('useState') && !content.includes('useEffect')) {
      issues.push({
        type: 'STATIC_UI',
        severity: 'INFO',
        message: 'UI file mungkin terlalu statis',
        fix: 'Pertimbangkan menggunakan React hooks untuk interaktivitas',
      });
    }

    issues.forEach((issue) => {
      this.issues.push({
        module: moduleName,
        file: 'ui.tsx',
        ...issue,
      });
    });
  }

  async auditIndexFile(moduleName, content, filePath) {
    const issues = [];
    const moduleCapitalized = this.capitalize(moduleName);

    // Check for UI export
    if (!content.includes(`{ ${moduleCapitalized}UI }`)) {
      issues.push({
        type: 'MISSING_EXPORT',
        severity: 'HIGH',
        message: `Index file harus export ${moduleCapitalized}UI`,
        fix: `Tambahkan export { ${moduleCapitalized}UI } from './ui'`,
      });
    }

    // Check for service export
    if (!content.includes("from './service'")) {
      issues.push({
        type: 'MISSING_SERVICE_EXPORT',
        severity: 'MEDIUM',
        message: 'Index file tidak mengexport service',
        fix: "Tambahkan export * from './service'",
      });
    }

    // Check for store export
    if (!content.includes("from './store'")) {
      issues.push({
        type: 'MISSING_STORE_EXPORT',
        severity: 'MEDIUM',
        message: 'Index file tidak mengexport store',
        fix: "Tambahkan export * from './store'",
      });
    }

    // Check for barrel export pattern
    const exportLines = content
      .split('\n')
      .filter((line) => line.includes('export') && line.includes('from'));

    if (exportLines.length < 3) {
      issues.push({
        type: 'INCOMPLETE_BARREL',
        severity: 'LOW',
        message: 'Index file export terlalu sedikit',
        fix: 'Pastikan export UI, service, store, dan types',
      });
    }

    issues.forEach((issue) => {
      this.issues.push({
        module: moduleName,
        file: 'index.ts',
        ...issue,
      });
    });
  }

  async checkModuleStructure(module) {
    // Check for unnecessary files
    const allFiles = await fs.readdir(module.path);
    const unexpectedFiles = allFiles.filter(
      (file) =>
        !file.match(/^(index|service|store|ui|types)\.(ts|tsx)$/) &&
        !file.match(/^\./) && // Skip hidden files
        !file.match(/^README/) &&
        !file.match(/^\.gitignore/)
    );

    if (unexpectedFiles.length > 0) {
      this.issues.push({
        module: module.name,
        type: 'UNEXPECTED_FILES',
        severity: 'INFO',
        message: `Module memiliki file yang tidak standar: ${unexpectedFiles.join(', ')}`,
        fix: 'Pertimbangkan untuk menghapus atau memindahkan file tersebut',
      });
    }

    // Check for types.ts (optional but recommended)
    try {
      await fs.access(path.join(module.path, 'types.ts'));
    } catch {
      this.issues.push({
        module: module.name,
        type: 'MISSING_TYPES',
        severity: 'LOW',
        message: 'Module tidak memiliki types.ts (optional tapi recommended)',
        fix: 'Buat types.ts untuk TypeScript interfaces',
      });
    }
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 MODULE AUDIT REPORT - TEMPO BLOCKCHAIN');
    console.log('='.repeat(80));

    // Statistics
    console.log('\n📈 STATISTICS:');
    console.log(`   Modules scanned: ${this.stats.modules}`);
    console.log(`   Files checked: ${this.stats.files}`);
    console.log(`   Issues found: ${this.issues.length}`);

    // Group by module
    const modulesWithIssues = [...new Set(this.issues.map((i) => i.module))];

    if (this.issues.length === 0) {
      console.log('\n🎉 SEMUA MODUL DALAM KONDISI BAIK!');
      console.log('   Arsitektur modular Tempo sangat solid! 🚀');
      console.log('='.repeat(80));
      return;
    }

    console.log(`\n📋 MODULES WITH ISSUES (${modulesWithIssues.length}):`);
    console.log('='.repeat(80));

    // Print issues per module
    for (const moduleName of modulesWithIssues) {
      const moduleIssues = this.issues.filter((i) => i.module === moduleName);

      console.log(`\n📦 ${this.capitalize(moduleName)} Module (${moduleIssues.length} issues):`);

      // Group by severity
      const critical = moduleIssues.filter((i) => i.severity === 'CRITICAL');
      const high = moduleIssues.filter((i) => i.severity === 'HIGH');
      const medium = moduleIssues.filter((i) => i.severity === 'MEDIUM');
      const low = moduleIssues.filter((i) => i.severity === 'LOW');
      const info = moduleIssues.filter((i) => i.severity === 'INFO');

      if (critical.length > 0) {
        console.log(`   ❌ CRITICAL (${critical.length}):`);
        critical.forEach((issue, idx) => {
          console.log(`      ${idx + 1}. ${issue.file}: ${issue.message}`);
        });
      }

      if (high.length > 0) {
        console.log(`   🔴 HIGH (${high.length}):`);
        high.forEach((issue, idx) => {
          console.log(`      ${idx + 1}. ${issue.file}: ${issue.message}`);
        });
      }

      if (medium.length > 0) {
        console.log(`   🟡 MEDIUM (${medium.length}):`);
        medium.forEach((issue, idx) => {
          console.log(`      ${idx + 1}. ${issue.file}: ${issue.message}`);
        });
      }

      if (low.length > 0 || info.length > 0) {
        console.log(`   ℹ️  SUGGESTIONS (${low.length + info.length}):`);
        [...low, ...info].forEach((issue, idx) => {
          console.log(`      ${idx + 1}. ${issue.file}: ${issue.message}`);
        });
      }
    }

    // Summary and recommendations
    console.log('\n' + '='.repeat(80));
    console.log('💡 RECOMMENDATIONS:');

    const criticalCount = this.issues.filter((i) => i.severity === 'CRITICAL').length;

    if (criticalCount > 0) {
      console.log(`\n🚨 ${criticalCount} CRITICAL ISSUES FOUND!`);
      console.log('   Harus diperbaiki segera:');
      console.log('   1. Run: npm run fix-modules');
      console.log('   2. Periksa module yang bermasalah');
      console.log('   3. Fix critical issues sebelum commit');
    } else {
      console.log('\n✅ Tidak ada critical issues');
      console.log('   Module dalam kondisi baik untuk development');
    }

    console.log('\n🔧 Quick fixes:');
    console.log('   1. Gunakan: npm run fix-modules -- --module=<nama-module>');
    console.log('   2. Untuk auto-fix semua: npm run fix-modules -- --all');
    console.log('='.repeat(80));
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
📦 Tempo Module Auditor

Usage:
  node scripts/audit-module.mjs [options]

Options:
  --help, -h           Show this help
  --module=<name>      Audit specific module only
  --verbose, -v        Show detailed output
  --json               Output as JSON

Examples:
  node scripts/audit-module.mjs
  node scripts/audit-module.mjs --module=accounts
  node scripts/audit-module.mjs --json > module-report.json
    `);
    process.exit(0);
  }

  const auditor = new ModuleAuditor();
  await auditor.run();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
