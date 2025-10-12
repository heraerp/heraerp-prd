-- HERA.RESTAURANT.BUNDLE.ORDER.V1 - Core SQL Pattern

-- Step 1: Resolve bundle_code → entity_id
WITH bundle_lookup AS (
  SELECT id, entity_name, metadata
  FROM core_entities
  WHERE organization_id = $1
    AND entity_type = 'bundle'
    AND entity_code = $2
    AND status != 'deleted'
),

-- Step 2: Get bundle composition from relationships
bundle_items AS (
  SELECT 
    r.to_entity_id as item_id,
    r.metadata->>'component' as component,
    r.metadata->>'quantity' as quantity,
    r.metadata->>'allow_substitution' as allow_substitution
  FROM core_relationships r
  JOIN bundle_lookup b ON r.from_entity_id = b.id
  WHERE r.organization_id = $1
    AND r.relationship_type = 'bundle_contains'
),

-- Step 3: Create transaction header
transaction_header AS (
  INSERT INTO universal_transactions (
    organization_id,
    transaction_type,
    transaction_code,
    transaction_date,
    smart_code,
    total_amount,
    metadata,
    from_entity_id,
    to_entity_id
  )
  VALUES (
    $1, -- organization_id
    'pos_order',
    'ORD-' || gen_random_uuid()::text,
    NOW(),
    'HERA.REST.POS.TXN.ORDER.V1',
    $3, -- calculated total
    jsonb_build_object(
      'bundle_code', $2,
      'items_selected', $4
    ),
    $5, -- customer_id (optional)
    $6  -- location_id
  )
  RETURNING id
)

-- Step 4: Insert transaction lines
INSERT INTO universal_transaction_lines (
  transaction_id,
  line_number,
  line_type,
  line_entity_id,
  quantity,
  unit_price,
  line_amount,
  smart_code,
  metadata
)
SELECT 
  th.id,
  row_number() OVER (ORDER BY line_type, item_id),
  line_type,
  item_id,
  quantity,
  unit_price,
  line_amount,
  smart_code,
  metadata
FROM transaction_header th
CROSS JOIN (
  -- Sales lines for bundle items
  SELECT 
    'sales_line' as line_type,
    item_id,
    1 as quantity,
    price as unit_price,
    price as line_amount,
    'HERA.REST.POS.LINE.ITEM.V1' as smart_code,
    jsonb_build_object('component', component) as metadata
  FROM bundle_items bi
  JOIN selected_items si ON bi.component = si.component
  
  UNION ALL
  
  -- Tax lines
  SELECT 
    'tax_line' as line_type,
    tax_account_id as item_id,
    1 as quantity,
    tax_amount as unit_price,
    tax_amount as line_amount,
    'HERA.REST.POS.LINE.TAX.V1' as smart_code,
    jsonb_build_object('tax_rate', tax_rate) as metadata
  FROM tax_calculation
  
  UNION ALL
  
  -- Inventory movement lines
  SELECT
    'inventory_move_line' as line_type,
    item_id,
    -1 * consumption_qty as quantity,
    0 as unit_price,
    0 as line_amount,
    'HERA.INV.MOVE.LINE.CONSUME.V1' as smart_code,
    jsonb_build_object('movement_type', 'consumption') as metadata
  FROM inventory_consumption
) lines;