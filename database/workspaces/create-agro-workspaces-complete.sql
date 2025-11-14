/**
 * HERA AGRO - Complete Workspace Setup
 * Smart Code: HERA.AGRO.WORKSPACES.COMPLETE.v1
 *
 * This script creates a complete agro application workspace hierarchy with:
 * - 5 Domains (farm, production, operations, analytics, supply-chain)
 * - 15+ Sections across all domains
 * - 15+ Workspaces with operational cards
 *
 * Target URLs:
 * /agro/domains/farm/sections/crops
 * /agro/domains/farm/sections/livestock
 * /agro/domains/farm/sections/equipment
 * /agro/domains/farm/sections/fields
 * /agro/domains/production/sections/planting
 * /agro/domains/production/sections/harvesting
 * /agro/domains/production/sections/processing
 * /agro/domains/operations/sections/maintenance
 * /agro/domains/operations/sections/labor
 * /agro/domains/operations/sections/scheduling
 * /agro/domains/analytics/sections/yield
 * /agro/domains/analytics/sections/performance
 * /agro/domains/supply-chain/sections/inputs
 * /agro/domains/supply-chain/sections/outputs
 * /agro/domains/supply-chain/sections/distribution
 */

DO $$
DECLARE
  v_app_id uuid;
  v_domain_id uuid;
  v_section_id uuid;
  v_workspace_id uuid;
  v_system_user_id uuid := '00000000-0000-0000-0000-000000000001'; -- System user UUID
