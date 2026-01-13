import fs from 'fs'
import path from 'path'

const ROOT = path.resolve('src/modules')

const MODULES = [
  { name: 'accounts', type: 'Account', endpoint: '/accounts' },
  { name: 'exchange', type: 'Exchange', endpoint: '/exchange' },
  { name: 'issuance', type: 'Issuance', endpoint: '/issuance' },
  { name: 'payments', type: 'Payment', endpoint: '/payments' },
  { name: 'transactions', type: 'Transaction', endpoint: '/transactions' },
]

function fixService(mod) {
  const file = path.join(ROOT, mod.name, 'service.ts')

  const content = `
import { tempoRequest } from '../../core/tempo/client'
import type { ${mod.type} } from './types'

export async function fetch${mod.type}s(): Promise<${mod.type}[]> {
  return tempoRequest<${mod.type}[]>('${mod.endpoint}')
}
`.trimStart()

  fs.writeFileSync(file, content)
  console.log(`✅ fixed service: ${file}`)
}

function fixStore(mod) {
  const file = path.join(ROOT, mod.name, 'store.ts')

  if (!fs.existsSync(file)) return

  let src = fs.readFileSync(file, 'utf-8')

  src = src.replace(
    /fetch\w+/g,
    `fetch${mod.type}s`
  )

  fs.writeFileSync(file, src)
  console.log(`✅ fixed store: ${file}`)
}

function ensureTypes(mod) {
  const file = path.join(ROOT, mod.name, 'types.ts')

  if (!fs.existsSync(file)) {
    fs.writeFileSync(
      file,
      `export interface ${mod.type} { id: string }\n`
    )
    console.log(`🆕 created types: ${file}`)
    return
  }

  const src = fs.readFileSync(file, 'utf-8')
  if (!src.includes(`interface ${mod.type}`)) {
    fs.appendFileSync(
      file,
      `\nexport interface ${mod.type} { id: string }\n`
    )
    console.log(`➕ patched types: ${file}`)
  }
}

for (const mod of MODULES) {
  ensureTypes(mod)
  fixService(mod)
  fixStore(mod)
}

console.log('\n🎉 PHASE 3 QUICK FIX DONE')
