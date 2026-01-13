#!/bin/bash
set -e

echo "🔧 QUICK FIX OPSI A.2 — TYPE ALIGNMENT"

# ================================
# 1. FIX AsyncState TYPE
# ================================
ASYNC_FILE="src/shared/store/async.ts"

if [ -f "$ASYNC_FILE" ]; then
  echo "➡️ fixing AsyncState type"

  sed -i 's/error\?: string/error: string | null/g' "$ASYNC_FILE"
  sed -i 's/error: null/error: null/g' "$ASYNC_FILE"
fi

# ================================
# 2. FIX Store Types (error field)
# ================================
STORE_FILES=(
  "src/modules/accounts/store.ts"
  "src/modules/exchange/store.ts"
  "src/modules/issuance/store.ts"
  "src/modules/payments/store.ts"
  "src/modules/transactions/store.ts"
)

for FILE in "${STORE_FILES[@]}"; do
  if [ -f "$FILE" ]; then
    echo "➡️ fixing store type in $FILE"
    sed -i 's/error: string/error: string | null/g' "$FILE"
  fi
done

# ================================
# 3. FIX Tempo Client status
# ================================
CLIENT_FILE="src/core/tempo/client.ts"

if [ -f "$CLIENT_FILE" ]; then
  echo "➡️ fixing tempo client status"
  sed -i 's/status: number;/status: number | undefined;/g' "$CLIENT_FILE"
fi

echo "✅ QUICK FIX OPSI A.2 SELESAI"
echo "➡️ lanjutkan dengan:"
echo "   npx tsc --noEmit"
echo "   node scripts/audit.phase4.mjs"
