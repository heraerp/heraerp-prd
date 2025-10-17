#!/usr/bin/env node

// ================================================================================
// HERA UNIVERSAL INVENTORY REPORT DNA CLI TOOL
// Command-line interface for Inventory Analytics and Reporting
// Smart Code: HERA.INVENTORY.REPORT.DNA.CLI.v1
// MCP-Enabled for direct integration with salon-manager and other MCP tools
// ================================================================================

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

// Supabase connection
const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Command-line arguments
const command = process.argv[2];
const organizationId = process.env.DEFAULT_ORGANIZATION_ID;

// Hair Talkz organizations for quick testing
const HAIR_TALKZ_ORGS = [
  {
    id: "e3a9ff9e-bb83-43a8-b062-b85e7a2b4258",
    code: "SALON-BR1",
    name: "Hair Talkz • Park Regis Kris Kin (Karama)"
  },
  {
    id: "0b1b37cd-4096-4718-8cd4-e370f234005b", 
    code: "SALON-BR2",
    name: "Hair Talkz • Mercure Gold (Al Mina Rd)"
  },
  {
    id: "849b6efe-2bf0-438f-9c70-01835ac2fe15",
    code: "SALON-GROUP", 
    name: "Salon Group"
  }
];

// ================================================================================
// INVENTORY REPORT DNA CONFIGURATION
// ================================================================================

const INVENTORY_REPORT_DNA_CONFIG = {
  // Universal DNA Component Definition
  component_id: 'HERA.INVENTORY.REPORT.ENGINE.v1',
  component_name: 'Universal Inventory Report Engine',
  version: '1.0.0',
  
  // Core capabilities
  capabilities: [
    'Real-time Stock Levels',
    'Movement Analysis (In/Out/Adjustments)',
    'Turnover & Aging Reports',
    'Low Stock Alerts',
    'Expiry Date Tracking',
    'Location-based Inventory',
    'ABC Analysis',
    'Reorder Point Optimization',
    'Dead Stock Identification',
    'MCP Integration for AI Access'
  ],
  
  // Industry configurations
  industries: {
    salon: {
      name: 'Hair Salon & Beauty Services',
      inventory_categories: {
        'hair_products': { 
          codes: ['INV-HAIR'], 
          name: 'Hair Care Products',
          turnover_target: 8, // times per year
          expiry_sensitive: true,
          min_stock_days: 14,
          max_stock_days: 45
        },
        'color_chemicals': { 
          codes: ['INV-COLOR'], 
          name: 'Hair Color & Chemicals',
          turnover_target: 12,
          expiry_sensitive: true,
          min_stock_days: 7,
          max_stock_days: 30
        },
        'styling_tools': { 
          codes: ['INV-TOOLS'], 
          name: 'Styling Tools & Equipment',
          turnover_target: 2,
          expiry_sensitive: false,
          min_stock_days: 30,
          max_stock_days: 180
        },
        'retail_products': { 
          codes: ['INV-RETAIL'], 
          name: 'Retail Products',
          turnover_target: 6,
          expiry_sensitive: true,
          min_stock_days: 21,
          max_stock_days: 60
        },
        'supplies': { 
          codes: ['INV-SUPPLY'], 
          name: 'General Supplies',
          turnover_target: 24,
          expiry_sensitive: false,
          min_stock_days: 7,
          max_stock_days: 21
        }
      },
      key_metrics: [
        'stock_value',
        'turnover_rate',
        'stockout_incidents',
        'expiry_losses',
        'carrying_cost',
        'service_level',
        'inventory_accuracy',
        'shrinkage_rate'
      ],
      alerts: {
        low_stock_threshold: 0.25, // 25% of reorder point
        expiry_warning_days: 30,
        slow_moving_days: 90,
        dead_stock_days: 180,
        high_value_threshold: 500
      },
      smart_codes: {
        stock_levels: 'HERA.SALON.INV.STOCK.LEVELS.v1',
        movement_analysis: 'HERA.SALON.INV.MOVEMENT.v1',
        aging_report: 'HERA.SALON.INV.AGING.v1',
        abc_analysis: 'HERA.SALON.INV.ABC.v1'
      }
    },
    
    restaurant: {
      name: 'Restaurant & Food Service',
      inventory_categories: {
        'fresh_produce': { 
          codes: ['INV-FRESH'], 
          name: 'Fresh Produce',
          turnover_target: 52, // weekly
          expiry_sensitive: true,
          min_stock_days: 2,
          max_stock_days: 5
        },
        'proteins': { 
          codes: ['INV-MEAT', 'INV-SEAFOOD'], 
          name: 'Proteins',
          turnover_target: 52,
          expiry_sensitive: true,
          min_stock_days: 2,
          max_stock_days: 7
        },
        'dry_goods': { 
          codes: ['INV-DRY'], 
          name: 'Dry Goods',
          turnover_target: 12,
          expiry_sensitive: false,
          min_stock_days: 14,
          max_stock_days: 30
        },
        'beverages': { 
          codes: ['INV-BEV'], 
          name: 'Beverages',
          turnover_target: 24,
          expiry_sensitive: false,
          min_stock_days: 7,
          max_stock_days: 21
        }
      },
      key_metrics: [
        'food_cost_percentage',
        'waste_percentage',
        'inventory_variance',
        'par_level_compliance',
        'freshness_index',
        'menu_availability'
      ],
      alerts: {
        low_stock_threshold: 0.5,
        expiry_warning_days: 2,
        waste_threshold: 0.05,
        variance_threshold: 0.02
      },
      smart_codes: {
        daily_inventory: 'HERA.REST.INV.DAILY.v1',
        waste_tracking: 'HERA.REST.INV.WASTE.v1',
        freshness_report: 'HERA.REST.INV.FRESH.v1'
      }
    },
    
    retail: {
      name: 'Retail & E-commerce',
      inventory_categories: {
        'fast_moving': { 
          codes: ['INV-FAST'], 
          name: 'Fast Moving Items',
          turnover_target: 12,
          expiry_sensitive: false,
          min_stock_days: 14,
          max_stock_days: 30
        },
        'seasonal': { 
          codes: ['INV-SEASON'], 
          name: 'Seasonal Products',
          turnover_target: 4,
          expiry_sensitive: false,
          min_stock_days: 30,
          max_stock_days: 90
        },
        'regular': { 
          codes: ['INV-REG'], 
          name: 'Regular Stock',
          turnover_target: 6,
          expiry_sensitive: false,
          min_stock_days: 21,
          max_stock_days: 60
        }
      },
      key_metrics: [
        'gmroi', // Gross Margin Return on Investment
        'sell_through_rate',
        'stock_to_sales_ratio',
        'inventory_turnover',
        'shrinkage_rate',
        'fulfillment_rate'
      ],
      alerts: {
        low_stock_threshold: 0.3,
        overstock_threshold: 2.0,
        slow_moving_days: 60,
        obsolete_days: 180
      },
      smart_codes: {
        stock_analysis: 'HERA.RETAIL.INV.STOCK.v1',
        turnover_report: 'HERA.RETAIL.INV.TURN.v1',
        abc_analysis: 'HERA.RETAIL.INV.ABC.v1'
      }
    }
  }
};

