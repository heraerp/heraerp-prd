# Integration Hub Troubleshooting Guide

## Common Issues and Solutions

### 1. Organization ID is null

**Problem**: The `X-Organization-Id` header is null when making API calls.

**Solutions**:

1. **Set Organization Context**: Make sure you've selected an organization in the app
   - Check localStorage for `heraerp_org_id`
   - Use the organization selector in the app header

2. **Use Default CivicFlow Org**: The system will fall back to the CivicFlow demo organization ID: `8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77`

3. **Manual Testing**: You can test with curl using the default org:
   ```bash
   curl -X POST http://localhost:3000/api/integrations/linkedin/auth/callback \
     -H "Content-Type: application/json" \
     -H "X-Organization-Id: 8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77" \
     -d '{"demo": true}'
   ```

### 2. SUPABASE_SERVICE_KEY not found

**Problem**: The environment variable `SUPABASE_SERVICE_KEY` is not set.

**Solution**: Use the correct environment variable name:
```bash
# In .env.local
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. 500 Internal Server Error on Connection

**Problem**: Getting 500 error when trying to connect to LinkedIn or other integrations.

**Common Causes**:
1. Missing organization ID
2. Smart code validation failing
3. Missing Supabase service role key
4. Entity creation failing

**Debug Steps**:
1. Check browser console for detailed error messages
2. Check server logs for stack traces
3. Test the auth endpoint directly: http://localhost:3000/api/integrations/test-auth
4. Verify all environment variables are set correctly

### 4. Smart Code Validation Errors

**Problem**: Smart codes don't match the required HERA pattern.

**Solution**: Ensure all smart codes follow the pattern:
```
HERA.{SEGMENT1}.{SEGMENT2}.{SEGMENT3}.{SEGMENT4}.{SEGMENT5}.v{VERSION}
```

Example:
- ✅ `HERA.PUBLICSECTOR.CRM.SOCIAL.LINKEDIN.CONNECTOR.v1`
- ❌ `HERA.INTEGRATION.CONNECTOR.v1` (too few segments)

### 5. Demo Mode Not Working

**Problem**: Demo mode connections are failing.

**Solutions**:
1. Ensure you're using a demo organization (check with `isDemoMode()`)
2. The CivicFlow default org (`8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77`) is always in demo mode
3. Check that the demo flag is being passed: `{ demo: true }`

## Quick Fixes

### Reset Organization Context
```javascript
// In browser console
localStorage.setItem('heraerp_org_id', '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77')
location.reload()
```

### Test Integration Connection
```bash
# Test endpoint to check your setup
curl http://localhost:3000/api/integrations/test-auth

# Should return:
# {
#   "headers": {
#     "X-Organization-Id": "8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77",
#     "Content-Type": "application/json"
#   },
#   "environment": {
#     "LINKEDIN_CLIENT_ID": false,
#     "SUPABASE_SERVICE_KEY": true
#   }
# }
```

### Force Demo Mode
Add this to your component to force demo mode:
```typescript
import { useOrgStore } from '@/state/org'

// In your component
const { setCurrentOrgId } = useOrgStore()
setCurrentOrgId('8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77') // CivicFlow demo org
```

## Next Steps

1. Ensure you have an organization selected or use the default CivicFlow org
2. Check all environment variables are correctly set
3. Test with the demo mode first before implementing real OAuth
4. Monitor server logs for detailed error messages