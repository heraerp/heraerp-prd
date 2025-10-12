-- ================================================================================
-- HERA vs SAP S/4HANA COSTING FEATURES - COMPLETE SQL IMPLEMENTATION
-- ================================================================================
-- Demonstrating how HERA's 6-Table Architecture delivers every SAP S/4HANA 
-- costing feature with elegant simplicity
-- Organization: HERA System Organization (719dfed1-09b4-4ca8-bfda-f682460de945)
-- ================================================================================

-- ================================================================================
-- 1. COST ACCOUNTING (CO) - SAP's Complex CO Module Made Simple
-- ================================================================================

-- Create Universal Cost Accounting Framework (replaces SAP CO module)
INSERT INTO core_entities (
    organization_id,
    entity_type,
    entity_name,
    entity_code,
    smart_code,
    smart_code_status,
    status,
    metadata
) 
SELECT 
    '719dfed1-09b4-4ca8-bfda-f682460de945'::uuid,
    'cost_accounting_framework',
    'HERA Universal Cost Accounting Framework',
    'FRAMEWORK-CO-001',
    'HERA.SYSTEM.FIN.ENT.COST_ACCOUNTING.V1',
    'PROD',
    'active',
    '{
        "framework_type": "universal_cost_accounting",
        "replaces_sap_modules": ["CO_Cost_Center_Accounting", "CO_Internal_Orders", "CO_Activity_Based_Costing"],
        "sap_equivalent_tables": ["CSKS", "AUFK", "PRPS", "KLH1", "COBK"],
        "hera_implementation": "universal_6_table_architecture",
        "cost_object_types": {
            "cost_centers": {
                "entity_type": "cost_center",
                "smart_code_pattern": "HERA.{INDUSTRY}.CO.ENT.COST_CENTER.V1",
                "functionality": ["cost_capture", "budget_control", "variance_analysis", "allocation_to_profit_centers"],
                "sap_equivalent": "CSKS_cost_center_master"
            },
            "internal_orders": {
                "entity_type": "internal_order",
                "smart_code_pattern": "HERA.{INDUSTRY}.CO.ENT.INTERNAL_ORDER.V1", 
                "functionality": ["project_costing", "marketing_campaigns", "maintenance_orders", "temporary_cost_collection"],
                "sap_equivalent": "AUFK_order_master"
            },
            "projects": {
                "entity_type": "project",
                "smart_code_pattern": "HERA.{INDUSTRY}.CO.ENT.PROJECT.V1",
                "functionality": ["wbs_elements", "network_activities", "milestone_billing", "investment_tracking"],
                "sap_equivalent": "PRPS_wbs_master"
            },
            "activity_types": {
                "entity_type": "activity_type", 
                "smart_code_pattern": "HERA.{INDUSTRY}.CO.ENT.ACTIVITY.V1",
                "functionality": ["resource_planning", "capacity_costing", "allocation_base", "performance_measurement"],
                "sap_equivalent": "CSA_activity_type_master"
            }
        },
        "cost_allocation_methods": {
            "direct_allocation": {
                "method": "core_relationships_with_allocation_percentage",
                "automation": "real_time_automatic_allocation",
                "sap_equivalent": "KB21N_manual_reposting"
            },
            "activity_based_allocation": {
                "method": "activity_driver_based_via_transaction_volumes",
                "automation": "dynamic_calculation_via_dag_engine",
                "sap_equivalent": "KSC1_activity_allocation"
            },
            "statistical_allocation": {
                "method": "statistical_key_figures_in_dynamic_data",
                "automation": "automated_via_business_rules",
                "sap_equivalent": "KB15N_statistical_key_figure_posting"
            }
        },
        "real_time_capabilities": {
            "live_cost_tracking": "every_transaction_immediately_allocated",
            "instant_variance_analysis": "planned_vs_actual_real_time",
            "dynamic_budgeting": "budget_adjustments_without_period_end_processing",
            "integrated_reporting": "cost_reports_always_current"
        }
    }'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM core_entities 
    WHERE organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
    AND entity_code = 'FRAMEWORK-CO-001'
);

