# Furniture Tender Management — UAT Plan (End-to-End)

This plan follows your Tender Management design (Kerala Forest Department) and maps UI flows to Sacred Six writes with Smart Codes. Use this to verify in the running system and DB.

## Prerequisites
- Env: set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL`, and `NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID`.
- Seed: run `npm run db:migrate` then seed tender demo data if needed (see `database/seed/tender-demo-data.sql`).
- Start app: `npm run dev` and authenticate into the furniture org.

## Test Scenarios (Happy Path)
1) Watchlist → Analyze
- Page: `/furniture/tender/dashboard` → All Tenders tab.
- Action: ensure tender codes like `KFD/2025/WOOD/001` appear.
- Verify DB: `core_entities` has tender header rows; `core_dynamic_data` contains fields: department, closing_date, estimated_value, emd_amount, lot_count.
- Smart Codes: `HERA.FURNITURE.TENDER.NOTICE.ACTIVE.v1` (entity), optional `HERA.FURNITURE.TENDER.WATCH.ANALYZE.v1` if analysis logged.

2) Create New Tender (Watchlist Add)
- Page: `/furniture/tender/new`.
- Input: code, title, department, closing date, estimated value → EMD auto-calculates 2%.
- Expected: success toast and redirect to tender detail (if DB configured). In mock/no-DB, expect error toast explaining Supabase not configured.
- Verify DB (on success):
  - `core_entities`: `HERA.FURNITURE.TENDER.NOTICE.v1` with smart code `...NOTICE.ACTIVE.v1`.
  - `core_dynamic_data`: fields for department, closing_date, estimated_value, emd_amount, description/location.
  - `core_relationships`: `has_status` with `HERA.FURNITURE.TENDER.STATUS.ACTIVE.v1`.
  - `universal_transactions`: `HERA.FURNITURE.TENDER.DISCOVERED.v1` (metadata includes code/title/value/closing_date).

3) Bid Preparation → Submit Bid
- Page: `/furniture/tender/[code]/bid/new` (from tender detail CTA).
- Action: enter amount, strategy, costs; upload doc placeholders; submit.
- Verify DB:
  - `universal_transactions`: `HERA.FURNITURE.TENDER.BID.SUBMITTED.v1` header with metadata: tender_code, margin_percentage, transport_cost, handling_cost.
  - Lines: at least one with smart code `HERA.FURNITURE.TENDER.BID.AMOUNT.v1`.
- UI: `/furniture/tender/bids` shows bid with status `submitted` and correct tender_code link.

4) EMD Payment
- Page: Tender detail → EMD action (or Finance center when available).
- Verify DB:
  - `universal_transactions`: `HERA.FURNITURE.FIN.EMD.PAID.v1` with `payment_method`, `reference_number`, `bank_name`.
  - Lines: `HERA.FURNITURE.FIN.EMD.AMOUNT.v1` with metadata `{ gl_account: '1510000', cost_center: 'TENDER_MGMT' }`.

5) Award → Transit Pass (TP)
- Seed demo includes awards and TP examples.
- Verify DB:
  - `universal_transactions`: `HERA.FURNITURE.TENDER.AWARD.NOTIFY.v1` (award_date, contract_value).
  - `core_entities`: Transit pass entity `HERA.FURNITURE.TENDER.TRANSIT_PASS.v1` and `HERA.FURNITURE.TENDER.TP.ISSUE.v1` transaction (tp_number, validity).

6) Receipt → Grading
- Verify DB:
  - `universal_transactions`: `HERA.FURNITURE.TENDER.INV.RECEIVE.v1` with lines for lots and received quantities/grades.
  - Follow-up `HERA.FURNITURE.TENDER.INV.GRADE.v1` when grading is recorded.

7) Settlement → Closeout
- Verify DB:
  - `HERA.FURNITURE.TENDER.FIN.SETTLE.v1` (cost components in metadata/lines).
  - `HERA.FURNITURE.TENDER.CLOSE.COMPLETE.v1` with `actual_margin`, `pnl_amount`.

## Guardrails to Observe (Selected)
- GR002: EMD must be posted before `...BID.SUBMIT.v1` unless waiver.
- GR004: No TP request before award notification.
- GR007: Receipt volume cannot exceed awarded volume by >2%.
- GR012: Settlement requires grading completion.

## Known Gaps/Notes
- Codes with slashes (e.g., `KFD/2025/WOOD/001`) appear in links; the `[code]` route may not resolve if the code is not URL-safe. Consider encoding or using an ID route.
- `universalApi` mock mode: without Supabase env, write operations will fail; UI shows clear error toasts.
- `tender-service` currently relies on `universalApi.setDynamicField`, which is not implemented in `src/lib/universal-api.ts`. Writes will fail unless the SDK wrapper is used or the method is added.

## How to Run Automation (Smoke)
- `npm run test:e2e:smoke` runs the basic UI checks added for dashboard/documents/new-form.
- For full write flows, ensure DB is configured and discuss enabling additional e2e that post records.

