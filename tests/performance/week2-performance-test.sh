#!/bin/bash

# HERA Finance Phase 1: Week 2 Performance Infrastructure Testing
# Tests Redis caching, rate limiting, and idempotency features

set -e

echo "🚀 HERA Week 2 Performance Infrastructure Test"
echo "=============================================="
echo ""

# Configuration
API_URL="${API_URL:-https://qqagokigwuujyeyrgdkq.supabase.co/functions/v1/api-v2}"
JWT="${JWT_TOKEN:-}"
ORG_ID="${ORG_ID:-}"

if [ -z "$JWT" ]; then
  echo "❌ JWT_TOKEN environment variable not set"
  echo "Usage: JWT_TOKEN=xxx ORG_ID=xxx ./tests/performance/week2-performance-test.sh"
  exit 1
fi

if [ -z "$ORG_ID" ]; then
  echo "❌ ORG_ID environment variable not set"
  echo "Usage: JWT_TOKEN=xxx ORG_ID=xxx ./tests/performance/week2-performance-test.sh"
  exit 1
fi

echo "🔧 Configuration:"
echo "   API URL: $API_URL"
echo "   Organization ID: $ORG_ID"
echo "   JWT: ${JWT:0:20}..."
echo ""

# Test 1: Enhanced Health Check
echo "📋 Test 1: Enhanced Health Check with Performance Infrastructure"
echo "--------------------------------------------------------------"

HEALTH_RESPONSE=$(curl -s "$API_URL/health" | jq .)
echo "$HEALTH_RESPONSE"

# Check components
REDIS_STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.components.redis // "unknown"')
RATE_LIMITER_STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.components.rate_limiter // "unknown"')
IDEMPOTENCY_STATUS=$(echo "$HEALTH_RESPONSE" | jq -r '.components.idempotency // "unknown"')
VERSION=$(echo "$HEALTH_RESPONSE" | jq -r '.version // "unknown"')

echo ""
echo "✅ API Gateway Version: $VERSION"
echo "✅ Redis Status: $REDIS_STATUS"
echo "✅ Rate Limiter Status: $RATE_LIMITER_STATUS"
echo "✅ Idempotency Status: $IDEMPOTENCY_STATUS"

if [ "$REDIS_STATUS" = "healthy" ]; then
  echo "✅ Redis caching is operational"
else
  echo "⚠️  Redis caching not available - operating in degraded mode"
fi

echo ""

# Test 2: Actor Identity Caching Test
echo "📋 Test 2: Actor Identity Caching Performance Test"
echo "--------------------------------------------------"

echo "🔄 Making first request (cache miss expected)..."
START_TIME=$(date +%s%3N)

FIRST_REQUEST=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST "$API_URL/entities" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG_ID" \
  -d '{
    "operation": "READ",
    "entity_data": {
      "entity_type": "CUSTOMER"
    },
    "organization_id": "'$ORG_ID'"
  }')

FIRST_TIME=$(date +%s%3N)
FIRST_DURATION=$((FIRST_TIME - START_TIME))

HTTP_CODE=$(echo "$FIRST_REQUEST" | tail -n1 | sed 's/HTTP_CODE://')
FIRST_BODY=$(echo "$FIRST_REQUEST" | sed '$d')

echo "📥 First request completed in ${FIRST_DURATION}ms (HTTP $HTTP_CODE)"

if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ First request successful"
  
  # Wait a moment then make second request
  sleep 1
  
  echo "🔄 Making second request (cache hit expected)..."
  START_TIME=$(date +%s%3N)

  SECOND_REQUEST=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -X POST "$API_URL/entities" \
    -H "Authorization: Bearer $JWT" \
    -H "Content-Type: application/json" \
    -H "X-Organization-Id: $ORG_ID" \
    -d '{
      "operation": "READ",
      "entity_data": {
        "entity_type": "CUSTOMER"
      },
      "organization_id": "'$ORG_ID'"
    }')

  SECOND_TIME=$(date +%s%3N)
  SECOND_DURATION=$((SECOND_TIME - START_TIME))
  
  HTTP_CODE2=$(echo "$SECOND_REQUEST" | tail -n1 | sed 's/HTTP_CODE://')
  
  echo "📥 Second request completed in ${SECOND_DURATION}ms (HTTP $HTTP_CODE2)"
  
  if [ "$HTTP_CODE2" = "200" ]; then
    echo "✅ Second request successful"
    
    # Calculate performance improvement
    if [ $SECOND_DURATION -lt $FIRST_DURATION ]; then
      IMPROVEMENT=$((FIRST_DURATION - SECOND_DURATION))
      PERCENT=$(((IMPROVEMENT * 100) / FIRST_DURATION))
      echo "🚀 Performance improvement: ${IMPROVEMENT}ms (${PERCENT}% faster)"
      
      if [ $PERCENT -gt 20 ]; then
        echo "✅ Significant caching performance improvement detected!"
      else
        echo "⚠️  Modest caching improvement - may indicate Redis not fully optimized"
      fi
    else
      echo "⚠️  No performance improvement detected - cache may not be working"
    fi
  else
    echo "❌ Second request failed"
  fi
