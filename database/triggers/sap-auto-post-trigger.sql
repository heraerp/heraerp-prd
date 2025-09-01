-- HERA SAP FI Auto-Posting Trigger
-- Automatically posts transactions to SAP when they have SAP smart codes

-- Create function to check if transaction should be posted to SAP
CREATE OR REPLACE FUNCTION should_post_to_sap(p_smart_code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if it's a SAP FI smart code that requires posting
  RETURN p_smart_code LIKE 'HERA.ERP.FI.%' 
    AND p_smart_code NOT LIKE '%.ERROR.%'
    AND p_smart_code NOT LIKE '%.EVENT.%'
    AND p_smart_code NOT LIKE '%.MD.%';
END;
$$ LANGUAGE plpgsql;

-- Create function to handle auto-posting
CREATE OR REPLACE FUNCTION auto_post_to_sap()
RETURNS TRIGGER AS $$
DECLARE
  v_edge_url TEXT;
  v_edge_token TEXT;
BEGIN
  -- Only process if it's a SAP-relevant transaction
  IF NOT should_post_to_sap(NEW.smart_code) THEN
    RETURN NEW;
  END IF;
  
  -- Only process if status is 'pending' or 'validated'
  IF NEW.transaction_status NOT IN ('pending', 'validated') THEN
    RETURN NEW;
  END IF;
  
  -- Get edge function configuration
  v_edge_url := current_setting('app.sap_edge_url', true);
  v_edge_token := current_setting('app.edge_token', true);
  
  -- If edge function is configured, call it
  IF v_edge_url IS NOT NULL AND v_edge_token IS NOT NULL THEN
    -- Call edge function asynchronously
    PERFORM net.http_post(
      url := v_edge_url || '/sap-post',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || v_edge_token,
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'transaction_id', NEW.id,
        'organization_id', NEW.organization_id,
        'smart_code', NEW.smart_code
      )
    );
    
    -- Update status to indicate posting in progress
    NEW.transaction_status := 'posting';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_auto_post_to_sap ON universal_transactions;
CREATE TRIGGER trigger_auto_post_to_sap
  AFTER INSERT OR UPDATE OF transaction_status
  ON universal_transactions
  FOR EACH ROW
  EXECUTE FUNCTION auto_post_to_sap();

-- Create function to handle batch posting
CREATE OR REPLACE FUNCTION batch_post_to_sap(
  p_organization_id UUID,
  p_from_date DATE DEFAULT CURRENT_DATE,
  p_to_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  transaction_id UUID,
  status TEXT,
  message TEXT
) AS $$
DECLARE
  v_transaction RECORD;
  v_edge_url TEXT;
  v_edge_token TEXT;
  v_result JSONB;
BEGIN
  -- Get edge function configuration
  v_edge_url := current_setting('app.sap_edge_url', true);
  v_edge_token := current_setting('app.edge_token', true);
  
  IF v_edge_url IS NULL OR v_edge_token IS NULL THEN
    RAISE EXCEPTION 'SAP edge function not configured';
  END IF;
  
  -- Process each pending transaction
  FOR v_transaction IN
    SELECT t.*
    FROM universal_transactions t
    WHERE t.organization_id = p_organization_id
      AND t.transaction_date BETWEEN p_from_date AND p_to_date
      AND t.transaction_status IN ('pending', 'validated')
      AND should_post_to_sap(t.smart_code)
    ORDER BY t.transaction_date, t.created_at
  LOOP
    BEGIN
      -- Call edge function
      SELECT net.http_post(
        url := v_edge_url || '/sap-post',
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || v_edge_token,
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
          'transaction_id', v_transaction.id,
          'organization_id', v_transaction.organization_id,
          'smart_code', v_transaction.smart_code
        )
      )::jsonb INTO v_result;
      
      -- Return result
      transaction_id := v_transaction.id;
      status := 'success';
      message := 'Posted to SAP';
      RETURN NEXT;
      
    EXCEPTION WHEN OTHERS THEN
      -- Log error and continue
      transaction_id := v_transaction.id;
      status := 'error';
      message := SQLERRM;
      RETURN NEXT;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check posting status
CREATE OR REPLACE FUNCTION get_sap_posting_status(p_transaction_id UUID)
RETURNS TABLE (
  status TEXT,
  sap_document_number TEXT,
  sap_fiscal_year TEXT,
  posted_at TIMESTAMP,
  error_message TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.transaction_status as status,
    t.metadata->>'sap_document_number' as sap_document_number,
    t.metadata->>'sap_fiscal_year' as sap_fiscal_year,
    (t.metadata->>'sap_posted_at')::timestamp as posted_at,
    d.field_value_text as error_message
  FROM universal_transactions t
  LEFT JOIN LATERAL (
    SELECT field_value_text
    FROM core_dynamic_data
    WHERE entity_id = t.id
      AND field_name = 'sap_posting_error'
    ORDER BY created_at DESC
    LIMIT 1
  ) d ON true
  WHERE t.id = p_transaction_id;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION should_post_to_sap TO authenticated;
GRANT EXECUTE ON FUNCTION batch_post_to_sap TO authenticated;
GRANT EXECUTE ON FUNCTION get_sap_posting_status TO authenticated;