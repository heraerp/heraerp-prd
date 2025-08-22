# 🛡️ SACRED RULES - NEVER VIOLATE

## ⚡ THE SUPREME LAW OF HERA

### 🔴 RULE #1: THE 6 TABLES ARE SACRED
```sql
-- THESE ARE THE ONLY TABLES. PERIOD.
1. core_organizations
2. core_entities  
3. core_dynamic_data
4. core_relationships
5. universal_transactions
6. universal_transaction_lines

-- NEVER CREATE NEW TABLES
-- NEVER ADD COLUMNS
-- NEVER MODIFY SCHEMA
```

### 🔴 RULE #2: NO DUMMY DATA - EVER
```typescript
// ❌ INSTANT DEATH - NEVER DO THIS
const dummyData = [
  { id: 1, name: 'Test Client' },
  { id: 2, name: 'Sample Data' }
]

// ✅ ONLY THIS IS ACCEPTABLE
const data = await fetch(`/api/v1/module/data?organization_id=${orgId}`)
```

### 🔴 RULE #3: NO STATUS COLUMNS - USE RELATIONSHIPS
```typescript
// ❌ FORBIDDEN - VIOLATES UNIVERSAL LAW
ALTER TABLE core_entities ADD COLUMN status VARCHAR(50);

// ✅ SACRED PATTERN
{
  table: 'core_relationships',
  from_entity_id: entity.id,
  to_entity_id: status_entity.id,
  relationship_type: 'has_status'
}
```

### 🔴 RULE #4: ORGANIZATION_ID IS SACRED
```typescript
// EVERY query MUST include organization_id
// NO EXCEPTIONS. NO EXCUSES.

// ❌ SECURITY BREACH
.select('*')
.eq('entity_type', 'customer')

// ✅ SACRED ISOLATION
.select('*')
.eq('organization_id', organizationId)  // MANDATORY
.eq('entity_type', 'customer')
```

### 🔴 RULE #5: METADATA FOR ALL CUSTOM FIELDS
```typescript
// ❌ NEVER ADD COLUMNS
ALTER TABLE core_entities ADD COLUMN phone VARCHAR(50);

// ✅ ALWAYS USE METADATA
{
  metadata: {
    phone: '+971501234567',
    email: 'customer@example.com',
    anything: 'any value'
  }
}
```

## 🚨 VIOLATION CONSEQUENCES

### If You Violate These Rules:
1. **The system breaks** - Multi-tenancy fails
2. **Data leaks** - Organizations see each other's data  
3. **Migrations hell** - Back to traditional ERP nightmare
4. **AI fails** - Machine learning can't work
5. **Universal APIs break** - Nothing works anymore

## ✅ THE SACRED PATTERNS

### Creating ANY Business Object
```typescript
// ALWAYS THIS PATTERN - NO EXCEPTIONS
await supabase
  .from('core_entities')
  .insert({
    organization_id: organizationId,    // MANDATORY
    entity_type: 'anything',           // customer, product, event, ANYTHING
    entity_name: 'Display Name',
    entity_code: `UNIQUE-${Date.now()}`,
    status: 'active',
    smart_code: 'HERA.MODULE.TYPE.v1',
    metadata: {
      // ALL custom fields here
      // UNLIMITED fields
      // ANY data type
    }
  })
```

### Creating ANY Transaction
```typescript
// ALWAYS THIS PATTERN - NO EXCEPTIONS
await supabase
  .from('universal_transactions')
  .insert({
    organization_id: organizationId,    // MANDATORY
    transaction_type: 'anything',      // sale, appointment, transfer, ANYTHING
    transaction_code: `TXN-${Date.now()}`,
    transaction_date: new Date().toISOString(),
    from_entity_id: source.id,
    to_entity_id: target.id,
    total_amount: amount,
    smart_code: 'HERA.MODULE.TXN.v1',
    metadata: {
      // Transaction details
    }
  })
```

### Adding Custom Fields
```typescript
// NEVER modify schema - ALWAYS use dynamic data
await supabase
  .from('core_dynamic_data')
  .insert({
    organization_id: organizationId,    // MANDATORY
    entity_id: entity.id,
    field_name: 'any_field_name',
    field_value_text: 'any value',
    // OR field_value_number
    // OR field_value_date
    // OR field_value_json
    smart_code: 'HERA.MODULE.FIELD.v1'
  })
```

### Creating Relationships
```typescript
// Workflows, hierarchies, associations - ALL use this
await supabase
  .from('core_relationships')
  .insert({
    organization_id: organizationId,    // MANDATORY
    from_entity_id: entity1.id,
    to_entity_id: entity2.id,
    relationship_type: 'any_relationship',
    smart_code: 'HERA.MODULE.REL.v1',
    metadata: {
      // Relationship details
    }
  })
```

## 🔥 ENFORCEMENT CHECKLIST

Before EVERY commit, verify:

- [ ] **NO new tables created**
- [ ] **NO columns added to existing tables**
- [ ] **NO dummy data anywhere**
- [ ] **ALL queries include organization_id**
- [ ] **NO status columns - using relationships**
- [ ] **ALL custom fields in metadata**
- [ ] **ALL APIs fetch from database**
- [ ] **Smart codes on everything**

## 📜 THE OATH

```
I solemnly swear to:
- NEVER create new tables
- NEVER add columns  
- NEVER use dummy data
- ALWAYS include organization_id
- ALWAYS use the 6 sacred tables
- ALWAYS store custom fields in metadata
- ALWAYS use relationships for status
- ALWAYS fetch from APIs

The 6 tables are SACRED.
The patterns are IMMUTABLE.
The rules are ABSOLUTE.
```

## 🎯 QUICK REFERENCE - WHAT GOES WHERE

| Need | Table | How |
|------|-------|-----|
| New business object | core_entities | entity_type = 'your_type' |
| Custom fields | metadata or core_dynamic_data | metadata: { field: value } |
| Status/Workflow | core_relationships | relationship_type = 'has_status' |
| Business event | universal_transactions | transaction_type = 'your_event' |
| Event details | universal_transaction_lines | Line items with quantities |
| Hierarchies | core_relationships | relationship_type = 'parent_of' |
| Associations | core_relationships | relationship_type = 'related_to' |
| User preferences | core_dynamic_data | field_name = 'preference_name' |
| Settings | core_entities | entity_type = 'settings' |
| Documents | core_entities | entity_type = 'document' |

## ⚠️ FINAL WARNING

**These rules are NOT suggestions. They are ABSOLUTE LAW.**

Violating them doesn't just break your feature - it breaks the entire universal architecture that makes HERA revolutionary.

**NEVER FORGET: 6 TABLES. NO DUMMY DATA. ORGANIZATION ISOLATION.**

---

*This document is the constitution of HERA. It cannot be amended. It cannot be violated. It is eternal.*