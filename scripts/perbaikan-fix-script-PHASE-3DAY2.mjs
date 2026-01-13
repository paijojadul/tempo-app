// scripts/perbaikan-fix-script-PHASE-3DAY2.mjs
// FIX RESMI: Phase 3 Day 2 — Core Endpoint Wrapper
// Tujuan: betulkan import type (SINGULAR) + return array
// Aman, idempotent, & non-destruktif

import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const CORE_TEMPO = path.join(ROOT, 'src/core/tempo')

const FIXES = [
  {
    file: 'accounts.ts',
    content: `import { tempoRequest } from './client'
import type { Account } from '../../modules/accounts/types'

export async function getAccounts(): Promise<Account[]> {
  return tempoRequest<Account[]>('/accounts')
}
`,
  },
  {
    file: 'exchange.ts',
    content: `import { tempoRequest } from './client'
import type { Exchange } from '../../modules/exchange/types'

export async function getExchanges(): Promise<Exchange[]> {
  return tempoRequest<Exchange[]>('/exchange')
}
`,
  },
  {
    file: 'payments.ts',
    content: `import { tempoRequest } from './client'
import type { Payment } from '../../modules/payments/types'

export async function getPayments(): Promise<Payment[]> {
  return tempoRequest<Payment[]>('/payments')
}
`,
  },
  {
    file: 'transactions.ts',
    content: `import { tempoRequest } from './client'
import type { Transaction } from '../../modules/transactions/types'

export async function getTransactions(): Promise<Transaction[]> {
  return tempoRequest<Transaction[]>('/transactions')
}
`,
  },
]

console.log('🔧 PHASE 3 DAY 2 — CORE WRAPPER FIX')
console.log('Target:', CORE_TEMPO)
console.log('────────────────────────────────────')

for (const fix of FIXES) {
  const targetPath = path.join(CORE_TEMPO, fix.file)

  if (!fs.existsSync(targetPath)) {
    console.warn(`⚠️  SKIP: ${fix.file} (file tidak ditemukan)`)
    continue
  }

  fs.writeFileSync(targetPath, fix.content, 'utf-8')
  console.log(`✅ FIXED: ${fix.file}`)
}

console.log('────────────────────────────────────')
console.log('🎯 FIX SELESAI — lanjutkan dengan healthcheck')
console.log('👉 node scripts/healthcheck.mjs')
