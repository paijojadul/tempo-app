#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()

const modules = [
  { name: 'accounts', state: 'accounts', type: 'Account' },
  { name: 'payments', state: 'payments', type: 'Payment' },
  { name: 'transactions', state: 'transactions', type: 'Transaction' },
  { name: 'exchange', state: 'exchange', type: 'ExchangeItem' },
  { name: 'issuance', state: 'issuance', type: 'Issuance' },
]

function updateStore({ name, state, type }) {
  const file = path.join(ROOT, 'src/modules', name, 'store.ts')

  const content = `import { create } from 'zustand'
import type { AsyncState } from '../../shared/store/async'
import { createAsyncState } from '../../shared/store/async'
import type { ${type} } from './types'
import { fetch${state[0].toUpperCase() + state.slice(1)} } from './service'

type ${state[0].toUpperCase() + state.slice(1)}Store = {
  ${state}: AsyncState<${type}[]>
  load${state[0].toUpperCase() + state.slice(1)}: () => Promise<void>
}

export const use${state[0].toUpperCase() + state.slice(1)}Store = create<${state[0].toUpperCase() + state.slice(1)}Store>((set) => ({
  ${state}: createAsyncState<${type}[]>(),

  async load${state[0].toUpperCase() + state.slice(1)}() {
    set((s) => ({
      ${state}: { ...s.${state}, status: 'loading', error: undefined },
    }))

    try {
      const data = await fetch${state[0].toUpperCase() + state.slice(1)}()
      set({
        ${state}: { data, status: 'success' },
      })
    } catch (err) {
      set({
        ${state}: {
          data: null,
          status: 'error',
          error: 'FAILED_TO_LOAD',
        },
      })
    }
  },
}))
`

  fs.writeFileSync(file, content)
  console.log(`🔧 UPDATED: ${name}/store.ts`)
}

console.log('🚀 PHASE 2 — DAY 2: ADD ACTIONS\n')

modules.forEach(updateStore)

console.log('\n✅ DAY 2 STORE ACTIONS DONE')
console.log('➡️  NEXT: node scripts/healthcheck.mjs')
