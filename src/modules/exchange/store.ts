import { create } from 'zustand'
import type { AsyncState } from '../../shared/store/async'
import { createAsyncState } from '../../shared/store/async'
import type { ExchangeItem } from './types'
import { fetchExchanges } from './service'

type ExchangeStore = {
  exchanges: AsyncState<ExchangeItem[]>
  loadExchanges: () => Promise<void>
}

export const useExchangeStore = create<ExchangeStore>((set) => ({
  exchanges: createAsyncState<ExchangeItem[]>(),

  async loadExchanges() {
    set((s) => ({
      exchanges: { ...s.exchanges, status: 'loading' },
    }))

    try {
      const data = await fetchExchanges()
      set({
        exchanges: { data, status: 'success' },
      })
    } catch (err) {
      set({
        exchanges: {
          data: null,
          status: 'error',
          error: 'FAILED_TO_LOAD',
        },
      })
    }
  },
}))
