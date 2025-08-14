# Fixed-Assets-Progressive Module Developer Guide

## 🧬 HERA DNA Module: Fixed Assets & Depreciation Progressive

### **Business Process Overview**
This module handles comprehensive fixed asset lifecycle management including acquisition, depreciation calculations, maintenance tracking, and disposal with AI-powered replacement forecasting and value optimization.

## 📊 Universal Schema Mapping

### **Core Entities Mapping**

#### **1. Fixed Assets → `core_entities`**
```sql
-- Fixed Asset Entity
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
    'fixed_asset',
    'Manufacturing Equipment - CNC Machine Model X200',
    'FA001',
    'asset',
    'equipment',
    'active',
    '{"asset_class": "machinery", "location": "Plant Floor A", "manufacturer": "TechMfg Inc", "model": "X200", "serial_number": "TM-X200-2024-789"}'
);
```

#### **2. Asset Properties → `core_dynamic_data`**
```sql
-- Purchase Cost
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_label,
    field_value_number,
    field_category
) VALUES (
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    '{asset_entity_id}',
    'purchase_cost',
    'number',
    'Purchase Cost',
    75000.00,
    'financial_metrics'
);

-- Useful Life (Years)
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_value_number,
    field_category
) VALUES (
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    '{asset_entity_id}',
    'useful_life_years',
    'number',
    10,
    'depreciation_details'
);

-- Depreciation Method
INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_type,
    field_value,
    field_category
) VALUES (
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    '{asset_entity_id}',
    'depreciation_method',
    'text',
    'straight_line',
    'depreciation_details'
);
```

#### **3. Depreciation Transactions → `universal_transactions`**
```sql
INSERT INTO universal_transactions (
    organization_id,
    transaction_type,
    transaction_number,
    transaction_date,
    source_entity_id,  -- Links to fixed asset
    total_amount,
    currency,
    status,
    workflow_state,
    ai_insights,
    metadata
) VALUES (
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'depreciation_expense',
    'DEP-2024-12-FA001',
    '2024-12-31',
    '{asset_entity_id}',
    625.00,
    'USD',
    'posted',
    'completed',
    '[{"type":"replacement_forecast","message":"Asset will reach 80% depreciation in 24 months. Consider replacement planning.","confidence":89}]',
    '{"period": "2024-12", "method": "straight_line", "accumulated_depreciation": 7500.00, "book_value": 67500.00}'
);
```

#### **4. Maintenance Records → `universal_transactions`**
```sql
INSERT INTO universal_transactions (
    organization_id,
    transaction_type,
    transaction_number,
    transaction_date,
    source_entity_id,  -- Links to fixed asset
    total_amount,
    currency,
    status,
    workflow_state,
    description,
    ai_insights,
    metadata
) VALUES (
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'maintenance_expense',
    'MAINT-2024-11-FA001',
    '2024-11-15',
    '{asset_entity_id}',
    1250.00,
    'USD',
    'completed',
    'maintenance_recorded',
    'Scheduled maintenance - belt replacement and calibration',
    '[{"type":"maintenance_prediction","message":"Next maintenance due in 3 months based on usage patterns.","confidence":92}]',
    '{"maintenance_type": "scheduled", "service_provider": "TechMfg Service", "next_due": "2025-02-15"}'
);
```

#### **5. Asset-Location Relationships → `core_relationships`**
```sql
INSERT INTO core_relationships (
    organization_id,
    source_entity_id,     -- Asset
    target_entity_id,     -- Location entity
    relationship_type,
    relationship_label,
    is_active,
    workflow_state,
    relationship_data
) VALUES (
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    '{asset_entity_id}',
    '{location_entity_id}',
    'asset_location',
    'Asset Location Assignment',
    true,
    'active',
    '{"assigned_date": "2024-01-15", "responsible_department": "Manufacturing", "cost_center": "PLANT-A"}'
);
```

## 🔧 Business Rules & Validations

