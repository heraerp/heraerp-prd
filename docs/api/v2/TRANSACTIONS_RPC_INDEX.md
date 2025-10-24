# HERA Transaction RPC Functions - Quick Reference

## 📚 Documentation Index

### Main Guide
**`HERA_TRANSACTIONS_RPC_GUIDE.md`** - Complete technical reference (1,285 lines)

---

## 📋 Table of Contents

### 1. Transaction CRUD Orchestrator
- **`hera_txn_crud_v1`** ⭐ PRODUCTION READY
  - Actions: CREATE, READ, UPDATE, DELETE, QUERY, EMIT, REVERSE, VOID, VALIDATE
  - Zero-mutation pass-through
  - Enhanced error diagnostics
  - Audit trail support

### 2. Helper Functions (Derived DR/CR Architecture)

#### **`hera_line_side(p_smart_code, p_line_data)`**
- **Purpose**: Normalize DR/CR side from line_data.side for GL lines
- **Returns**: `'DR'`, `'CR'`, or `NULL` (for non-GL lines)
- **Signature**:
  ```sql
  CREATE OR REPLACE FUNCTION public.hera_line_side(
    p_smart_code text,
    p_line_data  jsonb
  ) RETURNS text
  LANGUAGE sql IMMUTABLE
  ```

#### **`hera_line_debit_amount(p_side, p_line_amount)`**
- **Purpose**: Derive debit amount from side and line_amount
- **Returns**: `line_amount` if side='DR', else `0`
- **Signature**:
  ```sql
  CREATE OR REPLACE FUNCTION public.hera_line_debit_amount(
    p_side text,
    p_line_amount numeric
  ) RETURNS numeric
  LANGUAGE sql IMMUTABLE
  ```

#### **`hera_line_credit_amount(p_side, p_line_amount)`**
- **Purpose**: Derive credit amount from side and line_amount
- **Returns**: `line_amount` if side='CR', else `0`
- **Signature**:
  ```sql
  CREATE OR REPLACE FUNCTION public.hera_line_credit_amount(
    p_side text,
    p_line_amount numeric
  ) RETURNS numeric
  LANGUAGE sql IMMUTABLE
  ```

#### **`hera_gl_validate_balance(p_org_id, p_transaction_id, p_epsilon)`**
- **Purpose**: Validate GL transaction balance (debits = credits)
- **Signature**:
  ```sql
  CREATE OR REPLACE FUNCTION public.hera_gl_validate_balance(
    p_org_id uuid,
    p_transaction_id uuid,
    p_epsilon numeric DEFAULT 0.0001
  ) RETURNS void
  LANGUAGE plpgsql
  ```
- **Raises**: `GL_IMBALANCE` exception if `abs(DR - CR) > epsilon`

#### **`v_universal_transaction_lines_drcr`** (View)
- **Purpose**: Convenience view exposing derived DR/CR columns for analytics
- **Columns**: All line fields + `side`, `debit_amount`, `credit_amount`
- **Usage**: Query for reports without physical DR/CR columns

### 3. Supporting Functions

#### **`hera_txn_create_v1(p_header, p_lines, p_actor_user_id)`**
- **Purpose**: Create transaction with header + lines
- **Features**:
  - Inserts header into `universal_transactions`
  - Inserts lines into `universal_transaction_lines`
  - Validates GL side presence (line_data.side required for GL lines)
  - Auto-validates GL balance via `hera_gl_validate_balance()`
  - Returns full transaction with 35 header + 21 line fields

#### **`hera_txn_read_v1(p_org_id, p_transaction_id, p_include_lines, p_include_deleted)`**
- **Purpose**: Read single transaction with optional voided inclusion
- **Returns**: Full header (35 fields) + lines (21 fields each)

#### **`hera_txn_query_v1(p_org_id, p_filters)`**
- **Purpose**: Query transactions with filters
- **Returns**: Lightweight list (8 fields per transaction)

#### **`hera_txn_update_v1(p_org_id, p_transaction_id, p_patch, p_actor_user_id)`**
- **Purpose**: Update transaction fields (patch-based)

