-- =============================================
-- HERA FIN (Financial Management) SMART CODES v1
-- Complete financial backbone on 6 universal tables
-- Replaces SAP FI, Oracle GL with 98% cost savings
-- =============================================

-- Smart Code Registry for Financial Management
-- Following HERA DNA pattern: HERA.{MODULE}.{FUNCTION}.{OPERATION}.v{VERSION}

-- =============================================
-- GENERAL LEDGER (GL)
-- =============================================

-- GL Account Management
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.FIN.GL.ACCOUNT.MASTER.V1', 'GL account master record', 'FIN', 
  '{"entity_type": "gl_account", "fields": ["account_code", "account_name", "account_type", "normal_balance", "ifrs_classification"]}'),
('HERA.FIN.GL.ACCOUNT.CREATE.V1', 'Create GL account', 'FIN',
  '{"entity_type": "gl_account", "validations": ["unique_code", "valid_type", "parent_exists"]}'),
('HERA.FIN.GL.ACCOUNT.HIERARCHY.V1', 'GL account hierarchy structure', 'FIN',
  '{"relationship_type": "parent_child", "fields": ["parent_account", "child_account", "consolidation_method"]}'),
('HERA.FIN.GL.ACCOUNT.ACTIVATE.V1', 'Activate GL account for posting', 'FIN',
  '{"status_change": "inactive_to_active", "validations": ["complete_setup", "approved"]}'),
('HERA.FIN.GL.ACCOUNT.BLOCK.V1', 'Block GL account from posting', 'FIN',
  '{"status_change": "active_to_blocked", "fields": ["block_reason", "block_date", "approver"]}');

-- Journal Entry Management
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.FIN.GL.JOURNAL.MANUAL.V1', 'Manual journal entry', 'FIN',
  '{"transaction_type": "journal_entry", "fields": ["entry_date", "description", "source", "approval_required"]}'),
('HERA.FIN.GL.JOURNAL.AUTO.V1', 'Automated journal entry', 'FIN',
  '{"transaction_type": "journal_entry", "fields": ["source_module", "source_transaction", "auto_generated"]}'),
('HERA.FIN.GL.JOURNAL.RECURRING.V1', 'Recurring journal entry', 'FIN',
  '{"transaction_type": "journal_entry", "fields": ["frequency", "start_date", "end_date", "template_id"]}'),
('HERA.FIN.GL.JOURNAL.REVERSAL.V1', 'Journal entry reversal', 'FIN',
  '{"transaction_type": "journal_reversal", "fields": ["original_entry", "reversal_date", "reversal_reason"]}'),
('HERA.FIN.GL.JOURNAL.ADJUSTMENT.V1', 'Period-end adjustment entry', 'FIN',
  '{"transaction_type": "journal_adjustment", "fields": ["adjustment_type", "period", "audit_required"]}');

-- GL Posting Rules
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.FIN.GL.POST.VALIDATE.V1', 'Validate journal entry before posting', 'FIN',
  '{"validations": ["balanced_entry", "valid_accounts", "open_period", "authorization"]}'),
('HERA.FIN.GL.POST.EXECUTE.V1', 'Execute GL posting', 'FIN',
  '{"posting_type": "real_time", "updates": ["account_balances", "period_totals", "audit_trail"]}'),
('HERA.FIN.GL.POST.BATCH.V1', 'Batch GL posting process', 'FIN',
  '{"posting_type": "batch", "fields": ["batch_id", "posting_date", "entry_count"]}'),
('HERA.FIN.GL.POST.ALLOCATE.V1', 'Allocate costs/revenues', 'FIN',
  '{"allocation_type": "dynamic", "fields": ["allocation_rule", "basis", "target_accounts"]}');

-- =============================================
-- FINANCIAL PERIODS & CLOSING
-- =============================================

INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.FIN.PERIOD.FISCAL_YEAR.V1', 'Fiscal year definition', 'FIN',
  '{"entity_type": "fiscal_period", "fields": ["year", "start_date", "end_date", "period_count"]}'),
('HERA.FIN.PERIOD.MONTH.V1', 'Monthly accounting period', 'FIN',
  '{"entity_type": "fiscal_period", "fields": ["year", "month", "start_date", "end_date", "status"]}'),
('HERA.FIN.PERIOD.OPEN.V1', 'Open accounting period', 'FIN',
  '{"status_change": "closed_to_open", "validations": ["authorized", "sequence_check"]}'),
('HERA.FIN.PERIOD.CLOSE.V1', 'Close accounting period', 'FIN',
  '{"status_change": "open_to_closed", "tasks": ["reconciliation", "adjustments", "rollforward"]}'),
('HERA.FIN.PERIOD.YEAR_END.V1', 'Year-end closing process', 'FIN',
  '{"closing_type": "annual", "tasks": ["final_adjustments", "tax_provisions", "retained_earnings"]}');

-- =============================================
-- FINANCIAL REPORTING
-- =============================================

-- Standard Financial Statements
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.FIN.REPORT.BALANCE_SHEET.V1', 'Balance Sheet / Statement of Financial Position', 'FIN',
  '{"report_type": "balance_sheet", "sections": ["assets", "liabilities", "equity"], "ifrs_compliant": true}'),
