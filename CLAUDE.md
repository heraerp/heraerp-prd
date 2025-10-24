# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🛡️ HERA PLAYBOOK GUARDRAIL SYSTEM - MANDATORY FIRST STEP

**🚨 CRITICAL**: Before ANY development work, you MUST use the HERA Playbook Guardrail System. This system automatically prevents all common development mistakes and ensures HERA standards compliance.

### 🔧 MANDATORY USAGE PATTERN:
```typescript
// STEP 1: ALWAYS start with guardrail enhancement (MANDATORY)
import { enhancePromptWithPlaybookGuardrails } from '@/lib/dna/playbook/automatic-claude-integration'

// For ANY development request, enhance it first:
const enhancedPrompt = enhancePromptWithPlaybookGuardrails(userRequest)
console.log('🛡️ GUARDRAIL SYSTEM ACTIVATED:', enhancedPrompt)

// STEP 2: Validate the development approach
import { heraPlaybookGuardrail } from '@/lib/dna/playbook/hera-development-playbook'
const validation = heraPlaybookGuardrail.validateDevelopmentApproach(approach)

// STEP 3: Only proceed if validation passes or violations are addressed
if (!validation.isValid) {
  console.log('🚨 GUARDRAIL VIOLATIONS:', validation.violations)
  // Use validation.correctedApproach instead
}
```

### 🎯 GUARANTEED PREVENTION OF:
1. ✅ **Schema Field Assumptions** - Uses actual database schema, prevents wrong field names
2. ✅ **Wrong Field Placement** - Enforces business data in `core_dynamic_data` NOT metadata
3. ✅ **Incorrect Relationships** - Enforces `source_entity_id`/`target_entity_id` patterns
4. ✅ **Smart Code Format Errors** - Enforces UPPERCASE segments with lowercase `.v1` version automatically
5. ✅ **Non-V2 API Usage** - Enforces `/api/v2/` endpoints with organization_id filtering
6. ✅ **Duplicate Component Creation** - Checks existing components before creating new ones

### 📋 SACRED SIX SCHEMA REFERENCE:
**CRITICAL**: Always consult the definitive documentation:
📖 **`/docs/schema/hera-sacred-six-schema.yaml`** - ✅ **VERIFIED AGAINST ACTUAL DATABASE**

⚠️ **CORRECTED FIELD NAMES** (From Actual Schema):
- ✅ Use `transaction_number` (NOT `transaction_code`)
- ✅ Use `source_entity_id`/`target_entity_id` (NOT `from_entity_id`/`to_entity_id`) 
- ✅ Use `entity_id` (NOT `line_entity_id`) in transaction lines
- ✅ Use `line_order` (NOT `line_number`) in transaction lines
- ✅ Use `relationship_data` (NOT `relationship_metadata`)
- ✅ Status fields DO exist and are allowed in entities/transactions

**NEVER assume schema details - always check the YAML reference first!**

---

## 🚨 SACRED RULES - NEVER VIOLATE

### 🔴 ALWAYS REQUIRED:
1. **ORGANIZATION_ID FILTERING** - Every query MUST include organization_id (Sacred boundary)
2. **USE UNIVERSAL API V2 ONLY** - All API calls via `/api/v2/*` endpoints
3. **DYNAMIC DATA FOR BUSINESS FIELDS** - Store business data in `core_dynamic_data`, NOT metadata
4. **RPC-FIRST OPERATIONS** - All CRUD via Postgres RPC functions, never direct table access
5. **SMART CODES EVERYWHERE** - Every entity/transaction MUST have valid smart_code

### 🛑 NEVER DO:
1. **Schema Changes** - Never add tables/columns, use Sacred Six + dynamic data
2. **Status Columns** - Use relationships for status workflows, never status columns
3. **Bypass Organization Filtering** - Never query without organization_id (data leakage)
4. **Assume Field Names** - Always check actual schema, never assume field exists
5. **Skip Guardrail System** - Never start development without guardrail validation

---

## 🔧 UNIVERSAL API V2 PATTERNS

### Quick API Reference:
```typescript
import { apiV2 } from '@/lib/client/fetchV2'

// Entity CRUD
const { data } = await apiV2.get('entities', { entity_type: 'product', organization_id: orgId })
const result = await apiV2.post('entities', { entity_type: 'customer', entity_name: 'John Doe', organization_id: orgId })

// Dynamic Data
await apiV2.post('entities/dynamic-data', {
  entity_id: entityId,
  field_name: 'price',
  field_value_number: 99.99,
  field_type: 'number'
})

// Relationships (for status workflows)
await apiV2.post('relationships', {
  source_entity_id: entityId,
  target_entity_id: statusEntityId,
  relationship_type: 'HAS_STATUS',
  organization_id: orgId
})
```

### RPC Function Patterns:
```typescript
// Two-step entity creation (PRODUCTION STANDARD)
// Step 1: Create entity
const result = await callRPC('hera_entity_upsert_v1', {
  p_organization_id: orgId,
  p_entity_type: 'product',
  p_entity_name: 'Product Name'
})

// Step 2: Add dynamic fields
await callRPC('hera_dynamic_data_batch_v1', {
  p_organization_id: orgId,
  p_entity_id: result.data,
  p_fields: [
    { field_name: 'price', field_type: 'number', field_value_number: 99.99 }
  ]
})
```

### 🚀 High-Performance JSONB Queries (v2.1):
HERA now includes **GIN indexes with path ops** for lightning-fast JSONB queries on Sacred Six tables:

```sql
-- ✅ INDEXED JSONB columns for complex queries
core_dynamic_data.field_value_json     -- Dynamic field values
universal_transaction_lines.line_data  -- Transaction line payloads  
core_entities.business_rules          -- Per-entity rules/metadata
core_organizations.settings           -- Organizational settings/AI insights
```

**Expressive JSON Path Queries:**
```typescript
// Find transaction lines: debit to account "110000" over $10k
const { data } = await apiV2.get('transaction-lines/search', {
  json_path_filter: '$ ? (@.side == "DR" && @.account == "110000" && @.amount > 10000)',
  organization_id: orgId
})

// Search dynamic data: products with price between $50-200
const products = await apiV2.get('entities/search', {
  entity_type: 'product',
  json_path_filter: '$ ? (@.price >= 50 && @.price <= 200)',
  organization_id: orgId
})

// Complex business rules queries on entities
const entities = await apiV2.get('entities/search', {
  business_rules_filter: '$ ? (@.auto_approve == true && @.credit_limit > 5000)',
  organization_id: orgId
})
```

