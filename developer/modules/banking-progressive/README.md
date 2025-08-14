# Banking-Progressive Module Developer Guide

## 🧬 HERA DNA Module: Banking & Cash Management Progressive

### **Business Process Overview**
This module handles comprehensive banking operations including multi-currency accounts, cash flow forecasting, fraud detection, and automated reconciliation with AI-powered insights.

## 📊 Universal Schema Mapping

### **Core Entities Mapping**

#### **1. Bank Accounts → `core_entities`**
```sql
-- Bank Account Entity
INSERT INTO core_entities (
    organization_id,
    entity_type,
    entity_name,
    entity_code,
    entity_category,
    entity_subcategory,
    status,
    metadata
) VALUES (
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'bank_account',
    'Primary Operating Account - Chase',
    'BA001',
    'asset',
    'current_asset',
    'active',
    '{"account_type": "checking", "currency": "USD", "bank_name": "JPMorgan Chase", "is_primary": true}'
);
```

#### **2. Bank Account Properties → `core_dynamic_data`**
```sql
-- Account Number (Encrypted)
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_label,
    field_value,
    field_category
) VALUES (
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    '{bank_account_entity_id}',
    'account_number',
    'text',
    'Account Number',
    '****7890',
    'account_details'
);

-- Current Balance
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_value_number,
    field_category
) VALUES (
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    '{bank_account_entity_id}',
    'current_balance',
    'number',
    125000.00,
    'financial_metrics'
);

-- SWIFT/IBAN Code
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_value,
    field_category
) VALUES (
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    '{bank_account_entity_id}',
    'swift_code',
    'text',
    'CHASUS33',
    'international_details'
);
```

#### **3. Bank Transactions → `universal_transactions`**
```sql
INSERT INTO universal_transactions (
    organization_id,
    transaction_type,
    transaction_number,
    transaction_date,
    source_entity_id,  -- Links to bank account
    target_entity_id,  -- Links to counterparty if applicable
    total_amount,
    currency,
    status,
    workflow_state,
    ai_risk_score,
    ai_insights,
    metadata
) VALUES (
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'bank_transfer',
    'TXN-2024-8901',
    '2024-12-10',
    '{bank_account_entity_id}',
    '{counterparty_entity_id}',
    15000.00,
    'USD',
    'completed',
    'reconciled',
    8,
    '[{"type":"fraud_detection","message":"Transaction pattern normal. No fraud indicators detected.","confidence":96}]',
    '{"transfer_type": "wire", "reference_number": "WR-789012", "fees": 25.00, "exchange_rate": null}'
);
```

#### **4. Transaction Details → `universal_transaction_lines`**
```sql
INSERT INTO universal_transaction_lines (
    transaction_id,
    organization_id,
    line_description,
    line_order,
    quantity,
    unit_price,
    line_amount,
    gl_account_code,
    notes,
    metadata
) VALUES (
    '{bank_transaction_id}',
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'Wire transfer to supplier - Equipment purchase',
    1,
    1,
    15000.00,
    15000.00,
    '1100',
    'Outgoing wire transfer',
    '{"transaction_code": "WIRE_OUT", "beneficiary": "TechEquipment Ltd", "purpose": "Equipment Purchase"}'
);
```

#### **5. Bank-Account Relationships → `core_relationships`**
```sql
INSERT INTO core_relationships (
    organization_id,
    source_entity_id,     -- Bank entity
    target_entity_id,     -- Bank account entity
    relationship_type,
    relationship_label,
    is_active,
    workflow_state,
    relationship_data
) VALUES (
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    '{bank_entity_id}',
    '{bank_account_entity_id}',
    'bank_account',
    'Bank Account Relationship',
    true,
    'active',
    '{"account_type": "checking", "overdraft_limit": 50000, "interest_rate": 0.5, "maintenance_fee": 25}'
);
```

## 🔧 Business Rules & Validations

