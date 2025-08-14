-- =====================================================
-- HERA Banking-Progressive Module Universal Schema
-- Generated from Progressive Prototype Analysis
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- BANK ACCOUNTS SCHEMA
-- =====================================================

-- Sample bank accounts
INSERT INTO core_entities (
    id,
    organization_id,
    entity_type,
    entity_name,
    entity_code,
    entity_category,
    entity_subcategory,
    status,
    effective_date,
    metadata,
    ai_classification,
    ai_confidence,
    created_at,
    updated_at
) VALUES 
-- Primary Operating Account
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'bank_account',
    'Primary Operating Account - JPMorgan Chase',
    'BA001',
    'asset',
    'current_asset',
    'active',
    CURRENT_DATE,
    '{"account_type": "checking", "currency": "USD", "bank_name": "JPMorgan Chase", "is_primary": true, "overdraft_available": true}',
    'primary_operating_account',
    0.98,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- Payroll Account
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'bank_account',
    'Payroll Account - Wells Fargo',
    'BA002',
    'asset',
    'current_asset',
    'active',
    CURRENT_DATE,
    '{"account_type": "checking", "currency": "USD", "bank_name": "Wells Fargo", "is_primary": false, "purpose": "payroll"}',
    'payroll_account',
    0.96,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- Foreign Currency Account (EUR)
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'bank_account',
    'EUR Business Account - Citibank',
    'BA003',
    'asset',
    'current_asset',
    'active',
    CURRENT_DATE,
    '{"account_type": "checking", "currency": "EUR", "bank_name": "Citibank", "is_primary": false, "international": true}',
    'foreign_currency_account',
    0.94,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- Savings Account
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'bank_account',
    'Business Savings - Bank of America',
    'BA004',
    'asset',
    'current_asset',
    'active',
    CURRENT_DATE,
    '{"account_type": "savings", "currency": "USD", "bank_name": "Bank of America", "is_primary": false, "interest_bearing": true}',
    'savings_account',
    0.92,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- =====================================================
-- BANK ACCOUNT DYNAMIC DATA (Properties)
-- =====================================================

-- Get bank account IDs for dynamic data insertion
WITH bank_account_ids AS (
    SELECT id, entity_code 
    FROM core_entities 
    WHERE entity_type = 'bank_account' 
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
)

-- Primary Operating Account (BA001) properties
INSERT INTO core_dynamic_data (
    id,
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_label,
    field_description,
    field_category,
    field_value,
    field_value_number,
    field_value_boolean,
    display_order,
    is_required,
    is_searchable,
    validation_rules,
    ai_confidence,
    created_at,
    updated_at
) 
SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    ba.id,
    'account_number',
    'text',
    'Account Number',
    'Bank account number (masked for security)',
    'account_details',
    '****7890',
    NULL,
    NULL,
    1,
    true,
    false,
    '{"encryption": "required", "mask": "last_4_digits"}',
    0.99,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM bank_account_ids ba WHERE ba.entity_code = 'BA001'

UNION ALL

SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    ba.id,
    'routing_number',
    'text',
    'Routing Number',
    'Bank routing number for wire transfers and ACH',
    'account_details',
    '021000021',
    NULL,
    NULL,
    2,
    true,
    false,
    '{"encryption": "recommended", "format": "9_digits"}',
    0.98,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM bank_account_ids ba WHERE ba.entity_code = 'BA001'

UNION ALL

SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    ba.id,
    'current_balance',
    'number',
    'Current Balance',
    'Real-time account balance updated with each transaction',
    'financial_metrics',
    '125000.00',
    125000.00,
    NULL,
    3,
    false,
    true,
    '{"currency": "USD", "precision": 2, "real_time": true}',
    0.95,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM bank_account_ids ba WHERE ba.entity_code = 'BA001'

UNION ALL

SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    ba.id,
    'overdraft_limit',
    'number',
    'Overdraft Limit',
    'Maximum negative balance allowed on account',
    'account_limits',
    '50000.00',
    50000.00,
    NULL,
    4,
    false,
    false,
    '{"currency": "USD", "min": 0}',
    0.90,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM bank_account_ids ba WHERE ba.entity_code = 'BA001'

