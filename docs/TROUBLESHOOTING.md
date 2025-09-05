# HERA ERP Troubleshooting Guide

This guide documents common issues encountered during HERA development and deployment, along with their solutions.

## Server Startup Errors

### Issue: "document is not defined" Error

**Symptoms:**
- Server returns 500 Internal Server Error
- Error in logs: `ReferenceError: document is not defined`
- Occurs during Next.js server-side rendering

**Root Cause:**
Global polyfills that create mock browser globals (like `window.document`) can conflict with Next.js's internal handling of the document object during server-side rendering.

**Solution:**
1. Remove or disable global polyfills from `next.config.js`:
```javascript
// next.config.js
// Comment out or remove this line:
// require('./scripts/setup-globals.js');
```

2. If polyfills are needed for specific libraries, apply them conditionally:
```javascript
// Only apply in browser environment
if (typeof window !== 'undefined') {
  // Browser-specific polyfills
}
```

**Prevention:**
- Avoid global polyfills that mock browser APIs
- Use conditional imports for browser-only code
- Test server-side rendering locally before deployment

### Issue: Next.js Configuration Warnings

**Symptoms:**
- Warning: `Invalid next.config.js options detected`
- Message about `outputFileTracingExcludes` in experimental block

**Solution:**
Move `outputFileTracingExcludes` to the top level of the config:
```javascript
// next.config.js
module.exports = {
  // Move this out of experimental
  outputFileTracingExcludes: {
    '/api/*': ['*'],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // ... other config
}
```

## Database Connection Issues

### Issue: Supabase Client Initialization Errors

**Symptoms:**
- Application fails to connect to database
- Placeholder values being used instead of actual credentials

**Solution:**
1. Verify environment variables are set correctly:
```bash
# Check if variables exist
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

2. Ensure `.env.local` file exists and contains valid values:
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

3. Restart the development server after changing environment variables

## Build and Deployment Issues

### Issue: TypeScript Type Mismatches

**Symptoms:**
- Build fails with type errors
- Column names don't match database schema

**Solution:**
1. Regenerate types from database:
```bash
npm run schema:types
```

2. Common column name corrections:
- Use `transaction_code` not `transaction_number`
- Use `from_entity_id/to_entity_id` not `parent_entity_id/child_entity_id`
- Never add `status` columns - use relationships instead

### Issue: Memory Issues During Build

**Symptoms:**
- Build process runs out of memory
- Railway deployment fails with memory errors

**Solution:**
1. Increase Node.js memory limit:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

2. Use production optimizations in `next.config.js` for Railway:
```javascript
if (process.env.RAILWAY_ENVIRONMENT) {
  config.optimization = {
    minimize: true,
    moduleIds: 'deterministic',
    splitChunks: {
      chunks: 'all',
      // ... chunk configuration
    },
  };
}
```

## Common Development Patterns

### Always Use CLI Tools for Database Operations

```bash
# Instead of manual queries, use:
cd mcp-server
node hera-query.js summary
node hera-cli.js create-entity customer "Test Customer"
```

### Check Schema Before Writing Code

```bash
# Always verify actual database schema:
cd mcp-server
node check-schema.js core_entities
```

### Multi-Tenant Development

Always include `organization_id` in all operations:
```typescript
// WRONG
const data = await api.createEntity({ 
  entity_type: 'customer' 
})

// CORRECT
const data = await api.createEntity({ 
  entity_type: 'customer',
  organization_id: currentOrganization.id 
})
```

## Debugging Tips

1. **Enable Verbose Logging:**
```javascript
// In development
console.log('Supabase client configuration:', {
  hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});
```

2. **Check Server Logs:**
```bash
# Start server with logging
npm run dev > server.log 2>&1 &
tail -f server.log
```

3. **Verify API Routes:**
```bash
# Test API endpoints
curl http://localhost:3000/api/health
curl http://localhost:3000/api/v1/universal?action=schema
```

## Railway-Specific Issues

### Health Check Configuration

Ensure health check endpoint is properly configured:
```javascript
// app/api/health/route.ts
export async function GET() {
  return Response.json({ 
    status: 'ok',
    timestamp: new Date().toISOString()
  })
}
```

### Environment Variables

Always set these in Railway:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DEFAULT_ORGANIZATION_ID` (for MCP operations)

---

Last Updated: 2025-09-05