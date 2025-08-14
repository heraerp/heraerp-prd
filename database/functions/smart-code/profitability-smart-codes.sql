-- HERA Profitability & Cost Accounting Smart Codes
-- Comprehensive cost accounting and profitability analysis system

-- ================================================
-- PROFIT CENTER SMART CODES
-- ================================================

-- Profit Center Entity Management
INSERT INTO smart_code_definitions (smart_code, description, category, entity_type, business_rules) VALUES
('HERA.PROF.PC.CREATE.v1', 'Create profit center', 'profitability', 'profit_center', 
  '{"required_fields": ["center_name", "center_type", "cost_center_code"], "validations": ["unique_code", "valid_hierarchy"]}'),

('HERA.PROF.PC.MFG.v1', 'Manufacturing profit center', 'profitability', 'profit_center',
  '{"center_type": "manufacturing", "allocation_basis": "machine_hours", "overhead_rates": true}'),

('HERA.PROF.PC.SALES.v1', 'Sales & distribution profit center', 'profitability', 'profit_center',
  '{"center_type": "sales", "allocation_basis": "revenue", "commission_tracking": true}'),

('HERA.PROF.PC.SVC.v1', 'Service department profit center', 'profitability', 'profit_center',
  '{"center_type": "service", "allocation_basis": "service_hours", "utilization_tracking": true}'),

('HERA.PROF.PC.ADMIN.v1', 'Administrative profit center', 'profitability', 'profit_center',
  '{"center_type": "admin", "allocation_basis": "headcount", "indirect_cost_pool": true}');

-- ================================================
-- COST ACCOUNTING SMART CODES
-- ================================================

-- Product Costing
INSERT INTO smart_code_definitions (smart_code, description, category, entity_type, business_rules) VALUES
('HERA.COST.PROD.CALC.v1', 'Calculate product cost with BOM', 'cost_accounting', 'product_cost',
  '{"calculation_method": "standard_costing", "bom_integration": true, "overhead_allocation": "activity_based"}'),

('HERA.COST.PROD.MATERIAL.v1', 'Direct material cost from BOM', 'cost_accounting', 'cost_component',
  '{"cost_type": "direct_material", "source": "bom_explosion", "includes_scrap": true}'),

('HERA.COST.PROD.LABOR.v1', 'Direct labor cost calculation', 'cost_accounting', 'cost_component',
  '{"cost_type": "direct_labor", "includes_benefits": true, "efficiency_factor": 0.85}'),

('HERA.COST.PROD.OVERHEAD.v1', 'Manufacturing overhead allocation', 'cost_accounting', 'cost_component',
  '{"cost_type": "overhead", "allocation_method": "activity_based", "update_frequency": "monthly"}');

-- Cost Pool Management
INSERT INTO smart_code_definitions (smart_code, description, category, entity_type, business_rules) VALUES
('HERA.COST.POOL.CREATE.v1', 'Create cost pool for ABC', 'cost_accounting', 'cost_pool',
  '{"pool_types": ["activity", "resource", "process"], "driver_required": true}'),

('HERA.COST.POOL.MH.v1', 'Machine hours cost pool', 'cost_accounting', 'cost_pool',
  '{"driver": "machine_hours", "allocation_basis": "actual_usage", "rate_calculation": "total_cost/total_hours"}'),

('HERA.COST.POOL.SETUP.v1', 'Setup cost pool', 'cost_accounting', 'cost_pool',
  '{"driver": "number_of_setups", "allocation_basis": "setup_complexity", "batch_costing": true}'),

('HERA.COST.POOL.QC.v1', 'Quality control cost pool', 'cost_accounting', 'cost_pool',
  '{"driver": "inspection_hours", "allocation_basis": "quality_points", "defect_tracking": true}');

-- ================================================
-- COST ALLOCATION SMART CODES
-- ================================================

INSERT INTO smart_code_definitions (smart_code, description, category, entity_type, business_rules) VALUES
('HERA.COST.ALLOC.ABC.v1', 'Activity-based cost allocation', 'cost_allocation', 'allocation_rule',
  '{"method": "activity_based_costing", "multi_driver": true, "real_time_update": true}'),

('HERA.COST.ALLOC.STEP.v1', 'Step-down cost allocation', 'cost_allocation', 'allocation_rule',
  '{"method": "step_down", "service_dept_order": "by_cost", "reciprocal_services": false}'),

('HERA.COST.ALLOC.DIRECT.v1', 'Direct cost allocation', 'cost_allocation', 'allocation_rule',
  '{"method": "direct", "traceability": "full", "documentation_required": true}'),

('HERA.COST.ALLOC.RECIP.v1', 'Reciprocal cost allocation', 'cost_allocation', 'allocation_rule',
  '{"method": "reciprocal", "iteration_limit": 100, "convergence_threshold": 0.01}');