**Performance Benefits:**
- **10x faster** complex JSONB queries via GIN path ops
- **Concurrent index creation** - zero downtime deployment
- **Sacred Six compliance** - no business columns added, only JSON indexing

---

## 🚀 HERA DB PERFORMANCE UPGRADES (C-F)

### 📋 TL;DR
Four production-ready Postgres upgrades for Sacred Six tables:
- **C)** Tight autovacuum for hot tables (reduced bloat + write latency)
- **D)** JSONPath + GIN on JSONB (flexible attributes fast)
- **E)** Standard EXPLAIN with BUFFERS (find real bottlenecks)
- **F)** Org-first composite indexes + FTS + skip scan leverage

### 🛡️ Guardrails (Never Break)
- Sacred Six only: `core_entities`, `core_dynamic_data`, `core_relationships`, `core_organizations`, `universal_transactions`, `universal_transaction_lines`
- Every write remains actor-stamped (`created_by`, `updated_by`)
- RLS isolation by `organization_id` stays intact
- Only create indexes and settings; no schema drift beyond indexes

### 🎯 One-Shot SQL Migration (Copy/Paste Safe)

```sql
-- ===== C) Autovacuum tuning (hot tables) =====
ALTER TABLE universal_transactions
  SET (autovacuum_vacuum_scale_factor = 0.02,
       autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE universal_transaction_lines
  SET (autovacuum_vacuum_scale_factor = 0.02,
       autovacuum_analyze_scale_factor = 0.02);
ALTER TABLE core_dynamic_data
  SET (autovacuum_vacuum_scale_factor = 0.02,
       autovacuum_analyze_scale_factor = 0.02);

-- ===== D) JSONB GIN (path ops) =====
CREATE INDEX CONCURRENTLY IF NOT EXISTS cdd_field_value_json_gin
  ON core_dynamic_data USING gin (field_value_json jsonb_path_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS utl_line_data_gin
  ON universal_transaction_lines USING gin (line_data jsonb_path_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ce_business_rules_gin
  ON core_entities USING gin (business_rules jsonb_path_ops);
CREATE INDEX CONCURRENTLY IF NOT EXISTS co_settings_gin
  ON core_organizations USING gin (settings jsonb_path_ops);

-- ===== F) Org-first composite B-trees =====
CREATE INDEX CONCURRENTLY IF NOT EXISTS ut_org_txn_date_idx
  ON universal_transactions (organization_id, transaction_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ut_org_status_idx
  ON universal_transactions (organization_id, transaction_status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ut_org_smart_code_idx
  ON universal_transactions (organization_id, smart_code);

CREATE INDEX CONCURRENTLY IF NOT EXISTS utl_org_txn_line_idx
  ON universal_transaction_lines (organization_id, transaction_id, line_number);

CREATE INDEX CONCURRENTLY IF NOT EXISTS ce_org_type_idx
  ON core_entities (organization_id, entity_type);
CREATE INDEX CONCURRENTLY IF NOT EXISTS ce_org_smart_code_idx
  ON core_entities (organization_id, smart_code);

-- ===== F) FTS for entity search =====
CREATE INDEX CONCURRENTLY IF NOT EXISTS ce_search_gin
  ON core_entities
  USING gin (to_tsvector('english',
    coalesce(entity_name,'') || ' ' || coalesce(entity_description,'')));

-- ===== E) Refresh stats so planners see the new indexes =====
ANALYZE core_entities, core_dynamic_data, core_relationships,
        core_organizations, universal_transactions, universal_transaction_lines;
```

### 🔍 Post-Deploy Verification Checks

**1) Planner sanity — typical join:**
```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT h.id, l.line_number
FROM universal_transactions h
JOIN universal_transaction_lines l ON l.transaction_id = h.id
WHERE h.organization_id = :org
  AND h.transaction_date >= now() - interval '7 days';
```

**2) JSONPath performance:**
```sql
EXPLAIN (ANALYZE, BUFFERS)
SELECT id
FROM universal_transaction_lines
WHERE jsonb_path_exists(
  line_data,
  '$ ? (@.side == "DR" && @.account == "110000" && @.amount > 10000)'
);
```

**3) RLS still enforced:**
```sql
-- Expect zero rows when querying with mismatched org filter
SELECT count(*)
FROM universal_transactions
WHERE organization_id <> :org AND transaction_date >= now() - interval '1 day';
```

**4) Actor coverage intact:**
```sql
-- Spot check non-null actor stamps on recent writes
SELECT
  sum((created_by IS NULL)::int) AS created_by_nulls,
  sum((updated_by IS NULL)::int) AS updated_by_nulls
FROM universal_transactions
WHERE transaction_date >= now() - interval '1 day';
```

### 🔄 Rollback Plan (If Needed)

```sql
-- Drop only what we created; keep schema intact
DROP INDEX CONCURRENTLY IF EXISTS cdd_field_value_json_gin;
DROP INDEX CONCURRENTLY IF EXISTS utl_line_data_gin;
DROP INDEX CONCURRENTLY IF EXISTS ce_business_rules_gin;
DROP INDEX CONCURRENTLY IF EXISTS co_settings_gin;
DROP INDEX CONCURRENTLY IF EXISTS ut_org_txn_date_idx;
DROP INDEX CONCURRENTLY IF EXISTS ut_org_status_idx;
DROP INDEX CONCURRENTLY IF EXISTS ut_org_smart_code_idx;
DROP INDEX CONCURRENTLY IF EXISTS utl_org_txn_line_idx;
DROP INDEX CONCURRENTLY IF EXISTS ce_org_type_idx;
DROP INDEX CONCURRENTLY IF EXISTS ce_org_smart_code_idx;
DROP INDEX CONCURRENTLY IF EXISTS ce_search_gin;

-- Optional: revert autovac settings (falls back to DB defaults)
ALTER TABLE universal_transactions RESET (autovacuum_vacuum_scale_factor, autovacuum_analyze_scale_factor);
ALTER TABLE universal_transaction_lines RESET (autovacuum_vacuum_scale_factor, autovacuum_analyze_scale_factor);
ALTER TABLE core_dynamic_data RESET (autovacuum_vacuum_scale_factor, autovacuum_analyze_scale_factor);
```

