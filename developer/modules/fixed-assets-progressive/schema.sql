-- =====================================================
-- HERA Fixed-Assets-Progressive Module Universal Schema
-- Generated from Progressive Prototype Analysis
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- FIXED ASSETS SCHEMA
-- =====================================================

-- Sample fixed assets
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
-- Manufacturing Equipment
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'fixed_asset',
    'CNC Machine Model X200 - Manufacturing Equipment',
    'FA001',
    'asset',
    'machinery',
    'active',
    '2024-01-15'::date,
    '{"asset_class": "machinery", "location": "Plant Floor A", "manufacturer": "TechMfg Inc", "model": "X200", "serial_number": "TM-X200-2024-789", "purchase_date": "2024-01-15"}',
    'manufacturing_equipment',
    0.96,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- Office Equipment
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'fixed_asset',
    'Dell Workstation Fleet - IT Equipment',
    'FA002',
    'asset',
    'office_equipment',
    'active',
    '2024-03-01'::date,
    '{"asset_class": "computer_equipment", "location": "Office Floor 2", "manufacturer": "Dell Inc", "model": "Precision 5570", "quantity": 25}',
    'office_equipment',
    0.94,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- Vehicle
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'fixed_asset',
    'Delivery Van - Ford Transit 2024',
    'FA003',
    'asset',
    'vehicle',
    'active',
    '2024-02-20'::date,
    '{"asset_class": "vehicle", "location": "Vehicle Lot", "manufacturer": "Ford Motor Company", "model": "Transit Van 350", "vin": "1FTBW3XM8PKA12345", "license_plate": "BUS-2024"}',
    'delivery_vehicle',
    0.92,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- Building Improvements
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'fixed_asset',
    'HVAC System Upgrade - Building A',
    'FA004',
    'asset',
    'building_improvement',
    'active',
    '2024-06-15'::date,
    '{"asset_class": "building_improvement", "location": "Building A", "contractor": "Climate Control Systems", "improvement_type": "HVAC", "building_section": "Entire Building"}',
    'building_improvement',
    0.90,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
-- Fully Depreciated Asset
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'fixed_asset',
    'Legacy Server - HP ProLiant DL380',
    'FA005',
    'asset',
    'office_equipment',
    'fully_depreciated',
    '2020-01-01'::date,
    '{"asset_class": "server_equipment", "location": "Data Center", "manufacturer": "HP Inc", "model": "ProLiant DL380", "end_of_life": "2024-12-31"}',
    'legacy_equipment',
    0.88,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- =====================================================
-- FIXED ASSET DYNAMIC DATA (Properties)
-- =====================================================

-- Get fixed asset IDs for dynamic data insertion
WITH asset_ids AS (
    SELECT id, entity_code 
    FROM core_entities 
    WHERE entity_type = 'fixed_asset' 
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
)

-- CNC Machine (FA001) properties
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
    a.id,
    'purchase_cost',
    'number',
    'Purchase Cost',
    'Original purchase price of the asset',
    'financial_metrics',
    '75000.00',
    75000.00,
    NULL,
    1,
    true,
    true,
    '{"currency": "USD", "min": 0, "precision": 2}',
    0.99,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM asset_ids a WHERE a.entity_code = 'FA001'

UNION ALL

SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    a.id,
    'useful_life_years',
    'number',
    'Useful Life (Years)',
    'Expected useful life of asset in years',
    'depreciation_details',
    '10',
    10,
    NULL,
    2,
    true,
    true,
    '{"min": 1, "max": 50}',
    0.95,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM asset_ids a WHERE a.entity_code = 'FA001'

UNION ALL

SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    a.id,
    'depreciation_method',
    'text',
    'Depreciation Method',
    'Method used for calculating depreciation',
    'depreciation_details',
    'straight_line',
    NULL,
    NULL,
    3,
    true,
    true,
    '{"enum": ["straight_line", "double_declining", "sum_of_years", "units_of_production"]}',
    0.98,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM asset_ids a WHERE a.entity_code = 'FA001'

UNION ALL

SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    a.id,
    'salvage_value',
    'number',
    'Salvage Value',
    'Estimated value at end of useful life',
    'depreciation_details',
    '5000.00',
    5000.00,
    NULL,
    4,
    false,
    false,
    '{"currency": "USD", "min": 0}',
    0.85,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM asset_ids a WHERE a.entity_code = 'FA001'

UNION ALL

SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    a.id,
    'acquisition_date',
    'date',
    'Acquisition Date',
    'Date when asset was acquired/placed in service',
    'asset_details',
    '2024-01-15',
    NULL,
    NULL,
    5,
    true,
    true,
    '{"format": "YYYY-MM-DD"}',
    0.99,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM asset_ids a WHERE a.entity_code = 'FA001'

UNION ALL

SELECT 
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    a.id,
    'warranty_expiry',
    'date',
    'Warranty Expiry',
    'Date when manufacturer warranty expires',
    'maintenance_details',
    '2027-01-15',
    NULL,
    NULL,
    6,
    false,
    false,
    '{"format": "YYYY-MM-DD"}',
    0.90,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM asset_ids a WHERE a.entity_code = 'FA001';

-- Dell Workstations (FA002) properties
INSERT INTO core_dynamic_data (
    id, organization_id, entity_id, field_name, field_type, field_label, 
    field_category, field_value, field_value_number, field_value_boolean,
    display_order, is_required, is_searchable, ai_confidence, created_at, updated_at
)
SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', a.id, 
    'purchase_cost', 'number', 'Purchase Cost', 'financial_metrics', '62500.00', 62500.00, NULL,
    1, true, true, 0.98, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM asset_ids a WHERE a.entity_code = 'FA002'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', a.id,
    'useful_life_years', 'number', 'Useful Life (Years)', 'depreciation_details', '5', 5, NULL,
    2, true, true, 0.95, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM asset_ids a WHERE a.entity_code = 'FA002'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', a.id,
    'depreciation_method', 'text', 'Depreciation Method', 'depreciation_details', 'straight_line', NULL, NULL,
    3, true, true, 0.98, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM asset_ids a WHERE a.entity_code = 'FA002'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', a.id,
    'salvage_value', 'number', 'Salvage Value', 'depreciation_details', '2500.00', 2500.00, NULL,
    4, false, false, 0.80, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM asset_ids a WHERE a.entity_code = 'FA002'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', a.id,
    'acquisition_date', 'date', 'Acquisition Date', 'asset_details', '2024-03-01', NULL, NULL,
    5, true, true, 0.99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM asset_ids a WHERE a.entity_code = 'FA002';

-- Delivery Van (FA003) properties
INSERT INTO core_dynamic_data (
    id, organization_id, entity_id, field_name, field_type, field_label, 
    field_category, field_value, field_value_number, field_value_boolean,
    display_order, is_required, is_searchable, ai_confidence, created_at, updated_at
)
SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', a.id, 
    'purchase_cost', 'number', 'Purchase Cost', 'financial_metrics', '45000.00', 45000.00, NULL,
    1, true, true, 0.97, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM asset_ids a WHERE a.entity_code = 'FA003'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', a.id,
    'useful_life_years', 'number', 'Useful Life (Years)', 'depreciation_details', '8', 8, NULL,
    2, true, true, 0.94, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM asset_ids a WHERE a.entity_code = 'FA003'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', a.id,
    'depreciation_method', 'text', 'Depreciation Method', 'depreciation_details', 'double_declining', NULL, NULL,
    3, true, true, 0.96, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM asset_ids a WHERE a.entity_code = 'FA003'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', a.id,
    'salvage_value', 'number', 'Salvage Value', 'depreciation_details', '8000.00', 8000.00, NULL,
    4, false, false, 0.85, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM asset_ids a WHERE a.entity_code = 'FA003';

