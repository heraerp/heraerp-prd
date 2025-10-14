-- =========================================================
-- Test hera_txn_create_v1 directly in Supabase SQL Editor
-- =========================================================

-- First, check if function exists
SELECT
  proname as function_name,
  pg_get_function_arguments(oid) as arguments
FROM pg_proc
WHERE proname = 'hera_txn_create_v1';

-- Test the function with a real organization ID
-- Replace the organization_id below with one from your database
SELECT hera_txn_create_v1(
  -- p_header (JSONB)
  '{
    "organization_id": "378f24fb-d496-4ff7-8afa-ea34895a0eb8",
    "transaction_type": "APPOINTMENT",
    "smart_code": "HERA.SALON.APPOINTMENT.TXN.BOOKED.V1",
    "transaction_code": "TEST-APT-001",
    "transaction_date": "2025-01-15T10:00:00Z",
    "source_entity_id": null,
    "target_entity_id": null,
    "total_amount": 0,
    "transaction_status": "draft",
    "transaction_currency_code": "AED"
  }'::jsonb,

  -- p_lines (JSONB array)
  '[
    {
      "line_number": 1,
      "entity_id": null,
      "line_type": "service",
      "description": "Haircut Service",
      "quantity": 1,
      "unit_amount": 150.00,
      "line_amount": 150.00,
      "discount_amount": 0,
      "tax_amount": 0
    },
    {
      "line_number": 2,
      "entity_id": null,
      "line_type": "service",
      "description": "Hair Coloring",
      "quantity": 1,
      "unit_amount": 100.00,
      "line_amount": 100.00,
      "discount_amount": 0,
      "tax_amount": 0
    }
  ]'::jsonb,

  -- p_actor_user_id (UUID - can be null)
  null
) as result;

-- Verify the transaction was created
SELECT
  id,
  transaction_type,
  transaction_code,
  total_amount,
  transaction_status,
  smart_code,
  created_at
FROM universal_transactions
WHERE transaction_code = 'TEST-APT-001'
ORDER BY created_at DESC
LIMIT 1;

-- Verify the transaction lines were created
SELECT
  l.line_number,
  l.description,
  l.quantity,
  l.unit_amount,
  l.line_amount,
  l.discount_amount,
  l.tax_amount,
  l.smart_code
FROM universal_transaction_lines l
JOIN universal_transactions t ON l.transaction_id = t.id
WHERE t.transaction_code = 'TEST-APT-001'
ORDER BY l.line_number;

-- Check total calculation
SELECT
  transaction_code,
  total_amount as header_total,
  (
    SELECT SUM(line_amount - discount_amount + tax_amount)
    FROM universal_transaction_lines
    WHERE transaction_id = t.id
  ) as calculated_total
FROM universal_transactions t
WHERE transaction_code = 'TEST-APT-001';
