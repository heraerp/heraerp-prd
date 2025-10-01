# HERA Universal API v2 Runbook

This runbook provides operational procedures for deploying, monitoring, and maintaining the Universal API v2 system.

## 🚀 Quick Health Check

```bash
# 1. Test basic connectivity
curl -H "x-hera-api-version: v2" \
     -H "Content-Type: application/json" \
     /api/v2/entities?organization_id=YOUR_ORG_ID&limit=1

# 2. Verify facade routing
curl -X GET /api/v2/relationships?organization_id=YOUR_ORG_ID&limit=1
curl -X GET /api/v2/transactions?organization_id=YOUR_ORG_ID&limit=1

# Expected: All should return JSON with "api_version": "v2"
```

## 🧪 Smoke Testing

### Entity Smoke Test
```bash
# Run entity CRUD smoke test
tsx scripts/canary/v2-entity-smoke.ts

# Expected output:
# ✅ Created entity: [uuid] (XXXms)
# ✅ Read entity: Test Entity Name (XXXms)
# ✅ Listed entities: X found (XXXms)
# ✅ Updated entity: [uuid] (XXXms)
# 🎉 All entity smoke tests passed!
```

### Transaction Smoke Test
```bash
# Run transaction smoke test
tsx scripts/canary/v2-txn-smoke.ts

# Expected output:
# ✅ Emitted transaction: [uuid] (XXXms)
# ✅ Read transaction: [uuid] (XXXms)
# ✅ Queried transactions (XXXms)
# ✅ Emitted multi-line transaction: [uuid] (XXXms)
# ✅ Reversed transaction: [uuid] (XXXms)
# 🎉 All transaction smoke tests passed!
```

## 🧱 Contract Testing

### Run V2 Contract Tests
```bash
# Run all V2 contract tests
npm test tests/v2/contracts/

# Run specific contract tests
npm test tests/v2/contracts/entities.spec.ts
npm test tests/v2/contracts/relationships.spec.ts
npm test tests/v2/contracts/transactions.spec.ts

# Expected: All tests should pass with green output
```

## 🔍 V1 Legacy Detection

### Check for V1 Usage
```bash
# Scan for V1 API calls in codebase
git grep -n "/api/v1/" src/

# Expected: Should return empty or only known legacy files
# If results found, review for migration opportunities
```

### Run ESLint V2 Rules
```bash
# Check for V1 patterns via ESLint
npx eslint src/ --ext .ts,.tsx

# Expected: No errors related to V1 usage patterns
# Look for: "Use /api/v2/* endpoints only" messages
```

## 🔄 Migration Tools

### Codemod Dry Run
```bash
# See what would be migrated
tsx scripts/codemods/ban-v1-to-v2.ts --dry-run

# Expected output:
# 📋 Found X potential changes:
# 📄 [file]
#   Line X: Migrate entities endpoint to V2
#     - /api/v1/entities
#     + /api/v2/entities
```

### Apply Codemod
```bash
# Apply V1 to V2 migrations (USE WITH CAUTION)
tsx scripts/codemods/ban-v1-to-v2.ts --apply

# ⚠️  IMPORTANT: Review all changes before committing
# ⚠️  Test thoroughly after applying migrations
```

## 📊 Monitoring & Observability

### Check V2 Middleware Logs
```bash
# View structured V2 API logs (development)
tail -f logs/v2-api.log | jq '.'

# Look for log entries with:
# - "api_version": "v2"
# - Reasonable latency_ms values (< 1000ms typical)
# - No error_message fields for successful requests
```

### Observability Headers
Every V2 API response includes:
- `x-request-id`: Unique request identifier for tracing
- `x-api-version`: Should always be "v2"
- `x-response-time`: Request duration in milliseconds

### Key Metrics to Monitor
- **Request Volume**: Total V2 API requests per minute
- **Error Rate**: 4xx/5xx responses as percentage of total
- **Latency**: P50/P95/P99 response times
- **Organization Isolation**: Ensure no cross-org data leakage

## 🚨 Troubleshooting

### Common Issues

#### 1. "V1 API path blocked in v2 client"
```
Error: V1 API path blocked in v2 client: /api/v1/entities
```
**Solution**: Update code to use V2 paths
```typescript
// ❌ Wrong
await fetch('/api/v1/entities')

// ✅ Correct  
import { apiV2 } from '@/lib/universal/v2/client'
await apiV2.get('/entities')
```

#### 2. "organization_id mismatch" (403 Error)
```
Error: 403 Forbidden - organization_id mismatch
```
**Solution**: Ensure auth context matches request organization_id
- Check JWT token organization claim
- Verify request includes correct organization_id parameter
- Use auth context organization ID consistently

