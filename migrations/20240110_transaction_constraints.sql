-- Optional transaction constraints for HERA architecture enforcement
-- These are soft checks that can be monitored rather than hard enforced

-- Header must match summed lines (soft check; prefer enforced in RPC + monitored)
ALTER TABLE universal_transactions
ADD CONSTRAINT chk_amount_total_nonnull 
CHECK (amount_total IS NOT NULL);

-- Transaction type whitelist
ALTER TABLE universal_transactions
ADD CONSTRAINT chk_transaction_type_whitelist
CHECK (transaction_type IN (
  'JOURNAL',
  'SALES_INVOICE',
  'SALES_RECEIPT',
  'PURCHASE_BILL',
  'PAYMENT',
  'ADJUSTMENT'
));

-- Smart code format validation
ALTER TABLE universal_transactions
ADD CONSTRAINT chk_smart_code_format
CHECK (smart_code ~ '^HERA\.[A-Z0-9]{2,15}(\.[A-Z0-9_]{1,30}){2,8}\.V[0-9]+$');

-- Entity type format validation
ALTER TABLE core_entities
ADD CONSTRAINT chk_entity_type_format
CHECK (entity_type ~ '^[A-Z0-9_]+$');

-- Dynamic field name format
ALTER TABLE core_dynamic_data
ADD CONSTRAINT chk_field_name_format
CHECK (field_name ~ '^[a-z0-9_]{2,40}$');

-- Note: These constraints are optional and can be adjusted based on 
-- your deployment strategy. The RPC layer should enforce these rules
-- regardless of database-level constraints.