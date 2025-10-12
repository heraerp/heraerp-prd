-- ============================================================================
-- HERA DNA COA: SALON - UAE
-- Generated: 2024-01-15
-- Industry: Beauty & Wellness Salon
-- Country: United Arab Emirates
-- Features: VAT Compliant, Multi-Currency, Service-Based
-- ============================================================================

-- Organization: Example Salon UAE
-- This COA is generated using HERA DNA patterns:
-- Base Template (Universal) + UAE Layer + Salon Industry Layer

BEGIN;

-- ============================================================================
-- 1000-1999: ASSETS
-- ============================================================================

-- 1100-1199: Current Assets - Cash & Bank
INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, smart_code, metadata) VALUES
('${organizationId}', 'gl_account', '1110', 'Petty Cash - Reception', 'HERA.FIN.GL.UAE.SALON.ASSET.CASH.PETTY.V1', 
 '{"account_type": "asset", "is_current": true, "currency": "AED", "cash_account": true}'),
('${organizationId}', 'gl_account', '1120', 'Cash Register - Main', 'HERA.FIN.GL.UAE.SALON.ASSET.CASH.REGISTER.V1',
 '{"account_type": "asset", "is_current": true, "currency": "AED", "cash_account": true}'),
('${organizationId}', 'gl_account', '1130', 'Bank - Emirates NBD Current', 'HERA.FIN.GL.UAE.SALON.ASSET.BANK.CURRENT.V1',
 '{"account_type": "asset", "is_current": true, "currency": "AED", "bank_account": true}'),
('${organizationId}', 'gl_account', '1140', 'Bank - CBD Business Account', 'HERA.FIN.GL.UAE.SALON.ASSET.BANK.BUSINESS.V1',
 '{"account_type": "asset", "is_current": true, "currency": "AED", "bank_account": true}'),
('${organizationId}', 'gl_account', '1150', 'Credit Card Receivables', 'HERA.FIN.GL.UAE.SALON.ASSET.CC.RECEIVABLE.V1',
 '{"account_type": "asset", "is_current": true, "clearing_account": true}'),
('${organizationId}', 'gl_account', '1160', 'Digital Wallet Receivables', 'HERA.FIN.GL.UAE.SALON.ASSET.DIGITAL.RECEIVABLE.V1',
 '{"account_type": "asset", "is_current": true, "clearing_account": true}');

-- 1200-1299: Accounts Receivable
INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, smart_code, metadata) VALUES
('${organizationId}', 'gl_account', '1210', 'Customer Receivables - Services', 'HERA.FIN.GL.UAE.SALON.ASSET.AR.SERVICE.V1',
 '{"account_type": "asset", "is_current": true, "receivable": true}'),
('${organizationId}', 'gl_account', '1220', 'Package Receivables', 'HERA.FIN.GL.UAE.SALON.ASSET.AR.PACKAGE.V1',
 '{"account_type": "asset", "is_current": true, "receivable": true}'),
('${organizationId}', 'gl_account', '1230', 'Gift Card Receivables', 'HERA.FIN.GL.UAE.SALON.ASSET.AR.GIFTCARD.V1',
 '{"account_type": "asset", "is_current": true, "receivable": true}'),
('${organizationId}', 'gl_account', '1240', 'Insurance Receivables', 'HERA.FIN.GL.UAE.SALON.ASSET.AR.INSURANCE.V1',
 '{"account_type": "asset", "is_current": true, "receivable": true}'),
('${organizationId}', 'gl_account', '1251', 'VAT Input Receivable', 'HERA.FIN.GL.UAE.SALON.ASSET.VAT.INPUT.V1',
 '{"account_type": "asset", "is_current": true, "tax_account": true, "vat_rate": 0.05}');

-- 1300-1399: Inventory
INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, smart_code, metadata) VALUES
('${organizationId}', 'gl_account', '1310', 'Retail Products Inventory', 'HERA.FIN.GL.UAE.SALON.ASSET.INV.RETAIL.V1',
 '{"account_type": "asset", "is_current": true, "inventory": true}'),