-- ================================================
-- PROFITABILITY ANALYSIS SMART CODES
-- ================================================

INSERT INTO smart_code_definitions (smart_code, description, category, entity_type, business_rules) VALUES
('HERA.PROF.ANAL.PROD.v1', 'Product profitability analysis', 'profitability_analysis', 'analysis',
  '{"dimensions": ["product", "customer", "channel"], "margin_levels": ["gross", "contribution", "net"]}'),

('HERA.PROF.ANAL.CUST.v1', 'Customer profitability analysis', 'profitability_analysis', 'analysis',
  '{"includes_service_cost": true, "lifetime_value": true, "segmentation": "auto"}'),

('HERA.PROF.ANAL.SEG.v1', 'Segment profitability analysis', 'profitability_analysis', 'analysis',
  '{"segment_types": ["geographic", "industry", "size"], "comparison_enabled": true}'),

('HERA.PROF.ANAL.CHAN.v1', 'Channel profitability analysis', 'profitability_analysis', 'analysis',
  '{"channels": ["direct", "distributor", "online"], "includes_marketing_cost": true}');

-- ================================================
-- VARIANCE ANALYSIS SMART CODES
-- ================================================

INSERT INTO smart_code_definitions (smart_code, description, category, entity_type, business_rules) VALUES
('HERA.COST.VAR.PRICE.v1', 'Material price variance', 'variance_analysis', 'variance',
  '{"variance_type": "price", "formula": "(actual_price - standard_price) * actual_quantity"}'),

('HERA.COST.VAR.QTY.v1', 'Material quantity variance', 'variance_analysis', 'variance',
  '{"variance_type": "quantity", "formula": "(actual_qty - standard_qty) * standard_price"}'),

('HERA.COST.VAR.LABOR.v1', 'Labor efficiency variance', 'variance_analysis', 'variance',
  '{"variance_type": "labor_efficiency", "formula": "(actual_hours - standard_hours) * standard_rate"}'),

('HERA.COST.VAR.OVERHEAD.v1', 'Overhead volume variance', 'variance_analysis', 'variance',
  '{"variance_type": "overhead_volume", "includes": ["fixed_overhead", "variable_overhead"]}');

-- ================================================
-- REPORTING SMART CODES
-- ================================================

INSERT INTO smart_code_definitions (smart_code, description, category, entity_type, business_rules) VALUES
('HERA.PROF.REPT.P&L.v1', 'Profit center P&L report', 'reporting', 'report',
  '{"report_type": "profit_loss", "by_profit_center": true, "consolidation": true}'),

('HERA.PROF.REPT.MARGIN.v1', 'Margin analysis report', 'reporting', 'report',
  '{"margin_types": ["gross", "contribution", "operating", "net"], "trend_analysis": true}'),

('HERA.PROF.REPT.COST.v1', 'Cost structure report', 'reporting', 'report',
  '{"cost_categories": ["direct", "indirect", "fixed", "variable"], "drill_down": true}'),

('HERA.PROF.REPT.EXEC.v1', 'Executive profitability dashboard', 'reporting', 'report',
  '{"kpis": ["roi", "profit_margin", "cost_ratio", "breakeven"], "real_time": true}');

-- ================================================
-- INTEGRATION SMART CODES
-- ================================================

INSERT INTO smart_code_definitions (smart_code, description, category, entity_type, business_rules) VALUES
('HERA.PROF.INT.BOM.v1', 'BOM cost integration', 'integration', 'interface',
  '{"source": "bom_system", "sync_frequency": "real_time", "cost_rollup": true}'),

('HERA.PROF.INT.GL.v1', 'General ledger integration', 'integration', 'interface',
  '{"target": "general_ledger", "posting_rules": "automated", "reconciliation": true}'),

('HERA.PROF.INT.INV.v1', 'Inventory costing integration', 'integration', 'interface',
  '{"costing_method": ["standard", "average", "fifo"], "perpetual_update": true}'),

('HERA.PROF.INT.SALES.v1', 'Sales profitability integration', 'integration', 'interface',
  '{"includes": ["revenue", "discounts", "commissions"], "margin_calculation": "auto"}');

-- ================================================
-- AI-POWERED OPTIMIZATION SMART CODES
-- ================================================

INSERT INTO smart_code_definitions (smart_code, description, category, entity_type, business_rules) VALUES
('HERA.PROF.AI.OPT.v1', 'AI cost optimization recommendations', 'ai_optimization', 'ai_analysis',
  '{"ml_models": ["cost_prediction", "demand_forecast", "price_optimization"], "confidence_threshold": 0.85}'),

