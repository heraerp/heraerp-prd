# Salon Org Bootstrap (AED)

This bundle seeds three organizations and shared salon catalog/policies in HERA.

- Head Office (HO): `ORG-HO-DXB` — owns shared catalog and policies (AED)
- Branch 1: `ORG-BR-DXB1` — Dubai Main
- Branch 2: `ORG-BR-DXB2` — Dubai Marina

Order of application (matches Guardrail plan):
1) core_organizations ➜ `orgs.sql`
2) entities ➜ `entities.seed.yml` (at HO)
3) dynamic_data ➜ `dynamic_data.seed.yml` (at HO)
4) relationships ➜ `relationships.seed.yml` (at HO)

## Apply with psql

- Prereq: `DATABASE_URL` points to Supabase Postgres (service role)

```
psql "$DATABASE_URL" -f hera/seeds/salon/orgs.sql
```

## Apply with Supabase CLI (optional)

- Link your project, then run:
```
supabase db remote commit --db-url "$DATABASE_URL" --file hera/seeds/salon/orgs.sql
```

## Next steps
- Seed stylists/chairs/customers per branch and link `CUSTOMER_PRICE_LIST`.
- Run salon playbook seed: `node mcp-server/contract-lint.js --bundle hera/playbooks/salon && node mcp-server/contract-plan.js --bundle hera/playbooks/salon`.

Notes
- No schema changes. AED default and Finance DNA flags are set in org settings/features.
- Branch “parent_org_code” is captured in `settings` for reference (no cross‑org FK).