### 📈 Expected Performance Gains

- **Write latency ↓ 30-50%** via tighter autovacuum
- **JSONB queries ↑ 10-20x faster** via GIN path ops
- **Org-scoped queries ↑ 5-10x faster** via composite indexes
- **Entity search ↑ 100x faster** via full-text search
- **Zero downtime** deployment via CONCURRENTLY

### 🎯 Done-When Checklist

- [ ] Migration applied without blocking writes
- [ ] EXPLAIN before/after shows improvements
- [ ] RLS isolation verified
- [ ] Actor stamps intact on new writes
- [ ] Vacuum/analyze stats improving on hot tables
- [ ] PR merged with evidence

**Minimum ceremony, maximum impact. Ship safe.**

---

## 🧬 HERA DNA SMART CODE RULES

### Format Requirements:
- Structure: `HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.v1`
- 6-10 segments, **UPPERCASE for all segments EXCEPT version**
- Version segment: **lowercase `.v1`** (not `.V1`)
- Use existing families, don't invent new ones

### Common Examples:
```typescript
'HERA.SALON.POS.CART.ACTIVE.v1'           // Salon POS cart
'HERA.REST.MENU.ITEM.FOOD.v1'             // Restaurant menu item
'HERA.CRM.CUSTOMER.ENTITY.PROFILE.v1'     // Customer profile
'HERA.FIN.GL.ACCOUNT.ENTITY.v1'           // GL account
```

---

## 🏗️ FIELD PLACEMENT POLICY

### Default Rule:
**ALL business data goes to `core_dynamic_data`** - price, description, status, category, etc.

### Metadata Usage:
Only for **system metadata** with explicit category:
```typescript
// ✅ ALLOWED in metadata
{
  "metadata": {
    "metadata_category": "system_ai",
    "ai_confidence": 0.92,
    "ai_classification": "high_value_service"
  }
}

// ❌ FORBIDDEN in metadata  
metadata: {
  price: 99.99,        // → Should be core_dynamic_data
  category: "Hair"     // → Should be core_dynamic_data
}
```

---

## 🎛️ MCP DEVELOPMENT WORKFLOW - PRODUCTION READY

### 🚀 **BEST PRACTICE: Direct RPC Function Usage**

**The most reliable way to interact with HERA is through direct RPC function calls:**

```javascript
// 1. Import Supabase client in MCP server directory
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 2. Use hera_entities_crud_v2 for ALL entity operations
const result = await supabase.rpc('hera_entities_crud_v2', {
  p_action: 'CREATE|READ|UPDATE|DELETE',
  p_actor_user_id: 'user-uuid',          // WHO is making the change
  p_organization_id: 'org-uuid',         // WHERE (tenant boundary)
  p_entity: {
    entity_type: 'product',
    entity_name: 'Product Name',
    smart_code: 'HERA.SALON.PRODUCT.ENTITY.TREATMENT.V1'
  },
  p_dynamic: {
    price: {
      field_type: 'number',
      field_value_number: 99.99,
      smart_code: 'HERA.SALON.PRODUCT.FIELD.PRICE.V1'
    }
  },
  p_relationships: [],
  p_options: {}
});
```

### 🧪 **MCP Testing Framework**

**Use this proven test pattern for MCP interactions:**

```javascript
// Create test file: test-mcp-operations.mjs
async function testMCPOperations() {
  const testData = {
    user_entity_id: "your-user-uuid",
    organization_id: "your-org-uuid"
  };
  
  try {
    // CREATE
    const createResult = await supabase.rpc('hera_entities_crud_v2', {
      p_action: 'CREATE',
      p_actor_user_id: testData.user_entity_id,
      p_organization_id: testData.organization_id,
      p_entity: { /* entity data */ },
      p_dynamic: { /* dynamic fields */ },
      p_relationships: [],
      p_options: {}
    });
    
    console.log('✅ CREATE Status:', createResult.error ? 'FAILED' : 'SUCCESS');
    
    // READ, UPDATE, DELETE operations follow same pattern...
    
  } catch (error) {
    console.error('❌ MCP Test Failed:', error);
  }
}
```

### 📁 **MCP Server Directory Structure**

```bash
mcp-server/
├── hera-mcp-server.js              # Main MCP server
├── test-hera-entities-crud-v2-final.mjs  # Proven test framework
├── hera-query.js                   # Database queries
├── package.json                    # Dependencies
└── .env                           # Environment variables
```

### 🔧 **Essential MCP Commands**

```bash
# 1. Navigate to MCP server directory
cd mcp-server

# 2. Test MCP connection and RPC functions
node test-hera-entities-crud-v2-final.mjs  # Comprehensive CRUD test

# 3. Query database (when CLI tools work)
node hera-query.js summary                  # Database overview
node hera-query.js entities                 # List entities

# 4. Environment setup verification
echo $SUPABASE_URL                         # Verify connection
echo $DEFAULT_ORGANIZATION_ID              # Verify org context
```

### ⚠️ **MCP Connection Troubleshooting**

**Common Issues & Solutions:**

```bash
# Issue: "require is not defined in ES module scope"
# Solution: Use .mjs files with import statements

# Issue: "Could not find function in schema cache"  
# Solution: Check actual function signature with:
# Error message shows: hera_entities_crud_v2(p_action, p_actor_user_id, p_dynamic, p_entity, p_options, p_organization_id, p_relationships)

# Issue: "null value in column smart_code violates not-null constraint"
# Solution: Always include smart_code in dynamic fields:
p_dynamic: {
  price: {
    field_type: 'number',
    field_value_number: 99.99,
    smart_code: 'HERA.SALON.PRODUCT.FIELD.PRICE.V1'  // REQUIRED
  }
}
```

### 🛡️ **MCP Security Verification**

**Always verify these security features are working:**

