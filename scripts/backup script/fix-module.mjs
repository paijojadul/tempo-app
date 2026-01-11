#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const SRC_DIR = path.join(ROOT_DIR, 'src');

class ModuleFixer {
  constructor() {
    this.fixesApplied = 0;
    this.failedFixes = 0;
    this.modulesFixed = [];
  }

  async run() {
    console.log('🔧 Fixing Tempo Modules...\n');

    const args = process.argv.slice(2);
    const specificModule = this.getArgValue('--module');
    const fixAll = args.includes('--all');

    if (specificModule) {
      await this.fixSingleModule(specificModule);
    } else if (fixAll) {
      await this.fixAllModules();
    } else {
      console.log(`
Usage:
  node scripts/fix-module.mjs --module=<name>   Fix specific module
  node scripts/fix-module.mjs --all             Fix all modules
  
Examples:
  node scripts/fix-module.mjs --module=accounts
  node scripts/fix-module.mjs --module=transactions
  node scripts/fix-module.mjs --all
      `);
      return;
    }

    this.generateReport();
  }

  getArgValue(argName) {
    const args = process.argv.slice(2);
    const arg = args.find((a) => a.startsWith(`${argName}=`));
    return arg ? arg.split('=')[1] : null;
  }

  async fixAllModules() {
    const modulesPath = path.join(SRC_DIR, 'modules');

    try {
      const items = await fs.readdir(modulesPath, { withFileTypes: true });

      for (const item of items) {
        if (item.isDirectory()) {
          await this.fixModule(item.name);
        }
      }
    } catch (error) {
      console.error('❌ Cannot scan modules:', error.message);
    }
  }

  async fixSingleModule(moduleName) {
    const modulePath = path.join(SRC_DIR, 'modules', moduleName);

    try {
      await fs.access(modulePath);
      await this.fixModule(moduleName);
    } catch {
      console.error(`❌ Module "${moduleName}" not found`);
      process.exit(1);
    }
  }

  async fixModule(moduleName) {
    console.log(`🛠️  Fixing module: ${moduleName}`);

    const modulePath = path.join(SRC_DIR, 'modules', moduleName);
    const moduleCapitalized = this.capitalize(moduleName);

    // 1. Fix service.ts
    await this.fixServiceFile(moduleName, modulePath, moduleCapitalized);

    // 2. Fix store.ts
    await this.fixStoreFile(moduleName, modulePath, moduleCapitalized);

    // 3. Fix ui.tsx
    await this.fixUIFile(moduleName, modulePath, moduleCapitalized);

    // 4. Fix index.ts
    await this.fixIndexFile(moduleName, modulePath, moduleCapitalized);

    // 5. Check and create types.ts if missing
    await this.checkTypesFile(moduleName, modulePath, moduleCapitalized);

    this.modulesFixed.push(moduleName);
  }

