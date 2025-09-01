-- =============================================
-- HERA P2P (PROCURE-TO-PAY) TRIGGERS
-- Business logic, validation, and automation
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================
-- IDEMPOTENCY CONSTRAINTS
-- =============================================

-- Prevent duplicate POs
ALTER TABLE universal_transactions
ADD CONSTRAINT utx_unique_po_number
UNIQUE (organization_id, transaction_code)
WHERE smart_code LIKE 'HERA.P2P.PO.%';

-- Prevent duplicate invoices per supplier
CREATE UNIQUE INDEX idx_unique_supplier_invoice
ON universal_transactions (organization_id, from_entity_id, metadata->>'invoice_number')
WHERE smart_code = 'HERA.P2P.INVOICE.POST.v1';

-- =============================================
-- PO APPROVAL WORKFLOW
-- =============================================

-- Function to check PO approval requirements
CREATE OR REPLACE FUNCTION hera_p2p__check_po_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_approval_limit NUMERIC;
  v_approval_level TEXT;
BEGIN
  -- Only process PO creation
  IF NEW.smart_code != 'HERA.P2P.PO.CREATE.v1' THEN
    RETURN NEW;
  END IF;

  -- Get approval limits from metadata or defaults
  v_approval_limit := COALESCE(
    (NEW.metadata->>'approval_limit')::numeric,
    CASE 
      WHEN NEW.total_amount <= 1000 THEN 1000
      WHEN NEW.total_amount <= 10000 THEN 10000
      WHEN NEW.total_amount <= 100000 THEN 100000
      ELSE 999999999
    END
  );

  -- Determine approval level required
  v_approval_level := CASE
    WHEN NEW.total_amount <= 1000 THEN 'auto_approved'
    WHEN NEW.total_amount <= 10000 THEN 'supervisor'
    WHEN NEW.total_amount <= 100000 THEN 'manager'
    ELSE 'director'
  END;

  -- Update metadata with approval requirements
  NEW.metadata := NEW.metadata || jsonb_build_object(
    'approval_required', NEW.total_amount > 1000,
    'approval_level', v_approval_level,
    'approval_limit', v_approval_limit,
    'approval_status', CASE WHEN NEW.total_amount <= 1000 THEN 'approved' ELSE 'pending_approval' END
  );

  -- If auto-approved, set approved timestamp
  IF NEW.total_amount <= 1000 THEN
    NEW.metadata := NEW.metadata || jsonb_build_object(
      'approved_at', CURRENT_TIMESTAMP,
      'approved_by', 'system_auto_approval'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create PO approval trigger
DROP TRIGGER IF EXISTS utx__po_approval_check ON universal_transactions;
CREATE TRIGGER utx__po_approval_check
BEFORE INSERT OR UPDATE ON universal_transactions
FOR EACH ROW
WHEN (NEW.smart_code = 'HERA.P2P.PO.CREATE.v1')
EXECUTE FUNCTION hera_p2p__check_po_approval();

-- =============================================
-- GOODS RECEIPT VALIDATION
-- =============================================

-- Function to validate goods receipt against PO
CREATE OR REPLACE FUNCTION hera_p2p__validate_goods_receipt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_po_id UUID;
  v_po_data RECORD;
  v_received_qty NUMERIC;
  v_tolerance_pct NUMERIC;
BEGIN
  -- Only process goods receipts
  IF NEW.smart_code NOT IN ('HERA.P2P.GRN.POST.v1', 'HERA.P2P.GRN.PARTIAL.v1') THEN
    RETURN NEW;
  END IF;

  -- Get PO reference
  v_po_id := (NEW.metadata->>'po_id')::uuid;
  
  IF v_po_id IS NULL THEN
    RAISE EXCEPTION 'Goods receipt must reference a PO'
      USING ERRCODE = 'P0001',
            HINT = 'Include po_id in metadata';
  END IF;

  -- Get PO details
  SELECT * INTO v_po_data
  FROM universal_transactions
  WHERE id = v_po_id
    AND organization_id = NEW.organization_id
    AND smart_code LIKE 'HERA.P2P.PO.%';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Referenced PO not found: %', v_po_id
      USING ERRCODE = 'P0002';
  END IF;

  -- Check PO is approved
  IF v_po_data.metadata->>'approval_status' != 'approved' THEN
    RAISE EXCEPTION 'Cannot receive goods against unapproved PO'
      USING ERRCODE = 'P0003';
  END IF;

  -- Calculate total received quantity for this PO
  SELECT COALESCE(SUM((metadata->>'quantity')::numeric), 0) + 
         COALESCE((NEW.metadata->>'quantity')::numeric, 0)
  INTO v_received_qty
  FROM universal_transactions
  WHERE organization_id = NEW.organization_id
    AND smart_code IN ('HERA.P2P.GRN.POST.v1', 'HERA.P2P.GRN.PARTIAL.v1')
    AND metadata->>'po_id' = v_po_id::text
    AND id != NEW.id;

  -- Get tolerance percentage (default 5%)
  v_tolerance_pct := COALESCE((v_po_data.metadata->>'over_delivery_tolerance')::numeric, 5);

  -- Check quantity tolerance
  IF v_received_qty > (v_po_data.metadata->>'quantity')::numeric * (1 + v_tolerance_pct/100) THEN
    RAISE EXCEPTION 'Goods receipt exceeds PO quantity tolerance'
      USING ERRCODE = 'P0004',
            HINT = format('PO qty: %s, Total received: %s, Tolerance: %s%%',
                         v_po_data.metadata->>'quantity', v_received_qty, v_tolerance_pct);
  END IF;

  -- Update metadata
  NEW.metadata := NEW.metadata || jsonb_build_object(
    'po_number', v_po_data.transaction_code,
    'po_amount', v_po_data.total_amount,
    'po_quantity', v_po_data.metadata->>'quantity',
    'total_received', v_received_qty,
    'supplier_id', v_po_data.metadata->>'supplier_id'
  );

  RETURN NEW;
END;
$$;

-- Create goods receipt validation trigger
DROP TRIGGER IF EXISTS utx__grn_validation ON universal_transactions;
CREATE TRIGGER utx__grn_validation
BEFORE INSERT ON universal_transactions
FOR EACH ROW
WHEN (NEW.smart_code IN ('HERA.P2P.GRN.POST.v1', 'HERA.P2P.GRN.PARTIAL.v1'))
EXECUTE FUNCTION hera_p2p__validate_goods_receipt();

-- =============================================
-- INVOICE MATCHING LOGIC
-- =============================================

-- Function to perform 2/3-way matching
CREATE OR REPLACE FUNCTION hera_p2p__match_invoice()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_po_id UUID;
  v_po_data RECORD;
  v_grn_data RECORD;
  v_match_type TEXT;
  v_price_tolerance NUMERIC;
  v_qty_tolerance NUMERIC;
  v_match_result JSONB;
  v_has_variance BOOLEAN := false;
BEGIN
  -- Only process invoice matching
  IF NEW.smart_code NOT IN ('HERA.P2P.INVOICE.POST.v1', 'HERA.P2P.INVOICE.MATCH.v1') THEN
    RETURN NEW;
  END IF;

  -- Get PO reference
  v_po_id := (NEW.metadata->>'po_id')::uuid;
  v_match_type := COALESCE(NEW.metadata->>'match_type', '3way');

  IF v_po_id IS NULL THEN
    NEW.metadata := NEW.metadata || jsonb_build_object(
      'match_status', 'failed',
      'match_error', 'No PO reference provided'
    );
    RETURN NEW;
  END IF;

  -- Get PO details
  SELECT * INTO v_po_data
  FROM universal_transactions
  WHERE id = v_po_id
    AND organization_id = NEW.organization_id;

  IF NOT FOUND THEN
    NEW.metadata := NEW.metadata || jsonb_build_object(
      'match_status', 'failed',
      'match_error', 'PO not found'
    );
    RETURN NEW;
  END IF;

  -- Get tolerances
  v_price_tolerance := COALESCE((NEW.metadata->'tolerance'->>'price')::numeric, 2);
  v_qty_tolerance := COALESCE((NEW.metadata->'tolerance'->>'quantity')::numeric, 5);

  -- Start building match result
  v_match_result := jsonb_build_object(
    'match_type', v_match_type,
    'po_number', v_po_data.transaction_code,
    'po_amount', v_po_data.total_amount
  );

  -- Price matching
  IF ABS(NEW.total_amount - v_po_data.total_amount) > v_po_data.total_amount * v_price_tolerance / 100 THEN
    v_has_variance := true;
    v_match_result := v_match_result || jsonb_build_object(
      'price_variance', NEW.total_amount - v_po_data.total_amount,
      'price_variance_pct', ((NEW.total_amount - v_po_data.total_amount) / v_po_data.total_amount * 100)
    );
  END IF;

  -- 3-way matching includes goods receipt
  IF v_match_type = '3way' THEN
    -- Get goods receipt data
    SELECT 
      SUM((metadata->>'quantity')::numeric) as total_received,
      SUM(total_amount) as grn_value
    INTO v_grn_data
    FROM universal_transactions
    WHERE organization_id = NEW.organization_id
      AND smart_code IN ('HERA.P2P.GRN.POST.v1', 'HERA.P2P.GRN.PARTIAL.v1')
      AND metadata->>'po_id' = v_po_id::text;

    IF v_grn_data.total_received IS NULL THEN
      NEW.metadata := NEW.metadata || jsonb_build_object(
        'match_status', 'blocked',
        'match_error', 'No goods receipt found for 3-way match',
        'block_reason', 'missing_grn'
      );
      RETURN NEW;
    END IF;

    v_match_result := v_match_result || jsonb_build_object(
      'grn_quantity', v_grn_data.total_received,
      'grn_value', v_grn_data.grn_value
    );

    -- Quantity matching
    IF ABS((NEW.metadata->>'quantity')::numeric - v_grn_data.total_received) > 
       v_grn_data.total_received * v_qty_tolerance / 100 THEN
      v_has_variance := true;
      v_match_result := v_match_result || jsonb_build_object(
        'quantity_variance', (NEW.metadata->>'quantity')::numeric - v_grn_data.total_received,
        'quantity_variance_pct', (((NEW.metadata->>'quantity')::numeric - v_grn_data.total_received) / v_grn_data.total_received * 100)
      );
    END IF;
  END IF;

  -- Set match status
  IF v_has_variance THEN
    NEW.metadata := NEW.metadata || jsonb_build_object(
      'match_status', 'variance',
      'match_result', v_match_result,
      'requires_approval', true
    );
  ELSE
    NEW.metadata := NEW.metadata || jsonb_build_object(
      'match_status', 'matched',
      'match_result', v_match_result,
      'matched_at', CURRENT_TIMESTAMP,
      'payment_eligible', true
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create invoice matching trigger
DROP TRIGGER IF EXISTS utx__invoice_match ON universal_transactions;
CREATE TRIGGER utx__invoice_match
BEFORE INSERT OR UPDATE ON universal_transactions
FOR EACH ROW
WHEN (NEW.smart_code IN ('HERA.P2P.INVOICE.POST.v1', 'HERA.P2P.INVOICE.MATCH.v1'))
EXECUTE FUNCTION hera_p2p__match_invoice();

-- =============================================
-- DUPLICATE INVOICE DETECTION
-- =============================================

-- Function to detect duplicate invoices
CREATE OR REPLACE FUNCTION hera_p2p__detect_duplicate_invoice()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_duplicate_count INTEGER;
  v_invoice_number TEXT;
  v_supplier_id UUID;
BEGIN
  -- Only process invoice posting
  IF NEW.smart_code != 'HERA.P2P.INVOICE.POST.v1' THEN
    RETURN NEW;
  END IF;

  v_invoice_number := NEW.metadata->>'invoice_number';
  v_supplier_id := NEW.from_entity_id;

  IF v_invoice_number IS NULL OR v_supplier_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check for duplicates
  SELECT COUNT(*)
  INTO v_duplicate_count
  FROM universal_transactions
  WHERE organization_id = NEW.organization_id
    AND smart_code = 'HERA.P2P.INVOICE.POST.v1'
    AND from_entity_id = v_supplier_id
    AND metadata->>'invoice_number' = v_invoice_number
    AND id != NEW.id;

  IF v_duplicate_count > 0 THEN
    -- Mark as potential duplicate
    NEW.metadata := NEW.metadata || jsonb_build_object(
      'duplicate_check', jsonb_build_object(
        'status', 'potential_duplicate',
        'duplicate_count', v_duplicate_count,
        'checked_at', CURRENT_TIMESTAMP,
        'confidence', 0.95
      ),
      'requires_review', true,
      'block_payment', true
    );

    -- Create exception record
    INSERT INTO core_dynamic_data (
      organization_id,
      entity_id,
      field_name,
      field_value_json,
      smart_code
    ) VALUES (
      NEW.organization_id,
      NEW.id,
      'duplicate_invoice_alert',
      jsonb_build_object(
        'invoice_number', v_invoice_number,
        'supplier_id', v_supplier_id,
        'amount', NEW.total_amount,
        'existing_count', v_duplicate_count,
        'ai_confidence', 0.95
      ),
      'HERA.P2P.EXCEPTION.DUPLICATE.v1'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create duplicate detection trigger
DROP TRIGGER IF EXISTS utx__duplicate_invoice_check ON universal_transactions;
CREATE TRIGGER utx__duplicate_invoice_check
BEFORE INSERT ON universal_transactions
FOR EACH ROW
WHEN (NEW.smart_code = 'HERA.P2P.INVOICE.POST.v1')
EXECUTE FUNCTION hera_p2p__detect_duplicate_invoice();

-- =============================================
-- PAYMENT VALIDATION
-- =============================================

-- Function to validate payment before execution
CREATE OR REPLACE FUNCTION hera_p2p__validate_payment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice_id UUID;
  v_invoice_data RECORD;
BEGIN
  -- Only process payment execution
  IF NEW.smart_code != 'HERA.P2P.PAYMENT.EXECUTE.v1' THEN
    RETURN NEW;
  END IF;

  -- Get invoice reference
  v_invoice_id := (NEW.metadata->>'invoice_id')::uuid;
  
  IF v_invoice_id IS NULL THEN
    RAISE EXCEPTION 'Payment must reference an invoice'
      USING ERRCODE = 'P0005';
  END IF;

  -- Get invoice details
  SELECT * INTO v_invoice_data
  FROM universal_transactions
  WHERE id = v_invoice_id
    AND organization_id = NEW.organization_id
    AND smart_code = 'HERA.P2P.INVOICE.POST.v1';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Referenced invoice not found: %', v_invoice_id
      USING ERRCODE = 'P0006';
  END IF;

  -- Check if invoice is matched
  IF v_invoice_data.metadata->>'match_status' NOT IN ('matched', 'approved') THEN
    RAISE EXCEPTION 'Cannot pay unmatched invoice'
      USING ERRCODE = 'P0007',
            HINT = 'Invoice match status: ' || COALESCE(v_invoice_data.metadata->>'match_status', 'not_matched');
  END IF;

  -- Check if invoice is blocked
  IF (v_invoice_data.metadata->>'block_payment')::boolean = true THEN
    RAISE EXCEPTION 'Invoice is blocked for payment'
      USING ERRCODE = 'P0008',
            HINT = 'Block reason: ' || COALESCE(v_invoice_data.metadata->>'block_reason', 'unknown');
  END IF;

  -- Check if already paid
  IF EXISTS (
    SELECT 1
    FROM universal_transactions
    WHERE organization_id = NEW.organization_id
      AND smart_code = 'HERA.P2P.PAYMENT.EXECUTE.v1'
      AND metadata->>'invoice_id' = v_invoice_id::text
      AND metadata->>'payment_status' = 'completed'
      AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Invoice already paid'
      USING ERRCODE = 'P0009';
  END IF;

  -- Update payment metadata
  NEW.metadata := NEW.metadata || jsonb_build_object(
    'invoice_number', v_invoice_data.metadata->>'invoice_number',
    'supplier_id', v_invoice_data.from_entity_id,
    'po_id', v_invoice_data.metadata->>'po_id',
    'payment_status', 'pending',
    'payment_method', COALESCE(NEW.metadata->>'payment_method', 'ach')
  );

  -- Ensure payment amount matches invoice
  IF NEW.total_amount != v_invoice_data.total_amount THEN
    -- Check for early payment discount
    IF NEW.metadata->>'discount_applied' = 'true' THEN
      NEW.metadata := NEW.metadata || jsonb_build_object(
        'original_amount', v_invoice_data.total_amount,
        'discount_amount', v_invoice_data.total_amount - NEW.total_amount
      );
    ELSE
      RAISE EXCEPTION 'Payment amount does not match invoice amount'
        USING ERRCODE = 'P0010';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create payment validation trigger
DROP TRIGGER IF EXISTS utx__payment_validation ON universal_transactions;
CREATE TRIGGER utx__payment_validation
BEFORE INSERT ON universal_transactions
FOR EACH ROW
WHEN (NEW.smart_code = 'HERA.P2P.PAYMENT.EXECUTE.v1')
EXECUTE FUNCTION hera_p2p__validate_payment();

-- =============================================
-- AUTO-UPDATE PO STATUS
-- =============================================

-- Function to update PO status based on receipts and invoices
CREATE OR REPLACE FUNCTION hera_p2p__update_po_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_po_id UUID;
  v_po_quantity NUMERIC;
  v_received_quantity NUMERIC;
  v_invoiced_amount NUMERIC;
  v_po_status TEXT;
BEGIN
  -- Get PO ID from metadata
  v_po_id := (NEW.metadata->>'po_id')::uuid;
  
  IF v_po_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get PO quantity
  SELECT (metadata->>'quantity')::numeric
  INTO v_po_quantity
  FROM universal_transactions
  WHERE id = v_po_id
    AND organization_id = NEW.organization_id;

  -- Calculate total received
  SELECT COALESCE(SUM((metadata->>'quantity')::numeric), 0)
  INTO v_received_quantity
  FROM universal_transactions
  WHERE organization_id = NEW.organization_id
    AND smart_code IN ('HERA.P2P.GRN.POST.v1', 'HERA.P2P.GRN.PARTIAL.v1')
    AND metadata->>'po_id' = v_po_id::text;

  -- Calculate total invoiced
  SELECT COALESCE(SUM(total_amount), 0)
  INTO v_invoiced_amount
  FROM universal_transactions
  WHERE organization_id = NEW.organization_id
    AND smart_code = 'HERA.P2P.INVOICE.POST.v1'
    AND metadata->>'po_id' = v_po_id::text;

  -- Determine PO status
  IF v_received_quantity = 0 THEN
    v_po_status := 'open';
  ELSIF v_received_quantity < v_po_quantity THEN
    v_po_status := 'partial_receipt';
  ELSIF v_invoiced_amount = 0 THEN
    v_po_status := 'received';
  ELSE
    v_po_status := 'closed';
  END IF;

  -- Update PO status
  UPDATE universal_transactions
  SET metadata = metadata || jsonb_build_object(
    'po_status', v_po_status,
    'received_quantity', v_received_quantity,
    'invoiced_amount', v_invoiced_amount,
    'last_updated', CURRENT_TIMESTAMP
  )
  WHERE id = v_po_id
    AND organization_id = NEW.organization_id;

  RETURN NEW;
END;
$$;

-- Create PO status update trigger
DROP TRIGGER IF EXISTS utx__update_po_status ON universal_transactions;
CREATE TRIGGER utx__update_po_status
AFTER INSERT OR UPDATE ON universal_transactions
FOR EACH ROW
WHEN (NEW.smart_code IN ('HERA.P2P.GRN.POST.v1', 'HERA.P2P.GRN.PARTIAL.v1', 'HERA.P2P.INVOICE.POST.v1', 'HERA.P2P.PAYMENT.EXECUTE.v1'))
EXECUTE FUNCTION hera_p2p__update_po_status();

-- =============================================
-- AUTO P2P WORKFLOW TRIGGER
-- =============================================

-- Function to trigger P2P workflow processing
CREATE OR REPLACE FUNCTION hera_p2p__on_transaction_create()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_edge_url TEXT;
  v_edge_token TEXT;
  v_action TEXT;
BEGIN
  -- Determine action based on smart code
  v_action := CASE
    WHEN NEW.smart_code = 'HERA.P2P.PO.CREATE.v1' THEN 'process_po'
    WHEN NEW.smart_code = 'HERA.P2P.GRN.POST.v1' THEN 'process_grn'
    WHEN NEW.smart_code = 'HERA.P2P.INVOICE.POST.v1' THEN 'process_invoice'
    WHEN NEW.smart_code = 'HERA.P2P.PAYMENT.EXECUTE.v1' THEN 'process_payment'
    ELSE NULL
  END;

  IF v_action IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get edge function configuration
  v_edge_url := current_setting('app.edge_p2p_url', true);
  v_edge_token := current_setting('app.edge_token', true);

  IF v_edge_url IS NOT NULL AND v_edge_token IS NOT NULL THEN
    -- Call edge function to process
    PERFORM net.http_post(
      url := v_edge_url || '/p2p-dispatch',
      headers := jsonb_build_object(
        'Authorization', 'Bearer ' || v_edge_token,
        'Content-Type', 'application/json'
      ),
      body := jsonb_build_object(
        'organization_id', NEW.organization_id,
        'transaction_id', NEW.id,
        'action', v_action,
        'metadata', NEW.metadata
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create workflow trigger
DROP TRIGGER IF EXISTS utx__p2p_workflow ON universal_transactions;
CREATE TRIGGER utx__p2p_workflow
AFTER INSERT ON universal_transactions
FOR EACH ROW
WHEN (NEW.smart_code LIKE 'HERA.P2P.%')
EXECUTE FUNCTION hera_p2p__on_transaction_create();

-- =============================================
-- PERFORMANCE INDEXES
-- =============================================

-- Index for PO lookups
CREATE INDEX IF NOT EXISTS idx_p2p_po_lookup 
ON universal_transactions(organization_id, smart_code, metadata->>'approval_status')
WHERE smart_code LIKE 'HERA.P2P.PO.%';

-- Index for invoice matching
CREATE INDEX IF NOT EXISTS idx_p2p_invoice_po
ON universal_transactions(organization_id, metadata->>'po_id')
WHERE smart_code IN ('HERA.P2P.INVOICE.POST.v1', 'HERA.P2P.GRN.POST.v1');

-- Index for payment processing
CREATE INDEX IF NOT EXISTS idx_p2p_payment_invoice
ON universal_transactions(organization_id, metadata->>'invoice_id')
WHERE smart_code = 'HERA.P2P.PAYMENT.EXECUTE.v1';

-- Index for supplier transactions
CREATE INDEX IF NOT EXISTS idx_p2p_supplier_tx
ON universal_transactions(organization_id, from_entity_id, smart_code)
WHERE smart_code LIKE 'HERA.P2P.%';

-- =============================================
-- GRANTS
-- =============================================

GRANT EXECUTE ON FUNCTION hera_p2p__check_po_approval() TO authenticated;
GRANT EXECUTE ON FUNCTION hera_p2p__validate_goods_receipt() TO authenticated;
GRANT EXECUTE ON FUNCTION hera_p2p__match_invoice() TO authenticated;
GRANT EXECUTE ON FUNCTION hera_p2p__detect_duplicate_invoice() TO authenticated;
GRANT EXECUTE ON FUNCTION hera_p2p__validate_payment() TO authenticated;
GRANT EXECUTE ON FUNCTION hera_p2p__update_po_status() TO authenticated;
GRANT EXECUTE ON FUNCTION hera_p2p__on_transaction_create() TO authenticated;