UNION ALL

SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    ba.id,
    'swift_code',
    'text',
    'SWIFT/BIC Code',
    'International wire transfer identification code',
    'international_details',
    'CHASUS33',
    NULL,
    NULL,
    5,
    false,
    false,
    '{"format": "swift_bic", "length": "8_or_11"}',
    0.88,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM bank_account_ids ba WHERE ba.entity_code = 'BA001';

-- EUR Business Account (BA003) properties
INSERT INTO core_dynamic_data (
    id, organization_id, entity_id, field_name, field_type, field_label, 
    field_category, field_value, field_value_number, field_value_boolean,
    display_order, is_required, is_searchable, ai_confidence, created_at, updated_at
)
SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', ba.id, 
    'account_number', 'text', 'Account Number', 'account_details', '****1234', NULL, NULL,
    1, true, false, 0.99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM bank_account_ids ba WHERE ba.entity_code = 'BA003'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', ba.id,
    'iban', 'text', 'IBAN', 'international_details', 'GB29 NWBK 6016 1331 9268 19', NULL, NULL,
    2, true, false, 0.97, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM bank_account_ids ba WHERE ba.entity_code = 'BA003'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', ba.id,
    'current_balance', 'number', 'Current Balance', 'financial_metrics', '45000.00', 45000.00, NULL,
    3, false, true, 0.94, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM bank_account_ids ba WHERE ba.entity_code = 'BA003'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', ba.id,
    'swift_code', 'text', 'SWIFT/BIC Code', 'international_details', 'CITIUS33', NULL, NULL,
    4, false, false, 0.90, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM bank_account_ids ba WHERE ba.entity_code = 'BA003';

-- =====================================================
-- CURRENCY ENTITIES
-- =====================================================

-- Currency entities for multi-currency support
INSERT INTO core_entities (
    id,
    organization_id,
    entity_type,
    entity_name,
    entity_code,
    entity_category,
    status,
    metadata,
    ai_classification,
    ai_confidence,
    created_at,
    updated_at
) VALUES 
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'currency',
    'US Dollar',
    'USD',
    'currency',
    'active',
    '{"is_base_currency": true, "decimal_places": 2, "symbol": "$", "iso_code": "USD"}',
    'base_currency',
    0.99,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'currency',
    'Euro',
    'EUR',
    'currency',
    'active',
    '{"is_base_currency": false, "decimal_places": 2, "symbol": "€", "iso_code": "EUR"}',
    'foreign_currency',
    0.98,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'currency',
    'British Pound',
    'GBP',
    'currency',
    'active',
    '{"is_base_currency": false, "decimal_places": 2, "symbol": "£", "iso_code": "GBP"}',
    'foreign_currency',
    0.97,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- =====================================================
-- BANK TRANSACTIONS (Universal Transactions)
-- =====================================================

-- Sample banking transactions
INSERT INTO universal_transactions (
    id,
    organization_id,
    transaction_type,
    transaction_number,
    transaction_date,
    reference_number,
    external_reference,
    source_entity_id,
    target_entity_id,
    total_amount,
    currency,
    status,
    workflow_state,
    priority,
    description,
    notes,
    metadata,
    ai_insights,
    ai_risk_score,
    ai_anomaly_score,
    created_by,
    created_at,
    updated_at
) 
SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'bank_transfer',
    'TXN-2024-8901',
    '2024-12-10'::date,
    'WR-789012',
    'SUPPLIER-PAY-456',
    ba.id, -- Primary Operating Account
    NULL,
    15000.00,
    'USD',
    'completed',
    'reconciled',
    'high',
    'Wire transfer to equipment supplier',
    'Payment for manufacturing equipment as per PO-2024-789',
    '{"transfer_type": "wire", "fees": 25.00, "beneficiary": "TechEquipment Ltd", "purpose": "Equipment Purchase"}',
    '[
        {
            "type": "fraud_detection",
            "message": "Transaction pattern normal. No fraud indicators detected.",
            "confidence": 96,
            "priority": "low"
        },
        {
            "type": "cash_flow_impact",
            "message": "Large outgoing transfer. Monitor cash position for next 5 days.",
            "confidence": 88,
            "priority": "medium"
        }
    ]',
    8,
    2,
    'treasury_user',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM core_entities ba 
