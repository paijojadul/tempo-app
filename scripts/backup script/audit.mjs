#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rules yang akan diaudit
const RULES = {
  DEPENDENCY_FLOW: 'app → modules → core → shared',
  MODULE_STRUCTURE: 'Setiap module harus memiliki: index.ts, ui.tsx, service.ts, store.ts',
  NO_CROSS_MODULE_IMPORTS: 'Module tidak boleh import dari module lain',
  UI_NO_DIRECT_CORE_ACCESS: 'UI tidak boleh akses core langsung',
  SERVICE_CAN_ACCESS_CORE: 'Service boleh akses core/tempo',
  STORE_NO_EXTERNAL_ACCESS: 'Store tidak boleh tahu UI & Tempo',
};

// Target struktur yang diharapkan
const EXPECTED_STRUCTURE = {
  'src/app': ['App.tsx', 'main.tsx'],
  'src/core/store': ['app.store.ts', 'index.ts'],
  'src/core/tempo': ['chains.ts', 'client.ts', 'index.ts', 'wallet.ts'],
  'src/shared/ui': ['index.ts', 'Button.tsx'],
  'src/modules': ['accounts', 'payments', 'exchange', 'issuance'],
};

const MODULE_FILES = ['index.ts', 'ui.tsx', 'service.ts', 'store.ts'];

