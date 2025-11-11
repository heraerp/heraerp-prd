ALTER TABLE public.core_organizations
  ALTER COLUMN created_by SET DEFAULT :'ACTOR_ID'::uuid,
  ALTER COLUMN updated_by SET DEFAULT :'ACTOR_ID'::uuid;
BEGIN;
INSERT INTO public.core_organizations (
  id, organization_name, organization_code, status, created_by, updated_by
) VALUES (
  :'ORG_ID'::uuid,
  'Platform Org',
  'PLATFORM',
  'active',
  :'ACTOR_ID'::uuid,
  :'ACTOR_ID'::uuid
)
ON CONFLICT (id) DO NOTHING;
COMMIT;
ALTER TABLE public.core_organizations
  ALTER COLUMN created_by DROP DEFAULT,
  ALTER COLUMN updated_by DROP DEFAULT;
