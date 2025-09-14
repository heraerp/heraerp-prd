# HERA × Claude CLI — Enterprise Build Model & Playbook

> **Goal:** Provide an enterprise‑grade, scalable model and a clear, teachable playbook so **Claude CLI** can *generate, validate, and apply* HERA YAML bundles (orchestrator + child contracts) safely and repeatably across industries.

---

## 1) Core Operating Principles (HERA)

* **Sacred Six Tables** only; zero schema drift. All business attributes via `core_dynamic_data` and JSON rules.
* **Smart Codes everywhere:** `HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.vN` bound to entities, relationships, transactions, and lines.
* **Strict multi‑tenancy:** `organization_id` present on all reads/writes.
* **Finance/Fiscal DNA:** posting rules as data; GL lines must balance per currency; fiscal periodization and closing via procedures.
* **AI‑Native:** `ai_confidence`, `ai_insights` fields populate automatically; decisions recorded.

---

## 2) Universal Contract Model (UCM)

Claude CLI consumes a **Universal Orchestration Contract** that fans out into child contracts. Contracts are YAML and must be **idempotent**, **versioned**, and **guardrail‑aware**.

### 2.1 Contract Types

* **Orchestration**: graph + policies + apply plan.
* **Org Bootstrap**: module activation, fiscal/finance toggles.
* **Entities**: accounts/items/customers/suppliers/tax codes.
* **Dynamic Data**: unlimited custom fields (type‑safe) for any entity.
* **Relationships**: canonical `from_entity_id` → `to_entity_id` links.
* **Finance Integration**: posting rules (events → GL lines).
* **Procedures**: steps that write to `universal_transactions` & `_lines`.
* **Read Models/Queries**: org‑scoped materializations or views.
* **Test Scope & Execution**: scenarios, assertions, and runners.
* **UAT/Defects/Deployment/Support**: lifecycle governance.

### 2.2 Minimal Orchestration Schema

```yaml
orchestration:
  version: 1.x
  context: { industry, modules[], constraints{}, currency, tax_regime, fiscal{} }
  artifacts: [{ name, purpose, type, version }]
  graph: [ "a.yaml -> b.yaml" ]
  policies:
    guardrails: { enforce: [ORG-FILTER-REQUIRED, SMARTCODE-PRESENT, GL-BALANCED, TABLE-ONLY-6] }
  apply_plan:
    steps: [lint_all, dry_run, apply_in_graph_order, verify_checks]
    verify_checks: [org_scope, smart_code_regex, gl_balance, no_schema_drift]
```

### 2.3 Child Contract Snippets (normative keys)

* `org_bootstrap.organization.settings.modules` (activation matrix)
* `entities.*[].smart_code` (must match regex)
* `dynamic_data.fields[]` (typed value union; validation rules)
* `relationships.links[]` (`relationship_type`, `smart_code`)
* `finance_dna.rules[]` (`event`, header/lines mapping, `gl_balance`)
* `procedures.definitions[]` (inputs, steps → table, fields, `smart_code`)

---

## 3) Versioning & Registry

* **Semantic versioning** for every contract: `major.minor.patch`.
* **Registry keys:** `{org}/{project}/{env}/{artifact}@{version}`.
* **Immutability:** applied bundles are immutable; changes create a new version.
* **Provenance:** store source prompt, model, hash, and guardrail report with each artifact.

---

## 4) Build Lifecycle (State Machine)

**States:** `DRAFT → LINTED → DRY_RUN_OK → APPLIED → VERIFIED → RELEASED`
**Transitions gated by:** guardrail lint, dependency DAG, GL balance check, UAT acceptance, and deployment checks.

---

## 5) Claude CLI — Command Surface

### 5.1 Top‑Level Commands

* `hera init` — Scaffold `universal_orchestration.yaml` from requirements.
* `hera gen` — Generate all child contracts from the orchestration context.
* `hera lint` — Guardrail lint on all artifacts.
* `hera plan` — DAG ordering + dry‑run (no writes) with validation.
* `hera apply` — Apply in graph order with org scoping and idempotency.
* `hera verify` — Post‑checks: GL balanced, smart codes, org filters, no schema drift.
* `hera test` — Execute `codex_testing_scope.yaml` and `testing_execution.yaml`.
* `hera uat` — Run UAT scripts, capture outcomes into `defects.yaml`.
* `hera deploy` — Promote verified bundle to target env; emit provenance.
* `hera support` — Open runbooks/dashboards defined in `support.yaml`.

### 5.2 Command Options (common)

