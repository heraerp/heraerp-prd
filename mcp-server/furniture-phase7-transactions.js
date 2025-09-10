#!/usr/bin/env node

/**
 * HERA Furniture Module - Phase 7: Universal Transactions
 * 
 * Revolutionary transaction processing system that handles:
 * - Sales Orders with UCR validation and pricing
 * - Purchase Orders with supplier management
 * - Manufacturing Orders with BOM integration
 * - Inventory Movements with real-time tracking
 * 
 * All integrated with Universal Configuration Rules (UCR)
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Organization ID for furniture module
const FURNITURE_ORG_ID = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258';

/**
 * Transaction Types for Furniture Industry
 */
const TRANSACTION_TYPES = {
  SALES_ORDER: {
    type: 'sales_order',
    smart_code: 'HERA.IND.FURN.TXN.SALESORDER.V1',
    name: 'Furniture Sales Order',
    gl_impact: 'DR: AR, CR: Sales Revenue, CR: Sales Tax'
  },
  
  PURCHASE_ORDER: {
    type: 'purchase_order',
    smart_code: 'HERA.IND.FURN.TXN.PURCHASEORDER.V1',
    name: 'Material Purchase Order',
    gl_impact: 'DR: Inventory, CR: AP'
  },
  
  MANUFACTURING_ORDER: {
    type: 'manufacturing_order',
    smart_code: 'HERA.IND.FURN.TXN.MANUFACTUREORDER.V1',
    name: 'Furniture Production Order',
    gl_impact: 'DR: WIP, CR: Raw Materials, CR: Labor, CR: Overhead'
  },
  
  INVENTORY_MOVEMENT: {
    type: 'inventory_movement',
    smart_code: 'HERA.IND.FURN.TXN.INVENTORYMOVE.V1',
    name: 'Inventory Transfer',
    gl_impact: 'DR: Destination Location, CR: Source Location'
  },
  
  QUALITY_CHECK: {
    type: 'quality_check',
    smart_code: 'HERA.IND.FURN.TXN.QUALITYCHECK.V1',
    name: 'Quality Inspection',
    gl_impact: 'Conditional based on pass/fail'
  },
  
  SHIPMENT: {
    type: 'shipment',
    smart_code: 'HERA.IND.FURN.TXN.SHIPMENT.V1',
    name: 'Customer Shipment',
    gl_impact: 'DR: COGS, CR: Finished Goods Inventory'
  }
};

/**
 * UCR Integration Service
 */
class UCRIntegrationService {
  static async validateTransaction(transaction, lineItems) {
    // Fetch applicable validation rules
    const validationRules = await this.getValidationRules(transaction.smart_code);
    const errors = [];
    
    for (const rule of validationRules) {
      const result = await this.executeRule(rule, transaction, lineItems);
      if (!result.valid) {
        errors.push(result.message);
      }
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  static async calculatePricing(transaction, lineItems) {
    // Fetch pricing rules based on customer, product, quantity
    const pricingRules = await this.getPricingRules(transaction.smart_code);
    let totalAmount = 0;
    const pricedLineItems = [];
    
    for (const line of lineItems) {
      const pricing = await this.applyPricingRules(pricingRules, line, transaction);
      pricedLineItems.push({
        ...line,
        unit_amount: pricing.unitPrice,
        line_amount: pricing.lineTotal,
        discount_percent: pricing.discountPercent,
        discount_amount: pricing.discountAmount
      });
      totalAmount += pricing.lineTotal;
    }
    
    return { totalAmount, lineItems: pricedLineItems };
  }
  
  static async checkApprovalRequired(transaction, totalAmount) {
    // Fetch approval rules
    const approvalRules = await this.getApprovalRules(transaction.smart_code);
    
    for (const rule of approvalRules) {
      if (await this.evaluateApprovalRule(rule, transaction, totalAmount)) {
        return {
          required: true,
          rule: rule.entity_name,
          threshold: rule.metadata.threshold,
          approvers: rule.metadata.approvers
        };
      }
    }
    
    return { required: false };
  }
  
  static async calculateDeliveryDate(transaction, lineItems) {
    // Fetch SLA rules
    const slaRules = await this.getSLARules(transaction.smart_code);
    let maxLeadTime = 0;
    
    for (const line of lineItems) {
      const leadTime = await this.calculateItemLeadTime(slaRules, line, transaction);
      maxLeadTime = Math.max(maxLeadTime, leadTime);
    }
    
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + maxLeadTime);
    
    return deliveryDate;
  }
  
  // Helper methods to fetch and execute rules
  static async getValidationRules(smartCode) {
    const { data } = await supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data!inner(*)
      `)
      .eq('entity_type', 'ucr_rule')
      .eq('metadata->>rule_type', 'validation')
      .eq('smart_code', 'HERA.IND.FURN.UCR.VALIDATION.V1')
      .eq('organization_id', FURNITURE_ORG_ID);
    
    return data || [];
  }
  
  static async getPricingRules(smartCode) {
    const { data } = await supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data!inner(*)
      `)
      .eq('entity_type', 'ucr_rule')
      .eq('metadata->>rule_type', 'pricing')
      .eq('smart_code', 'HERA.IND.FURN.UCR.PRICING.V1')
      .eq('organization_id', FURNITURE_ORG_ID);
    
    return data || [];
  }
  
