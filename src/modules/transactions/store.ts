import { create } from 'zustand'
import type { AsyncState } from '../../shared/store/async'
import { createAsyncState } from '../../shared/store/async'
import type { Transaction } from './types'
import { fetchTransactions } from './service'

type TransactionsStore = {
  transactions: AsyncState<Transaction[]>
  loadTransactions: () => Promise<void>
}

export const useTransactionsStore = create<TransactionsStore>((set) => ({
  transactions: createAsyncState<Transaction[]>(),

  async loadTransactions() {
    set((s) => ({
      transactions: { ...s.transactions, status: 'loading' },
    }))

    try {
      const data = await fetchTransactions()
      set({
        transactions: { data, status: 'success' },
      })
    } catch (err) {
      set({
        transactions: {
          data: null,
          status: 'error',
          error: 'FAILED_TO_LOAD',
        },
      })
    }
  },
}))
