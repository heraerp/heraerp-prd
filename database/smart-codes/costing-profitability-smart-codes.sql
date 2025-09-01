-- =============================================
-- HERA COSTING & PROFITABILITY SMART CODES v1
-- Revolutionary enterprise costing on 6 tables
-- =============================================

-- Smart Code Registry for Costing & Profitability
-- Following HERA DNA pattern: HERA.{MODULE}.{FUNCTION}.{OPERATION}.v{VERSION}

-- COSTING MODULE
-- =============

-- Standard Costing
INSERT INTO smart_code_registry (smart_code, description, category, metadata) VALUES
('HERA.COSTING.STD.ESTIMATE.v1', 'Standard cost roll-up (BOM + routing + rates + OH)', 'costing_transaction', 
  '{"requires_bom": true, "requires_routing": true, "cost_components": ["material", "labor", "overhead"]}'::jsonb),

('HERA.COSTING.STD.ESTIMATE.LINE.v1', 'Standard cost estimate line item', 'costing_line', 
  '{"line_types": ["material", "activity", "overhead", "subcontract"]}'::jsonb),

('HERA.COSTING.ACTUAL.ROLLUP.v1', 'Period actuals → cost component split', 'costing_transaction',
  '{"period_based": true, "variance_calculation": true}'::jsonb),

('HERA.COSTING.ACTUAL.ROLLUP.LINE.v1', 'Actual cost rollup line item', 'costing_line',
  '{"captures_variances": true}'::jsonb),

-- Rate Management
('HERA.COSTING.RATE.SET.v1', 'Set/update activity rates', 'costing_master',
  '{"rate_types": ["labor", "machine", "setup", "overhead"]}'::jsonb),

('HERA.COSTING.RATE.HISTORY.v1', 'Activity rate change history', 'costing_audit',
  '{"tracks_effective_dates": true}'::jsonb),

-- Overhead Application
('HERA.COSTING.OVERHEAD.APPLY.v1', 'Apply OH keys/schemes', 'costing_transaction',
  '{"allocation_bases": ["labor_hours", "machine_hours", "material_cost", "units"]}'::jsonb),

('HERA.COSTING.OVERHEAD.SCHEME.v1', 'Overhead calculation scheme', 'costing_master',
  '{"scheme_types": ["percentage", "rate_per_unit", "tiered"]}'::jsonb),

-- Landed Cost Distribution
('HERA.COSTING.LANDED.DISTRIBUTE.v1', 'Freight/duty/other → cost layers', 'costing_transaction',
  '{"distribution_methods": ["weight", "volume", "value", "quantity"]}'::jsonb),

('HERA.COSTING.LANDED.COMPONENT.v1', 'Landed cost component', 'costing_line',
  '{"component_types": ["freight", "duty", "insurance", "handling"]}'::jsonb),

-- ALLOCATION MODULE
-- ================

-- Assessment Allocations
('HERA.COSTING.ALLOC.ASSESS.v1', 'Assessment (sender CC → receivers)', 'allocation_transaction',
  '{"allocation_type": "assessment", "requires_drivers": true}'::jsonb),

('HERA.COSTING.ALLOC.ASSESS.LINE.v1', 'Assessment allocation line', 'allocation_line',
  '{"line_role": ["sender", "receiver"], "must_balance": true}'::jsonb),

-- Distribution Allocations  
('HERA.COSTING.ALLOC.DISTRIB.v1', 'Distribution (move primary costs)', 'allocation_transaction',
  '{"allocation_type": "distribution", "primary_costs_only": true}'::jsonb),

('HERA.COSTING.ALLOC.DISTRIB.LINE.v1', 'Distribution allocation line', 'allocation_line',
  '{"preserves_cost_elements": true}'::jsonb),

-- Allocation Configuration
('HERA.COSTING.ALLOC.CYCLE.v1', 'Allocation cycle definition', 'allocation_master',
  '{"supports_iterations": true, "max_iterations": 10}'::jsonb),

('HERA.COSTING.ALLOC.DRIVER.v1', 'Allocation driver configuration', 'allocation_master',
  '{"driver_sources": ["statistical_key", "posted_amounts", "quantities"]}'::jsonb),

