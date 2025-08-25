# HERA – Global Deployment (Any Country, Any Vertical)

**Non-negotiables**
- Only 6 universal tables; zero new business tables/columns.
- Every write filtered by `organization_id`; every row has a `smart_code`.
- Posting = 1 header in `universal_transactions` + balanced lines in `universal_transaction_lines`.

**Deliverables (7 days)**
1) Posting Schema DSL (industry-agnostic) + JSON Schema + validators.
2) Country Pack model (tax_profile entity + rates in core_dynamic_data) and binding.
3) Edge Functions: `ledger.simulate`, `ledger.post` (MCP-compatible).
4) Seeds: global POS schema + generic tax profile + bindings.
5) Tests: balance, dimension requirements, tax rounding, idempotency, settlements.
6) Docs: runbook + UAT pack.

**Success Criteria**
- Balanced journals per currency; required dimensions enforced.
- No schema edits; all variability in `business_rules` + `core_dynamic_data`.
- Works for *any* jurisdiction by swapping Country Pack; works for *any* vertical by swapping dimensions/splits.