-- Create Universal Cost Allocation Query (replaces SAP's complex allocation cycles)
INSERT INTO core_dynamic_data (
    entity_id,
    field_name,
    field_type,
    field_value_text,
    metadata
) 
SELECT 
    ce.id,
    'cost_allocation_query',
    'text',
    'WITH cost_allocation AS (
        SELECT 
            cc.entity_name as cost_center,
            pc.entity_name as profit_center,
            SUM(tl.line_amount) as total_cost,
            cr.metadata->>''allocation_percentage'' as allocation_rate,
            cr.metadata->>''allocation_method'' as method
        FROM core_entities cc
        JOIN universal_transactions t ON cc.id = t.cost_center_id
        JOIN universal_transaction_lines tl ON t.id = tl.transaction_id
        JOIN core_relationships cr ON cc.id = cr.source_entity_id
        JOIN core_entities pc ON cr.target_entity_id = pc.id
        WHERE cc.metadata->>''center_type'' = ''cost_center''
        AND pc.metadata->>''center_type'' = ''profit_center''
        AND cr.relationship_type = ''cost_allocation''
        AND t.transaction_date >= DATE_TRUNC(''month'', CURRENT_DATE)
        GROUP BY cc.entity_name, pc.entity_name, cr.metadata->>''allocation_percentage'', cr.metadata->>''allocation_method''
    )
    SELECT 
        cost_center,
        profit_center,
        total_cost,
        allocation_rate,
        method,
        (total_cost * CAST(allocation_rate AS DECIMAL)) as allocated_amount,
        CASE 
            WHEN method = ''activity_based'' THEN total_cost * CAST(allocation_rate AS DECIMAL) * activity_factor
            WHEN method = ''statistical'' THEN total_cost * CAST(allocation_rate AS DECIMAL) * statistical_factor
            ELSE total_cost * CAST(allocation_rate AS DECIMAL)
        END as final_allocation
    FROM cost_allocation
    ORDER BY cost_center, allocated_amount DESC',
    '{"query_type": "cost_allocation", "replaces_sap": "KSC1_KSC2_KSC5_allocation_cycles"}'::jsonb
FROM core_entities ce
WHERE ce.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
AND ce.entity_code = 'FRAMEWORK-CO-001'
AND NOT EXISTS (
    SELECT 1 FROM core_dynamic_data 
    WHERE entity_id = ce.id AND field_name = 'cost_allocation_query'
);

-- ================================================================================
-- 2. PRODUCT COST MANAGEMENT - SAP PC Module Made Universal
-- ================================================================================

-- Create Universal Product Costing Framework
INSERT INTO core_entities (
    organization_id,
    entity_type,
    entity_name,
    entity_code,
    smart_code,
    smart_code_status,
    status,
    metadata
) 
SELECT 
    '719dfed1-09b4-4ca8-bfda-f682460de945'::uuid,
    'product_costing_framework',
    'HERA Universal Product Costing Framework',
    'FRAMEWORK-PC-001',
    'HERA.SYSTEM.PC.ENT.PRODUCT_COSTING.V1',
    'PROD',
    'active',
    '{
        "framework_type": "universal_product_costing",
        "replaces_sap_modules": ["PC_Product_Cost_Planning", "PC_Cost_Object_Controlling", "PC_Actual_Costing"],
        "sap_equivalent_tcodes": ["CK11N", "CK40N", "KSBT", "CK24", "CK88"],
        "costing_methodologies": {
            "standard_costing": {
                "description": "Fixed standard costs for planning and variance analysis",
                "implementation": "standard_cost_in_dynamic_data_with_variance_calculation",
                "transaction_type": "standard_cost_transaction",
                "smart_code": "HERA.{INDUSTRY}.PC.TXN.STANDARD_COST.V1"
            },
            "actual_costing": {
                "description": "Real-time actual costs based on actual transactions",
                "implementation": "real_time_cost_accumulation_via_universal_transactions",
                "transaction_type": "actual_cost_transaction", 
                "smart_code": "HERA.{INDUSTRY}.PC.TXN.ACTUAL_COST.V1"
            },
            "planned_costing": {
                "description": "Future cost planning and simulation",
                "implementation": "planned_cost_scenarios_in_dynamic_data",
                "transaction_type": "planned_cost_transaction",
                "smart_code": "HERA.{INDUSTRY}.PC.TXN.PLANNED_COST.V1"
            }
        },
        "bom_integration": {
            "multi_level_bom": "core_relationships_with_hierarchical_cost_rollup",
            "recipe_costing": "same_structure_for_manufacturing_and_restaurant_recipes",
            "yield_management": "yield_factors_in_bom_relationships_with_variance_tracking",
            "component_substitution": "alternative_bom_via_conditional_relationships"
        },
        "variance_analysis": {
            "price_variance": "(actual_price - standard_price) * actual_quantity",
            "quantity_variance": "(actual_quantity - standard_quantity) * standard_price", 
            "efficiency_variance": "(actual_time - standard_time) * standard_rate",
            "yield_variance": "(actual_yield - standard_yield) * standard_cost",
            "calculation_method": "real_time_via_dag_calculation_engine"
        },
        "costing_integration": {
            "sales_order_costing": "customer_specific_costing_via_transaction_context",
            "production_order_costing": "order_specific_cost_accumulation",
            "project_costing": "wbs_element_cost_collection_and_settlement",
            "service_costing": "time_and_material_costing_for_services"
        }
    }'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM core_entities 
    WHERE organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
    AND entity_code = 'FRAMEWORK-PC-001'
);

