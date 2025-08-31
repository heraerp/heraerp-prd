-- HERA Digital Accountant RLS Policies and Functions
-- Enforces multi-tenant isolation and accounting permissions

-- 1. Helper function to check accounting scopes
CREATE OR REPLACE FUNCTION has_accounting_scope(scopes text, required_scope text)
RETURNS boolean 
LANGUAGE sql 
IMMUTABLE 
AS $$
  SELECT scopes ~ ('(?:^|\s|,)' || required_scope || '(?:$|\s|,)');
$$;

-- 2. Organization isolation for accounting transactions
CREATE POLICY "accounting_org_isolation"
  ON universal_transactions
  FOR ALL
  USING (
    organization_id = auth.jwt()->>'org_id'
    AND smart_code LIKE 'HERA.FIN.%'
  );

-- 3. Insert permissions for journal posting
CREATE POLICY "accounting_post_journal"
  ON universal_transactions
  FOR INSERT
  USING (
    has_accounting_scope(auth.jwt()->>'scopes', 'post_journal')
    OR auth.jwt()->>'role' IN ('accountant', 'admin', 'owner')
  );

-- 4. Update permissions for status changes (draft -> posted)
CREATE POLICY "accounting_status_update"
  ON universal_transactions
  FOR UPDATE
  USING (
    organization_id = auth.jwt()->>'org_id'
    AND smart_code LIKE 'HERA.FIN.%'
    AND (
      has_accounting_scope(auth.jwt()->>'scopes', 'approve_journal')
      OR auth.jwt()->>'role' IN ('accountant', 'admin', 'owner')
    )
  )
  WITH CHECK (
    status IN ('draft', 'posted', 'approved', 'reversed')
  );

-- 5. Read permissions for accounting data
CREATE POLICY "accounting_read"
  ON universal_transactions
  FOR SELECT
  USING (
    organization_id = auth.jwt()->>'org_id'
    AND (
      smart_code LIKE 'HERA.FIN.%'
      OR transaction_type IN ('journal_entry', 'invoice', 'payment', 'reconciliation')
    )
  );

-- 6. Line-level organization isolation
CREATE POLICY "accounting_line_org_isolation"
  ON universal_transaction_lines
  FOR ALL
  USING (
    organization_id = auth.jwt()->>'org_id'
  );

-- 7. Auditor read-only access
CREATE POLICY "auditor_read_only"
  ON universal_transactions
  FOR SELECT
  USING (
    auth.jwt()->>'role' = 'auditor'
    AND organization_id IN (
      SELECT to_entity_id 
      FROM core_relationships 
      WHERE from_entity_id = auth.jwt()->>'entity_id'
      AND relationship_type = 'audits_for'
    )
  );

-- 8. Function to validate journal balance
CREATE OR REPLACE FUNCTION validate_journal_balance()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  total_debit decimal(20,6);
  total_credit decimal(20,6);
BEGIN
  -- Only validate for journal entries
  IF NEW.smart_code LIKE 'HERA.FIN.GL.TXN.JE.%' THEN
    -- Calculate totals from lines
    SELECT 
      COALESCE(SUM(CASE WHEN metadata->>'movement' = 'debit' THEN line_amount ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN metadata->>'movement' = 'credit' THEN line_amount ELSE 0 END), 0)
    INTO total_debit, total_credit
    FROM universal_transaction_lines
    WHERE transaction_id = NEW.id;
    
    -- Check balance (allow small rounding differences)
    IF ABS(total_debit - total_credit) > 0.01 THEN
      RAISE EXCEPTION 'Journal entry must balance. Debit: %, Credit: %', total_debit, total_credit;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 9. Trigger for journal balance validation
CREATE TRIGGER validate_journal_balance_trigger
  AFTER INSERT OR UPDATE ON universal_transactions
  FOR EACH ROW
  WHEN (NEW.smart_code LIKE 'HERA.FIN.GL.TXN.JE.%')
  EXECUTE FUNCTION validate_journal_balance();

