-- =============================================
-- HERA COMPLIANCE & TAX SMART CODES v1
-- Global tax compliance on 6 universal tables
-- =============================================

-- Smart Code Registry for Tax & Compliance
-- Following HERA DNA pattern: HERA.{MODULE}.{FUNCTION}.{OPERATION}.v{VERSION}

-- TAX RETURN PROCESSING
-- ====================

-- GST (India, Australia, Singapore, etc.)
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.TAX.GST.RETURN.v1', 'GST return filing', 'tax_return',
  '{"return_types": ["GSTR1", "GSTR2A", "GSTR3B", "BAS"], "frequency": ["monthly", "quarterly"]}'::jsonb),

('HERA.TAX.GST.INVOICE.v1', 'GST invoice processing', 'tax_transaction',
  '{"gst_types": ["CGST", "SGST", "IGST", "UTGST"], "rates": [0, 5, 12, 18, 28]}'::jsonb),

('HERA.TAX.GST.CREDIT.v1', 'Input tax credit tracking', 'tax_credit',
  '{"credit_types": ["eligible", "ineligible", "blocked", "reversed"]}'::jsonb),

('HERA.TAX.GST.RECONCILE.v1', 'GST reconciliation 2A/2B', 'tax_reconciliation',
  '{"match_fields": ["gstin", "invoice_no", "amount", "tax"], "tolerance": 0.01}'::jsonb),

-- VAT (EU, UK, Middle East)
('HERA.TAX.VAT.RETURN.v1', 'VAT return filing', 'tax_return',
  '{"return_types": ["EC Sales", "Intrastat", "VAT100"], "reverse_charge": true}'::jsonb),

('HERA.TAX.VAT.INVOICE.v1', 'VAT invoice processing', 'tax_transaction',
  '{"vat_rates": [0, 5, 10, 20, 21, 23], "schemes": ["standard", "flat_rate", "margin"]}'::jsonb),

('HERA.TAX.VAT.OSS.v1', 'One-Stop-Shop VAT filing', 'tax_return',
  '{"covers_countries": 27, "threshold": 10000}'::jsonb),

('HERA.TAX.VAT.MOSS.v1', 'Mini One-Stop-Shop filing', 'tax_return',
  '{"service_types": ["telecommunications", "broadcasting", "electronic"]}'::jsonb),

-- Withholding Tax
('HERA.TAX.WHT.REPORT.v1', 'Withholding tax reporting', 'tax_return',
  '{"report_types": ["TDS", "TCS", "1099", "CRS"], "frequency": ["quarterly", "annual"]}'::jsonb),

('HERA.TAX.WHT.DEDUCT.v1', 'Withholding tax deduction', 'tax_transaction',
  '{"deduction_types": ["salary", "contractor", "rent", "professional", "interest"]}'::jsonb),

('HERA.TAX.WHT.DEPOSIT.v1', 'Withholding tax deposit', 'tax_payment',
  '{"payment_modes": ["online", "challan"], "due_dates": true}'::jsonb),

('HERA.TAX.WHT.CERTIFICATE.v1', 'Withholding tax certificate', 'tax_document',
  '{"certificate_types": ["Form16", "Form16A", "1099-MISC", "1099-NEC"]}'::jsonb),

-- Sales Tax (US, Canada)
('HERA.TAX.SALES.RETURN.v1', 'Sales tax return filing', 'tax_return',
  '{"jurisdictions": ["state", "county", "city", "district"], "nexus_tracking": true}'::jsonb),

('HERA.TAX.SALES.CALC.v1', 'Sales tax calculation', 'tax_calculation',
  '{"tax_engines": ["avalara", "vertex", "native"], "real_time": true}'::jsonb),

('HERA.TAX.SALES.EXEMPT.v1', 'Sales tax exemption', 'tax_exemption',
  '{"exemption_types": ["resale", "government", "nonprofit", "manufacturing"]}'::jsonb),

-- Customs & Duties
('HERA.TAX.CUSTOMS.DECLARE.v1', 'Customs declaration', 'tax_declaration',
  '{"declaration_types": ["import", "export", "transit"], "hs_codes": true}'::jsonb),

('HERA.TAX.CUSTOMS.DUTY.v1', 'Customs duty calculation', 'tax_calculation',
  '{"duty_types": ["basic", "additional", "anti_dumping", "safeguard"]}'::jsonb),

-- TAX MASTER DATA
-- ==============

-- Tax Codes
('HERA.TAX.CODE.DEFINE.v1', 'Tax code definition', 'tax_master',
  '{"code_types": ["input", "output", "exempt", "zero_rated"]}'::jsonb),

('HERA.TAX.CODE.MAP.v1', 'Tax code mapping', 'tax_config',
  '{"mapping_types": ["gl_account", "product", "service", "customer"]}'::jsonb),

-- Tax Jurisdictions
('HERA.TAX.JURIS.DEFINE.v1', 'Tax jurisdiction setup', 'tax_master',
  '{"levels": ["country", "state", "county", "city", "special_district"]}'::jsonb),

('HERA.TAX.JURIS.RATE.v1', 'Jurisdiction tax rates', 'tax_master',
  '{"effective_dates": true, "rate_tiers": true}'::jsonb),

-- Tax Registration
('HERA.TAX.REG.CREATE.v1', 'Tax registration', 'tax_master',
  '{"registration_types": ["GST", "VAT", "EIN", "state_tax_id"]}'::jsonb),