('HERA.FIN.REPORT.INCOME_STMT.V1', 'Income Statement / P&L', 'FIN',
  '{"report_type": "income_statement", "sections": ["revenue", "cogs", "expenses", "other"], "ifrs_compliant": true}'),
('HERA.FIN.REPORT.CASH_FLOW.V1', 'Statement of Cash Flows', 'FIN',
  '{"report_type": "cash_flow", "sections": ["operating", "investing", "financing"], "method": "indirect"}'),
('HERA.FIN.REPORT.EQUITY_CHANGE.V1', 'Statement of Changes in Equity', 'FIN',
  '{"report_type": "equity_changes", "components": ["share_capital", "reserves", "retained_earnings"]}'),
('HERA.FIN.REPORT.TRIAL_BALANCE.V1', 'Trial Balance report', 'FIN',
  '{"report_type": "trial_balance", "fields": ["opening_balance", "debits", "credits", "closing_balance"]}');

-- Management Reports
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.FIN.REPORT.BUDGET_ACTUAL.V1', 'Budget vs Actual comparison', 'FIN',
  '{"report_type": "budget_variance", "fields": ["budget", "actual", "variance", "percentage"]}'),
('HERA.FIN.REPORT.COST_CENTER.V1', 'Cost center performance report', 'FIN',
  '{"report_type": "cost_center", "dimensions": ["department", "project", "location"]}'),
('HERA.FIN.REPORT.PROFITABILITY.V1', 'Profitability analysis report', 'FIN',
  '{"report_type": "profitability", "dimensions": ["customer", "product", "channel", "region"]}'),
('HERA.FIN.REPORT.AGING.V1', 'AR/AP aging analysis', 'FIN',
  '{"report_type": "aging", "buckets": ["current", "30_days", "60_days", "90_days", "over_90"]}'),
('HERA.FIN.REPORT.RATIO_ANALYSIS.V1', 'Financial ratio analysis', 'FIN',
  '{"report_type": "ratios", "categories": ["liquidity", "leverage", "efficiency", "profitability"]}');

-- =============================================
-- CONSOLIDATION & MULTI-COMPANY
-- =============================================

INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.FIN.CONSOL.COMPANY.V1', 'Consolidation company structure', 'FIN',
  '{"entity_type": "consolidation_unit", "fields": ["company_code", "currency", "ownership_percent"]}'),
('HERA.FIN.CONSOL.ELIMINATE.V1', 'Intercompany elimination', 'FIN',
  '{"transaction_type": "elimination_entry", "fields": ["company_from", "company_to", "elimination_rule"]}'),
('HERA.FIN.CONSOL.CURRENCY.V1', 'Currency translation for consolidation', 'FIN',
  '{"transaction_type": "currency_translation", "methods": ["current_rate", "temporal", "monetary_nonmonetary"]}'),
('HERA.FIN.CONSOL.MINORITY.V1', 'Minority interest calculation', 'FIN',
  '{"calculation_type": "minority_interest", "fields": ["ownership_percent", "profit_share", "equity_share"]}'),
('HERA.FIN.CONSOL.REPORT.V1', 'Consolidated financial statements', 'FIN',
  '{"report_type": "consolidated", "includes": ["eliminations", "currency_translation", "minority_interest"]}');

-- =============================================
-- COST ACCOUNTING
-- =============================================

INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.FIN.COST.CENTER.V1', 'Cost center master', 'FIN',
  '{"entity_type": "cost_center", "fields": ["center_code", "center_name", "manager", "budget"]}'),
('HERA.FIN.COST.ALLOCATION.V1', 'Cost allocation rules', 'FIN',
  '{"allocation_type": "rule_based", "fields": ["source_center", "target_centers", "allocation_basis"]}'),
('HERA.FIN.COST.ACTIVITY.V1', 'Activity-based costing', 'FIN',
  '{"costing_method": "ABC", "fields": ["activity", "cost_driver", "rate_per_driver"]}'),
('HERA.FIN.COST.STANDARD.V1', 'Standard costing', 'FIN',
  '{"costing_method": "standard", "fields": ["material_cost", "labor_cost", "overhead_rate"]}'),
('HERA.FIN.COST.VARIANCE.V1', 'Cost variance analysis', 'FIN',
  '{"variance_type": "standard_vs_actual", "components": ["price_variance", "quantity_variance", "efficiency_variance"]}');

-- =============================================
-- TAX MANAGEMENT
-- =============================================

INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.FIN.TAX.CONFIG.V1', 'Tax configuration', 'FIN',
  '{"entity_type": "tax_code", "fields": ["tax_type", "rate", "jurisdiction", "gl_account"]}'),
('HERA.FIN.TAX.CALCULATE.V1', 'Tax calculation engine', 'FIN',
  '{"calculation_type": "automated", "supports": ["VAT", "GST", "sales_tax", "withholding"]}'),
('HERA.FIN.TAX.REPORT.V1', 'Tax reporting', 'FIN',
  '{"report_type": "tax_return", "fields": ["period", "taxable_amount", "tax_due", "credits"]}'),
