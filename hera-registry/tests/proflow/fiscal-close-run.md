# Run ProFlow Fiscal Close Smoke

## Pre-reqs
- Load `cli/index.json`.
- Ensure Fiscal DNA pack is available (e.g., `dna/fiscal/close_playbooks/proflow-close-standard.v1.json`) and loaded.
- Fiscal config & periods exist as `core_entities` rows:
  - `entity_type='fiscal_configuration'`
  - `entity_type='fiscal_period'` (12 periods for the year)
- Guardrails active (org isolation, smart codes). ✅

## Steps
1) Seed fiscal configuration + 12 monthly periods for 2025 if not present.
2) Ensure there is P&L activity in 2025 (revenue/expense postings).
3) Execute the close runner for `2025-12-31` with smart code `HERA.ACCOUNTING.FISCAL.CLOSE_RUN.v1`.
4) Assert expectations in `fiscal-close.smoke.json`.

## What the runner should verify
- A **Closing Journal Entry** was created in `universal_transactions` with smart code `HERA.ACCOUNTING.FISCAL.CLOSE_JE.v1`, and lines in `universal_transaction_lines` are **balanced by currency**.
- The 2025-12 period in `core_entities (entity_type='fiscal_period')` is now `status='closed'`.
- All P&L accounts have zero opening balances in 2026-01.
- A reversible flag/metadata allows undoing the close.

## Optional SQL spot checks

-- 1) Fetch fiscal config
SELECT * FROM core_entities
WHERE entity_type = 'fiscal_configuration'
  AND organization_id = '00000000-0000-0000-0000-00000000ABCD';

-- 2) Period status switched to 'closed'
SELECT entity_name, entity_code, status
FROM core_entities
WHERE entity_type = 'fiscal_period'
  AND organization_id = '00000000-0000-0000-0000-00000000ABCD'
  AND entity_code = '2025-12';

-- 3) Closing JE exists with correct smart_code
SELECT ut.id, ut.transaction_type, ut.smart_code, ut.transaction_currency_code
FROM universal_transactions ut
WHERE ut.organization_id = '00000000-0000-0000-0000-00000000ABCD'
  AND ut.smart_code = 'HERA.ACCOUNTING.FISCAL.CLOSE_JE.v1';

-- 4) Balanced by currency
SELECT ut.id, ut.transaction_currency_code,
       ABS(SUM(CASE WHEN utl.line_type='GL.LINE' AND utl.line_data->>'dr_cr'='DEBIT' THEN utl.line_amount ELSE 0 END)
         - SUM(CASE WHEN utl.line_type='GL.LINE' AND utl.line_data->>'dr_cr'='CREDIT' THEN utl.line_amount ELSE 0 END)) < 0.0001 AS balanced
FROM universal_transactions ut
JOIN universal_transaction_lines utl ON utl.transaction_id = ut.id
WHERE ut.smart_code = 'HERA.ACCOUNTING.FISCAL.CLOSE_JE.v1'
  AND ut.organization_id = '00000000-0000-0000-0000-00000000ABCD'
GROUP BY ut.id, ut.transaction_currency_code;

-- 5) P&L zeroed in next period (illustrative check)
-- (Implementation detail may vary based on your ledger views.)
