# Matrix IT World UI (Next.js 14 + HERA Universal API v2)

- Routes under `src/app/matrix` with top navigation and role gating.
- Typed client at `src/lib/heraClient.ts` plus React hooks in `src/lib/hooks/hera.ts`.
- Mock adapter `src/lib/heraClient.mock.ts` enables local dev without backend.

## Run in Mock Mode

- Set `NEXT_PUBLIC_HERA_MOCK=1` in `.env.local`
- Start dev server: `npm run dev`
- Open `/matrix` and use pages (POS, Catalog, Service Intake, PO/GRN, P&L)

## Run Against API

- Ensure auth/session is configured (Supabase) and `organization_id` exists in session.
- Unset `NEXT_PUBLIC_HERA_MOCK` or set to `0`.
- The client uses `/api/v2/universal/*` endpoints with bearer auth + `x-hera-org` header.

## Tests

- Unit: `npx vitest` (see `tests/unit/roles.spec.ts`, `tests/unit/txn-builders.spec.ts`)
- E2E: `npm run test:e2e` (Playwright) — uses mock mode to smoke test POS flow.

