import { tempoRequest } from '../../core/tempo/client'
import type { Transaction } from './types'

export async function fetchTransactions(): Promise<Transaction[]> {
  return tempoRequest<Transaction[]>('/transactions')
}
