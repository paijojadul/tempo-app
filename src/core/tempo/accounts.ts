import { tempoRequest } from './client'
import type { AccountDTO } from './types'

export async function getAccounts(): Promise<AccountDTO[]> {
  return tempoRequest<AccountDTO[]>('/accounts')
}
