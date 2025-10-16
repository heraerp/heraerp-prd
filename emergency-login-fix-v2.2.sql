-- HERA v2.2 Emergency Login Fix
-- Goal: Ensure USER entity + ORG entity + MEMBER_OF (OWNER) exist & are v2.2-audit compliant.
-- Production values pre-filled for immediate execution.

begin;

-- ── Production Values (Ready to Run) ────────────────────────────────────────────
-- Failing user (USER entity id you want to log in):
select '5c1b3698-0c38-4e3b-b1a2-cc84dcd1aa30'::uuid        as v_user_entity_id \gset

-- Target tenant org (Hairtalkz production org):
select '378f24fb-d496-4ff7-8afa-ea34895a0eb8'::uuid        as v_org_id \gset

-- Service actor (Michele's USER entity id with write rights in this org):
select '09b0b92a-d797-489e-bc03-5ca0a6272674'::uuid        as v_actor_user_id \gset
-- ────────────────────────────────────────────────────────────────────────────────

-- Safety: ensure we actually have an org row now
do $
declare
  _exists boolean;
begin
  select exists(select 1 from core_organizations where id = :'v_org_id') into _exists;
  if not _exists then
    raise exception 'Tenant organization % not found. Verify v_org_id exists in core_organizations.', :'v_org_id';
  end if;
  raise notice 'Verified tenant organization exists: %', :'v_org_id';
end$;

-- (B) Ensure an ORG entity exists inside this org (for relationships)
-- smart_code is required on core_entities; use a canonical ORGANIZATION smart code.
insert into core_entities (
  id, organization_id, entity_type, entity_name, smart_code, smart_code_status,
  status, metadata, created_by, updated_by, created_at, updated_at
)
values (
  coalesce((
    select id from core_entities 
    where organization_id = :v_org_id and entity_type = 'ORGANIZATION'
    limit 1
  ),
  :v_org_id), -- Use org_id as ORG entity id for simplicity
  :v_org_id,
  'ORGANIZATION',
  (select organization_name from core_organizations where id = :v_org_id),
  'HERA.IDENTITY.ORG.CORE.V1',
  'LIVE',
  'active',
  jsonb_build_object('source','emergency_bootstrap','fixed_at',now()),
  :v_actor_user_id, :v_actor_user_id,
  now(), now()
)
on conflict (id, organization_id) do update set
  updated_by = :v_actor_user_id,
  updated_at = now();

-- Capture the ORG entity id we just ensured
with org_ent as (
  select id from core_entities 
  where organization_id = :v_org_id and entity_type = 'ORGANIZATION'
  order by created_at asc
  limit 1
)
select id as v_org_entity_id from org_ent \gset

raise notice 'ORG entity ensured: %', :'v_org_entity_id';

-- (C) Ensure USER entity exists in this org for the Supabase user
-- smart_code required; carry provider UID in metadata for traceability.
insert into core_entities (
  id, organization_id, entity_type, entity_name, smart_code, smart_code_status,
  status, metadata, created_by, updated_by, created_at, updated_at
)
values (
  :v_user_entity_id,
  :v_org_id,
  'USER',
  'Production User',
  'HERA.IDENTITY.USER.CORE.V1',
  'LIVE',
  'active',
  jsonb_build_object(
    'auth_provider','supabase',
    'provider_uid', :v_user_entity_id::text,
    'emergency_fix',true,
    'fixed_at',now()
  ),
  :v_actor_user_id, :v_actor_user_id,
  now(), now()
)
on conflict (id, organization_id) do update set
  organization_id = excluded.organization_id,
  entity_type = 'USER',
  metadata = excluded.metadata,
  updated_by = :v_actor_user_id,
  updated_at = now();

raise notice 'USER entity ensured: %', :'v_user_entity_id';

-- (D) Clean up any conflicting relationships first
delete from core_relationships 
where from_entity_id = :v_user_entity_id 
and relationship_type in ('MEMBER_OF', 'USER_MEMBER_OF_ORG');

raise notice 'Cleaned up old relationships for user: %', :'v_user_entity_id';

-- (E) Create MEMBER_OF relationship (role=OWNER) from USER → ORG entity
-- smart_code required on core_relationships.
insert into core_relationships (
  organization_id, from_entity_id, to_entity_id,
  relationship_type, relationship_direction,
  relationship_data,
  smart_code, smart_code_status,
  is_active, effective_date,
  created_by, updated_by, created_at, updated_at
)
values (
  :v_org_id, :v_user_entity_id, :v_org_entity_id,
  'MEMBER_OF', 'forward',
  jsonb_build_object('role','OWNER','permissions','["*"]','emergency_fix',true),
  'HERA.IDENTITY.REL.MEMBER_OF.V1', 'LIVE',
  true, now(),
  :v_actor_user_id, :v_actor_user_id,
  now(), now()
)
on conflict (organization_id, from_entity_id, to_entity_id, relationship_type) do update set
  relationship_data = excluded.relationship_data,
  is_active = true,
  updated_by = :v_actor_user_id,
  updated_at = now();

raise notice 'MEMBER_OF relationship ensured: % → %', :'v_user_entity_id', :'v_org_entity_id';

-- ── Verification Queries ───────────────────────────────────────────────────────
raise notice '=== EMERGENCY FIX COMPLETED ===';
raise notice 'User should now be able to log in at: https://www.heraerp.com';
raise notice 'Run the verification queries below to confirm setup:';

commit;

-- ── Verification (run these after the transaction) ─────────────────────────────
\echo '=== VERIFICATION QUERIES ==='

\echo '1. USER entity in tenant:'
select id, organization_id, entity_type, smart_code, created_by, updated_by
from core_entities
where id = '5c1b3698-0c38-4e3b-b1a2-cc84dcd1aa30';

\echo '2. ORG entity in tenant:'
select id, entity_type, entity_name, smart_code
from core_entities
where organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  and entity_type = 'ORGANIZATION';

\echo '3. MEMBER_OF relationship:'
select relationship_type, relationship_data, smart_code, created_by, is_active
from core_relationships
where organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  and from_entity_id   = '5c1b3698-0c38-4e3b-b1a2-cc84dcd1aa30'
  and relationship_type = 'MEMBER_OF';

\echo '4. Organization exists:'
select id, organization_name, organization_code, status
from core_organizations
where id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';