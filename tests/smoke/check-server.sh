#\!/bin/bash

# Check if development server is running
echo "🔍 Checking if HERA development server is running..."

response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")

if [ "$response" = "000" ]; then
    echo "❌ Development server is not running on localhost:3000"
    echo "Please start the server with: npm run dev"
    exit 1
elif [ "$response" = "200" ] || [ "$response" = "404" ]; then
    echo "✅ Development server is running (HTTP $response)"
    exit 0
else
    echo "⚠️  Server responded with HTTP $response"
    exit 1
fi