('${organizationId}', 'gl_account', '1320', 'Professional Products Inventory', 'HERA.FIN.GL.UAE.SALON.ASSET.INV.PROFESSIONAL.V1',
 '{"account_type": "asset", "is_current": true, "inventory": true}'),
('${organizationId}', 'gl_account', '1330', 'Consumable Supplies', 'HERA.FIN.GL.UAE.SALON.ASSET.INV.SUPPLIES.V1',
 '{"account_type": "asset", "is_current": true, "inventory": true}'),
('${organizationId}', 'gl_account', '1340', 'Spa Supplies Inventory', 'HERA.FIN.GL.UAE.SALON.ASSET.INV.SPA.V1',
 '{"account_type": "asset", "is_current": true, "inventory": true}');

-- 1400-1499: Prepayments & Other Current
INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, smart_code, metadata) VALUES
('${organizationId}', 'gl_account', '1410', 'Prepaid Rent', 'HERA.FIN.GL.UAE.SALON.ASSET.PREPAID.RENT.V1',
 '{"account_type": "asset", "is_current": true, "prepaid": true}'),
('${organizationId}', 'gl_account', '1420', 'Prepaid Insurance', 'HERA.FIN.GL.UAE.SALON.ASSET.PREPAID.INSURANCE.V1',
 '{"account_type": "asset", "is_current": true, "prepaid": true}'),
('${organizationId}', 'gl_account', '1430', 'Security Deposits', 'HERA.FIN.GL.UAE.SALON.ASSET.DEPOSIT.SECURITY.V1',
 '{"account_type": "asset", "is_current": true}'),
('${organizationId}', 'gl_account', '1440', 'Staff Advances', 'HERA.FIN.GL.UAE.SALON.ASSET.ADVANCE.STAFF.V1',
 '{"account_type": "asset", "is_current": true}');

-- 1600-1799: Fixed Assets
INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, smart_code, metadata) VALUES
('${organizationId}', 'gl_account', '1610', 'Salon Equipment - Hair', 'HERA.FIN.GL.UAE.SALON.ASSET.EQUIP.HAIR.V1',
 '{"account_type": "asset", "is_fixed": true, "depreciable": true, "life_years": 5}'),
('${organizationId}', 'gl_account', '1620', 'Salon Equipment - Spa', 'HERA.FIN.GL.UAE.SALON.ASSET.EQUIP.SPA.V1',
 '{"account_type": "asset", "is_fixed": true, "depreciable": true, "life_years": 7}'),
('${organizationId}', 'gl_account', '1630', 'Furniture & Fixtures', 'HERA.FIN.GL.UAE.SALON.ASSET.FURNITURE.V1',
 '{"account_type": "asset", "is_fixed": true, "depreciable": true, "life_years": 10}'),
('${organizationId}', 'gl_account', '1640', 'Computer Equipment', 'HERA.FIN.GL.UAE.SALON.ASSET.COMPUTER.V1',
 '{"account_type": "asset", "is_fixed": true, "depreciable": true, "life_years": 3}'),
('${organizationId}', 'gl_account', '1650', 'Leasehold Improvements', 'HERA.FIN.GL.UAE.SALON.ASSET.LEASEHOLD.V1',
 '{"account_type": "asset", "is_fixed": true, "depreciable": true, "life_years": 5}');

-- 1700-1799: Accumulated Depreciation
INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, smart_code, metadata) VALUES
('${organizationId}', 'gl_account', '1710', 'Acc. Dep. - Salon Equipment Hair', 'HERA.FIN.GL.UAE.SALON.ASSET.ACCDEP.HAIR.V1',
 '{"account_type": "asset", "is_contra": true, "related_account": "1610"}'),
('${organizationId}', 'gl_account', '1720', 'Acc. Dep. - Salon Equipment Spa', 'HERA.FIN.GL.UAE.SALON.ASSET.ACCDEP.SPA.V1',
 '{"account_type": "asset", "is_contra": true, "related_account": "1620"}'),
