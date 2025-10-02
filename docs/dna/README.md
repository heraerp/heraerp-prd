# HERA DNA Documentation

**Production-Ready Patterns, Best Practices, and Reference Guides**

---

## 📚 Documentation Index

### 🔌 Universal API v2 RPC Patterns
**[UNIVERSAL-API-V2-RPC-PATTERNS.md](./UNIVERSAL-API-V2-RPC-PATTERNS.md)**

Complete guide to HERA's RPC-first architecture. Covers all function signatures, parameters, return types, and production patterns.

**Topics Covered**:
- Entity CRUD operations
- Dynamic data management
- Relationship handling
- Transaction processing
- Validation functions
- Two-step entity creation pattern
- Smart code catalog
- Best practices

**Use When**: Building any feature that touches the database

---

### 🐛 RPC Debugging Guide
**[RPC-DEBUGGING-GUIDE.md](./RPC-DEBUGGING-GUIDE.md)**

Troubleshooting guide for common RPC errors and issues.

**Topics Covered**:
- Common error messages and solutions
- Function signature mismatches
- Schema vs migration differences
- Smart code validation errors
- Parameter debugging workflow
- Testing deployed functions

**Use When**: Encountering RPC errors or unexpected behavior

---

### 📋 RPC Quick Reference
**[RPC-CHEAT-SHEET.md](./RPC-CHEAT-SHEET.md)**

One-page quick reference for all RPC functions and patterns.

**Topics Covered**:
- Core rules
- Function signatures (condensed)
- Two-step pattern
- Common smart codes
- Error handling
- Field placement
- Production checklist

**Use When**: Need quick lookup during development

---

## 🎯 Quick Start

### For New Developers

1. **Read**: [UNIVERSAL-API-V2-RPC-PATTERNS.md](./UNIVERSAL-API-V2-RPC-PATTERNS.md) (30 min)
2. **Reference**: Keep [RPC-CHEAT-SHEET.md](./RPC-CHEAT-SHEET.md) open while coding
3. **Debug**: Use [RPC-DEBUGGING-GUIDE.md](./RPC-DEBUGGING-GUIDE.md) when stuck

### For Experienced Developers

- **Quick Lookup**: [RPC-CHEAT-SHEET.md](./RPC-CHEAT-SHEET.md)
- **Deep Dive**: [UNIVERSAL-API-V2-RPC-PATTERNS.md](./UNIVERSAL-API-V2-RPC-PATTERNS.md)
- **Troubleshooting**: [RPC-DEBUGGING-GUIDE.md](./RPC-DEBUGGING-GUIDE.md)

---

## 🧬 HERA DNA Principles

### 1. RPC-First Architecture
- ✅ All database operations through Postgres functions
- ❌ Never use direct table access in API routes
- ✅ Functions provide validation, business logic, audit trails

### 2. Sacred Parameters
```typescript
p_organization_id: UUID  // Multi-tenant isolation (ALWAYS required)
p_smart_code: string     // Business intelligence (6+ segments, .V1)
```

### 3. Field Placement Policy
```typescript
// Business data → core_dynamic_data
color, price, category → hera_dynamic_data_batch_v1

// System data → metadata (with category)
ai_confidence → p_metadata.ai_confidence

// Status → relationships (NEVER columns)
status → hera_relationship_create_v1
```

### 4. Two-Step Pattern
```typescript
// Step 1: Create entity
const entityId = await callRPC('hera_entity_upsert_v1', {...})

// Step 2: Add dynamic fields
await callRPC('hera_dynamic_data_batch_v1', {...})
```

---

## 📖 Additional Resources

### In Main Documentation
- **CLAUDE.md**: Main development guidelines (includes RPC quick reference)
- **SMART_CODE_GUIDE.md**: Complete smart code rules and patterns
- **SCHEMA-FIRST-DEVELOPMENT.md**: Schema validation and type generation

### Test Scripts
- `test-entity-upsert-rpc.js`: Test entity creation
- `test-dynamic-data-rpc.js`: Test dynamic fields
- `test-relationships-rpc.js`: Test relationships
- `check-schema.js`: View actual table schemas

### CLI Tools
```bash
# Schema validation
npm run schema:check
npm run schema:types

# Database inspection
cd mcp-server
node check-schema.js core_entities
node hera-query.js summary
```

---

## 🚀 Common Workflows

### Creating a New Entity Type

1. **Define smart code** (6+ segments, .V1)
   ```typescript
   'HERA.SALON.PROD.CATEGORY.FIELD.V1'
   ```

2. **Create entity** (Step 1)
   ```typescript
   const entityId = await callRPC('hera_entity_upsert_v1', {
     p_organization_id: orgId,
     p_entity_type: 'product_category',
     p_entity_name: 'Premium',
     p_smart_code: 'HERA.SALON.PROD.CATEGORY.FIELD.V1',
     p_entity_id: null,
     p_entity_code: 'CAT-001',
     p_metadata: null
   })
   ```

