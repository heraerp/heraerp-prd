#!/usr/bin/env node

/**
 * HERA Furniture Module - Phase 6: Universal Configuration Rules (UCR)
 * 
 * Revolutionary business logic system that stores rules as data, not code.
 * This enables configuration-driven behavior without any schema changes.
 * 
 * Architecture: All rules stored as entities with logic in core_dynamic_data
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * UCR Rule Type Definitions
 * Revolutionary approach: Business rules as first-class entities
 */
const UCR_RULE_TYPES = {
  // Core Rule Types
  VALIDATION: {
    entity_type: 'ucr_rule',
    rule_type: 'validation',
    smart_code: 'HERA.IND.FURN.UCR.Validation.V1',
    description: 'Validates data according to business constraints'
  },
  
  DEFAULTING: {
    entity_type: 'ucr_rule',
    rule_type: 'defaulting',
    smart_code: 'HERA.IND.FURN.UCR.Defaulting.V1',
    description: 'Provides default values for fields'
  },
  
  CALCULATION: {
    entity_type: 'ucr_rule',
    rule_type: 'calculation',
    smart_code: 'HERA.IND.FURN.UCR.Calculation.V1',
    description: 'Performs calculations and derivations'
  },
  
  ROUTING: {
    entity_type: 'ucr_rule',
    rule_type: 'routing',
    smart_code: 'HERA.IND.FURN.UCR.Routing.V1',
    description: 'Determines workflow routing and assignments'
  },
  
  ELIGIBILITY: {
    entity_type: 'ucr_rule',
    rule_type: 'eligibility',
    smart_code: 'HERA.IND.FURN.UCR.Eligibility.V1',
    description: 'Checks if entities qualify for certain operations'
  },
  
  // Advanced Rule Types
  APPROVAL: {
    entity_type: 'ucr_rule',
    rule_type: 'approval',
    smart_code: 'HERA.IND.FURN.UCR.Approval.V1',
    description: 'Manages approval workflows and limits'
  },
  
  PRICING: {
    entity_type: 'ucr_rule',
    rule_type: 'pricing',
    smart_code: 'HERA.IND.FURN.UCR.Pricing.V1',
    description: 'Calculates pricing based on various factors'
  },
  
  TAX: {
    entity_type: 'ucr_rule',
    rule_type: 'tax',
    smart_code: 'HERA.IND.FURN.UCR.Tax.V1',
    description: 'Calculates taxes based on jurisdiction and product type'
  },
  
  SUBSTITUTION: {
    entity_type: 'ucr_rule',
    rule_type: 'substitution',
    smart_code: 'HERA.IND.FURN.UCR.Substitution.V1',
    description: 'Suggests alternative materials or products'
  },
  
  UOM_CONVERSION: {
    entity_type: 'ucr_rule',
    rule_type: 'uom_conversion',
    smart_code: 'HERA.IND.FURN.UCR.UoMConversion.V1',
    description: 'Converts between units of measure'
  },
  
  SLA: {
    entity_type: 'ucr_rule',
    rule_type: 'sla',
    smart_code: 'HERA.IND.FURN.UCR.SLA.V1',
    description: 'Manages service level agreements and promised dates'
  }
};

/**
 * Create a UCR rule entity
 */
