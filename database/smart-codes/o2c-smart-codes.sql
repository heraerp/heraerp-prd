-- =============================================
-- HERA O2C (Order-to-Cash) SMART CODES v1
-- Complete revenue cycle on 6 universal tables
-- Replaces SAP SD/AR, Oracle Order Management with 95% cost savings
-- =============================================

-- Smart Code Registry for Order-to-Cash
-- Following HERA DNA pattern: HERA.{MODULE}.{FUNCTION}.{OPERATION}.v{VERSION}

-- =============================================
-- CUSTOMER MANAGEMENT
-- =============================================

-- Customer Master Data
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.O2C.CUSTOMER.MASTER.v1', 'Customer master record', 'O2C', 
  '{"entity_type": "customer", "fields": ["customer_name", "tax_id", "payment_terms", "credit_limit"]}'),
('HERA.O2C.CUSTOMER.CONTACT.v1', 'Customer contact information', 'O2C',
  '{"entity_type": "customer", "fields": ["billing_address", "shipping_address", "contact_person", "phone", "email"]}'),
('HERA.O2C.CUSTOMER.CREDIT.v1', 'Customer credit profile', 'O2C',
  '{"entity_type": "customer", "fields": ["credit_limit", "credit_score", "payment_history", "risk_rating"]}'),
('HERA.O2C.CUSTOMER.SEGMENT.v1', 'Customer segmentation', 'O2C',
  '{"entity_type": "customer", "fields": ["segment", "tier", "lifetime_value", "churn_risk"]}'),
('HERA.O2C.CUSTOMER.TERMS.v1', 'Customer payment terms', 'O2C',
  '{"entity_type": "customer", "fields": ["payment_terms", "discount_terms", "late_fee_policy"]}');

-- Customer Relationships
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.O2C.CUSTOMER.HIERARCHY.v1', 'Customer corporate hierarchy', 'O2C',
  '{"relationship_type": "parent_subsidiary", "fields": ["parent_customer", "subsidiary", "consolidation"]}'),
('HERA.O2C.CUSTOMER.CHANNEL.v1', 'Customer sales channel', 'O2C',
  '{"relationship_type": "channel_assignment", "fields": ["channel_type", "sales_rep", "territory"]}');

-- =============================================
-- ORDER MANAGEMENT
-- =============================================

-- Sales Orders
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.O2C.ORDER.CREATE.v1', 'Create sales order', 'O2C',
  '{"transaction_type": "sales_order", "fields": ["customer_id", "order_date", "delivery_date", "payment_terms"]}'),
('HERA.O2C.ORDER.APPROVE.v1', 'Approve sales order', 'O2C',
  '{"transaction_type": "order_approval", "fields": ["approver", "approval_date", "credit_check_status"]}'),
('HERA.O2C.ORDER.MODIFY.v1', 'Modify sales order', 'O2C',
  '{"transaction_type": "order_modification", "fields": ["change_type", "original_order", "new_values"]}'),
('HERA.O2C.ORDER.CANCEL.v1', 'Cancel sales order', 'O2C',
  '{"transaction_type": "order_cancellation", "fields": ["cancellation_reason", "cancellation_date", "refund_amount"]}'),
('HERA.O2C.ORDER.HOLD.v1', 'Put order on hold', 'O2C',
  '{"transaction_type": "order_hold", "fields": ["hold_reason", "hold_date", "expected_release"]}');

-- Order Types
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.O2C.ORDER.STANDARD.v1', 'Standard sales order', 'O2C',
  '{"order_type": "standard", "fields": ["delivery_method", "shipping_terms"]}'),
('HERA.O2C.ORDER.RUSH.v1', 'Rush/expedited order', 'O2C',
  '{"order_type": "rush", "fields": ["expedite_fee", "guaranteed_delivery"]}'),
('HERA.O2C.ORDER.SUBSCRIPTION.v1', 'Subscription order', 'O2C',
  '{"order_type": "subscription", "fields": ["billing_cycle", "renewal_date", "auto_renewal"]}'),
('HERA.O2C.ORDER.BLANKET.v1', 'Blanket purchase order', 'O2C',
  '{"order_type": "blanket", "fields": ["total_commitment", "release_schedule", "expiry_date"]}');

-- =============================================
-- ORDER FULFILLMENT
-- =============================================

INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.O2C.FULFILL.PICK.v1', 'Pick items for order', 'O2C',
  '{"transaction_type": "order_picking", "fields": ["picker", "pick_date", "location", "quantity"]}'),
('HERA.O2C.FULFILL.PACK.v1', 'Pack order for shipping', 'O2C',
  '{"transaction_type": "order_packing", "fields": ["packer", "pack_date", "package_count", "weight"]}'),
('HERA.O2C.FULFILL.SHIP.v1', 'Ship order to customer', 'O2C',
  '{"transaction_type": "order_shipment", "fields": ["carrier", "tracking_number", "ship_date", "freight_cost"]}'),
('HERA.O2C.FULFILL.DELIVER.v1', 'Deliver order to customer', 'O2C',
  '{"transaction_type": "order_delivery", "fields": ["delivery_date", "received_by", "delivery_proof"]}'),
('HERA.O2C.FULFILL.RETURN.v1', 'Process return/RMA', 'O2C',
  '{"transaction_type": "order_return", "fields": ["return_reason", "return_date", "condition", "refund_type"]}');

-- =============================================
-- INVOICING & BILLING
-- =============================================

-- Invoice Management
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.O2C.INVOICE.CREATE.v1', 'Create customer invoice', 'O2C',
  '{"transaction_type": "customer_invoice", "fields": ["invoice_number", "invoice_date", "due_date", "terms"]}'),
('HERA.O2C.INVOICE.SEND.v1', 'Send invoice to customer', 'O2C',
  '{"transaction_type": "invoice_transmission", "fields": ["send_method", "send_date", "recipient"]}'),
('HERA.O2C.INVOICE.MODIFY.v1', 'Modify customer invoice', 'O2C',
  '{"transaction_type": "invoice_modification", "fields": ["adjustment_reason", "original_amount", "new_amount"]}'),
('HERA.O2C.INVOICE.CANCEL.v1', 'Cancel customer invoice', 'O2C',
  '{"transaction_type": "invoice_cancellation", "fields": ["cancellation_reason", "credit_memo_number"]}'),
('HERA.O2C.INVOICE.DISPUTE.v1', 'Customer invoice dispute', 'O2C',
  '{"transaction_type": "invoice_dispute", "fields": ["dispute_reason", "disputed_amount", "contact_person"]}');

-- Billing Types
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.O2C.BILL.IMMEDIATE.v1', 'Bill immediately on order', 'O2C',
  '{"billing_type": "immediate", "trigger": "order_creation"}'),
('HERA.O2C.BILL.DELIVERY.v1', 'Bill on delivery', 'O2C',
  '{"billing_type": "on_delivery", "trigger": "delivery_confirmation"}'),
('HERA.O2C.BILL.MILESTONE.v1', 'Milestone-based billing', 'O2C',
  '{"billing_type": "milestone", "fields": ["milestone_schedule", "completion_criteria"]}'),
('HERA.O2C.BILL.RECURRING.v1', 'Recurring billing', 'O2C',
  '{"billing_type": "recurring", "fields": ["frequency", "start_date", "end_date"]}');

-- =============================================
-- PAYMENT & COLLECTIONS
-- =============================================

-- Payment Processing
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.O2C.PAYMENT.RECEIVE.v1', 'Receive customer payment', 'O2C',
  '{"transaction_type": "customer_payment", "fields": ["payment_method", "payment_date", "reference"]}'),
('HERA.O2C.PAYMENT.APPLY.v1', 'Apply payment to invoice', 'O2C',
  '{"transaction_type": "payment_application", "fields": ["invoice_id", "applied_amount", "remaining_balance"]}'),
('HERA.O2C.PAYMENT.REFUND.v1', 'Process customer refund', 'O2C',
  '{"transaction_type": "customer_refund", "fields": ["refund_reason", "refund_method", "refund_date"]}'),
('HERA.O2C.PAYMENT.REVERSE.v1', 'Reverse customer payment', 'O2C',
  '{"transaction_type": "payment_reversal", "fields": ["reversal_reason", "original_payment", "reversal_date"]}');

-- Payment Methods
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.O2C.PAY.CASH.v1', 'Cash payment', 'O2C',
  '{"payment_method": "cash", "fields": ["receipt_number", "cashier"]}'),
('HERA.O2C.PAY.CHECK.v1', 'Check payment', 'O2C',
  '{"payment_method": "check", "fields": ["check_number", "bank", "clearing_date"]}'),
