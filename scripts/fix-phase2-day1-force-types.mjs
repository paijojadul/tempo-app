#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()

const fixes = [
  {
    module: 'accounts',
    typeName: 'Account',
  },
  {
    module: 'transactions',
    typeName: 'Transaction',
  },
]

function writeForceTypes({ module, typeName }) {
  const filePath = path.join(
    ROOT,
    'src/modules',
    module,
    'types.ts'
  )

  const content = `/**
 * Phase 2 — Day 1
 * FORCED placeholder type
 * Source of truth for store contract
 */

export type ${typeName} = {
  id: string
}
`

  fs.writeFileSync(filePath, content)
  console.log(`🩹 FIXED: ${module}/types.ts → export ${typeName}`)
}

/* -------------------------------------------------- */
/* 🚀 RUN */
/* -------------------------------------------------- */

console.log('🧨 FORCE FIX PHASE 2 — DAY 1 TYPES\n')

for (const fix of fixes) {
  writeForceTypes(fix)
}

console.log('\n✅ FORCE FIX DONE')
console.log('➡️  run: node scripts/healthcheck.mjs')
