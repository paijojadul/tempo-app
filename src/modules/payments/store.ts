import { create } from 'zustand';
import type { PaymentsItem } from './service';

// Payments Store
// Store hanya handle STATE, tidak boleh panggil service langsung!

interface PaymentsState {
  items: PaymentsItem[];
  loading: boolean;
  error: string | null;
  selectedItem: PaymentsItem | null;

  // Setter functions
  setItems: (items: PaymentsItem[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedItem: (item: PaymentsItem | null) => void;
  clearError: () => void;
  reset: () => void;
  removeItemById: (id: string) => void;
}

export const usePaymentsStore = create<PaymentsState>((set) => ({
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
export function usePayments() {
  const store = usePaymentsStore();

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
    updateLocalItem: (updatedItem: PaymentsItem) => {
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
}