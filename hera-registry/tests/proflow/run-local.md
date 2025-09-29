# Run ProFlow Smoke Tests (local)

## Pre-reqs
- Load `cli/index.json` → apply `guardrails/hera_guardrails.json`.
- Load Finance DNA: `dna/finance/rulesets/proflow.v1.json`.

## Commands (example)
1) `cli run-test tests/proflow/time-entry.smoke.json`
2) `cli run-test tests/proflow/retainer-and-invoice.smoke.json`

## What the runner should do
- Insert a `universal_transactions` row from `given` (org_id, smart_code, type, currency).
- Derive `universal_transaction_lines` via Finance DNA rules.
- Validate:
  - **Guardrails**: org filter present; smart_code matches pattern; no schema drift; GL balanced per currency.  ✔ 
  - **Finance DNA**: lines match `lines_match` and totals; VAT flags applied. ✔ 

## Optional SQL spot checks
```sql
-- 1) Smart code present and valid
select count(*)=0 as ok
from universal_transactions
where smart_code !~ '^HERA\\.[A-Z0-9]{3,15}(\\.[A-Z0-9_]{2,30}){3,8}\\.v[0-9]+$';

-- 2) Balanced by currency
select transaction_id, transaction_currency_code,
       sum(case when dr_cr='DEBIT' then line_amount else 0 end) as debits,
       sum(case when dr_cr='CREDIT' then line_amount else 0 end) as credits
from universal_transaction_lines
group by transaction_id, transaction_currency_code
having abs(sum(case when dr_cr='DEBIT' then line_amount else 0 end) -
           sum(case when dr_cr='CREDIT' then line_amount else 0 end)) < 0.0001;
