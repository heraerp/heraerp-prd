/**
 * Create Inventory Movements Workspace
 * URL: /retail/domains/inventory/sections/movements
 *
 * This script creates the complete workspace hierarchy:
 * APP (retail) → DOMAIN (inventory) → SECTION (movements) → WORKSPACE (main)
 */

-- =====================================================
-- STEP 1: Get or Create APP entity (retail)
-- =====================================================
DO $$
DECLARE
  v_app_id uuid;
  v_domain_id uuid;
  v_section_id uuid;
  v_workspace_id uuid;
BEGIN
  -- Get APP entity (retail should already exist)
  SELECT id INTO v_app_id
  FROM core_entities
  WHERE entity_type = 'APP'
    AND entity_code = 'retail'
    AND organization_id = '00000000-0000-0000-0000-000000000000';

  -- If APP doesn't exist, create it
  IF v_app_id IS NULL THEN
    INSERT INTO core_entities (
      entity_type,
      entity_code,
      entity_name,
      smart_code,
      organization_id,
      created_by,
      updated_by
    ) VALUES (
      'APP',
      'retail',
      'Retail Application',
      'HERA.RETAIL.APP.v1',
      '00000000-0000-0000-0000-000000000000',
      'system',
      'system'
    ) RETURNING id INTO v_app_id;

    RAISE NOTICE '✅ Created APP entity: %', v_app_id;
  ELSE
    RAISE NOTICE '✅ Found existing APP entity: %', v_app_id;
  END IF;

  -- =====================================================
  -- STEP 2: Get or Create DOMAIN entity (inventory)
  -- =====================================================
  SELECT id INTO v_domain_id
  FROM core_entities
  WHERE entity_type = 'APP_DOMAIN'
    AND entity_code = 'inventory'
    AND organization_id = '00000000-0000-0000-0000-000000000000';

  IF v_domain_id IS NULL THEN
    INSERT INTO core_entities (
      entity_type,
      entity_code,
      entity_name,
      smart_code,
      metadata,
      organization_id,
      created_by,
      updated_by
    ) VALUES (
      'APP_DOMAIN',
      'inventory',
      'Inventory Management',
      'HERA.RETAIL.DOMAIN.INVENTORY.v1',
      jsonb_build_object(
        'slug', 'inventory',
        'icon', 'Package',
        'color', '#6366f1',
        'description', 'Manage inventory, stock levels, and movements'
      ),
      '00000000-0000-0000-0000-000000000000',
      'system',
      'system'
    ) RETURNING id INTO v_domain_id;

    RAISE NOTICE '✅ Created DOMAIN entity: %', v_domain_id;
  ELSE
    RAISE NOTICE '✅ Found existing DOMAIN entity: %', v_domain_id;
  END IF;

  -- Create APP_HAS_DOMAIN relationship if not exists
  IF NOT EXISTS (
    SELECT 1 FROM core_relationships
    WHERE from_entity_id = v_app_id
      AND to_entity_id = v_domain_id
      AND relationship_type = 'APP_HAS_DOMAIN'
  ) THEN
    INSERT INTO core_relationships (
      from_entity_id,
      to_entity_id,
      relationship_type,
      organization_id,
      created_by,
      updated_by
    ) VALUES (
      v_app_id,
      v_domain_id,
      'APP_HAS_DOMAIN',
      '00000000-0000-0000-0000-000000000000',
      'system',
      'system'
    );

    RAISE NOTICE '✅ Created APP_HAS_DOMAIN relationship';
  END IF;

  -- =====================================================
  -- STEP 3: Get or Create SECTION entity (movements)
  -- =====================================================
  SELECT id INTO v_section_id
  FROM core_entities
  WHERE entity_type = 'APP_SECTION'
    AND entity_code = 'movements'
    AND organization_id = '00000000-0000-0000-0000-000000000000';

  IF v_section_id IS NULL THEN
    INSERT INTO core_entities (
      entity_type,
      entity_code,
      entity_name,
      smart_code,
      metadata,
      parent_entity_id,
      organization_id,
      created_by,
      updated_by
    ) VALUES (
      'APP_SECTION',
      'movements',
      'Inventory Movements',
      'HERA.RETAIL.SECTION.INVENTORY.MOVEMENTS.v1',
      jsonb_build_object(
        'slug', 'movements',
        'icon', 'TrendingUp',
        'description', 'Track stock movements, transfers, and adjustments'
      ),
      v_domain_id,  -- Set parent to domain
      '00000000-0000-0000-0000-000000000000',
      'system',
      'system'
    ) RETURNING id INTO v_section_id;

    RAISE NOTICE '✅ Created SECTION entity: %', v_section_id;
  ELSE
    RAISE NOTICE '✅ Found existing SECTION entity: %', v_section_id;
  END IF;

  -- Create HAS_SECTION relationship if not exists
  IF NOT EXISTS (
    SELECT 1 FROM core_relationships
    WHERE from_entity_id = v_domain_id
      AND to_entity_id = v_section_id
      AND relationship_type = 'HAS_SECTION'
  ) THEN
    INSERT INTO core_relationships (
      from_entity_id,
      to_entity_id,
      relationship_type,
      organization_id,
      created_by,
      updated_by
    ) VALUES (
      v_domain_id,
      v_section_id,
      'HAS_SECTION',
      '00000000-0000-0000-0000-000000000000',
      'system',
      'system'
    );

    RAISE NOTICE '✅ Created HAS_SECTION relationship';
  END IF;

  -- =====================================================
  -- STEP 4: Get or Create WORKSPACE entity (main)
  -- =====================================================
  SELECT id INTO v_workspace_id
  FROM core_entities
  WHERE entity_type = 'APP_WORKSPACE'
    AND entity_code = 'main'
    AND parent_entity_id = v_section_id
    AND organization_id = '00000000-0000-0000-0000-000000000000';

  IF v_workspace_id IS NULL THEN
    INSERT INTO core_entities (
      entity_type,
      entity_code,
      entity_name,
      smart_code,
      metadata,
      parent_entity_id,
      organization_id,
      created_by,
      updated_by
    ) VALUES (
      'APP_WORKSPACE',
      'main',
      'Inventory Movements Workspace',
      'HERA.RETAIL.WORKSPACE.INVENTORY.MOVEMENTS.MAIN.v1',
      jsonb_build_object(
        'slug', 'main',
        'icon', 'Package',
        'color', '#8b5cf6',
        'subtitle', 'Track and manage inventory movements',
        'persona_label', 'Warehouse Manager',
        'visible_roles', array['manager', 'warehouse_staff', 'admin'],
        'default_nav', 'movements'
      ),
      v_section_id,  -- Set parent to section
      '00000000-0000-0000-0000-000000000000',
      'system',
      'system'
    ) RETURNING id INTO v_workspace_id;

    RAISE NOTICE '✅ Created WORKSPACE entity: %', v_workspace_id;
  ELSE
    RAISE NOTICE '✅ Found existing WORKSPACE entity: %', v_workspace_id;
  END IF;

  -- Create HAS_WORKSPACE relationship if not exists
  IF NOT EXISTS (
    SELECT 1 FROM core_relationships
    WHERE from_entity_id = v_section_id
      AND to_entity_id = v_workspace_id
      AND relationship_type = 'HAS_WORKSPACE'
  ) THEN
    INSERT INTO core_relationships (
      from_entity_id,
      to_entity_id,
      relationship_type,
      organization_id,
      created_by,
      updated_by
    ) VALUES (
      v_section_id,
      v_workspace_id,
      'HAS_WORKSPACE',
      '00000000-0000-0000-0000-000000000000',
      'system',
      'system'
    );

    RAISE NOTICE '✅ Created HAS_WORKSPACE relationship';
  END IF;

  -- =====================================================
  -- STEP 5: Add Layout Configuration (Workspace Cards)
  -- =====================================================

  -- Check if layout config already exists
  IF NOT EXISTS (
    SELECT 1 FROM core_dynamic_data
    WHERE entity_id = v_workspace_id
      AND field_name = 'cards'
  ) THEN
    INSERT INTO core_dynamic_data (
      entity_id,
      field_name,
      field_type,
      field_value_json,
      smart_code,
      organization_id,
      created_by,
      updated_by
    ) VALUES (
      v_workspace_id,
      'cards',
      'json',
      jsonb_build_array(
        jsonb_build_object(
          'label', 'Stock Transfers',
          'description', 'Transfer inventory between locations',
          'icon', 'ArrowRightLeft',
          'color', 'blue',
          'target_type', 'transactions',
          'view_slug', 'transfers',
          'status', 'active',
          'priority', 'high',
          'metrics', jsonb_build_object(
            'value', '0',
            'label', 'Pending Transfers',
            'trend', 'neutral'
          )
        ),
        jsonb_build_object(
          'label', 'Stock Adjustments',
          'description', 'Adjust inventory quantities',
          'icon', 'Settings',
          'color', 'purple',
          'target_type', 'transactions',
          'view_slug', 'adjustments',
          'status', 'active',
          'priority', 'high'
        ),
        jsonb_build_object(
          'label', 'Movement History',
          'description', 'View complete movement history',
          'icon', 'History',
          'color', 'indigo',
          'target_type', 'analytics',
          'view_slug', 'movement-history',
          'status', 'active',
          'priority', 'medium'
        ),
        jsonb_build_object(
          'label', 'Locations',
          'description', 'Manage warehouse locations',
          'icon', 'MapPin',
          'color', 'green',
          'target_type', 'entities',
          'entity_type', 'LOCATION',
          'view_slug', 'locations',
          'status', 'active',
          'priority', 'medium'
        ),
        jsonb_build_object(
          'label', 'Movement Reports',
          'description', 'Inventory movement analytics',
          'icon', 'BarChart3',
          'color', 'blue',
          'target_type', 'report',
          'view_slug', 'movement-reports',
          'status', 'active',
          'priority', 'low'
        ),
        jsonb_build_object(
          'label', 'Batch Tracking',
          'description', 'Track inventory by batch/serial',
          'icon', 'Tag',
          'color', 'yellow',
          'target_type', 'entities',
          'entity_type', 'BATCH',
          'view_slug', 'batches',
          'status', 'active',
          'priority', 'medium'
        )
      ),
      'HERA.RETAIL.WORKSPACE.INVENTORY.MOVEMENTS.CARDS.v1',
      '00000000-0000-0000-0000-000000000000',
      'system',
      'system'
    );

    RAISE NOTICE '✅ Created workspace cards configuration';
  END IF;

  -- =====================================================
  -- SUMMARY
  -- =====================================================
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 WORKSPACE CREATED SUCCESSFULLY!';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'URL: /retail/domains/inventory/sections/movements';
  RAISE NOTICE 'API: /api/v2/inventory/movements/main';
  RAISE NOTICE '';
  RAISE NOTICE 'Entity IDs:';
  RAISE NOTICE '  APP:       %', v_app_id;
  RAISE NOTICE '  DOMAIN:    %', v_domain_id;
  RAISE NOTICE '  SECTION:   %', v_section_id;
  RAISE NOTICE '  WORKSPACE: %', v_workspace_id;
  RAISE NOTICE '========================================';

END $$;
