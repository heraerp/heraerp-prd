# 🚀 HERA Enhanced API v2 Gateway - Manual Deployment Guide

## 📋 Overview

This guide provides step-by-step instructions for manually deploying the HERA Enhanced API v2 Gateway via Supabase Dashboard when CLI deployment times out.

## 🎯 Deployment Status

- **✅ Code Status**: Production-ready Enhanced Gateway v2.3
- **❌ Current Status**: Not deployed (CLI timeout issues)  
- **🎯 Goal**: Deploy via manual dashboard process
- **⏱️ Estimated Time**: 10-15 minutes

## 🏗️ Gateway Architecture

The Enhanced API v2 Gateway includes:

- **Authentication Middleware**: JWT validation and actor resolution
- **Organization Context**: Multi-tenant organization filtering
- **Enhanced Guardrails v2.0**: Smart code validation, GL balance checking
- **Rate Limiting**: Request throttling and abuse prevention  
- **Idempotency**: Duplicate request handling
- **AI Integration**: Claude AI endpoints for HERA Digital Accountant v2.5
- **Error Handling**: Structured error responses with request tracing

## 📁 File Locations

```
Enhanced Gateway Files:
├── /supabase/functions/api-v2/index.ts                    # Original modular version
├── /supabase/functions/api-v2-consolidated/index.ts       # Single-file version (USE THIS)
├── /test-enhanced-gateway-v2_3-user-auth.mjs             # Comprehensive test suite
└── /ENHANCED-GATEWAY-DEPLOYMENT-GUIDE.md                 # This guide
```

## 🔧 Manual Deployment Steps

### Step 1: Access Supabase Dashboard

1. Open browser and navigate to:
   ```
   https://supabase.com/dashboard/project/ralywraqvuqgdezttfde/functions
   ```

2. Sign in to Supabase if prompted

3. Verify you're in the correct project:
   - Project: `heraerp-dev` 
   - Reference: `ralywraqvuqgdezttfde`
   - URL: `ralywraqvuqgdezttfde.supabase.co`

### Step 2: Create New Edge Function

1. Click **"Create a new function"** button

2. Configure function settings:
   ```
   Function Name: api-v2
   HTTP Method: Any (allows GET, POST, OPTIONS, etc.)
   ```

3. Click **"Create Function"**

### Step 3: Copy Gateway Code

1. Open the consolidated gateway file:
   ```bash
   cat /Users/san/Documents/PRD/heraerp-dev/supabase/functions/api-v2-consolidated/index.ts
   ```

2. Select ALL content (Ctrl+A / Cmd+A)

3. Copy to clipboard (Ctrl+C / Cmd+C)

4. In Supabase Dashboard:
   - Clear the default function template
   - Paste the enhanced gateway code
   - Verify the code appears correctly

### Step 4: Deploy Function

1. Click **"Deploy Function"** button

2. Wait for deployment to complete (30-60 seconds)

3. Verify deployment success:
   - Look for green checkmark ✅
   - Function status should show "Active"
   - No error messages in deployment log

### Step 5: Test Deployment

1. Get the function URL from dashboard (should be):
   ```
   https://ralywraqvuqgdezttfde.supabase.co/functions/v1/api-v2
   ```

2. Run quick health check test:
   ```bash
   curl "https://ralywraqvuqgdezttfde.supabase.co/functions/v1/api-v2/health"
   ```

3. Expected response:
   ```json
   {
     "status": "healthy",
     "version": "2.3.0",
     "timestamp": "2025-11-11T...",
     "components": {
       "api_gateway": "healthy",
       "middleware_chain": "healthy", 
       "guardrails": "healthy"
     },
     "rid": "uuid"
   }
   ```

## 🧪 Verification Testing

### Quick Test (5 tests)

Run the quick verification test:

```bash
cd /Users/san/Documents/PRD/heraerp-dev
node test-consolidated-gateway.mjs
```

**Expected Output:**
```
🎉 All tests passed! Consolidated gateway is operational.
🚀 Ready to deploy AI Digital Accountant features.
```

### Comprehensive Test Suite (13 tests)

After quick test passes, run full test suite:

```bash
node test-enhanced-gateway-v2_3-user-auth.mjs
```

**Success Criteria:**
- ✅ All 13 tests pass
- ✅ Authentication working (retail@heraerp.com)
- ✅ Health check, metrics, gateway enforcement active
- ✅ Entity and transaction operations functional
- ✅ AI endpoints responding
- ✅ Rate limiting and middleware headers present

## 🚨 Troubleshooting

### Issue: Function not found (404)
**Cause**: Deployment not complete or function name incorrect
**Solution**:
1. Check Supabase Dashboard function status
2. Verify function name is exactly `api-v2`
3. Retry deployment if status shows errors

### Issue: Authentication errors (401)
**Cause**: Environment variables not set
**Solution**:
1. Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in dashboard environment variables
2. Check that test user `retail@heraerp.com` exists
3. Verify organization ID `378f24fb-d496-4ff7-8afa-ea34895a0eb8` is valid

### Issue: RPC function errors
**Cause**: Database functions not available or incorrect signatures  
**Solution**:
1. Check if `resolve_user_identity_v1` exists in database
2. Verify `hera_entities_crud_v1` and `hera_txn_crud_v1` available
3. Test function calls directly in Supabase SQL Editor

### Issue: CORS errors
**Cause**: Browser blocking cross-origin requests
**Solution**:
- Use curl/Postman for testing instead of browser
- Verify CORS headers in gateway response
- Check browser developer console for specific CORS errors

## 🔍 Environment Variables

Verify these environment variables are set in Supabase Dashboard > Settings > Environment Variables:

```
SUPABASE_URL=https://ralywraqvuqgdezttfde.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📊 Success Metrics

Once deployed successfully, you should see:

- **✅ Health Check**: 200 OK with component status
- **✅ Authentication**: JWT validation working  
- **✅ Organization Context**: Multi-tenant isolation active
- **✅ Guardrails**: Smart code and payload validation
- **✅ AI Endpoints**: Placeholder responses for assistant/usage
- **✅ Request Tracing**: X-Request-ID headers in responses
- **✅ Performance**: X-Response-Time headers < 500ms

## 🚀 Post-Deployment Steps

1. **Update Client Applications**
   ```typescript
   // Update API base URL in client apps
   const API_BASE_URL = 'https://ralywraqvuqgdezttfde.supabase.co/functions/v1/api-v2'
   ```

2. **Enable AI Features**
   - Begin Phase 1A: Core AI Route implementation
   - Integrate Claude API for HERA Digital Accountant v2.5
   - Implement AI tool registry and executor framework

3. **Monitor Performance**
   - Check function logs in Supabase Dashboard
   - Monitor response times and error rates
   - Verify rate limiting effectiveness

## 📞 Support

**If manual deployment fails:**

1. Check Supabase function logs for specific errors
2. Verify code syntax is valid TypeScript/Deno
3. Test with minimal function first, then enhance
4. Contact Supabase support if persistent issues

**Next Phase:**
Once Enhanced API v2 Gateway is deployed and verified, proceed to Phase 1A: Core AI Route implementation for HERA AI Digital Accountant v2.5.

---

**🎯 Ready for Manual Deployment via Supabase Dashboard**

The Enhanced API v2 Gateway will unlock the complete HERA AI Digital Accountant v2.5 experience with Claude integration, advanced security, and enterprise-grade performance monitoring.