  static async getApprovalRules(smartCode) {
    const { data } = await supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data!inner(*)
      `)
      .eq('entity_type', 'ucr_rule')
      .eq('metadata->>rule_type', 'approval')
      .eq('smart_code', 'HERA.IND.FURN.UCR.APPROVAL.V1')
      .eq('organization_id', FURNITURE_ORG_ID);
    
    return data || [];
  }
  
  static async getSLARules(smartCode) {
    const { data } = await supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data!inner(*)
      `)
      .eq('entity_type', 'ucr_rule')
      .eq('metadata->>rule_type', 'sla')
      .eq('smart_code', 'HERA.IND.FURN.UCR.SLA.V1')
      .eq('organization_id', FURNITURE_ORG_ID);
    
    return data || [];
  }
  
  static async executeRule(rule, transaction, lineItems) {
    // Simple rule execution logic - would be more complex in production
    const ruleLogic = rule.core_dynamic_data.find(d => d.field_name === 'rule_condition');
    if (!ruleLogic) return { valid: true };
    
    const condition = JSON.parse(ruleLogic.field_value_json || '{}');
    
    // Example: Check minimum order value
    if (condition.type === 'minimum_order_value') {
      const totalAmount = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_amount), 0);
      if (totalAmount < condition.value) {
        return {
          valid: false,
          message: `Order value must be at least ${condition.value}`
        };
      }
    }
    
    return { valid: true };
  }
  
  static async applyPricingRules(rules, lineItem, transaction) {
    // Base price from product
    let unitPrice = lineItem.unit_amount || 0;
    let discountPercent = 0;
    
    // Apply quantity-based discounts
    for (const rule of rules) {
      const ruleParams = rule.core_dynamic_data.find(d => d.field_name === 'rule_parameters');
      if (!ruleParams) continue;
      
      const params = JSON.parse(ruleParams.field_value_json || '{}');
      
      if (params.type === 'volume_discount' && lineItem.quantity >= params.min_quantity) {
        discountPercent = Math.max(discountPercent, params.discount_percent);
      }
    }
    
    const discountAmount = unitPrice * (discountPercent / 100) * lineItem.quantity;
    const lineTotal = (unitPrice * lineItem.quantity) - discountAmount;
    
    return {
      unitPrice,
      discountPercent,
      discountAmount,
      lineTotal
    };
  }
  
  static async evaluateApprovalRule(rule, transaction, totalAmount) {
    const ruleParams = rule.core_dynamic_data.find(d => d.field_name === 'rule_parameters');
    if (!ruleParams) return false;
    
    const params = JSON.parse(ruleParams.field_value_json || '{}');
    
    if (params.type === 'amount_threshold' && totalAmount >= params.threshold) {
      return true;
    }
    
    return false;
  }
  
  static async calculateItemLeadTime(rules, lineItem, transaction) {
    // Default lead time
    let leadTime = 7; // days
    
    for (const rule of rules) {
      const ruleParams = rule.core_dynamic_data.find(d => d.field_name === 'rule_parameters');
      if (!ruleParams) continue;
      
      const params = JSON.parse(ruleParams.field_value_json || '{}');
      
      if (params.type === 'standard_lead_time') {
        leadTime = params.days || leadTime;
      }
      
      if (params.type === 'custom_product_lead_time' && lineItem.metadata?.custom_product) {
        leadTime = params.custom_days || leadTime;
      }
    }
    
    return leadTime;
  }
}