('${organizationId}', 'gl_account', '1730', 'Acc. Dep. - Furniture & Fixtures', 'HERA.FIN.GL.UAE.SALON.ASSET.ACCDEP.FURNITURE.V1',
 '{"account_type": "asset", "is_contra": true, "related_account": "1630"}'),
('${organizationId}', 'gl_account', '1740', 'Acc. Dep. - Computer Equipment', 'HERA.FIN.GL.UAE.SALON.ASSET.ACCDEP.COMPUTER.V1',
 '{"account_type": "asset", "is_contra": true, "related_account": "1640"}'),
('${organizationId}', 'gl_account', '1750', 'Acc. Dep. - Leasehold Improvements', 'HERA.FIN.GL.UAE.SALON.ASSET.ACCDEP.LEASEHOLD.V1',
 '{"account_type": "asset", "is_contra": true, "related_account": "1650"}');

-- ============================================================================
-- 2000-2999: LIABILITIES
-- ============================================================================

-- 2100-2199: Current Liabilities
INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, smart_code, metadata) VALUES
('${organizationId}', 'gl_account', '2110', 'Accounts Payable - Suppliers', 'HERA.FIN.GL.UAE.SALON.LIAB.AP.SUPPLIER.V1',
 '{"account_type": "liability", "is_current": true, "payable": true}'),
('${organizationId}', 'gl_account', '2120', 'Accounts Payable - Contractors', 'HERA.FIN.GL.UAE.SALON.LIAB.AP.CONTRACTOR.V1',
 '{"account_type": "liability", "is_current": true, "payable": true}'),
('${organizationId}', 'gl_account', '2130', 'Credit Card Payable', 'HERA.FIN.GL.UAE.SALON.LIAB.CC.PAYABLE.V1',
 '{"account_type": "liability", "is_current": true}'),
('${organizationId}', 'gl_account', '2140', 'Accrued Expenses', 'HERA.FIN.GL.UAE.SALON.LIAB.ACCRUED.V1',
 '{"account_type": "liability", "is_current": true}'),
('${organizationId}', 'gl_account', '2150', 'Commission Payable - Stylists', 'HERA.FIN.GL.UAE.SALON.LIAB.COMMISSION.V1',
 '{"account_type": "liability", "is_current": true}'),
('${organizationId}', 'gl_account', '2160', 'Tips Payable', 'HERA.FIN.GL.UAE.SALON.LIAB.TIPS.V1',
 '{"account_type": "liability", "is_current": true}');

-- 2200-2299: Deferred Revenue & Deposits
INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, smart_code, metadata) VALUES
('${organizationId}', 'gl_account', '2210', 'Unearned Service Revenue', 'HERA.FIN.GL.UAE.SALON.LIAB.UNEARNED.SERVICE.V1',
 '{"account_type": "liability", "is_current": true, "deferred": true}'),
('${organizationId}', 'gl_account', '2220', 'Gift Card Liability', 'HERA.FIN.GL.UAE.SALON.LIAB.GIFTCARD.V1',
 '{"account_type": "liability", "is_current": true, "deferred": true}'),
('${organizationId}', 'gl_account', '2230', 'Package Liability', 'HERA.FIN.GL.UAE.SALON.LIAB.PACKAGE.V1',
 '{"account_type": "liability", "is_current": true, "deferred": true}'),
('${organizationId}', 'gl_account', '2240', 'Customer Deposits', 'HERA.FIN.GL.UAE.SALON.LIAB.DEPOSIT.CUSTOMER.V1',
 '{"account_type": "liability", "is_current": true}'),
('${organizationId}', 'gl_account', '2251', 'VAT Output Payable', 'HERA.FIN.GL.UAE.SALON.LIAB.VAT.OUTPUT.V1',
 '{"account_type": "liability", "is_current": true, "tax_account": true, "vat_rate": 0.05}');

-- 2300-2399: Payroll Liabilities
INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, smart_code, metadata) VALUES
('${organizationId}', 'gl_account', '2310', 'Salaries Payable', 'HERA.FIN.GL.UAE.SALON.LIAB.SALARY.V1',
 '{"account_type": "liability", "is_current": true, "payroll": true}'),
