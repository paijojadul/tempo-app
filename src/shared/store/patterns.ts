// src/shared/store/patterns.ts
import { create } from 'zustand'

/**
 * Base state untuk async pattern
 */
export interface BaseStoreState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * Base actions untuk async pattern
 */
export interface BaseStoreActions<T> {
  setLoading: (loading: boolean) => void
  setData: (data: T) => void
  setError: (error: string | null) => void
  reset: () => void
}

/**
 * Factory helper untuk membuat store async
 * Phase 4 – zero any, zero warning
 */
export function createBaseStore<T>() {
  return create<BaseStoreState<T> & BaseStoreActions<T>>((set) => ({
    data: null,
    loading: false,
    error: null,

    setLoading: (loading: boolean) => {
      set({ loading })
    },

    setData: (data: T) => {
      set({ data, loading: false, error: null })
    },

    setError: (error: string | null) => {
      set({ error, loading: false })
    },

    reset: () => {
      set({
        data: null,
        loading: false,
        error: null,
      })
    },
  }))
}
