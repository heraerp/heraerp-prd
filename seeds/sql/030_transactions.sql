INSERT INTO universal_transactions
  (id, organization_id, smart_code, occurred_at, ai_confidence, metadata)
VALUES
  ('${TX_ORDER_1}', '${ORG_ID}', 'HERA.RETAIL.ORDERS.SALE.ONLINE.V1',
   NOW(), 1.0, '{"seed":"test"}')
ON CONFLICT (id) DO NOTHING;