* `--org <uuid>` (required for any data‑touching command)
* `--env <dev|staging|prod>`
* `--bundle <path or registry ref>`
* `--strict` (fail on warnings)
* `--diff` (show changes vs last applied)

### 5.3 Command Behaviors (normative)

* All `apply` paths must inject `organization_id=:current_org_id` into queries/writes and reject any unscoped artifacts.
* Any transaction‑producing procedure must **refuse to apply** if GL not balanced per currency.
* DDL outside the Sacred Six must be rejected; suggest routing to `core_dynamic_data`.

---

## 6) Built‑in Validators (Guardrail Adapters)

* **Smart Code Regex** validator (entities/dynamic/relationships/tx/lines).
* **Org Scope** validator for SQL and payload JSON.
* **GL Balance** validator (sum debits == credits per currency).
* **Entity Semantics** validator: if `entity_type=account`, ensure `ledger_type` or smart code “ACCOUNT” segment; hierarchy posting rules.
* **DDL Gate**: block unknown tables; suggest dynamic‑data route.

Each validator returns: `{severity, id, message, autofix?}`; CLI aggregates into a machine‑readable report (`.hera/report.json`).

---

## 7) Prompt Pack ("Teach Claude How to Build")

**System Prompt (core)**

* Role: *HERA Build Orchestrator.*
* Constraints: Sacred Six, smart codes, multi‑tenancy, Finance/Fiscal DNA, idempotency.
* Output: Valid YAML contracts only. No prose inside YAML. Include versions and smart codes. Never introduce new tables.

**Developer Prompt (policy‑aware)**

* When encountering a business attribute that doesn’t fit base columns, *emit* a `dynamic_data` field definition.
* When emitting GL rules, enforce `gl_balance: per_currency` and bind to COA account entities.
* Always provide an `apply_plan` and `graph` within the orchestration.

**User Prompt (requirement intake)**

* Clear business context (industry, modules, constraints, currency, tax, fiscal), plus examples of day‑1 transactions and reports.

**Few‑Shot Templates**

* Provide miniature, validated examples for: POS sale + VAT, AP invoice, monthly fiscal close.

---

## 8) Execution Flow in CLI

1. **`init`** parses requirement → creates orchestration skeleton.
2. **`gen`** produces child contracts; resolves smart codes; references existing COA/tax templates by alias.
3. **`lint`** runs guardrail validators; fails fast on `error`.
4. **`plan`** does a **dry‑run** with org scoping and dependency resolution.
5. **`apply`** writes in graph order; records provenance & hash.
6. **`verify`** runs post‑checks (GL balance, smart code, org scope) and materializes read models.
7. **`test`/`uat`** execute scenarios; `defects.yaml` updated automatically.
8. **`deploy`** promotes bundle; freeze versions; tag release.

---

## 9) Error Handling & Triage

* Structured errors map to categories: `schema_violation`, `smart_code_error`, `gl_imbalance`, `org_scope_missing`, `data_validation`.
* Auto‑actions: suggest smart code fix; route business field to dynamic data; add missing org filter; dump GL diff to help balance.
* All errors are captured in `error_management.yaml` policies and emitted as JSON for dashboards.

---

## 10) Security, Audit, and Provenance

* Every apply includes: `{actor, model, prompts, artifact digests, timestamps, org}`.
* Contracts carry `version` and optional `smart_code_status`.
* Read‑only “views” allowed only via approved helper patterns; no raw new tables.

---

## 11) Extensibility (Plugins)

* **Template sources:** COA, VAT presets, industry posting packs.
* **Runners:** test runners (`codex`), UAT runners, data migration runners.
* **Targets:** Supabase/PG, additional adapters as needed (must keep Sacred Six contract surface intact).

---

## 12) Quickstart (CLI Session Example)

```bash
# 1) Initialize from requirement
hera init --from "Industry=Bakery (UK); Modules=CRM,POS,Finance,Procurement; No branches; GBP; UK VAT; Fiscal Jan-Dec"

# 2) Generate child contracts
hera gen --bundle ./bakery_uk

# 3) Lint and plan
hera lint --bundle ./bakery_uk --strict
hera plan --bundle ./bakery_uk --org 7e5d... --env dev --diff

# 4) Apply and verify
hera apply --bundle ./bakery_uk --org 7e5d... --env dev
hera verify --bundle ./bakery_uk --org 7e5d...

# 5) Run tests and UAT
hera test --bundle ./bakery_uk --org 7e5d...
hera uat  --bundle ./bakery_uk --org 7e5d...

# 6) Deploy
hera deploy --bundle ./bakery_uk --env staging
```

