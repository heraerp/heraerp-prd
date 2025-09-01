-- =============================================
-- HERA TAX & COMPLIANCE TRIGGERS
-- Auto-calculation, validation, and compliance monitoring
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================
-- TAX CALCULATION TRIGGER
-- =============================================

-- Function to auto-calculate tax on transactions
CREATE OR REPLACE FUNCTION hera_tax__auto_calculate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tax_code TEXT;
  v_tax_rate NUMERIC;
  v_tax_amount NUMERIC;
  v_jurisdiction_id UUID;
BEGIN
  -- Only process transactions that need tax calculation
  IF NEW.smart_code NOT LIKE 'HERA.%.SALE.%' 
     AND NEW.smart_code NOT LIKE 'HERA.%.PURCHASE.%' THEN
    RETURN NEW;
  END IF;

  -- Skip if tax already calculated
  IF NEW.metadata->>'tax_calculated' = 'true' THEN
    RETURN NEW;
  END IF;

  -- Get tax code from transaction or entity
  v_tax_code := COALESCE(
    NEW.metadata->>'tax_code',
    (SELECT field_value_text 
     FROM core_dynamic_data 
     WHERE entity_id = NEW.from_entity_id 
       AND field_name = 'default_tax_code'
       AND organization_id = NEW.organization_id
     LIMIT 1)
  );

  IF v_tax_code IS NULL THEN
    RETURN NEW; -- No tax code, skip calculation
  END IF;

  -- Get tax rate and jurisdiction
  SELECT 
    cd.field_value_number,
    cd.entity_id
  INTO 
    v_tax_rate,
    v_jurisdiction_id
  FROM core_dynamic_data cd
  WHERE cd.organization_id = NEW.organization_id
    AND cd.field_name = 'tax_rate'
    AND cd.metadata->>'tax_code' = v_tax_code
    AND cd.metadata->>'effective_date' <= NEW.transaction_date::text
  ORDER BY cd.metadata->>'effective_date' DESC
  LIMIT 1;

  IF v_tax_rate IS NOT NULL AND v_tax_rate > 0 THEN
    -- Calculate tax amount
    v_tax_amount := ROUND(NEW.total_amount * v_tax_rate / 100, 2);

    -- Update transaction metadata
    NEW.metadata := NEW.metadata || jsonb_build_object(
      'tax_calculated', true,
      'tax_code', v_tax_code,
      'tax_rate', v_tax_rate,
      'tax_amount', v_tax_amount,
      'tax_jurisdiction_id', v_jurisdiction_id,
      'tax_calculation_date', CURRENT_TIMESTAMP
    );

    -- Create tax transaction line
    INSERT INTO universal_transaction_lines (
      organization_id,
      transaction_id,
      line_number,
      line_entity_id,
      line_amount,
      smart_code,
      metadata
    ) VALUES (
      NEW.organization_id,
      NEW.id,
      999, -- Tax line number
      v_jurisdiction_id,
      v_tax_amount,
      'HERA.TAX.AUTO.CALC.LINE.v1',
      jsonb_build_object(
        'tax_code', v_tax_code,
        'tax_rate', v_tax_rate,
        'tax_type', 'output',
        'auto_calculated', true
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create tax calculation trigger
DROP TRIGGER IF EXISTS utx__tax_auto_calc ON universal_transactions;
CREATE TRIGGER utx__tax_auto_calc
BEFORE INSERT OR UPDATE ON universal_transactions
FOR EACH ROW
EXECUTE FUNCTION hera_tax__auto_calculate();

-- =============================================
-- TAX RETURN AGGREGATION
-- =============================================

-- Function to aggregate tax data for returns
CREATE OR REPLACE FUNCTION hera_tax__aggregate_return(
  p_org_id UUID,
  p_tax_type TEXT,
  p_period_start DATE,
  p_period_end DATE
)
RETURNS TABLE (
  tax_code TEXT,
  tax_rate NUMERIC,
  taxable_amount NUMERIC,
  tax_amount NUMERIC,
  transaction_count INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tl.metadata->>'tax_code' as tax_code,
    (tl.metadata->>'tax_rate')::numeric as tax_rate,
    SUM(t.total_amount) as taxable_amount,
    SUM(tl.line_amount) as tax_amount,
    COUNT(DISTINCT t.id)::integer as transaction_count
  FROM universal_transactions t
  INNER JOIN universal_transaction_lines tl 
    ON t.id = tl.transaction_id
    AND t.organization_id = tl.organization_id
  WHERE t.organization_id = p_org_id
    AND t.transaction_date BETWEEN p_period_start AND p_period_end
    AND tl.smart_code = 'HERA.TAX.AUTO.CALC.LINE.v1'
    AND (
      (p_tax_type = 'GST' AND tl.metadata->>'tax_code' LIKE 'GST%') OR
      (p_tax_type = 'VAT' AND tl.metadata->>'tax_code' LIKE 'VAT%') OR
      (p_tax_type = 'SALES' AND tl.metadata->>'tax_code' LIKE 'ST%')
    )
  GROUP BY 
    tl.metadata->>'tax_code',
    tl.metadata->>'tax_rate'
  ORDER BY 
    tax_code;
END;
$$;

-- =============================================
-- COMPLIANCE MONITORING
-- =============================================

-- Function to check compliance deadlines
CREATE OR REPLACE FUNCTION hera_tax__check_compliance_deadlines()
RETURNS TABLE (
  organization_id UUID,
  tax_type TEXT,
  jurisdiction TEXT,
  due_date DATE,
  days_remaining INTEGER,
  status TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH filing_calendar AS (
    SELECT 
      cd.organization_id,
      cd.metadata->>'tax_type' as tax_type,
      cd.metadata->>'jurisdiction' as jurisdiction,
      (cd.metadata->>'due_date')::date as due_date,
      cd.entity_id as calendar_id
    FROM core_dynamic_data cd
    WHERE cd.field_name = 'tax_filing_due'
      AND cd.smart_code = 'HERA.TAX.CAL.DUE.v1'
      AND (cd.metadata->>'due_date')::date >= CURRENT_DATE
  ),
  filing_status AS (
    SELECT DISTINCT
      t.organization_id,
      t.metadata->>'calendar_id' as calendar_id,
      t.metadata->>'filing_status' as status
    FROM universal_transactions t
    WHERE t.smart_code IN ('HERA.TAX.GST.RETURN.v1', 'HERA.TAX.VAT.RETURN.v1', 'HERA.TAX.SALES.RETURN.v1')
      AND t.created_at >= CURRENT_DATE - INTERVAL '90 days'
  )
  SELECT 
    fc.organization_id,
    fc.tax_type,
    fc.jurisdiction,
    fc.due_date,
    (fc.due_date - CURRENT_DATE)::integer as days_remaining,
    CASE 
      WHEN fs.status = 'filed' THEN 'completed'
      WHEN fc.due_date < CURRENT_DATE THEN 'overdue'
      WHEN fc.due_date - CURRENT_DATE <= 7 THEN 'urgent'
      WHEN fc.due_date - CURRENT_DATE <= 30 THEN 'upcoming'
      ELSE 'future'
    END as status
  FROM filing_calendar fc
  LEFT JOIN filing_status fs 
    ON fc.calendar_id::text = fs.calendar_id
    AND fc.organization_id = fs.organization_id
  ORDER BY fc.due_date;
END;
$$;

-- =============================================
-- ANOMALY DETECTION
-- =============================================

-- Function to detect tax anomalies
CREATE OR REPLACE FUNCTION hera_tax__detect_anomalies(
  p_org_id UUID,
  p_check_period INTEGER DEFAULT 30
)
RETURNS TABLE (
  anomaly_type TEXT,
  entity_id UUID,
  transaction_id UUID,
  expected_value NUMERIC,
  actual_value NUMERIC,
  variance_percent NUMERIC,
  confidence_score NUMERIC,
  details JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check for unusual tax credits
  INSERT INTO core_dynamic_data (
    organization_id,
    entity_id,
    field_name,
    field_value_json,
    smart_code
  )
  SELECT 
    p_org_id,
    t.id,
    'tax_anomaly',
    jsonb_build_object(
      'type', 'unusual_credit',
      'detected_at', CURRENT_TIMESTAMP,
      'credit_amount', t.total_amount,
      'average_credit', avg_credit.avg_amount,
      'variance_percent', ((t.total_amount - avg_credit.avg_amount) / avg_credit.avg_amount * 100)
    ),
    'HERA.TAX.AI.ANOMALY.v1'
  FROM universal_transactions t
  CROSS JOIN LATERAL (
    SELECT AVG(total_amount) as avg_amount
    FROM universal_transactions
    WHERE organization_id = p_org_id
      AND smart_code = t.smart_code
      AND transaction_date >= CURRENT_DATE - INTERVAL '90 days'
      AND transaction_type = 'tax_credit'
  ) avg_credit
  WHERE t.organization_id = p_org_id
    AND t.transaction_type = 'tax_credit'
    AND t.transaction_date >= CURRENT_DATE - p_check_period * INTERVAL '1 day'
    AND t.total_amount > avg_credit.avg_amount * 2 -- 100% higher than average
  ON CONFLICT DO NOTHING;

  -- Return detected anomalies
  RETURN QUERY
  SELECT 
    cd.metadata->>'type' as anomaly_type,
    cd.entity_id,
    cd.entity_id as transaction_id,
    (cd.field_value_json->>'average_credit')::numeric as expected_value,
    (cd.field_value_json->>'credit_amount')::numeric as actual_value,
    (cd.field_value_json->>'variance_percent')::numeric as variance_percent,
    CASE 
      WHEN (cd.field_value_json->>'variance_percent')::numeric > 200 THEN 0.95
      WHEN (cd.field_value_json->>'variance_percent')::numeric > 150 THEN 0.85
      ELSE 0.75
    END as confidence_score,
    cd.field_value_json as details
  FROM core_dynamic_data cd
  WHERE cd.organization_id = p_org_id
    AND cd.field_name = 'tax_anomaly'
    AND cd.smart_code = 'HERA.TAX.AI.ANOMALY.v1'
    AND cd.created_at >= CURRENT_TIMESTAMP - p_check_period * INTERVAL '1 day'
  ORDER BY variance_percent DESC;
END;
$$;

-- =============================================
-- AUTO TAX RETURN TRIGGER
-- =============================================

-- Function to trigger tax return processing
CREATE OR REPLACE FUNCTION hera_tax__on_return_create()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_edge_url TEXT;
  v_edge_token TEXT;
BEGIN
  -- Only process tax return transactions
  IF NEW.smart_code NOT IN ('HERA.TAX.GST.RETURN.v1', 'HERA.TAX.VAT.RETURN.v1', 'HERA.TAX.WHT.REPORT.v1') THEN
    RETURN NEW;
  END IF;

  -- Get edge function configuration
  v_edge_url := current_setting('app.edge_tax_url', true);
  v_edge_token := current_setting('app.edge_token', true);

  IF v_edge_url IS NOT NULL AND v_edge_token IS NOT NULL THEN
    -- Call edge function to process return
    PERFORM net.http_post(
      url := v_edge_url || '/tax/process-return',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || v_edge_token,
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'organization_id', NEW.organization_id,
        'transaction_id', NEW.id,
        'return_type', NEW.smart_code,
        'metadata', NEW.metadata
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create return processing trigger
DROP TRIGGER IF EXISTS utx__tax_return_process ON universal_transactions;
CREATE TRIGGER utx__tax_return_process
AFTER INSERT ON universal_transactions
FOR EACH ROW
WHEN (NEW.smart_code IN ('HERA.TAX.GST.RETURN.v1', 'HERA.TAX.VAT.RETURN.v1', 'HERA.TAX.WHT.REPORT.v1'))
EXECUTE FUNCTION hera_tax__on_return_create();

-- =============================================
-- TAX CODE VALIDATION
-- =============================================

-- Function to validate tax codes
CREATE OR REPLACE FUNCTION hera_tax__validate_code()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_valid_code BOOLEAN;
BEGIN
  -- Only validate if tax code is provided
  IF NEW.metadata->>'tax_code' IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check if tax code exists and is active
  SELECT EXISTS(
    SELECT 1 
    FROM core_entities
    WHERE organization_id = NEW.organization_id
      AND entity_type = 'tax_code'
      AND entity_code = NEW.metadata->>'tax_code'
      AND (metadata->>'active')::boolean = true
  ) INTO v_valid_code;

  IF NOT v_valid_code THEN
    RAISE EXCEPTION 'Invalid or inactive tax code: %', NEW.metadata->>'tax_code'
      USING ERRCODE = 'P0003',
            HINT = 'Please use a valid, active tax code';
  END IF;

  RETURN NEW;
END;
$$;

-- Create tax code validation trigger
DROP TRIGGER IF EXISTS utx__validate_tax_code ON universal_transactions;
CREATE TRIGGER utx__validate_tax_code
BEFORE INSERT OR UPDATE ON universal_transactions
FOR EACH ROW
WHEN (NEW.metadata->>'tax_code' IS NOT NULL)
EXECUTE FUNCTION hera_tax__validate_code();

-- =============================================
-- IMMUTABILITY FOR FILED RETURNS
-- =============================================

-- Function to prevent modification of filed returns
CREATE OR REPLACE FUNCTION hera_tax__enforce_filing_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if return is filed
  IF OLD.smart_code IN ('HERA.TAX.GST.RETURN.v1', 'HERA.TAX.VAT.RETURN.v1', 'HERA.TAX.WHT.REPORT.v1')
     AND OLD.metadata->>'filing_status' = 'filed'
     AND (OLD.metadata IS DISTINCT FROM NEW.metadata 
          OR OLD.total_amount IS DISTINCT FROM NEW.total_amount) THEN
    RAISE EXCEPTION 'Cannot modify filed tax return %', OLD.transaction_code
      USING ERRCODE = 'P0004',
            HINT = 'File an amended return instead';
  END IF;

  RETURN NEW;
END;
$$;

-- Create immutability trigger
DROP TRIGGER IF EXISTS utx__tax_filing_immutable ON universal_transactions;
CREATE TRIGGER utx__tax_filing_immutable
BEFORE UPDATE ON universal_transactions
FOR EACH ROW
EXECUTE FUNCTION hera_tax__enforce_filing_immutability();

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================

-- Index for tax code lookups
CREATE INDEX IF NOT EXISTS idx_tax_code_lookup 
ON core_dynamic_data(organization_id, field_name, metadata->>'tax_code')
WHERE field_name IN ('tax_rate', 'tax_jurisdiction');

-- Index for tax return queries
CREATE INDEX IF NOT EXISTS idx_tax_returns
ON universal_transactions(organization_id, smart_code, transaction_date)
WHERE smart_code LIKE 'HERA.TAX.%.RETURN.v1';

-- Index for tax lines
CREATE INDEX IF NOT EXISTS idx_tax_lines
ON universal_transaction_lines(organization_id, smart_code, metadata->>'tax_code')
WHERE smart_code = 'HERA.TAX.AUTO.CALC.LINE.v1';

-- =============================================
-- GRANTS
-- =============================================

GRANT EXECUTE ON FUNCTION hera_tax__auto_calculate() TO authenticated;
GRANT EXECUTE ON FUNCTION hera_tax__aggregate_return(UUID, TEXT, DATE, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION hera_tax__check_compliance_deadlines() TO authenticated;
GRANT EXECUTE ON FUNCTION hera_tax__detect_anomalies(UUID, INTEGER) TO authenticated;