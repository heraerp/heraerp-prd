# HERA Playbooks (Contracts) – Migration

We are consolidating all YAML contracts under this folder to keep build and governance artifacts in one place.

Current layout during transition:
- Canonical (legacy): `playbooks/` at repo root
- Mirror (new): `hera/playbook/playbooks/`

Workflow
- Develop in `playbooks/` (until all tools are updated), then mirror:
  - `npm run playbooks:sync:to-hera`
- To back‑sync from the mirror (if needed):
  - `npm run playbooks:sync:to-root`

Tooling
- Contract lint and schema tools can respect an alternate root via env:
  - `HERA_PLAYBOOK_ROOT=hera/playbook/playbooks npm run schema:lint:bundle -- --bundle hera/playbook/playbooks/<module>`
- During migration, default root remains `playbooks/` to avoid breaking existing paths and scripts.

Plan
1) Stabilize tools to use `HERA_PLAYBOOK_ROOT` or a provided bundle path uniformly
2) Move CI to use the mirror as primary source
3) Deprecate root `playbooks/` once consumers are updated

Notes
- Smart Code regex and vocabulary guardrails remain unchanged
- Keep orchestrations using relative paths so bundles are portable between roots
- See `hera/playbook/playbook.md` for build and release steps
