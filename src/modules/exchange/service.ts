import { tempoRequest } from '../../core/tempo/client'
import type { Exchange } from './types'

export async function fetchExchanges(): Promise<Exchange[]> {
  return tempoRequest<Exchange[]>('/exchange')
}