-- PROFITABILITY MODULE
-- ===================

-- Contribution Margin Analysis
('HERA.PROFIT.CM.CALC.v1', 'CM bridge (CM1/CM2... by slice)', 'profitability_transaction',
  '{"margin_levels": ["CM1", "CM2", "CM3", "EBIT"], "multi_dimensional": true}'::jsonb),

('HERA.PROFIT.CM.DETAIL.v1', 'Contribution margin detail line', 'profitability_line',
  '{"cost_categories": ["variable_material", "variable_labor", "fixed_overhead"]}'::jsonb),

-- Price-Volume-Mix Analysis
('HERA.PROFIT.PVM.CALC.v1', 'Price–volume–mix analysis', 'profitability_transaction',
  '{"variance_types": ["price", "volume", "mix", "fx"]}'::jsonb),

('HERA.PROFIT.PVM.BRIDGE.v1', 'PVM bridge detail', 'profitability_line',
  '{"comparison_periods": true, "waterfall_ready": true}'::jsonb),

-- Multi-Dimensional Margin Analysis
('HERA.PROFIT.MARGIN.ANALYZE.v1', 'Multi-dim margin (product/customer/channel/region)', 'profitability_transaction',
  '{"dimensions": ["product", "customer", "channel", "region", "time"]}'::jsonb),

('HERA.PROFIT.MARGIN.SLICE.v1', 'Margin analysis slice', 'profitability_line',
  '{"supports_drill_down": true, "hierarchical": true}'::jsonb),

-- ABC Costing
('HERA.PROFIT.ABC.CALC.v1', 'Activity-based costing calculation', 'profitability_transaction',
  '{"activity_based": true, "cost_pools": true}'::jsonb),

('HERA.PROFIT.ABC.ACTIVITY.v1', 'ABC activity consumption', 'profitability_line',
  '{"tracks_cost_drivers": true}'::jsonb),

-- MASTER DATA & CONFIG
-- ===================

-- BOM for Costing
('HERA.COSTING.BOM.COSTED.v1', 'Costed bill of materials', 'costing_master',
  '{"includes_scrap": true, "multi_level": true}'::jsonb),

-- Routing for Costing
('HERA.COSTING.ROUTING.RATED.v1', 'Routing with activity rates', 'costing_master',
  '{"includes_setup": true, "parallel_sequences": true}'::jsonb),

-- Cost Component Structure
('HERA.COSTING.CCS.DEFINE.v1', 'Cost component structure definition', 'costing_config',
  '{"standard_components": 40, "user_defined": 20}'::jsonb),

-- Costing Variant
('HERA.COSTING.VARIANT.CONFIG.v1', 'Costing variant configuration', 'costing_config',
  '{"variant_types": ["standard", "actual", "planned", "modified"]}'::jsonb),

-- EVENTS & INTEGRATION
-- ===================

('HERA.COSTING.EVENT.RELEASED.v1', 'Cost estimate released', 'costing_event',
  '{"triggers_downstream": true, "immutable": true}'::jsonb),

('HERA.COSTING.EVENT.MARKED.v1', 'Cost estimate marked for use', 'costing_event',
  '{"affects_inventory_valuation": true}'::jsonb),

('HERA.PROFIT.EVENT.PUBLISHED.v1', 'Profitability results published', 'profitability_event',
  '{"distribution_list": true, "snapshot": true}'::jsonb),

-- ERROR HANDLING
('HERA.COSTING.ERROR.CIRCULAR.v1', 'Circular BOM/allocation detected', 'costing_error',
  '{"error_type": "circular_reference", "severity": "critical"}'::jsonb),

('HERA.COSTING.ERROR.UNBALANCED.v1', 'Allocation not balanced', 'costing_error',
  '{"error_type": "balance_check", "severity": "critical"}'::jsonb);

-- Grant permissions
GRANT SELECT ON smart_code_registry TO authenticated;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_smart_code_category ON smart_code_registry(category);
CREATE INDEX IF NOT EXISTS idx_smart_code_pattern ON smart_code_registry(smart_code text_pattern_ops);