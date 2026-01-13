#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()

const sharedAsyncPath = path.join(
  ROOT,
  'src/shared/store/async.ts'
)

const modules = [
  {
    name: 'accounts',
    type: 'Account',
    stateKey: 'accounts',
  },
  {
    name: 'payments',
    type: 'Payment',
    stateKey: 'payments',
  },
  {
    name: 'transactions',
    type: 'Transaction',
    stateKey: 'transactions',
  },
  {
    name: 'exchange',
    type: 'ExchangeItem',
    stateKey: 'exchange',
  },
  {
    name: 'issuance',
    type: 'Issuance',
    stateKey: 'issuance',
  },
]

function ensureDir(filePath) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

/* -------------------------------------------------- */
/* 1️⃣ SHARED ASYNC STATE */
/* -------------------------------------------------- */

function writeSharedAsync() {
  ensureDir(sharedAsyncPath)

  const content = `export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'

export type AsyncState<T> = {
  data: T | null
  status: AsyncStatus
  error?: string
}

export function createAsyncState<T>(): AsyncState<T> {
  return {
    data: null,
    status: 'idle',
    error: undefined,
  }
}
`

  fs.writeFileSync(sharedAsyncPath, content)
  console.log('✅ shared/store/async.ts ready')
}

/* -------------------------------------------------- */
/* 2️⃣ MODULE STORES */
/* -------------------------------------------------- */

function writeStore(module) {
  const storePath = path.join(
    ROOT,
    'src/modules',
    module.name,
    'store.ts'
  )

  ensureDir(storePath)

  const content = `import { create } from 'zustand'
import type { AsyncState } from '../../shared/store/async'
import { createAsyncState } from '../../shared/store/async'
import type { ${module.type} } from './types'

type ${capitalize(module.name)}Store = {
  ${module.stateKey}: AsyncState<${module.type}[]>
}

export const use${capitalize(module.name)}Store = create<${capitalize(module.name)}Store>(() => ({
  ${module.stateKey}: createAsyncState<${module.type}[]>(),
}))
`

  fs.writeFileSync(storePath, content)
  console.log(`✅ ${module.name}/store.ts fixed`)
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

/* -------------------------------------------------- */
/* 🚀 RUN */
/* -------------------------------------------------- */

console.log('🚧 PHASE 2 — DAY 1 FIX SCRIPT\n')

writeSharedAsync()

for (const mod of modules) {
  writeStore(mod)
}

console.log('\n🎉 DAY 1 STORE SKELETON FIXED')
console.log('➡️  Next: Phase 2 Day 2 (Actions & Flow)')
