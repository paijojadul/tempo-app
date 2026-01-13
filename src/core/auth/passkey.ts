// src/core/auth/passkey.ts
// PHASE 1 — PASSKEY STUB (DETERMINISTIC, NO SIDE EFFECT)

import type { AuthSession } from './types'

export async function connectWithPasskey(): Promise<AuthSession> {
  // Stub address — valid secara tipe, tidak punya makna on-chain
  const dummyAddress = '0x0000000000000000000000000000000000000000'

  return {
    method: 'passkey',
    address: dummyAddress,
    capabilities: {
      payments: false,
      batch: false,
      parallel: false,
    },
  }
}
