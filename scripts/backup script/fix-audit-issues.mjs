#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class SmartAuditFixer {
  constructor(projectRoot = process.cwd()) {
    this.projectRoot = projectRoot;
    this.srcPath = path.join(projectRoot, 'src');
    this.fixesApplied = [];
    this.auditResults = {
      crossModuleImports: [],
      badExports: [],
      missingFiles: [],
      structuralIssues: [],
    };
  }

  async run() {
    console.log('📦 SMART Module Structure Fixer\n');
    console.log('═'.repeat(80));

    console.log('🔍 Performing deep audit of project structure...\n');

    // 1. Deep audit semua module
    await this.performDeepAudit();

    // 2. Eksekusi fixes berdasarkan severity
    await this.executeStructuralFixes();

    // 3. Generate comprehensive report
    await this.generateAuditReport();
  }

  async performDeepAudit() {
    console.log('📊 AUDIT PHASE 1: Module Structure Analysis');

    // Cari semua module directories
    const modulesDir = path.join(this.srcPath, 'modules');

    try {
      const moduleDirs = await fs.readdir(modulesDir);

      for (const moduleName of moduleDirs) {
        const modulePath = path.join(modulesDir, moduleName);
        const stats = await fs.stat(modulePath);

        if (stats.isDirectory()) {
          console.log(`\n  📁 Module: ${moduleName}`);
          await this.auditSingleModule(moduleName, modulePath);
        }
      }
    } catch (error) {
      console.log(`⚠️  Error reading modules directory: ${error.message}`);
      console.log('  🏗️  Creating basic module structure...');
      await this.createBasicModuleStructure();
    }

    // Audit cross-module dependencies
    console.log('\n📊 AUDIT PHASE 2: Dependency Graph Analysis');
    await this.auditCrossModuleDependencies();

    // Audit export consistency
    console.log('\n📊 AUDIT PHASE 3: Export Consistency Check');
    await this.auditExportsConsistency();
  }

  async auditSingleModule(moduleName, modulePath) {
    const requiredFiles = ['index.ts', 'service.ts', 'store.ts', 'ui.tsx'];
    const moduleFiles = await fs.readdir(modulePath).catch(() => []);

    // Cek file yang ada
    for (const file of requiredFiles) {
      const filePath = path.join(modulePath, file);

      try {
        await fs.access(filePath);

        // Analisis konten file
        if (file === 'index.ts') {
          await this.analyzeIndexFile(moduleName, filePath);
        } else if (file === 'service.ts') {
          await this.analyzeServiceFile(moduleName, filePath);
        }
      } catch {
        this.auditResults.missingFiles.push({
          module: moduleName,
          file: file,
          severity: file === 'index.ts' ? 'high' : 'medium',
        });
        console.log(`    ⚠️  Missing: ${file}`);
      }
    }

    // Cek additional issues
    const hasNoExports = moduleFiles.length === 0;

    if (hasNoExports) {
      this.auditResults.structuralIssues.push({
        module: moduleName,
        issue: 'Module directory empty',
        severity: 'high',
      });
    }
  }

  async analyzeIndexFile(moduleName, filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const capitalized = this.capitalize(moduleName);

      // Cek export patterns
      const hasUIExport = content.includes(`${capitalized}UI`) || content.includes(`'./ui'`);
      const hasServiceExport = content.includes(`'./service'`);
      const hasStoreExport = content.includes(`'./store'`);

      if (!hasUIExport || !hasServiceExport || !hasStoreExport) {
        this.auditResults.badExports.push({
          module: moduleName,
          file: 'index.ts',
          missing: [
            !hasUIExport && 'UI export',
            !hasServiceExport && 'service export',
            !hasStoreExport && 'store export',
          ].filter(Boolean),
          severity: 'medium',
        });
      }

      // Cek export format (named vs default)
      const hasDefaultExport = content.includes('export default');
      const hasWildcardExport = content.includes('export * from');

      if (!hasWildcardExport && !hasDefaultExport) {
        this.auditResults.badExports.push({
          module: moduleName,
          file: 'index.ts',
          issue: 'No proper exports found',
          severity: 'high',
        });
      }
    } catch (error) {
      console.log(`    ❌ Error analyzing index.ts: ${error.message}`);
    }
  }

  async analyzeServiceFile(moduleName, filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');

      // Deteksi cross-module imports
      const importRegex = /from\s+['"](\.\.\/[^'"]+)['"]/g;
      const matches = [...content.matchAll(importRegex)];

      matches.forEach((match) => {
        const importPath = match[1];
        if (
          importPath.includes('../') &&
          !importPath.includes('../core/') &&
          !importPath.includes('../shared/')
        ) {
          const importedModule = importPath.split('/')[1];

          if (importedModule && importedModule !== moduleName) {
            this.auditResults.crossModuleImports.push({
              from: moduleName,
              to: importedModule,
              file: 'service.ts',
              severity: 'high',
            });
          }
        }
      });

      // Cek apakah service menggunakan getTempoClient dengan benar
      const usesTempo = content.includes('getTempoClient');
      const hasTempoImport = content.includes('from') && content.includes('tempo');

      if (usesTempo && !hasTempoImport) {
        this.auditResults.structuralIssues.push({
          module: moduleName,
          file: 'service.ts',
          issue: 'Uses getTempoClient but missing import',
          severity: 'medium',
        });
      }
    } catch (error) {
      console.log(`    ❌ Error analyzing service.ts: ${error.message}`);
    }
  }

  async auditCrossModuleDependencies() {
    try {
      // Baca semua file TypeScript dengan cara manual (tanpa glob)
      const tsFiles = await this.findAllTypeScriptFiles();
      console.log(`  Found ${tsFiles.length} TypeScript files`);

      const dependencyMap = new Map();

      for (const file of tsFiles.slice(0, 50)) {
        // Batasi untuk performa
        try {
          const fullPath = path.join(this.projectRoot, file);
          const content = await fs.readFile(fullPath, 'utf-8');
          const imports = this.extractImports(content);

          dependencyMap.set(file, {
            imports,
            isCore: file.includes('core/'),
            isShared: file.includes('shared/'),
            isModule: file.includes('modules/'),
          });
        } catch (error) {
          // Skip file yang tidak bisa dibaca
        }
      }

      // Analisis circular dependencies sederhana
      await this.detectSimpleCircularDependencies(dependencyMap);
    } catch (error) {
      console.log(`  ⚠️  Dependency analysis skipped: ${error.message}`);
    }
  }

  async findAllTypeScriptFiles() {
    const files = [];

    try {
      // Rekursif cari file .ts dan .tsx
      await this.findFilesRecursive(this.srcPath, files);
    } catch (error) {
      console.log(`  ⚠️  File search limited: ${error.message}`);
    }

    return files;
  }

  async findFilesRecursive(dir, files) {
    try {
      const items = await fs.readdir(dir);

      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stats = await fs.stat(fullPath);

        if (stats.isDirectory()) {
          // Skip node_modules dan dist
          if (!item.includes('node_modules') && !item.includes('dist') && !item.includes('build')) {
            await this.findFilesRecursive(fullPath, files);
          }
        } else if (item.endsWith('.ts') || item.endsWith('.tsx')) {
          // Simpan path relatif
          const relativePath = path.relative(this.projectRoot, fullPath);
          files.push(relativePath);
        }
      }
    } catch (error) {
      // Ignore directory yang tidak bisa dibaca
    }
  }

  extractImports(content) {
    const imports = [];
    const importRegex = /from\s+['"](\.\.?\/[^'"]+)['"]/g;
    const matches = [...content.matchAll(importRegex)];

    matches.forEach((match) => {
      imports.push(match[1]);
    });

    return imports;
  }

  async detectSimpleCircularDependencies(dependencyMap) {
    const cycles = [];

    // Simple check untuk circular dependencies yang jelas
    for (const [file, data] of dependencyMap.entries()) {
      if (data.isModule) {
        for (const imp of data.imports) {
          if (imp.includes('modules/')) {
            const importedFile = dependencyMap.get(imp);
            if (importedFile && importedFile.imports.includes(file)) {
              cycles.push([file, imp]);
            }
          }
        }
      }
    }

    if (cycles.length > 0) {
      console.log(`\n  ⚠️  Found ${cycles.length} potential circular dependencies:`);
      cycles.slice(0, 3).forEach((cycle, idx) => {
        console.log(`    ${idx + 1}. ${cycle[0]} ↔ ${cycle[1]}`);
        this.auditResults.structuralIssues.push({
          issue: `Circular dependency detected`,
          cycle: cycle,
          severity: 'high',
        });
      });
    } else {
      console.log('  ✅ No circular dependencies found');
    }
  }

  async auditExportsConsistency() {
    const modulesDir = path.join(this.srcPath, 'modules');

    try {
      const moduleDirs = await fs.readdir(modulesDir);
      const exportPatterns = new Map();

      for (const moduleName of moduleDirs) {
        const indexPath = path.join(modulesDir, moduleName, 'index.ts');

        try {
          await fs.access(indexPath);
          const content = await fs.readFile(indexPath, 'utf-8');
          const pattern = this.detectExportPattern(content);
          exportPatterns.set(moduleName, pattern);
        } catch {
          exportPatterns.set(moduleName, 'none');
        }
      }

      // Cek konsistensi
      const patterns = [...new Set(exportPatterns.values())];

      if (patterns.length > 1) {
        console.log(`  ⚠️  Inconsistent export patterns detected`);
        this.auditResults.structuralIssues.push({
          issue: 'Inconsistent export patterns across modules',
          patterns: Object.fromEntries(exportPatterns),
          severity: 'medium',
        });
      } else {
        console.log('  ✅ Consistent export patterns');
      }
    } catch (error) {
      console.log(`  ❌ Error checking export consistency: ${error.message}`);
    }
  }

  detectExportPattern(content) {
    if (content.includes('export * from')) return 'wildcard';
    if (content.includes('export {')) return 'named';
    if (content.includes('export default')) return 'default';
    return 'mixed';
  }

  // ========== FIXING METHODS ==========

  async executeStructuralFixes() {
    console.log('\n🛠️  EXECUTING STRUCTURAL FIXES\n');

    // Priority 1: Fix missing files (high severity)
    if (this.auditResults.missingFiles.length > 0) {
      console.log('🔧 FIXING MISSING FILES:');
      await this.fixMissingFiles();
    }

    // Priority 2: Fix bad exports
    if (this.auditResults.badExports.length > 0) {
      console.log('\n🔧 FIXING EXPORT STRUCTURE:');
      await this.fixBadExports();
    }

    // Priority 3: Fix cross-module imports
    if (this.auditResults.crossModuleImports.length > 0) {
      console.log('\n🔧 REFACTORING CROSS-MODULE IMPORTS:');
      await this.refactorCrossModuleImports();
    }

    // Priority 4: Fix structural issues
    if (this.auditResults.structuralIssues.length > 0) {
      console.log('\n🔧 FIXING STRUCTURAL ISSUES:');
      await this.fixStructuralIssues();
    }

    // Always create/update shared modules
    console.log('\n🔧 ENSURING SHARED STRUCTURE:');
    await this.ensureSharedModules();
  }

  async fixMissingFiles() {
    const highPriority = this.auditResults.missingFiles.filter((f) => f.severity === 'high');
    const mediumPriority = this.auditResults.missingFiles.filter((f) => f.severity === 'medium');

    // Fix high priority first (index.ts files)
    for (const { module, file } of highPriority) {
      await this.createModuleFile(module, file);
    }

    // Fix medium priority
    for (const { module, file } of mediumPriority) {
      await this.createModuleFile(module, file);
    }
  }

  async createModuleFile(moduleName, fileName) {
    const modulePath = path.join(this.srcPath, 'modules', moduleName);
    const filePath = path.join(modulePath, fileName);
    const capitalized = this.capitalize(moduleName);

    console.log(`  📄 ${moduleName}/${fileName}:`);

    try {
      await fs.mkdir(modulePath, { recursive: true });

      const templates = {
        'index.ts': `// ${capitalized} Module Exports
export { ${capitalized}UI } from './ui';
export * from './service';
export * from './store';\n`,

        'service.ts': `// ${capitalized} Service
import { getTempoClient } from '../../core/tempo';

export interface ${capitalized}Item {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export async function fetch${capitalized}Data(): Promise<${capitalized}Item[]> {
  const client = getTempoClient();
  console.log('Fetching ${moduleName} data with client:', client);
  
  // TODO: Implement actual data fetching
  return [];
}

export async function create${capitalized}Item(data: Omit<${capitalized}Item, 'id' | 'createdAt' | 'updatedAt'>) {
  // TODO: Implement creation logic
  return {
    id: Date.now().toString(),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...data
  } as ${capitalized}Item;
}\n`,

        'store.ts': `// ${capitalized} Store
import { create } from 'zustand';
import { fetch${capitalized}Data, create${capitalized}Item, ${capitalized}Item } from './service';

interface ${capitalized}State {
  items: ${capitalized}Item[];
  loading: boolean;
  error: string | null;
  selectedItem: ${capitalized}Item | null;
  
  loadItems: () => Promise<void>;
  createItem: (data: Omit<${capitalized}Item, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  selectItem: (item: ${capitalized}Item | null) => void;
  clearError: () => void;
}

export const use${capitalized}Store = create<${capitalized}State>((set) => ({
  items: [],
  loading: false,
  error: null,
  selectedItem: null,
  
  loadItems: async () => {
    set({ loading: true, error: null });
    try {
      const items = await fetch${capitalized}Data();
      set({ items, loading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load items',
        loading: false 
      });
    }
  },
  
  createItem: async (data) => {
    set({ loading: true, error: null });
    try {
      const newItem = await create${capitalized}Item(data);
      set((state) => ({
        items: [...state.items, newItem],
        loading: false
      }));
      return newItem;
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Failed to create item',
        loading: false 
      });
      throw error;
    }
  },
  
  selectItem: (item) => set({ selectedItem: item }),
  clearError: () => set({ error: null }),
}));\n`,

        'ui.tsx': `// ${capitalized} UI Component
import React from 'react';
import { use${capitalized}Store } from './store';

export function ${capitalized}UI() {
  const { items, loading, error, loadItems } = use${capitalized}Store();
  
  React.useEffect(() => {
    loadItems();
  }, []);
  
  if (loading) {
    return (
      <div className="${moduleName}-loading">
        <p>Loading ${moduleName} data...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="${moduleName}-error">
        <p>Error: {error}</p>
        <button onClick={loadItems}>Retry</button>
      </div>
    );
  }
  
  return (
    <div className="${moduleName}-module">
      <h2>${capitalized} Module</h2>
      <div className="${moduleName}-stats">
        <p>Total items: {items.length}</p>
      </div>
      <div className="${moduleName}-list">
        {items.map((item) => (
          <div key={item.id} className="${moduleName}-item">
            <h3>{item.id}</h3>
            <p>Created: {item.createdAt.toLocaleDateString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}\n`,
      };

      if (templates[fileName]) {
        await fs.writeFile(filePath, templates[fileName]);
        console.log(`    ✅ Created ${fileName}`);
        this.recordFix(`created_${fileName}`, `${moduleName}/${fileName}`);
      } else {
        console.log(`    ⚠️  No template for ${fileName}`);
      }
    } catch (error) {
      console.log(`    ❌ Failed to create ${fileName}: ${error.message}`);
    }
  }

  async fixBadExports() {
    for (const { module, file, missing } of this.auditResults.badExports) {
      if (file === 'index.ts') {
        console.log(`  📄 Fixing ${module}/index.ts exports...`);
        await this.fixModuleIndexExports(module, missing);
      }
    }
  }

  async fixModuleIndexExports(moduleName, missingExports) {
    const indexPath = path.join(this.srcPath, 'modules', moduleName, 'index.ts');
    const capitalized = this.capitalize(moduleName);

    try {
      // Buat template ekspor yang benar
      const correctExports = `// ${capitalized} Module Exports
export { ${capitalized}UI } from './ui';
export * from './service';
export * from './store';\n`;

      await fs.writeFile(indexPath, correctExports);
      console.log(`    ✅ Fixed exports in ${moduleName}/index.ts`);
      this.recordFix('fixed_exports', `${moduleName}/index.ts`);
    } catch (error) {
      console.log(`    ❌ Failed to fix exports: ${error.message}`);
    }
  }

  async refactorCrossModuleImports() {
    for (const { from, to, file } of this.auditResults.crossModuleImports) {
      console.log(`  🔄 Refactoring ${from}/${file}: imports from ${to}`);

      const filePath = path.join(this.srcPath, 'modules', from, file);

      try {
        let content = await fs.readFile(filePath, 'utf-8');

        // Update import untuk pakai shared module
        content = content.replace(
          new RegExp(`from\\s+['"]\\.\\./${to}[^'"]*['"]`, 'g'),
          `from '../../shared/${to}'`
        );

        await fs.writeFile(filePath, content);
        console.log(`    ✅ Refactored to use shared/${to}`);
        this.recordFix('refactored_import', `${from}/${file}`);
      } catch (error) {
        console.log(`    ❌ Failed to refactor: ${error.message}`);
      }
    }
  }

  async fixStructuralIssues() {
    for (const issue of this.auditResults.structuralIssues) {
      if (issue.issue?.includes('Circular dependency')) {
        console.log(`  ⚠️  Circular dependency detected: ${issue.cycle?.join(' ↔ ')}`);
        console.log(`    💡 Recommendation: Introduce shared module or refactor dependencies`);
      } else if (issue.issue?.includes('Uses getTempoClient')) {
        console.log(`  🔧 Fixing missing tempo import in ${issue.module}/${issue.file}`);
        await this.fixMissingTempoImport(issue.module, issue.file);
      }
    }
  }

  async fixMissingTempoImport(moduleName, fileName) {
    const filePath = path.join(this.srcPath, 'modules', moduleName, fileName);

    try {
      let content = await fs.readFile(filePath, 'utf-8');

      if (content.includes('getTempoClient') && !content.includes('from')) {
        const importLine = `import { getTempoClient } from '../../core/tempo';\n`;
        content = importLine + content;

        await fs.writeFile(filePath, content);
        console.log(`    ✅ Added missing tempo import`);
        this.recordFix('added_tempo_import', `${moduleName}/${fileName}`);
      }
    } catch (error) {
      console.log(`    ❌ Failed to fix import: ${error.message}`);
    }
  }

  async ensureSharedModules() {
    console.log('  📁 Ensuring shared and core structure...');

    const directories = [
      'src/shared',
      'src/core',
      'src/core/tempo',
      'src/core/store',
      'src/core/types',
    ];

    for (const dir of directories) {
      const dirPath = path.join(this.projectRoot, dir);

      try {
        await fs.mkdir(dirPath, { recursive: true });
        console.log(`    ✅ ${dir}/`);
      } catch (error) {
        // Directory sudah ada
      }
    }

    // Buat basic shared utilities jika belum ada
    await this.createBasicSharedUtilities();
  }

  async createBasicSharedUtilities() {
    const sharedUtilsPath = path.join(this.srcPath, 'shared', 'utils.ts');

    try {
      await fs.access(sharedUtilsPath);
      console.log(`    ℹ️  Shared utils already exist`);
    } catch {
      const utilsContent = `// Shared utilities
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatCurrency = (amount: number, currency = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};\n`;

      await fs.writeFile(sharedUtilsPath, utilsContent);
      console.log(`    ✅ Created shared/utils.ts`);
      this.recordFix('created_utils', 'shared/utils.ts');
    }
  }

  // ========== HELPER METHODS ==========

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  recordFix(type, file) {
    this.fixesApplied.push({ type, file });
  }

  async createBasicModuleStructure() {
    console.log('\n  🏗️  Creating basic module structure...');

    const basicModules = ['accounts', 'transactions', 'exchange', 'payments'];

    for (const module of basicModules) {
      const modulePath = path.join(this.srcPath, 'modules', module);

      try {
        await fs.mkdir(modulePath, { recursive: true });
        console.log(`    ✅ Created ${module}/ directory`);

        // Buat file dasar
        await this.createModuleFile(module, 'index.ts');
        await this.createModuleFile(module, 'service.ts');
        await this.createModuleFile(module, 'store.ts');
        await this.createModuleFile(module, 'ui.tsx');
      } catch (error) {
        console.log(`    ❌ Failed to create ${module}: ${error.message}`);
      }
    }
  }

  async generateAuditReport() {
    console.log('\n📋 SMART AUDIT REPORT');
    console.log('═'.repeat(80));

    // Summary statistics
    const totalIssues =
      this.auditResults.missingFiles.length +
      this.auditResults.badExports.length +
      this.auditResults.crossModuleImports.length +
      this.auditResults.structuralIssues.length;

    console.log(`\n📊 Audit Results:`);
    console.log(`  • Missing files: ${this.auditResults.missingFiles.length}`);
    console.log(`  • Bad exports: ${this.auditResults.badExports.length}`);
    console.log(`  • Cross-module imports: ${this.auditResults.crossModuleImports.length}`);
    console.log(`  • Structural issues: ${this.auditResults.structuralIssues.length}`);
    console.log(`  • Total issues found: ${totalIssues}`);

    if (this.fixesApplied.length > 0) {
      console.log(`\n✅ Fixes Applied (${this.fixesApplied.length}):`);

      const grouped = this.fixesApplied.reduce((acc, fix) => {
        const type = fix.type.replace(/created_|fixed_|refactored_/, '');
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      Object.entries(grouped).forEach(([type, count]) => {
        console.log(`  • ${type}: ${count}`);
      });

      // Detail per module
      console.log('\n📁 Module Status:');
      const modulesDir = path.join(this.srcPath, 'modules');

      try {
        const modules = await fs.readdir(modulesDir);
        for (const module of modules) {
          const modulePath = path.join(modulesDir, module);
          const stats = await fs.stat(modulePath);

          if (stats.isDirectory()) {
            try {
              const files = await fs.readdir(modulePath);
              const requiredFiles = ['index.ts', 'service.ts', 'store.ts', 'ui.tsx'];
              const missingFiles = requiredFiles.filter((f) => !files.includes(f));

              if (missingFiles.length === 0) {
                console.log(`  • ${module}: ✅ Complete`);
              } else {
                console.log(`  • ${module}: ⚠️  Missing: ${missingFiles.join(', ')}`);
              }
            } catch (error) {
              console.log(`  • ${module}: ❌ Cannot read`);
            }
          }
        }
      } catch (error) {
        console.log(`  ℹ️  Cannot read modules directory: ${error.message}`);
      }
    } else {
      console.log('\n🎉 No fixes needed! Project structure looks good.');
    }

    console.log('\n💡 RECOMMENDATIONS:');
    console.log('\n1. For Cross-Module Imports:');
    console.log('   • Move shared business logic to src/shared/');
    console.log('   • Move UI components to src/shared/components/');
    console.log('   • Move types to src/core/types/');

    console.log('\n2. For Module Structure:');
    console.log('   • Each module should have: index.ts, service.ts, store.ts, ui.tsx');
    console.log('   • Services handle business logic and API calls');
    console.log('   • Stores manage local state with Zustand');
    console.log('   • UI components are React components');

    console.log('\n3. For Type Safety:');
    console.log('   • Define interfaces in service.ts files');
    console.log('   • Use proper TypeScript generics where needed');
    console.log('   • Consider creating src/core/types/index.ts for global types');

    console.log('\n🔧 Quick Commands:');
    console.log('   • Check module imports: grep -r "from ../" src/modules/');
    console.log('   • Find missing files: find src/modules -type f -name "*.ts" | wc -l');
    console.log('   • Validate exports: npx tsc --noEmit --project src/modules/');

    console.log('\n🚀 Next Steps:');
    console.log('   1. Implement TODO comments in service files');
    console.log('   2. Connect services to actual Tempo blockchain');
    console.log('   3. Style UI components');
    console.log('   4. Add error handling and loading states');

    console.log('\n' + '═'.repeat(80));
  }
}

// Run the fixer
try {
  const fixer = new SmartAuditFixer();
  await fixer.run();
} catch (error) {
  console.error('❌ Error running audit fixer:', error.message);
  process.exit(1);
}
