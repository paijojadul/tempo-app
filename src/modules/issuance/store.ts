import { create } from 'zustand'
import type { AsyncState } from '../../shared/store/async'
import { createAsyncState } from '../../shared/store/async'
import type { Issuance } from './types'
import { fetchIssuances } from './service'

type IssuanceStore = {
  issuances: AsyncState<Issuance[]>
  loadIssuances: () => Promise<void>
}

export const useIssuanceStore = create<IssuanceStore>((set) => ({
  issuances: createAsyncState<Issuance[]>(),

  async loadIssuances() {
    set((s) => ({
      issuances: { ...s.issuances, status: 'loading', error: undefined },
    }))

    try {
      const data = await fetchIssuances()
      set({
        issuances: { data, status: 'success' },
      })
    } catch (err) {
      set({
        issuances: {
          data: null,
          status: 'error',
          error: 'FAILED_TO_LOAD',
        },
      })
    }
  },
}))
