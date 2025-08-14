
  CREATE OR REPLACE FUNCTION create_gl_entries(
    p_transaction_id UUID,
    p_module TEXT,
    p_action TEXT
  ) RETURNS VOID AS $$
  DECLARE
    v_gl_entries JSONB;
  BEGIN
    -- Determine GL accounts based on module and action
    v_gl_entries := CASE
      WHEN p_module = 'REST' AND p_action = 'ORDER' THEN
        -- Restaurant sale posting
        jsonb_build_array(
          jsonb_build_object('account', '1100000', 'debit',
            (SELECT total_amount FROM universal_transactions WHERE id = p_transaction_id)),
          jsonb_build_object('account', '4110000', 'credit',
            (SELECT total_amount FROM universal_transactions WHERE id = p_transaction_id))
        )

      WHEN p_module = 'INV' AND p_action = 'RECEIPT' THEN
        -- Goods receipt posting
        jsonb_build_array(
          jsonb_build_object('account', '1330000', 'debit',
            (SELECT total_amount FROM universal_transactions WHERE id = p_transaction_id)),
          jsonb_build_object('account', '2100000', 'credit',
            (SELECT total_amount FROM universal_transactions WHERE id = p_transaction_id))
        )
    END;
