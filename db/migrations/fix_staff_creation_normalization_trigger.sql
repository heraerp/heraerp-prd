-- ============================================================================
-- FIX: Staff creation FK violation caused by normalization trigger
-- ============================================================================
--
-- PROBLEM:
--   When creating STAFF entities with ai_confidence = 1.0 (user-curated),
--   the hera_normalize_entity_biu() trigger BEFORE INSERT still runs the
--   fuzzy matching logic and creates review transactions that reference
--   NEW.id (entity not yet in database), causing FK violation.
--
-- ROOT CAUSE:
--   The trigger only fires for entity_type IN ('PERSON','EMPLOYEE','STAFF','ALIAS','ROLE')
--   This is why CUSTOMER and BRANCH creation works (trigger skips them)
--   But STAFF creation fails (trigger fires and creates review txn)
--
-- SOLUTION:
--   Skip normalization logic if NEW.ai_confidence >= 0.8 (user-curated)
--   This allows user-curated staff to bypass fuzzy matching and review queue
--
-- ============================================================================

CREATE OR REPLACE FUNCTION "public"."hera_normalize_entity_biu"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_org uuid := NEW.organization_id;
  cfg jsonb := hera_norm_thresholds(v_org);
  v_auto numeric := (cfg->>'auto_commit_min')::numeric;
  v_review numeric := (cfg->>'review_min')::numeric;
  v_locale text := COALESCE(NEW.metadata->>'locale', cfg->>'locale');
  v_industry text := COALESCE(NEW.metadata->>'industry', cfg->>'industry');

  v_label text := lower(coalesce(NEW.entity_name,''));
  v_alias_id uuid;
  v_emp_id uuid;
  v_role_id uuid;
  v_conf numeric := 0.00;

  is_role boolean := v_label = ANY (SELECT jsonb_array_elements_text(cfg->'role_labels'));
