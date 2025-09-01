-- =============================================
-- HERA PROCURE-TO-PAY (P2P) SMART CODES v1
-- Complete P2P cycle on 6 universal tables
-- =============================================

-- Smart Code Registry for Procure-to-Pay
-- Following HERA DNA pattern: HERA.{MODULE}.{FUNCTION}.{OPERATION}.v{VERSION}

-- SUPPLIER MANAGEMENT
-- ===================

-- Supplier Master Data
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.P2P.SUPPLIER.CREATE.v1', 'Create new supplier', 'supplier_master',
  '{"required_fields": ["supplier_name", "tax_id", "payment_terms"], "approval_required": true}'::jsonb),

('HERA.P2P.SUPPLIER.UPDATE.v1', 'Update supplier information', 'supplier_master',
  '{"track_changes": true, "audit_fields": ["bank_account", "tax_id", "payment_terms"]}'::jsonb),

('HERA.P2P.SUPPLIER.QUALIFY.v1', 'Supplier qualification process', 'supplier_master',
  '{"qualification_criteria": ["financial_health", "compliance", "performance"], "scoring": true}'::jsonb),

('HERA.P2P.SUPPLIER.BLOCK.v1', 'Block supplier for transactions', 'supplier_master',
  '{"block_types": ["payment", "ordering", "all"], "reason_required": true}'::jsonb),

('HERA.P2P.SUPPLIER.EVALUATE.v1', 'Supplier performance evaluation', 'supplier_analytics',
  '{"metrics": ["on_time_delivery", "quality_score", "price_competitiveness"], "frequency": "quarterly"}'::jsonb),

-- PURCHASE ORDER MANAGEMENT
-- ========================

-- Purchase Order Creation
('HERA.P2P.PO.CREATE.v1', 'Create purchase order', 'purchase_order',
  '{"approval_limits": {"low": 1000, "medium": 10000, "high": 100000}, "multi_line": true}'::jsonb),

('HERA.P2P.PO.APPROVE.v1', 'Approve purchase order', 'purchase_order',
  '{"approval_levels": ["supervisor", "manager", "director"], "delegation_allowed": true}'::jsonb),

('HERA.P2P.PO.REJECT.v1', 'Reject purchase order', 'purchase_order',
  '{"reason_required": true, "notify_requestor": true}'::jsonb),

('HERA.P2P.PO.AMEND.v1', 'Amend purchase order', 'purchase_order',
  '{"amendable_fields": ["quantity", "delivery_date", "price"], "version_tracking": true}'::jsonb),

('HERA.P2P.PO.CANCEL.v1', 'Cancel purchase order', 'purchase_order',
  '{"cancellation_reasons": ["duplicate", "no_longer_needed", "supplier_issue"], "reversal_required": true}'::jsonb),

('HERA.P2P.PO.RELEASE.v1', 'Release PO to supplier', 'purchase_order',
  '{"release_methods": ["email", "edi", "portal"], "acknowledgment_required": true}'::jsonb),

-- Blanket & Contract POs
('HERA.P2P.PO.BLANKET.CREATE.v1', 'Create blanket purchase order', 'purchase_order',
  '{"validity_period": true, "value_limit": true, "call_off_enabled": true}'::jsonb),

('HERA.P2P.PO.CONTRACT.CREATE.v1', 'Create contract purchase order', 'purchase_order',
  '{"contract_types": ["quantity", "value", "period"], "auto_renewal": true}'::jsonb),

-- GOODS RECEIPT MANAGEMENT
-- =======================

('HERA.P2P.GRN.POST.v1', 'Post goods receipt note', 'goods_receipt',
  '{"update_inventory": true, "quality_check": false, "create_liability": true}'::jsonb),

('HERA.P2P.GRN.REVERSE.v1', 'Reverse goods receipt', 'goods_receipt',
  '{"reversal_reasons": ["quality_issue", "wrong_delivery", "damaged"], "return_to_vendor": true}'::jsonb),

('HERA.P2P.GRN.PARTIAL.v1', 'Partial goods receipt', 'goods_receipt',
  '{"update_po_status": true, "tolerance_check": true, "notify_buyer": true}'::jsonb),

('HERA.P2P.GRN.INSPECT.v1', 'Quality inspection at receipt', 'goods_receipt',
  '{"inspection_types": ["visual", "sampling", "full"], "rejection_workflow": true}'::jsonb),

-- SERVICE RECEIPT
('HERA.P2P.SRN.POST.v1', 'Post service receipt note', 'service_receipt',
  '{"timesheet_validation": true, "milestone_based": true, "approval_required": true}'::jsonb),

