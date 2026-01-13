#!/bin/bash
set -e

echo "🔧 QUICK FIX OPSI A — FINAL (exactOptionalPropertyTypes compliant)"

#######################################
# 1️⃣ FIX AsyncState
#######################################
echo "➡️ fixing AsyncState"

cat > src/shared/store/async.ts << 'EOF'
export type AsyncStatus = 'idle' | 'loading' | 'success' | 'error'

export interface AsyncState<T> {
  status: AsyncStatus
  data: T | null
  error?: string
}

export const createAsyncState = <T>(): AsyncState<T> => ({
  status: 'idle',
  data: null,
})
EOF

#######################################
# 2️⃣ FIX Tempo Client
#######################################
echo "➡️ fixing tempo client status"

sed -i 's/this.status = .*/this.status = status ?? 0/' \
  src/core/tempo/client.ts

#######################################
# 3️⃣ FIX ALL STORES (error: null → delete)
#######################################
echo "➡️ fixing all store loading states"

for f in \
  src/modules/accounts/store.ts \
  src/modules/exchange/store.ts \
  src/modules/issuance/store.ts \
  src/modules/payments/store.ts \
  src/modules/transactions/store.ts
do
  sed -i "s/error: null,//g" "$f"
  sed -i "s/, error: null//g" "$f"
done

echo "✅ QUICK FIX FINAL SELESAI"
echo "➡️ lanjutkan dengan:"
echo "   npx tsc --noEmit"
echo "   node scripts/audit.phase4.mjs"