WHERE ba.entity_code = 'BA001' 
AND ba.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';

-- Customer payment deposit
INSERT INTO universal_transactions (
    id, organization_id, transaction_type, transaction_number, transaction_date,
    reference_number, source_entity_id, total_amount, currency, status, workflow_state,
    description, ai_insights, ai_risk_score, created_at, updated_at
) 
SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', 'bank_deposit', 'DEP-2024-3456',
    '2024-12-09'::date, 'ACH-CUST-789', ba.id, 8500.00, 'USD', 'completed', 'reconciled',
    'Customer payment received via ACH - TechCorp Solutions',
    '[
        {
            "type": "pattern_analysis",
            "message": "Regular customer payment pattern. Expected timing and amount.",
            "confidence": 94,
            "priority": "low"
        },
        {
            "type": "cash_flow_positive", 
            "message": "Positive cash flow impact. Improves weekly cash position by 6.8%.",
            "confidence": 91,
            "priority": "medium"
        }
    ]',
    5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM core_entities ba WHERE ba.entity_code = 'BA001' AND ba.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';

-- Bank fee transaction
INSERT INTO universal_transactions (
    id, organization_id, transaction_type, transaction_number, transaction_date,
    reference_number, source_entity_id, total_amount, currency, status, workflow_state,
    description, ai_insights, ai_risk_score, created_at, updated_at
) 
SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', 'bank_fee', 'FEE-2024-1201',
    '2024-12-01'::date, 'MONTHLY-MAINT-FEE', ba.id, 25.00, 'USD', 'completed', 'reconciled',
    'Monthly account maintenance fee - December 2024',
    '[
        {
            "type": "recurring_expense",
            "message": "Regular monthly maintenance fee. Consider negotiating fee waiver based on balance.",
            "confidence": 98,
            "priority": "low",
            "potential_savings": 300
        }
    ]',
    1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM core_entities ba WHERE ba.entity_code = 'BA001' AND ba.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';

-- Foreign exchange transaction (EUR)
INSERT INTO universal_transactions (
    id, organization_id, transaction_type, transaction_number, transaction_date,
    reference_number, source_entity_id, target_entity_id, total_amount, currency,
    status, workflow_state, description, ai_insights, ai_risk_score, metadata, created_at, updated_at
) 
SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', 'fx_transfer', 'FX-2024-1205',
    '2024-12-05'::date, 'FX-USD-EUR-001', ba_usd.id, ba_eur.id, 20000.00, 'USD',
    'completed', 'reconciled', 'Currency conversion USD to EUR for European supplier payment',
    '[
        {
            "type": "fx_rate_analysis",
            "message": "Favorable exchange rate. 2.3% better than 30-day average.",
            "confidence": 92,
            "priority": "medium",
            "rate_advantage": 0.023
        }
    ]',
    12, '{"exchange_rate": 0.92, "eur_amount": 18400.00, "fx_fees": 45.00}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM core_entities ba_usd, core_entities ba_eur
WHERE ba_usd.entity_code = 'BA001' AND ba_eur.entity_code = 'BA003' 
AND ba_usd.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
AND ba_eur.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';

-- =====================================================
-- EXCHANGE RATES (Stored as transactions)
-- =====================================================

-- Daily exchange rates
INSERT INTO universal_transactions (
    id,
    organization_id,
    transaction_type,
    transaction_number,
    transaction_date,
    source_entity_id,
    target_entity_id,
    total_amount,
    currency,
    status,
    description,
    metadata,
    created_at,
    updated_at
) 
SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'exchange_rate',
    'FX-USD-EUR-20241210',
    CURRENT_DATE,
    usd.id,
    eur.id,
    0.92,
    'RATE',
    'active',
    'Daily exchange rate USD to EUR',
    '{"rate_source": "ECB", "rate_type": "daily", "valid_until": "2024-12-11", "bid": 0.9195, "ask": 0.9205}',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM core_entities usd, core_entities eur