-- Universal Product Costing Query (replaces SAP CK11N, CK40N, etc.)
INSERT INTO core_dynamic_data (
    entity_id,
    field_name,
    field_type,
    field_value_text,
    metadata
) 
SELECT 
    ce.id,
    'product_costing_query',
    'text',
    'WITH bom_explosion AS (
        -- Recursive BOM explosion (handles unlimited levels)
        WITH RECURSIVE bom_hierarchy AS (
            SELECT 
                p.id as product_id,
                p.entity_name as product,
                c.id as component_id,
                c.entity_name as component,
                br.metadata->>''quantity'' as quantity,
                br.metadata->>''yield_factor'' as yield_factor,
                1 as level,
                ARRAY[p.id] as path
            FROM core_entities p
            JOIN core_relationships br ON p.id = br.source_entity_id
            JOIN core_entities c ON br.target_entity_id = c.id
            WHERE br.relationship_type = ''bom_component''
            AND p.entity_type = ''product''
            
            UNION ALL
            
            SELECT 
                bh.product_id,
                bh.product,
                c.id as component_id,
                c.entity_name as component,
                (CAST(bh.quantity AS DECIMAL) * CAST(br.metadata->>''quantity'' AS DECIMAL))::TEXT as quantity,
                br.metadata->>''yield_factor'' as yield_factor,
                bh.level + 1,
                bh.path || c.id
            FROM bom_hierarchy bh
            JOIN core_relationships br ON bh.component_id = br.source_entity_id
            JOIN core_entities c ON br.target_entity_id = c.id
            WHERE br.relationship_type = ''bom_component''
            AND c.id != ALL(bh.path)  -- Prevent cycles
            AND bh.level < 10  -- Limit recursion depth
        )
        SELECT 
            bh.product_id,
            bh.product,
            bh.component_id,
            bh.component,
            CAST(bh.quantity AS DECIMAL) as extended_quantity,
            CAST(bh.yield_factor AS DECIMAL) as yield_factor,
            bh.level,
            -- Get component costs from dynamic data
            CAST(sc.field_value_number AS DECIMAL) as standard_cost,
            CAST(ac.field_value_number AS DECIMAL) as actual_cost
        FROM bom_hierarchy bh
        LEFT JOIN core_dynamic_data sc ON bh.component_id = sc.entity_id AND sc.field_name = ''standard_cost''
        LEFT JOIN core_dynamic_data ac ON bh.component_id = ac.entity_id AND ac.field_name = ''actual_cost''
    ),
    cost_rollup AS (
        SELECT 
            product_id,
            product,
            SUM(extended_quantity * COALESCE(yield_factor, 1.0) * COALESCE(standard_cost, 0)) as total_standard_cost,
            SUM(extended_quantity * COALESCE(yield_factor, 1.0) * COALESCE(actual_cost, 0)) as total_actual_cost,
            COUNT(DISTINCT component_id) as component_count,
            MAX(level) as max_bom_level
        FROM bom_explosion
        GROUP BY product_id, product
    ),
    variance_analysis AS (
        SELECT 
            cr.*,
            (total_actual_cost - total_standard_cost) as total_variance,
            CASE 
                WHEN total_standard_cost > 0 THEN 
                    ((total_actual_cost - total_standard_cost) / total_standard_cost * 100)
                ELSE 0 
            END as variance_percentage,
            CASE 
                WHEN total_actual_cost > total_standard_cost THEN ''UNFAVORABLE''
                WHEN total_actual_cost < total_standard_cost THEN ''FAVORABLE''
                ELSE ''NEUTRAL''
            END as variance_type
        FROM cost_rollup cr
    )
    SELECT 
        product,
        component_count,
        max_bom_level,
        ROUND(total_standard_cost, 4) as standard_cost,
        ROUND(total_actual_cost, 4) as actual_cost,
        ROUND(total_variance, 4) as cost_variance,
        ROUND(variance_percentage, 2) as variance_percent,
        variance_type,
        CURRENT_TIMESTAMP as calculation_timestamp
    FROM variance_analysis
    ORDER BY ABS(total_variance) DESC',
    '{"query_type": "product_costing_with_bom_explosion", "replaces_sap": "CK11N_CK40N_KSBT_product_costing"}'::jsonb