-- Legacy Server (FA005) - Fully Depreciated
INSERT INTO core_dynamic_data (
    id, organization_id, entity_id, field_name, field_type, field_label, 
    field_category, field_value, field_value_number, field_value_boolean,
    display_order, is_required, is_searchable, ai_confidence, created_at, updated_at
)
SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', a.id, 
    'purchase_cost', 'number', 'Purchase Cost', 'financial_metrics', '15000.00', 15000.00, NULL,
    1, true, true, 0.99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM asset_ids a WHERE a.entity_code = 'FA005'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', a.id,
    'useful_life_years', 'number', 'Useful Life (Years)', 'depreciation_details', '5', 5, NULL,
    2, true, true, 0.98, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM asset_ids a WHERE a.entity_code = 'FA005'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', a.id,
    'depreciation_method', 'text', 'Depreciation Method', 'depreciation_details', 'straight_line', NULL, NULL,
    3, true, true, 0.98, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM asset_ids a WHERE a.entity_code = 'FA005'

UNION ALL SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', a.id,
    'acquisition_date', 'date', 'Acquisition Date', 'asset_details', '2020-01-01', NULL, NULL,
    5, true, true, 0.99, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM asset_ids a WHERE a.entity_code = 'FA005';

-- =====================================================
-- DEPRECIATION TRANSACTIONS
-- =====================================================

-- Monthly depreciation transactions for various assets
INSERT INTO universal_transactions (
    id,
    organization_id,
    transaction_type,
    transaction_number,
    transaction_date,
    reference_number,
    source_entity_id,
    total_amount,
    currency,
    status,
    workflow_state,
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
    'depreciation_expense',
    'DEP-2024-12-FA001',
    '2024-12-31'::date,
    'DEPREC-FA001-2024-12',
    a.id, -- CNC Machine
    583.33, -- ($75000 - $5000) / 10 years / 12 months
    'USD',
    'posted',
    'completed',
    'Monthly depreciation - CNC Machine X200',
    'Automatic depreciation calculation using straight-line method',
    '{"period": "2024-12", "method": "straight_line", "accumulated_depreciation": 7000.00, "book_value": 68000.00, "depreciation_rate": 0.0833}',
    '[
        {
            "type": "replacement_forecast",
            "message": "Asset will reach 80% depreciation in 24 months. Consider replacement planning.",
            "confidence": 89,
            "priority": "medium",
            "timeline": "24 months"
        },
        {
            "type": "maintenance_correlation",
            "message": "Asset showing normal depreciation pattern. Maintenance costs within expected range.",
            "confidence": 92,
            "priority": "low"
        }
    ]',
    5,
    2,
    'depreciation_system',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM core_entities a 
WHERE a.entity_code = 'FA001' 
AND a.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';

-- Dell Workstations Depreciation
INSERT INTO universal_transactions (
    id, organization_id, transaction_type, transaction_number, transaction_date,
    reference_number, source_entity_id, total_amount, currency, status, workflow_state,
    description, ai_insights, ai_risk_score, metadata, created_at, updated_at
) 
SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', 'depreciation_expense', 'DEP-2024-12-FA002',
    '2024-12-31'::date, 'DEPREC-FA002-2024-12', a.id, 1000.00, 'USD', 'posted', 'completed',
    'Monthly depreciation - Dell Workstation Fleet',
    '[
        {
            "type": "technology_refresh",
            "message": "IT equipment depreciation on schedule. Technology refresh recommended in 18 months.",
            "confidence": 87,
            "priority": "medium"
        }
    ]',
    8, '{"period": "2024-12", "method": "straight_line", "accumulated_depreciation": 10000.00, "book_value": 52500.00}',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM core_entities a WHERE a.entity_code = 'FA002' AND a.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';

-- Delivery Van Depreciation (Double Declining)
INSERT INTO universal_transactions (
    id, organization_id, transaction_type, transaction_number, transaction_date,
    reference_number, source_entity_id, total_amount, currency, status, workflow_state,
    description, ai_insights, ai_risk_score, metadata, created_at, updated_at
) 
SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', 'depreciation_expense', 'DEP-2024-12-FA003',
    '2024-12-31'::date, 'DEPREC-FA003-2024-12', a.id, 843.75, 'USD', 'posted', 'completed',
    'Monthly depreciation - Ford Transit Delivery Van',
    '[
        {
            "type": "vehicle_utilization",
            "message": "Vehicle depreciation accelerated due to commercial use. Monitor mileage and maintenance.",
            "confidence": 94,
            "priority": "medium"
        }
    ]',
    12, '{"period": "2024-12", "method": "double_declining", "accumulated_depreciation": 9281.25, "book_value": 35718.75, "depreciation_rate": 0.25}',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM core_entities a WHERE a.entity_code = 'FA003' AND a.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';

