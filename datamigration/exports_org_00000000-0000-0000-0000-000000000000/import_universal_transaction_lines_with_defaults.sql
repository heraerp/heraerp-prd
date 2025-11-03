ALTER TABLE public.universal_transaction_lines
  ALTER COLUMN created_by SET DEFAULT :'ACTOR_ID'::uuid,
  ALTER COLUMN updated_by SET DEFAULT :'ACTOR_ID'::uuid;
BEGIN;
CREATE TEMP TABLE t_universal_transaction_lines AS TABLE public.universal_transaction_lines WITH NO DATA;
\COPY t_universal_transaction_lines FROM 'public__universal_transaction_lines.csv' WITH CSV HEADER
UPDATE t_universal_transaction_lines
SET created_by = COALESCE(created_by, :'ACTOR_ID'::uuid),
    updated_by = COALESCE(updated_by, :'ACTOR_ID'::uuid),
    organization_id = COALESCE(organization_id, :'ORG_ID'::uuid);
SELECT set_config('app.org_id', :'ORG_ID', true);
INSERT INTO public.universal_transaction_lines
SELECT l.*
FROM t_universal_transaction_lines l
JOIN public.universal_transactions h ON h.id = l.transaction_id
WHERE l.organization_id = current_setting('app.org_id')::uuid
ON CONFLICT DO NOTHING;
COMMIT;
ALTER TABLE public.universal_transaction_lines
  ALTER COLUMN created_by DROP DEFAULT,
  ALTER COLUMN updated_by DROP DEFAULT;