('HERA.PROF.AI.ALLOC.v1', 'AI-driven cost allocation', 'ai_optimization', 'ai_analysis',
  '{"learning_from": "historical_patterns", "adjustment_frequency": "weekly", "human_approval": true}'),

('HERA.PROF.AI.PREDICT.v1', 'Profitability prediction model', 'ai_optimization', 'ai_analysis',
  '{"prediction_horizon": "12_months", "factors": ["market", "cost", "competition"], "accuracy_target": 0.9}'),

('HERA.PROF.AI.ANOMALY.v1', 'Cost anomaly detection', 'ai_optimization', 'ai_analysis',
  '{"detection_methods": ["statistical", "ml_based"], "alert_threshold": "2_sigma", "auto_investigation": true}');

-- Create indexes for performance
CREATE INDEX idx_smart_code_profitability ON smart_code_definitions(smart_code) 
WHERE smart_code LIKE 'HERA.PROF%' OR smart_code LIKE 'HERA.COST%';

-- Create profitability-specific functions
CREATE OR REPLACE FUNCTION calculate_product_profitability(
  p_product_id UUID,
  p_organization_id UUID,
  p_include_allocations BOOLEAN DEFAULT true
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
  v_direct_cost DECIMAL(15,2);
  v_allocated_cost DECIMAL(15,2);
  v_selling_price DECIMAL(15,2);
BEGIN
  -- Get direct costs from BOM
  SELECT SUM(material_cost + labor_cost) INTO v_direct_cost
  FROM product_costs
  WHERE product_id = p_product_id
    AND organization_id = p_organization_id;
  
  -- Get allocated overhead if requested
  IF p_include_allocations THEN
    SELECT SUM(allocated_amount) INTO v_allocated_cost
    FROM cost_allocations
    WHERE entity_id = p_product_id
      AND organization_id = p_organization_id
      AND allocation_period = date_trunc('month', CURRENT_DATE);
  ELSE
    v_allocated_cost := 0;
  END IF;
  
  -- Get selling price
  SELECT current_price INTO v_selling_price
  FROM product_pricing
  WHERE product_id = p_product_id
    AND organization_id = p_organization_id
    AND CURRENT_DATE BETWEEN effective_date AND COALESCE(expiry_date, '9999-12-31');
  
  -- Calculate profitability metrics
  v_result := jsonb_build_object(
    'product_id', p_product_id,
    'direct_cost', v_direct_cost,
    'allocated_overhead', v_allocated_cost,
    'total_cost', v_direct_cost + v_allocated_cost,
    'selling_price', v_selling_price,
    'gross_margin', v_selling_price - v_direct_cost,
    'gross_margin_pct', ((v_selling_price - v_direct_cost) / NULLIF(v_selling_price, 0) * 100),
    'net_margin', v_selling_price - (v_direct_cost + v_allocated_cost),
    'net_margin_pct', ((v_selling_price - (v_direct_cost + v_allocated_cost)) / NULLIF(v_selling_price, 0) * 100),
    'calculated_at', CURRENT_TIMESTAMP
  );
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Activity-based costing allocation function
CREATE OR REPLACE FUNCTION allocate_activity_costs(
  p_organization_id UUID,
  p_period DATE
) RETURNS VOID AS $$
DECLARE
  v_cost_pool RECORD;
  v_total_driver_units DECIMAL(15,4);
  v_rate_per_unit DECIMAL(15,4);
BEGIN
  -- Process each cost pool
  FOR v_cost_pool IN 
    SELECT * FROM cost_pools 
    WHERE organization_id = p_organization_id 
      AND status = 'active'
  LOOP
    -- Calculate total driver units for the period
    SELECT SUM(driver_quantity) INTO v_total_driver_units
    FROM activity_drivers
    WHERE cost_pool_id = v_cost_pool.id
      AND period = p_period;
    
    -- Calculate rate per driver unit
    v_rate_per_unit := v_cost_pool.total_cost / NULLIF(v_total_driver_units, 0);
    
    -- Allocate costs to cost objects
    INSERT INTO cost_allocations (
      organization_id,
      cost_pool_id,
      entity_id,
      allocation_period,
      driver_quantity,
      rate_per_unit,
      allocated_amount,
      smart_code
    )
    SELECT
      p_organization_id,
      v_cost_pool.id,
      ad.cost_object_id,
      p_period,
      ad.driver_quantity,
      v_rate_per_unit,
      ad.driver_quantity * v_rate_per_unit,
      'HERA.COST.ALLOC.ABC.v1'
    FROM activity_drivers ad
    WHERE ad.cost_pool_id = v_cost_pool.id
      AND ad.period = p_period;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calculate_product_profitability IS 'HERA Profitability calculation with BOM integration and ABC costing';
COMMENT ON FUNCTION allocate_activity_costs IS 'HERA Activity-based cost allocation engine';