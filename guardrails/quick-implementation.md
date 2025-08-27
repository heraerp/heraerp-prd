# HERA Guardrails Quick Implementation Guide

## 🚀 Quick Setup (5 minutes)

### 1. Edge Function Enforcement (Vercel/Netlify/Cloudflare)

```typescript
// middleware.ts or edge-function.ts
import guardrails from './guardrails/hera-guardrails.json'

export async function middleware(request: Request) {
  const body = await request.json()
  
  // Quick enforcement
  if (body.entity_type === 'gl_account') {
    body.entity_type = 'account'
    body.business_rules = { ...body.business_rules, ledger_type: 'GL' }
  }
  
  // Require organization_id
  if (!body.organization_id && !request.url.includes('/auth')) {
    return new Response('organization_id required', { status: 403 })
  }
  
  // Require smart_code
  const tables = ['core_entities', 'universal_transactions', 'core_relationships']
  if (tables.some(t => request.url.includes(t)) && !body.smart_code) {
    return new Response('smart_code required', { status: 400 })
  }
  
  return NextResponse.next()
}
```

### 2. CLI Tool Integration

```bash
# Add to package.json scripts
"scripts": {
  "hera:validate": "node scripts/validate-guardrails.js",
  "precommit": "npm run hera:validate"
}
```

```javascript
// scripts/validate-guardrails.js
const guardrails = require('../guardrails/hera-guardrails.json')

function validatePayload(payload) {
  const violations = []
  
  // Check entity_type normalization
  if (payload.entity_type === 'gl_account') {
    violations.push({
      rule: 'ENTITY-TYPE-ALIAS-GL-ACCOUNT',
      fix: { entity_type: 'account', 'business_rules.ledger_type': 'GL' }
    })
  }
  
  // Check required fields
  if (!payload.organization_id) {
    violations.push({ rule: 'ORG-FILTER-REQUIRED', severity: 'error' })
  }
  
  if (!payload.smart_code && ['core_entities', 'universal_transactions'].includes(payload.table)) {
    violations.push({ rule: 'SMARTCODE-PRESENT', severity: 'error' })
  }
  
  return violations
}

// Run validation
const payload = JSON.parse(process.argv[2] || '{}')
const violations = validatePayload(payload)

if (violations.length > 0) {
  console.error('Guardrail violations:', violations)
  process.exit(1)
}
```

### 3. Database Trigger (PostgreSQL/Supabase)

```sql
-- Quick guardrail trigger
CREATE OR REPLACE FUNCTION enforce_hera_guardrails()
RETURNS TRIGGER AS $$
BEGIN
  -- Normalize gl_account to account
  IF NEW.entity_type = 'gl_account' THEN
    NEW.entity_type := 'account';
    NEW.business_rules := jsonb_set(
      COALESCE(NEW.business_rules, '{}'::jsonb),
      '{ledger_type}',
      '"GL"'
    );
  END IF;
  
  -- Require organization_id
  IF NEW.organization_id IS NULL AND TG_TABLE_NAME != 'core_organizations' THEN
    RAISE EXCEPTION 'organization_id is required';
  END IF;
  
  -- Require smart_code
  IF NEW.smart_code IS NULL AND TG_TABLE_NAME IN ('core_entities', 'universal_transactions', 'core_relationships') THEN
    RAISE EXCEPTION 'smart_code is required';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all sacred tables
CREATE TRIGGER enforce_guardrails_entities BEFORE INSERT OR UPDATE ON core_entities
FOR EACH ROW EXECUTE FUNCTION enforce_hera_guardrails();

CREATE TRIGGER enforce_guardrails_transactions BEFORE INSERT OR UPDATE ON universal_transactions
FOR EACH ROW EXECUTE FUNCTION enforce_hera_guardrails();
```

### 4. API Middleware (Express/Next.js)

```typescript
// api/middleware/hera-guardrails.ts
export function heraGuardrailMiddleware(req, res, next) {
  const { body, method, url } = req
  
  // Only check writes
  if (!['POST', 'PUT', 'PATCH'].includes(method)) {
    return next()
  }
  
  // Quick fixes
  if (body.entity_type === 'gl_account') {
    body.entity_type = 'account'
    body.business_rules = { 
      ...body.business_rules, 
      ledger_type: 'GL' 
    }
    console.warn('Auto-fixed: gl_account → account with ledger_type=GL')
  }
  
  // Validations
  const errors = []
  
  if (!body.organization_id && !url.includes('/auth')) {
    errors.push('organization_id required')
  }
  
  const requiresSmartCode = [
    '/entities', '/transactions', '/relationships'
  ].some(path => url.includes(path))
  
  if (requiresSmartCode && !body.smart_code) {
    errors.push('smart_code required')
  }
  
  if (errors.length > 0) {
    return res.status(400).json({ errors })
  }
  
  next()
}
```

### 5. GitHub Action

```yaml
# .github/workflows/hera-guardrails.yml
name: HERA Guardrails Check

on: [push, pull_request]

jobs:
  guardrails:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Load Guardrails
        run: |
          echo "Checking HERA sacred 6-table architecture..."
          
      - name: Check for forbidden tables
        run: |
          if grep -r "CREATE TABLE" --include="*.sql" . | grep -v "core_\|universal_"; then
            echo "❌ Found non-sacred table creation"
            exit 1
          fi
          
      - name: Check for gl_account usage
        run: |
          if grep -r "entity_type.*gl_account" --include="*.ts" --include="*.tsx" .; then
            echo "⚠️ Found gl_account usage - should be 'account' with ledger_type='GL'"
            exit 1
          fi
```

## 🎯 Priority Enforcement Points

1. **API Gateway** - Block invalid requests before they hit the database
2. **Database Triggers** - Last line of defense for data integrity
3. **CI/CD Pipeline** - Prevent bad code from being merged
4. **Development Tools** - Help developers follow patterns correctly

## 📊 Monitoring

```typescript
// Track guardrail violations
const violations = {
  'gl_account_normalized': 0,
  'missing_org_id': 0,
  'missing_smart_code': 0
}

// Log and metrics
console.log('Guardrail violations today:', violations)
```

## 🔧 Testing

```bash
# Test guardrails are working
curl -X POST http://localhost:3000/api/v1/entities \
  -H "Content-Type: application/json" \
  -d '{"entity_type": "gl_account", "entity_name": "Cash"}'
  
# Should auto-convert to:
# {"entity_type": "account", "business_rules": {"ledger_type": "GL"}}
```