/**
 * Sales Order Processing
 */
class SalesOrderService {
  static async createSalesOrder({
    customerId,
    customerPO,
    lineItems,
    deliveryAddress,
    specialInstructions
  }) {
    console.log('\n📋 Creating Sales Order...');
    
    try {
      // Create transaction header
      const transaction = {
        organization_id: FURNITURE_ORG_ID,
        transaction_type: TRANSACTION_TYPES.SALES_ORDER.type,
        transaction_code: await this.generateOrderNumber(),
        transaction_date: new Date().toISOString(),
        from_entity_id: customerId,
        smart_code: TRANSACTION_TYPES.SALES_ORDER.smart_code,
        metadata: {
          customer_po: customerPO,
          delivery_address: deliveryAddress,
          special_instructions: specialInstructions,
          status: 'draft'
        }
      };
      
      // Validate transaction
      const validation = await UCRIntegrationService.validateTransaction(transaction, lineItems);
      if (!validation.valid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }
      
      // Calculate pricing
      const pricing = await UCRIntegrationService.calculatePricing(transaction, lineItems);
      transaction.total_amount = pricing.totalAmount;
      
      // Check approval requirements
      const approval = await UCRIntegrationService.checkApprovalRequired(transaction, pricing.totalAmount);
      if (approval.required) {
        transaction.metadata.approval_required = approval;
        transaction.metadata.status = 'pending_approval';
      }
      
      // Calculate delivery date
      const deliveryDate = await UCRIntegrationService.calculateDeliveryDate(transaction, lineItems);
      transaction.metadata.promised_delivery_date = deliveryDate.toISOString();
      
      // Create transaction
      const { data: transactionData, error: transactionError } = await supabase
        .from('universal_transactions')
        .insert(transaction)
        .select()
        .single();
      
      if (transactionError) throw transactionError;
      
      // Create line items
      const lines = [];
      for (let i = 0; i < pricing.lineItems.length; i++) {
        const line = pricing.lineItems[i];
        const lineData = {
          organization_id: FURNITURE_ORG_ID,
          transaction_id: transactionData.id,
          line_number: i + 1,
          line_entity_id: line.entity_id,
          quantity: line.quantity,
          unit_price: line.unit_amount,
          line_amount: line.line_amount,
          smart_code: 'HERA.IND.FURN.TXN.SALESORDER.LINE.V1',
          metadata: {
            product_name: line.product_name,
            specifications: line.specifications,
            discount_percent: line.discount_percent,
            discount_amount: line.discount_amount
          }
        };
        
        const { data: lineResult, error: lineError } = await supabase
          .from('universal_transaction_lines')
          .insert(lineData)
          .select()
          .single();
        
        if (lineError) throw lineError;
        lines.push(lineResult);
      }
      
      console.log(`✅ Sales Order ${transactionData.transaction_code} created successfully`);
      console.log(`   Total Amount: ${transactionData.total_amount}`);
      console.log(`   Delivery Date: ${new Date(transaction.metadata.promised_delivery_date).toLocaleDateString()}`);
      if (approval.required) {
        console.log(`   ⚠️  Approval required: ${approval.rule}`);
      }
      
      return { transaction: transactionData, lineItems: lines };
      
    } catch (error) {
      console.error('❌ Error creating sales order:', error.message);
      throw error;
    }
  }
  