### **Bank Account Validation Rules**
```sql
-- Bank account validation
CREATE OR REPLACE FUNCTION validate_bank_account()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure bank account has required fields
    IF NEW.entity_type = 'bank_account' THEN
        -- Check for required bank account code format
        IF NEW.entity_code !~ '^BA[0-9]{3,}$' THEN
            RAISE EXCEPTION 'Bank account code must follow format BA001, BA002, etc.';
        END IF;
        
        -- Ensure bank account name is unique per organization
        IF EXISTS (
            SELECT 1 FROM core_entities 
            WHERE organization_id = NEW.organization_id 
            AND entity_type = 'bank_account'
            AND entity_name = NEW.entity_name
            AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        ) THEN
            RAISE EXCEPTION 'Bank account name must be unique within organization';
        END IF;
        
        -- Validate account category is asset
        IF NEW.entity_category != 'asset' THEN
            RAISE EXCEPTION 'Bank accounts must be classified as assets';
        END IF;
        
        -- Set default status
        NEW.status := COALESCE(NEW.status, 'active');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_bank_account_trigger
    BEFORE INSERT OR UPDATE ON core_entities
    FOR EACH ROW
    WHEN (NEW.entity_type = 'bank_account')
    EXECUTE FUNCTION validate_bank_account();
```

### **Banking Transaction Validation**
```sql
CREATE OR REPLACE FUNCTION validate_bank_transaction()
RETURNS TRIGGER AS $$
DECLARE
    account_balance DECIMAL(15,2);
    overdraft_limit DECIMAL(15,2) := 0;
BEGIN
    -- Validate banking transactions
    IF NEW.transaction_type IN ('bank_transfer', 'bank_deposit', 'bank_withdrawal', 'bank_fee') THEN
        -- Ensure transaction has source bank account
        IF NEW.source_entity_id IS NULL THEN
            RAISE EXCEPTION 'Bank transaction must have a source bank account';
        END IF;
        
        -- Validate bank account exists and is active
        IF NOT EXISTS (
            SELECT 1 FROM core_entities 
            WHERE id = NEW.source_entity_id 
            AND entity_type = 'bank_account'
            AND status = 'active'
            AND organization_id = NEW.organization_id
        ) THEN
            RAISE EXCEPTION 'Invalid or inactive bank account for transaction';
        END IF;
        
        -- Balance and overdraft check for outgoing transactions
        IF NEW.transaction_type IN ('bank_transfer', 'bank_withdrawal', 'bank_fee') THEN
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
                RAISE EXCEPTION 'Transaction would exceed overdraft limit. Balance: %, Overdraft: %, Transaction: %', 
                    account_balance, overdraft_limit, NEW.total_amount;
            END IF;
        END IF;
        
        -- Currency validation
        IF NEW.currency IS NULL OR NEW.currency = '' THEN
            RAISE EXCEPTION 'Bank transaction must specify currency';
        END IF;
        
        -- Amount validation
        IF NEW.total_amount <= 0 THEN
            RAISE EXCEPTION 'Bank transaction amount must be positive';
        END IF;
        
        -- Set defaults
        NEW.status := COALESCE(NEW.status, 'pending');
        NEW.workflow_state := COALESCE(NEW.workflow_state, 'created');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_bank_transaction_trigger
    BEFORE INSERT OR UPDATE ON universal_transactions
    FOR EACH ROW
    WHEN (NEW.transaction_type IN ('bank_transfer', 'bank_deposit', 'bank_withdrawal', 'bank_fee'))
    EXECUTE FUNCTION validate_bank_transaction();
```

## 🔐 Row Level Security (RLS)

### **Multi-Tenant Security**
```sql
-- Bank account access policy
CREATE POLICY bank_account_access_policy ON core_entities
    FOR ALL 
    TO authenticated
    USING (
        organization_id = current_setting('app.current_organization_id')::uuid
        AND entity_type = 'bank_account'
    );

-- Banking transaction access policy  
CREATE POLICY bank_transaction_access_policy ON universal_transactions
    FOR ALL
    TO authenticated  
    USING (
        organization_id = current_setting('app.current_organization_id')::uuid
        AND transaction_type IN ('bank_transfer', 'bank_deposit', 'bank_withdrawal', 'bank_fee')
    );

-- Bank account dynamic data policy (with encryption considerations)
CREATE POLICY bank_account_dynamic_data_policy ON core_dynamic_data
    FOR ALL
    TO authenticated
    USING (
        organization_id = current_setting('app.current_organization_id')::uuid
        AND EXISTS (
            SELECT 1 FROM core_entities ce
            WHERE ce.id = core_dynamic_data.entity_id
            AND ce.entity_type = 'bank_account'
            AND ce.organization_id = core_dynamic_data.organization_id
        )
    );
```

