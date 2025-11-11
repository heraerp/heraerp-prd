-- TEMP defaults so trigger has an actor to stamp
ALTER TABLE public.core_organizations
  ALTER COLUMN created_by SET DEFAULT :'ACTOR_ID'::uuid,
  ALTER COLUMN updated_by SET DEFAULT :'ACTOR_ID'::uuid;

BEGIN;

-- Insert a minimal org row (adjust cols only if your schema requires more)
INSERT INTO public.core_organizations (
  id,
  organization_name,
  organization_code,
  status,
  created_by,
  updated_by
)
VALUES (
  :'ORG_ID'::uuid,
  'Imported Org ' || to_char(now(), 'YYYY-MM-DD'),
  ('ORG-' || substring(replace(:'ORG_ID','-','') for 8)),
  'active',
  :'ACTOR_ID'::uuid,
  :'ACTOR_ID'::uuid
)
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- drop temp defaults
ALTER TABLE public.core_organizations
  ALTER COLUMN created_by DROP DEFAULT,
  ALTER COLUMN updated_by DROP DEFAULT;