#### **`hera_txn_delete_v1(p_org_id, p_transaction_id)`**
- **Purpose**: HARD delete empty draft transactions only
- **Restrictions**: status='draft' AND total_amount=0 AND no lines

#### **`hera_txn_void_v1(p_org_id, p_transaction_id, p_reason, p_actor_user_id)`**
- **Purpose**: Soft delete via status='voided' (preserves audit trail)

#### **`hera_txn_reverse_v1(p_org_id, p_transaction_id, p_reversal_date, p_reason, p_actor_user_id)`**
- **Purpose**: Create reversal transaction (immutable correction)

#### **`hera_txn_emit_v1(...)`**
- **Purpose**: Create event-based transaction (header only)

#### **`hera_txn_validate_v1(p_org_id, p_transaction_id)`**
- **Purpose**: Validate transaction against business rules

---

## 🎯 Quick Usage Examples

### Create Transaction with GL Lines
\`\`\`javascript
const { data } = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'CREATE',
  p_actor_user_id: accountantId,
  p_organization_id: orgId,
  p_payload: {
    header: {
      organization_id: orgId,
      transaction_type: 'JOURNAL',
      smart_code: 'HERA.FIN.GL.TXN.JOURNAL.V1',
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
        line_data: { side: 'DR', account: '110000' }  // REQUIRED for GL
      },
      {
        line_number: 2,
        line_type: 'gl',
        description: 'Revenue earned',
        line_amount: 1000,
        smart_code: 'HERA.FIN.GL.LINE.ACCOUNT.V1',
        line_data: { side: 'CR', account: '410000' }  // REQUIRED for GL
      }
    ]
  }
});
// Auto-validates: DR total = CR total
\`\`\`

### Query with Derived DR/CR View
\`\`\`sql
-- Analytics query with derived DR/CR columns
SELECT
  transaction_id,
  line_number,
  description,
  side,
  debit_amount,
  credit_amount
FROM v_universal_transaction_lines_drcr
WHERE organization_id = 'org-uuid'
  AND smart_code ~ '\\.GL\\.'
ORDER BY transaction_id, line_number;
\`\`\`

### Void Transaction (Audit Trail)
\`\`\`javascript
// Void transaction (soft delete)
await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'VOID',
  p_actor_user_id: userId,
  p_organization_id: orgId,
  p_payload: {
    transaction_id: txnId,
    reason: 'Customer cancellation'
  }
});

// Read voided transaction in audit mode
const { data } = await supabase.rpc('hera_txn_crud_v1', {
  p_action: 'READ',
  p_actor_user_id: userId,
  p_organization_id: orgId,
  p_payload: {
    transaction_id: txnId,
    include_deleted: true  // AUDIT MODE - includes voided
  }
});
\`\`\`

---

## 🏗️ Architecture Highlights

### Derived DR/CR (No Physical Columns)
- ✅ Single source of truth: `line_amount`
- ✅ Side stored in JSONB: `line_data.side = 'DR' | 'CR'`
- ✅ DR/CR derived on-the-fly via helper functions
- ✅ Zero storage overhead, always consistent
- ✅ View available for analytics

### Transaction Lifecycle
\`\`\`
DRAFT → PENDING → COMPLETED
  ↓       ↓          ↓
DELETE   VOID      VOID/REVERSE
(hard)  (soft)   (immutable)
\`\`\`

### Deletion Rules
| Status | DELETE (Hard) | VOID (Soft) | REVERSE |
|--------|---------------|-------------|---------|
| DRAFT (empty) | ✅ Allowed | ✅ Allowed | ❌ N/A |
| DRAFT (with data) | ❌ Blocked | ✅ Allowed | ❌ N/A |
| COMPLETED | ❌ Blocked | ✅ Allowed | ✅ Allowed |

---

## 📖 Full Documentation

See **`HERA_TRANSACTIONS_RPC_GUIDE.md`** for:
- Complete parameter specifications
- Detailed examples for all 9 actions
- Error handling and validation
- Performance optimization tips
- Security features
- Integration examples

---

**Last Updated**: October 23, 2025
**Version**: 2.4.0
