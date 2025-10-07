## HERA Manifest v2 — Supabase (Enterprise)

Smart Code: `HERA.PLATFORM.SUPABASE.DB.SCHEMA.MANIFEST.v2`

### Quickstart
1. Build a manifest from the current DB:
   ```bash
   DATABASE_URL=... npm run manifest:build
   ```
   writes `artifacts/manifest.v2.json`

2. Persist to HERA (core_entities + dynamic fields):
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
   HERA_ORG_ID=... npm run manifest:persist
   ```

3. Compare DEV → PROD:
   ```bash
   DEV_DATABASE_URL=... PROD_DATABASE_URL=... npm run manifest:diff
   ```

4. Apply to target (idempotent, guardrails enforced):
   ```bash
   DATABASE_URL=... HERA_MANIFEST_IN=artifacts/manifest.v2.json \
   npm run manifest:apply
   ```

### Guardrails
- Six‑table covenant: no new business tables or sacred‑table columns.
- Namespace: all new objects prefixed `hera_`.
- RLS: `organization_id` enforced on every sacred table.
- DDL: only via CI + manifest (never from agents).

### Minimal helper (read‑only SQL execution)
Add once to your Supabase DB to allow safe, parameterized read‑only queries for MCP/sql_safe:

```sql
create or replace function public.hera_execute_readonly_sql(
  p_sql text,
  p_params jsonb default '[]'::jsonb
) returns jsonb
language plpgsql
security definer
set search_path = public
set statement_timeout = '8s'
set row_security = on
as $$
declare
  res jsonb;
begin
  if p_sql !~* '^\s*(with|select)\b' then
    raise exception 'Only SELECT/CTE allowed in hera_execute_readonly_sql';
  end if;
  perform 1 where false;
  execute format('select coalesce(jsonb_agg(t), ''[]''::jsonb) from (%s) t', p_sql) into res;
  return coalesce(res, '[]'::jsonb);
end $$;

revoke all on function public.hera_execute_readonly_sql(text, jsonb) from public;
grant execute on function public.hera_execute_readonly_sql(text, jsonb) to authenticated, service_role;
```

If you already have a stricter sandbox version, keep yours—just ensure it’s read‑only, respects RLS, and is namespaced.

### RLS helper & example policy
If not already present in your RLS setup:

```sql
create or replace function public.hera_current_org_id()
returns uuid language sql stable as $$
  select current_setting('hera.org_id', true)::uuid
$$;

alter table public.universal_transactions enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where polname = 'hera_org_isolation_universal_transactions'
  ) then
    create policy hera_org_isolation_universal_transactions
      on public.universal_transactions
      using (organization_id = public.hera_current_org_id());
  end if;
end $$;
```

### GitHub Actions secrets
- `DEV_DATABASE_URL`, `PROD_DATABASE_URL`
- `NEXT_PUBLIC_SUPABASE_URL_PROD`, `SUPABASE_SERVICE_ROLE_KEY_PROD`
- Optional: `HERA_ORG_ID_PROD` if pinning per environment

