# HERA Data Deletion Governance

**Smart Code**: `HERA.DATA.GOVERNANCE.DELETE.v1`  
**Last Updated**: 2025-10-12  
**Status**: Production Standard

## Overview

In HERA, deletion is handled as a governed lifecycle process, not a blunt "DROP rows" operation. This ensures all related data is accounted for while preserving auditability and compliance requirements.

## Core Principles

1. **Audit Trail Preservation**: Universal transactions (UT/UTL) are immutable and never deleted
2. **Referential Integrity**: Ensure deletion doesn't break business relationships
3. **Compliance Ready**: Support GDPR, CCPA, and other data privacy regulations
4. **Reversible by Default**: Soft delete is the standard approach
5. **Single Entry Point**: All deletions go through governed RPC functions

## Deletion Models

### 1. Archive (Soft Delete) - DEFAULT ✅

**When to Use**: Default for all entity deletions

**Behavior**:
- Keep the row in place
- Set `status='archived'`
- Add `deleted_at` timestamp to metadata
- Set related relationships `is_active=false`
- Entity remains queryable with `status=archived` filter

**Benefits**:
- Safe and reversible
- Audit-friendly
- Maintains referential integrity
- No cascading data loss

```sql
-- Example soft delete
UPDATE core_entities 
SET status = 'archived',
    metadata = coalesce(metadata,'{}'::jsonb) || jsonb_build_object('deleted_at', now())
WHERE id = entity_id AND organization_id = org_id;
```

### 2. Hard Delete - GUARDED ⚠️

**When to Use**: Only for pure reference/master data with no transactional references

**Behavior**:
- Physically remove the entity
- Cascade to dynamic fields and relationships
- **BLOCKED** if any posted universal transactions reference the entity
- Suggests redaction instead if blocked

**Safeguards**:
- Pre-check for transactional references
- Enforce via RPC (cannot bypass)
- Complete audit logging

```sql
-- Pre-check before hard delete
SELECT count(*) FROM universal_transaction_lines utl
WHERE utl.organization_id = p_organization_id
  AND (utl.details ? 'entity_id' AND utl.details->>'entity_id' = p_entity_id::text);
```

### 3. Erasure/Redaction - COMPLIANCE 🛡️

**When to Use**: Law/policy mandates PII removal but transactions must remain

**Behavior**:
- Redact PII fields (set to null/hashed)
- Keep entity shell for referential integrity
- Preserve all transactional data
- Log the redaction action

**Use Cases**:
- GDPR "Right to be Forgotten"
- CCPA data deletion requests
- Internal data retention policies

```sql
-- Example PII redaction
UPDATE core_dynamic_data
SET field_value = to_jsonb(null)
WHERE entity_id = p_entity_id
  AND smart_code = ANY(p_redact_smart_codes);
```

## Referential Integrity (Database Level)

### Safe Cascade Constraints

These can be applied immediately as they maintain data integrity:

```sql
-- Dynamic data belongs to entity → safe to cascade
ALTER TABLE core_dynamic_data
ADD CONSTRAINT fk_cdd_entity
FOREIGN KEY (entity_id) REFERENCES core_entities(id)
ON DELETE CASCADE;

-- Relationships point to entities → cascade removes edges
ALTER TABLE core_relationships
ADD CONSTRAINT fk_cr_from_entity
FOREIGN KEY (from_entity_id) REFERENCES core_entities(id)
ON DELETE CASCADE;

ALTER TABLE core_relationships
ADD CONSTRAINT fk_cr_to_entity
FOREIGN KEY (to_entity_id) REFERENCES core_entities(id)
ON DELETE CASCADE;
```

**Why Safe**: Dynamic fields and relationship edges have no independent business identity. If the node goes, its leaves/edges can safely go too.

### Protected Audit Trail

```sql
-- NO CASCADE from UT/UTL - these are immutable
-- Transaction lines must outlive entities they reference
-- Hard delete prevention enforced in RPC layer
```

**Why Protected**: UT/UTL represent the permanent accounting record with balancing guarantees. We never drop them—we close/reverse instead.

## Governed Entry Point (RPC)

### Primary Deletion Function