  static async generateOrderNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    // Get last order number
    const { data } = await supabase
      .from('universal_transactions')
      .select('transaction_code')
      .eq('transaction_type', 'sales_order')
      .like('transaction_code', `SO-${year}${month}-%`)
      .order('created_at', { ascending: false })
      .limit(1);
    
    let sequence = 1;
    if (data && data.length > 0) {
      const lastNumber = parseInt(data[0].transaction_code.split('-').pop());
      sequence = lastNumber + 1;
    }
    
    return `SO-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }
}

/**
 * Purchase Order Service
 */
class PurchaseOrderService {
  static async createPurchaseOrder({
    supplierId,
    lineItems,
    deliveryWarehouse,
    paymentTerms
  }) {
    console.log('\n📦 Creating Purchase Order...');
    
    try {
      const transaction = {
        organization_id: FURNITURE_ORG_ID,
        transaction_type: TRANSACTION_TYPES.PURCHASE_ORDER.type,
        transaction_code: await this.generatePONumber(),
        transaction_date: new Date().toISOString(),
        to_entity_id: supplierId,
        smart_code: TRANSACTION_TYPES.PURCHASE_ORDER.smart_code,
        total_amount: 0,
        metadata: {
          delivery_warehouse: deliveryWarehouse,
          payment_terms: paymentTerms,
          status: 'draft'
        }
      };
      
      // Calculate total
      let totalAmount = 0;
      for (const item of lineItems) {
        totalAmount += item.quantity * item.unit_cost;
      }
      transaction.total_amount = totalAmount;
      
      // Check approval requirements for high-value POs
      const approval = await UCRIntegrationService.checkApprovalRequired(transaction, totalAmount);
      if (approval.required) {
        transaction.metadata.approval_required = approval;
        transaction.metadata.status = 'pending_approval';
      }
      
      // Create transaction
      const { data: transactionData, error: transactionError } = await supabase
        .from('universal_transactions')
        .insert(transaction)
        .select()
        .single();
      
      if (transactionError) throw transactionError;
      
      // Create line items
      const lines = [];
      for (let i = 0; i < lineItems.length; i++) {
        const line = lineItems[i];
        const lineData = {
          organization_id: FURNITURE_ORG_ID,
          transaction_id: transactionData.id,
          line_number: i + 1,
          line_entity_id: line.material_id,
          quantity: line.quantity,
          unit_price: line.unit_cost,
          line_amount: line.quantity * line.unit_cost,
          smart_code: 'HERA.IND.FURN.TXN.PURCHASEORDER.LINE.V1',
          metadata: {
            material_name: line.material_name,
            supplier_part_number: line.supplier_part_number,
            expected_delivery_days: line.lead_time_days
          }
        };
        
        const { data: lineResult, error: lineError } = await supabase
          .from('universal_transaction_lines')
          .insert(lineData)
          .select()
          .single();
        
        if (lineError) throw lineError;
        lines.push(lineResult);
      }
      
      console.log(`✅ Purchase Order ${transactionData.transaction_code} created successfully`);
      console.log(`   Total Amount: ${transactionData.total_amount}`);
      if (approval.required) {
        console.log(`   ⚠️  Approval required: ${approval.rule}`);
      }
      
      return { transaction: transactionData, lineItems: lines };
      
    } catch (error) {
      console.error('❌ Error creating purchase order:', error.message);
      throw error;
    }
  }
  
  static async generatePONumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const { data } = await supabase
      .from('universal_transactions')
      .select('transaction_code')
      .eq('transaction_type', 'purchase_order')
      .like('transaction_code', `PO-${year}${month}-%`)
      .order('created_at', { ascending: false })
      .limit(1);
    
    let sequence = 1;
    if (data && data.length > 0) {
      const lastNumber = parseInt(data[0].transaction_code.split('-').pop());
      sequence = lastNumber + 1;
    }
    
    return `PO-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }
}

