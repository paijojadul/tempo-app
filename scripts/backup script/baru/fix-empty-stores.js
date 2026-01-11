#!/usr/bin/env node
// scripts/fix-empty-stores.js
import fs from 'fs/promises';
import path from 'path';

async function getItemTypeFromService(moduleName) {
  const servicePath = path.join(process.cwd(), 'src/modules', moduleName, 'service.ts');
  const capitalized = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
  
  try {
    const content = await fs.readFile(servicePath, 'utf-8');
    
    // Cari interface Item
    const interfaceRegex = /export interface (\w+Item)\s*{/;
    const match = content.match(interfaceRegex);
    
    if (match) {
      console.log(`   📝 Found interface: ${match[1]}`);
      return match[1];
    }
    
    // Cari type alias
    const typeRegex = /export type (\w+Item)\s*=/;
    const typeMatch = content.match(typeRegex);
    
    if (typeMatch) {
      console.log(`   📝 Found type: ${typeMatch[1]}`);
      return typeMatch[1];
    }
    
    // Jika tidak ada, cek export
    const exportRegex = /export\s+{[^}]*\}/g;
    const exportMatches = content.match(exportRegex);
    
    if (exportMatches) {
      for (const exportStr of exportMatches) {
        if (exportStr.includes('Item')) {
          const itemMatch = exportStr.match(/(\w+Item)/);
          if (itemMatch) {
            console.log(`   📝 Found in exports: ${itemMatch[1]}`);
            return itemMatch[1];
          }
        }
      }
    }
    
    console.log(`   ⚠️  No Item interface found, using default`);
    return `${capitalized}Item`;
    
  } catch (error) {
    console.log(`   ⚠️  Cannot read service.ts: ${error.message}`);
    return `${capitalized}Item`;
  }
}

async function createStoreFromTemplate(moduleName, itemType) {
  const storePath = path.join(process.cwd(), 'src/modules', moduleName, 'store.ts');
  const capitalized = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
  
  // Template yang sama dengan accounts/transactions
  const template = `import { create } from 'zustand';
import type { ${itemType} } from './service';

// ${capitalized} Store
// Store hanya handle STATE, tidak boleh panggil service langsung!

interface ${capitalized}State {
  items: ${itemType}[];
  loading: boolean;
  error: string | null;
  selectedItem: ${itemType} | null;

  // Setter functions
  setItems: (items: ${itemType}[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedItem: (item: ${itemType} | null) => void;
  clearError: () => void;
  reset: () => void;
  removeItemById: (id: string) => void;
}

export const use${capitalized}Store = create<${capitalized}State>((set) => ({
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
export function use${capitalized}() {
  const store = use${capitalized}Store();

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
    updateLocalItem: (updatedItem: ${itemType}) => {
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

  try {
    // Backup existing (meski hanya export {})
    const backupPath = `${storePath}.backup-${Date.now()}`;
    await fs.copyFile(storePath, backupPath);
    
    // Write new store
    await fs.writeFile(storePath, template, 'utf-8');
    
    return {
      success: true,
      itemType,
      backup: backupPath
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function main() {
  console.log('🔄 Fixing empty store files...\n');
  
  const emptyModules = ['exchange', 'issuance', 'payments'];
  const results = [];
  
  for (const moduleName of emptyModules) {
    console.log(`📦 Processing ${moduleName}...`);
    
    // 1. Determine item type
    const itemType = await getItemTypeFromService(moduleName);
    
    // 2. Create store from template
    const result = await createStoreFromTemplate(moduleName, itemType);
    
    if (result.success) {
      console.log(`   ✅ Created store with ${itemType}`);
      console.log(`   💾 Backup: ${path.basename(result.backup)}`);
      results.push({ moduleName, success: true, itemType });
    } else {
      console.log(`   ❌ Failed: ${result.error}`);
      results.push({ moduleName, success: false, error: result.error });
    }
    
    console.log();
  }
  
  // Summary
  console.log('📊 SUMMARY:');
  const successful = results.filter(r => r.success).length;
  console.log(`   ✅ Success: ${successful}/${emptyModules.length}`);
  
  if (successful > 0) {
    console.log('\n💡 Next steps:');
    console.log('   1. Run type-check: npm run type-check');
    console.log('   2. Review created stores');
    console.log('   3. Update service.ts if interfaces missing');
  }
}

main().catch(console.error);