#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class DependencyValidator {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.violations = [];
  }

  async run() {
    console.log('🔗 Validating Dependency Flow...\n');

    console.log('📋 RULES TO CHECK:');
    console.log('  1. UI → Store → Service → Core ✅');
    console.log('  2. No cross-module imports ❌');
    console.log('  3. UI no direct core access ✅\n');

    await this.checkAllModules();
    this.generateReport();
  }

  async checkAllModules() {
    const modulesDir = path.join(this.projectRoot, 'src/modules');

    try {
      const modules = await fs.readdir(modulesDir);

      for (const module of modules) {
        const modulePath = path.join(modulesDir, module);
        const stat = await fs.stat(modulePath);

        if (stat.isDirectory()) {
          await this.checkModule(module, modulePath);
        }
      }
    } catch (error) {
      console.log(`❌ Cannot read modules: ${error.message}`);
    }
  }

  async checkModule(moduleName, modulePath) {
    console.log(`📦 Checking module: ${moduleName}`);

    const files = ['ui.tsx', 'store.ts', 'service.ts'];

    for (const file of files) {
      const filePath = path.join(modulePath, file);

      try {
        await fs.access(filePath);
        const content = await fs.readFile(filePath, 'utf-8');

        await this.validateFile(moduleName, file, content);
      } catch (error) {
        console.log(`  ⚠️  Missing ${file}`);
      }
    }
  }

  async validateFile(moduleName, fileName, content) {
    // Check for cross-module imports
    const crossModuleRegex = /from\s+['"]\.\.\/[^/]+/g;
    const matches = content.match(crossModuleRegex) || [];

    for (const match of matches) {
      const importPath = match.replace(/from\s+['"]/, '').replace(/['"]/, '');
      if (
        importPath.startsWith('../') &&
        !importPath.includes('../core/') &&
        !importPath.includes('../shared/')
      ) {
        const importedModule = importPath.split('/')[1];
        if (importedModule && importedModule !== moduleName) {
          this.violations.push({
            module: moduleName,
            file: fileName,
            issue: 'Cross-module import',
            details: `Imports from ${importedModule} module`,
          });
        }
      }
    }

    // Check UI direct core access
    if (fileName === 'ui.tsx') {
      const coreImports = /from\s+['"]\.\.\/\.\.\/core|getTempoClient|useAppStore/;
      if (coreImports.test(content)) {
        this.violations.push({
          module: moduleName,
          file: fileName,
          issue: 'UI direct core access',
          details: 'UI should not import from core directly',
        });
      }
    }

    // Check service core access (should have)
    if (fileName === 'service.ts') {
      const hasTempoImport = /getTempoClient|from\s+['"]\.\.\/\.\.\/core\/tempo/.test(content);
      if (!hasTempoImport && !content.includes('// TODO') && !content.includes('TODO')) {
        this.violations.push({
          module: moduleName,
          file: fileName,
          issue: 'Service missing core access',
          details: 'Service should import from core/tempo',
        });
      }
    }

    // Check store violations
    if (fileName === 'store.ts') {
      // Should not import from core
      const coreImports = /from\s+['"]\.\.\/\.\.\/core|getTempoClient/;
      if (coreImports.test(content)) {
        this.violations.push({
          module: moduleName,
          file: fileName,
          issue: 'Store direct core access',
          details: 'Store should not import from core directly',
        });
      }

      // Should not import from ui
      const uiImports = /from\s+['"]\.\/ui/;
      if (uiImports.test(content)) {
        this.violations.push({
          module: moduleName,
          file: fileName,
          issue: 'Store UI import',
          details: 'Store should not import from UI',
        });
      }
    }
  }

  generateReport() {
    console.log('\n📊 DEPENDENCY VALIDATION REPORT');
    console.log('═'.repeat(80));

    if (this.violations.length > 0) {
      console.log(`\n❌ Found ${this.violations.length} violations:\n`);

      // Group by module
      const grouped = this.violations.reduce((acc, violation) => {
        if (!acc[violation.module]) acc[violation.module] = [];
        acc[violation.module].push(violation);
        return acc;
      }, {});

      Object.entries(grouped).forEach(([module, violations]) => {
        console.log(`📌 Module: ${module}`);
        violations.forEach((v) => {
          console.log(`  • ${v.file}: ${v.issue}`);
          console.log(`    ${v.details}`);
        });
        console.log('');
      });

      console.log('💡 Recommendations:');
      console.log('  1. Fix cross-module imports - use services instead');
      console.log('  2. Ensure UI only accesses store, not core');
      console.log('  3. Services should handle all core/tempo access');
      console.log('  4. Stores should only manage state, not external logic');
    } else {
      console.log('\n✅ All dependency rules are satisfied!');
      console.log('🎉 Your modular structure follows best practices.');
    }

    console.log('\n' + '═'.repeat(80));
  }
}

// Run validator
try {
  const validator = new DependencyValidator();
  await validator.run();
} catch (error) {
  console.error('❌ Error running validator:', error.message);
  process.exit(1);
}
