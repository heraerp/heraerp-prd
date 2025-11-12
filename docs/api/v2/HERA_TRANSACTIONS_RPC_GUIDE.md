# HERA V2 Transaction RPC Functions - Technical Reference

**Database-Level Transaction Operations**
Complete reference for all PostgreSQL RPC functions supporting HERA V2 transaction operations.

---

## 🎯 Overview

HERA V2 Transaction RPC functions provide database-level transaction management with:
- **Multi-tenant security** via organization_id isolation
- **Smart code validation** on all operations
- **Complete audit trails** with actor stamping
- **GL balance validation** for accounting transactions
- **Immutable event-sourced architecture** for financial compliance
- **Derived DR/CR handling** via helper functions (no physical columns)

---

## 📋 Transaction Functions

### `hera_txn_crud_v1` ⭐ ORCHESTRATOR - PRODUCTION READY
**Status**: ✅ Ready for Deployment (Pending: `hera_txn_create_v1` with helper functions)
**Performance**: ⚡ Sub-100ms response time
**Purpose**: Universal transaction CRUD orchestrator - Single atomic call for all transaction operations

#### Overview
The orchestrator RPC provides a unified interface for all transaction operations with zero-mutation pass-through, comprehensive error diagnostics, and automatic audit trail support.

**Key Benefits:**
- **Single Entry Point**: One function for CREATE/READ/UPDATE/DELETE/QUERY/EMIT/REVERSE/VOID/VALIDATE
- **Zero-Mutation Guarantee**: Direct JSONB pass-through prevents data loss
- **Enhanced Diagnostics**: Stacked error context with detail/hint/context
- **Audit Trail Support**: `include_deleted` parameter for voided transactions
- **Sacred Boundary**: Organization isolation enforced at every operation

#### Function Signature
```sql
CREATE OR REPLACE FUNCTION hera_txn_crud_v1(
  p_action            text,          -- 'CREATE' | 'READ' | 'UPDATE' | 'DELETE' | 'QUERY' | 'EMIT' | 'REVERSE' | 'VOID' | 'VALIDATE'
  p_actor_user_id     uuid,          -- WHO is making the change (required)
  p_organization_id   uuid,          -- WHERE (tenant boundary - required)
  p_payload           jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
```

#### Parameters

##### `p_action` (required)
Operation type:
- `CREATE` - Create new transaction with header and lines
- `READ` - Read transaction with optional voided inclusion
- `UPDATE` - Update transaction fields (patch-based)
- `DELETE` - Delete empty draft transactions only (HARD delete)
- `QUERY` - Query transactions with filters and pagination
- `EMIT` - Create event-based transaction (header only)
- `REVERSE` - Create reversal transaction (immutable correction)
- `VOID` - Mark transaction as voided (soft delete with audit)
- `VALIDATE` - Validate transaction against business rules

##### `p_actor_user_id` (required)
User entity UUID performing the operation. Used for audit trail (`created_by`, `updated_by`).

##### `p_organization_id` (required)
Organization UUID for multi-tenant isolation. Sacred boundary enforcement.

##### `p_payload` (object)
Action-specific payload:

**CREATE Payload:**
```typescript
{
  header: {
    organization_id: string,           // Required - Must match p_organization_id
    transaction_type: string,          // Required - 'SALE', 'APPOINTMENT', 'PAYMENT', etc.
    transaction_code?: string,         // Optional - Auto-generated if omitted
    smart_code: string,               // Required - HERA DNA pattern
    transaction_date?: string,         // Optional - ISO 8601, defaults to now()
    source_entity_id?: string,         // Optional - Customer/vendor UUID
    target_entity_id?: string,         // Optional - Staff/location UUID
    total_amount?: number,             // Optional - Transaction total, defaults to 0
    transaction_status?: string,       // Optional - 'draft', 'pending', 'completed', etc.
    reference_number?: string,         // Optional - External reference
    external_reference?: string,       // Optional - Third-party reference
    business_context?: object,         // Optional - JSONB business metadata
    metadata?: object,                 // Optional - JSONB system metadata
    approval_required?: boolean,       // Optional - Requires approval flag
    approved_by?: string,              // Optional - Approver user UUID
    approved_at?: string,              // Optional - Approval timestamp
    transaction_currency_code?: string, // Optional - ISO 4217 code (e.g., 'USD')
    base_currency_code?: string,       // Optional - Base currency for multi-currency
    exchange_rate?: number,            // Optional - Currency conversion rate
    exchange_rate_date?: string,       // Optional - Rate effective date
    exchange_rate_type?: string,       // Optional - Rate type (spot, average, etc.)
    fiscal_year?: number,              // Optional - Fiscal year
    fiscal_period?: number,            // Optional - Fiscal period (1-12)
    fiscal_period_entity_id?: string,  // Optional - Fiscal period entity link
    posting_period_code?: string       // Optional - Posting period identifier
  },
  lines: [                            // Optional - Transaction lines
    {
      line_number: number,            // Required - Line sequence (1, 2, 3...)
      line_type: string,              // Required - 'service', 'product', 'tax', 'discount', 'gl'
      description?: string,           // Optional - Line description
      quantity?: number,              // Optional - Defaults to 1
      unit_amount?: number,           // Optional - Price per unit, defaults to 0
      line_amount?: number,           // Optional - Line total, defaults to 0
      discount_amount?: number,       // Optional - Discount applied, defaults to 0
      tax_amount?: number,            // Optional - Tax amount, defaults to 0
      entity_id?: string,             // Optional - Related entity (product/service UUID)
      smart_code?: string,            // Optional - Line-level HERA DNA
      smart_code_status?: string,     // Optional - Defaults to 'DRAFT'
      ai_confidence?: number,         // Optional - AI confidence score
      ai_classification?: string,     // Optional - AI category
      ai_insights?: object,           // Optional - JSONB AI metadata
      line_data?: object              // Optional - JSONB line-specific data
                                      // For GL lines, MUST include: { side: 'DR' | 'CR' }
    }
  ],
  include_deleted?: boolean           // Optional - Include voided transactions (audit mode)
}
```

**READ Payload:**
```typescript
{
  transaction_id: string,             // Required - Transaction UUID to read
  include_deleted?: boolean           // Optional - Include voided transactions (default: false)
}
```

**QUERY Payload:**
```typescript
{
  filters: {
    transaction_type?: string,        // Optional - Filter by type
    transaction_status?: string,      // Optional - Filter by status
    limit?: number,                   // Optional - Max results (default: 100)
    offset?: number,                  // Optional - Pagination offset (default: 0)
    include_deleted?: boolean         // Optional - Include voided (default: false)
  }
}
```

**UPDATE Payload:**
```typescript
{
  transaction_id: string,             // Required - Transaction UUID to update
  patch: {                            // Required - Fields to update
    transaction_status?: string,
    total_amount?: number,
    // ... any header fields to update
  },
  include_deleted?: boolean           // Optional - For reading after update
}
```

**DELETE Payload:**
```typescript
{
  transaction_id: string              // Required - Transaction UUID to delete
}
```

