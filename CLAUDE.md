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
4. ✅ **Smart Code Format Errors** - Enforces UPPERCASE .V1 format automatically
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

---

## 🧬 HERA DNA SMART CODE RULES

### Format Requirements:
- Structure: `HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.V1`
- 6-10 segments, UPPERCASE, ends with `.V1` (not `.v1`)
- Use existing families, don't invent new ones

### Common Examples:
```typescript
'HERA.SALON.POS.CART.ACTIVE.V1'           // Salon POS cart
'HERA.REST.MENU.ITEM.FOOD.V1'             // Restaurant menu item
'HERA.CRM.CUSTOMER.ENTITY.PROFILE.V1'     // Customer profile
'HERA.FIN.GL.ACCOUNT.ENTITY.V1'           // GL account
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

## 🎛️ MCP DEVELOPMENT WORKFLOW

### Primary Development Method:
```bash
# 1. Use MCP CLI tools (prevents memory issues)
cd mcp-server
node hera-query.js summary              # View database overview
node hera-cli.js create-entity customer "Company Name"
node hera-cli.js set-field <id> email "test@example.com"

# 2. Check organization setup
node hera-cli.js query core_organizations
# Update .env: DEFAULT_ORGANIZATION_ID=your-uuid

# 3. Use status workflows (relationships, not columns)
node status-workflow-example.js         # Learn the pattern
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
```

---

## 🏢 MULTI-TENANT AUTHENTICATION

### Always Use These:
```typescript
// MANDATORY auth provider
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'

// Check organization context
const { currentOrganization, isAuthenticated } = useMultiOrgAuth()
if (!currentOrganization) return <div>Please select an organization</div>

// Include organization_id in ALL API calls
const { data } = await apiV2.post('entities', {
  entity_type: 'customer',
  entity_name: 'Test Customer',
  organization_id: currentOrganization.id,  // CRITICAL - NEVER SKIP
})
```

### URL Patterns:
```bash
# Development
localhost:3000/~acme                   # Organization access
localhost:3000/auth/organizations      # Organization selector

# Production
app.heraerp.com                        # Central auth hub
acme.heraerp.com                       # Organization-specific access
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

## 🔒 SECURITY PATTERNS

### Three-Layer Authorization (MANDATORY):
```typescript
// Layer 1: Authentication Check
if (!isAuthenticated) {
  return <Alert>Please log in to access this page.</Alert>
}

// Layer 2: Context Loading Check (NEVER SKIP!)
if (contextLoading) {
  return <LoadingSpinner />
}

// Layer 3: Organization Check  
if (!organizationId) {
  return <Alert>No organization context found.</Alert>
}
```

---

## ⚡ TROUBLESHOOTING QUICK FIXES

### Common Issues:
```bash
# Schema field errors
ERROR: column "transaction_code" does not exist
FIX: Use transaction_number instead

ERROR: column "from_entity_id" does not exist  
FIX: Use source_entity_id/target_entity_id instead

# Organization errors
ERROR: DEFAULT_ORGANIZATION_ID not set
FIX: node hera-cli.js query core_organizations
     # Update .env with the UUID

# Status workflow confusion
NEVER: UPDATE core_entities SET status = 'active'
USE: node status-workflow-example.js  # Learn the pattern
```

---

## 📚 ESSENTIAL DOCUMENTATION

- **Schema Reference**: `/docs/schema/hera-sacred-six-schema.yaml`
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

**The guardrail system will automatically check most of these, but manual verification ensures 100% compliance.**

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