('${organizationId}', 'gl_account', '2320', 'Gratuity Payable', 'HERA.FIN.GL.UAE.SALON.LIAB.GRATUITY.V1',
 '{"account_type": "liability", "is_current": true, "payroll": true}'),
('${organizationId}', 'gl_account', '2330', 'Leave Salary Payable', 'HERA.FIN.GL.UAE.SALON.LIAB.LEAVE.V1',
 '{"account_type": "liability", "is_current": true, "payroll": true}'),
('${organizationId}', 'gl_account', '2340', 'End of Service Benefits', 'HERA.FIN.GL.UAE.SALON.LIAB.EOSB.V1',
 '{"account_type": "liability", "is_current": true, "payroll": true}');

-- ============================================================================
-- 3000-3999: EQUITY
-- ============================================================================

INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, smart_code, metadata) VALUES
('${organizationId}', 'gl_account', '3100', 'Share Capital', 'HERA.FIN.GL.UAE.SALON.EQUITY.CAPITAL.V1',
 '{"account_type": "equity", "is_permanent": true}'),
('${organizationId}', 'gl_account', '3200', 'Retained Earnings', 'HERA.FIN.GL.UAE.SALON.EQUITY.RETAINED.V1',
 '{"account_type": "equity", "is_permanent": true}'),
('${organizationId}', 'gl_account', '3300', 'Current Year Earnings', 'HERA.FIN.GL.UAE.SALON.EQUITY.CURRENT.V1',
 '{"account_type": "equity", "is_temporary": true}'),
('${organizationId}', 'gl_account', '3400', 'Owner Drawings', 'HERA.FIN.GL.UAE.SALON.EQUITY.DRAWINGS.V1',
 '{"account_type": "equity", "is_contra": true}');

-- ============================================================================
-- 4000-4999: REVENUE
-- ============================================================================

-- 4100-4199: Service Revenue
INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, smart_code, metadata) VALUES
('${organizationId}', 'gl_account', '4110', 'Hair Service Revenue', 'HERA.FIN.GL.UAE.SALON.REV.HAIR.V1',
 '{"account_type": "revenue", "service_category": "hair", "vat_applicable": true}'),
('${organizationId}', 'gl_account', '4120', 'Nail Service Revenue', 'HERA.FIN.GL.UAE.SALON.REV.NAIL.V1',
 '{"account_type": "revenue", "service_category": "nail", "vat_applicable": true}'),
('${organizationId}', 'gl_account', '4130', 'Spa Service Revenue', 'HERA.FIN.GL.UAE.SALON.REV.SPA.V1',
 '{"account_type": "revenue", "service_category": "spa", "vat_applicable": true}'),
('${organizationId}', 'gl_account', '4140', 'Facial Service Revenue', 'HERA.FIN.GL.UAE.SALON.REV.FACIAL.V1',
 '{"account_type": "revenue", "service_category": "facial", "vat_applicable": true}'),
('${organizationId}', 'gl_account', '4150', 'Makeup Service Revenue', 'HERA.FIN.GL.UAE.SALON.REV.MAKEUP.V1',
 '{"account_type": "revenue", "service_category": "makeup", "vat_applicable": true}'),
('${organizationId}', 'gl_account', '4160', 'Bridal Service Revenue', 'HERA.FIN.GL.UAE.SALON.REV.BRIDAL.V1',
 '{"account_type": "revenue", "service_category": "bridal", "vat_applicable": true}'),
('${organizationId}', 'gl_account', '4170', 'Men Grooming Revenue', 'HERA.FIN.GL.UAE.SALON.REV.MENS.V1',
 '{"account_type": "revenue", "service_category": "mens", "vat_applicable": true}');

-- 4200-4299: Product Sales Revenue
INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, smart_code, metadata) VALUES
('${organizationId}', 'gl_account', '4210', 'Retail Product Sales', 'HERA.FIN.GL.UAE.SALON.REV.RETAIL.V1',
 '{"account_type": "revenue", "product_sales": true, "vat_applicable": true}'),