---

## 13) Teaching Checklist for Claude CLI

* ✅ Knows the contract schemas and their required keys.
* ✅ Enforces guardrails during generation (never emit disallowed DDL or missing org scope).
* ✅ Emits smart codes in every applicable artifact;
  validates the regex before output.
* ✅ Ensures GL balance in any finance procedure or mapping.
* ✅ Produces a DAG and idempotent apply plan.
* ✅ Emits machine‑readable reports for CI and dashboards.

---

## 14) What to Provide to Claude at Runtime

* Requirement brief
* Available templates (COA, VAT, industry rule packs)
* Current `org` and `env`
* Previous bundle versions (for diffs)
* Guardrail adapter stubs (validators list)

---

**This playbook is the single source of truth for Claude CLI behavior when building HERA apps.**

---

## 15) Locked Decisions (Normative Addendum)

This addendum locks all previously open clarifications into normative behavior and schemas.

### 15.1 Canonical Contract Schemas (Zod/TS)

Define these in `mcp-server/src/schemas/*` and version them.

```ts
// orchestration.ts
export const Orchestration = z.object({
  smart_code: z.string(),                    // HERA.SYSTEM.PLAYBOOK.{NAME}.v1
  contracts: z.array(z.string()),            // relative paths to child YAMLs
  graph: z.array(z.tuple([z.string(), z.string()])).optional(), // ["a.yaml","b.yaml"] => a→b
  vars: z.record(z.any()).default({}),
})

// entities.ts
export const Entities = z.object({
  smart_code: z.string(),                    // HERA.SYSTEM.ENTITY_CATALOG.{NAME}.v1
  items: z.array(z.object({
    slug: z.string(),                        // lower_snake
    entity_type: z.enum(['ENTITY','ENTITY_TYPE','TRANSACTION_TYPE','LINE_TYPE','REL_TYPE']),
    name: z.string(),
    metadata: z.record(z.any()).default({}), // synonyms, lifecycle, etc.
    business_rules: z.record(z.any()).default({}),
  })),
})

// dynamic_data.ts
export const DynamicData = z.object({
  smart_code: z.string(),
  rows: z.array(z.object({
    entity_slug: z.string(),
    key_slug: z.string(),
    value: z.any(),
    value_type: z.enum(['text','number','boolean','date','json']),
    validation_code: z.string().optional(),
  })),
})

// relationships.ts
export const Relationships = z.object({
  smart_code: z.string(),
  rows: z.array(z.object({
    from_slug: z.string(),
    to_slug: z.string(),
    relationship_type: z.string(),           // slug of REL_TYPE
    relationship_data: z.record(z.any()).default({}),
  })),
})

// procedures.ts
export const Procedure = z.object({
  smart_code: z.string(),                    // HERA.{INDUSTRY}.{MODULE}.{PROC}.vN
  preconditions: z.array(z.string()),
  inputs: z.object({ required: z.array(z.any()), optional: z.array(z.any()).default([]) }),
  outputs: z.object({ entities_created: z.array(z.string()), transactions_emitted: z.array(z.string()) }),
  happy_path: z.array(z.object({ step: z.string() })),
  errors: z.array(z.object({ code: z.string(), when: z.string() })),
  checks: z.array(z.object({ description: z.string() })),
})
```

### 15.2 Smart Code Spec (Regex + Semantics)

- Pattern: `HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}[.{EXTRA}…].v{N}`
- Segments 2..6+: `[A–Z0–9_]`, uppercase, length 2–30
- Version: `v` + non‑negative integer (`v0` allowed; no other leading zeros)
- Postgres CHECK (case‑sensitive):

```sql
CHECK (
  smart_code ~ '^(HERA)\.[A-Z0-9_]{2,30}(?:\.[A-Z0-9_]{2,30}){3,8}\.v(0|[1-9][0-9]*)$'
)
```

- Parser semantics: 1=HERA, 2=INDUSTRY, 3=MODULE, 4=TYPE, 5+=SUBTYPES, last=VERSION
- Uniqueness: within an org, smart_code is unique per entity; across artifacts `(entity_type, slug)` must be unique. Enforce via lint.

### 15.3 Graph Semantics (Authoritative DAG)

- Order is inferred as a DAG from:
  - Implicit precedence: `entities → dynamic_data → relationships → procedures → read_models → tests/uat → deploy/support`.
  - References: if a file references a slug/type from another file, add an edge.
  - Orchestration `graph` hints are additional edges.