/**
 * Manufacturing Order Service
 */
class ManufacturingOrderService {
  static async createManufacturingOrder({
    productId,
    quantity,
    salesOrderId,
    targetCompletionDate
  }) {
    console.log('\n🏭 Creating Manufacturing Order...');
    
    try {
      // Get product BOM
      const bom = await this.getProductBOM(productId);
      if (!bom) {
        throw new Error('Product BOM not found');
      }
      
      const transaction = {
        organization_id: FURNITURE_ORG_ID,
        transaction_type: TRANSACTION_TYPES.MANUFACTURING_ORDER.type,
        transaction_code: await this.generateMONumber(),
        transaction_date: new Date().toISOString(),
        reference_entity_id: productId,
        smart_code: TRANSACTION_TYPES.MANUFACTURING_ORDER.smart_code,
        metadata: {
          quantity_to_produce: quantity,
          sales_order_id: salesOrderId,
          target_completion_date: targetCompletionDate,
          status: 'planned',
          bom_id: bom.id
        }
      };
      
      // Calculate material requirements and costs
      const { materials, totalCost } = await this.calculateMaterialRequirements(bom, quantity);
      transaction.total_amount = totalCost;
      transaction.metadata.material_requirements = materials;
      
      // Create transaction
      const { data: transactionData, error: transactionError } = await supabase
        .from('universal_transactions')
        .insert(transaction)
        .select()
        .single();
      
      if (transactionError) throw transactionError;
      
      // Create line items for material consumption
      const lines = [];
      for (let i = 0; i < materials.length; i++) {
        const material = materials[i];
        const lineData = {
          organization_id: FURNITURE_ORG_ID,
          transaction_id: transactionData.id,
          line_number: i + 1,
          line_entity_id: material.material_id,
          quantity: material.required_quantity,
          unit_price: material.unit_cost,
          line_amount: material.total_cost,
          smart_code: 'HERA.IND.FURN.TXN.MANUFACTUREORDER.LINE.V1',
          metadata: {
            material_name: material.material_name,
            bom_quantity: material.bom_quantity,
            uom: material.uom,
            material_type: material.material_type
          }
        };
        
        const { data: lineResult, error: lineError } = await supabase
          .from('universal_transaction_lines')
          .insert(lineData)
          .select()
          .single();
        
        if (lineError) throw lineError;
        lines.push(lineResult);
      }
      
      // Create production status relationship
      await this.createProductionStatus(transactionData.id, 'planned');
      
      console.log(`✅ Manufacturing Order ${transactionData.transaction_code} created successfully`);
      console.log(`   Product Quantity: ${quantity}`);
      console.log(`   Total Material Cost: ${totalCost}`);
      console.log(`   Target Completion: ${new Date(targetCompletionDate).toLocaleDateString()}`);
      
      return { transaction: transactionData, lineItems: lines };
      
    } catch (error) {
      console.error('❌ Error creating manufacturing order:', error.message);
      throw error;
    }
  }
  
  static async getProductBOM(productId) {
    const { data } = await supabase
      .from('core_entities')
      .select(`
        *,
        bom_relationships:core_relationships!from_entity_id(
          *,
          component:core_entities!to_entity_id(
            *,
            material_data:core_dynamic_data(*)
          )
        )
      `)
      .eq('id', productId)
      .eq('bom_relationships.relationship_type', 'bom_component')
      .single();
    
    return data;
  }
  
  static async calculateMaterialRequirements(bom, quantity) {
    const materials = [];
    let totalCost = 0;
    
    for (const rel of bom.bom_relationships || []) {
      const component = rel.component;
      const bomQuantity = rel.metadata?.quantity || 1;
      const requiredQuantity = bomQuantity * quantity;
      
      // Get material cost from dynamic data
      const costData = component.material_data?.find(d => d.field_name === 'unit_cost');
      const unitCost = costData?.field_value_number || 0;
      const totalMaterialCost = unitCost * requiredQuantity;
      
      materials.push({
        material_id: component.id,
        material_name: component.entity_name,
        material_type: component.entity_type,
        bom_quantity: bomQuantity,
        required_quantity: requiredQuantity,
        unit_cost: unitCost,
        total_cost: totalMaterialCost,
        uom: component.metadata?.uom || 'PCS'
      });
      
      totalCost += totalMaterialCost;
    }
    
    return { materials, totalCost };
  }
  