WHERE usd.entity_code = 'USD' AND eur.entity_code = 'EUR'
AND usd.entity_type = 'currency' AND eur.entity_type = 'currency'
AND usd.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
AND eur.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';

-- USD to GBP rate
INSERT INTO universal_transactions (
    id, organization_id, transaction_type, transaction_number, transaction_date,
    source_entity_id, target_entity_id, total_amount, currency, status,
    description, metadata, created_at, updated_at
) 
SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', 'exchange_rate', 'FX-USD-GBP-20241210',
    CURRENT_DATE, usd.id, gbp.id, 0.79, 'RATE', 'active',
    'Daily exchange rate USD to GBP',
    '{"rate_source": "BOE", "rate_type": "daily", "valid_until": "2024-12-11", "bid": 0.7895, "ask": 0.7905}',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM core_entities usd, core_entities gbp
WHERE usd.entity_code = 'USD' AND gbp.entity_code = 'GBP'
AND usd.entity_type = 'currency' AND gbp.entity_type = 'currency'
AND usd.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
AND gbp.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';

-- =====================================================
-- TRANSACTION DETAILS (Universal Transaction Lines)
-- =====================================================

-- Wire transfer details
WITH wire_txn_id AS (
    SELECT id FROM universal_transactions 
    WHERE transaction_number = 'TXN-2024-8901'
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
)
INSERT INTO universal_transaction_lines (
    id,
    transaction_id,
    organization_id,
    line_description,
    line_order,
    quantity,
    unit_price,
    line_amount,
    gl_account_code,
    notes,
    metadata,
    created_at,
    updated_at
) 
SELECT 
    uuid_generate_v4(),
    w.id,
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'Wire transfer principal amount',
    1,
    1,
    15000.00,
    15000.00,
    '1100',
    'Outgoing wire transfer - equipment purchase',
    '{"transaction_code": "WIRE_OUT", "beneficiary_bank": "TechBank NA", "beneficiary_name": "TechEquipment Ltd"}',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM wire_txn_id w

UNION ALL

SELECT 
    uuid_generate_v4(), w.id, '719dfed1-09b4-4ca8-bfda-f682460de945',
    'Wire transfer fee', 2, 1, 25.00, 25.00, '6200',
    'Bank wire transfer fee',
    '{"fee_type": "wire_transfer", "fee_category": "banking"}',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM wire_txn_id w;

-- Customer payment deposit details
WITH deposit_txn_id AS (
    SELECT id FROM universal_transactions 
    WHERE transaction_number = 'DEP-2024-3456'
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
)
INSERT INTO universal_transaction_lines (
    id, transaction_id, organization_id, line_description, line_order, quantity,
    unit_price, line_amount, gl_account_code, notes, metadata, created_at, updated_at
) 
SELECT 
    uuid_generate_v4(), d.id, '719dfed1-09b4-4ca8-bfda-f682460de945',
    'Customer payment received - TechCorp Solutions', 1, 1, 8500.00, 8500.00, '1100',
    'ACH deposit from customer account',
    '{"payment_method": "ACH", "customer_bank": "First National", "settlement_date": "2024-12-09"}',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM deposit_txn_id d;

-- =====================================================
-- BANK-ACCOUNT RELATIONSHIPS
-- =====================================================