```sql
CREATE OR REPLACE FUNCTION hera_entity_delete_v2(
  p_organization_id uuid,
  p_entity_id uuid,
  p_mode text DEFAULT 'SOFT',     -- 'SOFT' | 'HARD' | 'ERASURE'
  p_redact_smart_codes text[] DEFAULT NULL  -- optional whitelist of PII fields
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_refs int;
  v_audit_txn_id uuid;
BEGIN
  -- 1) Pre-check: count transactional references
  SELECT count(*) INTO v_refs
  FROM universal_transaction_lines utl
  WHERE utl.organization_id = p_organization_id
    AND (utl.details ? 'entity_id' AND utl.details->>'entity_id' = p_entity_id::text);

  -- 2) Log intent (audit trail)
  INSERT INTO universal_transactions(
    organization_id, 
    transaction_type, 
    transaction_status, 
    smart_code,
    metadata
  )
  VALUES (
    p_organization_id, 
    'data_governance', 
    'processing',
    'HERA.DATA.DELETE.INTENT.v1',
    jsonb_build_object(
      'entity_id', p_entity_id, 
      'mode', p_mode, 
      'refs_found', v_refs,
      'initiated_at', now()
    )
  )
  RETURNING id INTO v_audit_txn_id;

  -- 3) Execute based on mode
  IF p_mode = 'SOFT' THEN
    -- Soft delete: archive and deactivate relationships
    UPDATE core_entities
    SET status = 'archived',
        metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object(
          'deleted_at', now(),
          'deletion_mode', 'soft',
          'audit_txn_id', v_audit_txn_id
        )
    WHERE id = p_entity_id AND organization_id = p_organization_id;

    UPDATE core_relationships
    SET is_active = false,
        metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object(
          'deactivated_at', now(),
          'reason', 'entity_archived'
        )
    WHERE (from_entity_id = p_entity_id OR to_entity_id = p_entity_id)
      AND organization_id = p_organization_id;

  ELSIF p_mode = 'ERASURE' THEN
    -- Redact PII while preserving structure
    UPDATE core_dynamic_data
    SET field_value_text = CASE 
          WHEN field_type = 'text' THEN 'REDACTED'
          ELSE field_value_text 
        END,
        field_value_json = CASE 
          WHEN field_type = 'json' THEN to_jsonb('REDACTED'::text)
          ELSE field_value_json 
        END,
        metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object(
          'redacted_at', now(),
          'audit_txn_id', v_audit_txn_id
        )
    WHERE entity_id = p_entity_id
      AND organization_id = p_organization_id
      AND (p_redact_smart_codes IS NULL OR smart_code = ANY(p_redact_smart_codes));

    UPDATE core_entities
    SET entity_name = 'REDACTED',
        metadata = COALESCE(metadata,'{}'::jsonb) || jsonb_build_object(
          'redacted_at', now(),
          'deletion_mode', 'erasure',
          'audit_txn_id', v_audit_txn_id
        )
    WHERE id = p_entity_id AND organization_id = p_organization_id;

  ELSIF p_mode = 'HARD' THEN
    -- Hard delete with safety check
    IF v_refs > 0 THEN
      RAISE EXCEPTION 'Cannot hard delete: entity has % transactional references. Use ERASURE mode instead.', v_refs;
    END IF;
    
    -- FK cascades will handle dynamic_data and relationships
    DELETE FROM core_entities
    WHERE id = p_entity_id AND organization_id = p_organization_id;

  ELSE
    RAISE EXCEPTION 'Unknown deletion mode: %. Valid modes: SOFT, HARD, ERASURE', p_mode;
  END IF;

  -- 4) Log successful completion
  UPDATE universal_transactions
  SET transaction_status = 'completed',
      metadata = metadata || jsonb_build_object(
        'completed_at', now(),
        'entities_affected', 1,
        'refs_checked', v_refs
      )
  WHERE id = v_audit_txn_id;

  RETURN jsonb_build_object(
    'success', true, 
    'mode', p_mode, 
    'audit_txn_id', v_audit_txn_id,
    'refs_checked', v_refs
  );
END;
$$;
```

### Why This RPC Approach

1. **Single Contract**: All API endpoints call this RPC—rules are centralized
2. **Auditability**: Every deletion attempt is recorded as a universal transaction
3. **Safety**: Hard delete is blocked if it would break the audit trail
4. **Flexibility**: Supports all three deletion modes with appropriate safeguards

## API Endpoints

### Standard Deletion
```typescript
// Soft delete (default)
DELETE /api/v2/entities/:id
// Query: ?mode=soft (default)

// Hard delete (guarded)
DELETE /api/v2/entities/:id?mode=hard

// Returns: { success: boolean, mode: string, audit_txn_id: string }
```

### Compliance Erasure
```typescript
// PII redaction
POST /api/v2/entities/:id/erasure
{
  "smart_codes": ["HERA.CRM.CUST.PII.EMAIL.v1", "HERA.CRM.CUST.PII.PHONE.v1"]
}

// Returns: { success: boolean, fields_redacted: number, audit_txn_id: string }
```

### Implementation Example
```typescript
// /src/app/api/v2/entities/[id]/route.ts
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('mode') || 'SOFT'
  
  const result = await callRPC('hera_entity_delete_v2', {
    p_organization_id: organizationId,
    p_entity_id: params.id,
    p_mode: mode.toUpperCase()
  })
  
  return NextResponse.json(result.data)
}
```