('${organizationId}', 'gl_account', '4220', 'Professional Product Sales', 'HERA.FIN.GL.UAE.SALON.REV.PROFESSIONAL.V1',
 '{"account_type": "revenue", "product_sales": true, "vat_applicable": true}');

-- 4300-4399: Package & Membership Revenue
INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, smart_code, metadata) VALUES
('${organizationId}', 'gl_account', '4310', 'Package Sales Revenue', 'HERA.FIN.GL.UAE.SALON.REV.PACKAGE.V1',
 '{"account_type": "revenue", "deferred_recognition": true, "vat_applicable": true}'),
('${organizationId}', 'gl_account', '4320', 'Membership Revenue', 'HERA.FIN.GL.UAE.SALON.REV.MEMBERSHIP.V1',
 '{"account_type": "revenue", "recurring": true, "vat_applicable": true}'),
('${organizationId}', 'gl_account', '4330', 'Gift Card Breakage', 'HERA.FIN.GL.UAE.SALON.REV.BREAKAGE.V1',
 '{"account_type": "revenue", "non_operating": true}');

-- 4900-4999: Revenue Adjustments
INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, smart_code, metadata) VALUES
('${organizationId}', 'gl_account', '4910', 'Service Discounts', 'HERA.FIN.GL.UAE.SALON.REV.DISCOUNT.V1',
 '{"account_type": "revenue", "is_contra": true}'),
('${organizationId}', 'gl_account', '4920', 'Service Refunds', 'HERA.FIN.GL.UAE.SALON.REV.REFUND.V1',
 '{"account_type": "revenue", "is_contra": true}'),
('${organizationId}', 'gl_account', '4930', 'Complimentary Services', 'HERA.FIN.GL.UAE.SALON.REV.COMP.V1',
 '{"account_type": "revenue", "is_contra": true}');

-- ============================================================================
-- 5000-5999: COST OF SALES
-- ============================================================================

-- 5100-5199: Direct Service Costs
INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, smart_code, metadata) VALUES
('${organizationId}', 'gl_account', '5110', 'Professional Products Used', 'HERA.FIN.GL.UAE.SALON.COGS.PRODUCTS.V1',
 '{"account_type": "expense", "expense_type": "cogs", "direct_cost": true}'),
('${organizationId}', 'gl_account', '5120', 'Consumable Supplies Used', 'HERA.FIN.GL.UAE.SALON.COGS.SUPPLIES.V1',
 '{"account_type": "expense", "expense_type": "cogs", "direct_cost": true}'),
('${organizationId}', 'gl_account', '5130', 'Stylist Commission', 'HERA.FIN.GL.UAE.SALON.COGS.COMMISSION.V1',
 '{"account_type": "expense", "expense_type": "cogs", "commission": true}'),
('${organizationId}', 'gl_account', '5140', 'Contract Service Costs', 'HERA.FIN.GL.UAE.SALON.COGS.CONTRACT.V1',
 '{"account_type": "expense", "expense_type": "cogs", "contractor": true}');

-- 5200-5299: Product COGS
INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, smart_code, metadata) VALUES
('${organizationId}', 'gl_account', '5210', 'Retail Product COGS', 'HERA.FIN.GL.UAE.SALON.COGS.RETAIL.V1',
 '{"account_type": "expense", "expense_type": "cogs", "inventory_related": true}'),
('${organizationId}', 'gl_account', '5220', 'Professional Product COGS', 'HERA.FIN.GL.UAE.SALON.COGS.PROFESSIONAL.V1',
 '{"account_type": "expense", "expense_type": "cogs", "inventory_related": true}');

-- ============================================================================
-- 6000-6999: OPERATING EXPENSES
-- ============================================================================

-- 6100-6199: Staff Costs (Non-Commission)
INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, smart_code, metadata) VALUES
('${organizationId}', 'gl_account', '6110', 'Staff Salaries - Admin', 'HERA.FIN.GL.UAE.SALON.EXP.SALARY.ADMIN.V1',
 '{"account_type": "expense", "expense_type": "operating", "payroll": true}'),
