import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const MODULES = path.join(ROOT, 'src/modules')

function getExportedFunction(storeContent) {
  const m = storeContent.match(/import\s+\{\s*(fetch\w+)\s*\}\s+from\s+'\.\/service'/)
  return m?.[1]
}

function getTypeName(typesContent) {
  const m = typesContent.match(/export\s+interface\s+(\w+)/)
  return m?.[1]
}

for (const module of fs.readdirSync(MODULES)) {
  const base = path.join(MODULES, module)
  if (!fs.statSync(base).isDirectory()) continue

  const service = path.join(base, 'service.ts')
  const store = path.join(base, 'store.ts')
  const types = path.join(base, 'types.ts')

  if (![service, store, types].every(fs.existsSync)) continue

  const storeContent = fs.readFileSync(store, 'utf8')
  const typesContent = fs.readFileSync(types, 'utf8')

  const fn = getExportedFunction(storeContent)
  const type = getTypeName(typesContent)

  if (!fn || !type) {
    console.log(`⚠️ skip ${module} (cannot infer contract)`)
    continue
  }

  const content = `// Phase 3 Day 3 — Real service proxy
// ❌ No mock
// ❌ No logic
// ❌ No state

import { tempoRequest } from '../../core/tempo/client'
import type { ${type} } from './types'

export async function ${fn}(): Promise<${type}[]> {
  return tempoRequest<${type}[]>('/${module}')
}
`

  fs.writeFileSync(service, content, 'utf8')
  console.log(`✅ fixed: ${module}/service.ts`)
}