-- 10. Function to check accounting period status
CREATE OR REPLACE FUNCTION check_accounting_period(tx_date date, org_id uuid)
RETURNS boolean
LANGUAGE plpgsql
AS $$
DECLARE
  period_status text;
BEGIN
  -- Get period status from dynamic data
  SELECT field_value_text INTO period_status
  FROM core_dynamic_data
  WHERE entity_id IN (
    SELECT id FROM core_entities 
    WHERE organization_id = org_id 
    AND entity_type = 'accounting_period'
    AND entity_code = TO_CHAR(tx_date, 'YYYY-MM')
  )
  AND field_name = 'status'
  LIMIT 1;
  
  -- If no period found or period is open, allow posting
  RETURN period_status IS NULL OR period_status = 'open';
END;
$$;

-- 11. Prevent posting to closed periods
CREATE OR REPLACE FUNCTION prevent_closed_period_posting()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only check for financial transactions
  IF NEW.smart_code LIKE 'HERA.FIN.%' AND NEW.status = 'posted' THEN
    IF NOT check_accounting_period(NEW.transaction_date::date, NEW.organization_id) THEN
      RAISE EXCEPTION 'Cannot post to closed accounting period';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 12. Trigger for period validation
CREATE TRIGGER prevent_closed_period_trigger
  BEFORE INSERT OR UPDATE ON universal_transactions
  FOR EACH ROW
  WHEN (NEW.smart_code LIKE 'HERA.FIN.%')
  EXECUTE FUNCTION prevent_closed_period_posting();

-- 13. Function to track approval workflow
CREATE OR REPLACE FUNCTION track_approval_workflow()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- When status changes to 'approved', create approval relationship
  IF NEW.status = 'approved' AND OLD.status = 'draft' THEN
    INSERT INTO core_relationships (
      organization_id,
      from_entity_id,
      to_entity_id,
      relationship_type,
      smart_code,
      metadata
    ) VALUES (
      NEW.organization_id,
      NEW.id,
      auth.jwt()->>'entity_id',
      'approved_by',
      'HERA.FIN.APPROVAL.WORKFLOW.v1',
      jsonb_build_object(
        'approved_at', NOW(),
        'approver_role', auth.jwt()->>'role',
        'approval_level', 1
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 14. Trigger for approval tracking
CREATE TRIGGER track_approval_trigger
  AFTER UPDATE ON universal_transactions
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION track_approval_workflow();

-- 15. Grant necessary permissions
GRANT EXECUTE ON FUNCTION has_accounting_scope TO authenticated;
GRANT EXECUTE ON FUNCTION check_accounting_period TO authenticated;

-- 16. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_smart_code_fin 
  ON universal_transactions(smart_code) 
  WHERE smart_code LIKE 'HERA.FIN.%';

CREATE INDEX IF NOT EXISTS idx_transactions_org_status 
  ON universal_transactions(organization_id, status) 
  WHERE smart_code LIKE 'HERA.FIN.%';

CREATE INDEX IF NOT EXISTS idx_relationships_approval 
  ON core_relationships(from_entity_id, relationship_type) 
  WHERE relationship_type = 'approved_by';

COMMENT ON POLICY "accounting_org_isolation" ON universal_transactions IS 
  'Ensures all financial transactions are isolated by organization';

COMMENT ON POLICY "accounting_post_journal" ON universal_transactions IS 
  'Controls who can create new journal entries and financial transactions';

COMMENT ON POLICY "accounting_status_update" ON universal_transactions IS 
  'Controls who can change transaction status (draft to posted)';

COMMENT ON FUNCTION validate_journal_balance() IS 
  'Ensures all journal entries are balanced (debits = credits)';

COMMENT ON FUNCTION check_accounting_period(date, uuid) IS 
  'Checks if an accounting period is open for posting';