-- Create relationships between banks and accounts (if bank entities exist)
-- For now, we'll create account-to-account relationships for transfers
WITH transfer_relationships AS (
    SELECT DISTINCT
        ut.source_entity_id,
        ut.target_entity_id,
        'bank_transfer' as relationship_type
    FROM universal_transactions ut
    WHERE ut.transaction_type IN ('fx_transfer', 'bank_transfer')
    AND ut.source_entity_id IS NOT NULL 
    AND ut.target_entity_id IS NOT NULL
    AND ut.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
)
INSERT INTO core_relationships (
    id,
    organization_id,
    source_entity_id,
    target_entity_id,
    relationship_type,
    relationship_label,
    relationship_strength,
    is_bidirectional,
    is_active,
    workflow_state,
    relationship_data,
    effective_date,
    ai_discovered,
    ai_confidence,
    created_at,
    updated_at
)
SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    tr.source_entity_id,
    tr.target_entity_id,
    tr.relationship_type,
    'Banking Transfer Relationship',
    0.90,
    true,
    true,
    'active',
    '{"transfer_enabled": true, "fx_enabled": true, "auto_reconcile": true}',
    CURRENT_DATE,
    true,
    0.95,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM transfer_relationships tr;

-- =====================================================
-- VALIDATION TRIGGERS AND FUNCTIONS
-- =====================================================

-- Bank account validation function
CREATE OR REPLACE FUNCTION validate_bank_account()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate bank account entity
    IF NEW.entity_type = 'bank_account' THEN
        -- Check bank account code format (BA + digits)
        IF NEW.entity_code !~ '^BA[0-9]{3,}$' THEN
            RAISE EXCEPTION 'Bank account code must follow format BA001, BA002, etc. Got: %', NEW.entity_code;
        END IF;
        
        -- Ensure bank account name is unique per organization
        IF EXISTS (
            SELECT 1 FROM core_entities 
            WHERE organization_id = NEW.organization_id 
            AND entity_type = 'bank_account'
            AND entity_name = NEW.entity_name
            AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        ) THEN
            RAISE EXCEPTION 'Bank account name "%" already exists in organization', NEW.entity_name;
        END IF;
        
        -- Validate account category is asset
        IF NEW.entity_category != 'asset' THEN
            RAISE EXCEPTION 'Bank accounts must be classified as assets';
        END IF;
        
        -- Set default values
        NEW.status := COALESCE(NEW.status, 'active');
        NEW.effective_date := COALESCE(NEW.effective_date, CURRENT_DATE);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create bank account validation trigger
DROP TRIGGER IF EXISTS validate_bank_account_trigger ON core_entities;
CREATE TRIGGER validate_bank_account_trigger
    BEFORE INSERT OR UPDATE ON core_entities
    FOR EACH ROW
    WHEN (NEW.entity_type = 'bank_account')
    EXECUTE FUNCTION validate_bank_account();

-- Banking transaction validation function
CREATE OR REPLACE FUNCTION validate_bank_transaction()
RETURNS TRIGGER AS $$
DECLARE
    account_exists boolean := false;
    account_active boolean := false;
    account_balance DECIMAL(15,2) := 0;
    overdraft_limit DECIMAL(15,2) := 0;
