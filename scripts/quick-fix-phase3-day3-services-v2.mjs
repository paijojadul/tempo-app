// scripts/quick-fix-phase3-day3-services-v2.mjs
// Phase 3 Day 3 — Service → Core (SAFE VERSION)

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const MODULES_DIR = path.resolve(__dirname, '../src/modules')

const MAP = {
  accounts: 'getAccounts',
  exchange: 'getExchanges',
  issuance: 'getIssuance',
  payments: 'getPayments',
  transactions: 'getTransactions',
}

console.log('🔧 Phase 3 Day 3 — Fixing services (v2)...\n')

for (const [moduleName, coreFn] of Object.entries(MAP)) {
  const servicePath = path.join(MODULES_DIR, moduleName, 'service.ts')
  if (!fs.existsSync(servicePath)) continue

  const exportName =
    'fetch' + coreFn.replace(/^get/, '')

  const content = `// Service — Phase 3 Day 3
// ✅ Adapter only
// ❌ No business logic
// ❌ No state
// ❌ No mock

import * as core from '../../core/tempo'

export async function ${exportName}() {
  return core.${coreFn}()
}
`

  fs.writeFileSync(servicePath, content, 'utf8')
  console.log(`✅ Fixed: ${moduleName}/service.ts`)
}

console.log('\n🎉 DONE — Services correctly wired to core')
console.log('👉 Next: node scripts/healthcheck.mjs')
