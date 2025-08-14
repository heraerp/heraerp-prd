
-- Insert MacBook Pro 16-inch
INSERT INTO core_entities (
  id, organization_id, entity_type, entity_name, entity_code, 
  smart_code, status, created_at, updated_at
) VALUES (
  'demo-laptop-001',
  '719dfed1-09b4-4ca8-bfda-f682460de945',
  'inventory_item',
  'MacBook Pro 16-inch',
  'LAPTOP-001',
  'HERA.INV.ITM.ENT.PROD.v1',
  'active',
  '2025-07-31T08:41:22.867Z',
  '2025-07-31T08:41:22.867Z'
);

INSERT INTO core_dynamic_data (
  id, organization_id, entity_id, field_name, field_value, 
  field_type, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '719dfed1-09b4-4ca8-bfda-f682460de945',
  'demo-laptop-001',
  'category',
  'Electronics',
  'string',
  '2025-07-31T08:41:22.867Z',
  '2025-07-31T08:41:22.867Z'
);

INSERT INTO core_dynamic_data (
  id, organization_id, entity_id, field_name, field_value, 
  field_type, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '719dfed1-09b4-4ca8-bfda-f682460de945',
  'demo-laptop-001',
  'sku',
  'MBP-16-M3-512',
  'string',
  '2025-07-31T08:41:22.867Z',
  '2025-07-31T08:41:22.867Z'
);

INSERT INTO core_dynamic_data (
  id, organization_id, entity_id, field_name, field_value, 
  field_type, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '719dfed1-09b4-4ca8-bfda-f682460de945',
  'demo-laptop-001',
  'cost',
  '2199',
  'number',
  '2025-07-31T08:41:22.867Z',
  '2025-07-31T08:41:22.867Z'
);

INSERT INTO core_dynamic_data (
  id, organization_id, entity_id, field_name, field_value, 
  field_type, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '719dfed1-09b4-4ca8-bfda-f682460de945',
  'demo-laptop-001',
  'selling_price',
  '2499',
  'number',
  '2025-07-31T08:41:22.867Z',
  '2025-07-31T08:41:22.867Z'
);

INSERT INTO core_dynamic_data (
  id, organization_id, entity_id, field_name, field_value, 
  field_type, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '719dfed1-09b4-4ca8-bfda-f682460de945',
  'demo-laptop-001',
  'stock_quantity',
  '25',
  'number',
  '2025-07-31T08:41:22.867Z',
  '2025-07-31T08:41:22.867Z'
);

INSERT INTO core_dynamic_data (
  id, organization_id, entity_id, field_name, field_value, 
  field_type, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '719dfed1-09b4-4ca8-bfda-f682460de945',
  'demo-laptop-001',
  'reorder_point',
  '5',
  'number',
  '2025-07-31T08:41:22.867Z',
  '2025-07-31T08:41:22.867Z'
);

INSERT INTO core_dynamic_data (
  id, organization_id, entity_id, field_name, field_value, 
  field_type, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '719dfed1-09b4-4ca8-bfda-f682460de945',
  'demo-laptop-001',
  'reorder_quantity',
  '10',
  'number',
  '2025-07-31T08:41:22.867Z',
  '2025-07-31T08:41:22.867Z'
);

INSERT INTO core_dynamic_data (
  id, organization_id, entity_id, field_name, field_value, 
  field_type, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '719dfed1-09b4-4ca8-bfda-f682460de945',
  'demo-laptop-001',
  'supplier',
  'Apple Inc.',
  'string',
  '2025-07-31T08:41:22.867Z',
  '2025-07-31T08:41:22.867Z'
);

INSERT INTO core_dynamic_data (
  id, organization_id, entity_id, field_name, field_value, 
  field_type, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '719dfed1-09b4-4ca8-bfda-f682460de945',
  'demo-laptop-001',
  'warranty_months',
  '12',
  'number',
  '2025-07-31T08:41:22.867Z',
  '2025-07-31T08:41:22.867Z'
);

-- Insert Office Chair Ergonomic
INSERT INTO core_entities (
  id, organization_id, entity_type, entity_name, entity_code, 
  smart_code, status, created_at, updated_at
) VALUES (
  'demo-chair-001',
  '719dfed1-09b4-4ca8-bfda-f682460de945',
  'inventory_item',
  'Office Chair Ergonomic',
  'CHAIR-001',
  'HERA.INV.ITM.ENT.PROD.v1',
  'active',
  '2025-07-31T08:41:22.867Z',
  '2025-07-31T08:41:22.867Z'
);

INSERT INTO core_dynamic_data (
  id, organization_id, entity_id, field_name, field_value, 
  field_type, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '719dfed1-09b4-4ca8-bfda-f682460de945',
  'demo-chair-001',
  'category',
  'Furniture',
  'string',
  '2025-07-31T08:41:22.867Z',
  '2025-07-31T08:41:22.867Z'
);

INSERT INTO core_dynamic_data (
  id, organization_id, entity_id, field_name, field_value, 
  field_type, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '719dfed1-09b4-4ca8-bfda-f682460de945',
  'demo-chair-001',
  'sku',
  'CHAIR-ERG-001',
  'string',
  '2025-07-31T08:41:22.867Z',
  '2025-07-31T08:41:22.867Z'
);

