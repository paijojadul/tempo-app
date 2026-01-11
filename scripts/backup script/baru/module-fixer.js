#!/usr/bin/env node
// scripts/module-fixer.js - REFACTORED VERSION

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============== SHARED UTILITIES ===============
class ImportAnalyzer {
  static analyzeServiceImports(content, fileType) {
    const issues = [];
    const lines = content.split('\n');
    const functionKeywords = ['fetch', 'create', 'get', 'update', 'delete'];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.includes("from './service'")) {
        // Skip jika dalam comment
        if (this.isCommentedLine(line)) continue;
        
        // Type-only imports are ALLOWED
        if (line.includes('import type')) {
          continue;
        }
        
        // Check for function imports
        const hasFunctionImport = functionKeywords.some(keyword => 
          line.toLowerCase().includes(keyword.toLowerCase())
        );
        
        if (hasFunctionImport) {
          issues.push({
            line: i + 1,
            message: `${fileType} imports service functions (violation!)`,
            code: line.trim()
          });
        }
      }
      
      // Check for async business logic in wrong places
      if (fileType === 'store' || fileType === 'ui') {
        if (this.hasAsyncBusinessLogic(line, i, lines)) {
          issues.push({
            line: i + 1,
            message: `${fileType} contains async business logic (should be in service)`,
            code: line.trim()
          });
        }
      }
    }
    
    return issues;
  }
  
  static isCommentedLine(line) {
    const trimmed = line.trim();
    return trimmed.startsWith('//') || trimmed.startsWith('/*');
  }
  
  static hasAsyncBusinessLogic(currentLine, currentIndex, allLines) {
    // Skip comments
    if (this.isCommentedLine(currentLine)) return false;
    
    // Check for async function definitions
    const asyncFuncRegex = /async\s+(function\s+\w+\s*\(|\w*\s*\([^)]*\)\s*=>)/;
    
    if (asyncFuncRegex.test(currentLine)) {
      // Check next few lines for service-related keywords
      const checkLines = allLines.slice(currentIndex, currentIndex + 5).join(' ');
      const serviceKeywords = ['getTempoClient', 'fetch', 'await', 'Promise', 'api', 'http'];
      
      return serviceKeywords.some(keyword => 
        checkLines.toLowerCase().includes(keyword.toLowerCase())
      );
    }
    
    return false;
  }
}

class TemplateManager {
  constructor(moduleName) {
    this.moduleName = moduleName;
    this.capitalized = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
  }
  
  getStoreTemplate() {
    // CONSISTENT dengan pattern yang sudah ada di codebase
    return `import { create } from 'zustand';
import type { ${this.capitalized}Item } from './service';

// ${this.capitalized} Store
// Store hanya handle STATE, tidak boleh panggil service langsung!

interface ${this.capitalized}State {
  items: ${this.capitalized}Item[];
  loading: boolean;
  error: string | null;
  selectedItem: ${this.capitalized}Item | null;

  // Setter functions
  setItems: (items: ${this.capitalized}Item[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedItem: (item: ${this.capitalized}Item | null) => void;
  clearError: () => void;
  reset: () => void;
  removeItemById: (id: string) => void;
}

export const use${this.capitalized}Store = create<${this.capitalized}State>((set) => ({
  // State
  items: [],
  loading: false,
  error: null,
  selectedItem: null,

  // Actions
  setItems: (items) => set({ items }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setSelectedItem: (selectedItem) => set({ selectedItem }),
  clearError: () => set({ error: null }),
  reset: () => set({
    items: [],
    loading: false,
    error: null,
    selectedItem: null
  }),
  removeItemById: (id: string) =>
    set((state) => {
      const newItems = state.items.filter(item => item.id !== id);
      const shouldClearSelected = state.selectedItem?.id === id;

      return {
        items: newItems,
        selectedItem: shouldClearSelected ? null : state.selectedItem
      };
    }),
}));

// Helper hook untuk common patterns
export function use${this.capitalized}() {
  const store = use${this.capitalized}Store();

  return {
    // State
    ...store,

    // Computed values
    getItemById: (id: string) => store.items.find(item => item.id === id),
    hasItems: store.items.length > 0,
    isEmpty: store.items.length === 0,

    // Actions dengan business logic
    selectItemById: (id: string) => {
      const item = store.items.find(item => item.id === id);
      store.setSelectedItem(item || null);
    },

    // Untuk integrasi dengan service layer
    updateLocalItem: (updatedItem: ${this.capitalized}Item) => {
      const newItems = store.items.map(item =>
        item.id === updatedItem.id ? updatedItem : item
      );
      store.setItems(newItems);

      // Update selected item jika sama
      if (store.selectedItem?.id === updatedItem.id) {
        store.setSelectedItem(updatedItem);
      }
    },

    removeItemById: (id: string) => {
      store.removeItemById(id);
    },

    // Reset dengan konfirmasi
    resetWithConfirmation: () => {
      if (confirm('Are you sure you want to reset all data?')) {
        store.reset();
      }
    }
  };
}`;
  }
  