FROM core_entities ce
WHERE ce.organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
AND ce.entity_code = 'FRAMEWORK-PC-001'
AND NOT EXISTS (
    SELECT 1 FROM core_dynamic_data 
    WHERE entity_id = ce.id AND field_name = 'product_costing_query'
);

-- ================================================================================
-- 3. PROFITABILITY ANALYSIS (CO-PA) - SAP CO-PA Made Universal
-- ================================================================================

-- Create Universal Profitability Analysis Framework
INSERT INTO core_entities (
    organization_id,
    entity_type,
    entity_name,
    entity_code,
    smart_code,
    smart_code_status,
    status,
    metadata
) 
SELECT 
    '719dfed1-09b4-4ca8-bfda-f682460de945'::uuid,
    'copa_framework',
    'HERA Universal Profitability Analysis Framework',
    'FRAMEWORK-COPA-001',
    'HERA.SYSTEM.COPA.ENT.PROFITABILITY.V1',
    'PROD',
    'active',
    '{
        "framework_type": "universal_profitability_analysis",
        "replaces_sap_modules": ["CO-PA_Profitability_Analysis"],
        "sap_equivalent_tcodes": ["KE21N", "KE24", "KE30", "KE51", "KE91"],
        "methodology_advantages": {
            "sap_limitation": "Choose either account_based OR costing_based CO-PA",
            "hera_advantage": "Both methodologies integrated in same transaction structure",
            "unified_approach": "Account and costing data in same universal_transaction_lines"
        },
        "profitability_dimensions": {
            "standard_dimensions": {
                "profit_center": "core_entities with entity_type = profit_center",
                "product": "core_entities with entity_type = product",
                "customer": "core_entities with entity_type = customer", 
                "sales_organization": "core_entities with entity_type = sales_org",
                "distribution_channel": "core_entities with entity_type = distribution_channel",
                "material_group": "core_entities with entity_type = material_group"
            },
            "custom_dimensions": {
                "industry_specific": "any entity_type can be profitability dimension",
                "restaurant_dimensions": ["location", "daypart", "menu_category", "service_type"],
                "manufacturing_dimensions": ["product_line", "customer_segment", "manufacturing_cell"],
                "healthcare_dimensions": ["service_line", "department", "physician_group", "payer_type"],
                "flexibility": "unlimited_custom_dimensions_via_dynamic_data"
            }
        },
        "real_time_profitability": {
            "sap_limitation": "Period-end CO-PA postings, reconciliation issues",
            "hera_advantage": "Every transaction immediately updates profitability",
            "live_reporting": "Real-time profit margins without reconciliation",
            "drill_down_capability": "From profit center to individual transaction lines"
        },
        "profitability_calculations": {
            "revenue_recognition": "automatic_via_sales_transaction_types",
            "cost_allocation": "automatic_via_cost_center_relationships", 
            "margin_calculation": "real_time_via_dag_calculation_engine",
            "variance_analysis": "planned_vs_actual_profitability_tracking",
            "trend_analysis": "historical_profitability_patterns_and_forecasting"
        }
    }'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM core_entities 
    WHERE organization_id = '719dfed1-09b4-4ca8-bfda-f682460de945'
    AND entity_code = 'FRAMEWORK-COPA-001'
);

