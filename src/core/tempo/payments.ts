import { tempoRequest } from './client'
import type { PaymentDTO } from './types'

export async function getPayments(): Promise<PaymentDTO[]> {
  return tempoRequest<PaymentDTO[]>('/payments')
}