BEGIN
    -- Validate banking transactions
    IF NEW.transaction_type IN ('bank_transfer', 'bank_deposit', 'bank_withdrawal', 'bank_fee', 'fx_transfer') THEN
        -- Ensure transaction has source bank account
        IF NEW.source_entity_id IS NULL THEN
            RAISE EXCEPTION 'Bank transaction must have a source bank account (source_entity_id)';
        END IF;
        
        -- Validate bank account exists and is active
        SELECT 
            EXISTS(SELECT 1 FROM core_entities WHERE id = NEW.source_entity_id),
            EXISTS(SELECT 1 FROM core_entities 
                  WHERE id = NEW.source_entity_id 
                  AND entity_type = 'bank_account'
                  AND status = 'active'
                  AND organization_id = NEW.organization_id)
        INTO account_exists, account_active;
        
        IF NOT account_exists THEN
            RAISE EXCEPTION 'Bank account with ID % does not exist', NEW.source_entity_id;
        END IF;
        
        IF NOT account_active THEN
            RAISE EXCEPTION 'Bank account is not active for transaction';
        END IF;
        
        -- Balance and overdraft check for outgoing transactions
        IF NEW.transaction_type IN ('bank_transfer', 'bank_withdrawal', 'bank_fee', 'fx_transfer') THEN
            -- Get current balance and overdraft limit
            SELECT 
                COALESCE(
                    (SELECT field_value_number FROM core_dynamic_data 
                     WHERE entity_id = NEW.source_entity_id AND field_name = 'current_balance'), 
                    0
                ),
                COALESCE(
                    (SELECT field_value_number FROM core_dynamic_data 
                     WHERE entity_id = NEW.source_entity_id AND field_name = 'overdraft_limit'), 
                    0
                )
            INTO account_balance, overdraft_limit;
            
            IF (account_balance - NEW.total_amount) < -overdraft_limit THEN
                RAISE EXCEPTION 'Transaction would exceed overdraft limit. Balance: $%, Overdraft: $%, Transaction: $%', 
                    account_balance, overdraft_limit, NEW.total_amount;
            END IF;
        END IF;
        
        -- Currency validation
        IF NEW.currency IS NULL OR NEW.currency = '' THEN
            RAISE EXCEPTION 'Bank transaction must specify currency';
        END IF;
        
        -- Amount validation
        IF NEW.total_amount <= 0 THEN
            RAISE EXCEPTION 'Bank transaction amount must be positive, got %', NEW.total_amount;
        END IF;
        
        -- Set default values
        NEW.status := COALESCE(NEW.status, 'pending');
        NEW.workflow_state := COALESCE(NEW.workflow_state, 'created');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create banking transaction validation trigger
DROP TRIGGER IF EXISTS validate_bank_transaction_trigger ON universal_transactions;
CREATE TRIGGER validate_bank_transaction_trigger
    BEFORE INSERT OR UPDATE ON universal_transactions
    FOR EACH ROW
    WHEN (NEW.transaction_type IN ('bank_transfer', 'bank_deposit', 'bank_withdrawal', 'bank_fee', 'fx_transfer'))
    EXECUTE FUNCTION validate_bank_transaction();

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Bank account lookup optimization
CREATE INDEX IF NOT EXISTS idx_bank_accounts_by_org 
ON core_entities (organization_id, entity_type, status) 
WHERE entity_type = 'bank_account';

-- Banking transaction queries optimization
CREATE INDEX IF NOT EXISTS idx_bank_transactions_by_org_type 
ON universal_transactions (organization_id, transaction_type, transaction_date, status)
WHERE transaction_type IN ('bank_transfer', 'bank_deposit', 'bank_withdrawal', 'bank_fee', 'fx_transfer');

-- Bank account-transaction relationship lookup
CREATE INDEX IF NOT EXISTS idx_bank_transactions_by_account 
ON universal_transactions (organization_id, source_entity_id, transaction_type)
WHERE transaction_type IN ('bank_transfer', 'bank_deposit', 'bank_withdrawal', 'bank_fee', 'fx_transfer');

-- Bank account dynamic data lookup optimization
CREATE INDEX IF NOT EXISTS idx_bank_account_dynamic_data 
ON core_dynamic_data (organization_id, entity_id, field_name, field_type)
WHERE field_name IN ('current_balance', 'account_number', 'swift_code', 'overdraft_limit');

-- Multi-currency transaction optimization
CREATE INDEX IF NOT EXISTS idx_bank_multi_currency 
ON universal_transactions (organization_id, currency, transaction_date, total_amount)
WHERE transaction_type IN ('bank_transfer', 'fx_transfer', 'bank_deposit');

-- Exchange rate lookup optimization
CREATE INDEX IF NOT EXISTS idx_exchange_rates 
ON universal_transactions (organization_id, transaction_type, transaction_date, source_entity_id, target_entity_id)
WHERE transaction_type = 'exchange_rate';

-- Cash flow analysis optimization
CREATE INDEX IF NOT EXISTS idx_bank_cash_flow_analysis 
ON universal_transactions (organization_id, transaction_date, transaction_type, total_amount, currency, status)
WHERE transaction_type IN ('bank_transfer', 'bank_deposit', 'bank_withdrawal', 'fx_transfer');

-- =====================================================
-- SAMPLE DATA SUMMARY
-- =====================================================

