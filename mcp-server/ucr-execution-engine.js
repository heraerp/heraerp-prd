#!/usr/bin/env node

/**
 * HERA UCR Execution Engine
 * 
 * Revolutionary rule execution system that processes business logic stored as data.
 * This engine interprets and executes UCR rules without any hardcoded logic.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

class UCRExecutionEngine {
  constructor(organizationId) {
    this.organizationId = organizationId;
    this.rulesCache = new Map();
  }

  /**
   * Load all active rules for the organization
   */
  async loadRules() {
    console.log('📚 Loading UCR rules...');

    // Get all UCR rule entities
    const { data: rules } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', this.organizationId)
      .eq('entity_type', 'ucr_rule')
      .eq('status', 'active');

    if (!rules || rules.length === 0) {
      console.log('⚠️  No active UCR rules found');
      return;
    }

    // Load rule logic from dynamic data
    for (const rule of rules) {
      const { data: ruleLogic } = await supabase
        .from('core_dynamic_data')
        .select('*')
        .eq('entity_id', rule.id)
        .eq('organization_id', this.organizationId);

      // Parse rule logic into structured format
      const parsedRule = {
        id: rule.id,
        name: rule.entity_name,
        type: rule.metadata?.rule_type,
        smart_code: rule.smart_code,
        scope: this.parseRuleField(ruleLogic, 'rule_scope'),
        condition: this.parseRuleField(ruleLogic, 'rule_condition'),
        action: this.parseRuleField(ruleLogic, 'rule_action'),
        parameters: this.parseRuleField(ruleLogic, 'rule_parameters'),
        priority: this.parseRuleField(ruleLogic, 'rule_priority') || 100
      };

      this.rulesCache.set(rule.id, parsedRule);
    }

    console.log(`✅ Loaded ${this.rulesCache.size} UCR rules`);
  }

  /**
   * Parse a specific rule field from dynamic data
   */
  parseRuleField(ruleLogic, fieldName) {
    const field = ruleLogic.find(f => f.field_name === fieldName);
    if (!field) return null;

    if (field.field_value_json) {
      try {
        return JSON.parse(field.field_value_json);
      } catch (e) {
        return field.field_value_json;
      }
    }

    return field.field_value_number || field.field_value_text || field.field_value_boolean;
  }

  /**
   * Execute rules for a given context
   */
  async executeRules(context, ruleType = null) {
    const results = [];
    const applicableRules = this.getApplicableRules(context, ruleType);

    console.log(`\n🔄 Executing ${applicableRules.length} applicable rules...`);

    for (const rule of applicableRules) {
      try {
        const result = await this.executeRule(rule, context);
        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          success: result.success,
          result: result.data,
          errors: result.errors
        });

        if (!result.success && rule.parameters?.block_save_on_failure) {
          console.log(`❌ Rule "${rule.name}" failed with blocking error`);
          break;
        }
      } catch (error) {
        console.error(`⚠️  Error executing rule "${rule.name}":`, error.message);
        results.push({
          ruleId: rule.id,
          ruleName: rule.name,
          success: false,
          errors: [error.message]
        });
      }
    }

    return results;
  }

  /**
   * Get rules applicable to the given context
   */
  getApplicableRules(context, ruleType = null) {
    const rules = Array.from(this.rulesCache.values());
    
    return rules
      .filter(rule => {
        // Filter by rule type if specified
        if (ruleType && rule.type !== ruleType) return false;

        // Check if rule scope matches context
        return this.matchesScope(rule.scope, context);
      })
      .sort((a, b) => b.priority - a.priority); // Higher priority first
  }

  /**
   * Check if context matches rule scope
   */
  matchesScope(scope, context) {
    if (!scope) return true; // No scope means always apply

    // Check entity type
    if (scope.entity_type && context.entity_type !== scope.entity_type) {
      return false;
    }

    // Check smart code pattern
    if (scope.smart_code_pattern && context.smart_code) {
      const pattern = new RegExp(scope.smart_code_pattern.replace('*', '.*'));
      if (!pattern.test(context.smart_code)) {
        return false;
      }
    }

    // Additional scope checks can be added here
    return true;
  }

  /**
   * Execute a single rule
   */
  async executeRule(rule, context) {
    console.log(`\n⚡ Executing rule: ${rule.name}`);

    // Check condition
    if (!this.evaluateCondition(rule.condition, context)) {
      console.log('  ↳ Condition not met, skipping');
      return { success: true, data: { skipped: true } };
    }

    // Execute action based on rule type
    switch (rule.type) {
      case 'validation':
        return this.executeValidation(rule, context);
      case 'pricing':
        return this.executePricing(rule, context);
      case 'approval':
        return this.executeApproval(rule, context);
      case 'sla':
        return this.executeSLA(rule, context);
      default:
        return { success: false, errors: [`Unknown rule type: ${rule.type}`] };
    }
  }

  /**
   * Evaluate rule condition
   */
  evaluateCondition(condition, context) {
    if (!condition || condition.type === 'ALWAYS') return true;

    switch (condition.type) {
      case 'AND':
        return condition.rules.every(rule => this.evaluateSingleCondition(rule, context));
      case 'OR':
        return condition.rules.some(rule => this.evaluateSingleCondition(rule, context));
      case 'EXISTS':
        return context[condition.field] !== undefined;
      default:
        return this.evaluateSingleCondition(condition, context);
    }
  }

  /**
   * Evaluate a single condition rule
   */
  evaluateSingleCondition(rule, context) {
    const value = context[rule.field];
    
    switch (rule.operator) {
      case 'exists':
        return value !== undefined && value !== null;
      case 'equals':
        return value === rule.value;
      case 'greater_than':
        return value > rule.value;
      case 'less_than':
        return value < rule.value;
      default:
        return false;
    }
  }

  /**
   * Execute validation rule
   */
  executeValidation(rule, context) {
    const errors = [];
    const validations = rule.action.validations || [];

    for (const validation of validations) {
      const value = context[validation.field];
      
      if (validation.min !== undefined && value < validation.min) {
        errors.push(validation.message || `${validation.field} is below minimum`);
      }
      
      if (validation.max !== undefined && value > validation.max) {
        errors.push(validation.message || `${validation.field} exceeds maximum`);
      }
    }

    console.log(`  ↳ Validation ${errors.length === 0 ? '✅ passed' : '❌ failed'}`);
    return {
      success: errors.length === 0,
      errors,
      data: { validated: true }
    };
  }

  /**
   * Execute pricing rule
   */
  executePricing(rule, context) {
    let price = 0;

    if (rule.action.type === 'calculate_price') {
      const standardCost = context.standard_cost_rate || 0;
      const markup = rule.parameters.markup_multiplier || 1;
      price = standardCost * markup;
      
      if (rule.action.round_to) {
        price = Math.round(price * 100) / 100;
      }
    } else if (rule.action.type === 'apply_volume_discount') {
      const quantity = context.quantity || 1;
      const basePrice = context.base_price || 0;
      
      // Find applicable tier
      const tier = rule.action.tiers.find(t => 
        quantity >= t.min_qty && (t.max_qty === null || quantity <= t.max_qty)
      );
      
      if (tier) {
        const discount = basePrice * (tier.discount_percent / 100);
        price = basePrice - discount;
      }
    }

    console.log(`  ↳ Calculated price: ${price}`);
    return {
      success: true,
      data: { calculated_price: price }
    };
  }

  /**
   * Execute approval rule
   */
  executeApproval(rule, context) {
    const discountPercent = context.discount_percent || 0;
    const discountAmount = context.discount_amount || 0;
    
    // Find required approval level
    const requiredLevel = rule.action.approval_levels.find(level => 
      discountPercent > level.threshold
    );

    if (requiredLevel) {
      console.log(`  ↳ Approval required: ${requiredLevel.role} (${requiredLevel.reason})`);
      return {
        success: true,
        data: {
          approval_required: true,
          approver_role: requiredLevel.role,
          reason: requiredLevel.reason
        }
      };
    }

    console.log(`  ↳ No approval required`);
    return {
      success: true,
      data: { approval_required: false }
    };
  }

  /**
   * Execute SLA rule
   */
  executeSLA(rule, context) {
    const productType = context.product_type || 'in_stock';
    const leadTime = rule.parameters.lead_times[productType] || 3;
    const bufferDays = rule.parameters.buffer_days || 0;
    
    // Calculate promised date
    const orderDate = new Date(context.order_date || Date.now());
    const promisedDate = new Date(orderDate);
    promisedDate.setDate(promisedDate.getDate() + leadTime + bufferDays);

    // Skip weekends if configured
    if (rule.parameters.exclude_weekends) {
      while (promisedDate.getDay() === 0 || promisedDate.getDay() === 6) {
        promisedDate.setDate(promisedDate.getDate() + 1);
      }
    }

    console.log(`  ↳ Promised delivery: ${promisedDate.toLocaleDateString()}`);
    return {
      success: true,
      data: {
        promised_date: promisedDate.toISOString(),
        lead_time_days: leadTime + bufferDays
      }
    };
  }
}