```javascript
// 1. Actor Stamping
console.log('Created By:', result.data.items[0].created_by);
console.log('Updated By:', result.data.items[0].updated_by);

// 2. Organization Isolation  
// Should only return data for specified organization_id

// 3. Smart Code Validation
// Should enforce HERA DNA patterns automatically

// 4. Membership Validation
// Should verify actor belongs to organization
```

### 📊 **MCP Performance Best Practices**

```javascript
// 1. Batch operations when possible
const batchResult = await supabase.rpc('hera_dynamic_data_batch_v1', {
  p_organization_id: orgId,
  p_entity_id: entityId,
  p_fields: [
    { field_name: 'price', field_type: 'number', field_value_number: 99.99 },
    { field_name: 'category', field_type: 'text', field_value_text: 'treatment' }
  ]
});

// 2. Use JSONB queries for complex searches
const searchResult = await apiV2.get('entities/search', {
  entity_type: 'product',
  json_path_filter: '$ ? (@.price >= 50 && @.price <= 200)',
  organization_id: orgId
});

// 3. Leverage GIN indexes for fast JSONB operations
// Already optimized in HERA DB performance upgrades
```

### Development Commands:
```bash
# Essential development
npm run dev                             # Start development
npm run build                          # Production build  
npm run cc                             # Control Center health check
npm run predeploy                      # MANDATORY before pushing

# Schema verification (ALWAYS do this first)
npm run schema:check                   # View actual schema
npm run schema:types                   # Generate TypeScript types
npm run schema:validate               # Validate assumptions

# MCP-specific commands
cd mcp-server && node test-hera-entities-crud-v2-final.mjs  # Test MCP connection
cd mcp-server && node hera-query.js summary                 # Database overview
```

---

## 🏢 MULTI-TENANT ACTOR-BASED AUTHENTICATION

### Updated Auth Provider (v2.2):
```typescript
// MANDATORY: Use HERAAuthProvider (replaces MultiOrgAuthProvider)
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

const { 
  user,                    // Actor identity (WHO)
  organization,            // Organization context (WHERE) 
  isAuthenticated,         // Session status
  contextLoading,          // Loading state
  sessionType             // 'demo' | 'real'
} = useHERAAuth()

// Enhanced three-layer check with actor context
if (!isAuthenticated) return <Alert>Please log in</Alert>
if (contextLoading) return <LoadingSpinner />
if (!organization?.id) return <Alert>No organization context</Alert>

// All API calls automatically include actor tracing
const { data } = await apiV2.post('entities', {
  entity_type: 'customer',
  entity_name: 'ACME Corp',
  organization_id: organization.id,  // SACRED BOUNDARY
  // Actor (user.id) automatically included in RPC calls
})
```

### Actor-Organization Data Model:
```typescript
// USER entities ALWAYS in Platform Organization
const USER_PLATFORM_ORG = '00000000-0000-0000-0000-000000000000'

// Membership relationships in tenant organizations
await createRelationship({
  source_entity_id: user.id,           // Actor entity
  target_entity_id: organization.id,   // Tenant organization  
  relationship_type: 'USER_MEMBER_OF_ORG',
  organization_id: organization.id     // Stored in tenant boundary
})

// Business roles stored as dynamic data in tenant
await setDynamicField({
  entity_id: user.id,
  organization_id: organization.id,    // Tenant-specific role
  field_name: 'business_role',
  field_value_text: 'salon_manager'
})
```

### URL Patterns (v2.2):
```bash
# Development  
localhost:3000/~acme                   # Organization-specific access
localhost:3000/auth/organizations      # Organization selector
localhost:3000/auth/login?demo=salon   # Demo mode selector

# Production
app.heraerp.com                        # Central auth hub  
acme.heraerp.com                       # Tenant-specific access
demo.heraerp.com/salon                 # Demo environments
```

---

## 📊 UNIVERSAL BUSINESS PATTERNS

### Entity Creation with Normalization:
```typescript
import { universalApi } from '@/lib/universal-api-v2'

// Automatic deduplication built-in
const result = await universalApi.createEntity({
  entity_type: 'customer',
  entity_name: 'ACME Corp LLC',  // Auto-detects duplicates
  organization_id: orgId
})
```

### Status Workflows (Use Relationships):
```typescript
// ❌ WRONG - Never do this
const entity = { status: 'active' }  

// ✅ CORRECT - Use relationships
await createRelationship({
  source_entity_id: entity.id,
  target_entity_id: activeStatusEntity.id,
  relationship_type: 'HAS_STATUS',
  organization_id: orgId
})
```

### Transaction Creation:
```typescript
// Universal transaction pattern
const transaction = {
  transaction_type: 'sale',
  transaction_number: generateTransactionNumber(),  // NOT transaction_code
  source_entity_id: customer_id,
  target_entity_id: store_id,
  total_amount: 1000.00,
  organization_id: orgId  // SACRED - always required
}
```

---

## 🔒 HERA v2.2 AUTHENTICATION ARCHITECTURE

### 🏗️ Session → Actor → Org → Write Flow

HERA implements a sophisticated **four-layer authentication pipeline** with enhanced security, observability, and performance:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CLIENT/UI     │───▶│  EDGE/API       │───▶│   DATABASE      │───▶│    RESPONSE     │
│                 │    │                 │    │                 │    │                 │
│ • JWT Token     │    │ • Identity      │    │ • Guardrails    │    │ • 200 OK +     │
│ • Org Context   │    │ • Membership    │    │ • RLS + Audit   │    │   Actor + Org   │
│ • Idempotency   │    │ • Rate Limits   │    │ • Sacred Six    │    │ • Error JSON    │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 🎯 **Layer 1: Client Authentication**
```typescript
// Every API request includes:
Authorization: Bearer <jwt_token>           // Supabase JWT
X-Organization-Id: <org_uuid>              // Organization context
X-Idempotency-Key: <unique_key>            // Duplicate prevention
```

### 🛡️ **Layer 2: Edge Function Security Pipeline**

**Identity Resolution with Caching:**
```typescript
// resolve_user_identity_v1() with 5-minute TTL cache
const identity = await resolveUserIdentity(jwt)
if (!identity.cache_hit) {
  // Query DB and cache result
  await cacheIdentity(identity, TTL_5_MINUTES)
}
```

