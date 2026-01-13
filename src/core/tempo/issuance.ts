import { tempoRequest } from './client'
import type { IssuanceDTO } from './types'

export async function getIssuance(): Promise<IssuanceDTO[]> {
  return tempoRequest<IssuanceDTO[]>('/issuance')
}