async function createUCRRule({
  ruleName,
  ruleType,
  smartCode,
  organizationId,
  metadata = {}
}) {
  const { data, error } = await supabase
    .from('core_entities')
    .insert({
      entity_type: 'ucr_rule',
      entity_name: ruleName,
      entity_code: `UCR-${ruleType.toUpperCase()}-${Date.now()}`,
      smart_code: smartCode,
      organization_id: organizationId,
      metadata: {
        rule_type: ruleType,
        ...metadata
      }
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Add rule logic to dynamic data
 */
async function addRuleLogic({
  ruleId,
  scope,
  condition,
  action,
  parameters,
  priority = 100,
  organizationId
}) {
  const ruleLogic = [
    {
      entity_id: ruleId,
      field_name: 'rule_scope',
      field_type: 'json',
      field_value_json: JSON.stringify(scope),
      smart_code: 'HERA.UCR.LOGIC.SCOPE.V1',
      organization_id: organizationId
    },
    {
      entity_id: ruleId,
      field_name: 'rule_condition',
      field_type: 'json',
      field_value_json: JSON.stringify(condition),
      smart_code: 'HERA.UCR.LOGIC.CONDITION.V1',
      organization_id: organizationId
    },
    {
      entity_id: ruleId,
      field_name: 'rule_action',
      field_type: 'json',
      field_value_json: JSON.stringify(action),
      smart_code: 'HERA.UCR.LOGIC.ACTION.V1',
      organization_id: organizationId
    },
    {
      entity_id: ruleId,
      field_name: 'rule_parameters',
      field_type: 'json',
      field_value_json: JSON.stringify(parameters),
      smart_code: 'HERA.UCR.LOGIC.PARAMETERS.V1',
      organization_id: organizationId
    },
    {
      entity_id: ruleId,
      field_name: 'rule_priority',
      field_type: 'number',
      field_value_number: priority,
      smart_code: 'HERA.UCR.LOGIC.PRIORITY.V1',
      organization_id: organizationId
    }
  ];

  const { error } = await supabase
    .from('core_dynamic_data')
    .insert(ruleLogic);

  if (error) throw error;
}

/**
 * Create furniture-specific validation rules
 */
async function createFurnitureValidationRules(organizationId) {
  console.log('\n📏 Creating Furniture Validation Rules...');

  // 1. Product Dimension Validation
  const dimensionRule = await createUCRRule({
    ruleName: 'Furniture Product Dimension Validation',
    ruleType: 'validation',
    smartCode: UCR_RULE_TYPES.VALIDATION.smart_code,
    organizationId,
    metadata: {
      description: 'Ensures furniture dimensions are within acceptable ranges',
      severity: 'error'
    }
  });

  await addRuleLogic({
    ruleId: dimensionRule.id,
    scope: {
      entity_type: 'product',
      smart_code_pattern: 'HERA.FURNITURE.PRODUCT.*'
    },
    condition: {
      type: 'AND',
      rules: [
        { field: 'length_cm', operator: 'exists' },
        { field: 'width_cm', operator: 'exists' },
        { field: 'height_cm', operator: 'exists' }
      ]
    },
    action: {
      type: 'validate',
      validations: [
        { field: 'length_cm', min: 10, max: 500, message: 'Length must be between 10-500 cm' },
        { field: 'width_cm', min: 10, max: 300, message: 'Width must be between 10-300 cm' },
        { field: 'height_cm', min: 10, max: 300, message: 'Height must be between 10-300 cm' }
      ]
    },
    parameters: {
      apply_to_dynamic_data: true,
      block_save_on_failure: true
    },
    priority: 100,
    organizationId
  });

  // 2. Material Compatibility Validation
  const materialRule = await createUCRRule({
    ruleName: 'Furniture Material Compatibility Check',
    ruleType: 'validation',
    smartCode: UCR_RULE_TYPES.VALIDATION.smart_code,
    organizationId,
    metadata: {
      description: 'Validates material combinations in furniture products',
      severity: 'warning'
    }
  });

  await addRuleLogic({
    ruleId: materialRule.id,
    scope: {
      entity_type: 'bom',
      relationship_type: 'includes_component'
    },
    condition: {
      type: 'EXISTS',
      field: 'material_type'
    },
    action: {
      type: 'validate_compatibility',
      incompatible_pairs: [
        { material1: 'metal', material2: 'untreated_wood', message: 'Metal and untreated wood may cause corrosion' },
        { material1: 'glass', material2: 'rough_metal', message: 'Glass requires polished metal edges' }
      ]
    },
    parameters: {
      check_all_components: true,
      severity: 'warning'
    },
    priority: 90,
    organizationId
  });

  console.log('✅ Validation rules created successfully');
}

/**
 * Create pricing calculation rules
 */
async function createPricingRules(organizationId) {
  console.log('\n💰 Creating Pricing Rules...');

  // 1. Standard Markup Pricing
  const markupRule = await createUCRRule({
    ruleName: 'Furniture Standard Markup Pricing',
    ruleType: 'pricing',
    smartCode: UCR_RULE_TYPES.PRICING.smart_code,
    organizationId,
    metadata: {
      description: 'Calculates selling price based on cost plus markup',
      pricing_model: 'cost_plus'
    }
  });

  await addRuleLogic({
    ruleId: markupRule.id,
    scope: {
      entity_type: 'product',
      smart_code_pattern: 'HERA.FURNITURE.PRODUCT.*'
    },
    condition: {
      type: 'AND',
      rules: [
        { field: 'standard_cost_rate', operator: 'greater_than', value: 0 },
        { field: 'pricing_method', operator: 'equals', value: 'standard_markup' }
      ]
    },
    action: {
      type: 'calculate_price',
      formula: 'standard_cost_rate * markup_multiplier',
      round_to: 2
    },
    parameters: {
      markup_multiplier: 2.5,  // 150% markup
      min_margin_percent: 40,
      max_discount_percent: 20
    },
    priority: 100,
    organizationId
  });

  // 2. Volume-Based Pricing
  const volumeRule = await createUCRRule({
    ruleName: 'Furniture Volume Discount Pricing',
    ruleType: 'pricing',
    smartCode: UCR_RULE_TYPES.PRICING.smart_code,
    organizationId,
    metadata: {
      description: 'Applies volume discounts based on quantity',
      pricing_model: 'tiered_discount'
    }
  });

  await addRuleLogic({
    ruleId: volumeRule.id,
    scope: {
      entity_type: 'sales_order_line',
      product_type: 'furniture'
    },
    condition: {
      type: 'ALWAYS',
      description: 'Apply to all furniture order lines'
    },
    action: {
      type: 'apply_volume_discount',
      tiers: [
        { min_qty: 1, max_qty: 4, discount_percent: 0 },
        { min_qty: 5, max_qty: 9, discount_percent: 5 },
        { min_qty: 10, max_qty: 24, discount_percent: 10 },
        { min_qty: 25, max_qty: null, discount_percent: 15 }
      ]
    },
    parameters: {
      apply_to_base_price: true,
      stackable_with_other_discounts: false
    },
    priority: 90,
    organizationId
  });

  console.log('✅ Pricing rules created successfully');
}

/**
 * Create approval workflow rules
 */
async function createApprovalRules(organizationId) {
  console.log('\n✅ Creating Approval Rules...');

  // Discount Approval Rule
  const discountApproval = await createUCRRule({
    ruleName: 'Furniture Discount Approval Workflow',
    ruleType: 'approval',
    smartCode: UCR_RULE_TYPES.APPROVAL.smart_code,
    organizationId,
    metadata: {
      description: 'Requires approval for discounts above threshold',
      workflow_type: 'discount_approval'
    }
  });

  await addRuleLogic({
    ruleId: discountApproval.id,
    scope: {
      entity_type: 'sales_order',
      transaction_type: 'sale'
    },
    condition: {
      type: 'OR',
      rules: [
        { field: 'discount_percent', operator: 'greater_than', value: 15 },
        { field: 'discount_amount', operator: 'greater_than', value: 5000 }
      ]
    },
    action: {
      type: 'require_approval',
      approval_levels: [
        { threshold: 15, role: 'sales_manager', reason: 'Discount exceeds 15%' },
        { threshold: 25, role: 'general_manager', reason: 'Discount exceeds 25%' },
        { threshold: 35, role: 'ceo', reason: 'Exceptional discount requires CEO approval' }
      ]
    },
    parameters: {
      auto_escalate_hours: 24,
      notify_via: ['email', 'system_notification'],
      block_processing: true
    },
    priority: 100,
    organizationId
  });

  console.log('✅ Approval rules created successfully');
}

/**
 * Create SLA (Service Level Agreement) rules
 */
async function createSLARules(organizationId) {
  console.log('\n📅 Creating SLA Rules...');

  // Delivery Promise Rule
  const deliveryRule = await createUCRRule({
    ruleName: 'Furniture Delivery Promise SLA',
    ruleType: 'sla',
    smartCode: UCR_RULE_TYPES.SLA.smart_code,
    organizationId,
    metadata: {
      description: 'Calculates promised delivery dates based on product type',
      sla_type: 'delivery_promise'
    }
  });

  await addRuleLogic({
    ruleId: deliveryRule.id,
    scope: {
      entity_type: 'sales_order_line',
      product_category: 'furniture'
    },
    condition: {
      type: 'ALWAYS'
    },
    action: {
      type: 'calculate_sla_date',
      base_field: 'order_date',
      method: 'add_business_days',
      holidays_calendar: 'AE_HOLIDAYS'
    },
    parameters: {
      lead_times: {
        'in_stock': 3,
        'make_to_order': 21,
        'custom': 45,
        'imported': 60
      },
      buffer_days: 2,
      exclude_weekends: true
    },
    priority: 100,
    organizationId
  });

  console.log('✅ SLA rules created successfully');
}

/**
 * Display UCR statistics
 */
async function displayUCRStats(organizationId) {
  console.log('\n📊 UCR RULE STATISTICS:');
  
  const { data: rules } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'ucr_rule');

  const rulesByType = {};
  rules?.forEach(rule => {
    const ruleType = rule.metadata?.rule_type || 'unknown';
    rulesByType[ruleType] = (rulesByType[ruleType] || 0) + 1;
  });

  console.log('\nRule Type Distribution:');
  Object.entries(rulesByType).forEach(([type, count]) => {
    console.log(`  ${type}: ${count} rules`);
  });

  console.log(`\nTotal UCR Rules: ${rules?.length || 0}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 HERA FURNITURE - PHASE 6: UNIVERSAL CONFIGURATION RULES (UCR)');
  console.log('=============================================================\n');
  console.log('Revolutionary: Business logic as data, not code!\n');

  const organizationId = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258';

  try {
    // Display rule types
    console.log('📋 UCR RULE TYPE DEFINITIONS:');
    console.log(`Total rule types: ${Object.keys(UCR_RULE_TYPES).length}`);
    
    Object.entries(UCR_RULE_TYPES).forEach(([key, rule]) => {
      console.log(`\n${key}:`);
      console.log(`  Type: ${rule.rule_type}`);
      console.log(`  Smart Code: ${rule.smart_code}`);
      console.log(`  Description: ${rule.description}`);
    });

    const action = process.argv[2];
    
    if (action === 'create') {
      console.log('\n🔧 Creating UCR rules for furniture module...');
      
      await createFurnitureValidationRules(organizationId);
      await createPricingRules(organizationId);
      await createApprovalRules(organizationId);
      await createSLARules(organizationId);
      
      console.log('\n✨ All UCR rules created successfully!');
    }

    await displayUCRStats(organizationId);

    console.log('\n📌 Next Steps:');
    console.log('  1. Run with "create" to create UCR rules');
    console.log('  2. Implement UCR execution engine');
    console.log('  3. Create UI for rule management');
    console.log('  4. Test rules with real transactions');
    console.log('\n🎯 UCR Benefits:');
    console.log('  - Zero code changes for business logic updates');
    console.log('  - A/B testing of business rules');
    console.log('  - Complete audit trail of rule changes');
    console.log('  - Industry-specific rule templates');
    console.log('  - AI-powered rule optimization');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Export for testing and reuse
module.exports = {
  UCR_RULE_TYPES,
  createUCRRule,
  addRuleLogic,
  createFurnitureValidationRules,
  createPricingRules,
  createApprovalRules,
  createSLARules
};

// Run if called directly
if (require.main === module) {
  main();
}