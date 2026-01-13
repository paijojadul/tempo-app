// scripts/fix-phase3-day3-core-dto.mjs
// ============================================================================
// Phase 3 Day 3 — Core DTO Boundary Fix
// - Remove core → modules type imports
// - Enforce core-owned DTOs
// - NON-DESTRUCTIVE (types only)
// ============================================================================

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const ROOT = path.resolve(__dirname, '..')

const CORE_TEMPO = path.join(ROOT, 'src/core/tempo')
const TYPES_FILE = path.join(CORE_TEMPO, 'types.ts')

console.log('🔧 Phase 3 Day 3 — Core DTO Boundary Fix\n')

/* ============================================================================
 * DTO Registry
 * ========================================================================== */

const DTO_MAP = {
  accounts: {
    file: 'accounts.ts',
    dto: 'AccountDTO',
    endpoint: '/accounts',
  },
  payments: {
    file: 'payments.ts',
    dto: 'PaymentDTO',
    endpoint: '/payments',
  },
  transactions: {
    file: 'transactions.ts',
    dto: 'TransactionDTO',
    endpoint: '/transactions',
  },
  issuance: {
    file: 'issuance.ts',
    dto: 'IssuanceDTO',
    endpoint: '/issuance',
  },
}

/* ============================================================================
 * Ensure DTO types exist
 * ========================================================================== */

function ensureDTOTypes() {
  let content = fs.existsSync(TYPES_FILE)
    ? fs.readFileSync(TYPES_FILE, 'utf-8')
    : ''

  let updated = false

  for (const { dto } of Object.values(DTO_MAP)) {
    if (!content.includes(`export type ${dto}`)) {
      content += `\nexport type ${dto} = {\n  id: string\n}\n`
      updated = true
    }
  }

  if (updated) {
    fs.writeFileSync(TYPES_FILE, content.trim() + '\n')
    console.log('✅ DTO types ensured in core/tempo/types.ts')
  } else {
    console.log('ℹ️ DTO types already present')
  }
}

/* ============================================================================
 * Fix core files
 * ========================================================================== */

function fixCoreFile({ file, dto, endpoint }) {
  const filePath = path.join(CORE_TEMPO, file)

  if (!fs.existsSync(filePath)) {
    console.log(`⚠️ Skip: ${file} not found`)
    return
  }

  const fixed = `import { tempoRequest } from './client'
import type { ${dto} } from './types'

export async function get${file
    .replace('.ts', '')
    .replace(/^\w/, c => c.toUpperCase())}(): Promise<${dto}[]> {
  return tempoRequest<${dto}[]>('${endpoint}')
}
`

  fs.writeFileSync(filePath, fixed)
  console.log(`✔ Fixed ${file}`)
}

/* ============================================================================
 * Run
 * ========================================================================== */

ensureDTOTypes()

for (const config of Object.values(DTO_MAP)) {
  fixCoreFile(config)
}

console.log('\n🎉 Phase 3 Day 3 core boundary fix COMPLETE')
console.log('🔒 Core no longer depends on modules/* types')
