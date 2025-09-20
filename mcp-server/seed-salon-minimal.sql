-- STEP 2: Seed the minimal working Salon dataset (idempotent)
-- This creates: platform user bridge → tenant anchor → membership → baseline policies.
-- All rows include organization_id and smart_code as guardrails expect.

-- === 2.1 Platform-level user entity (GLOBAL) =========================
-- One global "user" per Supabase user id. Stored in PLATFORM org.
-- Use a fixed UUID so re-running is idempotent.
insert into core_entities (
  id, organization_id, entity_type, entity_name, entity_code, smart_code, business_rules, metadata, status
) values (
  '11111111-1111-4111-8111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'user',
  'Demo Receptionist',
  'USER.DEMO.RECEPTIONIST',
  'HERA.AUTH.IDENTITY.USER.PLATFORM.v1',
  jsonb_build_object('source','supabase'),
  jsonb_build_object('supabase_user_id','demo|salon-receptionist'),
  'active'
)
on conflict (id) do nothing;

-- === 2.2 Tenant org anchor (TENANT) ==================================
-- If not already created, ensure the anchor exists in the tenant org.
insert into core_entities (
  id, organization_id, entity_type, entity_name, entity_code, smart_code, status
) values (
  '9c62b61a-144b-459b-a660-3d8d2f152bed',
  '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
  'organization_anchor',
  'Salon HQ Anchor',
  'ORG.ANCHOR.SALON',
  'HERA.SALON.ANCHOR.ORG.v1',
  'active'
)
on conflict (id) do nothing;

-- === 2.3 Membership relationship (TENANT) ============================
-- Owned by the tenant; points FROM platform user TO tenant anchor.
insert into core_relationships (
  id, organization_id, from_entity_id, to_entity_id, relationship_type,
  relationship_data, smart_code, is_active
) values (
  '22222222-2222-4222-8222-222222222222',
  '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
  '11111111-1111-4111-8111-111111111111',
  '9c62b61a-144b-459b-a660-3d8d2f152bed',
  'ORG_MEMBERSHIP',
  jsonb_build_object('role','RECEPTIONIST','scopes',array['appointments.read','appointments.write']),
  'HERA.AUTH.MEMBERSHIP.SALON.RECEPTIONIST.v1',
  true
)
on conflict (id) do nothing;

-- === 2.4 Baseline dynamic policies (TENANT) ==========================
-- Use field_name "*.v1" keys your app queries for.
-- Keep values minimal-but-valid so the app can render.
insert into core_dynamic_data (
  id, organization_id, entity_id, field_name, field_type,
  field_value_json, smart_code
) values
-- ROLE_GRANTS.v1
(
  '33333333-3333-4333-8333-333333333333',
  '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
  null,
  'ROLE_GRANTS.v1',
  'json',
  jsonb_build_object(
    'RECEPTIONIST', jsonb_build_object('scopes', array['appointments.read','appointments.write']),
    'STYLIST',      jsonb_build_object('scopes', array['appointments.read','services.read']),
    'MANAGER',      jsonb_build_object('scopes', array['ops.full','finance.read']),
    'OWNER',        jsonb_build_object('scopes', array['admin.full','finance.full'])
  ),
  'HERA.SALON.POLICY.ROLE_GRANTS.v1'
),
-- SYSTEM_SETTINGS.v1
(
  '33333333-3333-4333-8333-333333333334',
  '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
  null,
  'SYSTEM_SETTINGS.v1',
  'json',
  jsonb_build_object('currency','AED','vat_rate',0.05,'timezone','Asia/Dubai'),
  'HERA.SALON.POLICY.SYSTEM_SETTINGS.v1'
),
-- SALES_POLICY.v1
(
  '33333333-3333-4333-8333-333333333335',
  '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
  null,
  'SALES_POLICY.v1',
  'json',
  jsonb_build_object('commission_model','standard','tip_enabled',true),
  'HERA.SALON.POLICY.SALES.v1'
),
-- NOTIFICATION_POLICY.v1 (fixed from NOTIFICATIONS_POLICY.v1)
(
  '33333333-3333-4333-8333-333333333336',
  '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
  null,
  'NOTIFICATION_POLICY.v1',
  'json',
  jsonb_build_object('whatsapp_enabled',true,'opt_in_required',true),
  'HERA.SALON.POLICY.NOTIFICATIONS.v1'
)
on conflict (id) do nothing;

-- === 2.5 Optional: record a login event for audit ====================
insert into universal_transactions (
  id, organization_id, transaction_type, transaction_code, smart_code,
  business_context, total_amount
) values (
  '44444444-4444-4444-8444-444444444444',
  '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
  'AUTH_LOGIN',
  'LOGIN.DEMO.RECEPTIONIST',
  'HERA.AUTH.LOGIN.v1',
  jsonb_build_object(
    'from_entity_id','11111111-1111-4111-8111-111111111111',
    'to_entity_id','9c62b61a-144b-459b-a660-3d8d2f152bed',
    'role','RECEPTIONIST'
  ),
  0
)
on conflict (id) do nothing;

-- Verify the seed worked
SELECT 'Platform User' as check_type, count(*) as count 
FROM core_entities 
WHERE id = '11111111-1111-4111-8111-111111111111'
UNION ALL
SELECT 'Salon Anchor', count(*) 
FROM core_entities 
WHERE id = '9c62b61a-144b-459b-a660-3d8d2f152bed'
UNION ALL
SELECT 'Membership Relationship', count(*) 
FROM core_relationships 
WHERE id = '22222222-2222-4222-8222-222222222222'
UNION ALL
SELECT 'Dynamic Policies', count(*) 
FROM core_dynamic_data 
WHERE organization_id = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'
AND field_name IN ('ROLE_GRANTS.v1','SYSTEM_SETTINGS.v1','SALES_POLICY.v1','NOTIFICATION_POLICY.v1')
UNION ALL
SELECT 'Login Transaction', count(*) 
FROM universal_transactions 
WHERE id = '44444444-4444-4444-8444-444444444444';