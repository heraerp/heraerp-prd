-- Add unique index for POS transaction idempotency
-- This ensures that for a given organization and transaction type,
-- the external_reference (e.g., ticket ID) is unique

CREATE UNIQUE INDEX IF NOT EXISTS ux_utx_org_type_extref
ON universal_transactions (organization_id, transaction_type, external_reference)
WHERE external_reference IS NOT NULL;

-- This prevents duplicate transactions when the same POS ticket
-- is submitted multiple times (network retries, user double-clicks, etc.)