#!/bin/bash

echo "🏥 Railway Health Check Monitor"
echo "=============================="

# Get Railway service URL if available
if [ -n "$RAILWAY_STATIC_URL" ]; then
    BASE_URL="https://$RAILWAY_STATIC_URL"
elif [ -n "$RAILWAY_PUBLIC_DOMAIN" ]; then
    BASE_URL="https://$RAILWAY_PUBLIC_DOMAIN"
else
    echo "ℹ️  Railway URL not found in environment variables"
    echo "Please provide your Railway service URL:"
    read -p "Enter URL (e.g., https://your-service.railway.app): " BASE_URL
fi

echo "🔍 Testing health endpoints on: $BASE_URL"
echo ""

# Test all health endpoints
ENDPOINTS=("/health" "/healthz" "/api/v2/healthz")

for endpoint in "${ENDPOINTS[@]}"; do
    echo "Testing: $BASE_URL$endpoint"
    
    # Use curl with timeout and verbose headers
    RESPONSE=$(curl -s -w "HTTP_CODE:%{http_code}|TIME:%{time_total}s" \
        -H "Accept: application/json" \
        -H "User-Agent: Railway-Health-Check" \
        --max-time 10 \
        "$BASE_URL$endpoint" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        HTTP_CODE=$(echo "$RESPONSE" | grep -o 'HTTP_CODE:[0-9]*' | cut -d':' -f2)
        TIME=$(echo "$RESPONSE" | grep -o 'TIME:[0-9.]*s' | cut -d':' -f2)
        BODY=$(echo "$RESPONSE" | sed 's/HTTP_CODE:[0-9]*|TIME:[0-9.]*s$//')
        
        if [ "$HTTP_CODE" = "200" ]; then
            echo "✅ SUCCESS - HTTP $HTTP_CODE in $TIME"
            echo "   Response: $(echo "$BODY" | jq -r '.status // "N/A"' 2>/dev/null || echo "Non-JSON response")"
        else
            echo "❌ FAILED - HTTP $HTTP_CODE in $TIME"
            echo "   Response: $BODY"
        fi
    else
        echo "❌ TIMEOUT or CONNECTION ERROR"
    fi
    echo ""
done

echo "🔍 Railway Health Check Summary:"
echo "- Make sure your Railway service is using /health as healthcheck path"
echo "- Health endpoints should respond with HTTP 200 in under 5 seconds"
echo "- If all endpoints fail, check Railway logs for startup errors"
echo ""
echo "Railway Configuration:"
echo '  "healthcheckPath": "/health",'
echo '  "healthcheckTimeout": 300'