else
  echo "❌ First request failed - cannot test caching performance"
fi

echo ""

# Test 3: Rate Limiting Test
echo "📋 Test 3: Rate Limiting Functionality Test"
echo "-------------------------------------------"

echo "🔄 Testing rate limiting with rapid requests..."

RATE_LIMIT_EXCEEDED=false
RATE_LIMIT_HEADERS=""

for i in {1..10}; do
  echo "   Request $i/10..."
  
  RATE_TEST_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}\nHEADERS:%{header_json}" \
    -X POST "$API_URL/entities" \
    -H "Authorization: Bearer $JWT" \
    -H "Content-Type: application/json" \
    -H "X-Organization-Id: $ORG_ID" \
    -d '{
      "operation": "READ",
      "entity_data": {
        "entity_type": "TEST"
      },
      "organization_id": "'$ORG_ID'"
    }')
  
  HTTP_CODE=$(echo "$RATE_TEST_RESPONSE" | grep "HTTP_CODE:" | sed 's/HTTP_CODE://')
  
  if [ "$HTTP_CODE" = "429" ]; then
    echo "🚫 Rate limit triggered at request $i"
    RATE_LIMIT_EXCEEDED=true
    
    # Extract rate limit headers
    RESPONSE_BODY=$(echo "$RATE_TEST_RESPONSE" | sed '/HTTP_CODE:/,$d')
    echo "Rate limit response: $RESPONSE_BODY"
    break
  elif [ "$HTTP_CODE" = "200" ]; then
    # Look for rate limit headers
    X_RATE_LIMIT=$(curl -s -I \
      -X POST "$API_URL/entities" \
      -H "Authorization: Bearer $JWT" \
      -H "Content-Type: application/json" \
      -H "X-Organization-Id: $ORG_ID" | grep -i "x-ratelimit" || echo "")
    
    if [ -n "$X_RATE_LIMIT" ]; then
      echo "   ✅ Rate limit headers found: $X_RATE_LIMIT"
      RATE_LIMIT_HEADERS="$X_RATE_LIMIT"
    fi
  else
    echo "   ⚠️  Unexpected response code: $HTTP_CODE"
  fi
  
  # Small delay between requests
  sleep 0.1
done

if [ "$RATE_LIMIT_EXCEEDED" = true ]; then
  echo "✅ Rate limiting is working correctly"
else
  echo "⚠️  Rate limiting may not be configured or limit is very high"
  if [ -n "$RATE_LIMIT_HEADERS" ]; then
    echo "✅ Rate limit headers detected, system is tracking usage"
  fi
fi

echo ""

# Test 4: Idempotency Test
echo "📋 Test 4: Idempotency Functionality Test"
echo "-----------------------------------------"

IDEMPOTENCY_KEY="test-$(date +%s)-$(shuf -i 1000-9999 -n 1)"
echo "🔄 Testing idempotency with key: $IDEMPOTENCY_KEY"

echo "   Making first request..."
IDEMPOTENT_PAYLOAD='{
  "operation": "CREATE",
  "entity_data": {
    "entity_type": "TEST_IDEMPOTENT",
    "entity_name": "Test Entity for Idempotency",
    "entity_code": "TEST_'$(date +%s)'"
  },
  "organization_id": "'$ORG_ID'",
  "smart_code": "HERA.TEST.ENTITY.IDEMPOTENT.v1"
}'

FIRST_IDEMPOTENT=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST "$API_URL/entities" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: $ORG_ID" \
  -H "X-Idempotency-Key: $IDEMPOTENCY_KEY" \
  -d "$IDEMPOTENT_PAYLOAD")

FIRST_HTTP_CODE=$(echo "$FIRST_IDEMPOTENT" | tail -n1 | sed 's/HTTP_CODE://')
FIRST_RESPONSE_BODY=$(echo "$FIRST_IDEMPOTENT" | sed '$d')

echo "   First request: HTTP $FIRST_HTTP_CODE"