### **Fixed Asset Validation Rules**
```sql
-- Fixed asset validation
CREATE OR REPLACE FUNCTION validate_fixed_asset()
RETURNS TRIGGER AS $$
BEGIN
    -- Ensure fixed asset has required fields
    IF NEW.entity_type = 'fixed_asset' THEN
        -- Check for required asset code format
        IF NEW.entity_code !~ '^FA[0-9]{3,}$' THEN
            RAISE EXCEPTION 'Fixed asset code must follow format FA001, FA002, etc.';
        END IF;
        
        -- Ensure asset name is unique per organization
        IF EXISTS (
            SELECT 1 FROM core_entities 
            WHERE organization_id = NEW.organization_id 
            AND entity_type = 'fixed_asset'
            AND entity_name = NEW.entity_name
            AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        ) THEN
            RAISE EXCEPTION 'Fixed asset name must be unique within organization';
        END IF;
        
        -- Validate asset category is asset
        IF NEW.entity_category != 'asset' THEN
            RAISE EXCEPTION 'Fixed assets must be classified as assets';
        END IF;
        
        -- Set default status
        NEW.status := COALESCE(NEW.status, 'active');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_fixed_asset_trigger
    BEFORE INSERT OR UPDATE ON core_entities
    FOR EACH ROW
    WHEN (NEW.entity_type = 'fixed_asset')
    EXECUTE FUNCTION validate_fixed_asset();
```

### **Depreciation Transaction Validation**
```sql
CREATE OR REPLACE FUNCTION validate_depreciation_transaction()
RETURNS TRIGGER AS $$
DECLARE
    asset_purchase_cost DECIMAL(15,2);
    accumulated_depreciation DECIMAL(15,2);
BEGIN
    -- Validate depreciation transactions
    IF NEW.transaction_type = 'depreciation_expense' THEN
        -- Ensure transaction has asset
        IF NEW.source_entity_id IS NULL THEN
            RAISE EXCEPTION 'Depreciation transaction must have a fixed asset (source_entity_id)';
        END IF;
        
        -- Validate asset exists and is active
        IF NOT EXISTS (
            SELECT 1 FROM core_entities 
            WHERE id = NEW.source_entity_id 
            AND entity_type = 'fixed_asset'
            AND status = 'active'
            AND organization_id = NEW.organization_id
        ) THEN
            RAISE EXCEPTION 'Invalid or inactive fixed asset for depreciation';
        END IF;
        
        -- Get asset purchase cost
        SELECT 
            COALESCE(
                (SELECT field_value_number FROM core_dynamic_data 
                 WHERE entity_id = NEW.source_entity_id AND field_name = 'purchase_cost'), 
                0
            )
        INTO asset_purchase_cost;
        
        -- Calculate total accumulated depreciation including this transaction
        SELECT 
            COALESCE(
                SUM(total_amount), 0
            ) + NEW.total_amount
        INTO accumulated_depreciation
        FROM universal_transactions 
        WHERE source_entity_id = NEW.source_entity_id 
        AND transaction_type = 'depreciation_expense'
        AND status = 'posted'
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
        
        -- Ensure accumulated depreciation doesn't exceed purchase cost
        IF accumulated_depreciation > asset_purchase_cost THEN
            RAISE EXCEPTION 'Total depreciation cannot exceed asset cost. Asset Cost: $%, Total Depreciation: $%', 
                asset_purchase_cost, accumulated_depreciation;
        END IF;
        
        -- Amount validation
        IF NEW.total_amount <= 0 THEN
            RAISE EXCEPTION 'Depreciation amount must be positive';
        END IF;
        
        -- Set defaults
        NEW.currency := COALESCE(NEW.currency, 'USD');
        NEW.status := COALESCE(NEW.status, 'posted');
        NEW.workflow_state := COALESCE(NEW.workflow_state, 'completed');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_depreciation_transaction_trigger
    BEFORE INSERT OR UPDATE ON universal_transactions
    FOR EACH ROW
    WHEN (NEW.transaction_type = 'depreciation_expense')
    EXECUTE FUNCTION validate_depreciation_transaction();
```

## 🔐 Row Level Security (RLS)

### **Multi-Tenant Security**
```sql
-- Fixed asset access policy
CREATE POLICY fixed_asset_access_policy ON core_entities
    FOR ALL 
    TO authenticated
    USING (
        organization_id = current_setting('app.current_organization_id')::uuid
        AND entity_type = 'fixed_asset'
    );

-- Depreciation transaction access policy  
CREATE POLICY depreciation_transaction_access_policy ON universal_transactions
    FOR ALL
    TO authenticated  
    USING (
        organization_id = current_setting('app.current_organization_id')::uuid
        AND transaction_type IN ('depreciation_expense', 'maintenance_expense', 'asset_disposal')
    );

-- Asset dynamic data policy
CREATE POLICY asset_dynamic_data_policy ON core_dynamic_data
    FOR ALL
    TO authenticated
    USING (
        organization_id = current_setting('app.current_organization_id')::uuid
        AND EXISTS (
            SELECT 1 FROM core_entities ce
            WHERE ce.id = core_dynamic_data.entity_id
            AND ce.entity_type = 'fixed_asset'
            AND ce.organization_id = core_dynamic_data.organization_id
        )
    );
```

