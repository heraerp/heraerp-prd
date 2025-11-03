ALTER TABLE public.universal_transactions
  ALTER COLUMN created_by SET DEFAULT :'ACTOR_ID'::uuid,
  ALTER COLUMN updated_by SET DEFAULT :'ACTOR_ID'::uuid;
BEGIN;
CREATE TEMP TABLE t_universal_transactions AS TABLE public.universal_transactions WITH NO DATA;
\COPY t_universal_transactions FROM 'public__universal_transactions.csv' WITH CSV HEADER
UPDATE t_universal_transactions
SET created_by = COALESCE(created_by, :'ACTOR_ID'::uuid),
    updated_by = COALESCE(updated_by, :'ACTOR_ID'::uuid),
    organization_id = COALESCE(organization_id, :'ORG_ID'::uuid);
SELECT set_config('app.org_id', :'ORG_ID', true);
INSERT INTO public.universal_transactions
SELECT h.* FROM t_universal_transactions h
WHERE h.organization_id = current_setting('app.org_id')::uuid
ON CONFLICT DO NOTHING;
COMMIT;
ALTER TABLE public.universal_transactions
  ALTER COLUMN created_by DROP DEFAULT,
  ALTER COLUMN updated_by DROP DEFAULT;