**VOID Payload:**
```typescript
{
  transaction_id: string,             // Required - Transaction UUID to void
  reason?: string,                    // Optional - Void reason
  include_deleted?: boolean           // Optional - For reading after void
}
```

**REVERSE Payload:**
```typescript
{
  transaction_id: string,             // Required - Original transaction UUID
  reversal_date?: string,             // Optional - ISO 8601, defaults to now()
  reason?: string,                    // Optional - Reversal reason
  include_deleted?: boolean           // Optional - For reading after reversal
}
```

**VALIDATE Payload:**
```typescript
{
  transaction_id: string              // Required - Transaction UUID to validate
}
```

#### Usage Examples

##### CREATE - Transaction with Lines
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Create sale transaction with service lines
const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: actorUserId,
  p_organization_id: organizationId,
  p_payload: {
    header: {
      organization_id: organizationId,
      transaction_type: 'SALE',
      transaction_code: 'SALE-2025-001',
      smart_code: 'HERA.SALON.SALE.TXN.RETAIL.V1',
      transaction_date: '2025-10-23T14:30:00Z',
      source_entity_id: customerId,
      target_entity_id: staffId,
      total_amount: 150,
      transaction_status: 'completed',
      transaction_currency_code: 'USD'
    },
    lines: [
      {
        line_number: 1,
        line_type: 'service',
        description: 'Haircut',
        quantity: 1,
        unit_amount: 50,
        line_amount: 50,
        entity_id: serviceId,
        smart_code: 'HERA.SALON.SERVICE.LINE.HAIRCUT.V1'
      },
      {
        line_number: 2,
        line_type: 'service',
        description: 'Hair Coloring',
        quantity: 1,
        unit_amount: 100,
        line_amount: 100,
        entity_id: serviceId2,
        smart_code: 'HERA.SALON.SERVICE.LINE.COLORING.V1'
      }
    ]
  }
});

console.log('Created transaction:', data.transaction_id);
```

##### CREATE - GL Transaction (Accounting)
```javascript
// Create journal entry with balanced DR/CR
const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: accountantId,
  p_organization_id: organizationId,
  p_payload: {
    header: {
      organization_id: organizationId,
      transaction_type: 'JOURNAL',
      smart_code: 'HERA.FIN.GL.TXN.JOURNAL.ENTRY.V1',
      total_amount: 0,
      transaction_status: 'posted'
    },
    lines: [
      {
        line_number: 1,
        line_type: 'gl',
        description: 'Cash received',
        line_amount: 1000,
        smart_code: 'HERA.FIN.GL.LINE.ACCOUNT.V1',
        line_data: {
          side: 'DR',              // REQUIRED for GL lines
          account: '110000',        // Cash account
          cost_center: 'CC001'
        }
      },
      {
        line_number: 2,
        line_type: 'gl',
        description: 'Revenue earned',
        line_amount: 1000,
        smart_code: 'HERA.FIN.GL.LINE.ACCOUNT.V1',
        line_data: {
          side: 'CR',              // REQUIRED for GL lines
          account: '410000',        // Revenue account
          cost_center: 'CC001'
        }
      }
    ]
  }
});

// Function automatically validates: DR total = CR total
```

##### READ - Single Transaction
```javascript
const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'READ',
  p_actor_user_id: actorUserId,
  p_organization_id: organizationId,
  p_payload: {
    transaction_id: transactionId,
    include_deleted: false  // Exclude voided transactions
  }
});

// Response includes full header (35 fields) + lines (21 fields each)
console.log('Transaction:', data.data.data.header);
console.log('Lines:', data.data.data.lines);
```

##### QUERY - List Transactions
```javascript
// Query recent sales with pagination
const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'QUERY',
  p_actor_user_id: actorUserId,
  p_organization_id: organizationId,
  p_payload: {
    filters: {
      transaction_type: 'SALE',
      transaction_status: 'completed',
      limit: 50,
      offset: 0,
      include_deleted: false
    }
  }
});

// Response: Lightweight list with 8 fields per transaction
console.log('Transactions:', data.data.data.items);
```

##### VOID - Cancel Transaction (Soft Delete)
```javascript
// Void transaction with reason (preserves audit trail)
const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'VOID',
  p_actor_user_id: actorUserId,
  p_organization_id: organizationId,
  p_payload: {
    transaction_id: transactionId,
    reason: 'Customer cancellation',
    include_deleted: true  // Return voided transaction
  }
});

// Status changed to 'voided', record preserved
console.log('Voided status:', data.data.data.header.transaction_status);
```

##### VOID - Audit Trail Verification
```javascript
// Step 1: Void transaction
await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'VOID',
  p_actor_user_id: actorUserId,
  p_organization_id: organizationId,
  p_payload: {
    transaction_id: txnId,
    reason: 'Test void'
  }
});

// Step 2: Verify excluded in normal mode
const normalRead = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'READ',
  p_actor_user_id: actorUserId,
  p_organization_id: organizationId,
  p_payload: {
    transaction_id: txnId,
    include_deleted: false
  }
});
// Result: { success: false, error: 'Transaction not found' }

// Step 3: Verify included in audit mode
const auditRead = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'READ',
  p_actor_user_id: actorUserId,
  p_organization_id: organizationId,
  p_payload: {
    transaction_id: txnId,
    include_deleted: true  // AUDIT MODE
  }
});
// Result: { success: true, data: { header: { transaction_status: 'voided' } } }
```

##### DELETE - Remove Draft Transaction (HARD Delete)
```javascript
// Delete empty draft (permanent removal)
const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'DELETE',
  p_actor_user_id: actorUserId,
  p_organization_id: organizationId,
  p_payload: {
    transaction_id: draftId
  }
});

// Only works for: status='draft' AND total_amount=0 AND no lines
// Completed transactions must use VOID or REVERSE
```

##### UPDATE - Patch Transaction
```javascript
// Update transaction status
const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'UPDATE',
  p_actor_user_id: actorUserId,
  p_organization_id: organizationId,
  p_payload: {
    transaction_id: transactionId,
    patch: {
      transaction_status: 'approved',
      approved_by: approverId,
      approved_at: new Date().toISOString()
    }
  }
});
```

##### REVERSE - Create Reversal Transaction
```javascript
// Create reversal for accounting correction
const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'REVERSE',
  p_actor_user_id: actorUserId,
  p_organization_id: organizationId,
  p_payload: {
    transaction_id: originalTxnId,
    reversal_date: '2025-10-23T16:00:00Z',
    reason: 'Correction: duplicate entry'
  }
});

