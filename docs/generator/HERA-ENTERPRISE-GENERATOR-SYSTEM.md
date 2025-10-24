# 🏗️ HERA Enterprise Generator System

**Mobile-First Enterprise Page Builder with Regression Shields and Sacred-Six Compliance**

## 🌍 Overview

The HERA Enterprise Generator System is a fully automated build engine that produces mobile-first enterprise CRUD pages (React + Tailwind + Supabase) following the Sacred Six Table Architecture.

It guarantees:

✅ Zero duplicate imports  
✅ 100% lint / type safety  
✅ Multi-tenant and Smart-Code compliance  
✅ Continuous Quality Gates ("fast + loud" CI)  
✅ Deterministic, reproducible generation across modules (CRM, Retail, HR, Finance)

## 📦 Folder Structure

```
src/
 ├── tools/
 │    └── generator/
 │         ├── icon-utils.ts          # Deterministic icon deduplication
 │         ├── page-template.ts       # Lucide import renderer & component scaffold
 │         ├── write-page.ts          # Writes generated page files
 │         ├── generator-core.ts      # Main generator logic (Zod validated)
 │         └── presets/
 │              ├── account.ts
 │              ├── contact.ts
 │              ├── lead.ts
 │              ├── opportunity.ts
 │              ├── activity.ts
 │              └── product.ts
 ├── scripts/
 │    ├── generate-crud-page-enterprise.js   # CLI entrypoint
 │    └── quality-gates.js                   # Sacred-Six & smart-code validation
 ├── tests/
 │    ├── generator/iconDedup.spec.ts
 │    ├── e2e/routes.spec.ts
 │    └── quality/gateValidation.spec.ts
 └── components/mobile/                      # UI system: MobilePageLayout, Card, Filters...
```

## ⚙️ Setup & Installation

```bash
# Install dependencies
npm install

# Run quality gates and tests
npm run ci:quality
```

**Core dependencies:**
- `typescript`, `zod`, `eslint`, `vitest`, `playwright`
- `lucide-react`, `tailwindcss`, `@supabase/supabase-js`

## 🧠 How It Works

1. **Generator Presets** — define entities (Account, Contact, Lead...)  
   Each preset includes fields, smart_codes, icons, and workflows.

2. **Deduplication Engine** — `icon-utils.ts` ensures no repeated imports.  
   17 unit tests guarantee it never regresses.

3. **Page Template** — Renders a Mobile-First layout (`MobilePageLayout`, `MobileFilters`, `MobileDataTable`, etc.) using HERA's enterprise style system.

4. **Quality Gates** — `scripts/quality-gates.js` enforces Sacred-Six, Smart-Code, and field naming rules before commit.

5. **CI Pipeline** — Runs lint → type → unit → e2e tests.  
   Failure = loud red status and auto-block on merge.

## 🧪 Commands

| Command | Purpose |
|---------|---------|
| `npm run generate:entity [ENTITY]` | Generate new CRUD page (e.g. CONTACT, LEAD, OPPORTUNITY) |
| `npm run lint` | Lint & formatting checks |
| `npm run typecheck` | Validate TypeScript types |
| `npm run test:unit` | Run Vitest unit tests (17/17 icon tests included) |
| `npm run test:e2e` | Run Playwright end-to-end route validation |
| `npm run ci:quality` | Run full enterprise quality pipeline |

## 🛡️ Quality Gates (Fast + Loud)

Quality Gates ensure zero technical drift:

| Check | Description |
|-------|-------------|
| **No Schema Drift** | Prevents DDL changes outside Sacred Six tables |
| **Smart Code Coverage** | Validates every entity/txn has a smart_code |
| **Organization Isolation** | Confirms org_id filters present in all queries |
| **Duplicate Imports** | Blocker: duplicates auto-fail lint/test |
| **Field Name Guard** | Detects legacy fields (e.g., `transaction_code` → `transaction_number`) |
| **Performance Budget** | Ensures sub-3s load & sub-1s interaction |
| **Accessibility Checks** | Tests ARIA and contrast compliance |

## 🔬 Testing Framework

### 🧩 Unit Tests (Vitest)
Located in `/tests/generator`.  
Covers icon deduplication, import rendering, Zod validation, and generator core.

```bash
npm run test:unit
```

### 🌐 E2E Tests (Playwright)
Located in `/tests/e2e/routes.spec.ts`.  
Verifies all enterprise routes return HTTP 200 OK.

```bash
npm run test:e2e
```

### 📊 Coverage
Target: 95%+ on generator modules.
```bash
npm run test:coverage
```

## 🧱 Extending the Generator

1. Add a new module preset under `src/tools/generator/presets/[module].ts`

2. Define:
   - `entity_type`
   - `smart_code`
   - `dynamicFields`
   - `relationships`
   - `ui.icon`

3. Run:
   ```bash
   npm run generate:entity [MODULE]
   ```

4. Verify:
   ```bash
   npm run ci:quality
   ```

The generator will:
- Auto-deduplicate imports
- Generate a mobile-first page
- Enforce Sacred Six + Smart Code compliance

## 🧩 Example

```bash
npm run generate:entity LEAD
```

Generates `/app/crm/leads/page.tsx`
- Includes KPIs, filters, Kanban, charts, and data table
- Uses mobile-responsive cards for touch UX
- Passes ESLint, TypeScript, and dedup tests automatically

## 🧾 CI Integration Example (GitHub Actions)

```yaml
name: HERA Enterprise Generator CI
on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run ci:quality
```

## 📈 Metrics & Telemetry (optional)

Add `universal_transactions` logging for:
- `PAGE_GENERATED`
- `QUALITY_PASS`
- `TEST_FAIL`
- `MERGE_APPROVED`

This gives full auditable traceability for every generator action across organizations.

## 🧩 Compliance & Standards

| Principle | Implementation |
|-----------|----------------|
| **Sacred Six Tables** | All outputs persist via `core_entities` + `core_dynamic_data` |
| **Smart Code Intelligence** | Every file/entity/tag carries valid HERA smart_code |
| **Organization Isolation** | `org_id` enforced in every query |
| **Zero Schema Changes** | Generator never creates new tables |
| **Perfect Audit Trail** | Universal Transactions capture every generator + page event |

## 🏁 Version 1.0 Release Notes

🧩 CRM presets (Accounts, Contacts, Leads, Opportunities, Activities, Products)  
🧠 Icon deduplication regression shield (17 tests ✅)  
⚙️ Zod-validated configs  
🔍 600+ schema/field violations detected and corrected  
🧱 Mobile-first enterprise layout scaffolding  
🚦 CI "fast + loud" quality pipeline integrated

## 💬 Maintenance Tips

- Run `npm run ci:quality` before every commit.
- Add new presets via the `preset-schema.ts` template only.
- Never import icons manually; always use `config.ui.icon`.
- Update snapshots after design system changes.
- Keep CI logs visible — loud failures save hours later.

## 🏆 Status

| Component | Status |
|-----------|--------|
| Icon Dedup Tests | ✅ 17/17 PASSED |
| Generator Runtime | ✅ Stable |
| Quality Gates | ✅ Active |
| Regression Shields | ✅ Deployed |
| Production Readiness | ✅ CONFIRMED |