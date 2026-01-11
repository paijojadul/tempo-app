#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ModuleCreator {
  constructor() {
    this.projectRoot = process.cwd();
    this.srcPath = path.join(this.projectRoot, 'src');
  }

  async run() {
    const args = process.argv.slice(2);
    const moduleName = args[0];

    if (!moduleName) {
      console.log('❌ Usage: node scripts/create-module.mjs <module-name>');
      console.log('Example: node scripts/create-module.mjs transactions');
      console.log('Example: node scripts/create-module.mjs users');
      process.exit(1);
    }

    // Validate module name
    if (!/^[a-z][a-z0-9]*$/.test(moduleName)) {
      console.log('❌ Module name must be lowercase and alphanumeric');
      console.log('❌ Example: "transactions", not "Transactions" or "my-module"');
      process.exit(1);
    }

    console.log(`🚀 Creating new module: ${moduleName}\n`);

    await this.createModuleStructure(moduleName);

    console.log(`\n✅ Module "${moduleName}" created successfully!`);
    console.log(`📁 Location: src/modules/${moduleName}`);
    console.log('\n💡 Next steps:');
    console.log(`  1. Update App.tsx to include ${this.capitalize(moduleName)}UI`);
    console.log(`  2. Implement service logic in modules/${moduleName}/service.ts`);
    console.log(`  3. Run: node scripts/audit.mjs (to verify structure)`);
  }

  async createModuleStructure(moduleName) {
    const modulePath = path.join(this.srcPath, 'modules', moduleName);

    // Check if module already exists
    try {
      await fs.access(modulePath);
      console.log(`❌ Module "${moduleName}" already exists!`);
      process.exit(1);
    } catch {
      // Module doesn't exist, continue
    }

    // Create module directory
    await fs.mkdir(modulePath, { recursive: true });
    console.log(`📁 Created directory: modules/${moduleName}`);

    // Create files
    const files = {
      'index.ts': this.generateIndexFile(moduleName),
      'types.ts': this.generateTypesFile(moduleName),
      'service.ts': this.generateServiceFile(moduleName),
      'store.ts': this.generateStoreFile(moduleName),
      'ui.tsx': this.generateUIFile(moduleName),
    };

    for (const [fileName, content] of Object.entries(files)) {
      const filePath = path.join(modulePath, fileName);
      await fs.writeFile(filePath, content);
      console.log(`  ✅ Created: ${fileName}`);
    }
  }

  generateIndexFile(moduleName) {
    const capitalized = this.capitalize(moduleName);
    return `export { ${capitalized}UI } from './ui';
export * from './service';
export * from './store';
export * from './types';\n`;
  }

  generateTypesFile(moduleName) {
    const capitalized = this.capitalize(moduleName);
    return `// ${moduleName} module types

export interface ${capitalized}Item {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Create${capitalized}DTO {
  name: string;
  // Add other fields as needed
}\n`;
  }

  generateServiceFile(moduleName) {
    const capitalized = this.capitalize(moduleName);
    return `import { getTempoClient } from '../../core/tempo';

export async function fetch${capitalized}Data() {
  // Access Tempo blockchain here
  const client = getTempoClient();
  
  // Implement your logic
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

export async function create${capitalized}Item(data: { name: string }) {
  // Access Tempo blockchain here
  const client = getTempoClient();
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    id: Date.now().toString(),
    name: data.name,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}\n`;
  }

  generateStoreFile(moduleName) {
    const capitalized = this.capitalize(moduleName);
    return `import { create } from 'zustand';
import { fetch${capitalized}Data, create${capitalized}Item } from './service';

interface ${capitalized}State {
  items: any[];
  loading: boolean;
  error: string | null;
  
  // Actions
  loadItems: () => Promise<void>;
  createItem: (data: { name: string }) => Promise<void>;
  clearError: () => void;
}

export const use${capitalized}Store = create<${capitalized}State>((set, get) => ({
  items: [],
  loading: false,
  error: null,
  
  loadItems: async () => {
    set({ loading: true, error: null });
    try {
      const items = await fetch${capitalized}Data();
      set({ items, loading: false });
    } catch (error) {
      set({ error: 'Failed to load items', loading: false });
    }
  },
  
  createItem: async (data) => {
    set({ loading: true, error: null });
    try {
      const newItem = await create${capitalized}Item(data);
      set((state) => ({
        items: [...state.items, newItem],
        loading: false,
      }));
    } catch (error) {
      set({ error: 'Failed to create item', loading: false });
    }
  },
  
  clearError: () => set({ error: null }),
}));\n`;
  }

  generateUIFile(moduleName) {
    const capitalized = this.capitalize(moduleName);
    return `import { useState } from 'react';
import { use${capitalized}Store } from './store';

export function ${capitalized}UI() {
  const { items, loading, error, loadItems, createItem, clearError } = use${capitalized}Store();
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
      <h2>${capitalized} Module</h2>
      
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
}\n`;
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Run creator
try {
  const creator = new ModuleCreator();
  await creator.run();
} catch (error) {
  console.error('❌ Error creating module:', error.message);
  process.exit(1);
}
