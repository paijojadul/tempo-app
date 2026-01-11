#!/usr/bin/env node
// scripts/migrate-to-store-pattern.js
import fs from 'fs/promises';
import path from 'path';

async function migrateStore(moduleName, itemType) {
  const capitalized = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);
  const storePath = path.join(process.cwd(), 'src/modules', moduleName, 'store.ts');
  
  const template = `import { createBaseStore } from '@/shared/store/patterns';
import type { ${itemType} } from './service';

// Type khusus untuk ${moduleName}
export interface ${capitalized}State {
  // State
  items: ${itemType}[];
  loading: boolean;
  error: string | null;
  selectedItem: ${itemType} | null;
  
  // Actions
  setItems: (items: ${itemType}[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedItem: (item: ${itemType} | null) => void;
  clearError: () => void;
  reset: () => void;
  removeItemById: (id: string) => void;
  
  // ${capitalized}-specific actions (opsional)
  // filterByType?: (type: string) => void;
}

// Create store dengan base pattern
export const use${capitalized}Store = createBaseStore<${itemType}>('${moduleName}');

// Helper hook dengan logic tambahan
export function use${capitalized}() {
  const store = use${capitalized}Store();

  return {
    // Base state & actions
    ...store,
    
    // Computed values
    getItemById: (id: string) => store.items.find(item => item.id === id),
    hasItems: store.items.length > 0,
    isEmpty: store.items.length === 0,
    
    // Enhanced actions
    selectItemById: (id: string) => {
      const item = store.items.find(item => item.id === id);
      store.setSelectedItem(item || null);
    },
    
    // Business logic
    updateLocalItem: (updatedItem: ${itemType}) => {
      const newItems = store.items.map(item => 
        item.id === updatedItem.id ? updatedItem : item
      );
      store.setItems(newItems);
      
      if (store.selectedItem?.id === updatedItem.id) {
        store.setSelectedItem(updatedItem);
      }
    }
  };
}`;

  try {
    // Backup existing store
    const backupPath = `${storePath}.backup-${Date.now()}`;
    await fs.copyFile(storePath, backupPath);
    
    // Write new store dengan pattern
    await fs.writeFile(storePath, template);
    
    console.log(`✅ Migrated ${moduleName}/store.ts to new pattern`);
    console.log(`   📋 Backup: ${backupPath}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to migrate ${moduleName}:`, error.message);
    return false;
  }
}

async function main() {
  console.log('🔄 Migrating stores to unified pattern...\n');
  
  const modules = [
    { name: 'accounts', itemType: 'AccountsItem' },
    { name: 'exchange', itemType: 'ExchangeItem' },
    { name: 'issuance', itemType: 'IssuanceItem' },
    { name: 'payments', itemType: 'PaymentsItem' },
    { name: 'transactions', itemType: 'TransactionsItem' }
  ];
  
  let migrated = 0;
  
  // First, create the patterns file
  const patternsDir = path.join(process.cwd(), 'src/shared/store');
  await fs.mkdir(patternsDir, { recursive: true });
  
  const patternsContent = `import { create, StateCreator } from 'zustand';

export interface BaseStoreState<T> {
  items: T[];
  loading: boolean;
  error: string | null;
  selectedItem: T | null;
}

export interface BaseStoreActions<T> {
  setItems: (items: T[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedItem: (item: T | null) => void;
  clearError: () => void;
  reset: () => void;
  removeItemById: (id: string) => void;
}

export function createBaseStore<T>(
  name: string,
  initialState?: Partial<BaseStoreState<T>>
) {
  return create<BaseStoreState<T> & BaseStoreActions<T>>((set) => ({
    // Default state
    items: [],
    loading: false,
    error: null,
    selectedItem: null,
    
    // Override dengan initial state jika ada
    ...initialState,
    
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
        const newItems = state.items.filter(item => 
          (item as any).id !== id
        );
        const shouldClearSelected = (state.selectedItem as any)?.id === id;
        
        return {
          items: newItems,
          selectedItem: shouldClearSelected ? null : state.selectedItem
        };
      }),
  }));
}

// Utility types
export type StoreApi<T> = ReturnType<typeof createBaseStore<T>>;
export type StoreState<T> = BaseStoreState<T> & BaseStoreActions<T>;`;
  
  await fs.writeFile(path.join(patternsDir, 'patterns.ts'), patternsContent);
  console.log('✅ Created shared/store/patterns.ts');
  
  // Migrate each module
  for (const module of modules) {
    console.log(`\n📦 Migrating ${module.name}...`);
    const success = await migrateStore(module.name, module.itemType);
    if (success) migrated++;
  }
  
  console.log(`\n✅ Migration complete: ${migrated}/${modules.length} modules migrated`);
  console.log('\n💡 Next:');
  console.log('   1. Install Zustand: npm install zustand');
  console.log('   2. Run type-check: npm run type-check');
  console.log('   3. Test stores in development');
}

main().catch(console.error);