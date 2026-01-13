import fs from 'fs'
import path from 'path'

const modulesDir = path.resolve('src/modules')

for (const moduleName of fs.readdirSync(modulesDir)) {
  const modulePath = path.join(modulesDir, moduleName)
  if (!fs.statSync(modulePath).isDirectory()) continue

  const typesPath = path.join(modulePath, 'types.ts')
  const storePath = path.join(modulePath, 'store.ts')
  const servicePath = path.join(modulePath, 'service.ts')

  if (!fs.existsSync(storePath)) continue

  // infer type name (singular)
  let typeName = 'any'
  if (fs.existsSync(typesPath)) {
    const typesContent = fs.readFileSync(typesPath, 'utf8')
    const match = typesContent.match(/export interface (\w+)/)
    if (match) typeName = match[1]
  }

  const fnName = `fetch${moduleName[0].toUpperCase()}${moduleName.slice(1)}`

  const content = `import { tempoRequest } from '../../core/tempo/client'
import type { ${typeName} } from './types'

export async function ${fnName}(): Promise<${typeName}[]> {
  return tempoRequest<${typeName}[]>('/${moduleName}')
}
`

  fs.writeFileSync(servicePath, content)
  console.log('✅ fixed:', servicePath)
}