-- Summary of created banking data
DO $$
DECLARE
    bank_account_count integer;
    currency_count integer;
    bank_transaction_count integer;
    line_count integer;
    relationship_count integer;
    dynamic_data_count integer;
    total_usd_balance DECIMAL(15,2);
    total_eur_balance DECIMAL(15,2);
    daily_cash_flow DECIMAL(15,2);
BEGIN
    SELECT COUNT(*) INTO bank_account_count 
    FROM core_entities 
    WHERE entity_type = 'bank_account' 
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    SELECT COUNT(*) INTO currency_count 
    FROM core_entities 
    WHERE entity_type = 'currency' 
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    SELECT COUNT(*) INTO bank_transaction_count 
    FROM universal_transactions 
    WHERE transaction_type IN ('bank_transfer', 'bank_deposit', 'bank_withdrawal', 'bank_fee', 'fx_transfer')
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    SELECT COUNT(*) INTO line_count 
    FROM universal_transaction_lines utl
    JOIN universal_transactions ut ON utl.transaction_id = ut.id
    WHERE ut.transaction_type IN ('bank_transfer', 'bank_deposit', 'bank_withdrawal', 'bank_fee', 'fx_transfer')
    AND utl.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    SELECT COUNT(*) INTO relationship_count 
    FROM core_relationships 
    WHERE relationship_type = 'bank_transfer' 
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    SELECT COUNT(*) INTO dynamic_data_count 
    FROM core_dynamic_data cdd
    JOIN core_entities ce ON cdd.entity_id = ce.id
    WHERE ce.entity_type = 'bank_account'
    AND cdd.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    -- Calculate balances by currency
    SELECT 
        COALESCE(SUM(CASE WHEN cdd.field_name = 'current_balance' AND ba.metadata->>'currency' = 'USD' 
                         THEN cdd.field_value_number ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN cdd.field_name = 'current_balance' AND ba.metadata->>'currency' = 'EUR' 
                         THEN cdd.field_value_number ELSE 0 END), 0)
    INTO total_usd_balance, total_eur_balance
    FROM core_dynamic_data cdd
    JOIN core_entities ba ON cdd.entity_id = ba.id
    WHERE ba.entity_type = 'bank_account' AND cdd.field_name = 'current_balance'
    AND ba.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    -- Calculate daily cash flow
    SELECT 
        COALESCE(SUM(CASE 
            WHEN ut.transaction_type IN ('bank_deposit') THEN ut.total_amount 
            WHEN ut.transaction_type IN ('bank_transfer', 'bank_withdrawal', 'bank_fee') THEN -ut.total_amount 
            ELSE 0 
        END), 0)
    INTO daily_cash_flow
    FROM universal_transactions ut
    WHERE ut.transaction_type IN ('bank_transfer', 'bank_deposit', 'bank_withdrawal', 'bank_fee')
    AND ut.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
    AND ut.transaction_date = CURRENT_DATE;
    
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'HERA Banking-Progressive Module Schema Created Successfully';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Bank Accounts Created: %', bank_account_count;
    RAISE NOTICE 'Currencies Supported: %', currency_count;
    RAISE NOTICE 'Bank Transactions Created: %', bank_transaction_count;
    RAISE NOTICE 'Transaction Line Items: %', line_count;
    RAISE NOTICE 'Banking Relationships: %', relationship_count;
    RAISE NOTICE 'Dynamic Data Fields: %', dynamic_data_count;
    RAISE NOTICE '----------------------------------------------------';
    RAISE NOTICE 'Financial Summary:';
    RAISE NOTICE 'Total USD Balance: $%', total_usd_balance;
    RAISE NOTICE 'Total EUR Balance: €%', total_eur_balance;
    RAISE NOTICE 'Today''s Net Cash Flow: $%', daily_cash_flow;
    RAISE NOTICE 'Cash Flow Status: %', CASE WHEN daily_cash_flow > 0 THEN 'POSITIVE ✓' ELSE 'NEGATIVE ⚠' END;
    RAISE NOTICE '====================================================';
END
$$;