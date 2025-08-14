  -- This runs AUTOMATICALLY when any transaction is created
  CREATE OR REPLACE FUNCTION process_smart_code_posting()
  RETURNS TRIGGER AS $$
  DECLARE
    v_action_type TEXT;
    v_module TEXT;
  BEGIN
    -- Parse the Smart Code
    -- HERA.PROC.GR.RECEIPT.v1 → ['HERA', 'PROC', 'GR', 'RECEIPT', 'v1']
    v_action_type := split_part(NEW.smart_code, '.', 4);
    v_module := split_part(NEW.smart_code, '.', 2);

    -- Deterministic rules based on action type
    CASE v_action_type
      WHEN 'CREATE' THEN
        -- No GL posting for CREATE actions
        NEW.metadata = jsonb_set(NEW.metadata, '{gl_posting_required}', 'false');

      WHEN 'RECEIPT', 'ORDER', 'POST', 'COMPLETE' THEN
        -- These actions require GL posting
        NEW.metadata = jsonb_set(NEW.metadata, '{gl_posting_required}', 'true');

        -- Call posting function based on module
        PERFORM create_gl_entries(NEW.id, v_module, v_action_type);

      WHEN 'PAYMENT', 'VENDOR', 'CUSTOMER' THEN
        -- Payment actions always post
        NEW.metadata = jsonb_set(NEW.metadata, '{gl_posting_required}', 'true');
        PERFORM create_payment_entries(NEW.id, v_action_type);
    END CASE;

    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  -- Attach to universal_transactions table
  CREATE TRIGGER smart_code_processor
    BEFORE INSERT OR UPDATE ON universal_transactions
    FOR EACH ROW
    EXECUTE FUNCTION process_smart_code_posting();