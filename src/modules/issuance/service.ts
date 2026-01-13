import { tempoRequest } from '../../core/tempo/client'
import type { Issuance } from './types'

export async function fetchIssuances(): Promise<Issuance[]> {
  return tempoRequest<Issuance[]>('/issuance')
}
