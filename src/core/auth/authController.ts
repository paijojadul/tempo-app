import type { AuthSession } from './types'
import { connectPasskey } from './passkey/passkeyClient'

export async function connectWithPasskey(): Promise<AuthSession> {
  const address = await connectPasskey()

  return {
    method: 'passkey',
    address,
    capabilities: {
      payments: false,
      batch: false,
      parallel: false,
    },
  }
}
