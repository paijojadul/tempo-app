#!/bin/bash
set -e

echo "🔧 QUICK FIX OPSI A.3 — FINAL TYPE CONTRACT FIX"

# ================================
# 1. FIX AsyncState (SOURCE OF TRUTH)
# ================================
ASYNC_FILE="src/shared/store/async.ts"

if [ -f "$ASYNC_FILE" ]; then
  echo "➡️ fixing AsyncState<T>"

  sed -i 's/error\?: string/error: string | null/g' "$ASYNC_FILE"
fi

# ================================
# 2. FIX STORE TYPES (ALL MODULES)
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
    echo "➡️ fixing store error type in $FILE"
    sed -i 's/error: string/error: string | null/g' "$FILE"
  fi
done

# ================================
# 3. FIX TEMPO CLIENT STATUS
# ================================
CLIENT_FILE="src/core/tempo/client.ts"

if [ -f "$CLIENT_FILE" ]; then
  echo "➡️ fixing tempo client status default"

  # ubah property
  sed -i 's/status: number;/status: number;/g' "$CLIENT_FILE"

  # pastikan assignment aman (fallback)
  sed -i 's/this.status = status/this.status = status ?? 0/g' "$CLIENT_FILE"
fi

echo "✅ QUICK FIX OPSI A.3 SELESAI"
echo "➡️ WAJIB lanjutkan dengan:"
echo "   npx tsc --noEmit"
echo "   node scripts/audit.phase4.mjs"
