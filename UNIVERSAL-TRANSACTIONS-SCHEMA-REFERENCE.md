# Universal Transactions Schema Reference

**CRITICAL**: Always refer to this document when working with transaction tables to avoid column name errors.

## `universal_transactions` Table

### Required Columns
- `id` (uuid, auto-generated)
- `organization_id` (uuid) - **REQUIRED** for multi-tenant isolation
- `transaction_type` (text) - **REQUIRED** (e.g., 'APPOINTMENT', 'SALE', 'PAYMENT')
- `transaction_code` (text) - **NOT** `transaction_number`!
- `transaction_date` (timestamptz, defaults to now())
- `transaction_status` (text) - **NOT** `status`! (defaults to 'pending')
- `smart_code` (varchar(100)) - **REQUIRED** for HERA DNA
- `total_amount` (numeric(19,4), defaults to 0)

### Optional Columns
- `source_entity_id` (uuid) - From entity (e.g., customer)
- `target_entity_id` (uuid) - To entity (e.g., staff/branch)
- `reference_number` (text)
- `external_reference` (text)
- `smart_code_status` (text, defaults to 'DRAFT')
- `ai_confidence` (numeric(5,4))
- `ai_classification` (text)
- `ai_insights` (jsonb)
- `business_context` (jsonb) - **Deprecated**, use `metadata` instead
- `metadata` (jsonb) - Store business-specific data here
- `approval_required` (boolean)
- `approved_by` (uuid)
- `approved_at` (timestamptz)
- `fiscal_period_entity_id` (uuid)
- `fiscal_year` (integer)
- `fiscal_period` (integer)
- `posting_period_code` (text)
- `transaction_currency_code` (char(3))
- `base_currency_code` (char(3))
- `exchange_rate` (numeric(20,10))
- `exchange_rate_date` (date)
- `exchange_rate_type` (text)

### Audit Columns
- `created_at` (timestamptz, auto-generated)
- `updated_at` (timestamptz, auto-updated)
- `created_by` (uuid)
- `updated_by` (uuid)
- `version` (integer, defaults to 1)

---

## `universal_transaction_lines` Table

### Required Columns
- `id` (uuid, auto-generated)
- `organization_id` (uuid) - **REQUIRED** for multi-tenant isolation
- `transaction_id` (uuid) - **REQUIRED**, FK to universal_transactions
- `line_number` (integer) - **NOT** `line_order`! (1-based index)
- `line_type` (text) - **REQUIRED** (e.g., 'service', 'product', 'fee')
- `smart_code` (varchar(100)) - **REQUIRED** for HERA DNA

### Common Columns
- `entity_id` (uuid) - Reference to product/service entity
- `description` (text) - **NOT** `line_description`!
- `quantity` (numeric(20,8), defaults to 1)
- `unit_amount` (numeric(20,8)) - **NOT** `unit_price`!
- `line_amount` (numeric(20,8), defaults to 0)
- `discount_amount` (numeric(20,8), defaults to 0)
- `tax_amount` (numeric(20,8), defaults to 0)

### Optional Columns
- `smart_code_status` (text, defaults to 'DRAFT')
- `ai_confidence` (numeric(5,4))
- `ai_classification` (text)
- `ai_insights` (jsonb)
- `line_data` (jsonb) - **NOT** `metadata`! Store line-specific data here

### Audit Columns
- `created_at` (timestamptz, auto-generated)
- `updated_at` (timestamptz, auto-updated)
- `created_by` (uuid)
- `updated_by` (uuid)
- `version` (integer, defaults to 1)

---

## Common Mistakes to Avoid

| ❌ WRONG | ✅ CORRECT |
|----------|-----------|
| `transaction_number` | `transaction_code` |
| `status` | `transaction_status` |
| `line_order` | `line_number` |
| `line_description` | `description` |
| `unit_price` | `unit_amount` |
| `metadata` (in lines) | `line_data` |
| `p_transaction_type` (in insert) | `transaction_type` |

---

## Example Transaction Creation

```typescript
// Transaction Header
await supabase.from('universal_transactions').insert({
  organization_id: orgId,
  transaction_type: 'APPOINTMENT',
  transaction_code: 'APPT-12345678',
  transaction_date: new Date().toISOString(),
  source_entity_id: customerId,
  target_entity_id: stylistId,
  transaction_status: 'booked',
  smart_code: 'HERA.SALON.APPOINTMENT.TXN.BOOKED.V1',
  total_amount: 150.00,
  metadata: {
    status: 'booked',
    start_time: '2025-10-10T10:00:00Z',
    end_time: '2025-10-10T11:00:00Z',
    duration_minutes: 60,
    branch_id: branchId,
    notes: 'Customer prefers stylist John'
  }
})

// Transaction Lines
await supabase.from('universal_transaction_lines').insert([
  {
    organization_id: orgId,
    transaction_id: transactionId,
    line_number: 1,
    entity_id: serviceId,
    line_type: 'service',
    description: 'Haircut and Style',
    quantity: 1,
    unit_amount: 100.00,
    line_amount: 100.00,
    discount_amount: 0,
    tax_amount: 0,
    smart_code: 'HERA.SALON.SVC.LINE.STANDARD.V1',
    line_data: { service_category: 'hair', duration_minutes: 45 }
  },
  {
    organization_id: orgId,
    transaction_id: transactionId,
    line_number: 2,
    entity_id: productId,
    line_type: 'product',
    description: 'Hair Styling Product',
    quantity: 1,
    unit_amount: 50.00,
    line_amount: 50.00,
    discount_amount: 0,
    tax_amount: 0,
    smart_code: 'HERA.SALON.PROD.LINE.RETAIL.V1',
    line_data: { product_category: 'styling', brand: 'HERA Pro' }
  }
])
```

---

## Querying Transactions with Lines

```typescript
// Get transactions
const { data: transactions } = await supabase
  .from('universal_transactions')
  .select('*')
  .eq('organization_id', orgId)
  .eq('transaction_type', 'APPOINTMENT')
  .order('transaction_date', { ascending: false })

// Get lines for transactions
const transactionIds = transactions.map(t => t.id)
const { data: lines } = await supabase
  .from('universal_transaction_lines')
  .select(`
    id,
    transaction_id,
    line_number,
    entity_id,
    line_type,
    description,
    quantity,
    unit_amount,
    line_amount,
    discount_amount,
    tax_amount,
    smart_code,
    line_data
  `)
  .eq('organization_id', orgId)
  .in('transaction_id', transactionIds)
  .order('line_number')
```

---

**Last Updated**: 2025-10-08
**Source**: `/hera-migration/supabase/migrations/20251008045720_remote_schema.sql`