  async fixServiceFile(moduleName, modulePath, moduleCapitalized) {
    const filePath = path.join(modulePath, 'service.ts');

    try {
      let content = await fs.readFile(filePath, 'utf8');
      let updated = false;

      // Fix: Add missing getTempoClient import
      if (!content.includes('getTempoClient') && !content.includes('../../core/tempo')) {
        const importLine = `import { getTempoClient } from '../../core/tempo';\n\n`;
        content = importLine + content;
        updated = true;
        console.log(`   ✅ Added Tempo client import to ${moduleName}/service.ts`);
      }

      // Fix: Add missing fetch function
      const fetchFunction = `async function fetch${moduleCapitalized}Data()`;
      if (!content.includes(`fetch${moduleCapitalized}Data`)) {
        const functionTemplate = `
export async function fetch${moduleCapitalized}Data() {
  try {
    const client = getTempoClient();
    // TODO: Implement actual Tempo blockchain query
    console.log('Fetching ${moduleName} data...');
    
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return [
      {
        id: '1',
        name: 'Sample ${moduleName} Item',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  } catch (error) {
    console.error('Failed to fetch ${moduleName} data:', error);
    throw error;
  }
}
`;

        // Add at end of file
        content += '\n' + functionTemplate;
        updated = true;
        console.log(`   ✅ Added fetch${moduleCapitalized}Data() to service.ts`);
      }

      // Fix: Remove duplicate TODOs
      if ((content.match(/TODO/g) || []).length > 1) {
        // Keep only first TODO
        const lines = content.split('\n');
        let todoCount = 0;
        const cleanedLines = lines.map((line) => {
          if (line.includes('TODO') && todoCount > 0) {
            return line.replace('TODO', '// TODO');
          }
          if (line.includes('TODO')) {
            todoCount++;
          }
          return line;
        });
        content = cleanedLines.join('\n');
        updated = true;
        console.log(`   ✅ Cleaned duplicate TODOs in ${moduleName}/service.ts`);
      }

      if (updated) {
        await fs.writeFile(filePath, content, 'utf8');
        this.fixesApplied++;
      }
    } catch (error) {
      // If service.ts doesn't exist, create it
      if (error.code === 'ENOENT') {
        await this.createServiceFile(moduleName, modulePath, moduleCapitalized);
        this.fixesApplied++;
      } else {
        console.error(`   ❌ Cannot fix ${moduleName}/service.ts:`, error.message);
        this.failedFixes++;
      }
    }
  }

  async createServiceFile(moduleName, modulePath, moduleCapitalized) {
    const filePath = path.join(modulePath, 'service.ts');
    const content = `import { getTempoClient } from '../../core/tempo';

export async function fetch${moduleCapitalized}Data() {
  try {
    const client = getTempoClient();
    console.log('Fetching ${moduleName} data from Tempo blockchain...');
    
    // TODO: Implement actual Tempo blockchain query
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return [
      {
        id: '1',
        name: 'Sample ${moduleName} Item',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  } catch (error) {
    console.error('Failed to fetch ${moduleName} data:', error);
    throw error;
  }
}

export async function create${moduleCapitalized}Item(data: { name: string }) {
  try {
    const client = getTempoClient();
    console.log('Creating ${moduleName} item on Tempo...');
    
    // TODO: Implement actual Tempo transaction
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  } catch (error) {
    console.error('Failed to create ${moduleName} item:', error);
    throw error;
  }
}
`;

    await fs.writeFile(filePath, content, 'utf8');
    console.log(`   ✅ Created missing service.ts for ${moduleName}`);
  }

  async fixStoreFile(moduleName, modulePath, moduleCapitalized) {
    const filePath = path.join(modulePath, 'store.ts');

    try {
      let content = await fs.readFile(filePath, 'utf8');
      let updated = false;

      // Check if store uses Zustand pattern
      if (!content.includes('create') || !content.includes('zustand')) {
        console.log(`   ⚠️  ${moduleName}/store.ts doesn't follow Zustand pattern`);
        // We'll create a new one instead
        await this.createStoreFile(moduleName, modulePath, moduleCapitalized);
        this.fixesApplied++;
        return;
      }

      // Fix: Ensure service import exists
      if (!content.includes("from './service'")) {
        // Add import after existing imports
        const importRegex = /import.*from.*['"][^'"]+['"]/g;
        const imports = content.match(importRegex) || [];

        if (imports.length > 0) {
          const lastImport = imports[imports.length - 1];
          const importIndex = content.lastIndexOf(lastImport) + lastImport.length;

          const before = content.substring(0, importIndex);
          const after = content.substring(importIndex);

          content =
            before +
            '\nimport { fetch' +
            moduleCapitalized +
            'Data, create' +
            moduleCapitalized +
            "Item } from './service';\n" +
            after;
          updated = true;
          console.log(`   ✅ Added service import to ${moduleName}/store.ts`);
        }
      }

      // Fix: Ensure store hook is exported
      const storeHook = `use${moduleCapitalized}Store`;
      if (
        !content.includes(`export const ${storeHook}`) &&
        !content.includes(`export const ${storeHook} =`)
      ) {
        // Find the store creation line
        const storeCreateMatch = content.match(/const (\w+Store)\s*=\s*create/);
        if (storeCreateMatch) {
          const existingName = storeCreateMatch[1];
          // Add export keyword
          content = content.replace(
            `const ${existingName} = create`,
            `export const ${existingName} = create`
          );
          updated = true;
          console.log(`   ✅ Added export to ${moduleName} store hook`);
        }
      }

      // Fix: Remove direct Tempo access
      if (content.includes('getTempoClient')) {
        content = content.replace(
          /getTempoClient\(\)/g,
          '/* getTempoClient() - MOVED TO SERVICE */'
        );
        updated = true;
        console.log(`   ✅ Removed direct Tempo access from ${moduleName}/store.ts`);
      }

      if (updated) {
        await fs.writeFile(filePath, content, 'utf8');
        this.fixesApplied++;
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        await this.createStoreFile(moduleName, modulePath, moduleCapitalized);
        this.fixesApplied++;
      } else {
        console.error(`   ❌ Cannot fix ${moduleName}/store.ts:`, error.message);
        this.failedFixes++;
      }
    }
  }

