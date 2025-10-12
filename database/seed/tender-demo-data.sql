-- Demo Tender Data for Kerala Furniture Works
-- Organization ID: f0af4ced-9d12-4a55-a649-b484368db249

-- Create tender entities
INSERT INTO core_entities (id, entity_type, entity_name, entity_code, organization_id, status, smart_code, created_at)
VALUES 
  (gen_random_uuid(), 'HERA.FURNITURE.TENDER.NOTICE.V1', 'Teak Wood Supply - Nilambur Range', 'KFD/2025/WOOD/001', 'f0af4ced-9d12-4a55-a649-b484368db249', 'active', 'HERA.FURNITURE.TENDER.NOTICE.ACTIVE.V1', NOW()),
  (gen_random_uuid(), 'HERA.FURNITURE.TENDER.NOTICE.V1', 'Rosewood Logs - Wayanad Division', 'KFD/2025/WOOD/002', 'f0af4ced-9d12-4a55-a649-b484368db249', 'active', 'HERA.FURNITURE.TENDER.NOTICE.ACTIVE.V1', NOW() - INTERVAL '3 days'),
  (gen_random_uuid(), 'HERA.FURNITURE.TENDER.NOTICE.V1', 'Mixed Timber - Palakkad Region', 'KFD/2025/TIMBER/003', 'f0af4ced-9d12-4a55-a649-b484368db249', 'active', 'HERA.FURNITURE.TENDER.NOTICE.WATCHLIST.V1', NOW() - INTERVAL '5 days'),
  (gen_random_uuid(), 'HERA.FURNITURE.TENDER.NOTICE.V1', 'Sandalwood Auction - Marayur', 'KFD/2024/WOOD/098', 'f0af4ced-9d12-4a55-a649-b484368db249', 'active', 'HERA.FURNITURE.TENDER.AWARD.WON.V1', NOW() - INTERVAL '30 days'),
  (gen_random_uuid(), 'HERA.FURNITURE.TENDER.NOTICE.V1', 'Bamboo Supply - Silent Valley', 'KFD/2024/TIMBER/095', 'f0af4ced-9d12-4a55-a649-b484368db249', 'active', 'HERA.FURNITURE.TENDER.BID.LOST.V1', NOW() - INTERVAL '35 days');

-- Add dynamic data for tenders
-- Tender 1: Teak Wood Supply
INSERT INTO core_dynamic_data (entity_id, field_name, field_value_text, field_value_number, field_value_date, smart_code, organization_id, created_at)
SELECT 
  e.id,
  d.field_name,
  d.field_value_text,
  d.field_value_number,
  d.field_value_date,
  d.smart_code,
  'f0af4ced-9d12-4a55-a649-b484368db249',
  NOW()
FROM core_entities e
CROSS JOIN (
  VALUES
    ('department', 'Kerala Forest Department', NULL, NULL, 'HERA.FURNITURE.TENDER.FIELD.DEPARTMENT.V1'),
    ('status', 'active', NULL, NULL, 'HERA.FURNITURE.TENDER.FIELD.STATUS.V1'),
    ('closing_date', NULL, NULL, CURRENT_DATE + INTERVAL '5 days', 'HERA.FURNITURE.TENDER.FIELD.CLOSING_DATE.V1'),
    ('estimated_value', NULL, 4500000, NULL, 'HERA.FURNITURE.TENDER.FIELD.ESTIMATED_VALUE.V1'),
    ('emd_amount', NULL, 90000, NULL, 'HERA.FURNITURE.TENDER.FIELD.EMD_AMOUNT.V1'),
    ('lot_count', NULL, 15, NULL, 'HERA.FURNITURE.TENDER.FIELD.LOT_COUNT.V1'),
    ('bid_strategy', 'aggressive', NULL, NULL, 'HERA.FURNITURE.TENDER.FIELD.BID_STRATEGY.V1'),
    ('ai_confidence', NULL, 78, NULL, 'HERA.FURNITURE.TENDER.FIELD.AI_CONFIDENCE.V1'),
    ('competitor_count', NULL, 5, NULL, 'HERA.FURNITURE.TENDER.FIELD.COMPETITOR_COUNT.V1'),
    ('location', 'Nilambur Forest Division, Malappuram District', NULL, NULL, 'HERA.FURNITURE.TENDER.FIELD.LOCATION.V1'),
    ('description', 'Supply of premium quality teak wood logs from Nilambur Forest Range', NULL, NULL, 'HERA.FURNITURE.TENDER.FIELD.DESCRIPTION.V1')
) d(field_name, field_value_text, field_value_number, field_value_date, smart_code)
WHERE e.entity_code = 'KFD/2025/WOOD/001';

