/**
 * HERA AGRO - Inventory Domain
 * Smart Code: HERA.AGRO.DOMAIN.INVENTORY.v1
 *
 * Creates complete inventory management domain for agro with:
 * - Inventory domain
 * - Movements section (stock transfers, adjustments)
 * - Storage section (warehouses, bins, locations)
 * - Stock section (current stock levels)
 *
 * Target URLs:
 * /agro/domains/inventory/sections/movements
 * /agro/domains/inventory/sections/storage
 * /agro/domains/inventory/sections/stock
 */

DO $$
DECLARE
  v_system_user_id uuid := '00000000-0000-0000-0000-000000000001'; -- System user UUID
  v_app_id uuid;
  v_domain_id uuid;
  v_section_id uuid;
  v_workspace_id uuid;
BEGIN

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '📦 HERA AGRO - INVENTORY DOMAIN SETUP';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- =====================================================
  -- Get AGRO APP
  -- =====================================================

  SELECT id INTO v_app_id
  FROM core_entities
  WHERE entity_type = 'APP'
    AND entity_code = 'agro'
    AND organization_id = '00000000-0000-0000-0000-000000000000';

  IF v_app_id IS NULL THEN
    RAISE EXCEPTION 'AGRO app not found. Please run create-agro-workspaces-complete.sql first.';
  END IF;

  RAISE NOTICE '✅ Found AGRO APP: %', v_app_id;

  -- =====================================================
  -- DOMAIN: INVENTORY
  -- =====================================================

  RAISE NOTICE '';
  RAISE NOTICE '📦 Creating INVENTORY Domain...';

  INSERT INTO core_entities (
    entity_type, entity_code, entity_name, smart_code, metadata,
    organization_id, created_by, updated_by
  ) VALUES (
    'APP_DOMAIN', 'inventory', 'Inventory Management', 'HERA.AGRO.DOMAIN.INVENTORY.v1',
    '{"slug":"inventory","icon":"Package","color":"#6366f1","description":"Manage stock levels, movements, and storage"}'::jsonb,
    '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_domain_id;

  IF v_domain_id IS NULL THEN
    SELECT id INTO v_domain_id FROM core_entities WHERE entity_code = 'inventory' AND entity_type = 'APP_DOMAIN' AND organization_id = '00000000-0000-0000-0000-000000000000';
  END IF;

  -- Link to APP
  INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
  VALUES (v_app_id, v_domain_id, 'APP_HAS_DOMAIN', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id)
  ON CONFLICT DO NOTHING;

  RAISE NOTICE '✅ Created INVENTORY domain: %', v_domain_id;

  -- =====================================================
  -- SECTION 1: MOVEMENTS
  -- =====================================================

  RAISE NOTICE '';
  RAISE NOTICE '📦 Creating MOVEMENTS Section...';

  INSERT INTO core_entities (
    entity_type, entity_code, entity_name, smart_code, metadata, parent_entity_id,
    organization_id, created_by, updated_by
  ) VALUES (
    'APP_SECTION', 'movements', 'Stock Movements', 'HERA.AGRO.SECTION.INVENTORY.MOVEMENTS.v1',
    '{"slug":"movements","icon":"TrendingUp","description":"Track stock movements, transfers, and adjustments"}'::jsonb,
    v_domain_id, '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_section_id;

  IF v_section_id IS NULL THEN
    SELECT id INTO v_section_id FROM core_entities
    WHERE entity_code = 'movements' AND entity_type = 'APP_SECTION' AND parent_entity_id = v_domain_id;
  END IF;

  INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
  VALUES (v_domain_id, v_section_id, 'HAS_SECTION', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id)
  ON CONFLICT DO NOTHING;

  -- Workspace: Main
  INSERT INTO core_entities (
    entity_type, entity_code, entity_name, smart_code, metadata, parent_entity_id,
    organization_id, created_by, updated_by
  ) VALUES (
    'APP_WORKSPACE', 'main', 'Stock Movements Workspace', 'HERA.AGRO.WORKSPACE.MOVEMENTS.MAIN.v1',
    '{"slug":"main","icon":"TrendingUp","color":"#8b5cf6","subtitle":"Track and manage inventory movements","persona_label":"Warehouse Manager","visible_roles":["farm_manager","warehouse_staff","admin"],"default_nav":"movements"}'::jsonb,
    v_section_id, '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_workspace_id;

  IF v_workspace_id IS NULL THEN
    SELECT id INTO v_workspace_id FROM core_entities
    WHERE entity_code = 'main' AND entity_type = 'APP_WORKSPACE' AND parent_entity_id = v_section_id;
  END IF;

  INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
  VALUES (v_section_id, v_workspace_id, 'HAS_WORKSPACE', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_json, smart_code, organization_id, created_by, updated_by)
  VALUES (
    v_workspace_id, 'cards', 'json',
    '[
      {"label":"Stock Transfers","description":"Transfer inventory between locations","icon":"ArrowRightLeft","color":"blue","target_type":"transaction","view_slug":"transfers","status":"active","priority":"high","metrics":{"value":"0","label":"Pending Transfers","trend":"neutral"}},
      {"label":"Stock Adjustments","description":"Adjust inventory quantities","icon":"Settings","color":"purple","target_type":"transaction","view_slug":"adjustments","status":"active","priority":"high"},
      {"label":"Movement History","description":"View complete movement history","icon":"History","color":"indigo","target_type":"analytics","view_slug":"movement-history","status":"active","priority":"medium"},
      {"label":"Storage Locations","description":"Manage warehouse locations","icon":"MapPin","color":"green","target_type":"entity","entity_type":"LOCATION","view_slug":"locations","status":"active","priority":"medium"},
      {"label":"Batch Tracking","description":"Track inventory by batch/serial","icon":"Tag","color":"yellow","target_type":"entity","entity_type":"BATCH","view_slug":"batches","status":"active","priority":"medium"},
      {"label":"Movement Reports","description":"Inventory movement analytics","icon":"BarChart3","color":"blue","target_type":"report","view_slug":"movement-reports","status":"active","priority":"low"}
    ]'::jsonb,
    'HERA.AGRO.WORKSPACE.MOVEMENTS.CARDS.v1', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING;

  RAISE NOTICE '  ✅ movements section with workspace';

  -- =====================================================
  -- SECTION 2: STORAGE
  -- =====================================================

  RAISE NOTICE '';
  RAISE NOTICE '🏢 Creating STORAGE Section...';

  INSERT INTO core_entities (
    entity_type, entity_code, entity_name, smart_code, metadata, parent_entity_id,
    organization_id, created_by, updated_by
  ) VALUES (
    'APP_SECTION', 'storage', 'Storage Management', 'HERA.AGRO.SECTION.INVENTORY.STORAGE.v1',
    '{"slug":"storage","icon":"Warehouse","description":"Manage warehouses, silos, and storage locations"}'::jsonb,
    v_domain_id, '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_section_id;

  IF v_section_id IS NULL THEN
    SELECT id INTO v_section_id FROM core_entities
    WHERE entity_code = 'storage' AND entity_type = 'APP_SECTION' AND parent_entity_id = v_domain_id;
  END IF;

  INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
  VALUES (v_domain_id, v_section_id, 'HAS_SECTION', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO core_entities (
    entity_type, entity_code, entity_name, smart_code, metadata, parent_entity_id,
    organization_id, created_by, updated_by
  ) VALUES (
    'APP_WORKSPACE', 'main', 'Storage Management Workspace', 'HERA.AGRO.WORKSPACE.STORAGE.MAIN.v1',
    '{"slug":"main","icon":"Warehouse","color":"#14b8a6","subtitle":"Manage storage facilities and locations","persona_label":"Storage Manager","visible_roles":["farm_manager","warehouse_manager"],"default_nav":"warehouses"}'::jsonb,
    v_section_id, '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_workspace_id;

  IF v_workspace_id IS NULL THEN
    SELECT id INTO v_workspace_id FROM core_entities
    WHERE entity_code = 'main' AND entity_type = 'APP_WORKSPACE' AND parent_entity_id = v_section_id;
  END IF;

  INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
  VALUES (v_section_id, v_workspace_id, 'HAS_WORKSPACE', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_json, smart_code, organization_id, created_by, updated_by)
  VALUES (
    v_workspace_id, 'cards', 'json',
    '[
      {"label":"Warehouses","description":"All storage facilities","icon":"Building","color":"teal","target_type":"entity","entity_type":"WAREHOUSE","view_slug":"warehouses","status":"active","priority":"high"},
      {"label":"Silos & Bins","description":"Grain storage units","icon":"Database","color":"green","target_type":"entity","entity_type":"SILO","view_slug":"silos","status":"active","priority":"high"},
      {"label":"Storage Zones","description":"Warehouse zones and sections","icon":"Grid3x3","color":"blue","target_type":"entity","entity_type":"ZONE","view_slug":"zones","status":"active","priority":"medium"},
      {"label":"Capacity Planning","description":"Storage utilization analysis","icon":"PieChart","color":"purple","target_type":"analytics","view_slug":"capacity","status":"active","priority":"medium"},
      {"label":"Cold Storage","description":"Temperature-controlled facilities","icon":"Snowflake","color":"cyan","target_type":"entity","entity_type":"COLD_STORAGE","view_slug":"cold-storage","status":"active","priority":"medium"},
      {"label":"Storage Conditions","description":"Monitor temperature & humidity","icon":"Thermometer","color":"red","target_type":"analytics","view_slug":"conditions","status":"active","priority":"high"}
    ]'::jsonb,
    'HERA.AGRO.WORKSPACE.STORAGE.CARDS.v1', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING;

  RAISE NOTICE '  ✅ storage section with workspace';

  -- =====================================================
  -- SECTION 3: STOCK
  -- =====================================================

  RAISE NOTICE '';
  RAISE NOTICE '📊 Creating STOCK Section...';

  INSERT INTO core_entities (
    entity_type, entity_code, entity_name, smart_code, metadata, parent_entity_id,
    organization_id, created_by, updated_by
  ) VALUES (
    'APP_SECTION', 'stock', 'Stock Levels', 'HERA.AGRO.SECTION.INVENTORY.STOCK.v1',
    '{"slug":"stock","icon":"Package","description":"Monitor current stock levels and availability"}'::jsonb,
    v_domain_id, '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_section_id;

  IF v_section_id IS NULL THEN
    SELECT id INTO v_section_id FROM core_entities
    WHERE entity_code = 'stock' AND entity_type = 'APP_SECTION' AND parent_entity_id = v_domain_id;
  END IF;

  INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
  VALUES (v_domain_id, v_section_id, 'HAS_SECTION', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO core_entities (
    entity_type, entity_code, entity_name, smart_code, metadata, parent_entity_id,
    organization_id, created_by, updated_by
  ) VALUES (
    'APP_WORKSPACE', 'main', 'Stock Levels Workspace', 'HERA.AGRO.WORKSPACE.STOCK.MAIN.v1',
    '{"slug":"main","icon":"Package","color":"#10b981","subtitle":"Monitor current inventory levels","persona_label":"Inventory Manager","visible_roles":["farm_manager","warehouse_staff"],"default_nav":"overview"}'::jsonb,
    v_section_id, '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_workspace_id;

  IF v_workspace_id IS NULL THEN
    SELECT id INTO v_workspace_id FROM core_entities
    WHERE entity_code = 'main' AND entity_type = 'APP_WORKSPACE' AND parent_entity_id = v_section_id;
  END IF;

  INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
  VALUES (v_section_id, v_workspace_id, 'HAS_WORKSPACE', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_json, smart_code, organization_id, created_by, updated_by)
  VALUES (
    v_workspace_id, 'cards', 'json',
    '[
      {"label":"Current Stock","description":"All items in inventory","icon":"Package","color":"green","target_type":"entity","entity_type":"STOCK","view_slug":"current","status":"active","priority":"high","metrics":{"value":"0","label":"Items","trend":"neutral"}},
      {"label":"Low Stock Alerts","description":"Items below reorder point","icon":"AlertTriangle","color":"red","target_type":"analytics","view_slug":"low-stock","status":"active","priority":"high","metrics":{"value":"0","label":"Low Stock"}},
      {"label":"Stock by Location","description":"Inventory per warehouse","icon":"MapPin","color":"blue","target_type":"analytics","view_slug":"by-location","status":"active","priority":"medium"},
      {"label":"Stock by Category","description":"Inventory breakdown by type","icon":"Grid3x3","color":"purple","target_type":"analytics","view_slug":"by-category","status":"active","priority":"medium"},
      {"label":"Stock Valuation","description":"Total inventory value","icon":"DollarSign","color":"yellow","target_type":"analytics","view_slug":"valuation","status":"active","priority":"medium"},
      {"label":"Expiry Tracking","description":"Items approaching expiry","icon":"Clock","color":"orange","target_type":"analytics","view_slug":"expiry","status":"active","priority":"high"}
    ]'::jsonb,
    'HERA.AGRO.WORKSPACE.STOCK.CARDS.v1', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING;

  RAISE NOTICE '  ✅ stock section with workspace';

  -- =====================================================
  -- FINAL SUMMARY
  -- =====================================================

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 INVENTORY DOMAIN CREATED!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Created Structure:';
  RAISE NOTICE '  • 1 Domain (inventory)';
  RAISE NOTICE '  • 3 Sections (movements, storage, stock)';
  RAISE NOTICE '  • 3 Workspaces';
  RAISE NOTICE '  • 18 Workspace Cards';
  RAISE NOTICE '';
  RAISE NOTICE '🌐 Access URLs:';
  RAISE NOTICE '  /agro/domains/inventory/sections/movements';
  RAISE NOTICE '  /agro/domains/inventory/sections/storage';
  RAISE NOTICE '  /agro/domains/inventory/sections/stock';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';

END $$;