// ================================================================================
// CORE INVENTORY ANALYTICS FUNCTIONS
// ================================================================================

async function getCurrentStock(organizationId, options = {}) {
  try {
    const { 
      location = null,
      category = null,
      includeZeroStock = false 
    } = options;

    // Get all inventory items (products/supplies as entities)
    let query = supabase
      .from('core_entities')
      .select(`
        *,
        core_dynamic_data!inner(*)
      `)
      .eq('organization_id', organizationId)
      .in('entity_type', ['product', 'supply', 'inventory_item']);

    const { data: inventoryItems, error: itemsError } = await query;

    if (itemsError) throw itemsError;

    // Get recent inventory transactions to calculate current stock
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: transactions, error: txnError } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        universal_transaction_lines!inner(*)
      `)
      .eq('organization_id', organizationId)
      .in('transaction_type', ['purchase', 'sale', 'adjustment', 'transfer'])
      .gte('transaction_date', thirtyDaysAgo.toISOString());

    if (txnError) throw txnError;

    // Calculate stock levels
    const stockLevels = {};
    
    // Initialize inventory items
    inventoryItems?.forEach(item => {
      // Extract stock data from dynamic fields
      const stockData = {};
      item.core_dynamic_data?.forEach(field => {
        if (field.field_name === 'current_stock') {
          stockData.current_stock = field.field_value_number || 0;
        } else if (field.field_name === 'reorder_point') {
          stockData.reorder_point = field.field_value_number || 0;
        } else if (field.field_name === 'reorder_quantity') {
          stockData.reorder_quantity = field.field_value_number || 0;
        } else if (field.field_name === 'unit_cost') {
          stockData.unit_cost = field.field_value_number || 0;
        } else if (field.field_name === 'category') {
          stockData.category = field.field_value_text || 'Uncategorized';
        } else if (field.field_name === 'location') {
          stockData.location = field.field_value_text || 'Main';
        }
      });

      stockLevels[item.id] = {
        item_id: item.id,
        item_code: item.entity_code,
        item_name: item.entity_name,
        category: stockData.category,
        location: stockData.location,
        current_stock: stockData.current_stock,
        reorder_point: stockData.reorder_point,
        reorder_quantity: stockData.reorder_quantity,
        unit_cost: stockData.unit_cost,
        stock_value: stockData.current_stock * stockData.unit_cost,
        stock_status: 'unknown',
        days_of_stock: 0,
        last_movement: null
      };
    });

    // Update stock based on transactions
    transactions?.forEach(txn => {
      txn.universal_transaction_lines?.forEach(line => {
        const itemId = line.line_entity_id;
        if (stockLevels[itemId]) {
          const quantity = line.quantity || 0;
          
          // Update based on transaction type
          if (txn.transaction_type === 'purchase') {
            stockLevels[itemId].current_stock += quantity;
          } else if (txn.transaction_type === 'sale') {
            stockLevels[itemId].current_stock -= quantity;
          } else if (txn.transaction_type === 'adjustment') {
            const adjustmentType = txn.metadata?.adjustment_type || 'increase';
            if (adjustmentType === 'increase') {
              stockLevels[itemId].current_stock += quantity;
            } else {
              stockLevels[itemId].current_stock -= quantity;
            }
          }
          
          // Track last movement
          if (!stockLevels[itemId].last_movement || 
              new Date(txn.transaction_date) > new Date(stockLevels[itemId].last_movement)) {
            stockLevels[itemId].last_movement = txn.transaction_date;
          }
        }
      });
    });

    // Calculate stock status and metrics
    Object.values(stockLevels).forEach(item => {
      // Stock status
      if (item.current_stock <= 0) {
        item.stock_status = 'out_of_stock';
      } else if (item.current_stock <= item.reorder_point * 0.25) {
        item.stock_status = 'critical';
      } else if (item.current_stock <= item.reorder_point) {
        item.stock_status = 'low';
      } else if (item.current_stock > item.reorder_point * 3) {
        item.stock_status = 'overstock';
      } else {
        item.stock_status = 'normal';
      }
      
      // Recalculate stock value
      item.stock_value = item.current_stock * item.unit_cost;
    });

    // Filter results
    let results = Object.values(stockLevels);
    
    if (!includeZeroStock) {
      results = results.filter(item => item.current_stock > 0);
    }
    
    if (location) {
      results = results.filter(item => item.location === location);
    }
    
    if (category) {
      results = results.filter(item => item.category === category);
    }

    // Summary statistics
    const summary = {
      total_items: results.length,
      total_value: results.reduce((sum, item) => sum + item.stock_value, 0),
      out_of_stock: results.filter(item => item.stock_status === 'out_of_stock').length,
      low_stock: results.filter(item => item.stock_status === 'low').length,
      critical_stock: results.filter(item => item.stock_status === 'critical').length,
      overstock: results.filter(item => item.stock_status === 'overstock').length,
      categories: [...new Set(results.map(item => item.category))],
      locations: [...new Set(results.map(item => item.location))]
    };

    return createMCPResponse({
      success: true,
      component: 'HERA.INVENTORY.STOCK.LEVELS.v1',
      timestamp: new Date().toISOString(),
      organization_id: organizationId,
      data: {
        stock_items: results.sort((a, b) => a.stock_status === 'critical' ? -1 : 1),
        summary,
        filters_applied: {
          location,
          category,
          includeZeroStock
        }
      }
    });

  } catch (error) {
    return createMCPResponse({
      success: false,
      error: error.message,
      component: 'HERA.INVENTORY.STOCK.LEVELS.v1'
    });
  }
}

async function getInventoryMovements(organizationId, options = {}) {
  try {
    const {
      startDate = new Date(new Date().setDate(new Date().getDate() - 7)),
      endDate = new Date(),
      movementType = null,
      itemId = null
    } = options;

    // Get inventory transactions
    let query = supabase
      .from('universal_transactions')
      .select(`
        *,
        universal_transaction_lines!inner(*),
        from_entity:core_entities!from_entity_id(entity_name, entity_type),
        to_entity:core_entities!to_entity_id(entity_name, entity_type)
      `)
      .eq('organization_id', organizationId)
      .in('transaction_type', ['purchase', 'sale', 'adjustment', 'transfer', 'goods_receipt', 'goods_issue'])
      .gte('transaction_date', startDate.toISOString())
      .lte('transaction_date', endDate.toISOString())
      .order('transaction_date', { ascending: false });

    if (movementType) {
      query = query.eq('transaction_type', movementType);
    }

    const { data: movements, error } = await query;

    if (error) throw error;

    // Process movements
    const movementSummary = {
      total_movements: 0,
      inbound: { count: 0, quantity: 0, value: 0 },
      outbound: { count: 0, quantity: 0, value: 0 },
      adjustments: { count: 0, quantity: 0, value: 0 },
      transfers: { count: 0, quantity: 0, value: 0 },
      by_date: {},
      by_item: {},
      by_type: {}
    };

    const processedMovements = [];

    movements?.forEach(movement => {
      movement.universal_transaction_lines?.forEach(line => {
        if (itemId && line.line_entity_id !== itemId) return;

        const movementData = {
          movement_id: movement.id,
          movement_date: movement.transaction_date,
          movement_type: movement.transaction_type,
          item_id: line.line_entity_id,
          item_name: line.metadata?.item_name || 'Unknown Item',
          quantity: line.quantity || 0,
          unit_cost: line.unit_price || 0,
          total_value: line.line_amount || 0,
          reference: movement.transaction_code,
          from_location: movement.from_entity?.entity_name || null,
          to_location: movement.to_entity?.entity_name || null,
          notes: movement.notes || ''
        };

        processedMovements.push(movementData);
        movementSummary.total_movements++;

        // Categorize movement
        if (['purchase', 'goods_receipt'].includes(movement.transaction_type)) {
          movementSummary.inbound.count++;
          movementSummary.inbound.quantity += movementData.quantity;
          movementSummary.inbound.value += movementData.total_value;
        } else if (['sale', 'goods_issue'].includes(movement.transaction_type)) {
          movementSummary.outbound.count++;
          movementSummary.outbound.quantity += movementData.quantity;
          movementSummary.outbound.value += movementData.total_value;
        } else if (movement.transaction_type === 'adjustment') {
          movementSummary.adjustments.count++;
          movementSummary.adjustments.quantity += movementData.quantity;
          movementSummary.adjustments.value += movementData.total_value;
        } else if (movement.transaction_type === 'transfer') {
          movementSummary.transfers.count++;
          movementSummary.transfers.quantity += movementData.quantity;
          movementSummary.transfers.value += movementData.total_value;
        }

        // By date aggregation
        const dateKey = movementData.movement_date.split('T')[0];
        if (!movementSummary.by_date[dateKey]) {
          movementSummary.by_date[dateKey] = {
            in: 0, out: 0, adjustments: 0, transfers: 0
          };
        }
        
        if (['purchase', 'goods_receipt'].includes(movement.transaction_type)) {
          movementSummary.by_date[dateKey].in += movementData.quantity;
        } else if (['sale', 'goods_issue'].includes(movement.transaction_type)) {
          movementSummary.by_date[dateKey].out += movementData.quantity;
        }

        // By item aggregation
        if (!movementSummary.by_item[movementData.item_id]) {
          movementSummary.by_item[movementData.item_id] = {
            item_name: movementData.item_name,
            in: 0, out: 0, net: 0
          };
        }
        
        if (['purchase', 'goods_receipt'].includes(movement.transaction_type)) {
          movementSummary.by_item[movementData.item_id].in += movementData.quantity;
        } else if (['sale', 'goods_issue'].includes(movement.transaction_type)) {
          movementSummary.by_item[movementData.item_id].out += movementData.quantity;
        }
        
        movementSummary.by_item[movementData.item_id].net = 
          movementSummary.by_item[movementData.item_id].in - 
          movementSummary.by_item[movementData.item_id].out;
      });
    });

    return createMCPResponse({
      success: true,
      component: 'HERA.INVENTORY.MOVEMENT.ANALYSIS.v1',
      timestamp: new Date().toISOString(),
      organization_id: organizationId,
      data: {
        period: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        movements: processedMovements,
        summary: movementSummary,
        insights: generateMovementInsights(movementSummary)
      }
    });

  } catch (error) {
    return createMCPResponse({
      success: false,
      error: error.message,
      component: 'HERA.INVENTORY.MOVEMENT.ANALYSIS.v1'
    });
  }
}

async function getInventoryTurnover(organizationId, options = {}) {
  try {
    const {
      period = 30, // days
      category = null
    } = options;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - period);

    // Get current stock
    const stockResult = await getCurrentStock(organizationId, { includeZeroStock: true });
    if (!stockResult.success) throw new Error('Failed to get current stock');

    // Get movements for the period
    const movementsResult = await getInventoryMovements(organizationId, {
      startDate,
      endDate
    });
    if (!movementsResult.success) throw new Error('Failed to get movements');

    // Calculate turnover metrics
    const turnoverAnalysis = {};
    const stockItems = stockResult.data.stock_items;
    const movements = movementsResult.data.summary.by_item;

    stockItems.forEach(item => {
      if (category && item.category !== category) return;

      const itemMovement = movements[item.item_id] || { in: 0, out: 0 };
      const averageStock = (item.current_stock + itemMovement.net) / 2;
      
      // Calculate turnover
      let turnoverRate = 0;
      let daysOfStock = 0;
      
      if (averageStock > 0 && itemMovement.out > 0) {
        // Annualized turnover rate
        turnoverRate = (itemMovement.out / averageStock) * (365 / period);
        daysOfStock = averageStock / (itemMovement.out / period);
      }

      turnoverAnalysis[item.item_id] = {
        item_id: item.item_id,
        item_name: item.item_name,
        category: item.category,
        current_stock: item.current_stock,
        stock_value: item.stock_value,
        period_usage: itemMovement.out,
        period_receipts: itemMovement.in,
        average_stock: averageStock,
        turnover_rate: turnoverRate,
        days_of_stock: daysOfStock,
        performance: categorizeTurnoverPerformance(turnoverRate, item.category)
      };
    });

    // Category summary
    const categorySummary = {};
    Object.values(turnoverAnalysis).forEach(item => {
      if (!categorySummary[item.category]) {
        categorySummary[item.category] = {
          total_value: 0,
          total_items: 0,
          avg_turnover: 0,
          slow_moving: 0,
          fast_moving: 0,
          dead_stock: 0
        };
      }
      
      categorySummary[item.category].total_value += item.stock_value;
      categorySummary[item.category].total_items++;
      categorySummary[item.category].avg_turnover += item.turnover_rate;
      
      if (item.performance === 'slow') categorySummary[item.category].slow_moving++;
      if (item.performance === 'fast') categorySummary[item.category].fast_moving++;
      if (item.performance === 'dead') categorySummary[item.category].dead_stock++;
    });

    // Calculate category averages
    Object.keys(categorySummary).forEach(cat => {
      if (categorySummary[cat].total_items > 0) {
        categorySummary[cat].avg_turnover /= categorySummary[cat].total_items;
      }
    });

    return createMCPResponse({
      success: true,
      component: 'HERA.INVENTORY.TURNOVER.ANALYSIS.v1',
      timestamp: new Date().toISOString(),
      organization_id: organizationId,
      data: {
        analysis_period: period,
        items: Object.values(turnoverAnalysis).sort((a, b) => a.turnover_rate - b.turnover_rate),
        category_summary: categorySummary,
        overall_metrics: {
          total_inventory_value: Object.values(turnoverAnalysis).reduce((sum, item) => sum + item.stock_value, 0),
          average_turnover: Object.values(turnoverAnalysis).reduce((sum, item) => sum + item.turnover_rate, 0) / Object.values(turnoverAnalysis).length,
          slow_moving_count: Object.values(turnoverAnalysis).filter(item => item.performance === 'slow').length,
          dead_stock_count: Object.values(turnoverAnalysis).filter(item => item.performance === 'dead').length,
          optimization_potential: calculateOptimizationPotential(turnoverAnalysis)
        },
        recommendations: generateTurnoverRecommendations(turnoverAnalysis, categorySummary)
      }
    });

  } catch (error) {
    return createMCPResponse({
      success: false,
      error: error.message,
      component: 'HERA.INVENTORY.TURNOVER.ANALYSIS.v1'
    });
  }
}

async function getInventoryValuation(organizationId, options = {}) {
  try {
    const {
      valuationMethod = 'average', // average, fifo, lifo
      includeDetails = true
    } = options;

    // Get current stock
    const stockResult = await getCurrentStock(organizationId, { includeZeroStock: false });
    if (!stockResult.success) throw new Error('Failed to get current stock');

    // Get recent purchase history for valuation
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: purchases, error } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        universal_transaction_lines!inner(*)
      `)
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'purchase')
      .gte('transaction_date', thirtyDaysAgo.toISOString())
      .order('transaction_date', { ascending: valuationMethod === 'fifo' });

    if (error) throw error;

    // Calculate valuation
    const valuation = {
      total_value: 0,
      valuation_method: valuationMethod,
      valuation_date: new Date().toISOString(),
      by_category: {},
      by_location: {},
      items: []
    };

    stockResult.data.stock_items.forEach(item => {
      // Get purchase history for this item
      const itemPurchases = [];
      purchases?.forEach(purchase => {
        purchase.universal_transaction_lines?.forEach(line => {
          if (line.line_entity_id === item.item_id) {
            itemPurchases.push({
              date: purchase.transaction_date,
              quantity: line.quantity || 0,
              unit_cost: line.unit_price || 0
            });
          }
        });
      });

      // Calculate weighted average cost or FIFO/LIFO
      let calculatedCost = item.unit_cost;
      
      if (valuationMethod === 'average' && itemPurchases.length > 0) {
        const totalQuantity = itemPurchases.reduce((sum, p) => sum + p.quantity, 0);
        const totalValue = itemPurchases.reduce((sum, p) => sum + (p.quantity * p.unit_cost), 0);
        calculatedCost = totalValue / totalQuantity;
      } else if (valuationMethod === 'fifo' && itemPurchases.length > 0) {
        // Use oldest cost
        calculatedCost = itemPurchases[0].unit_cost;
      } else if (valuationMethod === 'lifo' && itemPurchases.length > 0) {
        // Use newest cost
        calculatedCost = itemPurchases[itemPurchases.length - 1].unit_cost;
      }

      const itemValue = item.current_stock * calculatedCost;
      
      const valuationItem = {
        item_id: item.item_id,
        item_code: item.item_code,
        item_name: item.item_name,
        category: item.category,
        location: item.location,
        quantity: item.current_stock,
        unit_cost: calculatedCost,
        total_value: itemValue,
        valuation_basis: itemPurchases.length > 0 ? 'purchase_history' : 'standard_cost'
      };

      valuation.items.push(valuationItem);
      valuation.total_value += itemValue;

      // Category aggregation
      if (!valuation.by_category[item.category]) {
        valuation.by_category[item.category] = {
          value: 0,
          items: 0,
          percentage: 0
        };
      }
      valuation.by_category[item.category].value += itemValue;
      valuation.by_category[item.category].items++;

      // Location aggregation
      if (!valuation.by_location[item.location]) {
        valuation.by_location[item.location] = {
          value: 0,
          items: 0,
          percentage: 0
        };
      }
      valuation.by_location[item.location].value += itemValue;
      valuation.by_location[item.location].items++;
    });

    // Calculate percentages
    Object.keys(valuation.by_category).forEach(cat => {
      valuation.by_category[cat].percentage = 
        (valuation.by_category[cat].value / valuation.total_value) * 100;
    });

    Object.keys(valuation.by_location).forEach(loc => {
      valuation.by_location[loc].percentage = 
        (valuation.by_location[loc].value / valuation.total_value) * 100;
    });

    // ABC Analysis
    const abcAnalysis = performABCAnalysis(valuation.items);

    return createMCPResponse({
      success: true,
      component: 'HERA.INVENTORY.VALUATION.v1',
      timestamp: new Date().toISOString(),
      organization_id: organizationId,
      data: {
        valuation: includeDetails ? valuation : {
          total_value: valuation.total_value,
          valuation_method: valuation.valuation_method,
          valuation_date: valuation.valuation_date,
          by_category: valuation.by_category,
          by_location: valuation.by_location
        },
        abc_analysis: abcAnalysis,
        key_metrics: {
          total_skus: valuation.items.length,
          average_value_per_sku: valuation.total_value / valuation.items.length,
          highest_value_item: valuation.items.sort((a, b) => b.total_value - a.total_value)[0],
          inventory_concentration: abcAnalysis.a_class.value_percentage
        }
      }
    });

  } catch (error) {
    return createMCPResponse({
      success: false,
      error: error.message,
      component: 'HERA.INVENTORY.VALUATION.v1'
    });
  }
}