('${organizationId}', 'gl_account', '6120', 'Staff Salaries - Reception', 'HERA.FIN.GL.UAE.SALON.EXP.SALARY.RECEPTION.V1',
 '{"account_type": "expense", "expense_type": "operating", "payroll": true}'),
('${organizationId}', 'gl_account', '6130', 'Staff Benefits', 'HERA.FIN.GL.UAE.SALON.EXP.BENEFITS.V1',
 '{"account_type": "expense", "expense_type": "operating", "payroll": true}'),
('${organizationId}', 'gl_account', '6140', 'Staff Training', 'HERA.FIN.GL.UAE.SALON.EXP.TRAINING.V1',
 '{"account_type": "expense", "expense_type": "operating"}'),
('${organizationId}', 'gl_account', '6150', 'Gratuity Expense', 'HERA.FIN.GL.UAE.SALON.EXP.GRATUITY.V1',
 '{"account_type": "expense", "expense_type": "operating", "payroll": true}');

-- 6200-6299: Occupancy Costs
INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, smart_code, metadata) VALUES
('${organizationId}', 'gl_account', '6210', 'Rent Expense', 'HERA.FIN.GL.UAE.SALON.EXP.RENT.V1',
 '{"account_type": "expense", "expense_type": "operating", "fixed_cost": true}'),
('${organizationId}', 'gl_account', '6220', 'Utilities - DEWA', 'HERA.FIN.GL.UAE.SALON.EXP.UTILITIES.V1',
 '{"account_type": "expense", "expense_type": "operating"}'),
('${organizationId}', 'gl_account', '6230', 'Internet & Phone', 'HERA.FIN.GL.UAE.SALON.EXP.TELECOM.V1',
 '{"account_type": "expense", "expense_type": "operating"}'),
('${organizationId}', 'gl_account', '6240', 'Maintenance & Repairs', 'HERA.FIN.GL.UAE.SALON.EXP.MAINTENANCE.V1',
 '{"account_type": "expense", "expense_type": "operating"}'),
('${organizationId}', 'gl_account', '6250', 'Security Services', 'HERA.FIN.GL.UAE.SALON.EXP.SECURITY.V1',
 '{"account_type": "expense", "expense_type": "operating"}');

-- 6300-6399: Marketing & Advertising
INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, smart_code, metadata) VALUES
('${organizationId}', 'gl_account', '6310', 'Digital Marketing', 'HERA.FIN.GL.UAE.SALON.EXP.MARKETING.DIGITAL.V1',
 '{"account_type": "expense", "expense_type": "operating"}'),
('${organizationId}', 'gl_account', '6320', 'Social Media Advertising', 'HERA.FIN.GL.UAE.SALON.EXP.MARKETING.SOCIAL.V1',
 '{"account_type": "expense", "expense_type": "operating"}'),
('${organizationId}', 'gl_account', '6330', 'Loyalty Program Costs', 'HERA.FIN.GL.UAE.SALON.EXP.LOYALTY.V1',
 '{"account_type": "expense", "expense_type": "operating"}'),
('${organizationId}', 'gl_account', '6340', 'Promotional Materials', 'HERA.FIN.GL.UAE.SALON.EXP.PROMO.V1',
 '{"account_type": "expense", "expense_type": "operating"}');

-- 6400-6499: Administrative Expenses
INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, smart_code, metadata) VALUES
('${organizationId}', 'gl_account', '6410', 'Office Supplies', 'HERA.FIN.GL.UAE.SALON.EXP.OFFICE.V1',
 '{"account_type": "expense", "expense_type": "operating"}'),
('${organizationId}', 'gl_account', '6420', 'Professional Fees', 'HERA.FIN.GL.UAE.SALON.EXP.PROFESSIONAL.V1',
 '{"account_type": "expense", "expense_type": "operating"}'),
('${organizationId}', 'gl_account', '6430', 'Software Subscriptions', 'HERA.FIN.GL.UAE.SALON.EXP.SOFTWARE.V1',
 '{"account_type": "expense", "expense_type": "operating"}'),
('${organizationId}', 'gl_account', '6440', 'Bank Charges', 'HERA.FIN.GL.UAE.SALON.EXP.BANK.V1',
 '{"account_type": "expense", "expense_type": "operating"}'),