## Frontend Patterns

### Delete Confirmation Dialog
```typescript
const handleDelete = async (entityId: string, mode: 'soft' | 'hard' | 'erasure') => {
  try {
    const response = await apiV2.delete(`entities/${entityId}`, {
      params: { mode }
    })
    
    // Show success message
    toast.success(`Entity ${mode} deleted successfully`)
    
    // Refresh data
    refetch()
  } catch (error) {
    if (error.message.includes('transactional references')) {
      // Suggest erasure instead
      setShowErasureOption(true)
    }
    toast.error(error.message)
  }
}
```

### Activity Log Component
```typescript
// Show deletion audit trail
const { data: auditLogs } = useQuery({
  queryKey: ['audit', 'deletions', organizationId],
  queryFn: () => apiV2.get('audit/transactions', {
    params: {
      transaction_type: 'data_governance',
      smart_code_like: 'HERA.DATA.DELETE%'
    }
  })
})
```

## CI/CD Guardrails

### Code Linting Rules
```typescript
// Prevent direct database deletion in app code
// Only allow RPC calls for entity deletion

// ❌ NOT ALLOWED
await supabase.from('core_entities').delete().eq('id', entityId)

// ✅ ALLOWED
await callRPC('hera_entity_delete_v2', { 
  p_entity_id: entityId, 
  p_mode: 'SOFT' 
})
```

### Contract Tests
```typescript
describe('Entity Deletion Governance', () => {
  test('soft delete preserves entity but marks archived', async () => {
    const result = await hera_entity_delete_v2(orgId, entityId, 'SOFT')
    expect(result.success).toBe(true)
    
    const entity = await getEntity(entityId)
    expect(entity.status).toBe('archived')
    expect(entity.metadata.deleted_at).toBeDefined()
  })

  test('hard delete blocked when transactional references exist', async () => {
    // Create entity with transaction reference
    await createTransactionReferencingEntity(entityId)
    
    await expect(
      hera_entity_delete_v2(orgId, entityId, 'HARD')
    ).rejects.toThrow('transactional references')
  })

  test('erasure redacts only specified smart codes', async () => {
    const result = await hera_entity_delete_v2(
      orgId, 
      entityId, 
      'ERASURE',
      ['HERA.CRM.CUST.PII.EMAIL.v1']
    )
    
    const emailField = await getDynamicField(entityId, 'email')
    expect(emailField.field_value_text).toBe('REDACTED')
    
    const nameField = await getDynamicField(entityId, 'name')
    expect(nameField.field_value_text).not.toBe('REDACTED')
  })
})
```

## Default Policies

### Production Recommendations

1. **Default Mode**: `SOFT` for all entity deletions
2. **Hard Delete**: Allow only for pure reference/master data when `v_refs=0`
3. **Erasure**: Primary path for GDPR/PII compliance—redact PII smart codes while keeping financial truth
4. **Audit Retention**: Keep deletion audit logs for minimum 7 years
5. **User Permissions**: Require elevated permissions for `HARD` and `ERASURE` modes

### Smart Code Patterns
```typescript
// Deletion audit trail smart codes
'HERA.DATA.DELETE.INTENT.v1'    // Deletion initiated
'HERA.DATA.DELETE.COMMIT.v1'    // Deletion completed
'HERA.DATA.DELETE.BLOCKED.v1'   // Deletion blocked due to references
'HERA.DATA.ERASURE.PII.v1'      // PII redaction completed
```

## Implementation Files

Ready-to-deploy implementation includes:

- **Database**: `/database/functions/governance/delete-governance.sql`
- **API Routes**: 
  - `/src/app/api/v2/entities/[id]/route.ts` (DELETE method)
  - `/src/app/api/v2/entities/[id]/erasure/route.ts` (POST method)
- **Frontend**: `/src/components/ui/DeleteEntityDialog.tsx`
- **Tests**: `/tests/governance/entity-deletion.test.ts`
- **Hooks**: `/src/hooks/useEntityDeletion.ts`

## Compliance Notes

### GDPR Compliance
- **Right to Erasure**: Use `ERASURE` mode with PII smart codes
- **Audit Trail**: Complete deletion logs maintained
- **Data Minimization**: Soft delete by default reduces data exposure

### SOX Compliance
- **Immutable Audit Trail**: UT/UTL never deleted
- **Authorization Controls**: RPC enforces proper permissions
- **Change Logging**: All deletions create audit transactions

### Industry Standards
- **Healthcare (HIPAA)**: PII redaction preserves medical record integrity
- **Financial (SOX)**: Transaction history preservation mandatory
- **Retail (PCI)**: Card data redaction with order history retention

---

**Implementation Priority**: High  
**Next Review**: 2025-04-12  
**Owner**: HERA Data Governance Team