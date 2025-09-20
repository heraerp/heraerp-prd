-- STEP 1: Verify what's there (read-only checks)

-- A) Does the tenant organization exist?
select id, organization_name, status
from core_organizations
where id = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';

-- B) Do we have the salon anchor entity under the tenant?
select id, entity_type, entity_name, smart_code
from core_entities
where organization_id = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'
  and id = '9c62b61a-144b-459b-a660-3d8d2f152bed';

-- C) Do we have a platform-level user bridged to supabase_user_id?
select id, entity_type, entity_name, metadata->>'supabase_user_id' as supa_id, smart_code
from core_entities
where organization_id = '00000000-0000-0000-0000-000000000000'
  and entity_type = 'user'
  and metadata->>'supabase_user_id' in ('demo|salon-receptionist');

-- D) Is there a membership edge owned by the tenant (from platform user -> salon anchor)?
select r.id, r.relationship_type, r.smart_code,
       r.from_entity_id, r.to_entity_id, r.relationship_data
from core_relationships r
where r.organization_id = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'
  and r.to_entity_id = '9c62b61a-144b-459b-a660-3d8d2f152bed';

-- E) Do the required tenant policies exist in core_dynamic_data?
select field_name, field_type, smart_code
from core_dynamic_data
where organization_id = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'
  and field_name in ('ROLE_GRANTS.v1','SYSTEM_SETTINGS.v1','SALES_POLICY.v1','NOTIFICATION_POLICY.v1');

-- F) Any login/org-switch transactions recorded?
select id, transaction_type, smart_code, transaction_date
from universal_transactions
where organization_id = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'
  and transaction_type in ('AUTH_LOGIN','ORG_SWITCH')
order by transaction_date desc
limit 10;