## 🎯 Smart Codes for Banking Module

### **Banking Transaction Smart Codes**
```sql
-- Banking Smart Code mapping
INSERT INTO smart_code_registry (
    smart_code,
    description,
    business_logic,
    gl_mapping,
    validation_rules
) VALUES 
(
    'HERA.BANK.ACCOUNT.CREATE.v1',
    'Create new bank account with validation and setup',
    '{
        "entity_type": "bank_account",
        "required_fields": ["entity_name", "entity_code"],
        "validation": "bank_account_format",
        "encryption": ["account_number", "routing_number"],
        "auto_generate": ["entity_code"]
    }',
    '{"gl_account": "1100", "account_type": "asset"}',
    '["unique_account_name", "valid_account_code", "encryption_required"]'
),
(
    'HERA.BANK.TRANSFER.CREATE.v1', 
    'Process bank transfer with fraud detection and GL posting',
    '{
        "transaction_type": "bank_transfer",
        "auto_post_gl": true,
        "fraud_detection": true,
        "balance_check": true,
        "multi_currency": true
    }',
    '{
        "debit_account": "varies_by_purpose",
        "credit_account": "1100_cash_account"
    }',
    '["sufficient_balance", "valid_counterparty", "currency_supported", "fraud_check_clear"]'
),
(
    'HERA.BANK.DEPOSIT.PROCESS.v1',
    'Process bank deposit with automatic reconciliation',
    '{
        "transaction_type": "bank_deposit", 
        "auto_post_gl": true,
        "auto_reconcile": true,
        "duplicate_detection": true
    }',
    '{
        "debit_account": "1100_cash_account",
        "credit_account": "varies_by_source"
    }',
    '["valid_deposit_source", "positive_amount", "currency_match"]'
),
(
    'HERA.BANK.RECONCILE.AUTO.v1',
    'Automated bank reconciliation with AI matching',
    '{
        "process_type": "bank_reconciliation",
        "ai_matching": true,
        "auto_clear": true,
        "exception_handling": true
    }',
    '{}',
    '["statement_uploaded", "date_range_valid", "account_active"]'
);
```

## 🌍 Multi-Currency Support

### **Currency Entities and Exchange Rates**
```sql
-- Currency entities
INSERT INTO core_entities (
    organization_id,
    entity_type,
    entity_name,
    entity_code,
    entity_category,
    status,
    metadata
) VALUES 
(
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'currency',
    'US Dollar',
    'USD',
    'currency',
    'active',
    '{"is_base_currency": true, "decimal_places": 2, "symbol": "$"}'
),
(
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'currency',
    'Euro',
    'EUR',
    'currency',
    'active',
    '{"is_base_currency": false, "decimal_places": 2, "symbol": "€"}'
);

-- Exchange rates stored as transactions
INSERT INTO universal_transactions (
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
    metadata
) VALUES (
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'exchange_rate',
    'FX-USD-EUR-20241210',
    CURRENT_DATE,
    (SELECT id FROM core_entities WHERE entity_code = 'USD' AND entity_type = 'currency'),
    (SELECT id FROM core_entities WHERE entity_code = 'EUR' AND entity_type = 'currency'),
    0.92,
    'RATE',
    'active',
    'Daily exchange rate USD to EUR',
    '{"rate_source": "ECB", "rate_type": "daily", "valid_until": "2024-12-11"}'
);
```

## 🔄 Progressive to Universal Migration

### **Migration Process**
```bash
# Step 1: Analyze progressive banking data patterns
npm run analyze-progressive-data --module=banking-progressive

# Step 2: Generate universal schema from patterns  
npm run generate-universal-mapping --source=banking-progressive

# Step 3: Migrate data to universal tables
npm run migrate-to-universal --module=banking-progressive --dry-run
npm run migrate-to-universal --module=banking-progressive --execute

# Step 4: Update UI to use Universal API
npm run update-api-endpoints --module=banking-progressive --target=universal
```

