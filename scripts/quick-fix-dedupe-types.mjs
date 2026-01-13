import fs from 'fs'
import path from 'path'

const MODULES = [
  'accounts',
  'issuance',
  'payments',
  'transactions',
]

for (const mod of MODULES) {
  const file = path.resolve(`src/modules/${mod}/types.ts`)
  if (!fs.existsSync(file)) continue

  let src = fs.readFileSync(file, 'utf-8')

  // HAPUS interface duplikat
  src = src.replace(
    /export interface [A-Za-z]+ \{[\s\S]*?\}\n?/g,
    ''
  )

  fs.writeFileSync(file, src.trim() + '\n')
  console.log(`✅ deduped types: ${file}`)
}

console.log('\n🎉 TYPE DEDUPLICATION DONE')