## 🎯 Smart Codes for Fixed Assets Module

### **Fixed Asset Transaction Smart Codes**
```sql
-- Fixed Asset Smart Code mapping
INSERT INTO smart_code_registry (
    smart_code,
    description,
    business_logic,
    gl_mapping,
    validation_rules
) VALUES 
(
    'HERA.FA.ASSET.CREATE.v1',
    'Create new fixed asset with depreciation setup',
    '{
        "entity_type": "fixed_asset",
        "required_fields": ["entity_name", "entity_code", "purchase_cost"],
        "validation": "asset_code_format",
        "depreciation_setup": true,
        "auto_generate": ["entity_code"]
    }',
    '{"debit_account": "1500_fixed_assets", "credit_account": "varies_by_acquisition"}',
    '["unique_asset_name", "valid_asset_code", "positive_cost", "depreciation_method_valid"]'
),
(
    'HERA.FA.DEPRECIATION.CALCULATE.v1', 
    'Calculate and post monthly depreciation expense',
    '{
        "transaction_type": "depreciation_expense",
        "auto_post_gl": true,
        "calculation_methods": ["straight_line", "double_declining", "units_of_production"],
        "auto_schedule": true
    }',
    '{
        "debit_account": "6500_depreciation_expense",
        "credit_account": "1600_accumulated_depreciation"
    }',
    '["asset_exists", "positive_amount", "not_fully_depreciated", "valid_period"]'
),
(
    'HERA.FA.MAINTENANCE.RECORD.v1',
    'Record maintenance expense and update asset records',
    '{
        "transaction_type": "maintenance_expense", 
        "auto_post_gl": true,
        "maintenance_tracking": true,
        "ai_prediction": true
    }',
    '{
        "debit_account": "6400_maintenance_expense",
        "credit_account": "varies_by_payment_method"
    }',
    '["asset_exists", "positive_amount", "valid_maintenance_type"]'
),
(
    'HERA.FA.DISPOSAL.PROCESS.v1',
    'Process asset disposal with gain/loss calculation',
    '{
        "transaction_type": "asset_disposal",
        "auto_post_gl": true,
        "gain_loss_calculation": true,
        "asset_status_update": "disposed"
    }',
    '{
        "debit_accounts": ["1100_cash", "1600_accumulated_depreciation"],
        "credit_accounts": ["1500_fixed_assets", "varies_by_gain_loss"]
    }',
    '["asset_exists", "disposal_amount_valid", "disposal_date_valid"]'
);
```

## 🔄 Progressive to Universal Migration

### **Migration Process**
```bash
# Step 1: Analyze progressive fixed assets data patterns
npm run analyze-progressive-data --module=fixed-assets-progressive

# Step 2: Generate universal schema from patterns  
npm run generate-universal-mapping --source=fixed-assets-progressive

# Step 3: Migrate data to universal tables
npm run migrate-to-universal --module=fixed-assets-progressive --dry-run
npm run migrate-to-universal --module=fixed-assets-progressive --execute

# Step 4: Update UI to use Universal API
npm run update-api-endpoints --module=fixed-assets-progressive --target=universal
```

## 📋 Developer Checklist

### **Schema Validation**
- [ ] All fixed assets mapped to `core_entities` with `entity_type='fixed_asset'`
- [ ] Asset details stored in `core_dynamic_data`
- [ ] Depreciation records stored in `universal_transactions` with `transaction_type='depreciation_expense'`
- [ ] Maintenance records in `universal_transactions` with `transaction_type='maintenance_expense'`
- [ ] Asset-location relationships in `core_relationships`

### **Business Rules**
- [ ] Fixed asset validation triggers implemented
- [ ] Depreciation calculation validation with cost limits
- [ ] Maintenance tracking integration
- [ ] Disposal processing with gain/loss calculations
- [ ] Asset lifecycle status management

