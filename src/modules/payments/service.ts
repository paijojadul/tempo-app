import { tempoRequest } from '../../core/tempo/client'
import type { Payment } from './types'

export async function fetchPayments(): Promise<Payment[]> {
  return tempoRequest<Payment[]>('/payments')
}