- CLI detects cycles and fails at `plan`, emitting a human‑readable graph.

### 15.4 Universal Transactions/Lines — Production Shape

Field mapping (normative → production)

- Txn type: transaction_type_id (FK) → transaction_type (slug/text)
- Business time: occurred_at → transaction_date
- Recorded time: recorded_at → use created_at/updated_at in DB
- Header total: amount → total_amount
- Currency: currency_code → currency_code
- Status: status_code → status (draft,pending,approved,posted,void,failed)
- Line position: position → line_number
- Line type: line_type_id (FK) → line_type (item,service,discount,tax,fee,shipping,adjustment)
- Line UOM: uom → unit_of_measure
- Line price: unit_price → unit_price
- Line amount: amount → line_amount

If you keep transaction_type / line_type as slugs, the guardrail is: resolve slugs against the catalog on write (deny unknown), or add a DB trigger to enforce membership.

Universal Transactions (header) — Production shape

Required:
- transaction_type (slug; must exist in catalog TRANSACTION_TYPE)
- transaction_number (idempotent external ref or generated)
- transaction_date (business time)
- currency_code (ISO 4217)
- total_amount (minor units or decimal; see rounding below)
- status ∈ {draft,pending,approved,posted,void,failed}
- smart_code (procedure/rule provenance)
- organization_id
- metadata (audit JSON)

Optional:
- created_at, updated_at, created_by, updated_by

Universal Transaction Lines (details) — Production shape

Required:
- transaction_id (FK)
- line_number (1..N)
- line_type ∈ {item,service,discount,tax,fee,shipping,adjustment}
- quantity, unit_of_measure, unit_price, line_amount
- organization_id
- metadata (per-line audit context)

Monetary rules

- Round at line level per currency rules; `total_amount = Σ(line_amount)` (discounts negative).
- Use a consistent scale (minor units preferred). If decimals are stored, enforce precision in validators.

Idempotency

- Provide `transaction_number` or `metadata.idempotency_key` to make writes idempotent per org + smart_code.

Catalog enforcement

- `transaction_type` and semantic `line_type` must map to seeded catalog types. Unknown slugs → hard error.

### 15.5 Org‑Scope Validator (SQL Safety)

- Preferred: SQL AST parsing ensuring every `FROM <six‑table>` has `organization_id = :current_org_id` (or enforced by a join chain).
- Fallback: approved query‑builder injects org filter; raw SQL in contracts is disallowed; lint verifies enforcement.

### 15.6 Idempotency & Registry (Sacred Six Only)

- No new tables.
- Registry via `core_entities` rows: `entity_type='ARTIFACT'`, `entity_code=path`, `metadata.digest` (sha256), `metadata.applied_at`, `metadata.applied_by`, `metadata.outputs`.
- Provenance as `universal_transactions` of type `HERA.SYSTEM.APPLY.{PHASE}.v1` with lines linking artifacts.
- CLI writes both registry upserts and provenance transactions.

### 15.7 Reports & Retention

- Write `.hera/report.json` at orchestration root: bundle smart_code, model/version, input digests, outputs, timings, errors/warnings.
- Emit per‑artifact lint reports under `.hera/lint/{artifact}.json`.
- Retain last N (e.g., 20) reports in repo; persist all in DB registry entities.

### 15.8 Templates & Plugins

- Discovery via orchestration `hera-templates`: support `git+https://…#tag`, `npm pkg@version`, and local path.
- CLI resolves and pins digests to `.hera/lock.json` for determinism.
- Plugin API: generators return YAML contracts and declare `provides`/`requires` for DAG merging.

### 15.9 Test/UAT Contract Schemas

`codex_testing_scope.yaml`

```yaml
smart_code: HERA.TEST.SCOPE.{NAME}.v1
matrix:
  orgs: [org_a, org_b]
  envs: [dev, staging]
setup: [sql_files | procedures]
teardown: [sql_files | procedures]
cases:
  - name: POS simple sale
    input_contract: path/to/procedure_payload.json
    expect:
      transactions:
        headers: [{ type_slug: pos_order, amount: 12345, currency: GBP }]
        lines:   [{ line_type: sales_line, count: 2 }]
      gl_diff: { debit: 12345, credit: 12345 }
```

`testing_execution.yaml`

```yaml
runner:
  strict: true          # default fail on warnings
  parallelism: 4        # optional
  snapshot_policy: update_on_change
```

### 15.10 Severity → Exit Codes

- `error` → exit 1
- `warn` → exit 0 (exit 1 when `--strict`)
- `info` → exit 0
