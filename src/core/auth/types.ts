export type AuthMethod = 'metamask' | 'passkey'

export type AuthSession = {
  method: AuthMethod
  address: string

  capabilities: {
    payments: false
    batch: false
    parallel: false
  }
}