## 📋 Developer Checklist

### **Schema Validation**
- [ ] All bank accounts mapped to `core_entities` with `entity_type='bank_account'`
- [ ] Account details stored in `core_dynamic_data` with encryption for sensitive fields
- [ ] Bank transactions stored in `universal_transactions` with appropriate transaction types
- [ ] Transaction details in `universal_transaction_lines`
- [ ] Bank-account relationships in `core_relationships`

### **Business Rules**
- [ ] Bank account validation triggers implemented
- [ ] Banking transaction validation with balance checks
- [ ] Multi-currency exchange rate handling
- [ ] Fraud detection integration
- [ ] Overdraft limit enforcement

### **Security**
- [ ] RLS policies for multi-tenant isolation
- [ ] Encryption for sensitive banking data (account numbers, routing numbers)
- [ ] User role-based permissions for banking operations
- [ ] Audit trail for all banking transactions

### **API Integration**
- [ ] All CRUD operations use `/api/v1/universal`
- [ ] Proper organization_id filtering
- [ ] Multi-currency transaction handling
- [ ] Real-time balance updates

## 🚀 Performance Considerations

### **Indexing Strategy**
```sql
-- Bank account lookup optimization
CREATE INDEX idx_bank_accounts_by_org ON core_entities (organization_id, entity_type, status) 
WHERE entity_type = 'bank_account';

-- Banking transaction queries
CREATE INDEX idx_bank_transactions_by_org ON universal_transactions 
(organization_id, transaction_type, transaction_date, status)
WHERE transaction_type IN ('bank_transfer', 'bank_deposit', 'bank_withdrawal', 'bank_fee');

-- Bank account dynamic data lookup
CREATE INDEX idx_bank_account_dynamic_data ON core_dynamic_data 
(organization_id, entity_id, field_name)
WHERE field_name IN ('current_balance', 'account_number', 'swift_code');

-- Multi-currency transaction optimization
CREATE INDEX idx_bank_multi_currency ON universal_transactions 
(organization_id, currency, transaction_date, total_amount);
```

### **Query Optimization**
```sql
-- Optimized cash flow analysis query
SELECT 
    DATE_TRUNC('day', ut.transaction_date) as transaction_day,
    ba.entity_name as bank_account,
    ut.currency,
    SUM(CASE 
        WHEN ut.transaction_type IN ('bank_deposit') THEN ut.total_amount 
        ELSE 0 
    END) as total_inflows,
    SUM(CASE 
        WHEN ut.transaction_type IN ('bank_transfer', 'bank_withdrawal', 'bank_fee') THEN ut.total_amount 
        ELSE 0 
    END) as total_outflows,
    SUM(CASE 
        WHEN ut.transaction_type IN ('bank_deposit') THEN ut.total_amount 
        ELSE -ut.total_amount 
    END) as net_cash_flow
FROM universal_transactions ut
JOIN core_entities ba ON ut.source_entity_id = ba.id
WHERE ut.organization_id = $1 
AND ba.entity_type = 'bank_account'
AND ut.transaction_type IN ('bank_transfer', 'bank_deposit', 'bank_withdrawal', 'bank_fee')
AND ut.status = 'completed'
AND ut.transaction_date >= $2
AND ut.transaction_date <= $3
GROUP BY DATE_TRUNC('day', ut.transaction_date), ba.entity_name, ut.currency
ORDER BY transaction_day DESC, net_cash_flow DESC;
```

## 💡 Best Practices

1. **Always use Universal API** - Don't create banking-specific endpoints
2. **Leverage Smart Codes** - Use `HERA.BANK.*` codes for business logic
3. **Multi-tenant First** - Always include organization_id
4. **Security First** - Encrypt sensitive banking data
5. **Multi-Currency Support** - Handle exchange rates and currency conversions
6. **Real-time Balance Updates** - Maintain accurate account balances
7. **Fraud Detection** - Integrate AI-powered fraud monitoring
8. **Compliance Ready** - Support regulatory reporting requirements

This Banking module demonstrates the complete HERA DNA → Universal Schema pipeline with comprehensive banking and cash management workflows! 🚀