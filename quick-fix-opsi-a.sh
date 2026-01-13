#!/bin/bash
set -e

echo "🔧 QUICK FIX OPSI A — EXACT OPTIONAL TYPES"

FILES=(
  "src/shared/store/async.ts"
  "src/modules/accounts/store.ts"
  "src/modules/exchange/store.ts"
  "src/modules/issuance/store.ts"
  "src/modules/payments/store.ts"
  "src/modules/transactions/store.ts"
)

for FILE in "${FILES[@]}"; do
  if [ -f "$FILE" ]; then
    echo "➡️ fixing $FILE"

    # 1. error?: string  -> error: string | null
    sed -i 's/error\?: string/error: string | null/g' "$FILE"

    # 2. error: undefined -> error: null
    sed -i 's/error: undefined/error: null/g' "$FILE"

    # 3. error = undefined -> error = null
    sed -i 's/error = undefined/error = null/g' "$FILE"
  else
    echo "⚠️ skip (not found): $FILE"
  fi
done

echo "✅ QUICK FIX SELESAI"
echo "➡️ lanjutkan dengan:"
echo "   pnpm lint"
echo "   npx tsc --noEmit"
echo "   node scripts/audit.phase4.mjs"