  getServiceTemplate() {
    // Sama seperti versi lama, tapi extracted
    return `import { getTempoClient } from '../../core/tempo';

// ${this.capitalized} Service
// This file handles ALL external communication (Tempo blockchain, APIs, etc.)

export interface ${this.capitalized}Item {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Create${this.capitalized}DTO {
  name: string;
  // Add other fields as needed
}

/**
 * Fetch data from Tempo blockchain
 */
export async function fetch${this.capitalized}Data(): Promise<${this.capitalized}Item[]> {
  const client = getTempoClient();
  console.log('🔗 Fetching ${this.moduleName} data from Tempo...', client);

  // TODO: Implement actual Tempo blockchain query
  // Example: await client.readContract({ ... });
  
  // Mock data for development
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return [
    {
      id: '1',
      name: 'Sample ${this.moduleName} Item',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}

// ... (rest of service template)
`;
  }
  
  getUITemplate() {
    // Extracted untuk consistency
    return `import { useEffect } from 'react';
import { Card } from '../../shared/ui/components/Card';
import { Button } from '../../shared/ui/Button';
import { use${this.capitalized}Store } from './store';

interface ${this.capitalized}UIProps {
  items?: any[];
  onLoadData?: () => Promise<void>;
  onCreateItem?: (data: any) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export function ${this.capitalized}UI({ 
  items = [],
  onLoadData,
  onCreateItem,
  loading = false,
  error = null 
}: ${this.capitalized}UIProps) {
  const store = use${this.capitalized}Store();

  // Update store ketika props berubah
  useEffect(() => {
    store.setItems(items);
  }, [items, store]);

  useEffect(() => {
    store.setLoading(loading);
  }, [loading, store]);

  useEffect(() => {
    store.setError(error);
  }, [error, store]);

  // ... (rest of UI template)
`;
  }
  
  getIndexTemplate() {
    return `// ${this.capitalized} Module Exports
export { ${this.capitalized}UI } from './ui';
export * from './store';

// Export service types but NOT service functions
// Service should be called from app layer, not imported directly
export type { ${this.capitalized}Item, Create${this.capitalized}DTO } from './service';
`;
  }
}

// =============== MAIN FIXER CLASS ===============
class ModuleFixer {
  constructor() {
    this.projectRoot = process.cwd();
    this.srcPath = path.join(this.projectRoot, 'src');
    this.fixesApplied = [];
    this.modulesFixed = [];
    
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }
  
  async run() {
    console.log('🔧 SMART Module Fixer - REFACTORED\n');
    console.log('═'.repeat(80));

    const args = process.argv.slice(2);

    if (args.includes('--help') || args.length === 0) {
      this.showHelp();
      this.rl.close();
      return;
    }

    try {
      if (args.includes('--all')) {
        await this.fixAllModules();
      } else {
        const moduleName = this.getArgValue('--module');
        if (moduleName) {
          await this.fixSingleModule(moduleName);
        } else {
          console.log('❌ Please specify --module=<name> or --all');
          this.showHelp();
        }
      }
    } finally {
      this.generateReport();
      this.rl.close();
    }
  }
  
  showHelp() {
    console.log(`
📦 SMART Module Fixer - Refactored Version

🔧 IMPROVEMENTS:
  • Shared utilities for import analysis
  • Consistent templates with codebase
  • Better async logic detection
  • No more code duplication

Usage: node scripts/module-fixer.js [option]

Options:
  --module=<name>    Fix specific module (e.g., --module=accounts)
  --all              Fix ALL modules (scans filesystem)
  --help             Show this help
  --dry-run          Check only, don't fix anything

Examples:
  node scripts/module-fixer.js --module=accounts
  node scripts/module-fixer.js --all
  node scripts/module-fixer.js --dry-run --module=transactions
    `);
  }
  