BEGIN
  -- ✅ FIX: Skip normalization if user has already set high confidence
  -- This prevents FK violations when creating user-curated entities
  IF COALESCE(NEW.ai_confidence, 0) >= 0.8 THEN
    -- User-curated entity, bypass normalization and review queue
    RETURN NEW;
  END IF;

  -- Run only for human/HR-ish items (tune as needed)
  IF NEW.entity_type IN ('PERSON','EMPLOYEE','STAFF','ALIAS','ROLE') THEN

    -- Ensure EMPLOYEE concept exists
    SELECT id INTO v_emp_id FROM core_entities
     WHERE organization_id=v_org AND entity_type='CONCEPT'
       AND smart_code='HERA.HCM.EMPLOYMENT.ENTITY.EMPLOYEE.V1';
    IF v_emp_id IS NULL THEN
      INSERT INTO core_entities(organization_id,entity_type,entity_name,smart_code,metadata)
      VALUES (v_org,'CONCEPT','EMPLOYEE','HERA.HCM.EMPLOYMENT.ENTITY.EMPLOYEE.V1',
              jsonb_build_object('industry',v_industry))
      RETURNING id INTO v_emp_id;
    END IF;

    -- Ensure ROLE/STYLIST if needed
    IF is_role THEN
      SELECT id INTO v_role_id FROM core_entities
       WHERE organization_id=v_org AND entity_type='CONCEPT'
         AND smart_code='HERA.HCM.EMPLOYMENT.ROLE.STYLIST.V1';
      IF v_role_id IS NULL THEN
        INSERT INTO core_entities(organization_id,entity_type,entity_name,smart_code,metadata)
        VALUES (v_org,'CONCEPT','ROLE/STYLIST','HERA.HCM.EMPLOYMENT.ROLE.STYLIST.V1',
                jsonb_build_object('industry',v_industry))
        RETURNING id INTO v_role_id;
      END IF;
    END IF;

    -- Exact alias?
    SELECT id INTO v_alias_id
      FROM core_entities
     WHERE organization_id=v_org AND entity_type='ALIAS' AND entity_name=v_label;

    IF v_alias_id IS NOT NULL THEN
      v_conf := 0.99;
      -- Ensure ALIAS_OF link
      INSERT INTO core_relationships(organization_id,from_entity_id,to_entity_id,relationship_type,smart_code,ai_confidence)
      VALUES (v_org, v_alias_id, v_emp_id,
              'ALIAS_OF','HERA.GENERIC.ALIAS.REL.ALIAS_OF.V1', v_conf)
      ON CONFLICT DO NOTHING;

    ELSE
      -- Fuzzy: find nearest known alias in org
      SELECT a.id
      FROM core_entities a
      WHERE a.organization_id=v_org AND a.entity_type='ALIAS'
      ORDER BY similarity(a.entity_name, v_label) DESC
      LIMIT 1
      INTO v_alias_id;

      IF v_alias_id IS NOT NULL THEN
        v_conf := GREATEST(similarity((SELECT entity_name FROM core_entities WHERE id=v_alias_id), v_label), 0.60);
        IF v_conf >= v_review THEN
          -- Create the alias we saw and link it to EMPLOYEE
          INSERT INTO core_entities(organization_id,entity_type,entity_name,smart_code,metadata)
          VALUES (v_org,'ALIAS',v_label,'HERA.GENERIC.ALIAS.ENTITY.LABEL.V1',
                  jsonb_build_object('locale',v_locale,'industry',v_industry))
          ON CONFLICT DO NOTHING;

          SELECT id INTO v_alias_id FROM core_entities
           WHERE organization_id=v_org AND entity_type='ALIAS' AND entity_name=v_label;

          INSERT INTO core_relationships(organization_id,from_entity_id,to_entity_id,relationship_type,smart_code,ai_confidence)
          VALUES (v_org, v_alias_id, v_emp_id,
                  'ALIAS_OF','HERA.GENERIC.ALIAS.REL.ALIAS_OF.V1', v_conf)
          ON CONFLICT DO NOTHING;
        END IF;
      ELSE
        v_conf := 0.00;
      END IF;
    END IF;

    -- Threshold decisions
    IF v_conf >= v_auto THEN
      -- Commit canonical mapping
      INSERT INTO core_relationships(organization_id,from_entity_id,to_entity_id,relationship_type,smart_code,ai_confidence)
      VALUES (v_org, NEW.id, v_emp_id,
              'HAS_CANONICAL_TYPE','HERA.HCM.EMPLOYMENT.REL.HAS_CANONICAL_TYPE.V1', v_conf)
      ON CONFLICT DO NOTHING;

      IF is_role AND v_role_id IS NOT NULL THEN
        INSERT INTO core_relationships(organization_id,from_entity_id,to_entity_id,relationship_type,smart_code,ai_confidence)
        VALUES (v_org, NEW.id, v_role_id,
                'HAS_ROLE','HERA.HCM.EMPLOYMENT.REL.HAS_ROLE.V1', v_conf)
        ON CONFLICT DO NOTHING;
      END IF;

    ELSIF v_conf >= v_review AND v_conf < v_auto THEN
      -- Commit mapping + queue review
      INSERT INTO core_relationships(organization_id,from_entity_id,to_entity_id,relationship_type,smart_code,ai_confidence)
      VALUES (v_org, NEW.id, v_emp_id,
              'HAS_CANONICAL_TYPE','HERA.HCM.EMPLOYMENT.REL.HAS_CANONICAL_TYPE.V1', v_conf)
      ON CONFLICT DO NOTHING;

      PERFORM hera_open_review_txn(v_org, NEW.id, v_label, v_conf, 'needs_review');

    ELSE
      -- Low confidence: open review only
      PERFORM hera_open_review_txn(v_org, NEW.id, v_label, v_conf, 'low_confidence');
    END IF;

    -- Ensure a smart_code on the entity itself (safe default)
    IF NEW.smart_code IS NULL OR NEW.smart_code !~ '^HERA\.' THEN
      NEW.smart_code := 'HERA.GENERIC.IDENTITY.ENTITY.PERSON.V1';
    END IF;

    -- Persist AI fields
    NEW.ai_confidence := GREATEST(COALESCE(NEW.ai_confidence,0), v_conf);
    NEW.ai_insights := COALESCE(NEW.ai_insights,'{}'::jsonb) || jsonb_build_object(
      'norm_label', v_label, 'industry', v_industry, 'locale', v_locale, 'decision_confidence', v_conf
    );
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- INSTRUCTIONS FOR SUPABASE SQL EDITOR
-- ============================================================================
--
-- 1. Copy this entire SQL function above
-- 2. Open Supabase Dashboard → SQL Editor
-- 3. Paste and run the SQL
-- 4. Verify: Try creating a staff member in the app
--
-- VERIFICATION:
-- After running this migration, staff creation with ai_confidence = 1.0 will:
-- ✅ Bypass normalization trigger
-- ✅ Skip fuzzy matching
-- ✅ Skip review transaction creation
-- ✅ Successfully create staff without FK violations
--
-- This matches the behavior of CUSTOMER and BRANCH entity types.
-- ============================================================================