-- INVOICE MANAGEMENT
-- =================

-- Invoice Processing
('HERA.P2P.INVOICE.POST.v1', 'Post supplier invoice', 'invoice_processing',
  '{"matching_required": true, "duplicate_check": true, "tax_calculation": true}'::jsonb),

('HERA.P2P.INVOICE.MATCH.v1', '2/3-way invoice matching', 'invoice_processing',
  '{"match_types": ["2way", "3way"], "tolerance_limits": {"qty": 5, "price": 2, "amount": 10}}'::jsonb),

('HERA.P2P.INVOICE.APPROVE.v1', 'Approve invoice for payment', 'invoice_processing',
  '{"approval_matrix": true, "budget_check": true, "gl_coding": true}'::jsonb),

('HERA.P2P.INVOICE.BLOCK.v1', 'Block invoice from payment', 'invoice_processing',
  '{"block_reasons": ["price_variance", "quantity_variance", "quality_issue", "duplicate"], "resolution_required": true}'::jsonb),

('HERA.P2P.INVOICE.DUPLICATE.v1', 'Duplicate invoice detection', 'invoice_processing',
  '{"check_fields": ["invoice_number", "amount", "date", "supplier"], "ai_enabled": true}'::jsonb),

-- Credit Notes
('HERA.P2P.CREDIT.POST.v1', 'Post supplier credit note', 'invoice_processing',
  '{"link_to_invoice": true, "reason_codes": ["return", "price_adjustment", "damaged_goods"]}'::jsonb),

-- PAYMENT MANAGEMENT
-- =================

-- Payment Processing
('HERA.P2P.PAYMENT.EXECUTE.v1', 'Execute supplier payment', 'payment_processing',
  '{"payment_methods": ["ach", "wire", "check", "card"], "approval_required": true}'::jsonb),

('HERA.P2P.PAYMENT.SCHEDULE.v1', 'Schedule payment run', 'payment_processing',
  '{"run_types": ["daily", "weekly", "on_due_date"], "optimization": true}'::jsonb),

('HERA.P2P.PAYMENT.CANCEL.v1', 'Cancel/reverse payment', 'payment_processing',
  '{"cancellation_window": 24, "bank_integration": true, "reason_required": true}'::jsonb),

('HERA.P2P.PAYMENT.CLEAR.v1', 'Clear payment with bank statement', 'payment_processing',
  '{"auto_reconciliation": true, "tolerance": 0.01, "manual_match": true}'::jsonb),

-- Early Payment Discount
('HERA.P2P.PAYMENT.DISCOUNT.v1', 'Apply early payment discount', 'payment_processing',
  '{"discount_terms": ["2/10 net 30", "1/15 net 45"], "auto_calculate": true}'::jsonb),

-- EXCEPTIONS & ANOMALIES
-- ====================

('HERA.P2P.EXCEPTION.PRICE.v1', 'Price variance exception', 'p2p_exceptions',
  '{"variance_limits": {"low": 2, "medium": 5, "high": 10}, "approval_matrix": true}'::jsonb),

('HERA.P2P.EXCEPTION.QTY.v1', 'Quantity variance exception', 'p2p_exceptions',
  '{"tolerance_percent": 5, "over_delivery_allowed": false, "under_delivery_action": "partial_invoice"}'::jsonb),

('HERA.P2P.EXCEPTION.DUPLICATE.v1', 'Duplicate transaction exception', 'p2p_exceptions',
  '{"check_types": ["po", "invoice", "payment"], "ai_detection": true}'::jsonb),

('HERA.P2P.EXCEPTION.COMPLIANCE.v1', 'Compliance exception', 'p2p_exceptions',
  '{"compliance_checks": ["tax_validity", "vendor_status", "regulatory"], "block_transaction": true}'::jsonb),

-- AI & ANALYTICS
-- =============

-- AI-Powered Features
('HERA.P2P.AI.PREDICT.DELIVERY.v1', 'Predict delivery date using AI', 'p2p_ai',
  '{"factors": ["supplier_history", "distance", "order_complexity"], "confidence_threshold": 0.8}'::jsonb),

('HERA.P2P.AI.SPEND.ANALYZE.v1', 'AI spend analysis', 'p2p_ai',
  '{"dimensions": ["category", "supplier", "department", "project"], "savings_opportunities": true}'::jsonb),