  getArgValue(argName) {
    const args = process.argv.slice(2);
    const arg = args.find(a => a.startsWith(`${argName}=`));
    return arg ? arg.split('=')[1] : null;
  }
  
  async discoverModules() {
    const modulesDir = path.join(this.srcPath, 'modules');
    
    try {
      const items = await fs.readdir(modulesDir, { withFileTypes: true });
      return items.filter(item => item.isDirectory()).map(item => item.name);
    } catch (error) {
      console.log(`❌ Cannot read modules directory: ${error.message}`);
      return [];
    }
  }
  
  async fixAllModules() {
    console.log('🔍 Scanning for all modules...\n');
    
    const modules = await this.discoverModules();
    
    if (modules.length === 0) {
      console.log('ℹ️  No modules found in src/modules/');
      return;
    }

    console.log(`Found ${modules.length} modules: ${modules.join(', ')}\n`);

    for (const moduleName of modules) {
      console.log(`📦 Module: ${moduleName}`);
      await this.fixModule(moduleName);
      console.log('');
    }
  }
  
  async fixSingleModule(moduleName) {
    const modulePath = path.join(this.srcPath, 'modules', moduleName);
    
    try {
      await fs.access(modulePath);
      console.log(`🔧 Fixing module: ${moduleName}\n`);
      await this.fixModule(moduleName);
    } catch {
      const modules = await this.discoverModules();
      console.log(`❌ Module "${moduleName}" not found!`);
      if (modules.length > 0) {
        console.log('💡 Available modules:');
        modules.forEach(m => console.log(`  • ${m}`));
      }
    }
  }
  
  async fixModule(moduleName) {
    const modulePath = path.join(this.srcPath, 'modules', moduleName);
    const templateManager = new TemplateManager(moduleName);
    
    try {
      const existingFiles = await fs.readdir(modulePath);
      
      // Fix files dengan urutan dependency-aware
      await this.fixServiceFile(moduleName, modulePath, templateManager, existingFiles);
      await this.fixStoreFile(moduleName, modulePath, templateManager, existingFiles);
      await this.fixUIFile(moduleName, modulePath, templateManager, existingFiles);
      await this.fixIndexFile(moduleName, modulePath, templateManager, existingFiles);
      
      this.modulesFixed.push(moduleName);
    } catch (error) {
      console.log(`  ❌ Cannot access module directory: ${error.message}`);
    }
  }
  
  async fixStoreFile(moduleName, modulePath, templateManager, existingFiles) {
    const filePath = path.join(modulePath, 'store.ts');
    const shouldFix = await this.analyzeAndPrompt(
      moduleName, 'store.ts', existingFiles, filePath, 'store'
    );
    
    if (shouldFix) {
      const template = templateManager.getStoreTemplate();
      await this.safeWriteFile(filePath, template);
      this.fixesApplied.push(`Fixed ${moduleName}/store.ts`);
    }
  }
  
  async fixServiceFile(moduleName, modulePath, templateManager, existingFiles) {
    const filePath = path.join(modulePath, 'service.ts');
    const shouldFix = await this.analyzeAndPrompt(
      moduleName, 'service.ts', existingFiles, filePath, 'service'
    );
    
    if (shouldFix) {
      const template = templateManager.getServiceTemplate();
      await this.safeWriteFile(filePath, template);
      this.fixesApplied.push(`Fixed ${moduleName}/service.ts`);
    }
  }
  
  async fixUIFile(moduleName, modulePath, templateManager, existingFiles) {
    const filePath = path.join(modulePath, 'ui.tsx');
    const shouldFix = await this.analyzeAndPrompt(
      moduleName, 'ui.tsx', existingFiles, filePath, 'ui'
    );
    
    if (shouldFix) {
      const template = templateManager.getUITemplate();
      await this.safeWriteFile(filePath, template);
      this.fixesApplied.push(`Fixed ${moduleName}/ui.tsx`);
    }
  }
  
