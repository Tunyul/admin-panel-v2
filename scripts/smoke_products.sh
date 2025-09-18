#!/usr/bin/env bash
# Simple smoke test for products endpoints (assumes server on localhost:5173)
BASE_URL="http://localhost:5173"
set -e

echo "Checking GET /api/products..."
curl -sS "$BASE_URL/api/products" | sed -n '1,200p'

FIRST_ID=$(curl -sS "$BASE_URL/api/products" | jq -r '.[0].id_produk // .[0].id // empty')
if [ -n "$FIRST_ID" ]; then
  echo "\nChecking GET /api/products/$FIRST_ID..."
  curl -sS "$BASE_URL/api/products/$FIRST_ID" | sed -n '1,200p'
else
  echo "No products found in list, skipping detail check."
fi

echo "\nSmoke test completed."