  async createStoreFile(moduleName, modulePath, moduleCapitalized) {
    const filePath = path.join(modulePath, 'store.ts');
    const content = `import { create } from 'zustand';
import { fetch${moduleCapitalized}Data, create${moduleCapitalized}Item } from './service';

interface ${moduleCapitalized}State {
  items: any[];
  loading: boolean;
  error: string | null;
  
  // Actions
  loadItems: () => Promise<void>;
  createItem: (data: { name: string }) => Promise<void>;
  clearError: () => void;
}

export const use${moduleCapitalized}Store = create<${moduleCapitalized}State>((set) => ({
  items: [],
  loading: false,
  error: null,
  
  loadItems: async () => {
    set({ loading: true, error: null });
    try {
      const items = await fetch${moduleCapitalized}Data();
      set({ items, loading: false });
    } catch (error) {
      set({ error: 'Failed to load items', loading: false });
    }
  },
  
  createItem: async (data) => {
    set({ loading: true, error: null });
    try {
      const newItem = await create${moduleCapitalized}Item(data);
      set((state) => ({
        items: [...state.items, newItem],
        loading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to create item', loading: false });
    }
  },
  
  clearError: () => set({ error: null }),
}));
`;

    await fs.writeFile(filePath, content, 'utf8');
    console.log(`   ✅ Created missing store.ts for ${moduleName}`);
  }

  async fixUIFile(moduleName, modulePath, moduleCapitalized) {
    const filePath = path.join(modulePath, 'ui.tsx');

    try {
      let content = await fs.readFile(filePath, 'utf8');
      let updated = false;

      // Fix: Ensure component is exported
      const componentName = `${moduleCapitalized}UI`;
      if (
        !content.includes(`export function ${componentName}`) &&
        !content.includes(`export const ${componentName}`)
      ) {
        // Wrap existing content in exported component
        const exportLine = `export function ${componentName}() {\n`;
        const endLine = `\n}\n`;

        // Remove any existing export default
        content = content.replace(/export default.*\n?/, '');

        content = exportLine + content + endLine;
        updated = true;
        console.log(`   ✅ Added export to ${moduleName}/ui.tsx`);
      }

      // Fix: Ensure store import exists
      if (!content.includes("from './store'")) {
        // Add import at beginning
        const importLine = `import { use${moduleCapitalized}Store } from './store';\n`;

        // Find first import line
        const firstImportMatch = content.match(/import.*from.*['"][^'"]+['"]/);
        if (firstImportMatch) {
          const importIndex = content.indexOf(firstImportMatch[0]);
          content = content.substring(0, importIndex) + importLine + content.substring(importIndex);
        } else {
          // No imports at all, add at top
          content = importLine + '\n' + content;
        }

        updated = true;
        console.log(`   ✅ Added store import to ${moduleName}/ui.tsx`);
      }

      // Fix: Remove direct Tempo access
      if (content.includes('getTempoClient')) {
        content = content.replace(
          /getTempoClient\(\)/g,
          '/* getTempoClient() - USE STORE INSTEAD */'
        );
        updated = true;
        console.log(`   ✅ Removed direct Tempo access from ${moduleName}/ui.tsx`);
      }

      // Fix: Add useState if missing for interactive UI
      if (
        (!content.includes('useState') && content.includes('<input')) ||
        content.includes('<button')
      ) {
        // Add useState import if not present
        if (!content.includes("from 'react'")) {
          const reactImport = "import { useState } from 'react';\n";
          content = reactImport + content;
        } else if (!content.includes('useState')) {
          // Add useState to existing React import
          content = content.replace("from 'react'", ", useState } from 'react'");
        }
        updated = true;
        console.log(`   ✅ Added useState for interactive UI in ${moduleName}/ui.tsx`);
      }

      if (updated) {
        await fs.writeFile(filePath, content, 'utf8');
        this.fixesApplied++;
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        await this.createUIFile(moduleName, modulePath, moduleCapitalized);
        this.fixesApplied++;
      } else {
        console.error(`   ❌ Cannot fix ${moduleName}/ui.tsx:`, error.message);
        this.failedFixes++;
      }
    }
  }

