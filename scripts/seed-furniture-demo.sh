#!/bin/bash

# Seed furniture demo data
echo "🪑 Seeding furniture demo data..."

# Get JWT token (you'll need to replace this with actual authentication)
JWT_TOKEN="${FURNITURE_JWT_TOKEN:-}"

# Seed furniture data
curl -X POST http://localhost:3000/api/v1/furniture/seed \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -d '{"confirm": true}'

echo "✅ Furniture demo data seeded successfully!"