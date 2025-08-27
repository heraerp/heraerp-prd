#!/bin/bash

echo "🧪 Testing HERA MCP Production Server"
echo "====================================="
echo

echo "1️⃣ Checking health endpoint..."
curl -s https://alluring-expression-production.up.railway.app/health | python3 -m json.tool
echo

echo "2️⃣ Checking debug info..."
curl -s https://alluring-expression-production.up.railway.app/debug | python3 -m json.tool
echo

echo "3️⃣ Testing chat endpoint..."
curl -s -X POST https://alluring-expression-production.up.railway.app/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "list all customers",
    "organizationId": "3df8cc52-3d81-42d5-b088-7736ae26cc7c"
  }' | python3 -m json.tool
echo

echo "✅ Test complete!"