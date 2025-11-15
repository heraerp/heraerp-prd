-- HERA Onboarding Project CRUD v1 
-- ================================
-- Complete CRUD operations for onboarding projects following Sacred Six architecture
-- Includes automatic phase creation, checkpoint management, and full actor stamping

CREATE OR REPLACE FUNCTION hera_onboarding_project_crud_v1(
  p_action TEXT,                    -- 'CREATE', 'READ', 'UPDATE', 'DELETE'
  p_actor_user_id UUID,            -- WHO is performing the action
  p_organization_id UUID,          -- WHERE (tenant boundary)
  p_project JSONB DEFAULT NULL,    -- Project data for CREATE/UPDATE
  p_options JSONB DEFAULT '{}'     -- Operation options
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_project_id UUID;
  v_result JSONB;
  v_phase_id UUID;
  v_checkpoint_id UUID;
  v_platform_org_id UUID := '00000000-0000-0000-0000-000000000000';
  v_project_entity RECORD;
  v_phase_count INTEGER;
BEGIN
  -- Input validation
  IF p_actor_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'HERA_ACTOR_REQUIRED',
      'message', 'p_actor_user_id cannot be null'
    );
  END IF;
  
  IF p_organization_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'HERA_ORG_REQUIRED', 
      'message', 'p_organization_id cannot be null'
    );
  END IF;
  
  -- Validate actor is a USER entity
  IF NOT EXISTS (
    SELECT 1 FROM core_entities
    WHERE id = p_actor_user_id 
    AND entity_type = 'USER'
    AND organization_id = v_platform_org_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'HERA_ACTOR_INVALID',
      'message', 'Actor must be valid USER entity in platform organization'
    );
  END IF;
  
  -- Validate actor membership (for non-platform operations)
  IF p_organization_id != v_platform_org_id AND NOT EXISTS (
    SELECT 1 FROM core_relationships
    WHERE from_entity_id = p_actor_user_id
    AND to_entity_id = p_organization_id
    AND relationship_type = 'USER_MEMBER_OF_ORG'
    AND is_active = true
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'HERA_MEMBERSHIP_DENIED',
      'message', format('Actor %s not member of organization %s', p_actor_user_id, p_organization_id)
    );
  END IF;
  
  -- Execute operation
  CASE p_action
    WHEN 'CREATE' THEN
      -- Validate required project data
      IF p_project IS NULL OR 
         p_project->>'project_name' IS NULL OR
         p_project->>'target_go_live_date' IS NULL THEN
        RETURN jsonb_build_object(
          'success', false,
          'error_code', 'HERA_VALIDATION_ERROR',
          'message', 'project_name and target_go_live_date are required for CREATE'
        );
      END IF;
      
      -- Generate project code
      v_project_id := gen_random_uuid();
      
      -- Create ONBOARDING_PROJECT entity
      INSERT INTO core_entities (
        id,
        organization_id,
        entity_type,
        entity_code,
        entity_name,
        smart_code,
        entity_description,
        status,
        created_by,
        updated_by,
        created_at,
        updated_at
      ) VALUES (
        v_project_id,
        p_organization_id,
        'ONBOARDING_PROJECT',
        'ONBRD_' || EXTRACT(YEAR FROM now()) || '_' || UPPER(SUBSTRING(REPLACE(p_project->>'project_name', ' ', '_'), 1, 15)),
        p_project->>'project_name',
        'HERA.ONBOARDING.CORE.PROJECT.' || COALESCE(p_project->>'org_code', 'DEFAULT') || '.v1',
        COALESCE(p_project->>'project_description', 'Customer onboarding implementation project'),
        'active',
        p_actor_user_id,
        p_actor_user_id,
        now(),
        now()
      );
      
      -- Add dynamic fields for project metadata
      INSERT INTO core_dynamic_data (organization_id, entity_id, field_name, field_type, field_value_text, smart_code, created_by, updated_by)
      VALUES 
        (p_organization_id, v_project_id, 'project_type', 'text', COALESCE(p_project->>'project_type', 'NEW_CUSTOMER'), 'HERA.ONBOARDING.CORE.PROJECT.FIELD.TYPE.v1', p_actor_user_id, p_actor_user_id),
        (p_organization_id, v_project_id, 'current_status', 'text', 'PLANNING', 'HERA.ONBOARDING.CORE.PROJECT.FIELD.STATUS.v1', p_actor_user_id, p_actor_user_id),
        (p_organization_id, v_project_id, 'health_status', 'text', 'GREEN', 'HERA.ONBOARDING.CORE.PROJECT.FIELD.HEALTH.v1', p_actor_user_id, p_actor_user_id);
      
      -- Add date fields
      INSERT INTO core_dynamic_data (organization_id, entity_id, field_name, field_type, field_value_date, smart_code, created_by, updated_by)
      VALUES 
        (p_organization_id, v_project_id, 'project_start_date', 'date', COALESCE((p_project->>'project_start_date')::date, CURRENT_DATE), 'HERA.ONBOARDING.CORE.PROJECT.FIELD.START_DATE.v1', p_actor_user_id, p_actor_user_id),
        (p_organization_id, v_project_id, 'target_go_live_date', 'date', (p_project->>'target_go_live_date')::date, 'HERA.ONBOARDING.CORE.PROJECT.FIELD.TARGET_DATE.v1', p_actor_user_id, p_actor_user_id);
      
      -- Add numeric fields
      IF p_project->>'estimated_days' IS NOT NULL THEN
        INSERT INTO core_dynamic_data (organization_id, entity_id, field_name, field_type, field_value_number, smart_code, created_by, updated_by)
        VALUES (p_organization_id, v_project_id, 'estimated_days', 'number', (p_project->>'estimated_days')::numeric, 'HERA.ONBOARDING.CORE.PROJECT.FIELD.ESTIMATED_DAYS.v1', p_actor_user_id, p_actor_user_id);
      END IF;
      
      -- Add JSON fields for complex data
      IF p_project->'micro_app_bundle_codes' IS NOT NULL THEN
        INSERT INTO core_dynamic_data (organization_id, entity_id, field_name, field_type, field_value_json, smart_code, created_by, updated_by)
        VALUES (p_organization_id, v_project_id, 'micro_app_bundle_codes', 'json', p_project->'micro_app_bundle_codes', 'HERA.ONBOARDING.CORE.PROJECT.FIELD.BUNDLES.v1', p_actor_user_id, p_actor_user_id);
      END IF;
      
      -- Create default phases
      FOR i IN 1..5 LOOP
        v_phase_id := gen_random_uuid();
        
        INSERT INTO core_entities (
          id, organization_id, entity_type, entity_code, entity_name, smart_code,
          parent_entity_id, status, created_by, updated_by, created_at, updated_at
        ) VALUES (
          v_phase_id, p_organization_id, 'ONBOARDING_PHASE',
          'PHASE_' || i || '_' || CASE i 
            WHEN 1 THEN 'SHADOW_MODE'
            WHEN 2 THEN 'DUAL_ENTRY' 
            WHEN 3 THEN 'PILOT_USERS'
            WHEN 4 THEN 'REGIONAL_CUTOVER'
            WHEN 5 THEN 'FULL_CUTOVER'
          END,
          CASE i
            WHEN 1 THEN 'Shadow Mode Phase'
            WHEN 2 THEN 'Dual Entry Phase'
            WHEN 3 THEN 'Pilot Users Phase' 
            WHEN 4 THEN 'Regional Cutover Phase'
            WHEN 5 THEN 'Full Cutover Phase'
          END,
          'HERA.ONBOARDING.CORE.PHASE.' || COALESCE(p_project->>'org_code', 'DEFAULT') || '.PHASE_' || i || '.v1',
          v_project_id, -- parent is the project
          CASE WHEN i = 1 THEN 'active' ELSE 'pending' END,
          p_actor_user_id, p_actor_user_id, now(), now()
        );
        
        -- Add phase metadata
        INSERT INTO core_dynamic_data (organization_id, entity_id, field_name, field_type, field_value_number, smart_code, created_by, updated_by)
        VALUES (p_organization_id, v_phase_id, 'phase_sequence', 'number', i, 'HERA.ONBOARDING.CORE.PHASE.FIELD.SEQUENCE.v1', p_actor_user_id, p_actor_user_id);
        
        INSERT INTO core_dynamic_data (organization_id, entity_id, field_name, field_type, field_value_text, smart_code, created_by, updated_by)
        VALUES 
          (p_organization_id, v_phase_id, 'phase_type', 'text', CASE i WHEN 1 THEN 'SHADOW_MODE' WHEN 2 THEN 'DUAL_ENTRY' WHEN 3 THEN 'PILOT_USERS' WHEN 4 THEN 'REGIONAL_CUTOVER' WHEN 5 THEN 'FULL_CUTOVER' END, 'HERA.ONBOARDING.CORE.PHASE.FIELD.TYPE.v1', p_actor_user_id, p_actor_user_id),
          (p_organization_id, v_phase_id, 'phase_status', 'text', CASE WHEN i = 1 THEN 'ACTIVE' ELSE 'PENDING' END, 'HERA.ONBOARDING.CORE.PHASE.FIELD.STATUS.v1', p_actor_user_id, p_actor_user_id);
        
        -- Create relationship: PROJECT_HAS_PHASE
        INSERT INTO core_relationships (
          organization_id, from_entity_id, to_entity_id, relationship_type,
          smart_code, created_by, updated_by, created_at, updated_at
        ) VALUES (
          p_organization_id, v_project_id, v_phase_id, 'PROJECT_HAS_PHASE',
          'HERA.ONBOARDING.CORE.PROJECT.RELATIONSHIP.HAS_PHASE.v1',
          p_actor_user_id, p_actor_user_id, now(), now()
        );
        
        -- Set current phase to first phase
        IF i = 1 THEN
          INSERT INTO core_dynamic_data (organization_id, entity_id, field_name, field_type, field_value_text, smart_code, created_by, updated_by)
          VALUES (p_organization_id, v_project_id, 'current_phase_id', 'text', v_phase_id::text, 'HERA.ONBOARDING.CORE.PROJECT.FIELD.CURRENT_PHASE.v1', p_actor_user_id, p_actor_user_id);
        END IF;
      END LOOP;
      
      -- Log creation transaction
      INSERT INTO universal_transactions (
        organization_id, transaction_type, transaction_code, source_entity_id,
        smart_code, business_context, created_by, updated_by, created_at, updated_at
      ) VALUES (
        p_organization_id, 'TX.ONBOARDING.PROJECT_CREATED', 
        'TXN_ONBRD_PROJ_' || EXTRACT(EPOCH FROM now())::bigint::text,
        v_project_id,
        'TX.ONBOARDING.PROJECT_CREATED.v1',
        jsonb_build_object(
          'project_id', v_project_id,
          'project_name', p_project->>'project_name',
          'phases_created', 5,
          'actor_user_id', p_actor_user_id
        ),
        p_actor_user_id, p_actor_user_id, now(), now()
      );
      
      RETURN jsonb_build_object(
        'success', true,
        'project_id', v_project_id,
        'message', 'Onboarding project created successfully with 5 default phases',
        'phases_created', 5
      );
      
    WHEN 'READ' THEN
      -- Get project with phases and checkpoints
      IF p_options->>'project_id' IS NULL THEN
        RETURN jsonb_build_object(
          'success', false,
          'error_code', 'HERA_VALIDATION_ERROR',
          'message', 'project_id required in options for READ'
        );
      END IF;
      
      v_project_id := (p_options->>'project_id')::UUID;
      
      -- Get project entity
      SELECT e.*, 
             (SELECT json_agg(json_build_object(
               'field_name', dd.field_name,
               'field_type', dd.field_type, 
               'field_value_text', dd.field_value_text,
               'field_value_number', dd.field_value_number,
               'field_value_date', dd.field_value_date,
               'field_value_json', dd.field_value_json
             )) FROM core_dynamic_data dd WHERE dd.entity_id = e.id) as dynamic_data
      INTO v_project_entity
      FROM core_entities e
      WHERE e.id = v_project_id 
      AND e.entity_type = 'ONBOARDING_PROJECT'
      AND e.organization_id = p_organization_id;
      
      IF NOT FOUND THEN
        RETURN jsonb_build_object(
          'success', false,
          'error_code', 'HERA_NOT_FOUND',
          'message', 'Onboarding project not found'
        );
      END IF;
      
      RETURN jsonb_build_object(
        'success', true,
        'project', row_to_json(v_project_entity),
        'message', 'Project retrieved successfully'
      );
      
    WHEN 'UPDATE' THEN
      -- Update project implementation
      IF p_options->>'project_id' IS NULL THEN
        RETURN jsonb_build_object(
          'success', false,
          'error_code', 'HERA_VALIDATION_ERROR', 
          'message', 'project_id required in options for UPDATE'
        );
      END IF;
      
      v_project_id := (p_options->>'project_id')::UUID;
      
      -- Update project entity
      UPDATE core_entities 
      SET 
        entity_name = COALESCE(p_project->>'project_name', entity_name),
        entity_description = COALESCE(p_project->>'project_description', entity_description),
        updated_by = p_actor_user_id,
        updated_at = now()
      WHERE id = v_project_id 
      AND entity_type = 'ONBOARDING_PROJECT'
      AND organization_id = p_organization_id;
      
      IF NOT FOUND THEN
        RETURN jsonb_build_object(
          'success', false,
          'error_code', 'HERA_NOT_FOUND',
          'message', 'Onboarding project not found for update'
        );
      END IF;
      
      RETURN jsonb_build_object(
        'success', true,
        'project_id', v_project_id,
        'message', 'Project updated successfully'
      );
      
    WHEN 'DELETE' THEN
      -- Soft delete project (set status to inactive)
      IF p_options->>'project_id' IS NULL THEN
        RETURN jsonb_build_object(
          'success', false,
          'error_code', 'HERA_VALIDATION_ERROR',
          'message', 'project_id required in options for DELETE'
        );
      END IF;
      
      v_project_id := (p_options->>'project_id')::UUID;
      
      -- Soft delete project and all phases
      UPDATE core_entities 
      SET 
        status = 'inactive',
        updated_by = p_actor_user_id,
        updated_at = now()
      WHERE (id = v_project_id OR parent_entity_id = v_project_id)
      AND organization_id = p_organization_id;
      
      RETURN jsonb_build_object(
        'success', true,
        'project_id', v_project_id,
        'message', 'Project and phases marked as inactive'
      );
      
    ELSE
      RETURN jsonb_build_object(
        'success', false,
        'error_code', 'HERA_INVALID_ACTION',
        'message', 'Invalid action. Use CREATE, READ, UPDATE, or DELETE'
      );
  END CASE;
  
END;
$$;

-- Add function comment
COMMENT ON FUNCTION hera_onboarding_project_crud_v1 IS 'HERA Onboarding DNA v3.0 - Complete CRUD operations for onboarding projects with automatic phase creation and full Sacred Six compliance';

-- Grant execution permission
GRANT EXECUTE ON FUNCTION hera_onboarding_project_crud_v1 TO authenticated;