### **Security**
- [ ] RLS policies for multi-tenant isolation
- [ ] Organization-specific access controls
- [ ] User role-based permissions for asset operations
- [ ] Audit trail for all asset transactions

### **API Integration**
- [ ] All CRUD operations use `/api/v1/universal`
- [ ] Proper organization_id filtering
- [ ] Depreciation calculation automation
- [ ] Real-time asset value updates

## 🚀 Performance Considerations

### **Indexing Strategy**
```sql
-- Fixed asset lookup optimization
CREATE INDEX idx_fixed_assets_by_org ON core_entities (organization_id, entity_type, status) 
WHERE entity_type = 'fixed_asset';

-- Depreciation transaction queries
CREATE INDEX idx_depreciation_by_asset ON universal_transactions 
(organization_id, source_entity_id, transaction_type, transaction_date)
WHERE transaction_type = 'depreciation_expense';

-- Asset dynamic data lookup
CREATE INDEX idx_asset_dynamic_data ON core_dynamic_data 
(organization_id, entity_id, field_name)
WHERE field_name IN ('purchase_cost', 'useful_life_years', 'depreciation_method', 'salvage_value');

-- Asset maintenance history optimization
CREATE INDEX idx_asset_maintenance ON universal_transactions 
(organization_id, source_entity_id, transaction_type, transaction_date)
WHERE transaction_type = 'maintenance_expense';
```

### **Query Optimization**
```sql
-- Optimized asset register query with depreciation
SELECT 
    fa.entity_code as asset_code,
    fa.entity_name as asset_name,
    fa.entity_subcategory as asset_category,
    pc.field_value_number as purchase_cost,
    ad.field_value as acquisition_date,
    dm.field_value as depreciation_method,
    ul.field_value_number as useful_life_years,
    COALESCE(dep.accumulated_depreciation, 0) as accumulated_depreciation,
    pc.field_value_number - COALESCE(dep.accumulated_depreciation, 0) as book_value,
    CASE 
        WHEN pc.field_value_number > 0 THEN 
            ROUND((COALESCE(dep.accumulated_depreciation, 0) / pc.field_value_number) * 100, 1)
        ELSE 0 
    END as depreciation_percentage,
    maint.maintenance_cost as annual_maintenance_cost
FROM core_entities fa
LEFT JOIN core_dynamic_data pc ON fa.id = pc.entity_id AND pc.field_name = 'purchase_cost'
LEFT JOIN core_dynamic_data ad ON fa.id = ad.entity_id AND ad.field_name = 'acquisition_date'
LEFT JOIN core_dynamic_data dm ON fa.id = dm.entity_id AND dm.field_name = 'depreciation_method'
LEFT JOIN core_dynamic_data ul ON fa.id = ul.entity_id AND ul.field_name = 'useful_life_years'
LEFT JOIN (
    SELECT 
        source_entity_id,
        SUM(total_amount) as accumulated_depreciation
    FROM universal_transactions
    WHERE transaction_type = 'depreciation_expense'
    AND status = 'posted'
    AND organization_id = $1
    GROUP BY source_entity_id
) dep ON fa.id = dep.source_entity_id
LEFT JOIN (
    SELECT 
        source_entity_id,
        SUM(total_amount) as maintenance_cost
    FROM universal_transactions
    WHERE transaction_type = 'maintenance_expense'
    AND status = 'completed'
    AND organization_id = $1
    AND transaction_date >= DATE_TRUNC('year', CURRENT_DATE)
    GROUP BY source_entity_id
) maint ON fa.id = maint.source_entity_id
WHERE fa.organization_id = $1 
AND fa.entity_type = 'fixed_asset'
AND fa.status = 'active'
ORDER BY fa.entity_code;
```

## 💡 Best Practices

1. **Always use Universal API** - Don't create asset-specific endpoints
2. **Leverage Smart Codes** - Use `HERA.FA.*` codes for business logic
3. **Multi-tenant First** - Always include organization_id
4. **AI-Native Design** - Use AI for maintenance predictions and replacement forecasting
5. **Depreciation Accuracy** - Maintain precise depreciation calculations
6. **Lifecycle Management** - Track complete asset lifecycle from acquisition to disposal
7. **Maintenance Integration** - Link maintenance costs to asset performance
8. **Compliance Ready** - Support tax depreciation and financial reporting requirements

This Fixed Assets module demonstrates the complete HERA DNA → Universal Schema pipeline with comprehensive asset lifecycle management! 🚀