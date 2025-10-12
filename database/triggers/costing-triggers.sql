-- =============================================
-- HERA COSTING & PROFITABILITY TRIGGERS
-- Auto-execution and validation triggers
-- =============================================

-- Enable pg_net for HTTP requests (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Idempotency constraint for costing runs
-- Prevents duplicate runs with same run_id
ALTER TABLE universal_transactions 
DROP CONSTRAINT IF EXISTS utx_unique_run;

ALTER TABLE universal_transactions
ADD CONSTRAINT utx_unique_run
UNIQUE (
  organization_id, 
  smart_code, 
  COALESCE((metadata->>'run_id')::text, '')
);

-- =============================================
-- AUTO-EXECUTION TRIGGER
-- =============================================

-- Function to trigger Edge Function on costing/profit transactions
CREATE OR REPLACE FUNCTION hera_cost__on_utx_insert() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  v_edge_url TEXT;
  v_edge_token TEXT;
BEGIN
  -- Only process COSTING and PROFIT smart codes
  IF NEW.smart_code ~ '^HERA\.(COSTING|PROFIT)\.' THEN
    -- Get edge function configuration
    v_edge_url := current_setting('app.edge_costing_url', true);
    v_edge_token := current_setting('app.edge_token', true);
    
    -- Skip if not configured
    IF v_edge_url IS NULL OR v_edge_token IS NULL THEN
      RAISE WARNING 'Edge function not configured for costing/profitability';
      RETURN NEW;
    END IF;
    
    -- Call edge function asynchronously
    PERFORM net.http_post(
      url := v_edge_url || '/costing/dispatch',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || v_edge_token,
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'organization_id', NEW.organization_id,
        'transaction_id', NEW.id,
        'smart_code', NEW.smart_code,
        'metadata', NEW.metadata
      )
    );
    
    -- Log the trigger execution
    INSERT INTO core_dynamic_data (
      organization_id,
      entity_id,
      field_name,
      field_value_json,
      smart_code
    ) VALUES (
      NEW.organization_id,
      NEW.id,
      'auto_execution_triggered',
      jsonb_build_object(
        'triggered_at', CURRENT_TIMESTAMP,
        'smart_code', NEW.smart_code,
        'edge_url', v_edge_url
      ),
      'HERA.COSTING.EVENT.TRIGGERED.V1'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS utx__costprofit__auto ON universal_transactions;
CREATE TRIGGER utx__costprofit__auto
AFTER INSERT ON universal_transactions
FOR EACH ROW 
EXECUTE FUNCTION hera_cost__on_utx_insert();

-- =============================================
-- ALLOCATION BALANCE VALIDATION
-- =============================================

-- Function to validate allocation balance
CREATE OR REPLACE FUNCTION hera_alloc__assert_balanced(
  p_tx UUID, 
  p_org UUID
)
RETURNS VOID 
LANGUAGE plpgsql 
AS $$
DECLARE 
  v_diff NUMERIC;
  v_sender_total NUMERIC;
  v_receiver_total NUMERIC;
BEGIN
  -- Calculate sender total (debits)
  SELECT COALESCE(SUM(
    CASE 
      WHEN (metadata->>'line_role') = 'sender' 
      THEN line_amount 
      ELSE 0 
    END
  ), 0)
  INTO v_sender_total
  FROM universal_transaction_lines
  WHERE transaction_id = p_tx 
    AND organization_id = p_org;

  -- Calculate receiver total (credits)
  SELECT COALESCE(SUM(
    CASE 
      WHEN (metadata->>'line_role') = 'receiver' 
      THEN line_amount 
      ELSE 0 
    END
  ), 0)
  INTO v_receiver_total
  FROM universal_transaction_lines
  WHERE transaction_id = p_tx 
    AND organization_id = p_org;

  -- Check balance
  v_diff := v_sender_total - v_receiver_total;
  
  IF ABS(COALESCE(v_diff, 0)) > 0.01 THEN -- Allow 1 cent tolerance
    RAISE EXCEPTION 'Allocation not balanced for transaction % (org %): Sender=%, Receiver=%, Diff=%', 
      p_tx, p_org, v_sender_total, v_receiver_total, v_diff
      USING ERRCODE = 'P0001',
            HINT = 'Ensure sender and receiver amounts are equal';
  END IF;
END;
$$;

-- Trigger to validate allocation transactions
CREATE OR REPLACE FUNCTION hera_alloc__validate_on_commit()
RETURNS TRIGGER 
LANGUAGE plpgsql 
AS $$
BEGIN
  -- Only validate allocation transactions
  IF NEW.smart_code LIKE 'HERA.COSTING.ALLOC.%' THEN
    -- Defer validation to allow all lines to be inserted first
    PERFORM hera_alloc__assert_balanced(NEW.transaction_id, NEW.organization_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create deferred constraint trigger
DROP TRIGGER IF EXISTS utx_lines__alloc_balance ON universal_transaction_lines;
CREATE CONSTRAINT TRIGGER utx_lines__alloc_balance
AFTER INSERT OR UPDATE ON universal_transaction_lines
DEFERRABLE INITIALLY DEFERRED
FOR EACH ROW
WHEN (NEW.smart_code LIKE 'HERA.COSTING.ALLOC.%.LINE.V1')
EXECUTE FUNCTION hera_alloc__validate_on_commit();

-- =============================================
-- CIRCULAR REFERENCE DETECTION
-- =============================================

-- Function to detect circular references in BOM or allocations
CREATE OR REPLACE FUNCTION hera_cost__check_circular(
  p_entity_id UUID,
  p_relationship_type TEXT,
  p_org_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  v_has_circular BOOLEAN := FALSE;
BEGIN
  -- Use recursive CTE to detect cycles
  WITH RECURSIVE hierarchy AS (
    -- Base case: start entity
    SELECT 
      from_entity_id,
      to_entity_id,
      1 as level,
      ARRAY[from_entity_id] as path,
      FALSE as is_circular
    FROM core_relationships
    WHERE from_entity_id = p_entity_id
      AND relationship_type = p_relationship_type
      AND organization_id = p_org_id
    
    UNION ALL
    
    -- Recursive case
    SELECT 
      r.from_entity_id,
      r.to_entity_id,
      h.level + 1,
      h.path || r.from_entity_id,
      r.to_entity_id = ANY(h.path) as is_circular
    FROM core_relationships r
    INNER JOIN hierarchy h ON r.from_entity_id = h.to_entity_id
    WHERE r.relationship_type = p_relationship_type
      AND r.organization_id = p_org_id
      AND h.level < 50 -- Max depth to prevent infinite recursion
      AND NOT h.is_circular
  )
  SELECT EXISTS(SELECT 1 FROM hierarchy WHERE is_circular)
  INTO v_has_circular;
  
  RETURN v_has_circular;
END;
$$;

-- =============================================
-- COST RELEASE IMMUTABILITY
-- =============================================

-- Function to prevent modifications to released cost estimates
CREATE OR REPLACE FUNCTION hera_cost__enforce_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if the transaction is released
  IF OLD.smart_code LIKE 'HERA.COSTING.%' 
     AND OLD.metadata->>'status' = 'released' 
     AND OLD.metadata IS DISTINCT FROM NEW.metadata THEN
    RAISE EXCEPTION 'Cannot modify released cost estimate %', OLD.id
      USING ERRCODE = 'P0002',
            HINT = 'Create a new version instead of modifying released estimates';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create immutability trigger
DROP TRIGGER IF EXISTS utx__cost_immutable ON universal_transactions;
CREATE TRIGGER utx__cost_immutable
BEFORE UPDATE ON universal_transactions
FOR EACH ROW
WHEN (OLD.smart_code LIKE 'HERA.COSTING.%')
EXECUTE FUNCTION hera_cost__enforce_immutability();

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================

-- Index for finding costing transactions by run_id
CREATE INDEX IF NOT EXISTS idx_utx_costing_run_id 
ON universal_transactions((metadata->>'run_id')) 
WHERE smart_code LIKE 'HERA.COSTING.%';

-- Index for allocation line lookups
CREATE INDEX IF NOT EXISTS idx_utl_alloc_role
ON universal_transaction_lines((metadata->>'line_role'))
WHERE smart_code LIKE 'HERA.COSTING.ALLOC.%.LINE.%';

-- Index for profitability slice queries
CREATE INDEX IF NOT EXISTS idx_utx_profit_dims
ON universal_transactions USING gin((metadata->'slice'->'dims'))
WHERE smart_code LIKE 'HERA.PROFIT.%';

-- =============================================
-- GRANTS
-- =============================================

GRANT EXECUTE ON FUNCTION hera_cost__on_utx_insert() TO authenticated;
GRANT EXECUTE ON FUNCTION hera_alloc__assert_balanced(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION hera_cost__check_circular(UUID, TEXT, UUID) TO authenticated;