-- Tender 2: Rosewood Logs
INSERT INTO core_dynamic_data (entity_id, field_name, field_value_text, field_value_number, field_value_date, smart_code, organization_id, created_at)
SELECT 
  e.id,
  d.field_name,
  d.field_value_text,
  d.field_value_number,
  d.field_value_date,
  d.smart_code,
  'f0af4ced-9d12-4a55-a649-b484368db249',
  NOW()
FROM core_entities e
CROSS JOIN (
  VALUES
    ('department', 'Kerala Forest Department', NULL, NULL, 'HERA.FURNITURE.TENDER.FIELD.DEPARTMENT.V1'),
    ('status', 'active', NULL, NULL, 'HERA.FURNITURE.TENDER.FIELD.STATUS.V1'),
    ('closing_date', NULL, NULL, CURRENT_DATE + INTERVAL '8 days', 'HERA.FURNITURE.TENDER.FIELD.CLOSING_DATE.V1'),
    ('estimated_value', NULL, 3200000, NULL, 'HERA.FURNITURE.TENDER.FIELD.ESTIMATED_VALUE.V1'),
    ('emd_amount', NULL, 64000, NULL, 'HERA.FURNITURE.TENDER.FIELD.EMD_AMOUNT.V1'),
    ('lot_count', NULL, 8, NULL, 'HERA.FURNITURE.TENDER.FIELD.LOT_COUNT.V1'),
    ('bid_strategy', 'conservative', NULL, NULL, 'HERA.FURNITURE.TENDER.FIELD.BID_STRATEGY.V1'),
    ('ai_confidence', NULL, 65, NULL, 'HERA.FURNITURE.TENDER.FIELD.AI_CONFIDENCE.V1'),
    ('competitor_count', NULL, 8, NULL, 'HERA.FURNITURE.TENDER.FIELD.COMPETITOR_COUNT.V1'),
    ('location', 'Wayanad Forest Division', NULL, NULL, 'HERA.FURNITURE.TENDER.FIELD.LOCATION.V1'),
    ('description', 'Premium rosewood logs from sustainable forest management', NULL, NULL, 'HERA.FURNITURE.TENDER.FIELD.DESCRIPTION.V1')
) d(field_name, field_value_text, field_value_number, field_value_date, smart_code)
WHERE e.entity_code = 'KFD/2025/WOOD/002';

-- Tender 3: Mixed Timber
INSERT INTO core_dynamic_data (entity_id, field_name, field_value_text, field_value_number, field_value_date, smart_code, organization_id, created_at)
SELECT 
  e.id,
  d.field_name,
  d.field_value_text,
  d.field_value_number,
  d.field_value_date,
  d.smart_code,
  'f0af4ced-9d12-4a55-a649-b484368db249',
  NOW()
