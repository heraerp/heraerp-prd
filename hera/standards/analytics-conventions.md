# HERA Analytics Conventions (Cross‑Industry)

Purpose: define portable conventions for entities, dynamic data, relationships, transactions, and line metadata so common reports and MCP reads work out‑of‑the‑box across all bundles while respecting the Sacred Six.

Version: v1.0 (contracts are additive; no schema drift)

---

## 1) Operating Principles

- Sacred Six only. No new tables; use `core_dynamic_data` for custom attributes.
- Smart Codes on entities/relationships/transactions/lines.
- Strict org scope in all reads/writes.
- Reports and MCP reads must be SELECT‑only, parameterized, deterministic, and auditable.

---

## 2) Canonical Entity Types (ENTITY_TYPE)

Use these values in `core_entities.entity_type` (upper snake). Suggested base attributes live in `core_dynamic_data` (see §3).

- CUSTOMER — end customer or party
- ITEM — SKU (finished goods/materials)
- SERVICE — service SKU (e.g., haircut)
- STAFF — worker performing services (employee/contractor)
- LOCATION — physical site (store/branch/warehouse)
- SUPPLIER — vendor
- TAX_CODE — jurisdiction/tax class (optional for reports)

Notes
- Categories may be first‑class entities (ENTITY_TYPE=CATEGORY) or dynamic fields on ITEM/SERVICE.
- Child industry bundles can extend with additional entity types; keep base names stable.

---

## 3) Dynamic Data Conventions (core_dynamic_data)

Key/value fields per entity type (minimal portable set). Keys are lower_snake.

- ITEM
  - sku: text
  - category: text
  - brand: text
  - barcode: text
  - cost_price: number
  - uom: text (selling unit)
- SERVICE
  - service_category: text
  - default_duration_min: number
  - commission_rate: number (default)
- STAFF
  - role: text (STYLIST, TECHNICIAN, …)
  - commission_rate: number (override)
  - location_id: uuid (references LOCATION entity.id)
- CUSTOMER
  - segment: text
  - email: text
  - phone: text
  - loyalty_id: text
- LOCATION
  - location_code: text
  - timezone: text

---

## 4) Relationship Types (core_relationships.relationship_type)

- BELONGS_TO — ITEM → CATEGORY or SERVICE → CATEGORY
- LOCATED_AT — STAFF → LOCATION; ITEM → LOCATION (optional stocking)
- SUPPLIES — SUPPLIER → ITEM
- REPORTS_TO — STAFF → STAFF (hierarchy)

Conventions
- Use `is_active`, `effective_from`, `effective_to` for lifecycle.
- Prefer relationships over status columns for workflow where feasible.

---

## 5) Transaction & Line Metadata (universal_transactions/_lines)

Header (universal_transactions)
- reference_entity_id: uuid (customer/counterparty)
- due_date: timestamptz (for AR/AP aging)
- metadata:
  - channel: text (POS|ONLINE|MANUAL|API)
  - source_order_number: text
  - outstanding_amount: number (optional; allows partial payments in AR aging)

Line (universal_transaction_lines)
- For service lines
  - line_type: 'service'
  - metadata.worker_id: uuid (core_entities.id for STAFF)
  - metadata.commission_rate: number (optional override)
- For inventory lines
  - line_type: 'item'
  - quantity: number (positive)
  - metadata.movement: 'IN'|'OUT'
  - unit_of_measure: text (e.g., 'EA')

Rationale
- Enables stylist revenue, inventory on‑hand, and top‑items without joins beyond the Six.

---

## 6) MCP Reads (Option A: Two Tools)

- hera.select — lists/details with filters and embeds
  - Filters grammar per column: eq, in, like (ILIKE), gte, lte, between, is_null
  - Embeds:
    - lines_for_transactions: attach `rows[i].lines`
    - entity_dynamic_data: attach `rows[i].dynamic_data`
  - Server injects `organization_id` and enforces whitelists; LIMIT ≤ 1000; 3s timeout.
- hera.report.run — joins/aggregations/time series
  - Pre‑registered report templates keyed by smart_code; SELECT‑only; parameterized; org‑scoped.

See: `mcp-server/mcp-data-tools.js` and `mcp-server/MCP-TOOLS-REFERENCE.md`.

---

## 7) Standard Report Catalog (Seed)

These report codes are portable across industries when conventions in §3–§5 are followed.

- HERA.REPORT.SALES.DAILY.v1(from,to)
  - Sum `total_amount` by day, currency from posted transactions
- HERA.REPORT.SALES.REVENUE_BY_STYLIST.v1(from,to)
  - Sum service `line_amount` by `lines.metadata.worker_id`
- HERA.REPORT.AR.AGING.v1(as_of)
  - Buckets via `due_date` and `metadata.outstanding_amount` fallback to `total_amount`
- HERA.REPORT.INVENTORY.ON_HAND.v1(as_of)
  - IN minus OUT by item using `metadata.movement` and `quantity`
- HERA.REPORT.SALES.TOP_ITEMS.v1(from,to,limit)
  - Rank items by `line_amount` and quantity

All SQL lives in `mcp-server/mcp-data-tools.js` and must remain SELECT‑only with `organization_id = $1` guard.

---

## 8) Example Payloads

Service sale with stylist attribution
```json
{
  "header": {
    "organization_id": "<ORG>",
    "transaction_type": "pos_order",
    "transaction_number": "POS-1001",
    "transaction_date": "2025-09-10T10:15:00Z",
    "currency_code": "USD",
    "total_amount": 120,
    "status": "posted",
    "smart_code": "HERA.RETAIL.POS.TXN.SALE.v1",
    "reference_entity_id": "<CUSTOMER_ID>",
    "metadata": { "channel": "POS" }
  },
  "lines": [
    {
      "organization_id": "<ORG>",
      "transaction_id": "<TX_ID>",
      "line_number": 1,
      "line_type": "service",
      "line_entity_id": "<SERVICE_ID>",
      "quantity": 1,
      "unit_of_measure": "EA",
      "unit_price": 120,
      "line_amount": 120,
      "metadata": { "worker_id": "<STAFF_ID>" }
    }
  ]
}
```

Inventory receipt (IN)
```json
{
  "line_type": "item",
  "line_entity_id": "<ITEM_ID>",
  "quantity": 50,
  "unit_of_measure": "EA",
  "unit_price": 5,
  "line_amount": 250,
  "metadata": { "movement": "IN" }
}
```

---

## 9) Versioning & Compliance

- This document is versioned; changes are additive and backward‑compatible.
- CI should validate:
  - MCP tools registered and responding
  - Report SQL is SELECT‑only and org‑scoped
  - hera.select respects whitelists and limits
  - Required metadata keys exist for seeded reports in UAT datasets

---

## 10) FAQ

- Q: Can I add more entity types/fields?
  - Yes. Keep base keys stable; add new keys under dynamic_data.
- Q: I need JOINs for a custom report.
  - Implement as `hera.report.run` template with a new smart_code; keep it SELECT‑only.
- Q: How do I expose staff/service mapping differently?
  - You can also use a BELONGS_TO relationship; provide a parallel report variant if needed.

---

Maintainer: HERA Platform Team

