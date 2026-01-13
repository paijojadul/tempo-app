import { tempoRequest } from './client'
import type { TransactionDTO } from './types'

export async function getTransactions(): Promise<TransactionDTO[]> {
  return tempoRequest<TransactionDTO[]>('/transactions')
}