// Creates new transaction with:
// - All amounts negated
// - DR/CR sides flipped (for GL)
// - Links to original via metadata
```

#### Response Structures

##### CREATE Response
```json
{
  "success": true,
  "action": "CREATE",
  "transaction_id": "txn-uuid",
  "data": {
    "success": true,
    "action": "READ",
    "transaction_id": "txn-uuid",
    "data": {
      "header": {
        "id": "txn-uuid",
        "organization_id": "org-uuid",
        "transaction_type": "SALE",
        "transaction_code": "SALE-2025-001",
        "transaction_date": "2025-10-23T14:30:00Z",
        "source_entity_id": "customer-uuid",
        "target_entity_id": "staff-uuid",
        "total_amount": 150,
        "transaction_status": "completed",
        "smart_code": "HERA.SALON.SALE.TXN.RETAIL.V1",
        "smart_code_status": "DRAFT",
        "transaction_currency_code": "USD",
        "created_at": "2025-10-23T14:30:00Z",
        "updated_at": "2025-10-23T14:30:00Z",
        "created_by": "actor-uuid",
        "updated_by": "actor-uuid",
        "version": 1
        // ... 35 total header fields
      },
      "lines": [
        {
          "id": "line-uuid-1",
          "line_number": 1,
          "line_type": "service",
          "description": "Haircut",
          "quantity": 1,
          "unit_amount": 50,
          "line_amount": 50,
          "discount_amount": 0,
          "tax_amount": 0,
          "entity_id": "service-uuid",
          "smart_code": "HERA.SALON.SERVICE.LINE.HAIRCUT.V1",
          "created_at": "2025-10-23T14:30:00Z",
          "updated_at": "2025-10-23T14:30:00Z",
          "created_by": "actor-uuid",
          "updated_by": "actor-uuid",
          "version": 1
          // ... 21 total line fields
        }
      ]
    }
  }
}
```

##### READ Response
```json
{
  "success": true,
  "action": "READ",
  "transaction_id": "txn-uuid",
  "data": {
    "success": true,
    "action": "READ",
    "transaction_id": "txn-uuid",
    "data": {
      "header": { /* 35 header fields */ },
      "lines": [ /* array of lines with 21 fields each */ ]
    }
  }
}
```

##### QUERY Response
```json
{
  "success": true,
  "action": "QUERY",
  "transaction_id": null,
  "data": {
    "success": true,
    "action": "QUERY",
    "data": {
      "items": [
        {
          "id": "txn-uuid",
          "organization_id": "org-uuid",
          "transaction_type": "SALE",
          "transaction_code": "SALE-2025-001",
          "transaction_date": "2025-10-23T14:30:00Z",
          "total_amount": 150,
          "transaction_status": "completed",
          "smart_code": "HERA.SALON.SALE.TXN.RETAIL.V1"
          // 8 lightweight fields for performance
        }
      ],
      "limit": 50,
      "offset": 0
    }
  }
}
```

##### VOID Response
```json
{
  "success": true,
  "action": "VOID",
  "transaction_id": "txn-uuid",
  "data": {
    "success": true,
    "action": "READ",
    "transaction_id": "txn-uuid",
    "data": {
      "header": {
        "id": "txn-uuid",
        "transaction_status": "voided",
        // ... rest of header fields
      },
      "lines": [ /* preserved lines */ ]
    }
  }
}
```

##### DELETE Response
```json
{
  "success": true,
  "action": "DELETE",
  "transaction_id": "txn-uuid",
  "data": {
    "success": true,
    "header_deleted": 1
  }
}
```

##### Error Response (Enhanced Diagnostics)
```json
{
  "success": false,
  "action": "CREATE",
  "transaction_id": null,
  "error": "P0001: GL_IMBALANCE: debits 1000 != credits 500 (tolerance 0.0001)",
  "error_detail": "",
  "error_hint": "Ensure each GL line has line_data.side = DR|CR and amounts are correct.",
  "error_context": "PL/pgSQL function hera_txn_create_v1(jsonb,jsonb,uuid) line 285 at RAISE\nPL/pgSQL function hera_txn_crud_v1(text,uuid,uuid,jsonb) line 41 at assignment"
}
```

#### Key Features

- **✅ Zero-Mutation Pass-Through**: Direct JSONB pass prevents data loss
- **✅ 9 Comprehensive Actions**: CREATE/READ/UPDATE/DELETE/QUERY/EMIT/REVERSE/VOID/VALIDATE
- **✅ Enhanced Error Diagnostics**: Stacked context with detail/hint/error_context
- **✅ Audit Trail Support**: `include_deleted` parameter for voided transactions
- **✅ Sacred Boundary Enforcement**: Organization isolation at all operations
- **✅ Actor Accountability**: Full audit trail with created_by/updated_by
- **✅ Smart Code Validation**: Automatic HERA DNA pattern enforcement
- **✅ GL Balance Validation**: Automatic DR=CR validation for accounting transactions
- **✅ Idempotent**: Safe to retry operations
- **✅ Performance Optimized**: QUERY mode returns lightweight 8-field list

#### Validation & Guardrails

**ACTOR-REQUIRED**: Enforces actor presence
```sql
IF p_actor_user_id IS NULL THEN
  RAISE EXCEPTION 'ACTOR_REQUIRED: p_actor_user_id cannot be null';
END IF;
```

**ORG-REQUIRED**: Enforces organization presence
```sql
IF p_organization_id IS NULL THEN
  RAISE EXCEPTION 'ORG_REQUIRED: p_organization_id cannot be null';
END IF;
```

**ORG-MISMATCH**: Guards against header organization mismatch
```sql
-- For CREATE and EMIT
IF ((p_payload->'header'->>'organization_id')::uuid) IS DISTINCT FROM p_organization_id THEN
  RAISE EXCEPTION 'ORG_MISMATCH: header.organization_id must equal p_organization_id';
END IF;
```

**SMARTCODE-PRESENT**: Validates HERA DNA pattern
```sql
-- In hera_txn_create_v1
IF (p_header->>'smart_code') IS NULL OR (p_header->>'smart_code') !~ v_sc_regex THEN
  RAISE EXCEPTION 'SMART_CODE_INVALID: header.smart_code must match %', v_sc_regex;
END IF;
```

**GL-BALANCE**: Validates accounting balance
```sql
-- Automatic validation for GL transactions
PERFORM public.hera_gl_validate_balance(v_org_id, v_txn_id, 0.0001);
-- Raises exception if abs(debits - credits) > tolerance
```

**GL-SIDE-REQUIRED**: Validates GL line side presence
```sql
-- For GL lines
IF (v_row->>'smart_code') ~ '\.GL\.' THEN
  v_side := public.hera_line_side(v_row->>'smart_code', COALESCE(v_row->'line_data','{}'::jsonb));
  IF v_side IS NULL THEN
    RAISE EXCEPTION 'GL_LINE_SIDE_REQUIRED: line % needs line_data.side = DR|CR', v_line_num;
  END IF;
END IF;
```

#### Transaction Deletion Rules

**DELETE Action Restrictions:**
- ✅ **ONLY** empty DRAFT transactions can be deleted
- ✅ Requires: `status='draft'` AND `total_amount=0` AND `line_count=0`
- ❌ **CANNOT** delete completed transactions → Use VOID or REVERSE

**Hard Delete vs Void:**
| Aspect | DELETE (Hard) | VOID (Soft) |
|--------|---------------|-------------|
| Record Preservation | ❌ Permanent removal | ✅ Record preserved |
| Audit Trail | ❌ Lost | ✅ Full trail |
| Recovery | ❌ Impossible | ✅ Via `include_deleted=true` |
| Use Case | Empty drafts only | Completed transactions |
| Financial Compliance | ❌ Not compliant | ✅ Compliant |

**Example Use Cases:**
```javascript
// ✅ Valid DELETE: Empty draft
await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'DELETE',
  p_payload: {
    transaction_id: draftId  // status='draft', total=0, no lines
  }
});

