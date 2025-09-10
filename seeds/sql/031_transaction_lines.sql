INSERT INTO universal_transaction_lines
  (id, transaction_id, organization_id, entity_id, smart_code, quantity, amount, metadata)
VALUES
  (gen_random_uuid(), '${TX_ORDER_1}', '${ORG_ID}', '${ENTITY_PRODUCT_1}',
   'HERA.RETAIL.ORDERS.LINE.ITEM.v1', 1, 19.99, '{"seed":"test"}');