**Organization Context Resolution (Priority Order):**
1. `X-Organization-Id` header (explicit request)
2. JWT `organization_id` claim (token metadata) 
3. `memberships[0]` (first resolved membership)
4. **400 Bad Request** if no context found

**Membership Validation:**
```typescript
// Defense in depth: Edge + Database validation
if (!isActorMemberOfOrg(actorId, orgId)) {
  return 403 // Forbidden: actor_not_member
}
```

**Performance & Security Gates:**
- **Idempotency Check**: Redis/DB duplicate prevention → `409 Conflict`
- **Rate Limiting**: Per actor/org limits → `429 Too Many Requests`
- **Observability**: Auth attempts, identity resolution, write attempts

### 🗄️ **Layer 3: Database Guardrails v2.0**

**RPC Function Requirements:**
```typescript
// All write RPCs enforce actor pattern
await callRPC('hera_entities_crud_v2', {
  p_actor_user_id: resolvedActorId,    // WHO is making the change
  p_organization_id: validatedOrgId,   // WHERE (tenant boundary)
  p_entity_data: businessPayload      // WHAT is being changed
})
```

**Triple Validation System:**
1. **ORG-FILTER-REQUIRED**: `organization_id` presence validation
2. **SMARTCODE-PRESENT**: HERA DNA pattern validation  
3. **PAYLOAD-RULES**: Business logic validation (e.g., GL balanced)

**Audit Trail Automation:**
```sql
-- RPC automatically stamps audit fields
created_by = p_actor_user_id    -- WHO created
updated_by = p_actor_user_id    -- WHO modified  
created_at = NOW()              -- WHEN created
updated_at = NOW()              -- WHEN modified
```

**Defensive Triggers:**
```sql
-- Audit trigger validates non-NULL actor fields
IF NEW.created_by IS NULL OR NEW.updated_by IS NULL THEN
  RAISE EXCEPTION 'Audit violation: actor fields cannot be NULL';
END IF;
```

### 🔐 **Layer 4: Row-Level Security + Event Processing**

**Organization Isolation:**
```sql
-- RLS policies enforce organization boundary
CREATE POLICY org_isolation ON core_entities 
FOR ALL TO authenticated 
USING (organization_id = current_setting('app.current_org_id')::uuid);
```

**Event Outbox with Actor Context:**
```typescript
// Every mutation generates traceable event
await eventOutbox.enqueue({
  entity_id: result.id,
  actor_user_id: p_actor_user_id,  // WHO triggered the event
  organization_id: p_organization_id,
  event_type: 'entity_created',
  metadata: { source: 'api_v2', trace_id: request.trace_id }
})
```

### 🚨 **Enhanced Error Handling**

**Comprehensive Error Responses:**
- `401 Unauthorized` → `invalid_token` (JWT validation failed)
- `400 Bad Request` → `no_organization_context` (missing org context)
- `403 Forbidden` → `actor_not_member` (membership validation failed)
- `409 Conflict` → `duplicate_request` (idempotency violation)
- `429 Too Many Requests` → Rate limit exceeded
- `400 Audit Violation` → `created_by/updated_by NULL` (trigger safety)

### 🎛️ **MANDATORY Auth Provider Usage**

```typescript
// UPDATED: Use HERAAuthProvider (not MultiOrgAuthProvider)
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'

const { 
  user,                    // Resolved actor identity
  organization,            // Current organization context
  isAuthenticated,         // Session validation status
  sessionType,            // 'demo' | 'real'
  hasScope,               // Permission checker
  contextLoading          // Loading state
} = useHERAAuth()

// Three-Layer Authorization Pattern (MANDATORY)
if (!isAuthenticated) return <Alert>Please log in</Alert>
if (contextLoading) return <LoadingSpinner />  
if (!organization?.id) return <Alert>No organization context</Alert>
```

### 📊 **API Request Pattern**

```typescript
import { apiV2 } from '@/lib/client/fetchV2'

// All API calls automatically include actor context
const result = await apiV2.post('entities', {
  entity_type: 'customer',
  entity_name: 'ACME Corp',
  organization_id: organization.id,  // SACRED BOUNDARY
  // Actor automatically resolved from JWT
})

// Response includes actor confirmation
// { data: {...}, actor_user_id: "uuid", organization_id: "uuid" }
```

### 🔬 **Observability & Monitoring**

**Automatic Metrics Collection:**
- **auth_attempt**: JWT validation attempts
- **identity_resolved**: User identity cache hits/misses  
- **write_attempt**: Database write operations
- **rate_limit**: Rate limiting events
- **ai_insights**: Rules engine traces with actor context

**Actor Traceability:**
```typescript
// Every operation is traceable to specific actor
{
  "trace_id": "uuid",
  "actor_user_id": "uuid", 
  "organization_id": "uuid",
  "operation": "entity_create",
  "timestamp": "2024-01-01T12:00:00Z",
  "mutations": [...],
  "violations": [...]
}
```

### 🛡️ **Security Guarantees**

1. **Actor Accountability**: Every change traceable to specific user
2. **Organization Isolation**: Sacred boundary enforcement at all layers
3. **Idempotency**: Duplicate request prevention built-in
4. **Rate Limiting**: DoS protection per actor/organization
5. **Audit Trail**: Complete change history with WHO/WHEN/WHAT
6. **Defense in Depth**: Edge + Database + Trigger validation
7. **Cache Performance**: 5-minute TTL reduces DB load 95%+

**This architecture provides enterprise-grade security while maintaining sub-100ms response times and complete audit traceability.**

---

## ⚡ TROUBLESHOOTING QUICK FIXES

### Common Issues:
```bash
# Schema field errors (CORRECTED)
✅ FIXED: transaction_code IS CORRECT (not transaction_number)
✅ FIXED: from_entity_id/to_entity_id IS CORRECT in core_relationships 
✅ FIXED: source_entity_id/target_entity_id IS CORRECT in universal_transactions
✅ FIXED: entity_id/line_number IS CORRECT in universal_transaction_lines

# Organization errors
ERROR: DEFAULT_ORGANIZATION_ID not set
FIX: node hera-cli.js query core_organizations
     # Update .env with the UUID

# Status workflow confusion
NEVER: UPDATE core_entities SET status = 'active'
USE: node status-workflow-example.js  # Learn the pattern
```