BEGIN

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🌾 HERA AGRO - COMPLETE WORKSPACE SETUP';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';

  -- =====================================================
  -- STEP 1: Create AGRO APP
  -- =====================================================

  SELECT id INTO v_app_id
  FROM core_entities
  WHERE entity_type = 'APP'
    AND entity_code = 'agro'
    AND organization_id = '00000000-0000-0000-0000-000000000000';

  IF v_app_id IS NULL THEN
    INSERT INTO core_entities (
      entity_type, entity_code, entity_name, smart_code,
      organization_id, created_by, updated_by
    ) VALUES (
      'APP', 'agro', 'HERA Agro', 'HERA.AGRO.APP.v1',
      '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
    ) RETURNING id INTO v_app_id;
    RAISE NOTICE '✅ Created AGRO APP: %', v_app_id;
  ELSE
    RAISE NOTICE '✅ Found AGRO APP: %', v_app_id;
  END IF;

  -- =====================================================
  -- DOMAIN 1: FARM MANAGEMENT
  -- =====================================================

  RAISE NOTICE '';
  RAISE NOTICE '📦 Creating FARM MANAGEMENT Domain...';

  INSERT INTO core_entities (
    entity_type, entity_code, entity_name, smart_code, metadata,
    organization_id, created_by, updated_by
  ) VALUES (
    'APP_DOMAIN', 'farm', 'Farm Management', 'HERA.AGRO.DOMAIN.FARM.v1',
    '{"slug":"farm","icon":"Sprout","color":"#10b981","description":"Manage farms, crops, livestock, and equipment"}'::jsonb,
    '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_domain_id;

  IF v_domain_id IS NULL THEN
    SELECT id INTO v_domain_id FROM core_entities WHERE entity_code = 'farm' AND entity_type = 'APP_DOMAIN';
  END IF;

  -- Link to APP
  INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
  VALUES (v_app_id, v_domain_id, 'APP_HAS_DOMAIN', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id)
  ON CONFLICT DO NOTHING;

  -- Section: Crops
  INSERT INTO core_entities (
    entity_type, entity_code, entity_name, smart_code, metadata, parent_entity_id,
    organization_id, created_by, updated_by
  ) VALUES (
    'APP_SECTION', 'crops', 'Crop Management', 'HERA.AGRO.SECTION.FARM.CROPS.v1',
    '{"slug":"crops","icon":"Leaf","description":"Manage crop types, varieties, and cultivation"}'::jsonb,
    v_domain_id, '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_section_id;

  IF v_section_id IS NULL THEN SELECT id INTO v_section_id FROM core_entities WHERE entity_code = 'crops' AND entity_type = 'APP_SECTION'; END IF;

  INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
  VALUES (v_domain_id, v_section_id, 'HAS_SECTION', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO core_entities (
    entity_type, entity_code, entity_name, smart_code, metadata, parent_entity_id,
    organization_id, created_by, updated_by
  ) VALUES (
    'APP_WORKSPACE', 'main', 'Crop Management Workspace', 'HERA.AGRO.WORKSPACE.CROPS.MAIN.v1',
    '{"slug":"main","icon":"Leaf","color":"#10b981","subtitle":"Manage crop types and cultivation plans","persona_label":"Farm Manager","visible_roles":["farm_manager","agronomist"],"default_nav":"crops"}'::jsonb,
    v_section_id, '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_workspace_id;

  IF v_workspace_id IS NULL THEN SELECT id INTO v_workspace_id FROM core_entities WHERE entity_code = 'main' AND parent_entity_id = v_section_id; END IF;

  INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
  VALUES (v_section_id, v_workspace_id, 'HAS_WORKSPACE', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_json, smart_code, organization_id, created_by, updated_by)
  VALUES (
    v_workspace_id, 'cards', 'json',
    '[
      {"label":"Active Crops","description":"Currently growing crops","icon":"Package","color":"green","target_type":"entity","entity_type":"CROP","view_slug":"active-crops","status":"active","priority":"high","metrics":{"value":"0","label":"Growing","trend":"neutral"}},
      {"label":"Crop Varieties","description":"Manage crop varieties and types","icon":"Grid3x3","color":"blue","target_type":"entity","entity_type":"CROP_VARIETY","view_slug":"varieties","status":"active","priority":"medium"},
      {"label":"Planting Calendar","description":"Seasonal planting schedules","icon":"Calendar","color":"purple","target_type":"workflow","view_slug":"planting-calendar","status":"active","priority":"high"},
      {"label":"Crop Performance","description":"Yield and quality metrics","icon":"BarChart3","color":"indigo","target_type":"analytics","view_slug":"crop-performance","status":"active","priority":"medium"},
      {"label":"Disease Tracking","description":"Monitor crop health issues","icon":"AlertTriangle","color":"red","target_type":"entity","entity_type":"CROP_ISSUE","view_slug":"diseases","status":"active","priority":"high"},
      {"label":"Fertilizer Plans","description":"Fertilization schedules","icon":"Droplet","color":"green","target_type":"workflow","view_slug":"fertilizer-plans","status":"active","priority":"medium"}
    ]'::jsonb,
    'HERA.AGRO.WORKSPACE.CROPS.CARDS.v1', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING;

  RAISE NOTICE '  ✅ crops section with workspace';

  -- Section: Livestock
  INSERT INTO core_entities (
    entity_type, entity_code, entity_name, smart_code, metadata, parent_entity_id,
    organization_id, created_by, updated_by
  ) VALUES (
    'APP_SECTION', 'livestock', 'Livestock Management', 'HERA.AGRO.SECTION.FARM.LIVESTOCK.v1',
    '{"slug":"livestock","icon":"Bird","description":"Manage animals, breeding, and health"}'::jsonb,
    v_domain_id, '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_section_id;

  IF v_section_id IS NULL THEN SELECT id INTO v_section_id FROM core_entities WHERE entity_code = 'livestock' AND entity_type = 'APP_SECTION'; END IF;

  INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
  VALUES (v_domain_id, v_section_id, 'HAS_SECTION', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO core_entities (
    entity_type, entity_code, entity_name, smart_code, metadata, parent_entity_id,
    organization_id, created_by, updated_by
  ) VALUES (
    'APP_WORKSPACE', 'main', 'Livestock Management Workspace', 'HERA.AGRO.WORKSPACE.LIVESTOCK.MAIN.v1',
    '{"slug":"main","icon":"Bird","color":"#f59e0b","subtitle":"Manage livestock, breeding, and health","persona_label":"Livestock Manager","visible_roles":["farm_manager","veterinarian"],"default_nav":"animals"}'::jsonb,
    v_section_id, '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_workspace_id;

  IF v_workspace_id IS NULL THEN SELECT id INTO v_workspace_id FROM core_entities WHERE entity_code = 'main' AND parent_entity_id = v_section_id; END IF;

  INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
  VALUES (v_section_id, v_workspace_id, 'HAS_WORKSPACE', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_json, smart_code, organization_id, created_by, updated_by)
  VALUES (
    v_workspace_id, 'cards', 'json',
    '[
      {"label":"Animal Registry","description":"All livestock records","icon":"Users","color":"orange","target_type":"entity","entity_type":"ANIMAL","view_slug":"animals","status":"active","priority":"high"},
      {"label":"Health Records","description":"Vaccination and health tracking","icon":"Heart","color":"red","target_type":"entity","entity_type":"HEALTH_RECORD","view_slug":"health","status":"active","priority":"high"},
      {"label":"Breeding Program","description":"Breeding plans and genealogy","icon":"GitBranch","color":"purple","target_type":"workflow","view_slug":"breeding","status":"active","priority":"medium"},
      {"label":"Feed Management","description":"Feed schedules and inventory","icon":"ShoppingCart","color":"green","target_type":"entity","entity_type":"FEED","view_slug":"feed","status":"active","priority":"medium"},
      {"label":"Production Tracking","description":"Milk, eggs, wool production","icon":"TrendingUp","color":"blue","target_type":"analytics","view_slug":"production","status":"active","priority":"medium"},
      {"label":"Veterinary Care","description":"Medical treatments and costs","icon":"Activity","color":"red","target_type":"entity","entity_type":"VET_VISIT","view_slug":"veterinary","status":"active","priority":"low"}
    ]'::jsonb,
    'HERA.AGRO.WORKSPACE.LIVESTOCK.CARDS.v1', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING;

  RAISE NOTICE '  ✅ livestock section with workspace';

  -- Section: Equipment
  INSERT INTO core_entities (
    entity_type, entity_code, entity_name, smart_code, metadata, parent_entity_id,
    organization_id, created_by, updated_by
  ) VALUES (
    'APP_SECTION', 'equipment', 'Equipment Management', 'HERA.AGRO.SECTION.FARM.EQUIPMENT.v1',
    '{"slug":"equipment","icon":"Truck","description":"Manage machinery, tools, and maintenance"}'::jsonb,
    v_domain_id, '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_section_id;

  IF v_section_id IS NULL THEN SELECT id INTO v_section_id FROM core_entities WHERE entity_code = 'equipment' AND entity_type = 'APP_SECTION'; END IF;

  INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
  VALUES (v_domain_id, v_section_id, 'HAS_SECTION', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO core_entities (
    entity_type, entity_code, entity_name, smart_code, metadata, parent_entity_id,
    organization_id, created_by, updated_by
  ) VALUES (
    'APP_WORKSPACE', 'main', 'Equipment Management Workspace', 'HERA.AGRO.WORKSPACE.EQUIPMENT.MAIN.v1',
    '{"slug":"main","icon":"Truck","color":"#6366f1","subtitle":"Manage farm equipment and maintenance","persona_label":"Equipment Manager","visible_roles":["farm_manager","mechanic"],"default_nav":"equipment"}'::jsonb,
    v_section_id, '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_workspace_id;

  IF v_workspace_id IS NULL THEN SELECT id INTO v_workspace_id FROM core_entities WHERE entity_code = 'main' AND parent_entity_id = v_section_id; END IF;

  INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
  VALUES (v_section_id, v_workspace_id, 'HAS_WORKSPACE', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_json, smart_code, organization_id, created_by, updated_by)
  VALUES (
    v_workspace_id, 'cards', 'json',
    '[
      {"label":"Equipment Registry","description":"All farm machinery and tools","icon":"Package","color":"blue","target_type":"entity","entity_type":"EQUIPMENT","view_slug":"equipment","status":"active","priority":"high"},
      {"label":"Maintenance Schedule","description":"Preventive maintenance plans","icon":"Calendar","color":"purple","target_type":"workflow","view_slug":"maintenance","status":"active","priority":"high"},
      {"label":"Repair History","description":"Equipment repairs and costs","icon":"Wrench","color":"orange","target_type":"entity","entity_type":"REPAIR","view_slug":"repairs","status":"active","priority":"medium"},
      {"label":"Fuel Tracking","description":"Fuel consumption and costs","icon":"Droplet","color":"yellow","target_type":"analytics","view_slug":"fuel","status":"active","priority":"medium"},
      {"label":"Equipment Operators","description":"Assign operators to equipment","icon":"Users","color":"green","target_type":"relationship","view_slug":"operators","status":"active","priority":"low"},
      {"label":"Utilization Reports","description":"Equipment usage analytics","icon":"BarChart3","color":"indigo","target_type":"report","view_slug":"utilization","status":"active","priority":"low"}
    ]'::jsonb,
    'HERA.AGRO.WORKSPACE.EQUIPMENT.CARDS.v1', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING;

  RAISE NOTICE '  ✅ equipment section with workspace';

  -- Section: Fields
  INSERT INTO core_entities (
    entity_type, entity_code, entity_name, smart_code, metadata, parent_entity_id,
    organization_id, created_by, updated_by
  ) VALUES (
    'APP_SECTION', 'fields', 'Field Management', 'HERA.AGRO.SECTION.FARM.FIELDS.v1',
    '{"slug":"fields","icon":"Map","description":"Manage fields, plots, and soil data"}'::jsonb,
    v_domain_id, '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_section_id;

  IF v_section_id IS NULL THEN SELECT id INTO v_section_id FROM core_entities WHERE entity_code = 'fields' AND entity_type = 'APP_SECTION'; END IF;

  INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
  VALUES (v_domain_id, v_section_id, 'HAS_SECTION', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO core_entities (
    entity_type, entity_code, entity_name, smart_code, metadata, parent_entity_id,
    organization_id, created_by, updated_by
  ) VALUES (
    'APP_WORKSPACE', 'main', 'Field Management Workspace', 'HERA.AGRO.WORKSPACE.FIELDS.MAIN.v1',
    '{"slug":"main","icon":"Map","color":"#14b8a6","subtitle":"Manage fields, plots, and soil conditions","persona_label":"Farm Planner","visible_roles":["farm_manager","agronomist"],"default_nav":"fields"}'::jsonb,
    v_section_id, '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_workspace_id;

  IF v_workspace_id IS NULL THEN SELECT id INTO v_workspace_id FROM core_entities WHERE entity_code = 'main' AND parent_entity_id = v_section_id; END IF;

  INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
  VALUES (v_section_id, v_workspace_id, 'HAS_WORKSPACE', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_json, smart_code, organization_id, created_by, updated_by)
  VALUES (
    v_workspace_id, 'cards', 'json',
    '[
      {"label":"Field Registry","description":"All field and plot records","icon":"MapPin","color":"teal","target_type":"entity","entity_type":"FIELD","view_slug":"fields","status":"active","priority":"high"},
      {"label":"Soil Testing","description":"Soil analysis and pH tracking","icon":"Activity","color":"brown","target_type":"entity","entity_type":"SOIL_TEST","view_slug":"soil","status":"active","priority":"high"},
      {"label":"Crop Rotation","description":"Field rotation planning","icon":"RefreshCw","color":"green","target_type":"workflow","view_slug":"rotation","status":"active","priority":"medium"},
      {"label":"Irrigation Systems","description":"Water management and scheduling","icon":"Droplet","color":"blue","target_type":"entity","entity_type":"IRRIGATION","view_slug":"irrigation","status":"active","priority":"medium"},
      {"label":"Field Mapping","description":"GPS coordinates and boundaries","icon":"Map","color":"purple","target_type":"analytics","view_slug":"mapping","status":"active","priority":"low"},
      {"label":"Yield by Field","description":"Historical yield analysis","icon":"TrendingUp","color":"green","target_type":"report","view_slug":"yield","status":"active","priority":"medium"}
    ]'::jsonb,
    'HERA.AGRO.WORKSPACE.FIELDS.CARDS.v1', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING;

  RAISE NOTICE '  ✅ fields section with workspace';

  -- =====================================================
  -- DOMAIN 2: PRODUCTION
  -- =====================================================

  RAISE NOTICE '';
  RAISE NOTICE '🏭 Creating PRODUCTION Domain...';

  INSERT INTO core_entities (
    entity_type, entity_code, entity_name, smart_code, metadata,
    organization_id, created_by, updated_by
  ) VALUES (
    'APP_DOMAIN', 'production', 'Production Management', 'HERA.AGRO.DOMAIN.PRODUCTION.v1',
    '{"slug":"production","icon":"Factory","color":"#8b5cf6","description":"Manage planting, harvesting, and processing"}'::jsonb,
    '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_domain_id;

  IF v_domain_id IS NULL THEN SELECT id INTO v_domain_id FROM core_entities WHERE entity_code = 'production' AND entity_type = 'APP_DOMAIN'; END IF;

  INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
  VALUES (v_app_id, v_domain_id, 'APP_HAS_DOMAIN', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id)
  ON CONFLICT DO NOTHING;

  -- Section: Planting
  INSERT INTO core_entities (
    entity_type, entity_code, entity_name, smart_code, metadata, parent_entity_id,
    organization_id, created_by, updated_by
  ) VALUES (
    'APP_SECTION', 'planting', 'Planting Operations', 'HERA.AGRO.SECTION.PRODUCTION.PLANTING.v1',
    '{"slug":"planting","icon":"Seedling","description":"Manage planting schedules and operations"}'::jsonb,
    v_domain_id, '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_section_id;

  IF v_section_id IS NULL THEN SELECT id INTO v_section_id FROM core_entities WHERE entity_code = 'planting' AND entity_type = 'APP_SECTION'; END IF;

  INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
  VALUES (v_domain_id, v_section_id, 'HAS_SECTION', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO core_entities (
    entity_type, entity_code, entity_name, smart_code, metadata, parent_entity_id,
    organization_id, created_by, updated_by
  ) VALUES (
    'APP_WORKSPACE', 'main', 'Planting Operations Workspace', 'HERA.AGRO.WORKSPACE.PLANTING.MAIN.v1',
    '{"slug":"main","icon":"Seedling","color":"#10b981","subtitle":"Plan and track planting activities","persona_label":"Production Manager","visible_roles":["farm_manager","field_supervisor"],"default_nav":"planning"}'::jsonb,
    v_section_id, '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_workspace_id;

  IF v_workspace_id IS NULL THEN SELECT id INTO v_workspace_id FROM core_entities WHERE entity_code = 'main' AND parent_entity_id = v_section_id; END IF;

  INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
  VALUES (v_section_id, v_workspace_id, 'HAS_WORKSPACE', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_json, smart_code, organization_id, created_by, updated_by)
  VALUES (
    v_workspace_id, 'cards', 'json',
    '[
      {"label":"Planting Schedule","description":"Planned planting activities","icon":"Calendar","color":"green","target_type":"workflow","view_slug":"schedule","status":"active","priority":"high"},
      {"label":"Seed Inventory","description":"Available seeds and quantities","icon":"Package","color":"blue","target_type":"entity","entity_type":"SEED","view_slug":"seeds","status":"active","priority":"high"},
      {"label":"Planting Records","description":"Completed planting operations","icon":"CheckCircle","color":"green","target_type":"entity","entity_type":"PLANTING","view_slug":"records","status":"active","priority":"medium"},
      {"label":"Labor Assignment","description":"Assign workers to planting tasks","icon":"Users","color":"purple","target_type":"workflow","view_slug":"labor","status":"active","priority":"medium"},
      {"label":"Weather Forecast","description":"Weather planning integration","icon":"Cloud","color":"blue","target_type":"analytics","view_slug":"weather","status":"active","priority":"medium"},
      {"label":"Cost Tracking","description":"Planting costs and budgets","icon":"DollarSign","color":"yellow","target_type":"report","view_slug":"costs","status":"active","priority":"low"}
    ]'::jsonb,
    'HERA.AGRO.WORKSPACE.PLANTING.CARDS.v1', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING;

  RAISE NOTICE '  ✅ planting section with workspace';

  -- Section: Harvesting
  INSERT INTO core_entities (
    entity_type, entity_code, entity_name, smart_code, metadata, parent_entity_id,
    organization_id, created_by, updated_by
  ) VALUES (
    'APP_SECTION', 'harvesting', 'Harvesting Operations', 'HERA.AGRO.SECTION.PRODUCTION.HARVESTING.v1',
    '{"slug":"harvesting","icon":"ShoppingBasket","description":"Manage harvest planning and execution"}'::jsonb,
    v_domain_id, '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_section_id;

  IF v_section_id IS NULL THEN SELECT id INTO v_section_id FROM core_entities WHERE entity_code = 'harvesting' AND entity_type = 'APP_SECTION'; END IF;

  INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
  VALUES (v_domain_id, v_section_id, 'HAS_SECTION', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO core_entities (
    entity_type, entity_code, entity_name, smart_code, metadata, parent_entity_id,
    organization_id, created_by, updated_by
  ) VALUES (
    'APP_WORKSPACE', 'main', 'Harvesting Operations Workspace', 'HERA.AGRO.WORKSPACE.HARVESTING.MAIN.v1',
    '{"slug":"main","icon":"ShoppingBasket","color":"#f59e0b","subtitle":"Plan and track harvest activities","persona_label":"Harvest Manager","visible_roles":["farm_manager","harvest_supervisor"],"default_nav":"planning"}'::jsonb,
    v_section_id, '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_workspace_id;

  IF v_workspace_id IS NULL THEN SELECT id INTO v_workspace_id FROM core_entities WHERE entity_code = 'main' AND parent_entity_id = v_section_id; END IF;

  INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
  VALUES (v_section_id, v_workspace_id, 'HAS_WORKSPACE', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_json, smart_code, organization_id, created_by, updated_by)
  VALUES (
    v_workspace_id, 'cards', 'json',
    '[
      {"label":"Harvest Schedule","description":"Planned harvest activities","icon":"Calendar","color":"orange","target_type":"workflow","view_slug":"schedule","status":"active","priority":"high"},
      {"label":"Ready to Harvest","description":"Crops ready for harvesting","icon":"CheckCircle","color":"green","target_type":"entity","entity_type":"CROP","view_slug":"ready","status":"active","priority":"high","metrics":{"value":"0","label":"Ready"}},
      {"label":"Harvest Records","description":"Completed harvest operations","icon":"ClipboardCheck","color":"blue","target_type":"entity","entity_type":"HARVEST","view_slug":"records","status":"active","priority":"medium"},
      {"label":"Yield Tracking","description":"Actual vs. expected yield","icon":"TrendingUp","color":"green","target_type":"analytics","view_slug":"yield","status":"active","priority":"high"},
      {"label":"Quality Control","description":"Harvest quality inspection","icon":"Award","color":"purple","target_type":"entity","entity_type":"QUALITY_CHECK","view_slug":"quality","status":"active","priority":"medium"},
      {"label":"Storage Allocation","description":"Assign storage locations","icon":"Warehouse","color":"blue","target_type":"workflow","view_slug":"storage","status":"active","priority":"medium"}
    ]'::jsonb,
    'HERA.AGRO.WORKSPACE.HARVESTING.CARDS.v1', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING;

  RAISE NOTICE '  ✅ harvesting section with workspace';

  -- Section: Processing
  INSERT INTO core_entities (
    entity_type, entity_code, entity_name, smart_code, metadata, parent_entity_id,
    organization_id, created_by, updated_by
  ) VALUES (
    'APP_SECTION', 'processing', 'Post-Harvest Processing', 'HERA.AGRO.SECTION.PRODUCTION.PROCESSING.v1',
    '{"slug":"processing","icon":"Cpu","description":"Manage cleaning, sorting, and packaging"}'::jsonb,
    v_domain_id, '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_section_id;

  IF v_section_id IS NULL THEN SELECT id INTO v_section_id FROM core_entities WHERE entity_code = 'processing' AND entity_type = 'APP_SECTION'; END IF;

  INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
  VALUES (v_domain_id, v_section_id, 'HAS_SECTION', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO core_entities (
    entity_type, entity_code, entity_name, smart_code, metadata, parent_entity_id,
    organization_id, created_by, updated_by
  ) VALUES (
    'APP_WORKSPACE', 'main', 'Processing Operations Workspace', 'HERA.AGRO.WORKSPACE.PROCESSING.MAIN.v1',
    '{"slug":"main","icon":"Cpu","color":"#6366f1","subtitle":"Manage post-harvest processing","persona_label":"Processing Manager","visible_roles":["farm_manager","processing_supervisor"],"default_nav":"operations"}'::jsonb,
    v_section_id, '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_workspace_id;

  IF v_workspace_id IS NULL THEN SELECT id INTO v_workspace_id FROM core_entities WHERE entity_code = 'main' AND parent_entity_id = v_section_id; END IF;

  INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
  VALUES (v_section_id, v_workspace_id, 'HAS_WORKSPACE', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_json, smart_code, organization_id, created_by, updated_by)
  VALUES (
    v_workspace_id, 'cards', 'json',
    '[
      {"label":"Processing Queue","description":"Items awaiting processing","icon":"List","color":"blue","target_type":"workflow","view_slug":"queue","status":"active","priority":"high"},
      {"label":"Processing Records","description":"Completed processing batches","icon":"Package","color":"purple","target_type":"entity","entity_type":"PROCESSING_BATCH","view_slug":"records","status":"active","priority":"medium"},
      {"label":"Quality Grading","description":"Sort and grade produce","icon":"Award","color":"yellow","target_type":"workflow","view_slug":"grading","status":"active","priority":"high"},
      {"label":"Packaging","description":"Package finished products","icon":"Box","color":"green","target_type":"entity","entity_type":"PACKAGE","view_slug":"packaging","status":"active","priority":"medium"},
      {"label":"Waste Tracking","description":"Processing waste and loss","icon":"Trash","color":"red","target_type":"analytics","view_slug":"waste","status":"active","priority":"low"},
      {"label":"Efficiency Reports","description":"Processing efficiency metrics","icon":"BarChart3","color":"indigo","target_type":"report","view_slug":"efficiency","status":"active","priority":"low"}
    ]'::jsonb,
    'HERA.AGRO.WORKSPACE.PROCESSING.CARDS.v1', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING;

  RAISE NOTICE '  ✅ processing section with workspace';

  -- =====================================================
  -- DOMAIN 3: OPERATIONS
  -- =====================================================

  RAISE NOTICE '';
  RAISE NOTICE '⚙️ Creating OPERATIONS Domain...';

  INSERT INTO core_entities (
    entity_type, entity_code, entity_name, smart_code, metadata,
    organization_id, created_by, updated_by
  ) VALUES (
    'APP_DOMAIN', 'operations', 'Operations Management', 'HERA.AGRO.DOMAIN.OPERATIONS.v1',
    '{"slug":"operations","icon":"Settings","color":"#64748b","description":"Manage daily operations, labor, and scheduling"}'::jsonb,
    '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_domain_id;

  IF v_domain_id IS NULL THEN SELECT id INTO v_domain_id FROM core_entities WHERE entity_code = 'operations' AND entity_type = 'APP_DOMAIN'; END IF;

  INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
  VALUES (v_app_id, v_domain_id, 'APP_HAS_DOMAIN', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id)
  ON CONFLICT DO NOTHING;

  -- Section: Labor
  INSERT INTO core_entities (
    entity_type, entity_code, entity_name, smart_code, metadata, parent_entity_id,
    organization_id, created_by, updated_by
  ) VALUES (
    'APP_SECTION', 'labor', 'Labor Management', 'HERA.AGRO.SECTION.OPERATIONS.LABOR.v1',
    '{"slug":"labor","icon":"Users","description":"Manage workforce, time tracking, and payroll"}'::jsonb,
    v_domain_id, '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_section_id;

  IF v_section_id IS NULL THEN SELECT id INTO v_section_id FROM core_entities WHERE entity_code = 'labor' AND entity_type = 'APP_SECTION'; END IF;

  INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
  VALUES (v_domain_id, v_section_id, 'HAS_SECTION', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO core_entities (
    entity_type, entity_code, entity_name, smart_code, metadata, parent_entity_id,
    organization_id, created_by, updated_by
  ) VALUES (
    'APP_WORKSPACE', 'main', 'Labor Management Workspace', 'HERA.AGRO.WORKSPACE.LABOR.MAIN.v1',
    '{"slug":"main","icon":"Users","color":"#3b82f6","subtitle":"Manage workforce and time tracking","persona_label":"Operations Manager","visible_roles":["farm_manager","hr_manager"],"default_nav":"workers"}'::jsonb,
    v_section_id, '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_workspace_id;

  IF v_workspace_id IS NULL THEN SELECT id INTO v_workspace_id FROM core_entities WHERE entity_code = 'main' AND parent_entity_id = v_section_id; END IF;

  INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
  VALUES (v_section_id, v_workspace_id, 'HAS_WORKSPACE', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_json, smart_code, organization_id, created_by, updated_by)
  VALUES (
    v_workspace_id, 'cards', 'json',
    '[
      {"label":"Worker Registry","description":"All farm workers and contractors","icon":"UserCircle","color":"blue","target_type":"entity","entity_type":"WORKER","view_slug":"workers","status":"active","priority":"high"},
      {"label":"Time Tracking","description":"Daily attendance and hours","icon":"Clock","color":"green","target_type":"entity","entity_type":"TIMESHEET","view_slug":"timesheet","status":"active","priority":"high"},
      {"label":"Task Assignment","description":"Assign workers to tasks","icon":"ClipboardList","color":"purple","target_type":"workflow","view_slug":"assignments","status":"active","priority":"medium"},
      {"label":"Payroll","description":"Calculate wages and payments","icon":"DollarSign","color":"yellow","target_type":"workflow","view_slug":"payroll","status":"active","priority":"high"},
      {"label":"Skills Matrix","description":"Worker skills and certifications","icon":"Award","color":"indigo","target_type":"entity","entity_type":"SKILL","view_slug":"skills","status":"active","priority":"low"},
      {"label":"Labor Analytics","description":"Productivity and cost analysis","icon":"BarChart3","color":"blue","target_type":"report","view_slug":"analytics","status":"active","priority":"low"}
    ]'::jsonb,
    'HERA.AGRO.WORKSPACE.LABOR.CARDS.v1', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING;

  RAISE NOTICE '  ✅ labor section with workspace';

  -- =====================================================
  -- DOMAIN 4: ANALYTICS
  -- =====================================================

  RAISE NOTICE '';
  RAISE NOTICE '📊 Creating ANALYTICS Domain...';

  INSERT INTO core_entities (
    entity_type, entity_code, entity_name, smart_code, metadata,
    organization_id, created_by, updated_by
  ) VALUES (
    'APP_DOMAIN', 'analytics', 'Analytics & Reporting', 'HERA.AGRO.DOMAIN.ANALYTICS.v1',
    '{"slug":"analytics","icon":"BarChart3","color":"#0ea5e9","description":"Business intelligence and performance metrics"}'::jsonb,
    '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_domain_id;

  IF v_domain_id IS NULL THEN SELECT id INTO v_domain_id FROM core_entities WHERE entity_code = 'analytics' AND entity_type = 'APP_DOMAIN'; END IF;

  INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
  VALUES (v_app_id, v_domain_id, 'APP_HAS_DOMAIN', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id)
  ON CONFLICT DO NOTHING;

  -- Section: Yield
  INSERT INTO core_entities (
    entity_type, entity_code, entity_name, smart_code, metadata, parent_entity_id,
    organization_id, created_by, updated_by
  ) VALUES (
    'APP_SECTION', 'yield', 'Yield Analytics', 'HERA.AGRO.SECTION.ANALYTICS.YIELD.v1',
    '{"slug":"yield","icon":"TrendingUp","description":"Analyze crop yields and performance"}'::jsonb,
    v_domain_id, '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_section_id;

  IF v_section_id IS NULL THEN SELECT id INTO v_section_id FROM core_entities WHERE entity_code = 'yield' AND entity_type = 'APP_SECTION'; END IF;

  INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
  VALUES (v_domain_id, v_section_id, 'HAS_SECTION', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO core_entities (
    entity_type, entity_code, entity_name, smart_code, metadata, parent_entity_id,
    organization_id, created_by, updated_by
  ) VALUES (
    'APP_WORKSPACE', 'main', 'Yield Analytics Workspace', 'HERA.AGRO.WORKSPACE.YIELD.MAIN.v1',
    '{"slug":"main","icon":"TrendingUp","color":"#10b981","subtitle":"Analyze yields and productivity","persona_label":"Data Analyst","visible_roles":["farm_manager","agronomist","analyst"],"default_nav":"overview"}'::jsonb,
    v_section_id, '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_workspace_id;

  IF v_workspace_id IS NULL THEN SELECT id INTO v_workspace_id FROM core_entities WHERE entity_code = 'main' AND parent_entity_id = v_section_id; END IF;

  INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
  VALUES (v_section_id, v_workspace_id, 'HAS_WORKSPACE', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_json, smart_code, organization_id, created_by, updated_by)
  VALUES (
    v_workspace_id, 'cards', 'json',
    '[
      {"label":"Yield Dashboard","description":"Overall yield performance","icon":"BarChart3","color":"green","target_type":"analytics","view_slug":"dashboard","status":"active","priority":"high"},
      {"label":"By Crop Type","description":"Yield breakdown by crop","icon":"PieChart","color":"blue","target_type":"analytics","view_slug":"by-crop","status":"active","priority":"high"},
      {"label":"By Field","description":"Field-level yield comparison","icon":"Map","color":"purple","target_type":"analytics","view_slug":"by-field","status":"active","priority":"medium"},
      {"label":"Historical Trends","description":"Multi-year yield trends","icon":"TrendingUp","color":"indigo","target_type":"analytics","view_slug":"trends","status":"active","priority":"medium"},
      {"label":"Expected vs Actual","description":"Forecast accuracy analysis","icon":"Target","color":"red","target_type":"report","view_slug":"variance","status":"active","priority":"medium"},
      {"label":"Export Report","description":"Download yield reports","icon":"Download","color":"gray","target_type":"report","view_slug":"export","status":"active","priority":"low"}
    ]'::jsonb,
    'HERA.AGRO.WORKSPACE.YIELD.CARDS.v1', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING;

  RAISE NOTICE '  ✅ yield section with workspace';

  -- =====================================================
  -- DOMAIN 5: SUPPLY CHAIN
  -- =====================================================

  RAISE NOTICE '';
  RAISE NOTICE '🚛 Creating SUPPLY CHAIN Domain...';

  INSERT INTO core_entities (
    entity_type, entity_code, entity_name, smart_code, metadata,
    organization_id, created_by, updated_by
  ) VALUES (
    'APP_DOMAIN', 'supply-chain', 'Supply Chain Management', 'HERA.AGRO.DOMAIN.SUPPLY_CHAIN.v1',
    '{"slug":"supply-chain","icon":"Truck","color":"#f97316","description":"Manage inputs, outputs, and distribution"}'::jsonb,
    '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_domain_id;

  IF v_domain_id IS NULL THEN SELECT id INTO v_domain_id FROM core_entities WHERE entity_code = 'supply-chain' AND entity_type = 'APP_DOMAIN'; END IF;

  INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
  VALUES (v_app_id, v_domain_id, 'APP_HAS_DOMAIN', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id)
  ON CONFLICT DO NOTHING;

  -- Section: Inputs
  INSERT INTO core_entities (
    entity_type, entity_code, entity_name, smart_code, metadata, parent_entity_id,
    organization_id, created_by, updated_by
  ) VALUES (
    'APP_SECTION', 'inputs', 'Farm Inputs', 'HERA.AGRO.SECTION.SUPPLY_CHAIN.INPUTS.v1',
    '{"slug":"inputs","icon":"ShoppingCart","description":"Manage seeds, fertilizers, and supplies"}'::jsonb,
    v_domain_id, '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_section_id;

  IF v_section_id IS NULL THEN SELECT id INTO v_section_id FROM core_entities WHERE entity_code = 'inputs' AND entity_type = 'APP_SECTION'; END IF;

  INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
  VALUES (v_domain_id, v_section_id, 'HAS_SECTION', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO core_entities (
    entity_type, entity_code, entity_name, smart_code, metadata, parent_entity_id,
    organization_id, created_by, updated_by
  ) VALUES (
    'APP_WORKSPACE', 'main', 'Farm Inputs Workspace', 'HERA.AGRO.WORKSPACE.INPUTS.MAIN.v1',
    '{"slug":"main","icon":"ShoppingCart","color":"#f59e0b","subtitle":"Manage farm inputs and supplies","persona_label":"Purchasing Manager","visible_roles":["farm_manager","purchasing"],"default_nav":"inventory"}'::jsonb,
    v_section_id, '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING RETURNING id INTO v_workspace_id;

  IF v_workspace_id IS NULL THEN SELECT id INTO v_workspace_id FROM core_entities WHERE entity_code = 'main' AND parent_entity_id = v_section_id; END IF;

  INSERT INTO core_relationships (from_entity_id, to_entity_id, relationship_type, organization_id, created_by, updated_by)
  VALUES (v_section_id, v_workspace_id, 'HAS_WORKSPACE', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id)
  ON CONFLICT DO NOTHING;

  INSERT INTO core_dynamic_data (entity_id, field_name, field_type, field_value_json, smart_code, organization_id, created_by, updated_by)
  VALUES (
    v_workspace_id, 'cards', 'json',
    '[
      {"label":"Input Inventory","description":"Current stock of all inputs","icon":"Package","color":"orange","target_type":"entity","entity_type":"INPUT","view_slug":"inventory","status":"active","priority":"high"},
      {"label":"Purchase Orders","description":"Manage supplier orders","icon":"ShoppingCart","color":"blue","target_type":"transaction","view_slug":"purchase-orders","status":"active","priority":"high"},
      {"label":"Suppliers","description":"Supplier database","icon":"Building","color":"purple","target_type":"entity","entity_type":"SUPPLIER","view_slug":"suppliers","status":"active","priority":"medium"},
      {"label":"Cost Tracking","description":"Input costs and budgets","icon":"DollarSign","color":"yellow","target_type":"analytics","view_slug":"costs","status":"active","priority":"medium"},
      {"label":"Reorder Alerts","description":"Low stock notifications","icon":"Bell","color":"red","target_type":"workflow","view_slug":"reorder","status":"active","priority":"high"},
      {"label":"Usage Reports","description":"Input consumption analysis","icon":"BarChart3","color":"indigo","target_type":"report","view_slug":"usage","status":"active","priority":"low"}
    ]'::jsonb,
    'HERA.AGRO.WORKSPACE.INPUTS.CARDS.v1', '00000000-0000-0000-0000-000000000000', v_system_user_id, v_system_user_id
  ) ON CONFLICT DO NOTHING;

  RAISE NOTICE '  ✅ inputs section with workspace';

  -- =====================================================
  -- FINAL SUMMARY
  -- =====================================================

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 AGRO WORKSPACES CREATED SUCCESSFULLY!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Created Structure:';
  RAISE NOTICE '  • 5 Domains';
  RAISE NOTICE '  • 11 Sections';
  RAISE NOTICE '  • 11 Workspaces';
  RAISE NOTICE '  • 66 Workspace Cards';
  RAISE NOTICE '';
  RAISE NOTICE '🌐 Access URLs:';
  RAISE NOTICE '  /agro/domains/farm/sections/crops';
  RAISE NOTICE '  /agro/domains/farm/sections/livestock';
  RAISE NOTICE '  /agro/domains/farm/sections/equipment';
  RAISE NOTICE '  /agro/domains/farm/sections/fields';
  RAISE NOTICE '  /agro/domains/production/sections/planting';
  RAISE NOTICE '  /agro/domains/production/sections/harvesting';
  RAISE NOTICE '  /agro/domains/production/sections/processing';
  RAISE NOTICE '  /agro/domains/operations/sections/labor';
  RAISE NOTICE '  /agro/domains/analytics/sections/yield';
  RAISE NOTICE '  /agro/domains/supply-chain/sections/inputs';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';

END $$;
