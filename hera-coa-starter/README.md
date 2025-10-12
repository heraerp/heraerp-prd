# HERA Chart of Accounts – Theme‑Agnostic Starter

This starter drops a **theme‑agnostic** Chart of Accounts Manager into any Next.js + Tailwind app.

## How it works
- **Semantic tokens** (`ThemeTokens`) → mapped to **CSS variables** by `ThemeProvider`.
- Components only reference CSS variables (no hard‑coded colors).
- Swap `tokens` to adopt any product brand instantly (example: `salonLuxe`).

## Files
- `src/ui/theme/tokens.ts` – token contract
- `src/ui/theme/ThemeProvider.tsx` – maps tokens → CSS variables
- `src/ui/theme/presets/salonLuxe.ts` – example theme
- `src/features/accounts/*` – COA skeleton (Toolbar, TreeGrid, DetailPanel)
- `src/pages/salon/accounts.tsx` – example page wrapper

## Integrate
1. Copy `src/` into your project.
2. Ensure Tailwind is configured (`tailwind.config.js` content path).
3. Route to `/salon/accounts` (or mount `ChartOfAccounts` anywhere).
4. Replace placeholders in `data.ts` with your HERA APIs and guardrails.

## Notes
- Accessibility: treegrid role prepared; add keyboard handlers on TreeGrid rows.
- Financial semantics: `--debit`, `--credit`, `--negative` colors supplied by tokens.
- Extend with modals and virtualization as needed.
