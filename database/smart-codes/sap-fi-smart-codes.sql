-- HERA SAP FI Smart Codes
-- This file defines the complete Smart Code taxonomy for SAP Financial Integration
-- Part of HERA DNA - Reusable across all customers globally

-- ============================================================================
-- CORE FINANCIAL TRANSACTION SMART CODES
-- ============================================================================

-- Journal Entry Smart Codes
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.ERP.FI.JE.POST.V1', 'Post journal entry to SAP', 'sap_fi_transaction', 
  '{"sap_doc_type": "SA", "gl_required": true, "balance_check": true}'::jsonb),
('HERA.ERP.FI.JE.REVERSE.V1', 'Reverse journal entry in SAP', 'sap_fi_transaction',
  '{"sap_doc_type": "SA", "reversal_reason_required": true}'::jsonb),
('HERA.ERP.FI.JE.RECURRING.V1', 'Recurring journal entry', 'sap_fi_transaction',
  '{"sap_doc_type": "SA", "frequency": "monthly", "template_based": true}'::jsonb),
('HERA.ERP.FI.JE.ACCRUAL.V1', 'Accrual journal entry', 'sap_fi_transaction',
  '{"sap_doc_type": "SA", "auto_reverse": true}'::jsonb);

-- Accounts Payable Smart Codes  
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.ERP.FI.AP.INVOICE.V1', 'Vendor invoice posting', 'sap_fi_transaction',
  '{"sap_doc_type": "KR", "vendor_required": true, "tax_calculation": true}'::jsonb),
('HERA.ERP.FI.AP.PAYMENT.V1', 'Vendor payment posting', 'sap_fi_transaction',
  '{"sap_doc_type": "KZ", "payment_method_required": true, "clearing": true}'::jsonb),
('HERA.ERP.FI.AP.CREDIT.V1', 'Vendor credit memo', 'sap_fi_transaction',
  '{"sap_doc_type": "KG", "reference_invoice": true}'::jsonb),
('HERA.ERP.FI.AP.DOWN_PAYMENT.V1', 'Vendor down payment', 'sap_fi_transaction',
  '{"sap_doc_type": "KA", "special_gl_indicator": "A"}'::jsonb);

-- Accounts Receivable Smart Codes
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.ERP.FI.AR.INVOICE.V1', 'Customer invoice posting', 'sap_fi_transaction',
  '{"sap_doc_type": "DR", "customer_required": true, "revenue_recognition": true}'::jsonb),
('HERA.ERP.FI.AR.RECEIPT.V1', 'Customer payment receipt', 'sap_fi_transaction',
  '{"sap_doc_type": "DZ", "bank_account_required": true, "auto_clearing": true}'::jsonb),
('HERA.ERP.FI.AR.CREDIT.V1', 'Customer credit memo', 'sap_fi_transaction',
  '{"sap_doc_type": "DG", "reference_invoice": true}'::jsonb),
('HERA.ERP.FI.AR.DUNNING.V1', 'Dunning notice generation', 'sap_fi_transaction',
  '{"sap_process": "F150", "dunning_level": true}'::jsonb);

-- Asset Accounting Smart Codes
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.ERP.FI.AA.ACQUISITION.V1', 'Asset acquisition posting', 'sap_fi_transaction',
  '{"sap_doc_type": "AA", "asset_master_required": true, "capitalization": true}'::jsonb),
('HERA.ERP.FI.AA.DEPRECIATION.V1', 'Depreciation run posting', 'sap_fi_transaction',
  '{"sap_process": "AFAB", "period_based": true, "multi_area": true}'::jsonb),
('HERA.ERP.FI.AA.DISPOSAL.V1', 'Asset disposal/retirement', 'sap_fi_transaction',
  '{"sap_doc_type": "AB", "calculate_gain_loss": true}'::jsonb),
('HERA.ERP.FI.AA.TRANSFER.V1', 'Inter-company asset transfer', 'sap_fi_transaction',
  '{"sap_doc_type": "AU", "cross_company": true}'::jsonb);