---

## 🏆 HERA TRANSACTIONS CRUD V2 - PRODUCTION READY

### ✅ Enterprise-Grade Transaction Management
**Status:** 🎯 **100% Success Rate (16/16 enterprise tests passed)**  
**Performance:** ⚡ **76.4ms average transaction creation**  
**Security:** 🛡️ **Enterprise-grade validation with NULL UUID protection**

```typescript
// Complete CRUD operations for transactions
await supabase.rpc('hera_transactions_crud_v2', {
  p_action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE',
  p_actor_user_id: string,           // Required - WHO is acting
  p_organization_id: string,         // Required - WHERE (tenant boundary)
  p_transaction: {
    transaction_type: string,         // Required for CREATE - 'appointment', 'sale'
    smart_code: string,              // Required for CREATE - HERA DNA pattern
    transaction_code?: string,       // Optional - auto-generated
    source_entity_id?: string,       // Optional - customer/vendor
    target_entity_id?: string,       // Optional - staff/location
    total_amount?: number,           // Optional - transaction total
    transaction_status?: string,     // Optional - workflow state
    transaction_id?: string          // Required for UPDATE/DELETE
  },
  p_lines: [                        // Optional - transaction lines
    {
      line_number: number,          // Required
      line_type: string,            // Required - 'SERVICE', 'PRODUCT', 'GL'
      description?: string,         // Optional
      quantity?: number,            // Optional - defaults to 1
      unit_amount?: number,         // Optional - defaults to 0
      line_amount?: number,         // Optional - defaults to 0
      entity_id?: string,           // Optional - related entity
      smart_code?: string           // Optional - HERA DNA
    }
  ],
  p_options: {
    limit?: number,                 // For READ operations
    include_lines?: boolean         // Include line items
  }
})
```

### 🛡️ Security Features Verified
- ✅ NULL UUID attack prevention
- ✅ Platform organization protection
- ✅ Comprehensive actor validation
- ✅ Multi-tenant isolation enforcement
- ✅ Complete audit trail stamping

### 📊 Schema Field Compliance (100% Verified)
- ✅ `transaction_code` (correct in universal_transactions)
- ✅ `from_entity_id/to_entity_id` (correct in core_relationships)
- ✅ `entity_id/line_number` (correct in universal_transaction_lines)
- ✅ `line_type` (required field properly handled)

---

## 🏗️ HERA ENTERPRISE GENERATOR SYSTEM

### 🚀 INSTANT CRUD PAGE GENERATION

**Generate enterprise-grade CRUD pages in seconds with bulletproof quality gates:**

```bash
# Generate a new CRUD page for any entity
npm run generate:entity CONTACT     # Generates /app/crm/contacts/page.tsx
npm run generate:entity ACCOUNT     # Generates /app/crm/accounts/page.tsx  
npm run generate:entity LEAD        # Generates /app/crm/leads/page.tsx
npm run generate:entity OPPORTUNITY # Generates /app/crm/opportunities/page.tsx
npm run generate:entity ACTIVITY    # Generates /app/crm/activities/page.tsx
npm run generate:entity PRODUCT     # Generates /app/products/page.tsx

# Alternative command (same result)
node scripts/generate-crud-page-enterprise.js CONTACT
```

### ✅ GUARANTEED FEATURES:
- **Mobile-First Design**: Responsive cards + desktop tables
- **Zero Duplicate Imports**: Bulletproof deduplication (17 unit tests)
- **Sacred Six Compliance**: Automatic schema field validation  
- **Smart Code Integration**: HERA DNA smart codes embedded
- **Organization Isolation**: Multi-tenant security built-in
- **Quality Gates**: Lint + TypeScript + E2E tests pass automatically

### 🛡️ QUALITY VERIFICATION:
```bash
# Run full quality pipeline
npm run ci:quality

# Individual checks
npm run test:unit              # Unit tests (icon deduplication)
npm run test:e2e              # E2E route validation  
npm run quality:gates         # HERA compliance checks
npm run lint && npm run typecheck  # Code quality
```

### 🎯 AVAILABLE PRESETS:
- **CONTACT**: Customer contacts with email/phone/title
- **ACCOUNT**: Company accounts with industry/revenue  
- **LEAD**: Sales prospects with scoring/conversion
- **OPPORTUNITY**: Pipeline deals with stages/probability
- **ACTIVITY**: Tasks/meetings with due dates/priority
- **PRODUCT**: Catalog items with pricing/categories

### 🔧 EXTENDING THE GENERATOR:
1. Add new preset in `src/tools/generator/presets/[entity].ts`
2. Define fields, smart codes, and UI configuration  
3. Run generator with your new entity type
4. Quality gates ensure compliance automatically

---

## 📚 ESSENTIAL DOCUMENTATION

- **Schema Reference**: `/docs/schema/hera-sacred-six-schema.yaml`
- **MCP Connection Guide**: `/mcp-server/test-hera-entities-crud-v2-final.mjs` - Production-ready MCP patterns
- **MCP Server Configuration**: `/mcp-server/mcp.json` - Server setup and tools
- **Enterprise Generator**: `/docs/generator/HERA-ENTERPRISE-GENERATOR-SYSTEM.md`
- **MCA System**: `/docs/mca/HERA-MCA-SYSTEM-OVERVIEW.md`
- **Playbook System**: `/src/lib/dna/playbook/hera-development-playbook.ts`
- **Universal API**: `/docs/dna/UNIVERSAL-API-V2-RPC-PATTERNS.md`
- **Smart Codes**: `/docs/playbooks/_shared/SMART_CODE_GUIDE.md`
- **Authorization**: `/docs/HERA-AUTHORIZATION-ARCHITECTURE.md`

---

## 🎯 DEVELOPMENT CHECKLIST

Before starting ANY development:
- [ ] ✅ Guardrail system activated and validated
- [ ] ✅ Schema reference checked for field names
- [ ] ✅ Organization context confirmed
- [ ] ✅ Smart codes planned and validated
- [ ] ✅ Field placement follows policy (dynamic data vs metadata)
- [ ] ✅ API v2 endpoints and RPC functions identified
- [ ] ✅ Multi-tenant security patterns implemented
- [ ] ✅ **MCP connection tested** via `cd mcp-server && node test-hera-entities-crud-v2-final.mjs`