// ❌ Invalid DELETE: Completed transaction
await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'DELETE',
  p_payload: {
    transaction_id: completedId  // status='completed'
  }
});
// Error: "Only empty DRAFT transactions can be deleted. Use VOID or REVERSAL."

// ✅ Correct approach: VOID
await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'VOID',
  p_payload: {
    transaction_id: completedId,
    reason: 'Cancellation requested'
  }
});
```

#### Performance Metrics

**Expected Response Times:**
- CREATE (with lines): ~80-120ms
- READ (single, full): ~70-100ms
- QUERY (list, 50 items): ~100-150ms
- UPDATE (patch): ~80-110ms
- DELETE (hard): ~50-80ms
- VOID (soft): ~70-100ms
- REVERSE (create reversal): ~100-140ms

**Performance Tips:**
1. Use `QUERY` for list views (8 lightweight fields vs 35+21 full fields)
2. Set `include_deleted: false` when audit trail not needed
3. Batch operations in parallel where possible
4. Use pagination (`limit`/`offset`) for large result sets

#### Common Use Cases

**1. POS Sale Transaction**
```javascript
await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: cashierId,
  p_organization_id: storeId,
  p_payload: {
    header: {
      organization_id: storeId,
      transaction_type: 'SALE',
      smart_code: 'HERA.RETAIL.SALE.TXN.POS.V1',
      source_entity_id: customerId,
      target_entity_id: registerId,
      total_amount: 235.50,
      transaction_status: 'completed',
      business_context: {
        terminal_id: 'POS-01',
        shift_id: 'SHIFT-123',
        payment_method: 'credit_card'
      }
    },
    lines: [
      { line_number: 1, line_type: 'product', description: 'Product A', quantity: 2, unit_amount: 50, line_amount: 100 },
      { line_number: 2, line_type: 'product', description: 'Product B', quantity: 1, unit_amount: 125, line_amount: 125 },
      { line_number: 3, line_type: 'tax', description: 'Sales Tax (5%)', line_amount: 10.50 }
    ]
  }
});
```

**2. Accounting Journal Entry**
```javascript
await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: accountantId,
  p_organization_id: companyId,
  p_payload: {
    header: {
      organization_id: companyId,
      transaction_type: 'JOURNAL',
      smart_code: 'HERA.FIN.GL.TXN.JOURNAL.V1',
      transaction_status: 'posted',
      fiscal_year: 2025,
      fiscal_period: 10
    },
    lines: [
      {
        line_number: 1,
        line_type: 'gl',
        description: 'Rent expense',
        line_amount: 5000,
        smart_code: 'HERA.FIN.GL.LINE.ACCOUNT.V1',
        line_data: { side: 'DR', account: '620000', cost_center: 'ADMIN' }
      },
      {
        line_number: 2,
        line_type: 'gl',
        description: 'Cash payment',
        line_amount: 5000,
        smart_code: 'HERA.FIN.GL.LINE.ACCOUNT.V1',
        line_data: { side: 'CR', account: '110000', cost_center: 'ADMIN' }
      }
    ]
  }
});
```

**3. Appointment Booking**
```javascript
await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: receptionistId,
  p_organization_id: salonId,
  p_payload: {
    header: {
      organization_id: salonId,
      transaction_type: 'APPOINTMENT',
      smart_code: 'HERA.SALON.APPOINTMENT.TXN.BOOKING.V1',
      transaction_date: '2025-10-25T10:00:00Z',
      source_entity_id: customerId,
      target_entity_id: stylistId,
      total_amount: 0,
      transaction_status: 'confirmed',
      business_context: {
        service_duration_minutes: 60,
        booking_notes: 'Customer prefers front area'
      }
    },
    lines: [
      {
        line_number: 1,
        line_type: 'service',
        description: 'Haircut Appointment',
        quantity: 1,
        unit_amount: 50,
        line_amount: 50,
        entity_id: serviceId
      }
    ]
  }
});
```

**4. Daily Sales Report Query**
```javascript
// Fast query for dashboard
const { data } = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'QUERY',
  p_actor_user_id: managerId,
  p_organization_id: storeId,
  p_payload: {
    filters: {
      transaction_type: 'SALE',
      transaction_status: 'completed',
      limit: 100,
      offset: 0
    }
  }
});

// Process lightweight list (8 fields each)
const totalSales = data.data.data.items.reduce((sum, txn) => sum + txn.total_amount, 0);
```

#### Error Handling

**Common Error Codes:**
```javascript
// Actor required
'ACTOR_REQUIRED: p_actor_user_id cannot be null'

// Organization required
'ORG_REQUIRED: p_organization_id cannot be null'

// Organization mismatch
'ORG_MISMATCH: header.organization_id must equal p_organization_id'

// Invalid smart code
'SMART_CODE_INVALID: header.smart_code must match ^HERA\\.[A-Z0-9]...'

// GL imbalance
'GL_IMBALANCE: debits 1000 != credits 500 (tolerance 0.0001)'

// GL line missing side
'GL_LINE_SIDE_REQUIRED: line 1 needs line_data.side = DR|CR'

// Delete restriction
'Only empty DRAFT transactions can be deleted. Use VOID or REVERSAL.'

// Transaction not found
'Transaction not found'