('HERA.FIN.TAX.AUDIT.V1', 'Tax audit trail', 'FIN',
  '{"audit_type": "tax_compliance", "tracks": ["calculations", "adjustments", "filings"]}'),
('HERA.FIN.TAX.WITHHOLD.V1', 'Withholding tax processing', 'FIN',
  '{"tax_type": "withholding", "fields": ["vendor", "rate", "certificate", "remittance"]}');

-- =============================================
-- ASSET MANAGEMENT
-- =============================================

INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.FIN.ASSET.MASTER.V1', 'Fixed asset master', 'FIN',
  '{"entity_type": "fixed_asset", "fields": ["asset_code", "description", "cost", "useful_life", "location"]}'),
('HERA.FIN.ASSET.ACQUIRE.V1', 'Asset acquisition', 'FIN',
  '{"transaction_type": "asset_purchase", "fields": ["purchase_date", "vendor", "invoice", "capitalization"]}'),
('HERA.FIN.ASSET.DEPRECIATE.V1', 'Asset depreciation', 'FIN',
  '{"transaction_type": "depreciation", "methods": ["straight_line", "declining_balance", "units_production"]}'),
('HERA.FIN.ASSET.DISPOSE.V1', 'Asset disposal', 'FIN',
  '{"transaction_type": "asset_disposal", "fields": ["disposal_date", "proceeds", "gain_loss"]}'),
('HERA.FIN.ASSET.REVALUE.V1', 'Asset revaluation', 'FIN',
  '{"transaction_type": "revaluation", "fields": ["valuation_date", "fair_value", "revaluation_surplus"]}');

-- =============================================
-- ANALYTICS & AI
-- =============================================

INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.FIN.AI.ANOMALY.V1', 'Financial anomaly detection', 'FIN',
  '{"ai_type": "anomaly_detection", "monitors": ["journal_entries", "account_balances", "ratios"]}'),
('HERA.FIN.AI.FORECAST.V1', 'Financial forecasting', 'FIN',
  '{"ai_type": "predictive", "forecasts": ["revenue", "expenses", "cash_flow", "working_capital"]}'),
('HERA.FIN.AI.AUDIT.V1', 'AI-powered audit', 'FIN',
  '{"ai_type": "audit_assistant", "checks": ["compliance", "accuracy", "completeness", "fraud_risk"]}'),
('HERA.FIN.AI.OPTIMIZE.V1', 'Financial optimization', 'FIN',
  '{"ai_type": "optimization", "areas": ["working_capital", "cash_management", "cost_reduction"]}'),
('HERA.FIN.AI.INSIGHTS.V1', 'Financial insights generation', 'FIN',
  '{"ai_type": "insights", "provides": ["trends", "risks", "opportunities", "recommendations"]}');

-- =============================================
-- COMPLIANCE & AUDIT
-- =============================================

INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.FIN.AUDIT.TRAIL.V1', 'Complete audit trail', 'FIN',
  '{"audit_type": "transaction_log", "captures": ["who", "what", "when", "why", "approval"]}'),
('HERA.FIN.AUDIT.RECONCILE.V1', 'Account reconciliation', 'FIN',
  '{"reconciliation_type": "account", "fields": ["gl_balance", "sub_ledger", "bank_statement", "differences"]}'),
('HERA.FIN.AUDIT.CONFIRM.V1', 'Balance confirmation', 'FIN',
  '{"confirmation_type": "external", "parties": ["customers", "vendors", "banks", "auditors"]}'),
('HERA.FIN.AUDIT.COMPLIANCE.V1', 'Compliance monitoring', 'FIN',
  '{"compliance_type": "regulatory", "standards": ["IFRS", "GAAP", "SOX", "local_regulations"]}'),
('HERA.FIN.AUDIT.INTERNAL.V1', 'Internal audit procedures', 'FIN',
  '{"audit_type": "internal", "areas": ["controls", "processes", "risks", "recommendations"]}');

-- =============================================
-- INTEGRATION & INTERFACES
-- =============================================

INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.FIN.INTEGRATE.BANK.V1', 'Bank integration', 'FIN',
  '{"integration_type": "banking", "supports": ["statements", "payments", "reconciliation"]}'),
('HERA.FIN.INTEGRATE.TAX.V1', 'Tax authority integration', 'FIN',
  '{"integration_type": "tax_filing", "supports": ["e_filing", "validation", "acknowledgment"]}'),
('HERA.FIN.INTEGRATE.AUDIT.V1', 'External auditor integration', 'FIN',
  '{"integration_type": "audit_portal", "provides": ["documents", "confirmations", "analytics"]}'),
('HERA.FIN.INTEGRATE.REPORT.V1', 'Regulatory reporting integration', 'FIN',
  '{"integration_type": "regulatory", "formats": ["XBRL", "XML", "API", "flat_file"]}'),
('HERA.FIN.INTEGRATE.MODULE.V1', 'Cross-module integration', 'FIN',
  '{"integration_type": "internal", "modules": ["P2P", "O2C", "HCM", "SCM", "MFG"]}');