-- Legacy Server (Fully Depreciated - No more depreciation)
-- Historical depreciation record showing asset is fully depreciated
INSERT INTO universal_transactions (
    id, organization_id, transaction_type, transaction_number, transaction_date,
    reference_number, source_entity_id, total_amount, currency, status, workflow_state,
    description, ai_insights, ai_risk_score, metadata, created_at, updated_at
) 
SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', 'depreciation_expense', 'DEP-2024-12-FA005',
    '2024-12-31'::date, 'DEPREC-FA005-2024-12', a.id, 0.00, 'USD', 'completed', 'fully_depreciated',
    'Legacy Server - Fully Depreciated (No current depreciation)',
    '[
        {
            "type": "asset_disposal_recommendation",
            "message": "Asset is fully depreciated and approaching end of life. Consider disposal/replacement.",
            "confidence": 96,
            "priority": "high",
            "recommended_action": "Schedule disposal evaluation"
        }
    ]',
    25, '{"period": "2024-12", "method": "straight_line", "accumulated_depreciation": 15000.00, "book_value": 0.00, "fully_depreciated": true}',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM core_entities a WHERE a.entity_code = 'FA005' AND a.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';

-- =====================================================
-- MAINTENANCE TRANSACTIONS
-- =====================================================

-- Maintenance records for assets
INSERT INTO universal_transactions (
    id,
    organization_id,
    transaction_type,
    transaction_number,
    transaction_date,
    reference_number,
    external_reference,
    source_entity_id,
    total_amount,
    currency,
    status,
    workflow_state,
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
    'maintenance_expense',
    'MAINT-2024-11-FA001',
    '2024-11-15'::date,
    'MAINT-CNC-2024-11',
    'SVC-TM-789456',
    a.id, -- CNC Machine
    1250.00,
    'USD',
    'completed',
    'maintenance_recorded',
    'Scheduled maintenance - CNC Machine belt replacement and calibration',
    'Routine maintenance performed by TechMfg certified technician',
    '{"maintenance_type": "scheduled", "service_provider": "TechMfg Service", "parts_replaced": ["drive_belt", "calibration_kit"], "next_due": "2025-02-15", "labor_hours": 6, "parts_cost": 450.00, "labor_cost": 800.00}',
    '[
        {
            "type": "maintenance_prediction",
            "message": "Next maintenance due in 3 months based on usage patterns and manufacturer recommendations.",
            "confidence": 92,
            "priority": "medium",
            "timeline": "3 months"
        },
        {
            "type": "cost_optimization",
            "message": "Maintenance costs within normal range for this asset class. No cost concerns.",
            "confidence": 88,
            "priority": "low"
        }
    ]',
    8,
    3,
    'maintenance_user',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM core_entities a 
WHERE a.entity_code = 'FA001' 
AND a.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';

-- Vehicle maintenance
INSERT INTO universal_transactions (
    id, organization_id, transaction_type, transaction_number, transaction_date,
    reference_number, source_entity_id, total_amount, currency, status, workflow_state,
    description, ai_insights, ai_risk_score, metadata, created_at, updated_at
) 
SELECT 
    uuid_generate_v4(), '719dfed1-09b4-4ca8-bfda-f682460de945', 'maintenance_expense', 'MAINT-2024-10-FA003',
    '2024-10-20'::date, 'MAINT-VAN-2024-10', a.id, 450.00, 'USD', 'completed', 'maintenance_recorded',
    'Vehicle maintenance - Ford Transit oil change and inspection',
    '[
        {
            "type": "vehicle_health",
            "message": "Vehicle showing good maintenance history. Continue regular service intervals.",
            "confidence": 91,
            "priority": "low"
        }
    ]',
    5, '{"maintenance_type": "routine", "service_provider": "Ford Service Center", "mileage": 15250, "next_due": "2025-01-20"}',
    CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM core_entities a WHERE a.entity_code = 'FA003' AND a.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';

