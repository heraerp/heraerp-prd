-- ✅ Minimal, safe fix for Michele in Hairtalkz (production)
-- Addresses all guardrail requirements and uses existing USER entity
BEGIN;

-- 0) Stamp the actor for guardrails (use your system/ops user UUID)
SELECT set_config('hera.actor_user_id','09b0b92a-d797-489e-bc03-5ca0a6272674', true);

-- Vars
DO $$
DECLARE
  v_auth_uid uuid := '3ced4979-4c09-4e1e-8667-6707cfe6ec77';  -- Michele (Supabase UID)
  v_platform_org uuid := '00000000-0000-0000-0000-000000000000';
  v_hairtalkz_org uuid := '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
  v_user_entity uuid;
BEGIN
  -- 1) Find (or create) Michele's USER entity in PLATFORM org, keyed by metadata.auth_user_id
  SELECT id INTO v_user_entity
  FROM core_entities
  WHERE organization_id = v_platform_org
    AND entity_type = 'USER'
    AND metadata->>'auth_user_id' = v_auth_uid::text
  LIMIT 1;

  IF v_user_entity IS NULL THEN
    v_user_entity := gen_random_uuid();
    INSERT INTO core_entities (
      id, organization_id, entity_type, entity_name, smart_code, status, metadata,
      created_by, updated_by, created_at, updated_at
    ) VALUES (
      v_user_entity, v_platform_org, 'USER', 'Michele',
      'HERA.SYSTEM.USER.ENTITY.PERSON.V1', 'active',
      jsonb_build_object('auth_user_id', v_auth_uid::text, 'email', 'michele@hairtalkz.ae'),
      '09b0b92a-d797-489e-bc03-5ca0a6272674', '09b0b92a-d797-489e-bc03-5ca0a6272674', now(), now()
    )
    ON CONFLICT (id) DO UPDATE
      SET metadata   = excluded.metadata,
          updated_by = excluded.updated_by,
          updated_at = excluded.updated_at;
  ELSE
    UPDATE core_entities
    SET metadata   = metadata || jsonb_build_object('auth_user_id', v_auth_uid::text, 'email', 'michele@hairtalkz.ae'),
        updated_by = '09b0b92a-d797-489e-bc03-5ca0a6272674',
        updated_at = now()
    WHERE id = v_user_entity;
  END IF;

  RAISE NOTICE 'Michele USER entity: %', v_user_entity;

  -- 2) Ensure exactly ONE MEMBER_OF → Hairtalkz, with OWNER role
  --    (a) Remove extras for this user in this org (keep newest)
  WITH ranked AS (
    SELECT r.id,
           ROW_NUMBER() OVER (ORDER BY r.created_at DESC, r.id DESC) rn
    FROM core_relationships r
    WHERE r.organization_id = v_hairtalkz_org
      AND r.relationship_type = 'MEMBER_OF'
      AND r.from_entity_id = v_user_entity
  )
  DELETE FROM core_relationships d
  USING ranked x
  WHERE d.id = x.id AND x.rn > 1;

  --    (b) Upsert one active OWNER membership
  INSERT INTO core_relationships (
    organization_id, from_entity_id, to_entity_id, relationship_type,
    relationship_data, smart_code, is_active,
    created_by, updated_by, created_at, updated_at
  ) VALUES (
    v_hairtalkz_org, v_user_entity, v_hairtalkz_org, 'MEMBER_OF',
    jsonb_build_object('role','OWNER','permissions', jsonb_build_array('*')),
    'HERA.CORE.USER.REL.MEMBER_OF.V1', true,
    '09b0b92a-d797-489e-bc03-5ca0a6272674', '09b0b92a-d797-489e-bc03-5ca0a6272674', now(), now()
  )
  ON CONFLICT DO NOTHING;

  --    (c) Force OWNER role on the remaining row
  UPDATE core_relationships r
  SET relationship_data = jsonb_set(
        jsonb_set(coalesce(r.relationship_data,'{}'::jsonb),'{"role"}','"OWNER"'),
        '{"permissions"}', jsonb_build_array('*')
      ),
      is_active = true,
      updated_by = '09b0b92a-d797-489e-bc03-5ca0a6272674',
      updated_at = now()
  WHERE r.organization_id = v_hairtalkz_org
    AND r.relationship_type = 'MEMBER_OF'
    AND r.from_entity_id = v_user_entity;

  RAISE NOTICE 'MEMBER_OF relationship ensured for Michele in Hairtalkz';
END $$;

COMMIT;

-- 🔍 Verify: one OWNER membership for Michele in Hairtalkz
SELECT r.id, r.from_entity_id, r.is_active,
       r.relationship_data->>'role' AS role,
       r.created_at, r.updated_at
FROM core_relationships r
JOIN core_entities u ON u.id = r.from_entity_id
WHERE r.organization_id = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  AND r.relationship_type = 'MEMBER_OF'
  AND u.entity_type = 'USER'
  AND u.metadata->>'auth_user_id' = '3ced4979-4c09-4e1e-8667-6707cfe6ec77'
ORDER BY r.created_at DESC;