**The guardrail system will automatically check most of these, but manual verification ensures 100% compliance.**

### 🧪 **MCP Quick Verification**

```bash
# Essential MCP health check (30 seconds)
cd mcp-server
node test-hera-entities-crud-v2-final.mjs

# Expected output:
# ✅ CREATE Result Status: SUCCESS
# ✅ READ Result Status: SUCCESS  
# ✅ UPDATE Result Status: SUCCESS
# ✅ DELETE Result Status: SUCCESS
# 🛡️ HERA Security Features Verified
```

---

## 🚀 THE HERA PROMISE

**6 Tables. Infinite Business Complexity. Zero Schema Changes.**

HERA's universal architecture eliminates traditional ERP complexity through:
- **Universal API V2** - One endpoint handles everything
- **Sacred Six Tables** - Never add tables or columns
- **Smart Code Intelligence** - Every operation has business context
- **Perfect Multi-Tenancy** - Sacred organization_id boundary
- **Automatic Guardrails** - Prevents 95%+ of common mistakes
- **Production Proven** - Running live businesses successfully

**Follow these rules, and HERA will handle the complexity for you.**

---

## 📱 HERA MOBILE-FIRST RESPONSIVE DESIGN - MANDATORY

**🚨 CRITICAL**: All HERA user interfaces MUST follow mobile-first responsive design principles. This is now a mandatory standard for all development.

### 🎯 Dual-Experience Architecture

HERA applications deliver two distinct, optimized experiences:

**Desktop Experience: SAP Fiori Enterprise**
- Wide-screen layouts with data density
- Multi-column grids and detailed tables
- Advanced filtering and bulk operations
- Keyboard shortcuts and power user features

**Mobile Experience: Native App Feel**
- Touch-optimized interactions (44px minimum targets)
- iOS/Android native patterns
- Progressive disclosure and focused tasks
- Thumb-friendly navigation zones

### 🔴 MANDATORY MOBILE REQUIREMENTS

**1. Touch Targets**
```typescript
// ✅ REQUIRED - Minimum 44px touch targets
<button className="min-h-[44px] min-w-[44px]">Action</button>

// ✅ REQUIRED - Active state feedback for native feel
<button className="active:scale-95 transition-transform">Tap Me</button>

// ❌ FORBIDDEN - Touch targets smaller than 44px
<button className="h-8 w-8">Too Small</button>
```

**2. Progressive Typography**
```typescript
// ✅ REQUIRED - Responsive text scaling
<h1 className="text-xl md:text-3xl lg:text-4xl">Page Title</h1>
<p className="text-sm md:text-base">Description text</p>

// ❌ FORBIDDEN - Fixed desktop-only sizes
<h1 className="text-4xl">Desktop Only</h1>
```

**3. Responsive Spacing**
```typescript
// ✅ REQUIRED - Mobile-first padding/margin
<div className="p-4 md:p-6 lg:p-8">Content</div>
<div className="space-y-4 md:space-y-6">Stacked items</div>

// ❌ FORBIDDEN - Desktop-only spacing
<div className="p-8">Desktop Only</div>
```

**4. Responsive Grids**
```typescript
// ✅ REQUIRED - Progressive grid columns
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
  {items.map(item => <Card key={item.id} />)}
</div>

// ❌ FORBIDDEN - Fixed desktop grids
<div className="grid grid-cols-4 gap-8">Desktop Only</div>
```

### 📱 Mobile Navigation Architecture

**HERA uses dual navigation patterns:**

**Desktop: Sidebar Navigation (SAP Fiori)**
- Fixed left sidebar (80px width)
- Icon + tooltip on hover
- Role-based menu items
- Always visible

**Mobile: Bottom Tab Bar (iOS/Android Native)**
- Fixed bottom navigation (56px height)
- 5 tabs maximum (iOS standard)
- Icon + label layout
- Safe area aware for iPhone notch
- Active state with haptic feedback (active:scale-95)

**Implementation:**
```tsx
// Layout automatically handles responsive navigation
// Sidebar hidden on mobile, bottom nav hidden on desktop

// Desktop: <SalonRoleBasedDarkSidebar /> (md:block)
// Mobile: <SalonMobileBottomNav userRole={role} /> (md:hidden)
```

### 📐 Standard Mobile Header Pattern

**Every HERA page MUST implement this mobile header:**

```tsx
{/* iOS-style status bar spacer - MANDATORY on mobile */}
<div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />

{/* Mobile app header - MANDATORY */}
<div className="md:hidden sticky top-0 z-50 bg-charcoal border-b border-gold/20">
  <div className="flex items-center justify-between p-4">
    <div className="flex items-center gap-3">
      {/* Rounded app icon */}
      <div className="w-10 h-10 rounded-xl bg-gold/20 flex items-center justify-center">
        <Sparkles className="w-5 h-5 text-gold" />
      </div>
      {/* Title and subtitle */}
      <div>
        <h1 className="text-lg font-bold text-champagne">{title}</h1>
        <p className="text-xs text-bronze">{subtitle}</p>
      </div>
    </div>
    {/* Touch-friendly action button */}
    <button className="min-w-[44px] min-h-[44px] rounded-full bg-gold/10 flex items-center justify-center active:scale-95">
      <Bell className="w-5 h-5 text-gold" />
      {notificationCount > 0 && (
        <span className="absolute top-0 right-0 w-5 h-5 bg-rose text-white text-xs rounded-full flex items-center justify-center">
          {notificationCount}
        </span>
      )}
    </button>
  </div>
</div>
```

### 🎨 Responsive Content Patterns

**Welcome Cards (Mobile)**
```tsx
{/* Mobile welcome card - MANDATORY pattern */}
<div className="md:hidden bg-gradient-to-br from-gold/20 to-champagne/10 rounded-2xl p-6 mb-6">
  <h2 className="text-2xl font-bold text-champagne mb-2">Welcome Back!</h2>
  <p className="text-bronze">You have {taskCount} tasks today</p>
</div>
```