-- Banking Smart Codes
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.ERP.FI.BANK.STATEMENT.V1', 'Bank statement import', 'sap_fi_transaction',
  '{"sap_process": "FF.5", "format": "MT940", "auto_match": true}'::jsonb),
('HERA.ERP.FI.BANK.RECON.V1', 'Bank reconciliation', 'sap_fi_transaction',
  '{"sap_process": "FF67", "tolerance_check": true}'::jsonb),
('HERA.ERP.FI.BANK.PAYMENT_RUN.V1', 'Automatic payment run', 'sap_fi_transaction',
  '{"sap_process": "F110", "payment_proposal": true}'::jsonb);

-- Period Closing Smart Codes
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.ERP.FI.CLOSE.PERIOD.V1', 'Period end closing', 'sap_fi_process',
  '{"close_activities": ["foreign_currency_valuation", "accruals", "provisions"]}'::jsonb),
('HERA.ERP.FI.CLOSE.YEAR.V1', 'Year end closing', 'sap_fi_process',
  '{"carry_forward": true, "balance_check": true, "audit_trail": true}'::jsonb),
('HERA.ERP.FI.CLOSE.FAST.V1', 'Fast close process', 'sap_fi_process',
  '{"virtual_close": true, "estimation_allowed": true}'::jsonb);

-- ============================================================================
-- MASTER DATA SMART CODES
-- ============================================================================

INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.ERP.FI.MD.GL_ACCOUNT.V1', 'GL account master data', 'sap_fi_master',
  '{"table": "SKA1/SKB1", "field_mapping": true, "coa_specific": true}'::jsonb),
('HERA.ERP.FI.MD.COST_CENTER.V1', 'Cost center master data', 'sap_fi_master',
  '{"table": "CSKS", "hierarchy": true, "validity_dates": true}'::jsonb),
('HERA.ERP.FI.MD.PROFIT_CENTER.V1', 'Profit center master data', 'sap_fi_master',
  '{"table": "CEPC", "standard_hierarchy": true}'::jsonb),
('HERA.ERP.FI.MD.COMPANY_CODE.V1', 'Company code configuration', 'sap_fi_master',
  '{"table": "T001", "currency": true, "fiscal_variant": true}'::jsonb),
('HERA.ERP.FI.MD.BUSINESS_PARTNER.V1', 'Business partner (customer/vendor)', 'sap_fi_master',
  '{"table": "BUT000", "role_based": true, "central_master": true}'::jsonb);

-- ============================================================================
-- INTEGRATION & SYNC SMART CODES
-- ============================================================================

INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.ERP.FI.SYNC.MASTER.V1', 'Master data synchronization', 'sap_fi_integration',
  '{"direction": "bidirectional", "delta_enabled": true}'::jsonb),
('HERA.ERP.FI.SYNC.TRANSACTION.V1', 'Transaction synchronization', 'sap_fi_integration',
  '{"real_time": true, "retry_logic": true, "idempotent": true}'::jsonb),
('HERA.ERP.FI.SYNC.BALANCE.V1', 'GL balance synchronization', 'sap_fi_integration',
  '{"frequency": "real_time", "reconciliation": true}'::jsonb);

-- ============================================================================
-- EVENT SMART CODES (FROM SAP)
-- ============================================================================

INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.ERP.FI.EVENT.POSTED.V1', 'Document posted in SAP', 'sap_fi_event',
  '{"webhook": true, "update_status": true}'::jsonb),
('HERA.ERP.FI.EVENT.CLEARED.V1', 'Open item cleared in SAP', 'sap_fi_event',
  '{"clearing_doc": true, "update_relationships": true}'::jsonb),
('HERA.ERP.FI.EVENT.REVERSED.V1', 'Document reversed in SAP', 'sap_fi_event',
  '{"reversal_doc": true, "cascade_update": true}'::jsonb),
('HERA.ERP.FI.EVENT.BLOCKED.V1', 'Payment blocked in SAP', 'sap_fi_event',
  '{"block_reason": true, "notification": true}'::jsonb);

-- ============================================================================
-- ERROR & VALIDATION SMART CODES
-- ============================================================================

INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.ERP.FI.ERROR.BALANCE.V1', 'Document not balanced', 'sap_fi_error',
  '{"severity": "high", "auto_fix": false}'::jsonb),
('HERA.ERP.FI.ERROR.POSTING_PERIOD.V1', 'Posting period closed', 'sap_fi_error',
  '{"severity": "medium", "retry_next_period": true}'::jsonb),
('HERA.ERP.FI.ERROR.AUTH.V1', 'Authorization failure', 'sap_fi_error',
  '{"severity": "high", "escalate": true}'::jsonb),
('HERA.ERP.FI.ERROR.DUPLICATE.V1', 'Duplicate document detected', 'sap_fi_error',
  '{"severity": "medium", "ai_check": true}'::jsonb);

-- ============================================================================
-- REGIONAL & COMPLIANCE SMART CODES
-- ============================================================================

-- India GST
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.ERP.FI.IN.GST.V1', 'India GST compliant posting', 'sap_fi_regional',
  '{"country": "IN", "tax_type": "GST", "hsn_required": true}'::jsonb),
('HERA.ERP.FI.IN.TDS.V1', 'India TDS deduction', 'sap_fi_regional',
  '{"country": "IN", "withholding_tax": true}'::jsonb);

-- EU VAT
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.ERP.FI.EU.VAT.V1', 'EU VAT compliant posting', 'sap_fi_regional',
  '{"region": "EU", "vat_reporting": true, "intrastat": true}'::jsonb),
('HERA.ERP.FI.EU.REVERSE_CHARGE.V1', 'EU reverse charge mechanism', 'sap_fi_regional',
  '{"region": "EU", "auto_tax_calc": true}'::jsonb);

-- US Sales Tax
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.ERP.FI.US.SALES_TAX.V1', 'US sales tax calculation', 'sap_fi_regional',
  '{"country": "US", "state_based": true, "nexus_check": true}'::jsonb);

-- ============================================================================
-- ANALYTICS & REPORTING SMART CODES
-- ============================================================================

INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.ERP.FI.REPORT.TRIAL_BALANCE.V1', 'Trial balance generation', 'sap_fi_report',
  '{"real_time": true, "drill_down": true}'::jsonb),
('HERA.ERP.FI.REPORT.FINANCIAL_STATEMENT.V1', 'Financial statements', 'sap_fi_report',
  '{"statements": ["balance_sheet", "pnl", "cash_flow"]}'::jsonb),
('HERA.ERP.FI.REPORT.AGING.V1', 'AP/AR aging analysis', 'sap_fi_report',
  '{"buckets": [30, 60, 90, 120], "currency_wise": true}'::jsonb);

-- ============================================================================
-- AI-ENHANCED SMART CODES
-- ============================================================================

INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.ERP.FI.AI.DUPLICATE_CHECK.V1', 'AI duplicate invoice detection', 'sap_fi_ai',
  '{"ml_model": "invoice_similarity", "threshold": 0.85}'::jsonb),
('HERA.ERP.FI.AI.CODING_SUGGESTION.V1', 'AI GL coding suggestion', 'sap_fi_ai',
  '{"ml_model": "gl_predictor", "confidence_required": 0.9}'::jsonb),
('HERA.ERP.FI.AI.ANOMALY_DETECTION.V1', 'AI anomaly detection', 'sap_fi_ai',
  '{"ml_model": "transaction_anomaly", "real_time": true}'::jsonb),
('HERA.ERP.FI.AI.FORECAST.V1', 'AI cash flow forecasting', 'sap_fi_ai',
  '{"ml_model": "cash_forecast", "horizon_days": 90}'::jsonb);

-- ============================================================================
-- Create Smart Code validation function
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_sap_fi_smart_code(p_smart_code TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check if smart code follows HERA.ERP.FI pattern
  IF p_smart_code NOT LIKE 'HERA.ERP.FI.%' THEN
    RETURN FALSE;
  END IF;
  
  -- Check if registered
  RETURN EXISTS (
    SELECT 1 FROM smart_code_registry 
    WHERE smart_code = p_smart_code
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION validate_sap_fi_smart_code TO authenticated;