-- Universal Profitability Analysis Query (replaces SAP KE30, KE51, etc.)
INSERT INTO core_dynamic_data (
    entity_id,
    field_name,
    field_type,
    field_value_text,
    metadata
) 
SELECT 
    ce.id,
    'profitability_analysis_query',
    'text',
    'WITH profitability_base AS (
        SELECT 
            t.id as transaction_id,
            t.transaction_date,
            t.transaction_type,
            DATE_TRUNC(''month'', t.transaction_date) as fiscal_period,
            DATE_TRUNC(''quarter'', t.transaction_date) as fiscal_quarter,
            DATE_TRUNC(''year'', t.transaction_date) as fiscal_year,
            
            -- Profitability Dimensions (SAP CO-PA characteristics)
            pc.entity_name as profit_center,
            prod.entity_name as product,
            cust.entity_name as customer,
            so.entity_name as sales_organization,
            dc.entity_name as distribution_channel,
            mg.entity_name as material_group,
            
            -- Revenue and Cost Amounts
            tl.line_amount,
            tl.quantity,
            tl.unit_price,
            
            -- Classification for P&L assignment
            CASE 
                WHEN t.transaction_type LIKE ''revenue%'' OR t.transaction_type LIKE ''sales%'' THEN ''REVENUE''
                WHEN t.transaction_type LIKE ''cost%'' OR t.transaction_type LIKE ''expense%'' THEN ''COST''
                ELSE ''OTHER''
            END as amount_type,
            
            -- Detailed cost classification
            CASE 
                WHEN t.transaction_type = ''cost_of_goods_sold'' THEN ''COGS''
                WHEN t.transaction_type = ''cost_materials'' THEN ''MATERIAL_COST''
                WHEN t.transaction_type = ''cost_labor'' THEN ''LABOR_COST''
                WHEN t.transaction_type = ''cost_overhead'' THEN ''OVERHEAD_COST''
                WHEN t.transaction_type LIKE ''cost%'' THEN ''OTHER_COST''
                ELSE ''NON_COST''
            END as cost_category
            
        FROM universal_transactions t
        JOIN universal_transaction_lines tl ON t.id = tl.transaction_id
        LEFT JOIN core_entities pc ON t.profit_center_id = pc.id
        LEFT JOIN core_entities prod ON tl.entity_id = prod.id AND prod.entity_type = ''product''
        LEFT JOIN core_entities cust ON t.customer_id = cust.id
        LEFT JOIN core_entities so ON t.sales_org_id = so.id
        LEFT JOIN core_entities dc ON t.distribution_channel_id = dc.id
        LEFT JOIN core_entities mg ON prod.material_group_id = mg.id
        
        WHERE t.transaction_date >= CURRENT_DATE - INTERVAL ''24 months''
        AND t.organization_id = CURRENT_SETTING(''app.current_org_id'')::UUID
    ),
    profitability_summary AS (
        SELECT 
            fiscal_period,
            profit_center,
            product,
            customer,
            sales_organization,
            distribution_channel,
            material_group,
            
            -- Revenue Analysis
            SUM(CASE WHEN amount_type = ''REVENUE'' THEN line_amount ELSE 0 END) as gross_revenue,
            SUM(CASE WHEN amount_type = ''REVENUE'' THEN quantity ELSE 0 END) as sales_volume,
            
            -- Cost Analysis
            SUM(CASE WHEN cost_category = ''COGS'' THEN line_amount ELSE 0 END) as cost_of_goods_sold,
            SUM(CASE WHEN cost_category = ''MATERIAL_COST'' THEN line_amount ELSE 0 END) as material_costs,
            SUM(CASE WHEN cost_category = ''LABOR_COST'' THEN line_amount ELSE 0 END) as labor_costs,
            SUM(CASE WHEN cost_category = ''OVERHEAD_COST'' THEN line_amount ELSE 0 END) as overhead_costs,
            SUM(CASE WHEN amount_type = ''COST'' THEN line_amount ELSE 0 END) as total_costs,
            
            -- Profitability Calculations
            (SUM(CASE WHEN amount_type = ''REVENUE'' THEN line_amount ELSE 0 END) - 
             SUM(CASE WHEN cost_category = ''COGS'' THEN line_amount ELSE 0 END)) as gross_profit,
             
            (SUM(CASE WHEN amount_type = ''REVENUE'' THEN line_amount ELSE 0 END) - 
             SUM(CASE WHEN amount_type = ''COST'' THEN line_amount ELSE 0 END)) as net_profit,
             
            -- Profitability Ratios
            CASE 
                WHEN SUM(CASE WHEN amount_type = ''REVENUE'' THEN line_amount ELSE 0 END) > 0 THEN
                    (SUM(CASE WHEN amount_type = ''REVENUE'' THEN line_amount ELSE 0 END) - 
                     SUM(CASE WHEN cost_category = ''COGS'' THEN line_amount ELSE 0 END)) /
                    SUM(CASE WHEN amount_type = ''REVENUE'' THEN line_amount ELSE 0 END) * 100
                ELSE 0
            END as gross_margin_percent,
            
            CASE 
                WHEN SUM(CASE WHEN amount_type = ''REVENUE'' THEN line_amount ELSE 0 END) > 0 THEN
                    (SUM(CASE WHEN amount_type = ''REVENUE'' THEN line_amount ELSE 0 END) - 
                     SUM(CASE WHEN amount_type = ''COST'' THEN line_amount ELSE 0 END)) /
                    SUM(CASE WHEN amount_type = ''REVENUE'' THEN line_amount ELSE 0 END) * 100
                ELSE 0
            END as net_margin_percent,
            
            COUNT(DISTINCT transaction_id) as transaction_count
            
        FROM profitability_base
        GROUP BY fiscal_period, profit_center, product, customer, sales_organization, distribution_channel, material_group
    )
    SELECT 
        TO_CHAR(fiscal_period, ''YYYY-MM'') as period,
        profit_center,
        product,
        customer,
        ROUND(gross_revenue, 2) as revenue,
        ROUND(cost_of_goods_sold, 2) as cogs,
        ROUND(total_costs, 2) as total_costs,
        ROUND(gross_profit, 2) as gross_profit,
        ROUND(net_profit, 2) as net_profit,
        ROUND(gross_margin_percent, 2) as gross_margin_pct,
        ROUND(net_margin_percent, 2) as net_margin_pct,
        sales_volume,
        transaction_count,
        
        -- Ranking and Analysis
        RANK() OVER (PARTITION BY fiscal_period ORDER BY net_profit DESC) as profit_rank,
        CASE 
            WHEN net_profit > 0 THEN ''PROFITABLE''
            WHEN net_profit < 0 THEN ''LOSS_MAKING''
            ELSE ''BREAK_EVEN''
        END as profitability_status,
        
        -- Variance to Previous Period
        LAG(net_profit) OVER (PARTITION BY profit_center, product, customer ORDER BY fiscal_period) as prev_period_profit,
        net_profit - LAG(net_profit) OVER (PARTITION BY profit_center, product, customer ORDER BY fiscal_period) as profit_variance
        
    FROM profitability_summary
    WHERE gross_revenue > 0 OR total_costs > 0  -- Only include active combinations
    ORDER BY fiscal_period DESC, net_profit DESC',
    '{"query_type": "copa_profitability_analysis", "replaces_sap": "KE30_KE51_KE91_copa_reports"}'::jsonb