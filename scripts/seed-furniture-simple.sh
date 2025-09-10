#!/bin/bash

# Simple furniture seed script - uses organization_id from env
echo "🪑 Seeding furniture demo data..."

# Call the seed endpoint with empty body
# The API will use DEFAULT_ORGANIZATION_ID from env
curl -X POST http://localhost:3000/api/v1/furniture/seed \
  -H "Content-Type: application/json" \
  -d '{}'

echo ""
echo "✅ Seed request sent!"