  async createUIFile(moduleName, modulePath, moduleCapitalized) {
    const filePath = path.join(modulePath, 'ui.tsx');
    const content = `import { useState } from 'react';
import { use${moduleCapitalized}Store } from './store';

export function ${moduleCapitalized}UI() {
  const { items, loading, error, loadItems, createItem, clearError } = use${moduleCapitalized}Store();
  const [newItemName, setNewItemName] = useState('');

  const handleCreate = async () => {
    if (!newItemName.trim()) return;
    
    try {
      await createItem({ name: newItemName });
      setNewItemName('');
    } catch (error) {
      // Error is already handled in store
    }
  };

  const handleRefresh = () => {
    loadItems();
  };

  return (
    <div className="${moduleName}-module">
      <h2>${moduleCapitalized} Module</h2>
      
      {error && (
        <div className="error-banner">
          <p>{error}</p>
          <button onClick={clearError}>
            Dismiss
          </button>
        </div>
      )}

      <div className="controls">
        <div className="creation-form">
          <input
            type="text"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="New item name"
            disabled={loading}
          />
          <button 
            onClick={handleCreate} 
            disabled={loading || !newItemName.trim()}
          >
            Create Item
          </button>
        </div>
        
        <button onClick={handleRefresh} disabled={loading}>
          Refresh
        </button>
      </div>

      <div className="stats">
        <p>Total Items: {items.length}</p>
        <p>Status: {loading ? 'Loading...' : 'Ready'}</p>
      </div>

      <div className="items-list">
        <h3>Items</h3>
        {items.length === 0 ? (
          <p className="empty-state">No items found. Create one!</p>
        ) : (
          <ul>
            {items.map((item) => (
              <li key={item.id} className="item-card">
                <div className="item-info">
                  <h4>{item.name}</h4>
                  <p>ID: {item.id}</p>
                  <p>Created: {item.createdAt.toLocaleDateString()}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
`;

    await fs.writeFile(filePath, content, 'utf8');
    console.log(`   ✅ Created missing ui.tsx for ${moduleName}`);
  }

