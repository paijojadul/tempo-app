// src/core/tempo/exchange.ts
import { tempoRequest } from './client'

/**
 * DTO netral untuk API Exchange
 * Core TIDAK BOLEH import module types
 */
export type ExchangeDTO = {
  id: string
  symbol: string
  rate: number
}

export async function getExchanges(): Promise<ExchangeDTO[]> {
  return tempoRequest<ExchangeDTO[]>('/exchange')
}
