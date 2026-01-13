// scripts/test-rpc-day5.mjs
import 'dotenv/config'
import { tempoRequest } from '../src/core/tempo/client.ts'

async function main() {
  console.log('🔌 Testing Moderato RPC (JSON-RPC)...')

  try {
    const result = await tempoRequest('', {
      method: 'POST',
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_chainId',
        params: [],
      }),
    })

    console.log('✅ RPC Response:')
    console.dir(result, { depth: null })
  } catch (err) {
    console.error('❌ RPC Error:')
    console.error(err)
  }
}

main()
