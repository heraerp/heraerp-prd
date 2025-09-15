# HERA CLI

## Overview

The HERA CLI accelerates local development and validation against the Sacred Six data contract. It ships with three core commands: `init`, `smart-code validate`, and `tx` (create/list).

- Entry: `npm run hera -- <command>`
- Source: `src/cli/index.ts` (Commander)
- Schemas: `src/cli/schemas.ts` (Zod I/O contracts)
- Guardrails: `src/lib/guardrails/hera-guardrails.ts`, `src/lib/smart-code.ts`

## Setup

- Node 20+
- Env: set `DATABASE_URL` for Postgres (use `?sslmode=require` on managed hosts)
- Install deps: `npm i` (includes `pg`, `tsx`, `dotenv` as dev deps; scripts run via tsx)
- Seed deterministic data (Sacred Six only):
  - `npm run db:seed:test`
  - Dry‑run SQL: `npm run db:seed:print`

## Commands

- `hera init [--org <uuid>] [--write-config] [--json]`
  - Verifies DB connectivity, Sacred Six presence, and optional `.hera-cli.json` write.
- `hera smart-code validate "<SMART_CODE>" [--semantic] [--json]`
  - Enforces HERA pattern; optional semantic checks.
- `hera tx create --org <uuid> --type <TYPE> --code <SMART_CODE> --lines '<JSON>' [--currency USD] [--json]`
  - Creates a universal transaction; guardrails validate Smart Codes and GL balance.
- `hera tx list [--org <uuid>] [--since ISO] [--type TYPE] [--json]`
  - Lists transactions with basic filters.

Examples

- `npm run hera -- smart-code validate "HERA.RETAIL.ORDERS.SALE.ONLINE.v1" --semantic --json`
- `npm run hera -- tx create --org $ORG --type SALE --code "HERA.RETAIL.ORDERS.SALE.ONLINE.v1" --lines '[{"line_number":1,"line_type":"ITEM","line_amount":19.99,"smart_code":"HERA.RETAIL.ORDERS.LINE.ITEM.v1"}]' --json`
- `npm run hera -- tx list --org $ORG --since 2025-01-01 --json`

## Troubleshooting

- Missing DB URL: set `DATABASE_URL` in shell or `.env`.
- SSL errors on Postgres: append `?sslmode=require` to `DATABASE_URL` (or configure SSL in your provider).
- JSON parse errors for `--lines`: wrap JSON in single quotes and escape inner quotes.
- Org not found: ensure `core_organizations` contains your `--org` (use the seed or create one).
- Exit codes: see `CLI_EXIT_CODES` in `src/lib/guardrails/hera-guardrails.ts` for failure reasons.

## Notes

- Use seeds and Playwright auth state for deterministic e2e (`E2E_USER_EMAIL`, `E2E_USER_PASSWORD`).
- All business flows must land in `universal_transactions` (+ lines); no ad‑hoc tables.
