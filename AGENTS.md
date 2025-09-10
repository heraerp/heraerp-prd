# Repository Guidelines

## Project Structure & Module Organization
- `src/app`: Next.js App Router routes and pages. API routes under `app/api`.
- `src/components`: Reusable UI components (PascalCase `.tsx`).
- `src/lib`: Domain services, utilities, and integration code (kebab-case `.ts`).
- `tests`: Playwright e2e (`tests/e2e`), API tests (`tests/api`), and unit tests (`tests/unit`).
- `scripts`: Node utilities for build, quality, conversions, and tooling.
- `mcp-server`: Control Center and schema tools (schema types/validation).
- `public`: Static assets. Other configs: `config/`, `supabase/`, `database/`.

## HERA Principles → Code Touchpoints
- Sacred Six tables: `core_organizations`, `core_entities`, `core_dynamic_data`, `core_relationships`, `universal_transactions`, `universal_transaction_lines` (see `src/lib/hera-sacred-validator.ts`).
- No schema drift beyond the six. Business change = Smart Codes + dynamic data; record flows via `universal_transactions` (+ lines).
- Example Smart Codes (drive validation/routing):
  - `HERA.RETAIL.POS.TXN.SALE.v1`, `HERA.ERP.FI.JE.POST.v1` (see tests under `tests/api`, `tests/reports`).
  - Pattern: `HERA.{INDUSTRY}.{MODULE}.{TYPE}.{SUBTYPE}.{VERSION}`.

## Build, Test, and Development Commands
- Dev: `npm run dev` (with Control Center) or `npm run dev:no-cc`.
- Build/Start: `npm run build`, `npm start` (or `npm run start:prod`).
- Lint/Format: `npm run lint`, `npm run format`, `npm run format:check`, `npm run quality:fix`.
- Types/Schema: `npm run type-check`, `npm run schema:types`, `npm run schema:validate`.
- DB: `npm run db:migrate`.
- E2E (Playwright): `npm run test:e2e`, UI mode `npm run test:e2e:ui`, API tests `npm run test:api`.
- Install browsers once: `npm run test:e2e:install`.

## Data & Schema Tooling
- `mcp-server`: generates types, validates schema, and enforces Smart Code guardrails.
- Schema gates (pre-push/CI): `schema:types` and `schema:validate` must pass. Fail on: missing types, invalid relations, or operations outside the six tables.

## Coding Style & Naming Conventions
- Prettier: 2 spaces, single quotes, no semicolons, width 100.
- ESLint: Next.js config plus repo rules (prefer `const`, no `var`, `_`-prefixed unused args).
- Files: components PascalCase (`Button.tsx`), libraries kebab-case (`api-client.ts`).
- Imports: prefer type-only imports for TS where applicable.
- Hooks/components live in `src/hooks`/`src/components`; UI patterns validated by `npm run ui:validate`.

## Testing Guidelines
- Playwright config: `playwright.config.ts` (runs dev server automatically). Base e2e in `tests/e2e`.
- Debug e2e with `--headed` or `--ui`; view report via `npm run test:e2e:report`.
- Unit tests: `tests/unit` (Vitest + Testing Library). Run with `npx vitest` if no script exists.
- Keep tests colocated under `tests/*` mirroring feature paths; name with `*.spec.ts(x)`.
- Auth in e2e: use storage state `tests/e2e/auth-state.json` via helper (`tests/e2e/helpers/auth.setup.ts`) or login with test creds.
- Environments: set `PLAYWRIGHT_BASE_URL` for local/preview/prod-like.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat:`, `fix:`, `chore:`, etc. (see git history).
- PRs must include: concise summary, scope/files touched, linked issues, screenshots for UI changes, and a test plan (e.g., Playwright run or unit output).
- Pre-commit hooks run UI validation and format checks; ensure `npm run ui:check` passes before pushing.

## Test Data Strategy
- Deterministic seed (touch only universal tables): run migrations (`npm run db:migrate`) then seed via `seeds/sql/*` (org, canonical `core_entities`, `core_dynamic_data`, minimal `universal_transactions` + lines). Suggested script name: `npm run db:seed:test`.
- Rule: no fixtures that bypass the six universal tables.

## Accessibility, Performance, and CI
- Budgets: a11y violations = 0; PWA performance ≥ 85.
- Suggested scripts: `npm run test:a11y` (axe/Lighthouse) and `npm run test:perf` (Lighthouse CI).
- CI must-pass: build, type-check, lint/format, `schema:types`, `schema:validate`, unit + API + e2e (smoke on PR, full on main), a11y/perf budgets, vuln scan.
- Branch/PR policy: ≥1 CODEOWNER review, all checks green, UI PRs include screenshots/video. Preview deploys (Vercel) should verify auth, routing, and smoke path.

## Security & Configuration Tips
- Copy `.env.example` to `.env`; do not commit secrets. Review `.env.*` templates.
- Node >= 20 required (see `package.json engines`).
- For e2e, adjust `PLAYWRIGHT_BASE_URL` as needed.
- No real secrets in test data; use Vercel/Supabase secret stores. CI injects env via provider settings.

## HERA Review Checklist
- Six-table immutability respected; no schema drift.
- Smart Codes present, versioned, validated; flows recorded in `universal_transactions` (+ lines).
- New fields via `core_dynamic_data`; tests cover unit, API, e2e (auth + happy + failure).
- Budgets met; checks green; clean `.env` handling; no secrets in code/fixtures.

## Common CI-Parity Commands
`npm run quality:fix && npm run type-check && npm run schema:validate && npm run test:api && npm run test:e2e:smoke`

## HERA CLI
- Run: `npm run hera -- <command>` (see Zod schemas in `src/cli/schemas.ts`).
- Full docs: `src/cli/README.md`.
- Commands:
  - `hera init [--org <uuid>] [--write-config] [--json]` — verifies DB, Sacred Six, and writes `.hera-cli.json`.
  - `hera smart-code validate "<CODE>" [--semantic] [--json]` — pattern + optional semantic checks.
  - `hera tx create --org <uuid> --type <TYPE> --code <SMART_CODE> --lines '<JSON>' [--currency USD] [--json]` — creates universal transaction with GL-balance guardrails.
  - `hera tx list [--org <uuid>] [--since ISO] [--type <TYPE>] [--json]` — lists transactions.
- Env: `DATABASE_URL` required; Playwright auth uses `E2E_USER_EMAIL` and `E2E_USER_PASSWORD`.
- Guardrails: `src/lib/guardrails/hera-guardrails.ts` and Smart Code helper `src/lib/smart-code.ts`.
- Seed data: `npm run db:seed:test` (deterministic, Sacred Six only). Dry run: `npm run db:seed:print`.
- Examples:
  - `npm run hera -- smart-code validate "HERA.RETAIL.ORDERS.SALE.ONLINE.v1" --semantic --json`
  - `npm run hera -- tx create --org $ORG --type SALE --code "HERA.RETAIL.ORDERS.SALE.ONLINE.v1" --lines '[{"line_number":1,"line_type":"ITEM","line_amount":19.99,"smart_code":"HERA.RETAIL.ORDERS.LINE.ITEM.v1"}]' --json`
