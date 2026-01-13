#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()

const modules = [
  {
    name: 'accounts',
    typeName: 'Account',
  },
  {
    name: 'payments',
    typeName: 'Payment',
  },
  {
    name: 'transactions',
    typeName: 'Transaction',
  },
  {
    name: 'exchange',
    typeName: 'ExchangeItem',
  },
  {
    name: 'issuance',
    typeName: 'Issuance',
  },
]

function ensureDir(filePath) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function writeTypes(module) {
  const typesPath = path.join(
    ROOT,
    'src/modules',
    module.name,
    'types.ts'
  )

  ensureDir(typesPath)

  // JANGAN overwrite kalau sudah ada & berisi
  if (fs.existsSync(typesPath)) {
    const existing = fs.readFileSync(typesPath, 'utf8').trim()
    if (existing.length > 0) {
      console.log(`⏭️  ${module.name}/types.ts already exists`)
      return
    }
  }

  const content = `/**
 * Phase 2 — Day 1
 * Placeholder type
 * SAFE TO EXTEND LATER
 */

export type ${module.typeName} = {
  id: string
}
`

  fs.writeFileSync(typesPath, content)
  console.log(`✅ ${module.name}/types.ts fixed`)
}

/* -------------------------------------------------- */
/* 🚀 RUN */
/* -------------------------------------------------- */

console.log('🩹 FIX PHASE 2 — DAY 1 TYPES\n')

for (const mod of modules) {
  writeTypes(mod)
}

console.log('\n🎉 TYPES PLACEHOLDER READY')
console.log('➡️  Re-run healthcheck')
