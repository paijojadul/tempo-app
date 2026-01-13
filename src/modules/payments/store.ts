import { create } from 'zustand'
import type { AsyncState } from '../../shared/store/async'
import { createAsyncState } from '../../shared/store/async'
import type { Payment } from './types'
import { fetchPayments } from './service'

type PaymentsStore = {
  payments: AsyncState<Payment[]>
  loadPayments: () => Promise<void>
}

export const usePaymentsStore = create<PaymentsStore>((set) => ({
  payments: createAsyncState<Payment[]>(),

  async loadPayments() {
    set((s) => ({
      payments: { ...s.payments, status: 'loading', error: undefined },
    }))

    try {
      const data = await fetchPayments()
      set({
        payments: { data, status: 'success' },
      })
    } catch (err) {
      set({
        payments: {
          data: null,
          status: 'error',
          error: 'FAILED_TO_LOAD',
        },
      })
    }
  },
}))
