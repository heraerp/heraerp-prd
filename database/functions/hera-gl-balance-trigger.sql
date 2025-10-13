-- HERA GL Balance Check Trigger - Sign-based Convention
-- Ensures all GL transactions are balanced using line_amount sign convention
-- Positive values = Debits, Negative values = Credits

CREATE OR REPLACE FUNCTION hera_gl_balance_check_biu()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  v_txn_id uuid := COALESCE(NEW.transaction_id, OLD.transaction_id);
  v_org_id uuid := COALESCE(NEW.organization_id, OLD.organization_id);
  v_total_debits  numeric(15,2);
  v_total_credits numeric(15,2);
  v_diff          numeric(15,2);
BEGIN
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

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS trg_gl_balance_biu ON universal_transaction_lines;
CREATE TRIGGER trg_gl_balance_biu
AFTER INSERT OR UPDATE OR DELETE ON universal_transaction_lines
FOR EACH ROW EXECUTE FUNCTION hera_gl_balance_check_biu();

-- Backwards-compatibility view for legacy code
CREATE OR REPLACE VIEW v_universal_gl_lines AS
SELECT
  *,
  CASE WHEN line_amount >= 0 THEN line_amount ELSE 0 END AS debit_amount,
  CASE WHEN line_amount <  0 THEN -line_amount ELSE 0 END AS credit_amount
FROM universal_transaction_lines
WHERE smart_code ~* '\.GL\.';

COMMENT ON VIEW v_universal_gl_lines IS 'Backwards-compatible view providing debit_amount/credit_amount columns derived from line_amount sign convention';