/**
 * Demo execution
 */
async function demonstrateUCR() {
  const organizationId = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258';
  const engine = new UCRExecutionEngine(organizationId);
  
  // Load rules
  await engine.loadRules();

  // Test 1: Product Validation
  console.log('\n📋 TEST 1: Product Dimension Validation');
  const productContext = {
    entity_type: 'product',
    smart_code: 'HERA.FURNITURE.PRODUCT.TABLE.v1',
    length_cm: 200,
    width_cm: 100,
    height_cm: 75
  };
  
  const validationResults = await engine.executeRules(productContext, 'validation');
  console.log('Results:', validationResults);

  // Test 2: Pricing Calculation
  console.log('\n💰 TEST 2: Pricing Calculation');
  const pricingContext = {
    entity_type: 'product',
    smart_code: 'HERA.FURNITURE.PRODUCT.CHAIR.v1',
    standard_cost_rate: 1000,
    pricing_method: 'standard_markup'
  };
  
  const pricingResults = await engine.executeRules(pricingContext, 'pricing');
  console.log('Results:', pricingResults);

  // Test 3: Discount Approval
  console.log('\n✅ TEST 3: Discount Approval Check');
  const orderContext = {
    entity_type: 'sales_order',
    transaction_type: 'sale',
    discount_percent: 20,
    total_amount: 50000
  };
  
  const approvalResults = await engine.executeRules(orderContext, 'approval');
  console.log('Results:', approvalResults);

  // Test 4: SLA Calculation
  console.log('\n📅 TEST 4: Delivery Date SLA');
  const slaContext = {
    entity_type: 'sales_order_line',
    product_category: 'furniture',
    product_type: 'make_to_order',
    order_date: new Date().toISOString()
  };
  
  const slaResults = await engine.executeRules(slaContext, 'sla');
  console.log('Results:', slaResults);
}

// Export for reuse
module.exports = UCRExecutionEngine;

// Run demo if called directly
if (require.main === module) {
  console.log('🚀 HERA UCR EXECUTION ENGINE DEMONSTRATION');
  console.log('==========================================\n');
  
  demonstrateUCR()
    .then(() => {
      console.log('\n✅ UCR Engine demonstration complete!');
    })
    .catch(err => {
      console.error('❌ Error:', err.message);
    });
}