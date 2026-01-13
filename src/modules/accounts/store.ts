import { create } from 'zustand'
import type { AsyncState } from '../../shared/store/async'
import { createAsyncState } from '../../shared/store/async'
import type { Account } from './types'
import { fetchAccounts } from './service'

type AccountsStore = {
  accounts: AsyncState<Account[]>
  loadAccounts: () => Promise<void>
}

export const useAccountsStore = create<AccountsStore>((set) => ({
  accounts: createAsyncState<Account[]>(),

  async loadAccounts() {
    set((s) => ({
      accounts: { ...s.accounts, status: 'loading' },
    }))

    try {
      const data = await fetchAccounts()
      set({
        accounts: { data, status: 'success' },
      })
    } catch (err) {
      set({
        accounts: {
          data: null,
          status: 'error',
          error: 'FAILED_TO_LOAD',
        },
      })
    }
  },
}))