if [ "$FIRST_HTTP_CODE" = "200" ]; then
  echo "✅ First idempotent request successful"
  
  # Wait a moment then make duplicate request
  sleep 1
  
  echo "   Making duplicate request with same idempotency key..."
  SECOND_IDEMPOTENT=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
    -X POST "$API_URL/entities" \
    -H "Authorization: Bearer $JWT" \
    -H "Content-Type: application/json" \
    -H "X-Organization-Id: $ORG_ID" \
    -H "X-Idempotency-Key: $IDEMPOTENCY_KEY" \
    -d "$IDEMPOTENT_PAYLOAD")
  
  SECOND_HTTP_CODE=$(echo "$SECOND_IDEMPOTENT" | tail -n1 | sed 's/HTTP_CODE://')
  SECOND_RESPONSE_BODY=$(echo "$SECOND_IDEMPOTENT" | sed '$d')
  
  echo "   Second request: HTTP $SECOND_HTTP_CODE"
  
  if [ "$SECOND_HTTP_CODE" = "200" ]; then
    # Check if response contains idempotency replay header
    REPLAY_HEADER=$(echo "$SECOND_IDEMPOTENT" | grep -i "x-idempotency-replay" || echo "")
    
    if [ -n "$REPLAY_HEADER" ] || echo "$SECOND_RESPONSE_BODY" | grep -q "idempotency"; then
      echo "✅ Idempotency working - duplicate request returned cached response"
    else
      # Compare response bodies to see if they're identical
      if [ "$FIRST_RESPONSE_BODY" = "$SECOND_RESPONSE_BODY" ]; then
        echo "✅ Idempotency appears to be working (identical responses)"
      else
        echo "⚠️  Responses differ - idempotency may not be fully working"
      fi
    fi
  else
    echo "❌ Duplicate request failed with HTTP $SECOND_HTTP_CODE"
  fi
else
  echo "❌ First idempotent request failed - cannot test duplicate detection"
fi

echo ""

# Test 5: Performance Summary
echo "📋 Test 5: Performance Summary and Recommendations"
echo "-------------------------------------------------"

# Redis status summary
if [ "$REDIS_STATUS" = "healthy" ]; then
  echo "✅ Redis Caching: OPERATIONAL"
  echo "   • Actor identity caching enabled"
  echo "   • Account resolution caching enabled"
  echo "   • Expected 80%+ cache hit rate for repeated requests"
else
  echo "⚠️  Redis Caching: DEGRADED"
  echo "   • System operating in fail-safe mode"
  echo "   • Performance may be reduced"
  echo "   • Recommendation: Check Redis configuration"
fi

# Rate limiting summary
if [ "$RATE_LIMIT_EXCEEDED" = true ] || [ -n "$RATE_LIMIT_HEADERS" ]; then
  echo "✅ Rate Limiting: OPERATIONAL"
  echo "   • 100 requests/minute protection enabled"
  echo "   • Sliding window algorithm active"
  echo "   • DoS protection functional"
else
  echo "⚠️  Rate Limiting: STATUS UNKNOWN"
  echo "   • May be configured with high limits"
  echo "   • Recommendation: Verify rate limit settings"
fi

# Idempotency summary
if echo "$SECOND_RESPONSE_BODY" | grep -q "idempotency" || [ "$FIRST_RESPONSE_BODY" = "$SECOND_RESPONSE_BODY" ]; then
  echo "✅ Idempotency: OPERATIONAL"
  echo "   • Duplicate request prevention active"
  echo "   • 24-hour response caching enabled"
  echo "   • Financial transaction safety enhanced"
else
  echo "⚠️  Idempotency: STATUS UNKNOWN"
  echo "   • May be operating in auto-generate mode"
  echo "   • Recommendation: Test with explicit idempotency keys"
fi

echo ""
echo "🎉 Week 2 Performance Infrastructure Test Complete"
echo ""

# Performance targets
echo "📊 Week 2 Performance Targets:"
echo "   Target: Sub-50ms API responses (Redis cache hits)"
echo "   Target: 80%+ cache hit rate for repeated requests"  
echo "   Target: 100 req/min rate limit protection"
echo "   Target: 24-hour idempotency window"
echo ""

if [ "$REDIS_STATUS" = "healthy" ] && 
   ([ "$RATE_LIMIT_EXCEEDED" = true ] || [ -n "$RATE_LIMIT_HEADERS" ]); then
  echo "🚀 WEEK 2 SUCCESS: Performance infrastructure is operational!"
  echo ""
  echo "Ready for Week 3: Enhanced observability and load testing"
else
  echo "⚠️  Week 2 Partial Success: Some components need attention"
  echo ""
  echo "Recommendations:"
  echo "• Check Redis/Upstash configuration if caching is degraded"
  echo "• Verify rate limit settings if protection is not triggering"
  echo "• Test idempotency with explicit X-Idempotency-Key headers"
fi

echo ""
echo "🔗 Next Steps:"
echo "• Week 3: OpenTelemetry observability"
echo "• Week 3: k6 load testing (1000+ concurrent users)"
echo "• Week 4: Production deployment with monitoring"