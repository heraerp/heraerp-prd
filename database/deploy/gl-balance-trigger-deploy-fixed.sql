-- =====================================================================
-- HERA GL Balance Trigger - FIXED for Supabase Deployment
-- =====================================================================
-- This script creates a GL balance validation trigger that ONLY fires
-- for actual accounting transactions (smart_code contains '.GL.')
-- 
-- FIX: Corrected WHEN condition to handle DELETE operations properly
-- =====================================================================

-- Create the trigger function
CREATE OR REPLACE FUNCTION hera_gl_balance_check_biu()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_txn_id uuid := COALESCE(NEW.transaction_id, OLD.transaction_id);
  v_org_id uuid := COALESCE(NEW.organization_id, OLD.organization_id);
  v_gl_line_count integer;
  v_total_debits  numeric(15,2);
  v_total_credits numeric(15,2);
  v_diff          numeric(15,2);
BEGIN
  -- Skip trigger entirely if no GL lines exist
  -- Only check GL transactions (accounting entries), not operational transactions
  SELECT COUNT(*)
  INTO v_gl_line_count
  FROM universal_transaction_lines
  WHERE transaction_id = v_txn_id
    AND organization_id = v_org_id
    AND smart_code ~* '\.GL\.';      -- Only GL (General Ledger) lines
    
  -- If no GL lines, skip balance validation entirely
  IF v_gl_line_count = 0 THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Sum only GL lines (by smart_code containing ".GL.")
  SELECT
    COALESCE(SUM(CASE WHEN line_amount >= 0 THEN line_amount ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN line_amount <  0 THEN -line_amount ELSE 0 END), 0)
  INTO v_total_debits, v_total_credits
  FROM universal_transaction_lines
  WHERE transaction_id = v_txn_id
    AND organization_id = v_org_id  -- multi-tenant isolation
    AND smart_code ~* '\.GL\.';     -- GL lines only

  v_diff := ABS(v_total_debits - v_total_credits);

  -- Allow small rounding differences
  IF v_diff > 0.01 THEN
    RAISE EXCEPTION
      'GL transaction not balanced: Debits=% Credits=% Difference=% (txn=%)',
      v_total_debits, v_total_credits, v_diff, v_txn_id;
  END IF;

  -- Optional audit trail as a separate UT header (valid per schema)
  INSERT INTO universal_transactions(
    id,
    organization_id, 
    transaction_type, 
    smart_code, 
    total_amount, 
    metadata,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    v_org_id,
    'GL_BALANCE_VALIDATION',
    'HERA.ACCOUNTING.GUARDRAIL.GL.BALANCED.V2',
    0,
    jsonb_build_object(
      'transaction_id', v_txn_id,
      'total_debits', v_total_debits,
      'total_credits', v_total_credits,
      'balance_difference', v_diff,
      'validation_status', 'PASSED'
    ),
    NOW()
  );

  RETURN COALESCE(NEW, OLD);
END$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_gl_balance_biu ON universal_transaction_lines;

-- Create the trigger with corrected WHEN condition
-- Fixed: Use separate conditions for INSERT/UPDATE vs DELETE
CREATE TRIGGER trg_gl_balance_biu
AFTER INSERT OR UPDATE OR DELETE ON universal_transaction_lines
FOR EACH ROW 
WHEN (
  -- For INSERT/UPDATE: check NEW.smart_code
  -- For DELETE: check OLD.smart_code  
  (TG_OP IN ('INSERT', 'UPDATE') AND NEW.smart_code ~* '\.GL\.') OR
  (TG_OP = 'DELETE' AND OLD.smart_code ~* '\.GL\.')
)
EXECUTE FUNCTION hera_gl_balance_check_biu();

-- Create backwards-compatibility view for legacy code
CREATE OR REPLACE VIEW v_universal_gl_lines AS
SELECT
  *,
  CASE WHEN line_amount >= 0 THEN line_amount ELSE 0 END AS debit_amount,
  CASE WHEN line_amount <  0 THEN -line_amount ELSE 0 END AS credit_amount
FROM universal_transaction_lines
WHERE smart_code ~* '\.GL\.';

-- Add comment to the view
COMMENT ON VIEW v_universal_gl_lines IS 'Backwards-compatible view providing debit_amount/credit_amount columns derived from line_amount sign convention. Only includes GL transactions.';

-- Add comment to the function
COMMENT ON FUNCTION hera_gl_balance_check_biu() IS 'Validates GL transaction balance using sign convention (positive=debit, negative=credit). Only triggers for smart_codes containing .GL. - ignores operational transactions like appointments.';

-- Add comment to the trigger
COMMENT ON TRIGGER trg_gl_balance_biu ON universal_transaction_lines IS 'GL balance validation trigger - only fires for accounting transactions (smart_code contains .GL.), ignores appointments and operational transactions.';

-- Show completion message
DO $$
BEGIN
  RAISE NOTICE '✅ GL Balance Trigger deployed successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Trigger Behavior:';
  RAISE NOTICE '❌ Appointments: HERA.SALON.APPOINTMENT.* (no GL validation)';
  RAISE NOTICE '❌ POS Sales: HERA.SALON.POS.* (no GL validation)';
  RAISE NOTICE '✅ GL Entries: HERA.ACCOUNTING.GL.* (GL validation active)';
  RAISE NOTICE '✅ GL Postings: HERA.FINANCE.GL.* (GL validation active)';
  RAISE NOTICE '';
  RAISE NOTICE 'Sign Convention:';
  RAISE NOTICE '• Positive line_amount = Debit';
  RAISE NOTICE '• Negative line_amount = Credit';
  RAISE NOTICE '';
  RAISE NOTICE 'View Available: v_universal_gl_lines (with debit_amount/credit_amount columns)';
  RAISE NOTICE '';
  RAISE NOTICE 'FIXED: Trigger now properly handles DELETE operations';
END$$;