INSERT INTO core_dynamic_data (
  id, organization_id, entity_id, field_name, field_value, 
  field_type, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '719dfed1-09b4-4ca8-bfda-f682460de945',
  'demo-chair-001',
  'cost',
  '150',
  'number',
  '2025-07-31T08:41:22.867Z',
  '2025-07-31T08:41:22.867Z'
);

INSERT INTO core_dynamic_data (
  id, organization_id, entity_id, field_name, field_value, 
  field_type, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '719dfed1-09b4-4ca8-bfda-f682460de945',
  'demo-chair-001',
  'selling_price',
  '299',
  'number',
  '2025-07-31T08:41:22.867Z',
  '2025-07-31T08:41:22.867Z'
);

INSERT INTO core_dynamic_data (
  id, organization_id, entity_id, field_name, field_value, 
  field_type, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '719dfed1-09b4-4ca8-bfda-f682460de945',
  'demo-chair-001',
  'stock_quantity',
  '45',
  'number',
  '2025-07-31T08:41:22.867Z',
  '2025-07-31T08:41:22.867Z'
);

INSERT INTO core_dynamic_data (
  id, organization_id, entity_id, field_name, field_value, 
  field_type, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '719dfed1-09b4-4ca8-bfda-f682460de945',
  'demo-chair-001',
  'reorder_point',
  '10',
  'number',
  '2025-07-31T08:41:22.867Z',
  '2025-07-31T08:41:22.867Z'
);

INSERT INTO core_dynamic_data (
  id, organization_id, entity_id, field_name, field_value, 
  field_type, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '719dfed1-09b4-4ca8-bfda-f682460de945',
  'demo-chair-001',
  'reorder_quantity',
  '20',
  'number',
  '2025-07-31T08:41:22.867Z',
  '2025-07-31T08:41:22.867Z'
);

INSERT INTO core_dynamic_data (
  id, organization_id, entity_id, field_name, field_value, 
  field_type, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '719dfed1-09b4-4ca8-bfda-f682460de945',
  'demo-chair-001',
  'supplier',
  'ErgoFurniture Co.',
  'string',
  '2025-07-31T08:41:22.867Z',
  '2025-07-31T08:41:22.867Z'
);

INSERT INTO core_dynamic_data (
  id, organization_id, entity_id, field_name, field_value, 
  field_type, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '719dfed1-09b4-4ca8-bfda-f682460de945',
  'demo-chair-001',
  'warranty_months',
  '24',
  'number',
  '2025-07-31T08:41:22.867Z',
  '2025-07-31T08:41:22.867Z'
);

-- Insert RCV-20241231-001
INSERT INTO universal_transactions (
  id, organization_id, transaction_type, transaction_number,
  reference_number, total_amount, status, transaction_date,
  created_at, updated_at
) VALUES (
  'demo-txn-rcv-20241231-001',
  '719dfed1-09b4-4ca8-bfda-f682460de945',
  'inventory_receipt',
  'RCV-20241231-001',
  'PO-2024-1247',
  21990,
  'undefined',
  '2025-07-31T08:41:22.867Z',
  '2025-07-31T08:41:22.867Z',
  '2025-07-31T08:41:22.867Z'
);

INSERT INTO core_dynamic_data (
  id, organization_id, entity_id, field_name, field_value,
  field_type, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '719dfed1-09b4-4ca8-bfda-f682460de945',
  'demo-txn-rcv-20241231-001',
  'supplier',
  'Apple Inc.',
  'string',
  '2025-07-31T08:41:22.867Z',
  '2025-07-31T08:41:22.867Z'
);

INSERT INTO core_dynamic_data (
  id, organization_id, entity_id, field_name, field_value,
  field_type, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '719dfed1-09b4-4ca8-bfda-f682460de945',
  'demo-txn-rcv-20241231-001',
  'received_by',
  'John Smith',
  'string',
  '2025-07-31T08:41:22.867Z',
  '2025-07-31T08:41:22.867Z'
);

INSERT INTO core_dynamic_data (
  id, organization_id, entity_id, field_name, field_value,
  field_type, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '719dfed1-09b4-4ca8-bfda-f682460de945',
  'demo-txn-rcv-20241231-001',
  'receiving_location',
  'Warehouse A',
  'string',
  '2025-07-31T08:41:22.867Z',
  '2025-07-31T08:41:22.867Z'
);

INSERT INTO universal_transaction_lines (
  id, organization_id, transaction_id, line_number, line_type,
  entity_id, quantity, unit_price, line_total, created_at, updated_at
) VALUES (
  'demo-txn-rcv-20241231-001-line-1',
  '719dfed1-09b4-4ca8-bfda-f682460de945',
  'demo-txn-rcv-20241231-001',
  1,
  'item',
  'demo-laptop-001',
  10,
  0,
  21990,
  '2025-07-31T08:41:22.867Z',
  '2025-07-31T08:41:22.867Z'
);