async function getLowStockAlerts(organizationId, options = {}) {
  try {
    const {
      urgency = 'all', // all, critical, low, reorder
      includePredictions = true
    } = options;

    // Get current stock
    const stockResult = await getCurrentStock(organizationId);
    if (!stockResult.success) throw new Error('Failed to get current stock');

    // Get movement history for predictions
    const movementsResult = await getInventoryMovements(organizationId, {
      startDate: new Date(new Date().setDate(new Date().getDate() - 30))
    });

    const alerts = [];
    const movements = movementsResult.data?.summary.by_item || {};

    stockResult.data.stock_items.forEach(item => {
      // Skip if stock is normal or overstock
      if (['normal', 'overstock'].includes(item.stock_status)) return;
      
      // Filter by urgency
      if (urgency !== 'all' && item.stock_status !== urgency) return;

      const itemMovement = movements[item.item_id] || { out: 0 };
      const dailyUsage = itemMovement.out / 30;
      const daysUntilStockout = dailyUsage > 0 ? item.current_stock / dailyUsage : 999;
      
      // Lead time estimation (default 7 days)
      const leadTimeDays = 7;
      const shouldReorderNow = daysUntilStockout <= leadTimeDays;

      const alert = {
        item_id: item.item_id,
        item_code: item.item_code,
        item_name: item.item_name,
        category: item.category,
        current_stock: item.current_stock,
        reorder_point: item.reorder_point,
        reorder_quantity: item.reorder_quantity,
        stock_status: item.stock_status,
        urgency_level: item.stock_status === 'out_of_stock' ? 'critical' : 
                      item.stock_status === 'critical' ? 'high' : 'medium',
        daily_usage: dailyUsage,
        days_until_stockout: Math.floor(daysUntilStockout),
        estimated_stockout_date: new Date(Date.now() + daysUntilStockout * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        reorder_recommendation: {
          should_reorder_now: shouldReorderNow,
          recommended_quantity: item.reorder_quantity || Math.ceil(dailyUsage * 30),
          estimated_cost: (item.reorder_quantity || Math.ceil(dailyUsage * 30)) * item.unit_cost
        }
      };

      alerts.push(alert);
    });

    // Sort by urgency
    alerts.sort((a, b) => {
      const urgencyOrder = { critical: 0, high: 1, medium: 2 };
      return urgencyOrder[a.urgency_level] - urgencyOrder[b.urgency_level];
    });

    // Group by category
    const alertsByCategory = {};
    alerts.forEach(alert => {
      if (!alertsByCategory[alert.category]) {
        alertsByCategory[alert.category] = [];
      }
      alertsByCategory[alert.category].push(alert);
    });

    return createMCPResponse({
      success: true,
      component: 'HERA.INVENTORY.LOW.STOCK.ALERTS.v1',
      timestamp: new Date().toISOString(),
      organization_id: organizationId,
      data: {
        total_alerts: alerts.length,
        critical_count: alerts.filter(a => a.urgency_level === 'critical').length,
        high_count: alerts.filter(a => a.urgency_level === 'high').length,
        medium_count: alerts.filter(a => a.urgency_level === 'medium').length,
        alerts: alerts,
        by_category: alertsByCategory,
        total_reorder_value: alerts.reduce((sum, a) => sum + a.reorder_recommendation.estimated_cost, 0),
        action_summary: generateActionSummary(alerts)
      }
    });

  } catch (error) {
    return createMCPResponse({
      success: false,
      error: error.message,
      component: 'HERA.INVENTORY.LOW.STOCK.ALERTS.v1'
    });
  }
}

// ================================================================================
// HELPER FUNCTIONS
// ================================================================================

function createMCPResponse(data) {
  return {
    ...data,
    mcp_compatible: true,
    api_version: '1.0.0'
  };
}

function generateMovementInsights(summary) {
  const insights = [];
  
  const netMovement = summary.inbound.quantity - summary.outbound.quantity;
  if (netMovement < 0) {
    insights.push(`Net inventory decrease of ${Math.abs(netMovement)} units - monitor stock levels`);
  }
  
  if (summary.adjustments.count > summary.total_movements * 0.1) {
    insights.push('High adjustment rate (>10%) - investigate inventory accuracy');
  }
  
  const movementValue = summary.inbound.value + summary.outbound.value;
  if (movementValue > 0) {
    const avgTransactionValue = movementValue / summary.total_movements;
    insights.push(`Average transaction value: ${avgTransactionValue.toFixed(2)}`);
  }
  
  return insights;
}

function categorizeTurnoverPerformance(turnoverRate, category) {
  // Industry-specific targets would go here
  if (turnoverRate === 0) return 'dead';
  if (turnoverRate < 2) return 'slow';
  if (turnoverRate > 12) return 'fast';
  return 'normal';
}

function calculateOptimizationPotential(turnoverAnalysis) {
  const deadStockValue = Object.values(turnoverAnalysis)
    .filter(item => item.performance === 'dead')
    .reduce((sum, item) => sum + item.stock_value, 0);
    
  const slowMovingValue = Object.values(turnoverAnalysis)
    .filter(item => item.performance === 'slow')
    .reduce((sum, item) => sum + item.stock_value, 0);
    
  return {
    dead_stock_value: deadStockValue,
    slow_moving_value: slowMovingValue,
    total_optimization_potential: deadStockValue + (slowMovingValue * 0.5),
    recommendations: [
      deadStockValue > 0 ? `Clear dead stock to free up ${deadStockValue.toFixed(2)} in working capital` : null,
      slowMovingValue > 0 ? `Optimize slow-moving inventory worth ${slowMovingValue.toFixed(2)}` : null
    ].filter(Boolean)
  };
}

function generateTurnoverRecommendations(turnoverAnalysis, categorySummary) {
  const recommendations = [];
  
  Object.entries(categorySummary).forEach(([category, summary]) => {
    if (summary.dead_stock > 0) {
      recommendations.push({
        category: category,
        type: 'dead_stock',
        action: `Clear ${summary.dead_stock} dead stock items in ${category}`,
        impact: 'Free up working capital and storage space'
      });
    }
    
    if (summary.avg_turnover < 4) {
      recommendations.push({
        category: category,
        type: 'low_turnover',
        action: `Improve turnover rate for ${category} (current: ${summary.avg_turnover.toFixed(1)}x)`,
        impact: 'Reduce carrying costs and improve cash flow'
      });
    }
  });
  
  return recommendations;
}

function performABCAnalysis(items) {
  // Sort by value
  const sortedItems = [...items].sort((a, b) => b.total_value - a.total_value);
  const totalValue = sortedItems.reduce((sum, item) => sum + item.total_value, 0);
  
  let cumulativeValue = 0;
  const abcClassification = {
    a_class: { items: [], count: 0, value: 0, value_percentage: 0 },
    b_class: { items: [], count: 0, value: 0, value_percentage: 0 },
    c_class: { items: [], count: 0, value: 0, value_percentage: 0 }
  };
  
  sortedItems.forEach(item => {
    cumulativeValue += item.total_value;
    const cumulativePercentage = (cumulativeValue / totalValue) * 100;
    
    if (cumulativePercentage <= 80) {
      abcClassification.a_class.items.push(item.item_id);
      abcClassification.a_class.count++;
      abcClassification.a_class.value += item.total_value;
    } else if (cumulativePercentage <= 95) {
      abcClassification.b_class.items.push(item.item_id);
      abcClassification.b_class.count++;
      abcClassification.b_class.value += item.total_value;
    } else {
      abcClassification.c_class.items.push(item.item_id);
      abcClassification.c_class.count++;
      abcClassification.c_class.value += item.total_value;
    }
  });
  
  // Calculate percentages
  ['a_class', 'b_class', 'c_class'].forEach(cls => {
    abcClassification[cls].value_percentage = 
      (abcClassification[cls].value / totalValue) * 100;
  });
  
  return abcClassification;
}

function generateActionSummary(alerts) {
  const critical = alerts.filter(a => a.urgency_level === 'critical');
  const reorderNow = alerts.filter(a => a.reorder_recommendation.should_reorder_now);
  
  return {
    immediate_actions: [
      critical.length > 0 ? `Address ${critical.length} critical stockouts immediately` : null,
      reorderNow.length > 0 ? `Place orders for ${reorderNow.length} items today` : null
    ].filter(Boolean),
    total_reorder_cost: reorderNow.reduce((sum, a) => sum + a.reorder_recommendation.estimated_cost, 0),
    items_to_reorder: reorderNow.map(a => ({
      item_name: a.item_name,
      quantity: a.reorder_recommendation.recommended_quantity,
      cost: a.reorder_recommendation.estimated_cost
    }))
  };
}

// ================================================================================
// CLI INTERFACE
// ================================================================================

async function showHelp() {
  console.log(`
🧬 HERA UNIVERSAL INVENTORY REPORT DNA CLI TOOL
===============================================

Real-time inventory analytics and management for any business type.

USAGE:
  node inventory-report-dna-cli.js <command> [options]

COMMANDS:
  stock                 Current stock levels and status
    --location <loc>     Filter by location
    --category <cat>     Filter by category
    --zero               Include zero stock items

  movements             Analyze inventory movements
    --days <n>           Days to analyze (default: 7)
    --type <type>        Movement type filter
    --item <id>          Specific item movements

  turnover              Calculate inventory turnover rates
    --period <days>      Analysis period (default: 30)
    --category <cat>     Filter by category

  valuation             Inventory valuation report
    --method <type>      average|fifo|lifo (default: average)
    --details            Include item details

  alerts                Low stock and reorder alerts
    --urgency <level>    all|critical|low|reorder
    --predict            Include predictions

  aging                 Inventory aging analysis
    --buckets            Show aging buckets

  abc                   ABC analysis by value

  hair-talkz            Run complete analysis for Hair Talkz orgs

  help                  Show this help message

EXAMPLES:
  node inventory-report-dna-cli.js stock --category "Hair Products"
  node inventory-report-dna-cli.js movements --days 30
  node inventory-report-dna-cli.js turnover --period 90
  node inventory-report-dna-cli.js alerts --urgency critical
  node inventory-report-dna-cli.js hair-talkz

ENVIRONMENT VARIABLES:
  DEFAULT_ORGANIZATION_ID   Your organization UUID
  SUPABASE_URL             Your Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY Your Supabase service role key

SMART CODE: HERA.INVENTORY.REPORT.DNA.CLI.v1

🔧 MCP Integration Ready - Use with salon-manager for AI insights
`);
}

// ================================================================================
// MAIN EXECUTION
// ================================================================================

async function main() {
  console.log('🧬 HERA Universal Inventory Report DNA CLI Tool\n');

  if (!organizationId && command !== 'help' && command !== 'hair-talkz') {
    console.error('❌ DEFAULT_ORGANIZATION_ID not set in environment');
    console.log('   Set it in your .env file or use --org flag');
    return;
  }

  switch (command) {
    case 'stock':
      const stockLocation = process.argv[process.argv.indexOf('--location') + 1] || null;
      const stockCategory = process.argv[process.argv.indexOf('--category') + 1] || null;
      const includeZero = process.argv.includes('--zero');
      
      const stockResult = await getCurrentStock(organizationId, {
        location: stockLocation,
        category: stockCategory,
        includeZeroStock: includeZero
      });
      console.log(JSON.stringify(stockResult, null, 2));
      break;

    case 'movements':
      const movementDays = parseInt(process.argv[process.argv.indexOf('--days') + 1] || '7');
      const movementType = process.argv[process.argv.indexOf('--type') + 1] || null;
      const itemId = process.argv[process.argv.indexOf('--item') + 1] || null;
      
      const movementsResult = await getInventoryMovements(organizationId, {
        startDate: new Date(new Date().setDate(new Date().getDate() - movementDays)),
        movementType,
        itemId
      });
      console.log(JSON.stringify(movementsResult, null, 2));
      break;

    case 'turnover':
      const turnoverPeriod = parseInt(process.argv[process.argv.indexOf('--period') + 1] || '30');
      const turnoverCategory = process.argv[process.argv.indexOf('--category') + 1] || null;
      
      const turnoverResult = await getInventoryTurnover(organizationId, {
        period: turnoverPeriod,
        category: turnoverCategory
      });
      console.log(JSON.stringify(turnoverResult, null, 2));
      break;

    case 'valuation':
      const valuationMethod = process.argv[process.argv.indexOf('--method') + 1] || 'average';
      const includeDetails = process.argv.includes('--details');
      
      const valuationResult = await getInventoryValuation(organizationId, {
        valuationMethod,
        includeDetails
      });
      console.log(JSON.stringify(valuationResult, null, 2));
      break;

    case 'alerts':
      const urgency = process.argv[process.argv.indexOf('--urgency') + 1] || 'all';
      const includePredictions = process.argv.includes('--predict');
      
      const alertsResult = await getLowStockAlerts(organizationId, {
        urgency,
        includePredictions
      });
      console.log(JSON.stringify(alertsResult, null, 2));
      break;

    case 'hair-talkz':
      console.log('💇‍♀️ Running Inventory Analysis for Hair Talkz Organizations...\n');
      for (const org of HAIR_TALKZ_ORGS) {
        console.log(`\n📊 ${org.name}`);
        console.log('─'.repeat(60));
        
        const stock = await getCurrentStock(org.id);
        if (stock.success && stock.data.summary.total_items > 0) {
          console.log(`✅ Total Items: ${stock.data.summary.total_items}`);
          console.log(`   Stock Value: ${stock.data.summary.total_value.toFixed(2)} AED`);
          console.log(`   Out of Stock: ${stock.data.summary.out_of_stock}`);
          console.log(`   Low Stock: ${stock.data.summary.low_stock}`);
        } else {
          console.log(`⚠️  No inventory data available`);
        }
        
        const alerts = await getLowStockAlerts(org.id, { urgency: 'critical' });
        if (alerts.success && alerts.data.critical_count > 0) {
          console.log(`\n🚨 Critical Alerts: ${alerts.data.critical_count}`);
          console.log(`   Reorder Value: ${alerts.data.total_reorder_value.toFixed(2)} AED`);
        }
      }
      break;

    case 'help':
    default:
      await showHelp();
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Error:', error.message);
    process.exit(1);
  });
}

// Export functions for MCP integration
module.exports = {
  getCurrentStock,
  getInventoryMovements,
  getInventoryTurnover,
  getInventoryValuation,
  getLowStockAlerts,
  INVENTORY_REPORT_DNA_CONFIG,
  HAIR_TALKZ_ORGS
};