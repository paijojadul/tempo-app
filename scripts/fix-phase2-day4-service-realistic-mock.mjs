#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const MODULES_DIR = path.resolve('src/modules')

const SERVICES = {
  accounts: {
    fn: 'fetchAccounts',
    type: 'Account',
    data: `
const mockAccounts: Account[] = [
  { id: 'acc-1', name: 'Main Account', balance: 1200 },
  { id: 'acc-2', name: 'Savings', balance: 5000 },
]
`,
  },

  payments: {
    fn: 'fetchPayments',
    type: 'Payment',
    data: `
const mockPayments: Payment[] = [
  { id: 'pay-1', amount: 250, status: 'completed' },
  { id: 'pay-2', amount: 120, status: 'pending' },
]
`,
  },

  transactions: {
    fn: 'fetchTransactions',
    type: 'Transaction',
    data: `
const mockTransactions: Transaction[] = [
  { id: 'tx-1', amount: 300, direction: 'out' },
  { id: 'tx-2', amount: 900, direction: 'in' },
]
`,
  },

  exchange: {
    fn: 'fetchExchangeRates',
    type: 'ExchangeRate',
    data: `
const mockRates: ExchangeRate[] = [
  { pair: 'USD/IDR', rate: 15600 },
  { pair: 'EUR/IDR', rate: 17000 },
]
`,
  },

  issuance: {
    fn: 'fetchIssuances',
    type: 'Issuance',
    data: `
const mockIssuances: Issuance[] = [
  { id: 'iss-1', asset: 'BOND-A', status: 'active' },
  { id: 'iss-2', asset: 'TOKEN-X', status: 'draft' },
]
`,
  },
}

function delay(ms) {
  return `function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}`
}

for (const [moduleName, cfg] of Object.entries(SERVICES)) {
  const servicePath = path.join(MODULES_DIR, moduleName, 'service.ts')

  if (!fs.existsSync(servicePath)) {
    console.warn(`⚠️  Skip ${moduleName}: service.ts not found`)
    continue
  }

  const content = `// Service — Phase 2 Day 4
// ✅ Realistic mock
// ❌ No business logic
// ❌ No state
// ❌ No core access

import type { ${cfg.type} } from './types'

${cfg.data}

${delay()}

export async function ${cfg.fn}(): Promise<${cfg.type}[]> {
  await delay(400)

  if (Math.random() < 0.2) {
    throw new Error('Failed to fetch ${moduleName}')
  }

  return ${
    cfg.data.includes('mockRates')
      ? 'mockRates'
      : cfg.data.includes('mockTransactions')
      ? 'mockTransactions'
      : cfg.data.includes('mockPayments')
      ? 'mockPayments'
      : cfg.data.includes('mockIssuances')
      ? 'mockIssuances'
      : 'mockAccounts'
  }
}
`

  fs.writeFileSync(servicePath, content.trim() + '\n')
  console.log(`✅ Fixed service: ${moduleName}`)
}

console.log('\n🎯 Phase 2 Day 4 — SERVICE REALISTIC MOCK APPLIED')
console.log('👉 Next: run healthcheck')