  static async createProductionStatus(orderId, status) {
    // Get status entity
    const { data: statusEntity } = await supabase
      .from('core_entities')
      .select('id')
      .eq('entity_type', 'workflow_status')
      .eq('entity_code', `STATUS-${status.toUpperCase()}`)
      .eq('organization_id', FURNITURE_ORG_ID)
      .single();
    
    if (statusEntity) {
      await supabase
        .from('core_relationships')
        .insert({
          organization_id: FURNITURE_ORG_ID,
          from_entity_id: orderId,
          to_entity_id: statusEntity.id,
          relationship_type: 'has_status',
          smart_code: 'HERA.WORKFLOW.STATUS.ASSIGN.V1',
          metadata: {
            assigned_at: new Date().toISOString(),
            status_type: 'production'
          }
        });
    }
  }
  
  static async generateMONumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const { data } = await supabase
      .from('universal_transactions')
      .select('transaction_code')
      .eq('transaction_type', 'manufacturing_order')
      .like('transaction_code', `MO-${year}${month}-%`)
      .order('created_at', { ascending: false })
      .limit(1);
    
    let sequence = 1;
    if (data && data.length > 0) {
      const lastNumber = parseInt(data[0].transaction_code.split('-').pop());
      sequence = lastNumber + 1;
    }
    
