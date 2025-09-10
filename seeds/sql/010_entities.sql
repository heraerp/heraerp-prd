INSERT INTO core_entities (id, organization_id, smart_code, created_at)
VALUES
  ('${ENTITY_PRODUCT_1}', '${ORG_ID}', 'HERA.RETAIL.CATALOG.PRODUCT.STANDARD.v1', NOW()),
  ('${ENTITY_CUSTOMER_1}', '${ORG_ID}', 'HERA.RETAIL.CRM.CUSTOMER.CONSUMER.v1', NOW())
ON CONFLICT (id) DO NOTHING;

