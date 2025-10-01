# HERA Universal API v2 - Quick Start Guide

Get up and running with HERA's self-assembling Universal API in 5 minutes.

## 🚀 Quick Setup

### 1. Environment Variables

Create `.env.local` in your project root:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Server-side only!
SUPABASE_ANON_KEY=eyJ...           # For RLS mode
```

### 2. Test Connection

```bash
# Test the API is running
curl http://localhost:3000/api/universal/entities \
  -H "Content-Type: application/json"

# Should return: {"success": false, "error": "organization_id is required"}
```

### 3. Create Your First Entity

```bash
# Replace <org-uuid> with your organization ID
curl -X POST http://localhost:3000/api/universal/entities \
  -H "Content-Type: application/json" \
  -d '{
    "p_organization_id": "<org-uuid>",
    "p_entity_type": "customer",
    "p_entity_name": "My First Customer",
    "p_smart_code": "HERA.DEMO.CRM.ENT.CUST.v1"
  }'
```

## 🧬 Smart Code Pattern

Every entity needs a Smart Code following this pattern:

```
HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.{VERSION}

Examples:
- HERA.SALON.CRM.ENT.CUST.v1     # Salon customer
- HERA.REST.INV.ENT.PROD.v1      # Restaurant product
- HERA.HEALTH.PAT.ENT.PATIENT.v1 # Healthcare patient
```

## 📝 Common Operations

### Create Entity with Dynamic Fields

```javascript
// POST /api/universal/entities
{
  "p_organization_id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "p_entity_type": "customer",
  "p_entity_name": "Acme Corp",
  "p_smart_code": "HERA.SALON.CRM.ENT.CUST.v1",
  // Dynamic fields (stored in core_dynamic_data)
  "email": "contact@acme.com",
  "phone": "+1-555-0123",
  "loyalty_tier": "gold"
}
```

### Query Entities

```bash
# Get all customers
curl "http://localhost:3000/api/universal/entities?\
organization_id=<org-uuid>&\
entity_type=customer"

# With pagination
curl "http://localhost:3000/api/universal/entities?\
organization_id=<org-uuid>&\
entity_type=customer&\
page=1&limit=10"
```

### Get Single Entity

```bash
# Basic entity data
curl "http://localhost:3000/api/universal/entities/<entity-id>?\
organization_id=<org-uuid>"

# Include dynamic fields
curl "http://localhost:3000/api/universal/entities/<entity-id>?\
organization_id=<org-uuid>&\
include_dynamic=true"
```

### Update Entity

```bash
curl -X PUT "http://localhost:3000/api/universal/entities/<entity-id>" \
  -H "Content-Type: application/json" \
  -d '{
    "p_organization_id": "<org-uuid>",
    "p_entity_name": "Updated Name",
    "p_smart_code": "HERA.SALON.CRM.ENT.CUST.v1",
    "loyalty_tier": "platinum"
  }'
```

### Delete Entity

```bash
curl -X DELETE "http://localhost:3000/api/universal/entities/<entity-id>?\
organization_id=<org-uuid>"
```

## 🔐 Authentication Modes

### RLS Mode (Row-Level Security)
```bash
# Include JWT token from your auth provider
curl -H "Authorization: Bearer <jwt-token>" \
  http://localhost:3000/api/universal/entities
```

### Service Mode (Default)
```bash
# No token = service mode (bypasses RLS)
curl http://localhost:3000/api/universal/entities
```

## 📊 Response Formats

### Success Response
```json
{
  "success": true,
  "data": {
    "entity_id": "550e8400-e29b-41d4-a716-446655440000",
    "smart_code": "HERA.SALON.CRM.ENT.CUST.v1",
    "entity_type": "customer",
    "entity_name": "Acme Corp"
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Validation failed",
  "code": "INVALID_SMART_CODE",
  "details": {
    "field": "p_smart_code",
    "message": "Smart code must match HERA DNA pattern"
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 156,
    "pages": 8
  },
  "_links": {
    "self": "/api/universal/entities?...",
    "next": "/api/universal/entities?...&page=2",
    "prev": null
  }
}
```

## 🧪 Test Data Setup

### 1. Create Test Organization

```sql
-- In Supabase SQL Editor
INSERT INTO core_organizations (id, organization_name, organization_code)
VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'Test Organization',
  'TEST-ORG'
);
```

### 2. Create UCR Rules (Optional)

```sql
-- Add validation rules for customer entities
INSERT INTO core_dynamic_data (
  organization_id,
  entity_id,
  field_name,
  field_type,
  smart_code,
  field_value_json
) VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  'f47ac10b-58cc-4372-a567-0e02b2c3d479', -- org as entity
  'ucr_rule',
  'json',
  'HERA.SALON.CRM.ENT.CUST.v1',
  '{
    "rule_type": "validation",
    "rule_config": {
      "required_fields": ["email"],
      "validations": [{
        "field_name": "email",
        "field_type": "email",
        "required": true
      }]
    }
  }'::jsonb
);
```

## 🛠️ TypeScript/JavaScript SDK

```typescript
// Using fetch
async function createEntity(data: any) {
  const response = await fetch('/api/universal/entities', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` // Optional for RLS
    },
    body: JSON.stringify(data)
  });
  
  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error);
  }
  
  return result.data;
}

// Usage
const customer = await createEntity({
  p_organization_id: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  p_entity_type: 'customer',
  p_entity_name: 'New Customer',
  p_smart_code: 'HERA.SALON.CRM.ENT.CUST.v1',
  email: 'customer@example.com'
});
```

## 🚨 Common Issues

### "Invalid Smart Code"
- Check pattern: `HERA.{2-15 chars}.{segments}.v{number}`
- Must be uppercase
- Must end with `.v1`, `.v2`, etc.

### "Organization ID required"
- Always include `p_organization_id` (or `organization_id` in query params)
- Must be valid UUID format

### "Entity not found"
- Check entity ID is correct UUID
- Ensure organization_id matches the entity's organization

### Dynamic fields not saving
- Ensure Smart Code has UCR rules defined
- Check field names match UCR configuration
- Verify field types are supported

## 📚 Next Steps

1. **Add UCR Rules** - Define validation and business rules for your Smart Codes
2. **Create Procedures** - Add custom database functions for complex operations
3. **Build Playbooks** - Orchestrate multi-step business processes
4. **Integrate Finance DNA** - Add currency and GL posting support

See [UNIVERSAL-API-V2-ARCHITECTURE.md](./UNIVERSAL-API-V2-ARCHITECTURE.md) for complete documentation.