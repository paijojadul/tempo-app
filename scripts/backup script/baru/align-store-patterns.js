#!/usr/bin/env node
// scripts/align-store-patterns.js
import fs from 'fs/promises';
import path from 'path';

async function alignStoreToPattern(moduleName, itemType) {
  const storePath = path.join(process.cwd(), 'src/modules', moduleName, 'store.ts');
  const capitalized = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
  
  try {
    const content = await fs.readFile(storePath, 'utf-8');
    
    // Jika sudah ada pattern yang bagus, skip
    if (content.includes('interface') && content.includes('create<')) {
      console.log(`⏩ ${moduleName}: Already has good pattern, skipping`);
      return false;
    }
    
    // Jika kosong atau hanya export {}, apply pattern
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

    // Backup existing
    const backupPath = `${storePath}.backup`;
    await fs.copyFile(storePath, backupPath);
    
    // Apply pattern
    await fs.writeFile(storePath, template);
    console.log(`✅ ${moduleName}: Applied standard store pattern`);
    console.log(`   📋 Backup: ${backupPath}`);
    
    return true;
    
  } catch (error) {
    console.error(`❌ ${moduleName}: ${error.message}`);
    return false;
  }
}

async function checkModule(moduleName) {
  const servicePath = path.join(process.cwd(), 'src/modules', moduleName, 'service.ts');
  
  try {
    const content = await fs.readFile(servicePath, 'utf-8');
    
    // Cari interface Item
    const itemMatch = content.match(/export interface (\w+Item)/);
    if (itemMatch) {
      return itemMatch[1]; // e.g., "ExchangeItem"
    }
    
    // Jika tidak ada, buat default
    return `${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Item`;
    
  } catch (error) {
    // Service tidak ada, buat default
    return `${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Item`;
  }
}

async function main() {
  console.log('🔍 Aligning store patterns...\n');
  
  const allModules = ['accounts', 'exchange', 'issuance', 'payments', 'transactions'];
  const modulesToCheck = ['exchange', 'issuance', 'payments']; // Skip yang sudah bagus
  
  let aligned = 0;
  
  for (const moduleName of modulesToCheck) {
    console.log(`📦 Checking ${moduleName}...`);
    
    // Determine item type
    const itemType = await checkModule(moduleName);
    
    // Align if needed
    const result = await alignStoreToPattern(moduleName, itemType);
    if (result) aligned++;
  }
  
  console.log(`\n✅ Aligned ${aligned} modules to standard pattern`);
  console.log('\n💡 Next: Run type-check to ensure no errors');
  console.log('   npm run type-check');
}

main().catch(console.error);