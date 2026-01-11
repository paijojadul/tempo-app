// Template untuk semua stores
import { create, StateCreator } from 'zustand';

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