FROM core_entities e
CROSS JOIN (
  VALUES
    ('department', 'Kerala Forest Department', NULL, NULL, 'HERA.FURNITURE.TENDER.FIELD.DEPARTMENT.V1'),
    ('status', 'watchlist', NULL, NULL, 'HERA.FURNITURE.TENDER.FIELD.STATUS.V1'),
    ('closing_date', NULL, NULL, CURRENT_DATE + INTERVAL '16 days', 'HERA.FURNITURE.TENDER.FIELD.CLOSING_DATE.V1'),
    ('estimated_value', NULL, 1800000, NULL, 'HERA.FURNITURE.TENDER.FIELD.ESTIMATED_VALUE.V1'),
    ('emd_amount', NULL, 36000, NULL, 'HERA.FURNITURE.TENDER.FIELD.EMD_AMOUNT.V1'),
    ('lot_count', NULL, 22, NULL, 'HERA.FURNITURE.TENDER.FIELD.LOT_COUNT.V1'),
    ('bid_strategy', 'moderate', NULL, NULL, 'HERA.FURNITURE.TENDER.FIELD.BID_STRATEGY.V1'),
    ('ai_confidence', NULL, 72, NULL, 'HERA.FURNITURE.TENDER.FIELD.AI_CONFIDENCE.V1'),
    ('competitor_count', NULL, 3, NULL, 'HERA.FURNITURE.TENDER.FIELD.COMPETITOR_COUNT.V1'),
    ('location', 'Palakkad Forest Region', NULL, NULL, 'HERA.FURNITURE.TENDER.FIELD.LOCATION.V1'),
    ('description', 'Mixed timber species suitable for furniture manufacturing', NULL, NULL, 'HERA.FURNITURE.TENDER.FIELD.DESCRIPTION.V1')
) d(field_name, field_value_text, field_value_number, field_value_date, smart_code)
WHERE e.entity_code = 'KFD/2025/TIMBER/003';

-- Create sample bid submission transactions
INSERT INTO universal_transactions (
  id, 
  transaction_type, 
  transaction_date, 
  organization_id, 
  reference_entity_id, 
  smart_code, 
  total_amount,
  metadata,
  created_at
)
SELECT 
  gen_random_uuid(),
  'bid_submission',
  CURRENT_DATE - INTERVAL '7 days',
  'f0af4ced-9d12-4a55-a649-b484368db249',
  e.id,
  'HERA.FURNITURE.TENDER.BID.SUBMITTED.V1',
  3500000,
  jsonb_build_object(
    'tender_code', 'KFD/2025/WOOD/001',
    'margin_percentage', 12.5,
    'transport_cost', 3200,
    'handling_cost', 900
  ),
  NOW() - INTERVAL '7 days'
FROM core_entities e 
WHERE e.entity_code = 'KFD/2025/WOOD/001';

-- Create EMD payment transaction
INSERT INTO universal_transactions (
  id, 
  transaction_type, 
  transaction_date, 
  organization_id, 
  reference_entity_id, 
  smart_code, 
  total_amount,
  metadata,
  created_at
)
SELECT 
  gen_random_uuid(),
  'emd_payment',
  CURRENT_DATE - INTERVAL '6 days',
  'f0af4ced-9d12-4a55-a649-b484368db249',
  e.id,
  'HERA.FURNITURE.FIN.EMD.PAID.V1',
  90000,
  jsonb_build_object(
    'payment_method', 'bank_transfer',
    'reference_number', 'UTR123456789',
    'bank_name', 'State Bank of India'
  ),
  NOW() - INTERVAL '6 days'
FROM core_entities e 
WHERE e.entity_code = 'KFD/2025/WOOD/001';

-- Add EMD payment line item
INSERT INTO universal_transaction_lines (
  id,
  transaction_id,
  line_entity_id,
  line_number,
  quantity,
  unit_price,
  line_amount,
  smart_code,
  metadata,
  created_at
)
SELECT 
  gen_random_uuid(),
  t.id,
  e.id,
  1,
  1,
  90000,
  90000,
  'HERA.FURNITURE.FIN.EMD.AMOUNT.V1',
  jsonb_build_object(
    'gl_account', '1510000',
    'cost_center', 'TENDER_MGMT'
  ),
  NOW() - INTERVAL '6 days'
FROM universal_transactions t
JOIN core_entities e ON e.entity_code = 'KFD/2025/WOOD/001'
WHERE t.smart_code = 'HERA.FURNITURE.FIN.EMD.PAID.V1'
LIMIT 1;