#!/bin/bash

echo "🧪 Testing Railway deployment configuration..."

# Test 1: Simple health server
echo "1️⃣ Testing simple health server..."
node simple-health.js &
HEALTH_PID=$!
sleep 3

echo "🔍 Testing health endpoint..."
HEALTH_RESPONSE=$(curl -s http://localhost:3000/api/v2/healthz)
echo "Response: $HEALTH_RESPONSE"

if echo "$HEALTH_RESPONSE" | grep -q '"status":"ok"'; then
    echo "✅ Simple health server works"
else
    echo "❌ Simple health server failed"
fi

kill $HEALTH_PID
sleep 2

# Test 2: Check build output
echo "2️⃣ Checking build output..."
if [ -d ".next/standalone" ]; then
    echo "✅ Standalone build exists"
else
    echo "❌ Standalone build missing - running build..."
    npm run build
fi

# Test 3: Test standalone server
echo "3️⃣ Testing standalone server..."
if [ -f ".next/standalone/server.js" ]; then
    echo "✅ Standalone server.js exists"
    PORT=3001 HOSTNAME=0.0.0.0 node .next/standalone/server.js &
    STANDALONE_PID=$!
    sleep 5
    
    STANDALONE_RESPONSE=$(curl -s http://localhost:3001/api/v2/healthz)
    echo "Standalone response: $STANDALONE_RESPONSE"
    
    if echo "$STANDALONE_RESPONSE" | grep -q '"status":"ok"'; then
        echo "✅ Standalone server works"
    else
        echo "❌ Standalone server failed"
    fi
    
    kill $STANDALONE_PID
else
    echo "❌ Standalone server.js missing"
fi

echo "🏁 Railway deployment test complete"