class AuditTool {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.srcPath = path.join(projectRoot, 'src');
    this.issues = [];
    this.stats = {
      totalFiles: 0,
      totalModules: 0,
      completeModules: 0,
      issuesFound: 0,
    };
  }

  async run() {
    console.log('🔍 Starting Modular Structure Audit...\n');
    console.log('📋 RULES:');
    Object.entries(RULES).forEach(([key, rule]) => {
      console.log(`  • ${key}: ${rule}`);
    });
    console.log('\n' + '═'.repeat(80) + '\n');

    await this.checkDirectoryStructure();
    await this.checkDependencyFlow();
    await this.generateReport();
  }

  async checkDirectoryStructure() {
    console.log('📂 Checking Directory Structure...');

    for (const [dirPath, expectedItems] of Object.entries(EXPECTED_STRUCTURE)) {
      const fullPath = path.join(this.projectRoot, dirPath);

      try {
        await fs.access(fullPath);

        if (dirPath === 'src/modules') {
          // Check modules directory
          const items = await fs.readdir(fullPath);
          const modules = [];

          // Filter only directories
          for (const item of items) {
            const itemPath = path.join(fullPath, item);
            const stat = await fs.stat(itemPath);
            if (stat.isDirectory()) {
              modules.push(item);
            }
          }

          this.stats.totalModules = modules.length;
          console.log(`  ✅ ${dirPath}: Found ${modules.length} modules`);

          // Check each module
          for (const module of modules) {
            await this.checkModule(path.join(dirPath, module), module);
          }
        } else if (dirPath === 'src/shared/ui') {
          // Check shared/ui files
          const files = await fs.readdir(fullPath);
          const expectedFiles = EXPECTED_STRUCTURE['src/shared/ui'];
          const missingFiles = expectedFiles.filter((file) => !files.includes(file));

          if (missingFiles.length === 0) {
            console.log(`  ✅ ${dirPath}: Complete`);
          } else {
            console.log(`  ⚠️  ${dirPath}: Missing files: ${missingFiles.join(', ')}`);
            this.issues.push({
              type: 'STRUCTURE',
              path: dirPath,
              message: `Missing files: ${missingFiles.join(', ')}`,
            });
          }
        } else {
          // Check other directories
          const files = await fs.readdir(fullPath);
          const missingFiles = expectedItems.filter((file) => !files.includes(file));

          if (missingFiles.length === 0) {
            console.log(`  ✅ ${dirPath}: Complete`);
          } else {
            console.log(`  ⚠️  ${dirPath}: Missing files: ${missingFiles.join(', ')}`);
            this.issues.push({
              type: 'STRUCTURE',
              path: dirPath,
              message: `Missing files: ${missingFiles.join(', ')}`,
            });
          }
        }
      } catch (error) {
        console.log(`  ❌ ${dirPath}: Directory not found`);
        this.issues.push({
          type: 'STRUCTURE',
          path: dirPath,
          message: 'Directory not found',
        });
      }
    }
    console.log('');
  }

  async checkModule(modulePath, moduleName) {
    const fullPath = path.join(this.projectRoot, modulePath);
    const files = await fs.readdir(fullPath);

    const missingFiles = MODULE_FILES.filter((file) => !files.includes(file));
    const hasAllFiles = missingFiles.length === 0;

    if (hasAllFiles) {
      this.stats.completeModules++;
      console.log(`    ✅ ${moduleName}: Complete module structure`);
    } else {
      console.log(`    ⚠️  ${moduleName}: Missing ${missingFiles.length} files`);
      missingFiles.forEach((file) => {
        console.log(`      - ${file}`);
      });

      this.issues.push({
        type: 'MODULE_STRUCTURE',
        path: modulePath,
        message: `Missing files: ${missingFiles.join(', ')}`,
      });
    }

    // Check file contents
    await this.checkModuleFileContents(modulePath, moduleName, files);
  }

  async checkModuleFileContents(modulePath, moduleName, files) {
    for (const file of files) {
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        const filePath = path.join(this.projectRoot, modulePath, file);
        try {
          const content = await fs.readFile(filePath, 'utf-8');

          // Check for cross-module imports
          if (this.hasCrossModuleImport(content, moduleName)) {
            this.issues.push({
              type: 'CROSS_MODULE_IMPORT',
              path: path.join(modulePath, file),
              message: 'Detected import from another module',
            });
          }

          // Check UI accessing core directly
          if (file === 'ui.tsx' && this.hasDirectCoreAccess(content)) {
            this.issues.push({
              type: 'UI_DIRECT_CORE_ACCESS',
              path: path.join(modulePath, file),
              message: 'UI should not access core directly',
            });
          }

          // Check if service can access core (it should)
          if (file === 'service.ts' && !this.hasCoreAccess(content)) {
            // Check if service actually needs core access
            if (!content.includes('TODO') && !content.includes('// TODO')) {
              this.issues.push({
                type: 'SERVICE_NO_CORE_ACCESS',
                path: path.join(modulePath, file),
                message: 'Service should be able to access core (tempo)',
              });
            }
          }

          // Check store access
          if (file === 'store.ts') {
            if (this.hasDirectCoreAccess(content)) {
              this.issues.push({
                type: 'STORE_EXTERNAL_ACCESS',
                path: path.join(modulePath, file),
                message: 'Store should not access core directly',
              });
            }

            if (this.hasUIReference(content)) {
              this.issues.push({
                type: 'STORE_UI_REFERENCE',
                path: path.join(modulePath, file),
                message: 'Store should not reference UI',
              });
            }
          }
        } catch (error) {
          console.log(`    ⚠️  Cannot read ${moduleName}/${file}: ${error.message}`);
        }
      }
    }
  }

  hasCrossModuleImport(content, currentModule) {
    const importRegex = /from ['"]\.\.\/([^/]+)/g;
    const matches = [...content.matchAll(importRegex)];

    return matches.some((match) => {
      const importedModule = match[1];
      return (
        importedModule !== 'core' &&
        importedModule !== 'shared' &&
        importedModule !== 'app' &&
        importedModule !== currentModule
      );
    });
  }

  hasDirectCoreAccess(content) {
    const coreImports = [
      /from\s+['"]\.\.\/\.\.\/core\//,
      /from\s+['"]\.\.\/core\//,
      /getTempoClient\(\)/,
      /useAppStore/,
      /TEMPO_TESTNET/,
    ];

    return coreImports.some((pattern) => pattern.test(content));
  }

  hasCoreAccess(content) {
    return /getTempoClient|from\s+['"]\.\.\/\.\.\/core\/tempo|from\s+['"]\.\.\/core\/tempo/.test(
      content
    );
  }

  hasUIReference(content) {
    return /from\s+['"]\.\/ui|from\s+['"]\.\.\/ui|UIComponent|ui\./.test(content);
  }

  async checkDependencyFlow() {
    console.log('🔗 Checking Dependency Flow...');

    const modulesDir = path.join(this.projectRoot, 'src/modules');
    try {
      const items = await fs.readdir(modulesDir);

      for (const item of items) {
        const modulePath = path.join(modulesDir, item);
        const stat = await fs.stat(modulePath);

        if (stat.isDirectory()) {
          await this.checkModuleDependencies(modulePath, item);
        }
      }
    } catch (error) {
      console.log(`  ❌ Cannot read modules directory: ${error.message}`);
    }
    console.log('');
  }

  async checkModuleDependencies(modulePath, moduleName) {
    try {
      const indexPath = path.join(modulePath, 'index.ts');
      const content = await fs.readFile(indexPath, 'utf-8');

      // Check if exports are properly structured
      const hasUIExport =
        content.includes('export {') && (content.includes('UI') || content.includes('ui.tsx'));
      const hasServiceExport = content.includes('service');
      const hasStoreExport = content.includes('store');

      if (!hasUIExport || !hasServiceExport || !hasStoreExport) {
        console.log(`  ⚠️  ${moduleName}: Incomplete exports in index.ts`);
        this.issues.push({
          type: 'EXPORT_STRUCTURE',
          path: `modules/${moduleName}/index.ts`,
          message: 'Index.ts should export UI, service, and store',
        });
      } else {
        console.log(`  ✅ ${moduleName}: Proper exports in index.ts`);
      }

      // Check if index.ts exports correctly
      const uiExportMatch = content.match(
        /export\s+{[^}]*\b(\w*UI)\b[^}]*}\s+from\s+['"]\.\/ui['"]/
      );
      if (!uiExportMatch) {
        console.log(`  ⚠️  ${moduleName}: Missing UI export from './ui'`);
      }
    } catch (error) {
      console.log(`  ❌ ${moduleName}: Cannot read index.ts`);
    }
  }

  async generateReport() {
    console.log('📊 AUDIT REPORT');
    console.log('═'.repeat(80));

    console.log(`\n📈 Statistics:`);
    console.log(`  • Total Modules: ${this.stats.totalModules}`);
    console.log(`  • Complete Modules: ${this.stats.completeModules}`);
    console.log(`  • Issues Found: ${this.issues.length}`);

    if (this.issues.length > 0) {
      console.log(`\n❌ Issues Found (${this.issues.length}):`);

      // Group issues by type
      const groupedIssues = this.issues.reduce((acc, issue) => {
        if (!acc[issue.type]) acc[issue.type] = [];
        acc[issue.type].push(issue);
        return acc;
      }, {});

      Object.entries(groupedIssues).forEach(([type, issues]) => {
        console.log(`\n  📌 ${type} (${issues.length}):`);
        issues.forEach((issue) => {
          console.log(`    • ${issue.path}: ${issue.message}`);
        });
      });

      console.log(`\n💡 Recommendations:`);
      console.log(`  1. Run: node scripts/fix-structure.mjs`);
      console.log(`  2. Check the specific files mentioned above`);
      console.log(`  3. Run: node scripts/validate-deps.mjs for dependency analysis`);
    } else {
      console.log(`\n🎉 All checks passed! Your structure is modular and clean.`);
    }

    console.log('\n' + '═'.repeat(80));
  }
}

// Run audit
try {
  const auditor = new AuditTool();
  await auditor.run();
} catch (error) {
  console.error('❌ Error running audit:', error.message);
  process.exit(1);
}