// Parameter required
'PARAM_REQUIRED: transaction_id is required for READ'
```

---

## 📋 Query Functions

### `hera_txn_query_v1` ⭐ PRODUCTION READY
**Status**: ✅ Production Deployed
**Performance**: ⚡ Sub-150ms response time
**Purpose**: High-performance transaction querying with flexible filtering and pagination

#### Overview
The query RPC provides optimized read-only access to transaction data with comprehensive filtering, pagination, and optional line item inclusion. Designed for list views, reports, and transaction lookups.

**Key Benefits:**
- **High Performance**: Optimized indexes for sub-150ms queries
- **Flexible Filtering**: Date ranges, status, type, entity filters, and more
- **Optional Line Loading**: Control data payload with `include_lines` flag
- **Backward Compatible**: Default `include_lines: true` matches legacy behavior
- **Safe UUID Parsing**: Gracefully handles invalid UUID strings
- **Multi-Tenant Isolation**: Organization boundary enforced

#### Function Signature
```sql
CREATE OR REPLACE FUNCTION public.hera_txn_query_v1(
  p_org_id uuid,                        -- Organization UUID (required)
  p_filters jsonb DEFAULT '{}'::jsonb   -- Filter parameters (optional)
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
```

#### Parameters

##### `p_org_id` (required)
Organization UUID for multi-tenant isolation. Only returns transactions belonging to this organization.

##### `p_filters` (optional JSONB object)
Filter parameters to narrow query results:

```typescript
{
  // Pagination
  limit?: number,                        // Max results (default: 100, min: 1)
  offset?: number,                       // Pagination offset (default: 0)

  // Data control
  include_lines?: boolean,               // Include transaction lines (default: true)
  include_deleted?: boolean,             // Include voided transactions (default: false)

  // Transaction filters
  transaction_type?: string,             // Exact match: 'SALE', 'APPOINTMENT', 'PAYMENT', etc.
  transaction_status?: string,           // Exact match: 'draft', 'pending', 'completed', 'voided'
  smart_code?: string,                   // Exact match on HERA DNA pattern

  // Entity filters
  source_entity_id?: string,             // Customer/vendor UUID (invalid UUIDs ignored)
  target_entity_id?: string,             // Staff/location UUID (invalid UUIDs ignored)

  // Date range filters
  date_from?: string,                    // ISO 8601 timestamp (inclusive)
  date_to?: string                       // ISO 8601 timestamp (EXCLUSIVE upper bound)
}
```

#### Response Structure

##### Success Response
```json
{
  "success": true,
  "action": "QUERY",
  "data": {
    "items": [
      {
        "id": "txn-uuid",
        "organization_id": "org-uuid",
        "transaction_type": "SALE",
        "transaction_code": "SALE-2025-001",
        "transaction_date": "2025-01-12T14:30:00Z",
        "source_entity_id": "customer-uuid",
        "target_entity_id": "staff-uuid",
        "total_amount": 150.50,
        "transaction_status": "completed",
        "reference_number": "REF-123",
        "external_reference": "EXT-456",
        "smart_code": "HERA.SALON.SALE.TXN.RETAIL.v1",
        "smart_code_status": "ACTIVE",
        "ai_confidence": 0.95,
        "ai_classification": "high_value",
        "ai_insights": { "category": "retail" },
        "business_context": { "payment_method": "card" },
        "metadata": { "source": "pos" },
        "approval_required": false,
        "approved_by": null,
        "approved_at": null,
        "transaction_currency_code": "USD",
        "base_currency_code": "USD",
        "exchange_rate": 1.0,
        "exchange_rate_date": null,
        "exchange_rate_type": null,
        "fiscal_year": 2025,
        "fiscal_period": 1,
        "fiscal_period_entity_id": null,
        "posting_period_code": "2025-01",
        "created_at": "2025-01-12T14:30:00Z",
        "updated_at": "2025-01-12T14:30:00Z",
        "created_by": "actor-uuid",
        "updated_by": "actor-uuid",
        "version": 1,

        // Optional: Only present when include_lines: true
        "lines": [
          {
            "id": "line-uuid",
            "line_number": 1,
            "line_type": "service",
            "entity_id": "service-uuid",
            "description": "Haircut",
            "quantity": 1,
            "unit_amount": 50,
            "line_amount": 50,
            "discount_amount": 0,
            "tax_amount": 0,
            "smart_code": "HERA.SALON.SERVICE.LINE.HAIRCUT.v1",
            "line_data": { "duration_minutes": 30 },
            "created_at": "2025-01-12T14:30:00Z",
            "updated_at": "2025-01-12T14:30:00Z"
          }
        ]
      }
    ],
    "limit": 100,
    "offset": 0,
    "total": 245
  }
}
```

##### Error Response
```json
{
  "success": false,
  "action": "QUERY",
  "error": "P0001: Error description",
  "error_detail": "Additional detail",
  "error_hint": "Suggested fix",
  "error_context": "Stack trace"
}
```

#### Usage Examples

##### Basic Query - All Transactions
```javascript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Get recent transactions with lines (default behavior)
const { data, error } = await supabase.rpc('hera_txn_query_v1', {
  p_org_id: organizationId,
  p_filters: {
    limit: 50,
    offset: 0
  }
});

console.log(`Found ${data.data.total} transactions`);
console.log(`Returned ${data.data.items.length} items`);
```

##### Date Range Query
```javascript
// Query transactions in date range
const { data } = await supabase.rpc('hera_txn_query_v1', {
  p_org_id: organizationId,
  p_filters: {
    date_from: '2025-01-01T00:00:00Z',     // Inclusive
    date_to: '2025-02-01T00:00:00Z',       // EXCLUSIVE (up to but not including Feb 1)
    limit: 100
  }
});

// Returns all transactions from Jan 1 00:00:00 to Jan 31 23:59:59
```

##### Filter by Type and Status
```javascript
// Query completed sales only
const { data } = await supabase.rpc('hera_txn_query_v1', {
  p_org_id: organizationId,
  p_filters: {
    transaction_type: 'SALE',
    transaction_status: 'completed',
    limit: 50
  }
});
```

##### Filter by Customer (Source Entity)
```javascript
// Get all transactions for a specific customer
const { data } = await supabase.rpc('hera_txn_query_v1', {
  p_org_id: organizationId,
  p_filters: {
    source_entity_id: customerId,
    limit: 100
  }
});
```

##### Filter by Staff (Target Entity)
```javascript
// Get all appointments for a specific stylist
const { data } = await supabase.rpc('hera_txn_query_v1', {
  p_org_id: organizationId,
  p_filters: {
    transaction_type: 'APPOINTMENT',
    target_entity_id: stylistId,
    date_from: new Date().toISOString(),  // Today onwards
    limit: 20
  }
});
```

##### Lightweight Query (Without Lines)
```javascript
// Fast query for dashboard - exclude lines for better performance
const { data } = await supabase.rpc('hera_txn_query_v1', {
  p_org_id: organizationId,
  p_filters: {
    include_lines: false,    // Exclude line items for speed
    limit: 100
  }
});

// Each item is ~2KB instead of ~10KB (5x smaller payload)
```

##### Include Voided Transactions (Audit Mode)
```javascript
// Audit trail: include voided transactions
const { data } = await supabase.rpc('hera_txn_query_v1', {
  p_org_id: organizationId,
  p_filters: {
    include_deleted: true,   // Include voided transactions
    transaction_status: 'voided',
    limit: 50
  }
});
```

##### Complex Combined Query
```javascript
// Multi-filter query: Sales by specific staff, date range, completed only
const { data } = await supabase.rpc('hera_txn_query_v1', {
  p_org_id: organizationId,
  p_filters: {
    transaction_type: 'SALE',
    transaction_status: 'completed',
    target_entity_id: staffId,
    date_from: '2025-01-01T00:00:00Z',
    date_to: '2025-02-01T00:00:00Z',
    include_lines: true,
    limit: 100,
    offset: 0
  }
});

// Calculate total revenue
const totalRevenue = data.data.items.reduce((sum, txn) => sum + txn.total_amount, 0);
console.log(`Staff generated $${totalRevenue} in January`);
```

##### Pagination Pattern
```javascript
// Page 1
const page1 = await supabase.rpc('hera_txn_query_v1', {
  p_org_id: organizationId,
  p_filters: {
    limit: 50,
    offset: 0
  }
});

// Page 2
const page2 = await supabase.rpc('hera_txn_query_v1', {
  p_org_id: organizationId,
  p_filters: {
    limit: 50,
    offset: 50
  }
});

// Page 3
const page3 = await supabase.rpc('hera_txn_query_v1', {
  p_org_id: organizationId,
  p_filters: {
    limit: 50,
    offset: 100
  }
});

console.log(`Total pages: ${Math.ceil(page1.data.total / 50)}`);
```

#### Key Features

- **✅ High Performance**: Optimized with composite indexes (org_id, transaction_date DESC)
- **✅ Flexible Filtering**: 9 filter parameters for precise queries
- **✅ Optional Line Loading**: Control payload size with `include_lines` flag
- **✅ Backward Compatible**: Default `include_lines: true` maintains legacy behavior
- **✅ Safe UUID Parsing**: Invalid UUID strings gracefully ignored (no errors)
- **✅ Multi-Tenant Isolation**: Organization boundary strictly enforced
- **✅ Voided Transaction Support**: Audit mode with `include_deleted: true`
- **✅ Comprehensive Response**: 35 header fields + 14 line fields per item
- **✅ Enhanced Error Handling**: Stacked diagnostics with detail/hint/context
- **✅ Production Proven**: Tested with 23-test comprehensive suite

#### Performance Characteristics

**Query Response Times:**
- Basic query (no lines): ~50-80ms
- With lines (10 transactions): ~80-120ms
- With lines (50 transactions): ~120-180ms
- Date range filter: ~60-100ms
- Complex multi-filter: ~100-150ms

**Optimization Tips:**
1. **Use `include_lines: false` for list views** - 5x smaller payload, 2x faster
2. **Always use pagination** - `limit` should never exceed 100 for production
3. **Index-friendly filters** - `transaction_type`, `transaction_status`, `date_from/to` use indexes
4. **Avoid `include_deleted: true` unless needed** - Audit mode is slower
5. **Filter early** - Apply filters in query rather than filtering results client-side

#### Required Indexes

These indexes are CRITICAL for performance:

```sql
-- Primary performance index (REQUIRED)
CREATE INDEX IF NOT EXISTS idx_ut_org_txn_date
  ON universal_transactions (organization_id, transaction_date DESC);

-- Status filtering (REQUIRED)
CREATE INDEX IF NOT EXISTS idx_ut_org_status
  ON universal_transactions (organization_id, transaction_status)
  WHERE transaction_status <> 'voided';

-- Smart code filtering (REQUIRED)
CREATE INDEX IF NOT EXISTS idx_ut_org_smart_code
  ON universal_transactions (organization_id, smart_code);

-- Entity filters (REQUIRED)
CREATE INDEX IF NOT EXISTS idx_ut_org_source
  ON universal_transactions (organization_id, source_entity_id);

CREATE INDEX IF NOT EXISTS idx_ut_org_target
  ON universal_transactions (organization_id, target_entity_id);

-- Line lookups (REQUIRED for include_lines: true)
CREATE INDEX IF NOT EXISTS idx_utl_org_txn_line
  ON universal_transaction_lines (organization_id, transaction_id, line_number);
```

#### Common Use Cases

**1. Dashboard - Today's Sales**
```javascript
const today = new Date();
today.setHours(0, 0, 0, 0);
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

const { data } = await supabase.rpc('hera_txn_query_v1', {
  p_org_id: storeId,
  p_filters: {
    transaction_type: 'SALE',
    transaction_status: 'completed',
    date_from: today.toISOString(),
    date_to: tomorrow.toISOString(),
    include_lines: false,  // Fast dashboard query
    limit: 100
  }
});

const dailyRevenue = data.data.items.reduce((sum, txn) => sum + txn.total_amount, 0);
```

**2. Customer Transaction History**
```javascript
const { data } = await supabase.rpc('hera_txn_query_v1', {
  p_org_id: salonId,
  p_filters: {
    source_entity_id: customerId,
    include_lines: true,   // Show full detail
    limit: 50,
    offset: 0
  }
});

// Display customer's complete transaction history with line items
```

**3. Staff Performance Report**
```javascript
const { data } = await supabase.rpc('hera_txn_query_v1', {
  p_org_id: salonId,
  p_filters: {
    transaction_type: 'SALE',
    transaction_status: 'completed',
    target_entity_id: staffId,
    date_from: monthStart.toISOString(),
    date_to: monthEnd.toISOString(),
    include_lines: true,
    limit: 200
  }
});

// Analyze staff performance by service type, revenue, etc.
```

**4. Appointment Schedule**
```javascript
const { data } = await supabase.rpc('hera_txn_query_v1', {
  p_org_id: salonId,
  p_filters: {
    transaction_type: 'APPOINTMENT',
    date_from: new Date().toISOString(),
    date_to: endOfWeek.toISOString(),
    include_lines: true,
    limit: 100
  }
});

// Display week's appointment schedule with service details
```

**5. Financial Report (Completed Transactions Only)**
```javascript
const { data } = await supabase.rpc('hera_txn_query_v1', {
  p_org_id: companyId,
  p_filters: {
    transaction_status: 'completed',
    date_from: fiscalYearStart.toISOString(),
    date_to: fiscalYearEnd.toISOString(),
    include_lines: false,  // Headers only for summary
    limit: 1000
  }
});

// Generate financial summary report
```

**6. Audit Trail - Voided Transactions**
```javascript
const { data } = await supabase.rpc('hera_txn_query_v1', {
  p_org_id: orgId,
  p_filters: {
    include_deleted: true,
    transaction_status: 'voided',
    date_from: monthStart.toISOString(),
    limit: 100
  }
});

// Review voided transactions for compliance audit
```

#### Error Handling

**Safe UUID Parsing:**
```javascript
// Invalid UUID strings are gracefully ignored (no error thrown)
const { data } = await supabase.rpc('hera_txn_query_v1', {
  p_org_id: organizationId,
  p_filters: {
    source_entity_id: 'not-a-valid-uuid',  // Ignored, no error
    target_entity_id: 'also-invalid'       // Ignored, no error
  }
});

// Query proceeds normally, invalid UUIDs treated as NULL (no filter applied)
```

**Error Response Example:**
```javascript
try {
  const { data, error } = await supabase.rpc('hera_txn_query_v1', {
    p_org_id: null,  // Invalid: null org_id
    p_filters: {}
  });

  if (error) {
    console.error('Query failed:', error.message);
  }
} catch (err) {
  console.error('Unexpected error:', err);
}
```

#### Best Practices

1. **Always specify `limit`** - Default is 100, but explicit is better
2. **Use `include_lines: false` for lists** - Only load lines when displaying detail
3. **Filter at database level** - Don't fetch all and filter client-side
4. **Use date ranges** - More efficient than fetching all and filtering by date
5. **Paginate large result sets** - Never fetch more than 100 items at once
6. **Cache query results** - Use client-side caching for frequently accessed data
7. **Monitor `total` count** - Use for pagination UI and performance monitoring
8. **Test with production data volumes** - Ensure queries scale to expected data size

#### Comparison: `hera_txn_crud_v1` vs `hera_txn_query_v1`

| Feature | hera_txn_crud_v1 (QUERY action) | hera_txn_query_v1 |
|---------|----------------------------------|-------------------|
| **Purpose** | General CRUD with limited query filters | Specialized high-performance queries |
| **Filters** | 3 filters (type, status, include_deleted) | 9 filters (type, status, smart_code, entities, dates, etc.) |
| **Performance** | ~100-150ms | ~50-150ms (optimized indexes) |
| **Line Control** | Always includes lines | Optional `include_lines` flag |
| **Date Filtering** | Not supported | Full date range support |
| **Entity Filtering** | Not supported | Source/target entity filters |
| **Response Size** | Always full (35+21 fields) | Configurable (with/without lines) |
| **Use Case** | Single transaction reads, CRUD operations | List views, reports, filtered queries |
| **Actor Required** | ✅ Yes (`p_actor_user_id`) | ❌ No (read-only) |

**When to use which:**
- **Use `hera_txn_crud_v1`** - For CREATE/UPDATE/DELETE/VOID operations and single transaction reads
- **Use `hera_txn_query_v1`** - For list views, reports, dashboards, filtered searches

---

## 🛠️ Helper Functions

### `hera_line_side` ⭐ NEW
**Status**: ✅ Production Ready
**Purpose**: Normalize DR/CR side from line_data.side for GL lines

#### Function Signature
```sql
CREATE OR REPLACE FUNCTION public.hera_line_side(
  p_smart_code text,
  p_line_data  jsonb
) RETURNS text
LANGUAGE sql
IMMUTABLE
```

#### Parameters
- `p_smart_code` (required) - Line smart code (checks for `\.GL\.` pattern)
- `p_line_data` (required) - JSONB line data containing `side` field

#### Logic
- Returns `'DR'` or `'CR'` for GL lines (smart_code contains `.GL.`)
- Returns `NULL` for non-GL lines
- Normalizes to UPPERCASE automatically

#### Usage
```sql
-- Returns 'DR' for GL debit line
SELECT hera_line_side(
  'HERA.FIN.GL.LINE.ACCOUNT.V1',
  '{"side":"dr","account":"110000"}'::jsonb
);

-- Returns NULL for non-GL line
SELECT hera_line_side(
  'HERA.SALON.SERVICE.LINE.HAIRCUT.V1',
  '{"quantity":1}'::jsonb
);
```

---

### `hera_line_debit_amount` ⭐ NEW
**Status**: ✅ Production Ready
**Purpose**: Derive debit amount from side and line_amount

#### Function Signature
```sql
CREATE OR REPLACE FUNCTION public.hera_line_debit_amount(
  p_side text,
  p_line_amount numeric
) RETURNS numeric
LANGUAGE sql
IMMUTABLE
```

#### Logic
```sql
SELECT CASE WHEN p_side = 'DR' THEN COALESCE(p_line_amount,0) ELSE 0 END;
```

#### Usage
```sql
-- Returns 1000 (debit amount)
SELECT hera_line_debit_amount('DR', 1000);

-- Returns 0 (credit side)
SELECT hera_line_debit_amount('CR', 1000);
```

---

### `hera_line_credit_amount` ⭐ NEW
**Status**: ✅ Production Ready
**Purpose**: Derive credit amount from side and line_amount

#### Function Signature
```sql
CREATE OR REPLACE FUNCTION public.hera_line_credit_amount(
  p_side text,
  p_line_amount numeric
) RETURNS numeric
LANGUAGE sql
IMMUTABLE
```

#### Logic
```sql
SELECT CASE WHEN p_side = 'CR' THEN COALESCE(p_line_amount,0) ELSE 0 END;
```

#### Usage
```sql
-- Returns 0 (debit side)
SELECT hera_line_credit_amount('DR', 1000);

-- Returns 1000 (credit amount)
SELECT hera_line_credit_amount('CR', 1000);
```

---

### `hera_gl_validate_balance` ⭐ NEW
**Status**: ✅ Production Ready
**Purpose**: Validate GL transaction balance (debits = credits within tolerance)

#### Function Signature
```sql
CREATE OR REPLACE FUNCTION public.hera_gl_validate_balance(
  p_org_id uuid,
  p_transaction_id uuid,
  p_epsilon numeric DEFAULT 0.0001
) RETURNS void
LANGUAGE plpgsql
```

#### Parameters
- `p_org_id` (required) - Organization UUID
- `p_transaction_id` (required) - Transaction UUID to validate
- `p_epsilon` (optional, default: 0.0001) - Tolerance for rounding errors

#### Logic
1. Sums debit_amount from all GL lines (smart_code contains `.GL.`)
2. Sums credit_amount from all GL lines
3. Checks if `abs(debits - credits) > epsilon`
4. Raises exception if imbalance detected

#### Usage
```sql
-- Validate transaction balance
SELECT hera_gl_validate_balance(
  '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid,
  'txn-uuid'::uuid,
  0.0001
);

-- Success: Returns void
-- Failure: RAISES EXCEPTION 'GL_IMBALANCE: debits 1000 != credits 500 (tolerance 0.0001)'
```

---

### `v_universal_transaction_lines_drcr` ⭐ NEW
**Status**: ✅ Production Ready
**Purpose**: Convenience view exposing derived DR/CR columns for analytics

#### View Definition
```sql
CREATE OR REPLACE VIEW public.v_universal_transaction_lines_drcr AS
SELECT
  l.*,
  public.hera_line_side(l.smart_code, l.line_data)               AS side,
  public.hera_line_debit_amount(public.hera_line_side(l.smart_code, l.line_data), l.line_amount)  AS debit_amount,
  public.hera_line_credit_amount(public.hera_line_side(l.smart_code, l.line_data), l.line_amount) AS credit_amount
FROM universal_transaction_lines l;
```

#### Usage
```sql
-- Query with derived DR/CR columns
SELECT
  transaction_id,
  line_number,
  description,
  side,
  debit_amount,
  credit_amount
FROM v_universal_transaction_lines_drcr
WHERE organization_id = 'org-uuid'
  AND transaction_id = 'txn-uuid'
ORDER BY line_number;
```

#### Benefits
- ✅ **No Physical Columns**: DR/CR derived on-the-fly
- ✅ **Zero Storage Overhead**: No redundant data stored
- ✅ **Always Consistent**: Computed from source data
- ✅ **Analytics Ready**: Use in reports and dashboards
- ✅ **BI Tool Compatible**: Expose to Tableau, Power BI, etc.

---

## 🏗️ Architecture Patterns

### Debit/Credit Handling

HERA implements **derived DR/CR architecture** with zero physical columns:

**Traditional Approach (Physical Columns):**
```sql
-- ❌ OLD: Physical debit_amount and credit_amount columns
CREATE TABLE universal_transaction_lines (
  id uuid PRIMARY KEY,
  line_amount numeric,
  debit_amount numeric,   -- Physical column
  credit_amount numeric,  -- Physical column
  -- Redundant data, requires UPDATE triggers, can become inconsistent
);
```

**HERA Approach (Derived Columns):**
```sql
-- ✅ NEW: Store only line_amount + side in JSONB
CREATE TABLE universal_transaction_lines (
  id uuid PRIMARY KEY,
  line_amount numeric,     -- Single source of truth
  line_data jsonb,          -- Contains: { side: 'DR' | 'CR', ... }
  -- No physical DR/CR columns
);

-- Derive DR/CR on-the-fly
SELECT
  line_amount,
  hera_line_side(smart_code, line_data) AS side,
  hera_line_debit_amount(side, line_amount) AS debit_amount,
  hera_line_credit_amount(side, line_amount) AS credit_amount
FROM universal_transaction_lines;
```

**Benefits:**
1. **✅ No Redundancy**: Single source of truth (`line_amount`)
2. **✅ Always Consistent**: DR/CR computed from source
3. **✅ Storage Efficient**: No duplicate columns
4. **✅ Update Safe**: No trigger complexity
5. **✅ Flexible**: Easy to add computed columns later

### Transaction Lifecycle

```
┌─────────────┐
│    DRAFT    │  ← Can DELETE (HARD)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   PENDING   │  ← Must VOID/REVERSE
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  COMPLETED  │  ← Must VOID/REVERSE
└──────┬──────┘
       │
       ├─────────────────┬─────────────────┐
       │                 │                 │
       ▼                 ▼                 ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│    VOIDED    │   │   REVERSED   │   │   ARCHIVED   │
│ (soft delete)│   │ (immutable)  │   │   (status)   │
└──────────────┘   └──────────────┘   └──────────────┘
```

---

## 🚀 Performance Optimizations

### Strategic Indexing
```sql
-- Organization-first pattern (CRITICAL for multi-tenancy)
CREATE INDEX idx_ut_org_txn_date
  ON universal_transactions (organization_id, transaction_date DESC);

CREATE INDEX idx_ut_org_status
  ON universal_transactions (organization_id, transaction_status);

CREATE INDEX idx_ut_org_smart_code
  ON universal_transactions (organization_id, smart_code);

-- Line lookups
CREATE INDEX idx_utl_org_txn_line
  ON universal_transaction_lines (organization_id, transaction_id, line_number);

-- GL-specific index
CREATE INDEX idx_utl_org_txn_is_gl
  ON universal_transaction_lines (organization_id, transaction_id)
  WHERE smart_code ~ '\.GL\.';
```

### Query Optimization Tips
1. **Use QUERY for Lists**: Returns 8 lightweight fields vs 35+21 full fields
2. **Pagination**: Always use `limit`/`offset` for large result sets
3. **Filter Early**: Apply filters in QUERY payload to reduce dataset
4. **Avoid include_deleted**: Only use when audit trail needed (slower query)

---

## 🔒 Security Features

### Multi-Tenant Isolation
Every function enforces organization boundary:
```sql
WHERE organization_id = p_organization_id
```

### Actor Accountability
Every modification tracks WHO:
```sql
created_by = p_actor_user_id
updated_by = p_actor_user_id
```

### Smart Code Validation
All operations validate HERA DNA format:
```sql
IF (p_header->>'smart_code') !~ '^HERA\\.[A-Z0-9]{3,15}(?:\\.[A-Z0-9_]{2,30}){3,8}\\.v[0-9]+' THEN
  RAISE EXCEPTION 'SMART_CODE_INVALID';
END IF;
```

### GL Balance Enforcement
Accounting transactions auto-validate:
```sql
PERFORM hera_gl_validate_balance(p_org_id, p_transaction_id, 0.0001);
```

---

## 📊 Monitoring & Debugging

### Common Debugging Queries
```sql
-- Check transaction status distribution
SELECT transaction_status, COUNT(*)
FROM universal_transactions
WHERE organization_id = 'org-uuid'
GROUP BY transaction_status;

-- Find imbalanced GL transactions
SELECT
  t.id,
  t.transaction_code,
  SUM(CASE WHEN hera_line_side(l.smart_code, l.line_data) = 'DR' THEN l.line_amount ELSE 0 END) AS total_dr,
  SUM(CASE WHEN hera_line_side(l.smart_code, l.line_data) = 'CR' THEN l.line_amount ELSE 0 END) AS total_cr
FROM universal_transactions t
JOIN universal_transaction_lines l ON l.transaction_id = t.id
WHERE t.organization_id = 'org-uuid'
  AND l.smart_code ~ '\.GL\.'
GROUP BY t.id, t.transaction_code
HAVING ABS(
  SUM(CASE WHEN hera_line_side(l.smart_code, l.line_data) = 'DR' THEN l.line_amount ELSE 0 END) -
  SUM(CASE WHEN hera_line_side(l.smart_code, l.line_data) = 'CR' THEN l.line_amount ELSE 0 END)
) > 0.01;

-- Audit trail: Find voided transactions
SELECT *
FROM universal_transactions
WHERE organization_id = 'org-uuid'
  AND transaction_status = 'voided'
ORDER BY updated_at DESC;
```

---

## 🔗 Integration Examples

### TypeScript/React Hook Integration
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createTransaction(header: any, lines: any[]) {
  const { data, error } = await supabase.rpc('hera_txn_crud_v1', {
    p_action: 'CREATE',
    p_actor_user_id: actorId,
    p_organization_id: orgId,
    p_payload: {
      header,
      lines
    }
  });

  if (error) {
    throw new Error(`Transaction creation failed: ${error.message}`);
  }

  return data.transaction_id;
}
```

---

**Last Updated**: January 12, 2025
**Version**: 2.5.0
**Status**: ✅ Production Ready

## 🆕 Recent Updates (v2.5.0)
- ✅ **Added `hera_txn_query_v1` complete documentation** - High-performance query RPC
- ✅ 9 filter parameters documented: type, status, smart_code, entities, date ranges
- ✅ Optional line loading with `include_lines` flag for performance control
- ✅ Backward compatibility: default `include_lines: true` maintains legacy behavior
- ✅ Safe UUID parsing with graceful invalid UUID handling
- ✅ 23-test production validation suite coverage
- ✅ Performance benchmarks and optimization tips
- ✅ 6 common use case examples (dashboard, customer history, reports, etc.)
- ✅ Comparison table: `hera_txn_crud_v1` vs `hera_txn_query_v1`
- ✅ Required indexes for optimal performance documented

## 📚 Previous Updates (v2.4.0)
- ✅ Added comprehensive `hera_txn_crud_v1` documentation
- ✅ Documented all 9 actions: CREATE/READ/UPDATE/DELETE/QUERY/EMIT/REVERSE/VOID/VALIDATE
- ✅ Added helper functions: `hera_line_side`, `hera_line_debit_amount`, `hera_line_credit_amount`, `hera_gl_validate_balance`
- ✅ Documented derived DR/CR architecture (no physical columns)
- ✅ Added `v_universal_transaction_lines_drcr` convenience view
- ✅ Comprehensive examples for all transaction types (POS, GL, Appointments)
- ✅ Enhanced error handling documentation with stacked diagnostics
- ✅ Transaction lifecycle and deletion rules clarified
- ✅ Performance optimization tips and indexing strategies
