#!/usr/bin/env bash
# Simple smoke test for customers endpoints (assumes server on localhost:5173)
BASE_URL="http://localhost:5173"
set -e

echo "Checking GET /api/customers..."
curl -sS "$BASE_URL/api/customers" | sed -n '1,200p'

echo "\nIf the list returned an array with at least one customer, the script will try to GET the first customer's detail."
FIRST_ID=$(curl -sS "$BASE_URL/api/customers" | jq -r '.[0].id_customer // .[0].id // empty')
if [ -n "$FIRST_ID" ]; then
  echo "\nChecking GET /api/customers/$FIRST_ID..."
  curl -sS "$BASE_URL/api/customers/$FIRST_ID" | sed -n '1,200p'
else
  echo "No customers found in list, skipping detail check."
fi

echo "\nSmoke test completed."