#### 3. "Invalid API version header"
```
Error: x-hera-api-version header missing or invalid
```
**Solution**: All V2 requests must include proper headers
```typescript
// Headers automatically added by apiV2 client
import { apiV2 } from '@/lib/universal/v2/client'
await apiV2.get('/entities') // ✅ Headers included

// Manual fetch requires headers
await fetch('/api/v2/entities', {
  headers: {
    'x-hera-api-version': 'v2',
    'Content-Type': 'application/json'
  }
})
```

#### 4. Universal Handler Auth Errors
If universal handlers return auth errors:
1. Verify `verifyAuth()` is implemented in handler
2. Check JWT token validity and expiration
3. Ensure organization_id in request matches auth context

### Emergency Rollback
If V2 system fails critically:

1. **Identify failing component**:
   ```bash
   # Check recent deployments
   git log --oneline -10
   
   # Check error rates
   grep "error" logs/v2-api.log | tail -20
   ```

2. **Disable V2 facades** (if needed):
   ```typescript
   // Temporarily return 503 from facades
   export async function GET() {
     return NextResponse.json(
       { error: 'v2_maintenance', message: 'V2 API under maintenance' },
       { status: 503 }
     )
   }
   ```

3. **Fallback to universal handlers**:
   - Direct calls to `/api/v2/universal/*` should still work
   - Update client code temporarily if needed

## 📋 Migration Checklist

### Pre-Migration
- [ ] Backup database
- [ ] Run contract tests: `npm test tests/v2/contracts/`
- [ ] Run smoke tests: `tsx scripts/canary/v2-*.ts`
- [ ] Check CI/CD pipeline health
- [ ] Notify team of migration window

## Jewelry App — Runbook
1) Export ORG_ID for your dev org  
   `export ORG_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
2) Seed data  
   `yarn seed:jewelry:v2`
3) Demo flows  
   `yarn demo:jewelry:sale:v2`  
   `yarn demo:jewelry:exchange:v2`
4) Open UI  
   `/jewelry/worklist` → browse items  
   `/jewelry/record/:id` → inspect item details  
   `/jewelry/pos` → record a sale/exchange
5) Tests  
   `yarn test:jewelry:v2`
6) Notes  
   - All calls go through /api/v2 facades.  
   - Domain behaviour comes from rules packs; UI is generic and binder-driven.

### During Migration
- [ ] Run codemod dry-run: `tsx scripts/codemods/ban-v1-to-v2.ts --dry-run`
- [ ] Review proposed changes carefully
- [ ] Apply migrations: `tsx scripts/codemods/ban-v1-to-v2.ts --apply`
- [ ] Run full test suite: `npm test`
- [ ] Test in staging environment
- [ ] Monitor error rates and latency

### Post-Migration
- [ ] Run smoke tests to verify functionality
- [ ] Check for remaining V1 usage: `git grep -n "/api/v1/" src/`
- [ ] Monitor production metrics for 24 hours
- [ ] Verify organization isolation working correctly
- [ ] Update documentation
- [ ] Clean up any temporary code

### Validation Checklist
- [ ] All V2 endpoints return `"api_version": "v2"`
- [ ] Organization isolation enforced (no cross-org data access)
- [ ] Auth verification working on all facades
- [ ] Smart codes properly validated
- [ ] Error handling consistent across endpoints
- [ ] Request/response logging functioning
- [ ] Performance within acceptable limits (< 1s typical)

## 🎯 Success Criteria

✅ **V2 API fully operational when**:
- All smoke tests pass
- Contract tests pass 
- No V1 usage in new code (ESLint enforced)
- Organization isolation verified
- Monitoring and logging functioning
- Error rates < 1%
- P95 latency < 1000ms

## 📞 Support

### Escalation Path
1. **Level 1**: Check this runbook and common issues
2. **Level 2**: Review observability logs and metrics
3. **Level 3**: Contact HERA platform team
4. **Level 4**: Emergency rollback procedures

### Key Contacts
- **Platform Team**: Check team directory
- **Database Team**: For RPC function issues
- **Security Team**: For auth/authorization issues

## 📚 Additional Resources

- **V2 Client Documentation**: `/src/lib/universal/v2/client.ts`
- **Contract Tests**: `/tests/v2/contracts/`
- **ESLint V2 Rules**: `/.eslintrc.cjs`
- **Codemod Tool**: `/scripts/codemods/ban-v1-to-v2.ts`
- **Architecture Overview**: Check main project README

---

## Notes

- **Backward Compatibility**: `/api/v2/universal/*` routes remain available for compatibility
- **Progressive Migration**: V1 and V2 can coexist during transition period
- **Zero Downtime**: Facades route to existing universal handlers, no data migration required
- **Security**: Organization isolation enforced at multiple layers (auth, facades, universal handlers)
- **Observability**: Complete request tracing and structured logging for debugging

**Remember**: The V2 system is designed for zero-downtime deployment and maintains full backward compatibility while providing improved developer experience and stronger guardrails.