('HERA.P2P.AI.SUPPLIER.RISK.v1', 'AI supplier risk assessment', 'p2p_ai',
  '{"risk_factors": ["financial", "operational", "compliance", "geopolitical"], "monitoring": "continuous"}'::jsonb),

('HERA.P2P.AI.MAVERICK.DETECT.v1', 'Detect maverick spending', 'p2p_ai',
  '{"detection_rules": ["off_contract", "unapproved_supplier", "split_orders"], "alert_threshold": true}'::jsonb),

-- WORKFLOW & APPROVAL
-- ==================

('HERA.P2P.WORKFLOW.ROUTE.v1', 'Route for approval', 'p2p_workflow',
  '{"routing_rules": ["amount_based", "category_based", "project_based"], "delegation": true}'::jsonb),

('HERA.P2P.WORKFLOW.ESCALATE.v1', 'Escalate approval', 'p2p_workflow',
  '{"escalation_time": 48, "skip_levels": true, "notification": true}'::jsonb),

('HERA.P2P.WORKFLOW.DELEGATE.v1', 'Delegate approval authority', 'p2p_workflow',
  '{"delegation_period": true, "amount_limits": true, "audit_trail": true}'::jsonb),

-- INTEGRATION
-- ==========

('HERA.P2P.INTEGRATE.CATALOG.v1', 'Integrate supplier catalog', 'p2p_integration',
  '{"catalog_types": ["punchout", "hosted", "file"], "real_time_pricing": true}'::jsonb),

('HERA.P2P.INTEGRATE.BANK.v1', 'Bank integration for payments', 'p2p_integration',
  '{"integration_types": ["api", "file", "swift"], "encryption": true}'::jsonb),

('HERA.P2P.INTEGRATE.TAX.v1', 'Tax system integration', 'p2p_integration',
  '{"tax_engines": ["avalara", "vertex", "native"], "real_time_validation": true}'::jsonb),

-- REPORTING
-- ========

('HERA.P2P.REPORT.SPEND.v1', 'Spend analysis report', 'p2p_reporting',
  '{"grouping": ["supplier", "category", "department"], "comparison": true}'::jsonb),

('HERA.P2P.REPORT.SAVINGS.v1', 'Savings report', 'p2p_reporting',
  '{"savings_types": ["negotiated", "early_payment", "volume_discount"], "tracking": true}'::jsonb),

('HERA.P2P.REPORT.CYCLE.v1', 'P2P cycle time report', 'p2p_reporting',
  '{"metrics": ["po_to_grn", "grn_to_invoice", "invoice_to_payment"], "benchmarking": true}'::jsonb),

-- EVENTS
-- ======

('HERA.P2P.EVENT.PO.APPROVED.v1', 'PO approved event', 'p2p_event',
  '{"triggers": ["send_to_supplier", "update_commitment"], "notification": true}'::jsonb),

('HERA.P2P.EVENT.GOODS.RECEIVED.v1', 'Goods received event', 'p2p_event',
  '{"triggers": ["update_inventory", "notify_requester", "enable_invoicing"], "real_time": true}'::jsonb),

('HERA.P2P.EVENT.INVOICE.MATCHED.v1', 'Invoice matched event', 'p2p_event',
  '{"triggers": ["approve_payment", "update_accruals"], "automation": true}'::jsonb),

('HERA.P2P.EVENT.PAYMENT.SENT.v1', 'Payment sent event', 'p2p_event',
  '{"triggers": ["notify_supplier", "update_liability", "clear_invoice"], "confirmation": true}'::jsonb),

-- ERRORS
-- ======

('HERA.P2P.ERROR.MATCH.FAIL.v1', 'Invoice matching failure', 'p2p_error',
  '{"error_types": ["price", "quantity", "tax", "po_not_found"], "resolution_workflow": true}'::jsonb),

('HERA.P2P.ERROR.PAYMENT.FAIL.v1', 'Payment failure', 'p2p_error',
  '{"failure_reasons": ["insufficient_funds", "invalid_account", "bank_rejection"], "retry_logic": true}'::jsonb);

-- Grant permissions
GRANT SELECT ON smart_code_registry TO authenticated;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_p2p_smart_code_category ON smart_code_registry(category) 
WHERE category LIKE 'p2p_%' OR category LIKE 'supplier_%' OR category LIKE 'purchase_%' OR category LIKE 'invoice_%' OR category LIKE 'payment_%';

CREATE INDEX IF NOT EXISTS idx_p2p_smart_code_pattern ON smart_code_registry(smart_code text_pattern_ops)
WHERE smart_code LIKE 'HERA.P2P.%';