# Repository Guidelines

## Project Structure & Module Organization
- `src/app`: Next.js App Router pages and API routes (`app/api`).
- `src/components`: Reusable UI components in PascalCase `.tsx` files.
- `src/lib`: Domain utilities and integrations in kebab-case `.ts` files.
- `tests`: Playwright e2e (`tests/e2e`), API suites (`tests/api`), unit specs (`tests/unit`).
- `scripts`: Node-based tooling; `mcp-server` governs schema and Sacred Six guardrails.
- `public` holds static assets; additional configs in `config/`, `supabase/`, and `database/`.

## Build, Test, and Development Commands
- `npm run dev` / `npm run dev:no-cc`: start local app with or without Control Center.
- `npm run build` then `npm start`: production build and runtime.
- `npm run quality:fix`: lint + format autobundle; `npm run lint`, `npm run format:check` for targeted checks.
- `npm run type-check`, `npm run schema:types`, `npm run schema:validate`: ensure types align with Sacred Six schema.
- `npm run test:e2e`, `npm run test:api`, `npx vitest`: execute e2e, API, and unit suites respectively.

## Coding Style & Naming Conventions
- Prettier enforced: 2 spaces, single quotes, no semicolons, width 100.
- ESLint (Next.js config) demands `const`, forbids `var`, and expects `_` prefix for unused args.
- Components/hooks use PascalCase filenames; libraries use kebab-case; favor type-only imports.
- Keep comments minimal and purposeful; align with existing patterns.

## Testing Guidelines
- Playwright lives in `tests/e2e`; run headed via `npm run test:e2e:ui` or view reports with `npm run test:e2e:report`.
- Unit tests mirror feature paths under `tests/unit` and use `*.spec.ts(x)` naming.
- Seed deterministic data before integration tests with `npm run db:migrate` then `npm run db:seed:test`.
- Treat schema validation failures as release blockers; add coverage for happy and failure paths.

## Commit & Pull Request Guidelines
- Follow Conventional Commits (`feat:`, `fix:`, `chore:`); keep scopes concise.
- PRs must summarize changes, list touched areas, link issues, and include UI evidence when relevant.
- Ensure checks stay green: build, lint, type, schema validation, unit/API/e2e, a11y/perf budgets.
- Avoid committing secrets; leverage `.env.example` templates and provider-managed secrets.

## Security & Configuration Tips
- Copy `.env.example` locally; never commit actual credentials.
- Node 20+ required; ensure `DATABASE_URL` is set for CLI and tests.
- Use `npm run hera -- smart-code validate` and `npm run hera -- tx ...` to respect Smart Code guardrails.
