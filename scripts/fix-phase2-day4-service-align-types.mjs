#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const MODULES_DIR = path.resolve('src/modules')

const CONFIG = {
  accounts: {
    fn: 'fetchAccounts',
    type: 'Account',
    mock: `{ id: 'acc-1' }`,
  },
  payments: {
    fn: 'fetchPayments',
    type: 'Payment',
    mock: `{ id: 'pay-1' }`,
  },
  transactions: {
    fn: 'fetchTransactions',
    type: 'Transaction',
    mock: `{ id: 'tx-1' }`,
  },
  exchange: {
    fn: 'fetchExchange',
    type: 'ExchangeItem',
    mock: `{ id: 'ex-1' }`,
  },
  issuance: {
    fn: 'fetchIssuance',
    type: 'Issuance',
    mock: `{ id: 'iss-1' }`,
  },
}

function delayBlock() {
  return `function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}`
}

for (const [moduleName, cfg] of Object.entries(CONFIG)) {
  const servicePath = path.join(MODULES_DIR, moduleName, 'service.ts')
  const typesPath = path.join(MODULES_DIR, moduleName, 'types.ts')

  if (!fs.existsSync(servicePath) || !fs.existsSync(typesPath)) {
    console.warn(`⚠️ Skip ${moduleName}: missing service.ts or types.ts`)
    continue
  }

  const content = `// Service — Phase 2 Day 4
// ✅ Realistic mock (shape aligned to types)
// ❌ No business logic
// ❌ No state
// ❌ No core access

import type { ${cfg.type} } from './types'

const mockData: ${cfg.type}[] = [
  ${cfg.mock},
]

${delayBlock()}

export async function ${cfg.fn}(): Promise<${cfg.type}[]> {
  await delay(400)

  if (Math.random() < 0.2) {
    throw new Error('Failed to fetch ${moduleName}')
  }

  return mockData
}
`

  fs.writeFileSync(servicePath, content.trim() + '\n')
  console.log(`✅ Fixed service (aligned): ${moduleName}`)
}

console.log('\n🎯 Phase 2 Day 4 — SERVICE MOCK ALIGNED WITH TYPES')
console.log('👉 Next: run healthcheck')