('${organizationId}', 'gl_account', '6450', 'Credit Card Processing Fees', 'HERA.FIN.GL.UAE.SALON.EXP.CCFEES.V1',
 '{"account_type": "expense", "expense_type": "operating"}'),
('${organizationId}', 'gl_account', '6460', 'Insurance Expense', 'HERA.FIN.GL.UAE.SALON.EXP.INSURANCE.V1',
 '{"account_type": "expense", "expense_type": "operating"}'),
('${organizationId}', 'gl_account', '6470', 'License & Permit Fees', 'HERA.FIN.GL.UAE.SALON.EXP.LICENSE.V1',
 '{"account_type": "expense", "expense_type": "operating"}');

-- 6500-6599: Equipment & Depreciation
INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, smart_code, metadata) VALUES
('${organizationId}', 'gl_account', '6510', 'Depreciation - Salon Equipment', 'HERA.FIN.GL.UAE.SALON.EXP.DEP.EQUIPMENT.V1',
 '{"account_type": "expense", "expense_type": "operating", "non_cash": true}'),
('${organizationId}', 'gl_account', '6520', 'Depreciation - Furniture', 'HERA.FIN.GL.UAE.SALON.EXP.DEP.FURNITURE.V1',
 '{"account_type": "expense", "expense_type": "operating", "non_cash": true}'),
('${organizationId}', 'gl_account', '6530', 'Equipment Rental', 'HERA.FIN.GL.UAE.SALON.EXP.RENTAL.V1',
 '{"account_type": "expense", "expense_type": "operating"}'),
('${organizationId}', 'gl_account', '6540', 'Small Equipment Purchases', 'HERA.FIN.GL.UAE.SALON.EXP.SMALL.EQUIP.V1',
 '{"account_type": "expense", "expense_type": "operating"}');

-- ============================================================================
-- 8000-8999: OTHER INCOME & EXPENSES
-- ============================================================================

INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, smart_code, metadata) VALUES
('${organizationId}', 'gl_account', '8110', 'Interest Income', 'HERA.FIN.GL.UAE.SALON.OTHER.INTEREST.V1',
 '{"account_type": "revenue", "non_operating": true}'),
('${organizationId}', 'gl_account', '8120', 'Miscellaneous Income', 'HERA.FIN.GL.UAE.SALON.OTHER.MISC.V1',
 '{"account_type": "revenue", "non_operating": true}'),
('${organizationId}', 'gl_account', '8510', 'Interest Expense', 'HERA.FIN.GL.UAE.SALON.OTHER.INTEREST.EXP.V1',
 '{"account_type": "expense", "non_operating": true}'),
('${organizationId}', 'gl_account', '8520', 'Foreign Exchange Loss', 'HERA.FIN.GL.UAE.SALON.OTHER.FOREX.V1',
 '{"account_type": "expense", "non_operating": true}');

-- ============================================================================
-- 9000-9999: SYSTEM & CONTROL ACCOUNTS
-- ============================================================================

INSERT INTO core_entities (organization_id, entity_type, entity_code, entity_name, smart_code, metadata) VALUES
('${organizationId}', 'gl_account', '9999', 'Suspense Account', 'HERA.FIN.GL.UAE.SALON.SYSTEM.SUSPENSE.V1',
 '{"account_type": "system", "control_account": true}');

-- ============================================================================
-- IFRS Compliance Metadata
-- ============================================================================

-- Add IFRS mapping to all accounts
UPDATE core_entities 
SET metadata = jsonb_set(
  metadata, 
  '{ifrs_mapping}',
  '{
    "statement_type": "SFP",
    "classification": "current",
    "measurement_basis": "historical_cost",
    "disclosure_required": true
  }'::jsonb
)
WHERE entity_type = 'gl_account' 
AND entity_code BETWEEN '1000' AND '2999';