3. **Add dynamic fields** (Step 2)
   ```typescript
   await callRPC('hera_dynamic_data_batch_v1', {
     p_organization_id: orgId,
     p_entity_id: entityId.data,
     p_smart_code: 'HERA.SALON.PROD.CATEGORY.FIELD.V1',
     p_fields: [
       { field_name: 'color', field_type: 'text', field_value: '#8B5CF6' },
       { field_name: 'icon', field_type: 'text', field_value: 'Sparkles' }
     ]
   })
   ```

### Implementing Status Workflow

1. **Create status entities** (one-time)
   ```typescript
   const statuses = ['draft', 'pending', 'approved', 'rejected']
   for (const status of statuses) {
     await callRPC('hera_entity_upsert_v1', {
       p_organization_id: orgId,
       p_entity_type: 'workflow_status',
       p_entity_name: `${status} Status`,
       p_smart_code: `HERA.WORKFLOW.STATUS.${status.toUpperCase()}.V1`,
       p_entity_code: `STATUS-${status.toUpperCase()}`,
       p_metadata: null
     })
   }
   ```

2. **Assign status via relationship**
   ```typescript
   await callRPC('hera_relationship_create_v1', {
     p_organization_id: orgId,
     p_from_entity_id: transactionId,
     p_to_entity_id: approvedStatusId,
     p_relationship_type: 'has_status',
     p_smart_code: 'HERA.WORKFLOW.STATUS.ASSIGN.V1'
   })
   ```

### Creating Transactions

```typescript
const result = await callRPC('hera_txn_create_v1', {
  p_header: {
    organization_id: orgId,
    transaction_type: 'sale',
    smart_code: 'HERA.SALON.SVC.TXN.SERVICE.V1',
    transaction_date: new Date().toISOString(),
    total_amount: 150.00,
    from_entity_id: customerId,
    to_entity_id: storeId
  },
  p_lines: [
    {
      line_number: 1,
      line_entity_id: serviceId,
      quantity: 1,
      unit_price: 150.00,
      line_amount: 150.00,
      smart_code: 'HERA.SALON.SVC.LINE.STANDARD.V1'
    }
  ]
})
```

---

## ⚠️ Common Pitfalls

### ❌ Wrong: Direct Table Access
```typescript
// DON'T DO THIS
const { data } = await supabase
  .from('core_entities')
  .insert({ entity_type: 'test', ... })
```

### ✅ Correct: Use RPC
```typescript
// DO THIS
const result = await callRPC('hera_entity_upsert_v1', {
  p_organization_id: orgId,
  p_entity_type: 'test',
  ...
})
```

### ❌ Wrong: Business Data in Metadata
```typescript
// DON'T DO THIS
{
  p_metadata: {
    color: '#8B5CF6',
    price: 99.99
  }
}
```

### ✅ Correct: Use Dynamic Data
```typescript
// DO THIS
await callRPC('hera_dynamic_data_batch_v1', {
  p_fields: [
    { field_name: 'color', field_type: 'text', field_value: '#8B5CF6' },
    { field_name: 'price', field_type: 'number', field_value_number: 99.99 }
  ]
})
```

### ❌ Wrong: Status Columns
```typescript
// DON'T DO THIS
UPDATE core_entities SET status = 'approved'
```

### ✅ Correct: Status Relationships
```typescript
// DO THIS
await callRPC('hera_relationship_create_v1', {
  p_from_entity_id: entityId,
  p_to_entity_id: approvedStatusId,
  p_relationship_type: 'has_status'
})
```

---

## 📊 Success Metrics

**Production Validated**: 2025-10-01
- Product category creation: ✅ 100% success
- Entity + dynamic data: ✅ Two-step pattern working
- Smart code validation: ✅ All formats correct
- RPC parameter matching: ✅ All functions working

**Coverage**:
- 15+ RPC functions documented
- 30+ common errors solved
- 50+ smart code examples
- 100+ code samples

---

## 🔄 DNA Evolution

This DNA documentation evolves with HERA:

### When to Update
- Adding new RPC functions
- Discovering new patterns
- Fixing common issues
- Validating in production

### How to Update
1. Update relevant DNA document
2. Add to cheat sheet if commonly used
3. Update CLAUDE.md quick reference
4. Increment DNA version
5. Add validation date and method

### Version History
- V1 (2025-10-01): Initial RPC patterns documentation
  - Validated: Product category creation end-to-end
  - Coverage: Entity, dynamic data, relationships, transactions

---

## 💡 Tips for Success

1. **Always start with test scripts** - Verify deployed functions before coding
2. **Use minimal parameters first** - Add optional params incrementally
3. **Validate smart codes early** - Prevents runtime errors
4. **Check actual schema** - Don't assume columns exist
5. **Follow two-step pattern** - Entity first, then dynamic data
6. **Handle errors properly** - Check both data and error in results
7. **Reference cheat sheet** - Keep it open during development
8. **Test in production mode** - Service role might behave differently

---

## 📞 Support

- **Documentation Issues**: Update this DNA folder
- **RPC Bugs**: Check debugging guide first
- **New Patterns**: Add to patterns document
- **Questions**: Reference cheat sheet

---

**HERA DNA Version**: V1
**Last Updated**: 2025-10-01
**Maintained By**: HERA Core Team
**Status**: ✅ Production Ready