('HERA.TAX.REG.NEXUS.v1', 'Tax nexus tracking', 'tax_compliance',
  '{"nexus_types": ["physical", "economic", "click_through", "marketplace"]}'::jsonb),

-- COMPLIANCE MONITORING
-- ===================

-- Filing Calendar
('HERA.TAX.CAL.DUE.v1', 'Tax filing due dates', 'tax_compliance',
  '{"reminder_days": [30, 15, 7, 1], "auto_extend": true}'::jsonb),

('HERA.TAX.CAL.FILED.v1', 'Tax filing confirmation', 'tax_compliance',
  '{"confirmation_types": ["ack_number", "receipt", "challan"]}'::jsonb),

-- Audit Trail
('HERA.TAX.AUDIT.LOG.v1', 'Tax audit trail', 'tax_audit',
  '{"log_changes": true, "immutable": true, "retention_years": 7}'::jsonb),

('HERA.TAX.AUDIT.REPORT.v1', 'Tax audit report', 'tax_audit',
  '{"report_types": ["transaction_log", "rate_changes", "filing_history"]}'::jsonb),

-- Compliance Checks
('HERA.TAX.COMPLY.CHECK.v1', 'Compliance validation', 'tax_compliance',
  '{"check_types": ["invoice_format", "mandatory_fields", "rate_validity"]}'::jsonb),

('HERA.TAX.COMPLY.ALERT.v1', 'Compliance alert', 'tax_compliance',
  '{"alert_types": ["missing_filing", "rate_change", "threshold_breach"]}'::jsonb),

-- AI & ANALYTICS
-- =============

-- Anomaly Detection
('HERA.TAX.AI.ANOMALY.v1', 'Tax anomaly detection', 'tax_ai',
  '{"detection_types": ["unusual_credit", "rate_mismatch", "pattern_change"]}'::jsonb),

('HERA.TAX.AI.PREDICT.v1', 'Tax liability prediction', 'tax_ai',
  '{"prediction_types": ["monthly_liability", "annual_forecast", "audit_risk"]}'::jsonb),

-- Optimization
('HERA.TAX.AI.OPTIMIZE.v1', 'Tax optimization suggestions', 'tax_ai',
  '{"optimization_areas": ["credits", "exemptions", "timing", "structure"]}'::jsonb),

('HERA.TAX.AI.CLASSIFY.v1', 'AI tax classification', 'tax_ai',
  '{"classification_types": ["hs_code", "tax_code", "exemption_eligibility"]}'::jsonb),

-- RECONCILIATION
-- =============

('HERA.TAX.RECON.BOOK.v1', 'Book to tax reconciliation', 'tax_reconciliation',
  '{"reconcile_items": ["revenue", "expenses", "assets", "liabilities"]}'::jsonb),

('HERA.TAX.RECON.VENDOR.v1', 'Vendor tax reconciliation', 'tax_reconciliation',
  '{"match_criteria": ["tin", "invoice", "amount"], "mismatch_tolerance": 0.01}'::jsonb),

-- REPORTING
-- ========

('HERA.TAX.REPORT.SUMMARY.v1', 'Tax summary report', 'tax_reporting',
  '{"report_formats": ["pdf", "xml", "json", "csv"], "languages": ["en", "es", "fr"]}'::jsonb),

('HERA.TAX.REPORT.DETAIL.v1', 'Detailed tax report', 'tax_reporting',
  '{"grouping_options": ["tax_code", "jurisdiction", "period", "entity"]}'::jsonb),

-- E-INVOICING
-- ==========

('HERA.TAX.EINV.GENERATE.v1', 'E-invoice generation', 'tax_einvoice',
  '{"standards": ["PEPPOL", "FatturaPA", "CFDI", "NF-e"], "digital_signature": true}'::jsonb),

('HERA.TAX.EINV.VALIDATE.v1', 'E-invoice validation', 'tax_einvoice',
  '{"validation_rules": ["schema", "business", "tax"], "real_time": true}'::jsonb),

-- EVENTS
-- ======

('HERA.TAX.EVENT.FILED.v1', 'Tax return filed', 'tax_event',
  '{"triggers_downstream": true, "notification": true}'::jsonb),

('HERA.TAX.EVENT.PAID.v1', 'Tax payment made', 'tax_event',
  '{"updates_liability": true, "receipt_generation": true}'::jsonb),

('HERA.TAX.EVENT.AMENDED.v1', 'Tax return amended', 'tax_event',
  '{"tracks_version": true, "reason_required": true}'::jsonb),

-- ERRORS
-- ======

('HERA.TAX.ERROR.CALC.v1', 'Tax calculation error', 'tax_error',
  '{"error_types": ["missing_rate", "invalid_code", "system_error"]}'::jsonb),

('HERA.TAX.ERROR.FILE.v1', 'Tax filing error', 'tax_error',
  '{"error_types": ["validation", "submission", "timeout", "rejection"]}'::jsonb);

-- Grant permissions
GRANT SELECT ON smart_code_registry TO authenticated;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tax_smart_code_category ON smart_code_registry(category) 
WHERE category LIKE 'tax_%';

CREATE INDEX IF NOT EXISTS idx_tax_smart_code_pattern ON smart_code_registry(smart_code text_pattern_ops)
WHERE smart_code LIKE 'HERA.TAX.%';