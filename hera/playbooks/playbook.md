# HERA Build & Release Playbook

This playbook standardizes how we build, validate, and ship HERA across local, CI, and production environments. It codifies the guardrails you’ve seen throughout the repo so results are predictable, reproducible, and production‑grade.

## Prerequisites
- Node.js: >= 20 (see `package.json` engines)
- pnpm/npm: npm >= 9
- Env files: copy `.env.example` → `.env` as needed
- Supabase (for schema validation): set these when running schema checks
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
- Playwright browsers: one‑time install `npm run test:e2e:install`

## Golden Path: Local Build (Fast)
1) Install deps
- `npm ci` (preferred) or `npm install`

2) Quick quality gate
- `npm run quality:fix`      # format + lint fixes where possible
- `npm run type-check`       # tsc in strict noEmit mode

3) Schema gates (Sacred Six contract sanity)
- `npm run schema:types`     # generate types from actual DB (writes `mcp-server/src/types/...`)
- `npm run schema:validate`  # validates tables/columns & writes report

4) App build
- `npm run build`            # Next.js production build

5) Smoke run (optional)
- `npm run ci:smoke`

## Full Verification (Pre‑PR/Pre‑Release)
- Contracts & guardrails
  - `npm run schema:precommit`     # lints playbooks, compat rewrite hints
  - `npm run schema:graph:check`   # renders .hera/graph and verifies no drift
- Quality & types
  - `npm run quality:fix`
  - `npm run type-check`
- Tests
  - Unit: `npx vitest` or `npm run test:unit` (if configured)
  - API (Playwright): `npm run test:api`
  - E2E smoke: `npm run test:e2e:smoke`
  - Full e2e (local/CI): `npm run test:e2e`
- Budgets
  - A11y: `npm run test:a11y`
  - Perf: `npm run test:perf`
- Build
  - `npm run build:production`     # includes predeploy checks

## Data: Migrations & Seeds
- Run migrations: `npm run db:migrate`
- Deterministic seed (Sacred Six only):
  - `npm run db:seed:test`       # seed
  - `npm run db:seed:print`      # dry‑run preview

## Playbooks & Contracts (YAML Bundles)
- Lint bundle in current folder: `npm run schema:lint:bundle`
- Produce contract plan: `npm run schema:plan`
- Graph (ensure edges are stable): `npm run schema:graph:check`
- Strict compat rewrite (if legacy field names are detected in bundles):
  - Preview only: `npm run schema:precommit`
  - Persist rewrites: `npm run schema:compat:write`

## Environment Profiles
- Dev
  - `npm run dev` (with Control Center) or `npm run dev:no-cc`
- Staging/Preview (Vercel)
  - Same steps as Full Verification; env injected via project settings
- Production
  - `npm run build:production` (or `npm run build` + `npm run predeploy`)
  - Start: `npm start` or `npm run start:prod`

## CI Reference Pipeline (Standard)
1) Setup
- Use Node 20.x; cache `~/.cache/ms-playwright` and npm cache

2) Install
- `npm ci`

3) Contracts/Schema gates (fail‑fast)
- `npm run schema:types`
- `npm run schema:validate`
- `npm run schema:graph:check`

4) Quality & Types
- `npm run quality:fix` (or `npm run format:check && npm run lint`)
- `npm run type-check`

5) Tests
- Unit + API + e2e smoke (`npm run test:api && npm run test:e2e:smoke`)
- Optionally full e2e on `main`
- A11y/Perf budgets (on `main` or nightly)

6) Build
- `npm run build`

7) Artifacts/Preview
- Upload `.next`, Playwright report, `.hera/report.json` if present

## Troubleshooting
- Next.js Deprecation: `punycode` warnings
  - Informational; upgrade transient deps in dependency review to remove
- TypeScript fails in unrelated modules
  - Run `npm run type-check` locally and address new errors only within scope of your PR; avoid mass refactors in feature PRs
- Charts crash with `.slice is not a function`
  - We standardized safe array coercion for Recharts across ISP and core widgets. Follow the pattern:
    ```ts
    const safeData = Array.isArray(data) ? data : data && typeof data === 'object' ? Object.values(data) : []
    ```
- Schema lint complains about Smart Codes
  - Ensure codes follow regex: `HERA.[A-Z0-9_]{2,30}(?:\.[A-Z0-9_]{2,30}){3,8}.vN`
  - We normalized playbooks to 4‑segment codes (e.g., `HERA.SYSTEM.PLAYBOOK.SALES.SEED.v1`)

## Build Success Criteria
- Build passes with no TypeScript or schema errors
- Contracts validated: no Smart Code conflicts; vocab guardrails clean
- Budgets (optional for PR; required for main):
  - A11y violations = 0
  - PWA performance ≥ 85
- Tests:
  - Unit + API pass; e2e smoke green on PR; full e2e green on main

## Handy Combos
- Local CI‑parity:
  - `npm run quality:fix && npm run type-check && npm run schema:validate && npm run test:api && npm run test:e2e:smoke`
- Full pre‑release:
  - `npm run schema:precommit && npm run schema:graph:check && npm run quality:fix && npm run type-check && npm run test:api && npm run test:e2e && npm run test:a11y && npm run test:perf && npm run build`

## Ownership & On‑Call
- CODEOWNERS must review PRs that touch `playbooks/**`, `mcp-server/**`, or `src/lib/guardrails/**`
- Breakages in schema/contract gates block merges
- Keep preview links on PRs for quick verification (auth, routing, smoke path)

---
If you need automation tweaks (matrix builds, caching, or step reordering), open a PR against this playbook. This file should stay tightly aligned with `package.json` scripts to ensure one‑command parity locally and in CI.