  async fixIndexFile(moduleName, modulePath, moduleCapitalized) {
    const filePath = path.join(modulePath, 'index.ts');

    try {
      let content = await fs.readFile(filePath, 'utf8');
      let updated = false;

      // Check for required exports
      const requiredExports = [
        `{ ${moduleCapitalized}UI } from './ui'`,
        `from './service'`,
        `from './store'`,
      ];

      for (const exportPattern of requiredExports) {
        if (!content.includes(exportPattern)) {
          // Add missing export
          let exportLine = '';
          if (exportPattern.includes('UI }')) {
            exportLine = `export { ${moduleCapitalized}UI } from './ui';\n`;
          } else if (exportPattern.includes('service')) {
            exportLine = `export * from './service';\n`;
          } else if (exportPattern.includes('store')) {
            exportLine = `export * from './store';\n`;
          }

          // Add at end of file
          content += '\n' + exportLine;
          updated = true;
          console.log(`   ✅ Added ${exportPattern} to ${moduleName}/index.ts`);
        }
      }

      // Check for types.ts export if file exists
      try {
        await fs.access(path.join(modulePath, 'types.ts'));
        if (!content.includes("from './types'")) {
          content += `export * from './types';\n`;
          updated = true;
          console.log(`   ✅ Added types export to ${moduleName}/index.ts`);
        }
      } catch {
        // types.ts doesn't exist, that's OK
      }

      if (updated) {
        await fs.writeFile(filePath, content, 'utf8');
        this.fixesApplied++;
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        await this.createIndexFile(moduleName, modulePath, moduleCapitalized);
        this.fixesApplied++;
      } else {
        console.error(`   ❌ Cannot fix ${moduleName}/index.ts:`, error.message);
        this.failedFixes++;
      }
    }
  }

  async createIndexFile(moduleName, modulePath, moduleCapitalized) {
    const filePath = path.join(modulePath, 'index.ts');
    const content = `export { ${moduleCapitalized}UI } from './ui';
export * from './service';
export * from './store';
`;

    // Add types export if types.ts exists
    try {
      await fs.access(path.join(modulePath, 'types.ts'));
      content += `export * from './types';\n`;
    } catch {
      // No types.ts, that's fine
    }

    await fs.writeFile(filePath, content, 'utf8');
    console.log(`   ✅ Created missing index.ts for ${moduleName}`);
  }

  async checkTypesFile(moduleName, modulePath, moduleCapitalized) {
    const filePath = path.join(modulePath, 'types.ts');

    try {
      await fs.access(filePath);
      // File exists, check if it's empty or minimal
      const content = await fs.readFile(filePath, 'utf8');

      if (content.trim().length < 50) {
        // File is too small, enhance it
        await this.createTypesFile(moduleName, modulePath, moduleCapitalized);
        console.log(`   ✅ Enhanced minimal types.ts for ${moduleName}`);
        this.fixesApplied++;
      }
    } catch {
      // File doesn't exist, create it (optional but recommended)
      await this.createTypesFile(moduleName, modulePath, moduleCapitalized);
      console.log(`   ✅ Created types.ts for ${moduleName}`);
      this.fixesApplied++;
    }
  }

  async createTypesFile(moduleName, modulePath, moduleCapitalized) {
    const filePath = path.join(modulePath, 'types.ts');
    const content = `// ${moduleName} module types

export interface ${moduleCapitalized}Item {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Create${moduleCapitalized}DTO {
  name: string;
  // Add other fields as needed
}

export interface Update${moduleCapitalized}DTO extends Partial<Create${moduleCapitalized}DTO> {
  id: string;
}

// Response types
export interface ${moduleCapitalized}Response<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}
`;

    await fs.writeFile(filePath, content, 'utf8');
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🔧 MODULE FIX REPORT - TEMPO BLOCKCHAIN');
    console.log('='.repeat(80));

    console.log('\n📊 RESULTS:');
    console.log(`   Modules fixed: ${this.modulesFixed.length}`);
    console.log(`   Fixes applied: ${this.fixesApplied}`);
    console.log(`   Failed fixes: ${this.failedFixes}`);

    if (this.modulesFixed.length > 0) {
      console.log(`\n✅ Fixed modules:`);
      this.modulesFixed.forEach((module, index) => {
        console.log(`   ${index + 1}. ${module}`);
      });
    }

    if (this.failedFixes > 0) {
      console.log(`\n⚠️  Some fixes failed. Manual intervention may be needed.`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('💡 NEXT STEPS:');
    console.log('   1. Run: npm run audit-module (to verify fixes)');
    console.log('   2. Run: npm run test (ensure nothing broken)');
    console.log('   3. Commit your changes');
    console.log('='.repeat(80));
  }
}

// Main execution
async function main() {
  const fixer = new ModuleFixer();
  await fixer.run();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
