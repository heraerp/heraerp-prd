# HERA Central Registry

A monorepo of reusable DNA packs, smart-code conventions, and guardrails for HERA.
Claude CLI reads `/cli/index.json` first, then loads guardrails, schemas, and DNA packs.

## Principles
- Six Sacred Tables only; policy-as-data for everything else.
- Smart Codes on every entity/transaction/line.
- Org isolation on every read/write. GL balanced per currency.

## How Claude CLI should use this repo
1. Load `/cli/index.json`.
2. Apply guardrails from `/guardrails/hera_guardrails.json`.
3. Load Finance/Fiscal DNA packs listed in `index.json`.
4. Scaffold entities/transactions using Smart Codes from DNA packs.

## Packs in this seed
- ProFlow Finance DNA (`dna/finance/rulesets/proflow.v1.json`)
- ProFlow Fiscal Close DNA (`dna/fiscal/close_playbooks/proflow-close-standard.v1.json`)

## Versioning
- Use SemVer in file names (e.g., `proflow.v1.json`) and Smart Codes (…`.v1`).