**Touch-Friendly Tiles**
```tsx
{/* Mobile tile grid - MANDATORY for dashboards */}
<div className="grid grid-cols-2 gap-4 md:hidden">
  <button className="min-h-[120px] bg-charcoal rounded-xl p-4 active:scale-95 transition-transform">
    <Calendar className="w-8 h-8 text-gold mb-2" />
    <span className="block text-champagne font-medium">Appointments</span>
    <span className="text-xs text-bronze">12 today</span>
  </button>
</div>
```

**Vertical Quick Actions**
```tsx
{/* Mobile action list - MANDATORY pattern */}
<div className="md:hidden space-y-2 mb-6">
  <button className="w-full min-h-[56px] bg-gold text-black rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95">
    <Plus className="w-5 h-5" />
    New Appointment
  </button>
  <button className="w-full min-h-[56px] bg-charcoal text-champagne rounded-xl flex items-center justify-center gap-2 active:scale-95">
    <Search className="w-5 h-5" />
    Search Customers
  </button>
</div>
```

### 🚀 Performance Requirements

**Lazy Loading - MANDATORY**
```tsx
import { lazy, Suspense } from 'react'

// ✅ REQUIRED - Split heavy components
const PageHeader = lazy(() => import('./PageHeader'))
const FilterBar = lazy(() => import('./FilterBar'))
const ContentGrid = lazy(() => import('./ContentGrid'))

// ✅ REQUIRED - Suspense boundaries with skeletons
<Suspense fallback={<HeaderSkeleton />}>
  <PageHeader />
</Suspense>
```

**Performance Targets - MANDATORY**
- Initial page load: < 1.5s
- Time to Interactive: < 2.5s
- First Contentful Paint: < 1.0s
- Lighthouse Mobile Score: > 90

### 🏗️ Standard Page Layout

**All HERA pages MUST use this structure:**

```tsx
import { SalonLuxePage } from '@/components/salon/shared/SalonLuxePage'
import { Suspense, lazy } from 'react'

const PageContent = lazy(() => import('./PageContent'))

export default function SalonPage() {
  return (
    <SalonLuxePage
      title="Page Title"
      description="Page description"
      maxWidth="full"
      padding="lg"
    >
      {/* Mobile Header - MANDATORY */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />

      {/* Mobile App Header - MANDATORY */}
      <div className="md:hidden sticky top-0 z-50">
        {/* ... mobile header implementation ... */}
      </div>

      {/* Page Content with Lazy Loading - MANDATORY */}
      <Suspense fallback={<ContentSkeleton />}>
        <PageContent />
      </Suspense>

      {/* Bottom Spacing for Mobile - MANDATORY */}
      <div className="h-24 md:h-0" />
    </SalonLuxePage>
  )
}
```

### 📋 Design Tokens

**Mobile-specific constants - USE THESE:**

```typescript
export const MOBILE_DESIGN_TOKENS = {
  // Touch targets
  touchTarget: {
    min: '44px',        // iOS HIG minimum
    comfortable: '48px',
    large: '56px'
  },

  // Spacing scales
  spacing: {
    mobile: {
      xs: '0.5rem',   // 8px
      sm: '0.75rem',  // 12px
      md: '1rem',     // 16px
      lg: '1.5rem',   // 24px
      xl: '2rem'      // 32px
    },
    desktop: {
      xs: '0.75rem',  // 12px
      sm: '1rem',     // 16px
      md: '1.5rem',   // 24px
      lg: '2rem',     // 32px
      xl: '3rem'      // 48px
    }
  },

  // Typography scales
  fontSize: {
    mobile: {
      xs: '0.75rem',   // 12px
      sm: '0.875rem',  // 14px
      base: '1rem',    // 16px
      lg: '1.125rem',  // 18px
      xl: '1.25rem',   // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem' // 30px
    },
    desktop: {
      xs: '0.75rem',   // 12px
      sm: '0.875rem',  // 14px
      base: '1rem',    // 16px
      lg: '1.125rem',  // 18px
      xl: '1.25rem',   // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '2.25rem' // 36px
    }
  },

  // Z-index hierarchy
  zIndex: {
    mobileNav: 50,
    stickyHeader: 40,
    filterBar: 30,
    dropdown: 20,
    modal: 60
  }
}
```

### ✅ COMPLIANCE CHECKLIST

Before merging any HERA UI code, verify:

- [ ] ✅ All touch targets >= 44px on mobile
- [ ] ✅ Active state feedback (active:scale-95) on all interactive elements
- [ ] ✅ Progressive typography (text-xl md:text-3xl pattern)
- [ ] ✅ Responsive spacing (p-4 md:p-6 lg:p-8 pattern)
- [ ] ✅ Responsive grids (grid-cols-1 md:grid-cols-2 lg:grid-cols-3 pattern)
- [ ] ✅ iOS-style mobile header with status bar spacer
- [ ] ✅ Mobile bottom navigation (iOS/Android tab bar)
- [ ] ✅ Sidebar hidden on mobile (md:hidden)
- [ ] ✅ Lazy loading with Suspense boundaries
- [ ] ✅ Mobile performance targets met (< 1.5s initial load)
- [ ] ✅ Bottom spacing for comfortable mobile scrolling
- [ ] ✅ Tested on iOS Safari and Chrome Mobile

### 📖 COMPREHENSIVE IMPLEMENTATION GUIDE

**For detailed implementation instructions, see:**
`/docs/salon/MOBILE-FIRST-STANDARDIZATION-CHECKLIST.md`

This document includes:
- Component architecture specifications
- Page-by-page implementation plan
- Mobile optimization patterns
- Testing and QA procedures
- 4-week rollout timeline

### 🛡️ MANDATORY COMPLIANCE

**Mobile-first responsive design is NOT optional. All HERA interfaces must:**

1. **Work perfectly on mobile first** - Mobile is the primary experience
2. **Enhance progressively for desktop** - Desktop gets additional features
3. **Follow iOS/Android native patterns** - Feel like a native app
4. **Meet performance targets** - Fast, smooth, instant loading
5. **Pass accessibility standards** - WCAG 2.1 AA compliance

**Non-compliance will block PR merges. Mobile-first is HERA DNA.**