    return `MO-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }
}

/**
 * Inventory Movement Service
 */
class InventoryMovementService {
  static async createInventoryMovement({
    movementType,
    sourceLocation,
    destinationLocation,
    lineItems,
    reason
  }) {
    console.log('\n📦 Creating Inventory Movement...');
    
    try {
      const transaction = {
        organization_id: FURNITURE_ORG_ID,
        transaction_type: TRANSACTION_TYPES.INVENTORY_MOVEMENT.type,
        transaction_code: await this.generateMovementNumber(),
        transaction_date: new Date().toISOString(),
        from_entity_id: sourceLocation,
        to_entity_id: destinationLocation,
        smart_code: TRANSACTION_TYPES.INVENTORY_MOVEMENT.smart_code,
        metadata: {
          movement_type: movementType,
          reason: reason,
          status: 'in_progress'
        }
      };
      
      // Create transaction
      const { data: transactionData, error: transactionError } = await supabase
        .from('universal_transactions')
        .insert(transaction)
        .select()
        .single();
      
      if (transactionError) throw transactionError;
      
      // Create line items and update inventory levels
      const lines = [];
      for (let i = 0; i < lineItems.length; i++) {
        const item = lineItems[i];
        
        // Update source inventory
        if (sourceLocation) {
          await this.updateInventoryLevel(sourceLocation, item.entity_id, -item.quantity);
        }
        
        // Update destination inventory
        if (destinationLocation) {
          await this.updateInventoryLevel(destinationLocation, item.entity_id, item.quantity);
        }
        
        const lineData = {
          organization_id: FURNITURE_ORG_ID,
          transaction_id: transactionData.id,
          line_number: i + 1,
          line_entity_id: item.entity_id,
          quantity: item.quantity,
          smart_code: 'HERA.IND.FURN.TXN.INVENTORYMOVE.LINE.V1',
          metadata: {
            item_name: item.item_name,
            batch_number: item.batch_number,
            movement_reason: item.reason
          }
        };
        
        const { data: lineResult, error: lineError } = await supabase
          .from('universal_transaction_lines')
          .insert(lineData)
          .select()
          .single();
        
        if (lineError) throw lineError;
        lines.push(lineResult);
      }
      
      console.log(`✅ Inventory Movement ${transactionData.transaction_code} created successfully`);
      console.log(`   Movement Type: ${movementType}`);
      console.log(`   Items Moved: ${lines.length}`);
      
      return { transaction: transactionData, lineItems: lines };
      
    } catch (error) {
      console.error('❌ Error creating inventory movement:', error.message);
      throw error;
    }
  }
  
  static async updateInventoryLevel(locationId, itemId, quantityChange) {
    // Find existing inventory record
    const { data: existing } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', itemId)
      .eq('field_name', `inventory_${locationId}`)
      .eq('organization_id', FURNITURE_ORG_ID)
      .single();
    
    if (existing) {
      // Update existing
      const newQuantity = (existing.field_value_number || 0) + quantityChange;
      await supabase
        .from('core_dynamic_data')
        .update({ field_value_number: newQuantity })
        .eq('id', existing.id);
    } else {
      // Create new
      await supabase
        .from('core_dynamic_data')
        .insert({
          organization_id: FURNITURE_ORG_ID,
          entity_id: itemId,
          field_name: `inventory_${locationId}`,
          field_value_number: Math.max(0, quantityChange),
          field_type: 'number',
          smart_code: 'HERA.IND.FURN.DYNAMIC.INVENTORY.V1'
        });
    }
  }
  
  static async generateMovementNumber() {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    
    const { data } = await supabase
      .from('universal_transactions')
      .select('transaction_code')
      .eq('transaction_type', 'inventory_movement')
      .like('transaction_code', `IM-${year}${month}-%`)
      .order('created_at', { ascending: false })
      .limit(1);
    
    let sequence = 1;
    if (data && data.length > 0) {
      const lastNumber = parseInt(data[0].transaction_code.split('-').pop());
      sequence = lastNumber + 1;
    }
    
    return `IM-${year}${month}-${String(sequence).padStart(4, '0')}`;
  }
}

/**
 * Demo Transactions
 */
async function createDemoTransactions() {
  console.log('\n🚀 Creating Demo Furniture Transactions...');
  console.log('='.repeat(60));
  
  try {
    // Get demo entities
    const { data: customer } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'furniture_customer')
      .eq('organization_id', FURNITURE_ORG_ID)
      .limit(1)
      .single();
    
    const { data: products } = await supabase
      .from('core_entities')
      .select(`
        *,
        dynamic_data:core_dynamic_data(*)
      `)
      .eq('entity_type', 'furniture_product')
      .eq('organization_id', FURNITURE_ORG_ID)
      .limit(3);
    
    const { data: supplier } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'furniture_supplier')
      .eq('organization_id', FURNITURE_ORG_ID)
      .limit(1)
      .single();
    
    const { data: materials } = await supabase
      .from('core_entities')
      .select(`
        *,
        dynamic_data:core_dynamic_data(*)
      `)
      .eq('entity_type', 'furniture_material')
      .eq('organization_id', FURNITURE_ORG_ID)
      .limit(2);
    
    // 1. Create Sales Order
    if (customer && products.length > 0) {
      const lineItems = products.slice(0, 2).map(product => {
        const priceData = product.dynamic_data?.find(d => d.field_name === 'selling_price');
        return {
          entity_id: product.id,
          product_name: product.entity_name,
          quantity: 5,
          unit_amount: priceData?.field_value_number || 1000,
          specifications: {
            finish: 'Oak Natural',
            dimensions: '2400x1200x750mm'
          }
        };
      });
      
      const salesOrder = await SalesOrderService.createSalesOrder({
        customerId: customer.id,
        customerPO: 'CUST-PO-2025-001',
        lineItems,
        deliveryAddress: {
          line1: '123 Furniture Street',
          city: 'Dubai',
          country: 'UAE',
          postal: '12345'
        },
        specialInstructions: 'Please deliver to loading dock'
      });
      
      // 2. Create Manufacturing Order for the sales order
      const moResult = await ManufacturingOrderService.createManufacturingOrder({
        productId: products[0].id,
        quantity: 5,
        salesOrderId: salesOrder.transaction.id,
        targetCompletionDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    // 3. Create Purchase Order for materials
    if (supplier && materials.length > 0) {
      const poItems = materials.map(material => {
        const costData = material.dynamic_data?.find(d => d.field_name === 'unit_cost');
        return {
          material_id: material.id,
          material_name: material.entity_name,
          quantity: 100,
          unit_cost: costData?.field_value_number || 50,
          supplier_part_number: `SP-${material.entity_code}`,
          lead_time_days: 14
        };
      });
      
      const purchaseOrder = await PurchaseOrderService.createPurchaseOrder({
        supplierId: supplier.id,
        lineItems: poItems,
        deliveryWarehouse: 'Main Warehouse',
        paymentTerms: 'NET30'
      });
    }
    
    // 4. Create Inventory Movement
    const { data: locations } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'warehouse')
      .eq('organization_id', FURNITURE_ORG_ID)
      .limit(2);
    
    if (locations && locations.length >= 2 && products.length > 0) {
      const moveItems = [{
        entity_id: products[0].id,
        item_name: products[0].entity_name,
        quantity: 2,
        batch_number: 'BATCH-2025-001',
        reason: 'Stock rebalancing'
      }];
      
      const movement = await InventoryMovementService.createInventoryMovement({
        movementType: 'transfer',
        sourceLocation: locations[0].id,
        destinationLocation: locations[1].id,
        lineItems: moveItems,
        reason: 'Warehouse stock rebalancing'
      });
    }
    
    console.log('\n✅ Demo transactions created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating demo transactions:', error);
  }
}

/**
 * Command Line Interface
 */
const commands = {
  async demo() {
    await createDemoTransactions();
  },
  
  async create(args) {
    const type = args.type;
    
    switch (type) {
      case 'sales-order':
        console.log('Creating sales order...');
        // Interactive sales order creation would go here
        break;
        
      case 'purchase-order':
        console.log('Creating purchase order...');
        // Interactive purchase order creation would go here
        break;
        
      case 'manufacturing-order':
        console.log('Creating manufacturing order...');
        // Interactive manufacturing order creation would go here
        break;
        
      case 'inventory-movement':
        console.log('Creating inventory movement...');
        // Interactive inventory movement creation would go here
        break;
        
      default:
        console.log('Unknown transaction type. Valid types: sales-order, purchase-order, manufacturing-order, inventory-movement');
    }
  },
  
  help() {
    console.log('\n🪑 HERA Furniture Phase 7: Universal Transactions');
    console.log('='.repeat(50));
    console.log('\nCommands:');
    console.log('  demo                    Create demo transactions');
    console.log('  create --type <type>    Create a specific transaction type');
    console.log('  help                    Show this help');
    console.log('');
    console.log('Transaction Types:');
    console.log('  sales-order            Customer sales order');
    console.log('  purchase-order         Supplier purchase order');
    console.log('  manufacturing-order    Production order');
    console.log('  inventory-movement     Stock transfer');
    console.log('');
    console.log('Examples:');
    console.log('  node furniture-phase7-transactions.js demo');
    console.log('  node furniture-phase7-transactions.js create --type sales-order');
  }
};

// Parse command line arguments
const args = {};
const command = process.argv[2] || 'help';

process.argv.slice(3).forEach((arg, index) => {
  if (arg.startsWith('--')) {
    const key = arg.slice(2);
    const nextArg = process.argv[index + 4];
    
    if (nextArg && !nextArg.startsWith('--')) {
      args[key] = nextArg;
    } else {
      args[key] = true;
    }
  }
});

// Execute command
if (commands[command]) {
  commands[command](args);
} else {
  console.error(`❌ Unknown command: ${command}`);
  commands.help();
}

// Export services for use in other modules
module.exports = {
  SalesOrderService,
  PurchaseOrderService,
  ManufacturingOrderService,
  InventoryMovementService,
  UCRIntegrationService,
  TRANSACTION_TYPES
};