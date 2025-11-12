-- 20251110_seed_nav_layer3_workspace_retail_pos.sql
-- Seed Layer 3: APP_WORKSPACE under Retail → POS & Billing

DO $$
DECLARE
  v_platform_org   uuid := '00000000-0000-0000-0000-000000000000';
  v_actor          uuid := NULL; -- or your system user id

  v_sec_retail_pos uuid;
  v_workspace_id   uuid;
BEGIN
  --------------------------------------------------------------------
  -- Resolve Layer 2: POS & Billing section (APP_SECTION)
  --------------------------------------------------------------------
  SELECT id INTO v_sec_retail_pos
  FROM core_entities
  WHERE organization_id = v_platform_org
    AND entity_type     = 'APP_SECTION'
    AND entity_code     = 'NAV-SEC-RETAIL-POS';

  IF v_sec_retail_pos IS NULL THEN
    RAISE EXCEPTION 'APP_SECTION NAV-SEC-RETAIL-POS not found. Seed Level 2 first.';
  END IF;

  --------------------------------------------------------------------
  -- Level 3: Retail POS Workspace (SAP-style cockpit)
  -- Frontend path: /apps/retail/pos/main
  --------------------------------------------------------------------
  v_workspace_id := public.hera_entity_upsert_v1(
    p_organization_id  => v_platform_org,
    p_entity_type      => 'APP_WORKSPACE',
    p_entity_name      => 'Retail POS Workspace',
    p_smart_code       => 'HERA.PLATFORM.NAV.APPWORKSPACE.RETAIL.POSMAIN.V1',
    p_entity_code      => 'NAV-WORK-RETAIL-POS-MAIN',
    p_parent_entity_id => v_sec_retail_pos
  );

  PERFORM public.hera_dynamic_data_batch_v1(
    p_organization_id => v_platform_org,
    p_entity_id       => v_workspace_id,
    p_items           => jsonb_build_array(
      ----------------------------------------------------------------
      -- Identity / routing
      ----------------------------------------------------------------
      jsonb_build_object('field_name','slug',              'field_type','text', 'field_value_text','main'),
      jsonb_build_object('field_name','parent_section_slug','field_type','text','field_value_text','retail-pos'),
      jsonb_build_object('field_name','route',             'field_type','text', 'field_value_text','/apps/retail/pos/main'),

      ----------------------------------------------------------------
      -- Display metadata
      ----------------------------------------------------------------
      jsonb_build_object('field_name','subtitle',      'field_type','text', 'field_value_text','Point-of-Sale Cockpit'),
      jsonb_build_object('field_name','icon',          'field_type','text', 'field_value_text','layout-dashboard'),
      jsonb_build_object('field_name','color',         'field_type','text', 'field_value_text','#6366F1'),
      jsonb_build_object('field_name','persona_label', 'field_type','text', 'field_value_text','Store Mgr • Cashier'),
      jsonb_build_object(
        'field_name','visible_roles',
        'field_type','json',
        'field_value_json','["store_manager","cashier","retail_head"]'::jsonb
      ),

      ----------------------------------------------------------------
      -- Layout config for SAP-style workspace page
      -- Left nav + sections + cards; each card routes to a dynamic view
      ----------------------------------------------------------------
      jsonb_build_object(
        'field_name','layout_config',
        'field_type','json',
        'field_value_json',
        jsonb_build_object(
          'default_nav_code','OVERVIEW',
          'nav_items', jsonb_build_array(
            jsonb_build_object('code','OVERVIEW',     'label','Overview'),
            jsonb_build_object('code','MASTER_DATA',  'label','Master Data'),
            jsonb_build_object('code','TRANSACTIONS', 'label','Transactions'),
            jsonb_build_object('code','RELATIONSHIPS','label','Relationships'),
            jsonb_build_object('code','WORKFLOWS',    'label','Workflows')
          ),
          'sections', jsonb_build_array(

            -- 1) Overview
            jsonb_build_object(
              'nav_code','OVERVIEW',
              'title','Today at a Glance',
              'cards', jsonb_build_array(
                jsonb_build_object(
                  'label','Store Overview',
                  'subtitle','Sales, items, payments',
                  'icon','activity',
                  'view_slug','overview',
                  'target_type','DASHBOARD',
                  'template_code','HERA.RETAIL.UI.DASHBOARD.POS.OVERVIEW.V1'
                )
              )
            ),

            -- 2) Master Data
            jsonb_build_object(
              'nav_code','MASTER_DATA',
              'title','Master Data',
              'cards', jsonb_build_array(
                jsonb_build_object(
                  'label','Products',
                  'subtitle','Manage product master',
                  'icon','box',
                  'view_slug','products',
                  'target_type','ENTITY_LIST',
                  'entity_type','PRODUCT',
                  'default_mode','RUD',
                  'template_code','HERA.RETAIL.UI.LIST.PRODUCT.V1'
                ),
                jsonb_build_object(
                  'label','New Product',
                  'subtitle','Create product master',
                  'icon','plus-circle',
                  'view_slug','product-create',
                  'target_type','ENTITY_FORM',
                  'entity_type','PRODUCT',
                  'default_mode','CREATE',
                  'template_code','HERA.RETAIL.UI.FORM.PRODUCT.V1'
                ),
                jsonb_build_object(
                  'label','Customers',
                  'subtitle','Customer master data',
                  'icon','user-circle-2',
                  'view_slug','customers',
                  'target_type','ENTITY_LIST',
                  'entity_type','CUSTOMER',
                  'default_mode','RUD',
                  'template_code','HERA.RETAIL.UI.LIST.CUSTOMER.V1'
                )
              )
            ),

            -- 3) Transactions
            jsonb_build_object(
              'nav_code','TRANSACTIONS',
              'title','Transactions',
              'cards', jsonb_build_array(
                jsonb_build_object(
                  'label','Sales Receipts',
                  'subtitle','Create and manage POS bills',
                  'icon','receipt-indian-rupee',
                  'view_slug','sales-receipts',
                  'target_type','TRANSACTION_LIST',
                  'transaction_smart_code','HERA.RETAIL.TXN.POS.SALESRECEIPT.V1',
                  'template_code','HERA.RETAIL.UI.LIST.SALESRECEIPT.V1'
                ),
                jsonb_build_object(
                  'label','Returns',
                  'subtitle','Handle sales returns',
                  'icon','rotate-ccw',
                  'view_slug','sales-returns',
                  'target_type','TRANSACTION_LIST',
                  'transaction_smart_code','HERA.RETAIL.TXN.POS.RETURN.V1',
                  'template_code','HERA.RETAIL.UI.LIST.SALESRETURN.V1'
                )
              )
            ),

            -- 4) Relationships
            jsonb_build_object(
              'nav_code','RELATIONSHIPS',
              'title','Relationships',
              'cards', jsonb_build_array(
                jsonb_build_object(
                  'label','Product–Store Mapping',
                  'subtitle','Assortments & listings',
                  'icon','squares-2x2',
                  'view_slug','product-store-relations',
                  'target_type','RELATION_GRAPH',
                  'relation_smart_code','HERA.RETAIL.REL.PRODUCT.STORE.V1',
                  'template_code','HERA.RETAIL.UI.RELATION.PRODUCTSTORE.V1'
                )
              )
            ),

            -- 5) Workflows
            jsonb_build_object(
              'nav_code','WORKFLOWS',
              'title','Workflows',
              'cards', jsonb_build_array(
                jsonb_build_object(
                  'label','Price Change Approvals',
                  'subtitle','Approve POS price changes',
                  'icon','clipboard-check',
                  'view_slug','price-change-approvals',
                  'target_type','WORKFLOW_BOARD',
                  'workflow_smart_code','HERA.RETAIL.WF.PRICECHANGE.V1',
                  'template_code','HERA.RETAIL.UI.WORKFLOW.PRICECHANGE.V1'
                )
              )
            )
          )
        )
      )
    ),
    p_actor_user_id   => v_actor
  );

END $$;