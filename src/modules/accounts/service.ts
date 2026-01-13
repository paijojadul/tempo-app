import { tempoRequest } from '../../core/tempo/client'
import type { Account } from './types'

export async function fetchAccounts(): Promise<Account[]> {
  return tempoRequest<Account[]>('/accounts')
}