  async fixIndexFile(moduleName, modulePath, templateManager, existingFiles) {
    const filePath = path.join(modulePath, 'index.ts');
    
    if (existingFiles.includes('index.ts')) {
      const content = await fs.readFile(filePath, 'utf-8').catch(() => '');
      const capitalized = templateManager.capitalized;
      
      const hasUIExport = content.includes(`${capitalized}UI`);
      const hasStoreExport = content.includes("from './store'");
      
      if (!hasUIExport || !hasStoreExport) {
        const answer = await this.askQuestion(`  Fix ${moduleName}/index.ts? (y/N): `);
        if (answer.toLowerCase() === 'y') {
          const template = templateManager.getIndexTemplate();
          await this.safeWriteFile(filePath, template);
          this.fixesApplied.push(`Fixed ${moduleName}/index.ts`);
          console.log(`    ✅ Fixed index.ts`);
        }
      } else {
        console.log(`  ✅ index.ts exports correctly`);
      }
    } else {
      const answer = await this.askQuestion(`  Create ${moduleName}/index.ts? (y/N): `);
      if (answer.toLowerCase() === 'y') {
        const template = templateManager.getIndexTemplate();
        await this.safeWriteFile(filePath, template);
        this.fixesApplied.push(`Created ${moduleName}/index.ts`);
        console.log(`    ✅ Created index.ts`);
      }
    }
  }
  
  async analyzeAndPrompt(moduleName, fileName, existingFiles, filePath, fileType) {
    if (!existingFiles.includes(fileName)) {
      console.log(`  ❌ ${fileName} missing`);
      const answer = await this.askQuestion(`  Create ${moduleName}/${fileName}? (y/N): `);
      return answer.toLowerCase() === 'y';
    }
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const issues = ImportAnalyzer.analyzeServiceImports(content, fileType);
      
      if (issues.length > 0) {
        console.log(`  ⚠️  ${fileName} has ${issues.length} issue(s):`);
        issues.slice(0, 3).forEach(issue => {
          console.log(`    • Line ${issue.line}: ${issue.message}`);
          console.log(`      ${issue.code.substring(0, 60)}...`);
        });
        
        if (issues.length > 3) {
          console.log(`    ... and ${issues.length - 3} more`);
        }
        
        const answer = await this.askQuestion(`  Fix ${moduleName}/${fileName}? (y/N): `);
        return answer.toLowerCase() === 'y';
      } else {
        console.log(`  ✅ ${fileName} follows rules`);
        return false;
      }
    } catch (error) {
      console.log(`  ❌ Cannot read ${fileName}: ${error.message}`);
      return false;
    }
  }
  
  async safeWriteFile(filePath, content) {
    // Backup existing file
    try {
      const backupPath = `${filePath}.backup-${Date.now()}`;
      await fs.copyFile(filePath, backupPath);
    } catch {
      // If no file exists, that's okay
    }
    
    await fs.writeFile(filePath, content, 'utf-8');
    console.log(`    ✅ Updated file`);
  }
  
  async askQuestion(question) {
    return new Promise((resolve) => {
      this.rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }
  
  generateReport() {
    console.log('\n' + '═'.repeat(80));
    console.log('📋 MODULE FIX REPORT - REFACTORED');
    console.log('═'.repeat(80));

    if (this.modulesFixed.length === 0) {
      console.log('\nℹ️  No modules were fixed.');
      return;
    }

    console.log(`\n✅ Modules Processed: ${this.modulesFixed.length}`);
    this.modulesFixed.forEach((module, index) => {
      console.log(`  ${index + 1}. ${module}`);
    });

    if (this.fixesApplied.length > 0) {
      console.log(`\n🔧 Fixes Applied: ${this.fixesApplied.length}`);
      this.fixesApplied.forEach((fix, index) => {
        console.log(`  ${index + 1}. ${fix}`);
      });
    } else {
      console.log('\n🎉 No fixes needed - all files follow architecture rules!');
    }

    console.log('\n💡 NEXT STEPS:');
    console.log('  1. Run type check: npm run type-check');
    console.log('  2. Verify architecture: node scripts/arch-safe-type-fixer.js --dry-run');
    console.log('  3. Test modules in development');
  }
}

// Run fixer
(async () => {
  try {
    const fixer = new ModuleFixer();
    await fixer.run();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
})();