('HERA.O2C.PAY.WIRE.v1', 'Wire transfer payment', 'O2C',
  '{"payment_method": "wire", "fields": ["wire_reference", "bank_details"]}'),
('HERA.O2C.PAY.CARD.v1', 'Credit/debit card payment', 'O2C',
  '{"payment_method": "card", "fields": ["card_type", "last_four", "authorization_code"]}'),
('HERA.O2C.PAY.ACH.v1', 'ACH payment', 'O2C',
  '{"payment_method": "ach", "fields": ["ach_reference", "bank_account"]}');

-- Collections Management
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.O2C.COLLECTION.DUNNING.v1', 'Dunning letter sent', 'O2C',
  '{"transaction_type": "dunning", "fields": ["dunning_level", "overdue_amount", "days_overdue"]}'),
('HERA.O2C.COLLECTION.PROMISE.v1', 'Promise to pay', 'O2C',
  '{"transaction_type": "payment_promise", "fields": ["promised_date", "promised_amount", "contact_person"]}'),
('HERA.O2C.COLLECTION.WRITEOFF.v1', 'Write off bad debt', 'O2C',
  '{"transaction_type": "bad_debt_writeoff", "fields": ["writeoff_amount", "approval", "reason"]}'),
('HERA.O2C.COLLECTION.AGENCY.v1', 'Send to collection agency', 'O2C',
  '{"transaction_type": "collection_agency", "fields": ["agency_name", "transfer_date", "commission_rate"]}');

-- =============================================
-- REVENUE RECOGNITION
-- =============================================

INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.O2C.REVENUE.RECOGNIZE.v1', 'Recognize revenue', 'O2C',
  '{"transaction_type": "revenue_recognition", "fields": ["recognition_date", "amount", "gl_account"]}'),
('HERA.O2C.REVENUE.DEFER.v1', 'Defer revenue', 'O2C',
  '{"transaction_type": "revenue_deferral", "fields": ["deferral_period", "recognition_schedule"]}'),
('HERA.O2C.REVENUE.ADJUST.v1', 'Adjust recognized revenue', 'O2C',
  '{"transaction_type": "revenue_adjustment", "fields": ["adjustment_reason", "original_amount", "adjusted_amount"]}'),
('HERA.O2C.REVENUE.ALLOCATE.v1', 'Allocate bundled revenue', 'O2C',
  '{"transaction_type": "revenue_allocation", "fields": ["bundle_components", "allocation_method", "fair_values"]}');

-- Revenue Recognition Methods
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.O2C.REV.POINT.v1', 'Point in time recognition', 'O2C',
  '{"recognition_method": "point_in_time", "trigger": "delivery"}'),
('HERA.O2C.REV.OVERTIME.v1', 'Over time recognition', 'O2C',
  '{"recognition_method": "over_time", "fields": ["completion_method", "progress_measure"]}'),
('HERA.O2C.REV.MILESTONE.v1', 'Milestone-based recognition', 'O2C',
  '{"recognition_method": "milestone", "fields": ["milestones", "completion_criteria"]}'),
('HERA.O2C.REV.SUBSCRIPTION.v1', 'Subscription revenue recognition', 'O2C',
  '{"recognition_method": "subscription", "fields": ["period", "proration_method"]}');

-- =============================================
-- CREDIT MANAGEMENT
-- =============================================

INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.O2C.CREDIT.CHECK.v1', 'Perform credit check', 'O2C',
  '{"transaction_type": "credit_check", "fields": ["check_type", "credit_score", "decision"]}'),
('HERA.O2C.CREDIT.LIMIT.v1', 'Set/update credit limit', 'O2C',
  '{"transaction_type": "credit_limit_change", "fields": ["old_limit", "new_limit", "approval"]}'),
('HERA.O2C.CREDIT.BLOCK.v1', 'Block customer credit', 'O2C',
  '{"transaction_type": "credit_block", "fields": ["block_reason", "block_date", "reviewer"]}'),
('HERA.O2C.CREDIT.RELEASE.v1', 'Release credit block', 'O2C',
  '{"transaction_type": "credit_release", "fields": ["release_reason", "release_date", "approver"]}'),
('HERA.O2C.CREDIT.REVIEW.v1', 'Periodic credit review', 'O2C',
  '{"transaction_type": "credit_review", "fields": ["review_date", "rating", "recommendations"]}');

-- =============================================
-- PRICING & DISCOUNTS
-- =============================================

INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.O2C.PRICE.LIST.v1', 'List price', 'O2C',
  '{"price_type": "list", "fields": ["price", "currency", "effective_date"]}'),
('HERA.O2C.PRICE.CONTRACT.v1', 'Contract price', 'O2C',
  '{"price_type": "contract", "fields": ["contract_id", "negotiated_price", "volume_tiers"]}'),
('HERA.O2C.PRICE.PROMO.v1', 'Promotional price', 'O2C',
  '{"price_type": "promotion", "fields": ["promo_code", "discount_percent", "valid_until"]}'),
('HERA.O2C.DISCOUNT.VOLUME.v1', 'Volume discount', 'O2C',
  '{"discount_type": "volume", "fields": ["volume_tiers", "discount_rates"]}'),
('HERA.O2C.DISCOUNT.EARLY.v1', 'Early payment discount', 'O2C',
  '{"discount_type": "early_payment", "fields": ["terms", "discount_percent", "due_days"]}');

-- =============================================
-- ANALYTICS & REPORTING
-- =============================================

INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.O2C.ANALYTICS.DSO.v1', 'Days Sales Outstanding', 'O2C',
  '{"metric_type": "dso", "calculation": "avg_receivables / daily_sales"}'),
('HERA.O2C.ANALYTICS.AGING.v1', 'Accounts receivable aging', 'O2C',
  '{"metric_type": "aging", "buckets": ["current", "30_days", "60_days", "90_days", "over_90"]}'),
('HERA.O2C.ANALYTICS.REVENUE.v1', 'Revenue analytics', 'O2C',
  '{"metric_type": "revenue", "dimensions": ["product", "customer", "region", "channel"]}'),
('HERA.O2C.ANALYTICS.CASHFLOW.v1', 'Cash flow forecast', 'O2C',
  '{"metric_type": "cash_flow", "forecast_period": "rolling_90_days"}'),
('HERA.O2C.ANALYTICS.CUSTOMER.v1', 'Customer analytics', 'O2C',
  '{"metric_type": "customer", "metrics": ["lifetime_value", "payment_behavior", "order_frequency"]}');

-- =============================================
-- AI & AUTOMATION
-- =============================================

INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.O2C.AI.CREDIT.SCORE.v1', 'AI credit scoring', 'O2C',
  '{"ai_type": "credit_scoring", "model": "payment_prediction", "confidence_threshold": 0.85}'),
('HERA.O2C.AI.COLLECTION.v1', 'AI collection strategy', 'O2C',
  '{"ai_type": "collection_optimization", "strategies": ["email", "call", "letter", "agency"]}'),
('HERA.O2C.AI.PRICING.v1', 'AI dynamic pricing', 'O2C',
  '{"ai_type": "pricing_optimization", "factors": ["demand", "competition", "inventory", "season"]}'),
('HERA.O2C.AI.FORECAST.v1', 'AI revenue forecast', 'O2C',
  '{"ai_type": "revenue_forecast", "models": ["time_series", "regression", "neural_network"]}'),
('HERA.O2C.AI.ANOMALY.v1', 'AI anomaly detection', 'O2C',
  '{"ai_type": "anomaly_detection", "monitors": ["order_patterns", "payment_behavior", "returns"]}');

-- =============================================
-- INTEGRATION & COMPLIANCE
-- =============================================

INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.O2C.TAX.CALCULATE.v1', 'Calculate sales tax', 'O2C',
  '{"integration_type": "tax", "fields": ["tax_jurisdiction", "tax_rate", "exemptions"]}'),
('HERA.O2C.EDI.ORDER.v1', 'EDI order integration', 'O2C',
  '{"integration_type": "edi", "document_type": "850", "partner_id": "customer_edi_id"}'),
('HERA.O2C.ECOMMERCE.SYNC.v1', 'E-commerce order sync', 'O2C',
  '{"integration_type": "ecommerce", "platform": ["shopify", "amazon", "ebay"]}'),
('HERA.O2C.BANK.RECONCILE.v1', 'Bank reconciliation', 'O2C',
  '{"integration_type": "banking", "fields": ["statement_date", "matched_payments", "exceptions"]}'),
('HERA.O2C.COMPLIANCE.SOX.v1', 'SOX compliance tracking', 'O2C',
  '{"compliance_type": "sox", "controls": ["revenue_recognition", "credit_approval", "writeoff_authorization"]}');