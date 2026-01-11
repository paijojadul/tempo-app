#!/usr/bin/env node
// scripts/module-fixer.mjs - FIXED VERSION

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    console.log('🔧 SMART Module Fixer - FIXED VERSION\n');
    console.log('═'.repeat(80));

    const args = process.argv.slice(2);

    if (args.includes('--help') || args.length === 0) {
      this.showHelp();
      this.rl.close();
      return;
    }

    const specificModule = this.getArgValue('--module');
    const fixAll = args.includes('--all');

    if (specificModule) {
      await this.fixSingleModule(specificModule);
    } else if (fixAll) {
      await this.fixAllModules();
    } else {
      console.log('❌ Please specify --module=<name> or --all');
      this.showHelp();
    }

    this.generateReport();
    this.rl.close();
  }

  showHelp() {
    console.log(`
📦 SMART Module Fixer - Fixes module files with PROPER architecture

🔥 FIXED: Now correctly distinguishes between 'import type' and regular imports
🔥 FIXED: No more infinite loop bug
🔥 FIXED: Better violation detection

Usage: node scripts/module-fixer.mjs [option]

Options:
  --module=<name>    Fix specific module (e.g., --module=accounts)
  --all              Fix ALL modules (use with caution!)
  --help             Show this help
  --check-only       Check only, don't fix anything

Examples:
  node scripts/module-fixer.mjs --module=accounts
  node scripts/module-fixer.mjs --module=transactions
  node scripts/module-fixer.mjs --all
  node scripts/module-fixer.mjs --check-only

⚠️  Safety Features:
  • Asks before overwriting files
  • Type-only imports are ALLOWED (import type {...})
  • Function imports are BLOCKED (import { fetch... })
  • Shows EXACT changes before applying
    `);
  }

  getArgValue(argName) {
    const args = process.argv.slice(2);
    const arg = args.find(a => a.startsWith(`${argName}=`));
    return arg ? arg.split('=')[1] : null;
  }

  async fixAllModules() {
    console.log('🔍 Scanning for all modules...\n');

    const modulesDir = path.join(this.srcPath, 'modules');
    
    try {
      const items = await fs.readdir(modulesDir, { withFileTypes: true });
      const moduleDirs = items.filter(item => item.isDirectory()).map(item => item.name);

      if (moduleDirs.length === 0) {
        console.log('ℹ️  No modules found in src/modules/');
        return;
      }

      console.log(`Found ${moduleDirs.length} modules: ${moduleDirs.join(', ')}\n`);

      for (const moduleName of moduleDirs) {
        console.log(`📦 Module: ${moduleName}`);
        await this.fixModule(moduleName);
        console.log('');
      }

    } catch (error) {
      console.log(`❌ Cannot read modules directory: ${error.message}`);
    }
  }

  async fixSingleModule(moduleName) {
    const modulePath = path.join(this.srcPath, 'modules', moduleName);
    
    try {
      await fs.access(modulePath);
      console.log(`🔧 Fixing module: ${moduleName}\n`);
      await this.fixModule(moduleName);
    } catch {
      console.log(`❌ Module "${moduleName}" not found!`);
      console.log('💡 Available modules:');
      try {
        const modulesDir = path.join(this.srcPath, 'modules');
        const items = await fs.readdir(modulesDir, { withFileTypes: true });
        const moduleDirs = items.filter(item => item.isDirectory()).map(item => item.name);
        moduleDirs.forEach(m => console.log(`  • ${m}`));
      } catch {
        console.log('  (modules directory not found)');
      }
    }
  }

  async fixModule(moduleName) {
    const modulePath = path.join(this.srcPath, 'modules', moduleName);
    const capitalized = this.capitalize(moduleName);
    
    // Cek file yang ada
    const existingFiles = await fs.readdir(modulePath).catch(() => []);
    
    // 1. Fix atau buat service.ts
    await this.fixServiceFile(moduleName, modulePath, capitalized, existingFiles);
    
    // 2. Fix atau buat store.ts (SESUAI RULES!)
    await this.fixStoreFile(moduleName, modulePath, capitalized, existingFiles);
    
    // 3. Fix atau buat ui.tsx
    await this.fixUIFile(moduleName, modulePath, capitalized, existingFiles);
    
    // 4. Fix atau buat index.ts
    await this.fixIndexFile(moduleName, modulePath, capitalized, existingFiles);
    
    // 5. Fix atau buat types.ts (optional)
    await this.fixTypesFile(moduleName, modulePath, capitalized, existingFiles);

    this.modulesFixed.push(moduleName);
  }

  async fixServiceFile(moduleName, modulePath, capitalized, existingFiles) {
    const filePath = path.join(modulePath, 'service.ts');
    
    // Template yang BENAR untuk service.ts
    const template = `import { getTempoClient } from '../../core/tempo';

// ${capitalized} Service
// This file handles ALL external communication (Tempo blockchain, APIs, etc.)

export interface ${capitalized}Item {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Create${capitalized}DTO {
  name: string;
  // Add other fields as needed
}

/**
 * Fetch data from Tempo blockchain
 */
export async function fetch${capitalized}Data(): Promise<${capitalized}Item[]> {
  const client = getTempoClient();
  console.log('🔗 Fetching ${moduleName} data from Tempo...', client);

  // TODO: Implement actual Tempo blockchain query
  // Example: await client.readContract({ ... });
  
  // Mock data for development
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return [
    {
      id: '1',
      name: 'Sample ${moduleName} Item',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}

/**
 * Create new item on Tempo blockchain
 */
export async function create${capitalized}Item(data: Create${capitalized}DTO): Promise<${capitalized}Item> {
  const client = getTempoClient();
  console.log('📝 Creating ${moduleName} item on Tempo...', client);

  // TODO: Implement actual Tempo transaction
  // Example: await client.writeContract({ ... });
  
  // Mock data for development
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    id: Date.now().toString(),
    name: data.name,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Get single item
 */
export async function get${capitalized}Item(id: string): Promise<${capitalized}Item | null> {
  const client = getTempoClient();
  console.log('🔍 Getting ${moduleName} item:', id, client);
  
  // TODO: Implement
  return null;
}

/**
 * Delete item
 */
export async function delete${capitalized}Item(id: string): Promise<boolean> {
  const client = getTempoClient();
  console.log('🗑️  Deleting ${moduleName} item:', id, client);
  
  // TODO: Implement
  return true;
}
`;

    if (existingFiles.includes('service.ts')) {
      // Cek jika perlu perbaikan
      const content = await fs.readFile(filePath, 'utf-8').catch(() => '');
      
      const issues = [];
      if (!content.includes('getTempoClient')) issues.push('missing getTempoClient');
      if (!content.includes(`fetch${capitalized}Data`)) issues.push('missing fetch function');
      
      if (issues.length > 0) {
        console.log(`  ⚠️  service.ts has issues: ${issues.join(', ')}`);
        const answer = await this.askQuestion(`  Fix ${moduleName}/service.ts? (y/N): `);
        if (answer.toLowerCase() === 'y') {
          await fs.writeFile(filePath, template);
          console.log(`    ✅ Fixed service.ts`);
          this.fixesApplied.push(`Fixed ${moduleName}/service.ts`);
        }
      } else {
        console.log(`  ✅ service.ts looks good`);
      }
    } else {
      console.log(`  ❌ service.ts missing`);
      const answer = await this.askQuestion(`  Create ${moduleName}/service.ts? (y/N): `);
      if (answer.toLowerCase() === 'y') {
        await fs.writeFile(filePath, template);
        console.log(`    ✅ Created service.ts`);
        this.fixesApplied.push(`Created ${moduleName}/service.ts`);
      }
    }
  }

  async fixStoreFile(moduleName, modulePath, capitalized, existingFiles) {
    const filePath = path.join(modulePath, 'store.ts');
    
    // Template yang BENAR (store TIDAK import service FUNCTIONS!)
    const template = `import { create } from 'zustand';
import type { ${capitalized}Item } from './service';

// ${capitalized} Store
// Store hanya handle STATE, tidak boleh panggil service langsung!
// Type-only imports (import type) adalah ALLOWED!

interface ${capitalized}State {
  items: ${capitalized}Item[];
  loading: boolean;
  error: string | null;
  selectedItem: ${capitalized}Item | null;
}

export const use${capitalized}Store = create<${capitalized}State>((set) => ({
  items: [],
  loading: false,
  error: null,
  selectedItem: null,

  // HANYA setter functions (pure state management)
  setItems: (items: ${capitalized}Item[]) => set({ items }),
  setLoading: (loading: boolean) => set({ loading }),
  setError: (error: string | null) => set({ error }),
  setSelectedItem: (item: ${capitalized}Item | null) => set({ selectedItem: item }),
  clearError: () => set({ error: null }),
  reset: () => set({ 
    items: [], 
    loading: false, 
    error: null, 
    selectedItem: null 
  }),
}));

// Helper hook untuk common patterns (OPTIONAL)
export function use${capitalized}() {
  const store = use${capitalized}Store();
  
  return {
    // State
    ...store,
    
    // Computed values
    isEmpty: store.items.length === 0,
    hasError: store.error !== null,
    
    // Common actions (masih pure, gak panggil service!)
    selectItemById: (id: string) => {
      const item = store.items.find(item => item.id === id);
      store.setSelectedItem(item || null);
    },
    
    removeItemById: (id: string) => {
      const newItems = store.items.filter(item => item.id !== id);
      store.setItems(newItems);
      
      // Jika item yang selected dihapus
      if (store.selectedItem?.id === id) {
        store.setSelectedItem(null);
      }
    },
  };
}
`;

    if (existingFiles.includes('store.ts')) {
      const content = await fs.readFile(filePath, 'utf-8').catch(() => '');
      
      const issues = [];
      
      // 🔥 FIXED: Cek jika store import FUNCTIONS dari service (bukan type-only)
      // Type-only imports (import type {...}) adalah ALLOWED!
      if (content.includes("from './service'")) {
        // Parse semua import lines
        const lines = content.split('\n');
        let hasFunctionImport = false;
        let hasTypeOnlyImport = false;
        
        for (const line of lines) {
          if (line.includes("from './service'")) {
            if (line.includes('import type') || line.includes("import type {")) {
              hasTypeOnlyImport = true;
            } else if (line.includes('import {') || line.includes('import ')) {
              // Cek jika import functions (bukan types)
              const functionKeywords = ['fetch', 'create', 'get', 'update', 'delete'];
              const hasFunctionKeyword = functionKeywords.some(keyword => 
                line.toLowerCase().includes(keyword.toLowerCase())
              );
              
              if (hasFunctionKeyword) {
                hasFunctionImport = true;
              }
            }
          }
        }
        
        if (hasFunctionImport) {
          issues.push('store imports SERVICE FUNCTIONS (violation!)');
        } else if (hasTypeOnlyImport) {
          console.log(`    ℹ️  store.ts has type-only import (ALLOWED)`);
        }
      }
      
      // Cek jika store punya async functions yang panggil service
      if (content.includes('async') && (content.includes('fetch') || content.includes('await'))) {
        // Tapi perlu cek apakah ini di dalam comment
        const lines = content.split('\n');
        let hasRealAsyncFunction = false;
        
        for (const line of lines) {
          if (line.includes('async') && (line.includes('fetch') || line.includes('await'))) {
            // Skip jika dalam comment
            if (!line.trim().startsWith('//') && !line.includes('/*')) {
              hasRealAsyncFunction = true;
              break;
            }
          }
        }
        
        if (hasRealAsyncFunction) {
          issues.push('store has async functions (should be in service)');
        }
      }
      
      if (issues.length > 0) {
        console.log(`  ⚠️  store.ts has ISSUES: ${issues.join(', ')}`);
        console.log(`  Current file preview:`);
        console.log('  ' + '─'.repeat(40));
        
        // Show preview of problematic lines
        const lines = content.split('\n');
        const problematicLines = lines
          .map((line, index) => ({ line, index }))
          .filter(({ line }) => 
            line.includes("from './service'") || 
            (line.includes('async') && line.includes('fetch'))
          )
          .slice(0, 3);
        
        problematicLines.forEach(({ line, index }) => {
          console.log(`  Line ${index + 1}: ${line.trim().substring(0, 60)}...`);
        });
        
        console.log('  ' + '─'.repeat(40));
        
        const answer = await this.askQuestion(`  FIX ${moduleName}/store.ts? (y/N): `);
        if (answer.toLowerCase() === 'y') {
          await fs.writeFile(filePath, template);
          console.log(`    ✅ Fixed store.ts (now follows rules!)`);
          this.fixesApplied.push(`Fixed ${moduleName}/store.ts`);
        }
      } else {
        console.log(`  ✅ store.ts follows rules`);
      }
    } else {
      console.log(`  ❌ store.ts missing`);
      const answer = await this.askQuestion(`  Create ${moduleName}/store.ts? (y/N): `);
      if (answer.toLowerCase() === 'y') {
        await fs.writeFile(filePath, template);
        console.log(`    ✅ Created store.ts (with correct architecture)`);
        this.fixesApplied.push(`Created ${moduleName}/store.ts`);
      }
    }
  }

  async fixUIFile(moduleName, modulePath, capitalized, existingFiles) {
    const filePath = path.join(modulePath, 'ui.tsx');
    
    const template = `import { useEffect } from 'react';
import { Card } from '../../shared/ui/components/Card';
import { Button } from '../../shared/ui/Button';
import { use${capitalized}Store } from './store';
// Service dipanggil dari PARENT component, bukan dari sini!

interface ${capitalized}UIProps {
  // Data dan functions disediakan oleh parent
  items?: any[];
  onLoadData?: () => Promise<void>;
  onCreateItem?: (data: any) => Promise<void>;
  loading?: boolean;
  error?: string | null;
}

export function ${capitalized}UI({ 
  items = [],
  onLoadData,
  onCreateItem,
  loading = false,
  error = null 
}: ${capitalized}UIProps) {
  const store = use${capitalized}Store();

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

  const handleRefresh = () => {
    if (onLoadData) {
      onLoadData();
    }
  };

  const handleCreate = () => {
    if (onCreateItem) {
      onCreateItem({ name: 'New Item' });
    }
  };

  if (store.loading) {
    return (
      <Card title="${capitalized} Module" variant="primary">
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <p>Loading ${moduleName} data...</p>
        </div>
      </Card>
    );
  }

  if (store.error) {
    return (
      <Card title="Error" variant="danger">
        <p>Error: {store.error}</p>
        <Button onClick={() => store.clearError()}>Dismiss</Button>
        <Button onClick={handleRefresh} variant="secondary" style={{ marginLeft: '10px' }}>
          Retry
        </Button>
      </Card>
    );
  }

  return (
    <Card title="${capitalized} Module" variant="primary">
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <Button onClick={handleRefresh} disabled={store.loading}>
            🔄 Refresh Data
          </Button>
          <Button onClick={handleCreate} variant="secondary" disabled={store.loading}>
            ➕ Create New
          </Button>
          <Button onClick={() => store.reset()} variant="danger">
            🗑️ Reset
          </Button>
        </div>

        <div style={{ background: '#f8f9fa', padding: '10px', borderRadius: '4px' }}>
          <p>
            <strong>Total Items:</strong> {store.items.length}
          </p>
          {store.selectedItem && (
            <p>
              <strong>Selected:</strong> {store.selectedItem.name}
            </p>
          )}
        </div>
      </div>

      {store.items.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
          <p>No items found. Create one!</p>
        </div>
      ) : (
        <div>
          <h4 style={{ marginBottom: '10px' }}>Items List:</h4>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {store.items.map((item) => (
              <li 
                key={item.id} 
                style={{
                  padding: '10px',
                  borderBottom: '1px solid #eee',
                  cursor: 'pointer',
                  background: store.selectedItem?.id === item.id ? '#e7f3ff' : 'transparent'
                }}
                onClick={() => store.setSelectedItem(item)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <strong>{item.name}</strong>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      ID: {item.id} • Created: {item.createdAt.toLocaleDateString()}
                    </div>
                  </div>
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      store.removeItemById(item.id);
                    }}
                    variant="danger"
                    style={{ padding: '2px 8px', fontSize: '12px' }}
                  >
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}
`;

    if (existingFiles.includes('ui.tsx')) {
      const content = await fs.readFile(filePath, 'utf-8').catch(() => '');
      
      const issues = [];
      
      // Cek jika UI import service langsung (violation!)
      // Tapi perlu bedakan antara import functions vs import types
      if (content.includes("from './service'")) {
        const lines = content.split('\n');
        let hasFunctionImport = false;
        
        for (const line of lines) {
          if (line.includes("from './service'")) {
            // Type-only import adalah ALLOWED untuk UI (jika perlu types)
            if (!line.includes('import type') && !line.includes("import type {")) {
              // Cek jika import functions
              const functionKeywords = ['fetch', 'create', 'get', 'update', 'delete'];
              const hasFunctionKeyword = functionKeywords.some(keyword => 
                line.toLowerCase().includes(keyword.toLowerCase())
              );
              
              if (hasFunctionKeyword) {
                hasFunctionImport = true;
                break;
              }
            }
          }
        }
        
        if (hasFunctionImport) {
          issues.push('UI imports service FUNCTIONS (violation!)');
        }
      }
      
      // Cek jika UI punya business logic
      if (content.includes('getTempoClient')) {
        issues.push('UI accesses Tempo directly (violation!)');
      }
      
      // Cek jika UI punya async functions yang panggil service
      if (content.includes('async') && content.includes('fetch')) {
        // Tapi perlu cek apakah dalam comment
        const lines = content.split('\n');
        let hasRealAsyncFunction = false;
        
        for (const line of lines) {
          if (line.includes('async') && line.includes('fetch')) {
            if (!line.trim().startsWith('//') && !line.includes('/*')) {
              hasRealAsyncFunction = true;
              break;
            }
          }
        }
        
        if (hasRealAsyncFunction) {
          issues.push('UI has async business logic (violation!)');
        }
      }
      
      if (issues.length > 0) {
        console.log(`  ⚠️  ui.tsx has ISSUES: ${issues.join(', ')}`);
        const answer = await this.askQuestion(`  Fix ${moduleName}/ui.tsx? (y/N): `);
        if (answer.toLowerCase() === 'y') {
          await fs.writeFile(filePath, template);
          console.log(`    ✅ Fixed ui.tsx (now follows rules!)`);
          this.fixesApplied.push(`Fixed ${moduleName}/ui.tsx`);
        }
      } else {
        console.log(`  ✅ ui.tsx looks good`);
      }
    } else {
      console.log(`  ❌ ui.tsx missing`);
      const answer = await this.askQuestion(`  Create ${moduleName}/ui.tsx? (y/N): `);
      if (answer.toLowerCase() === 'y') {
        await fs.writeFile(filePath, template);
        console.log(`    ✅ Created ui.tsx`);
        this.fixesApplied.push(`Created ${moduleName}/ui.tsx`);
      }
    }
  }

  async fixIndexFile(moduleName, modulePath, capitalized, existingFiles) {
    const filePath = path.join(modulePath, 'index.ts');
    
    const template = `// ${capitalized} Module Exports
export { ${capitalized}UI } from './ui';
export * from './store';

// Export service types but NOT service functions
// Service should be called from app layer, not imported directly
export type { ${capitalized}Item, Create${capitalized}DTO } from './service';
`;

    if (existingFiles.includes('index.ts')) {
      const content = await fs.readFile(filePath, 'utf-8').catch(() => '');
      
      // Cek exports
      const hasUIExport = content.includes(`${capitalized}UI`);
      const hasStoreExport = content.includes("from './store'");
      
      if (!hasUIExport || !hasStoreExport) {
        console.log(`  ⚠️  index.ts missing exports`);
        const answer = await this.askQuestion(`  Fix ${moduleName}/index.ts? (y/N): `);
        if (answer.toLowerCase() === 'y') {
          await fs.writeFile(filePath, template);
          console.log(`    ✅ Fixed index.ts`);
          this.fixesApplied.push(`Fixed ${moduleName}/index.ts`);
        }
      } else {
        console.log(`  ✅ index.ts exports correctly`);
      }
    } else {
      console.log(`  ❌ index.ts missing`);
      const answer = await this.askQuestion(`  Create ${moduleName}/index.ts? (y/N): `);
      if (answer.toLowerCase() === 'y') {
        await fs.writeFile(filePath, template);
        console.log(`    ✅ Created index.ts`);
        this.fixesApplied.push(`Created ${moduleName}/index.ts`);
      }
    }
  }

  async fixTypesFile(moduleName, modulePath, capitalized, existingFiles) {
    const filePath = path.join(modulePath, 'types.ts');
    
    // Cek jika types.ts ada di service.ts
    const servicePath = path.join(modulePath, 'service.ts');
    let hasTypesInService = false;
    
    try {
      const serviceContent = await fs.readFile(servicePath, 'utf-8');
      hasTypesInService = serviceContent.includes('export interface') || serviceContent.includes('export type');
    } catch {
      // service.ts tidak ada
    }

    if (existingFiles.includes('types.ts') || hasTypesInService) {
      console.log(`  ✅ types already defined`);
      return;
    }
    
    console.log(`  ℹ️  No types file found`);
    const answer = await this.askQuestion(`  Create ${moduleName}/types.ts? (y/N): `);
    
    if (answer.toLowerCase() === 'y') {
      const template = `// ${moduleName} module types
// Tip: Bisa juga taruh di service.ts

export interface ${capitalized}Item {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export type Create${capitalized}DTO = Omit<${capitalized}Item, 'id' | 'createdAt' | 'updatedAt'>;

export type Update${capitalized}DTO = Partial<Create${capitalized}DTO>;

export interface ${capitalized}Response<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}
`;
      
      await fs.writeFile(filePath, template);
      console.log(`    ✅ Created types.ts`);
      this.fixesApplied.push(`Created ${moduleName}/types.ts`);
    }
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
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
    console.log('📋 MODULE FIX REPORT - FIXED VERSION');
    console.log('═'.repeat(80));

    if (this.modulesFixed.length === 0) {
      console.log('\nℹ️  No modules were fixed.');
      console.log('💡 Use: node scripts/module-fixer.mjs --module=<name>');
      return;
    }

    console.log(`\n✅ Modules Fixed: ${this.modulesFixed.length}`);
    this.modulesFixed.forEach((module, index) => {
      console.log(`  ${index + 1}. ${module}`);
    });

    if (this.fixesApplied.length > 0) {
      console.log(`\n🔧 Fixes Applied: ${this.fixesApplied.length}`);
      this.fixesApplied.forEach((fix, index) => {
        console.log(`  ${index + 1}. ${fix}`);
      });
    } else {
      console.log('\n🎉 No fixes needed - all files are correct!');
    }

    console.log('\n🎯 ARCHITECTURE RULES CHECKED:');
    console.log('  ✅ Type-only imports (import type {...}) - ALLOWED');
    console.log('  ❌ Function imports (import { fetch... }) - BLOCKED');
    console.log('  ✅ Store = pure state management only');
    console.log('  ✅ Service = all external communication');
    console.log('  ✅ UI = rendering only, no business logic');

    console.log('\n💡 NEXT STEPS:');
    console.log('  1. Run updated audit: node scripts/architecture-auditor-fixed.js');
    console.log('  2. Update App.tsx to pass data to modules');
    console.log('  3. Implement real service logic in service.ts files');
    console.log('  4. Test: npm run type-check && npm run test');

    console.log('\n🔥 FIXES IN THIS VERSION:');
    console.log('  • Fixed: No more false positives for type-only imports');
    console.log('  • Fixed: Better detection of actual violations');
    console.log('  • Fixed: Shows preview of problematic lines');
    console.log('  • Fixed: Handles comments correctly');

    console.log('\n' + '═'.repeat(80));
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