UPDATE core_entities 
SET metadata = jsonb_set(
  metadata, 
  '{ifrs_mapping}',
  '{
    "statement_type": "SPL",
    "nature_of_expense": "by_nature",
    "disclosure_required": true
  }'::jsonb
)
WHERE entity_type = 'gl_account' 
AND entity_code BETWEEN '4000' AND '8999';

-- ============================================================================
-- Create Account Hierarchies
-- ============================================================================

-- Create parent-child relationships for account groupings
INSERT INTO core_relationships (organization_id, from_entity_id, to_entity_id, relationship_type, smart_code, metadata)
SELECT 
  '${organizationId}',
  parent.id,
  child.id,
  'parent_account',
  'HERA.FIN.GL.RELATIONSHIP.HIERARCHY.V1',
  '{"hierarchy_level": 2}'
FROM core_entities parent
CROSS JOIN core_entities child
WHERE parent.organization_id = '${organizationId}'
  AND child.organization_id = '${organizationId}'
  AND parent.entity_type = 'gl_account'
  AND child.entity_type = 'gl_account'
  AND (
    (parent.entity_code = '1000' AND child.entity_code BETWEEN '1100' AND '1999') OR
    (parent.entity_code = '2000' AND child.entity_code BETWEEN '2100' AND '2999') OR
    (parent.entity_code = '3000' AND child.entity_code BETWEEN '3100' AND '3999') OR
    (parent.entity_code = '4000' AND child.entity_code BETWEEN '4100' AND '4999') OR
    (parent.entity_code = '5000' AND child.entity_code BETWEEN '5100' AND '5999') OR
    (parent.entity_code = '6000' AND child.entity_code BETWEEN '6100' AND '6999')
  );

-- ============================================================================
-- Auto-Journal Rules for Salon Operations
-- ============================================================================

-- Service Sale Auto-Journal Rule
INSERT INTO core_dynamic_data (organization_id, entity_id, field_name, field_value_text, smart_code)
SELECT 
  '${organizationId}',
  id,
  'auto_journal_rule',
  'service_sale',
  'HERA.FIN.AUTO.JOURNAL.RULE.V1'
FROM core_entities
WHERE organization_id = '${organizationId}'
  AND entity_code IN ('4110', '4120', '4130', '4140', '4150', '4160', '4170');

-- Commission Auto-Journal Rule
INSERT INTO core_dynamic_data (organization_id, entity_id, field_name, field_value_text, smart_code)
SELECT 
  '${organizationId}',
  id,
  'auto_journal_rule',
  'commission_accrual',
  'HERA.FIN.AUTO.JOURNAL.RULE.V1'
FROM core_entities
WHERE organization_id = '${organizationId}'
  AND entity_code = '5130';

COMMIT;

-- ============================================================================
-- Summary Report
-- ============================================================================

SELECT 
  'Salon UAE COA Generation Complete' as status,
  COUNT(*) as total_accounts,
  SUM(CASE WHEN entity_code BETWEEN '1000' AND '1999' THEN 1 ELSE 0 END) as asset_accounts,
  SUM(CASE WHEN entity_code BETWEEN '2000' AND '2999' THEN 1 ELSE 0 END) as liability_accounts,
  SUM(CASE WHEN entity_code BETWEEN '3000' AND '3999' THEN 1 ELSE 0 END) as equity_accounts,
  SUM(CASE WHEN entity_code BETWEEN '4000' AND '4999' THEN 1 ELSE 0 END) as revenue_accounts,
  SUM(CASE WHEN entity_code BETWEEN '5000' AND '5999' THEN 1 ELSE 0 END) as cogs_accounts,
  SUM(CASE WHEN entity_code BETWEEN '6000' AND '6999' THEN 1 ELSE 0 END) as expense_accounts
FROM core_entities
WHERE organization_id = '${organizationId}'
  AND entity_type = 'gl_account';

-- List key salon-specific accounts
SELECT 
  entity_code,
  entity_name,
  smart_code
FROM core_entities
WHERE organization_id = '${organizationId}'
  AND entity_type = 'gl_account'
  AND (
    entity_code IN ('4110', '4120', '4130', '2150', '2160', '5130', '2220', '4310', '1251', '2251')
  )
ORDER BY entity_code;