-- =====================================================
-- ASSET LOCATION RELATIONSHIPS
-- =====================================================

-- Create location entities first (simplified for demo)
INSERT INTO core_entities (
    id,
    organization_id,
    entity_type,
    entity_name,
    entity_code,
    entity_category,
    status,
    metadata,
    created_at,
    updated_at
) VALUES 
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'location',
    'Plant Floor A - Manufacturing',
    'LOC001',
    'location',
    'active',
    '{"location_type": "manufacturing", "building": "Plant A", "floor": "1", "department": "Manufacturing"}',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
),
(
    uuid_generate_v4(),
    '719dfed1-09b4-4ca8-bfda-f682460de945',
    'location',
    'Office Floor 2 - IT Department',
    'LOC002',
    'location',
    'active',
    '{"location_type": "office", "building": "Main Office", "floor": "2", "department": "IT"}',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- Create asset-location relationships
WITH asset_location_pairs AS (
    SELECT 
        fa.id as asset_id,
        loc.id as location_id,
        fa.entity_name as asset_name,
        loc.entity_name as location_name,
        fa.entity_code as asset_code
    FROM core_entities fa
    JOIN core_entities loc ON (
        (fa.entity_code = 'FA001' AND loc.entity_code = 'LOC001') OR
        (fa.entity_code = 'FA002' AND loc.entity_code = 'LOC002')
    )
    WHERE fa.entity_type = 'fixed_asset' 
    AND loc.entity_type = 'location'
    AND fa.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
    AND loc.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
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
    alp.asset_id,
    alp.location_id,
    'asset_location',
    'Asset Location Assignment: ' || alp.asset_name || ' -> ' || alp.location_name,
    0.98,
    false,
    true,
    'active',
    JSON_BUILD_OBJECT(
        'assigned_date', CASE WHEN alp.asset_code = 'FA001' THEN '2024-01-15' ELSE '2024-03-01' END,
        'responsible_department', CASE WHEN alp.asset_code = 'FA001' THEN 'Manufacturing' ELSE 'IT' END,
        'cost_center', CASE WHEN alp.asset_code = 'FA001' THEN 'PLANT-A' ELSE 'IT-DEPT' END,
        'location_tracking', true
    ),
    CURRENT_DATE,
    false,
    0.95,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM asset_location_pairs alp;

-- =====================================================
-- VALIDATION TRIGGERS AND FUNCTIONS
-- =====================================================

-- Fixed asset validation function
CREATE OR REPLACE FUNCTION validate_fixed_asset()
RETURNS TRIGGER AS $$
BEGIN
    -- Validate fixed asset entity
    IF NEW.entity_type = 'fixed_asset' THEN
        -- Check fixed asset code format (FA + digits)
        IF NEW.entity_code !~ '^FA[0-9]{3,}$' THEN
            RAISE EXCEPTION 'Fixed asset code must follow format FA001, FA002, etc. Got: %', NEW.entity_code;
        END IF;
        
        -- Ensure fixed asset name is unique per organization
        IF EXISTS (
            SELECT 1 FROM core_entities 
            WHERE organization_id = NEW.organization_id 
            AND entity_type = 'fixed_asset'
            AND entity_name = NEW.entity_name
            AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
        ) THEN
            RAISE EXCEPTION 'Fixed asset name "%" already exists in organization', NEW.entity_name;
        END IF;
        
        -- Validate asset category is asset
        IF NEW.entity_category != 'asset' THEN
            RAISE EXCEPTION 'Fixed assets must be classified as assets';
        END IF;
        
        -- Set default values
        NEW.status := COALESCE(NEW.status, 'active');
        NEW.effective_date := COALESCE(NEW.effective_date, CURRENT_DATE);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create fixed asset validation trigger
DROP TRIGGER IF EXISTS validate_fixed_asset_trigger ON core_entities;
CREATE TRIGGER validate_fixed_asset_trigger
    BEFORE INSERT OR UPDATE ON core_entities
    FOR EACH ROW
    WHEN (NEW.entity_type = 'fixed_asset')
    EXECUTE FUNCTION validate_fixed_asset();

-- Depreciation transaction validation function
CREATE OR REPLACE FUNCTION validate_depreciation_transaction()
RETURNS TRIGGER AS $$
DECLARE
    asset_exists boolean := false;
    asset_active boolean := false;
    asset_purchase_cost DECIMAL(15,2) := 0;
    accumulated_depreciation DECIMAL(15,2) := 0;
BEGIN
    -- Validate depreciation transactions
    IF NEW.transaction_type = 'depreciation_expense' THEN
        -- Ensure transaction has asset
        IF NEW.source_entity_id IS NULL THEN
            RAISE EXCEPTION 'Depreciation transaction must have a fixed asset (source_entity_id)';
        END IF;
        
        -- Validate asset exists and is active (or fully_depreciated)
        SELECT 
            EXISTS(SELECT 1 FROM core_entities WHERE id = NEW.source_entity_id),
            EXISTS(SELECT 1 FROM core_entities 
                  WHERE id = NEW.source_entity_id 
                  AND entity_type = 'fixed_asset'
                  AND status IN ('active', 'fully_depreciated')
                  AND organization_id = NEW.organization_id)
        INTO asset_exists, asset_active;
        
        IF NOT asset_exists THEN
            RAISE EXCEPTION 'Fixed asset with ID % does not exist', NEW.source_entity_id;
        END IF;
        
        IF NOT asset_active THEN
            RAISE EXCEPTION 'Fixed asset is not active for depreciation transaction';
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
        
        -- Ensure accumulated depreciation doesn't exceed purchase cost (allow small rounding differences)
        IF accumulated_depreciation > (asset_purchase_cost + 0.01) THEN
            RAISE EXCEPTION 'Total depreciation cannot exceed asset cost. Asset Cost: $%, Total Depreciation: $%', 
                asset_purchase_cost, accumulated_depreciation;
        END IF;
        
        -- Amount validation (can be 0 for fully depreciated assets)
        IF NEW.total_amount < 0 THEN
            RAISE EXCEPTION 'Depreciation amount cannot be negative';
        END IF;
        
        -- Set defaults
        NEW.currency := COALESCE(NEW.currency, 'USD');
        NEW.status := COALESCE(NEW.status, 'posted');
        NEW.workflow_state := COALESCE(NEW.workflow_state, 'completed');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create depreciation validation trigger
DROP TRIGGER IF EXISTS validate_depreciation_transaction_trigger ON universal_transactions;
CREATE TRIGGER validate_depreciation_transaction_trigger
    BEFORE INSERT OR UPDATE ON universal_transactions
    FOR EACH ROW
    WHEN (NEW.transaction_type = 'depreciation_expense')
    EXECUTE FUNCTION validate_depreciation_transaction();

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Fixed asset lookup optimization
CREATE INDEX IF NOT EXISTS idx_fixed_assets_by_org 
ON core_entities (organization_id, entity_type, status) 
WHERE entity_type = 'fixed_asset';

-- Depreciation transaction queries optimization
CREATE INDEX IF NOT EXISTS idx_depreciation_by_asset 
ON universal_transactions (organization_id, source_entity_id, transaction_type, transaction_date)
WHERE transaction_type = 'depreciation_expense';

-- Asset-transaction relationship lookup
CREATE INDEX IF NOT EXISTS idx_asset_transactions_by_type 
ON universal_transactions (organization_id, source_entity_id, transaction_type, status)
WHERE transaction_type IN ('depreciation_expense', 'maintenance_expense', 'asset_disposal');

-- Asset dynamic data lookup optimization
CREATE INDEX IF NOT EXISTS idx_asset_dynamic_data 
ON core_dynamic_data (organization_id, entity_id, field_name, field_type)
WHERE field_name IN ('purchase_cost', 'useful_life_years', 'depreciation_method', 'salvage_value', 'acquisition_date');

-- Asset maintenance history optimization
CREATE INDEX IF NOT EXISTS idx_asset_maintenance_history 
ON universal_transactions (organization_id, source_entity_id, transaction_type, transaction_date, total_amount)
WHERE transaction_type = 'maintenance_expense';

-- Asset location relationships
CREATE INDEX IF NOT EXISTS idx_asset_location_relationships 
ON core_relationships (organization_id, relationship_type, source_entity_id, target_entity_id)
WHERE relationship_type = 'asset_location';

-- =====================================================
-- SAMPLE DATA SUMMARY
-- =====================================================

-- Summary of created fixed assets data
DO $$
DECLARE
    asset_count integer;
    location_count integer;
    depreciation_count integer;
    maintenance_count integer;
    relationship_count integer;
    dynamic_data_count integer;
    total_asset_cost DECIMAL(15,2);
    total_accumulated_depreciation DECIMAL(15,2);
    total_book_value DECIMAL(15,2);
    total_maintenance_cost DECIMAL(15,2);
BEGIN
    SELECT COUNT(*) INTO asset_count 
    FROM core_entities 
    WHERE entity_type = 'fixed_asset' 
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    SELECT COUNT(*) INTO location_count 
    FROM core_entities 
    WHERE entity_type = 'location' 
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    SELECT COUNT(*) INTO depreciation_count 
    FROM universal_transactions 
    WHERE transaction_type = 'depreciation_expense' 
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    SELECT COUNT(*) INTO maintenance_count 
    FROM universal_transactions 
    WHERE transaction_type = 'maintenance_expense' 
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    SELECT COUNT(*) INTO relationship_count 
    FROM core_relationships 
    WHERE relationship_type = 'asset_location' 
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    SELECT COUNT(*) INTO dynamic_data_count 
    FROM core_dynamic_data cdd
    JOIN core_entities ce ON cdd.entity_id = ce.id
    WHERE ce.entity_type = 'fixed_asset'
    AND cdd.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    -- Calculate financial summary
    SELECT 
        COALESCE(SUM(cdd.field_value_number), 0)
    INTO total_asset_cost
    FROM core_dynamic_data cdd
    JOIN core_entities ce ON cdd.entity_id = ce.id
    WHERE ce.entity_type = 'fixed_asset' 
    AND cdd.field_name = 'purchase_cost'
    AND cdd.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    SELECT 
        COALESCE(SUM(total_amount), 0)
    INTO total_accumulated_depreciation
    FROM universal_transactions
    WHERE transaction_type = 'depreciation_expense'
    AND status = 'posted'
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945';
    
    total_book_value := total_asset_cost - total_accumulated_depreciation;
    
    SELECT 
        COALESCE(SUM(total_amount), 0)
    INTO total_maintenance_cost
    FROM universal_transactions
    WHERE transaction_type = 'maintenance_expense'
    AND status = 'completed'
    AND organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
    AND transaction_date >= DATE_TRUNC('year', CURRENT_DATE);
    
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'HERA Fixed-Assets-Progressive Module Schema Created Successfully';
    RAISE NOTICE '====================================================';
    RAISE NOTICE 'Fixed Assets Created: %', asset_count;
    RAISE NOTICE 'Locations Created: %', location_count;
    RAISE NOTICE 'Depreciation Transactions: %', depreciation_count;
    RAISE NOTICE 'Maintenance Records: %', maintenance_count;
    RAISE NOTICE 'Asset-Location Relationships: %', relationship_count;
    RAISE NOTICE 'Dynamic Data Fields: %', dynamic_data_count;
    RAISE NOTICE '----------------------------------------------------';
    RAISE NOTICE 'Financial Summary:';
    RAISE NOTICE 'Total Asset Cost: $%', total_asset_cost;
    RAISE NOTICE 'Accumulated Depreciation: $%', total_accumulated_depreciation;
    RAISE NOTICE 'Net Book Value: $%', total_book_value;
    RAISE NOTICE 'Annual Maintenance Cost: $%', total_maintenance_cost;
    RAISE NOTICE 'Asset Utilization: %% depreciated', ROUND((total_accumulated_depreciation / NULLIF(total_asset_cost, 0)) * 100, 1);
    RAISE NOTICE '====================================================';
END
$$;