INSERT INTO core_dynamic_data (id, organization_id, entity_id, key, value, value_type, created_at)
VALUES
  (gen_random_uuid(), '${ORG_ID}', '${ENTITY_PRODUCT_1}', 'sku', 'SKU-001', 'string', NOW()),
  (gen_random_uuid(), '${ORG_ID}', '${ENTITY_PRODUCT_1}', 'price', '19.99', 'number', NOW());

