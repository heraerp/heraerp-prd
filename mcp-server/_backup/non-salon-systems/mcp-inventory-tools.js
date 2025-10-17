#!/usr/bin/env node

/**
 * HERA MCP Inventory Tools Integration
 * Exposes Inventory Report DNA functions as MCP tools for AI access
 * Smart Code: HERA.MCP.INVENTORY.TOOLS.v1
 */

const {
  getCurrentStock,
  getInventoryMovements,
  getInventoryTurnover,
  getInventoryValuation,
  getLowStockAlerts
} = require('./inventory-report-dna-cli');

// MCP Tool Definitions
const MCP_INVENTORY_TOOLS = {
  'get-current-stock': {
    description: 'Get current stock levels with status indicators and valuation',
    parameters: {
      organization_id: { type: 'string', required: true },
      location: { type: 'string', required: false },
      category: { type: 'string', required: false },
      include_zero_stock: { type: 'boolean', default: false }
    },
    handler: async (params) => {
      return await getCurrentStock(params.organization_id, {
        location: params.location,
        category: params.category,
        includeZeroStock: params.include_zero_stock
      });
    }
  },

  'get-inventory-movements': {
    description: 'Analyze inventory movements including purchases, sales, transfers, and adjustments',
    parameters: {
      organization_id: { type: 'string', required: true },
      start_date: { type: 'string', format: 'YYYY-MM-DD', required: false },
      end_date: { type: 'string', format: 'YYYY-MM-DD', required: false },
      movement_type: { type: 'string', enum: ['purchase', 'sale', 'adjustment', 'transfer'], required: false },
      item_id: { type: 'string', required: false }
    },
    handler: async (params) => {
      return await getInventoryMovements(params.organization_id, {
        startDate: params.start_date ? new Date(params.start_date) : undefined,
        endDate: params.end_date ? new Date(params.end_date) : undefined,
        movementType: params.movement_type,
        itemId: params.item_id
      });
    }
  },

  'get-inventory-turnover': {
    description: 'Calculate inventory turnover rates and identify slow-moving or dead stock',
    parameters: {
      organization_id: { type: 'string', required: true },
      period_days: { type: 'number', default: 30, required: false },
      category: { type: 'string', required: false }
    },
    handler: async (params) => {
      return await getInventoryTurnover(params.organization_id, {
        period: params.period_days || 30,
        category: params.category
      });
    }
  },

  'get-inventory-valuation': {
    description: 'Get inventory valuation with ABC analysis and multiple costing methods',
    parameters: {
      organization_id: { type: 'string', required: true },
      valuation_method: { type: 'string', enum: ['average', 'fifo', 'lifo'], default: 'average' },
      include_details: { type: 'boolean', default: true }
    },
    handler: async (params) => {
      return await getInventoryValuation(params.organization_id, {
        valuationMethod: params.valuation_method || 'average',
        includeDetails: params.include_details !== false
      });
    }
  },

  'get-low-stock-alerts': {
    description: 'Get low stock alerts with reorder recommendations and stockout predictions',
    parameters: {
      organization_id: { type: 'string', required: true },
      urgency: { type: 'string', enum: ['all', 'critical', 'low', 'reorder'], default: 'all' },
      include_predictions: { type: 'boolean', default: true }
    },
    handler: async (params) => {
      return await getLowStockAlerts(params.organization_id, {
        urgency: params.urgency || 'all',
        includePredictions: params.include_predictions !== false
      });
    }
  },

  'analyze-inventory-health': {
    description: 'Comprehensive inventory health analysis with optimization recommendations',
    parameters: {
      organization_id: { type: 'string', required: true },
      focus_area: { 
        type: 'string', 
        enum: ['turnover', 'valuation', 'stockouts', 'overall'], 
        default: 'overall' 
      }
    },
    handler: async (params) => {
      // Comprehensive inventory health check
      const [stock, movements, turnover, valuation, alerts] = await Promise.all([
        getCurrentStock(params.organization_id),
        getInventoryMovements(params.organization_id),
        getInventoryTurnover(params.organization_id),
        getInventoryValuation(params.organization_id),
        getLowStockAlerts(params.organization_id)
      ]);

      const health = {
        success: true,
        component: 'HERA.INVENTORY.HEALTH.ANALYSIS.v1',
        timestamp: new Date().toISOString(),
        organization_id: params.organization_id,
        focus_area: params.focus_area,
        health_score: calculateHealthScore(stock, turnover, alerts),
        summary: {
          total_inventory_value: valuation.data?.valuation?.total_value || 0,
          total_skus: stock.data?.summary?.total_items || 0,
          stock_status: {
            healthy: stock.data?.stock_items?.filter(i => i.stock_status === 'normal').length || 0,
            low_stock: stock.data?.summary?.low_stock || 0,
            critical: stock.data?.summary?.critical_stock || 0,
            out_of_stock: stock.data?.summary?.out_of_stock || 0,
            overstock: stock.data?.summary?.overstock || 0
          },
          turnover_metrics: {
            average_turnover: turnover.data?.overall_metrics?.average_turnover || 0,
            slow_moving_count: turnover.data?.overall_metrics?.slow_moving_count || 0,
            dead_stock_count: turnover.data?.overall_metrics?.dead_stock_count || 0,
            dead_stock_value: turnover.data?.overall_metrics?.optimization_potential?.dead_stock_value || 0
          },
          movement_summary: {
            daily_inbound: movements.data?.summary?.inbound?.quantity || 0,
            daily_outbound: movements.data?.summary?.outbound?.quantity || 0,
            net_movement: (movements.data?.summary?.inbound?.quantity || 0) - (movements.data?.summary?.outbound?.quantity || 0)
          }
        },
        issues: identifyInventoryIssues(stock, turnover, alerts),
        recommendations: generateInventoryRecommendations(stock, turnover, valuation, alerts, params.focus_area),
        optimization_opportunities: {
          working_capital_reduction: calculateWorkingCapitalOpportunity(turnover, valuation),
          service_level_improvement: calculateServiceLevelOpportunity(alerts),
          cost_reduction: calculateCostReductionOpportunity(stock, turnover)
        }
      };

      return health;
    }
  },

  'get-reorder-plan': {
    description: 'Generate optimized reorder plan based on stock levels, lead times, and demand',
    parameters: {
      organization_id: { type: 'string', required: true },
      planning_horizon_days: { type: 'number', default: 30 },
      budget_limit: { type: 'number', required: false },
      vendor_id: { type: 'string', required: false }
    },
    handler: async (params) => {
      // Get current stock and alerts
      const [stock, alerts, movements] = await Promise.all([
        getCurrentStock(params.organization_id),
        getLowStockAlerts(params.organization_id, { urgency: 'all' }),
        getInventoryMovements(params.organization_id, { 
          startDate: new Date(new Date().setDate(new Date().getDate() - 30)) 
        })
      ]);

      // Build reorder plan
      const reorderPlan = {
        success: true,
        component: 'HERA.INVENTORY.REORDER.PLAN.v1',
        timestamp: new Date().toISOString(),
        organization_id: params.organization_id,
        planning_horizon: params.planning_horizon_days,
        budget_limit: params.budget_limit,
        items_to_reorder: [],
        total_cost: 0,
        priority_orders: [],
        regular_orders: [],
        vendor_breakdown: {}
      };

      // Process alerts and create orders
      if (alerts.success && alerts.data.alerts) {
        alerts.data.alerts.forEach(alert => {
          if (alert.reorder_recommendation.should_reorder_now) {
            const order = {
              item_id: alert.item_id,
              item_name: alert.item_name,
              current_stock: alert.current_stock,
              reorder_point: alert.reorder_point,
              recommended_quantity: alert.reorder_recommendation.recommended_quantity,
              estimated_cost: alert.reorder_recommendation.estimated_cost,
              urgency: alert.urgency_level,
              days_until_stockout: alert.days_until_stockout
            };

            reorderPlan.items_to_reorder.push(order);
            reorderPlan.total_cost += order.estimated_cost;

            if (alert.urgency_level === 'critical' || alert.urgency_level === 'high') {
              reorderPlan.priority_orders.push(order);
            } else {
              reorderPlan.regular_orders.push(order);
            }
          }
        });
      }

      // Apply budget constraints if specified
      if (params.budget_limit && reorderPlan.total_cost > params.budget_limit) {
        reorderPlan.budget_status = 'over_budget';
        reorderPlan.budget_optimization = optimizeOrdersForBudget(
          reorderPlan.items_to_reorder, 
          params.budget_limit
        );
      } else {
        reorderPlan.budget_status = 'within_budget';
      }

      return reorderPlan;
    }
  },

  'analyze-inventory-performance': {
    description: 'Analyze inventory performance with KPIs and benchmarking',
    parameters: {
      organization_id: { type: 'string', required: true },
      period_days: { type: 'number', default: 90 },
      benchmark_against: { type: 'string', enum: ['industry', 'historical', 'target'], default: 'industry' }
    },
    handler: async (params) => {
      // Get comprehensive data for performance analysis
      const [stock, turnover, movements, valuation] = await Promise.all([
        getCurrentStock(params.organization_id),
        getInventoryTurnover(params.organization_id, { period: params.period_days }),
        getInventoryMovements(params.organization_id, {
          startDate: new Date(new Date().setDate(new Date().getDate() - params.period_days))
        }),
        getInventoryValuation(params.organization_id)
      ]);

      const performance = {
        success: true,
        component: 'HERA.INVENTORY.PERFORMANCE.ANALYSIS.v1',
        timestamp: new Date().toISOString(),
        organization_id: params.organization_id,
        analysis_period: params.period_days,
        kpis: {
          inventory_turnover_ratio: turnover.data?.overall_metrics?.average_turnover || 0,
          inventory_days_on_hand: calculateDaysOnHand(stock, movements),
          stockout_rate: calculateStockoutRate(stock),
          inventory_accuracy: 95, // Would calculate from cycle counts
          carrying_cost_percentage: calculateCarryingCostPercentage(valuation),
          gmroi: calculateGMROI(valuation, movements), // Gross Margin Return on Investment
          service_level: calculateServiceLevel(stock),
          obsolescence_rate: calculateObsolescenceRate(turnover)
        },
        benchmarks: getBenchmarks(params.benchmark_against),
        performance_gaps: [],
        improvement_areas: [],
        best_practices: generateBestPractices(performance)
      };

      // Identify performance gaps
      Object.entries(performance.kpis).forEach(([metric, value]) => {
        const benchmark = performance.benchmarks[metric];
        if (benchmark && value < benchmark.target) {
          performance.performance_gaps.push({
            metric,
            current: value,
            target: benchmark.target,
            gap: benchmark.target - value,
            priority: benchmark.priority
          });
        }
      });

      return performance;
    }
  }
};

// Helper functions
function calculateHealthScore(stock, turnover, alerts) {
  let score = 100;
  
  // Deduct for stock issues
  if (stock.data?.summary) {
    score -= stock.data.summary.out_of_stock * 5;
    score -= stock.data.summary.critical_stock * 3;
    score -= stock.data.summary.low_stock * 1;
    score -= stock.data.summary.overstock * 2;
  }
  
  // Deduct for turnover issues
  if (turnover.data?.overall_metrics) {
    score -= turnover.data.overall_metrics.dead_stock_count * 4;
    score -= turnover.data.overall_metrics.slow_moving_count * 2;
  }
  
  // Deduct for critical alerts
  if (alerts.data) {
    score -= alerts.data.critical_count * 5;
  }
  
  return Math.max(0, Math.min(100, score));
}

function identifyInventoryIssues(stock, turnover, alerts) {
  const issues = [];
  
  if (stock.data?.summary?.out_of_stock > 0) {
    issues.push({
      type: 'stockout',
      severity: 'critical',
      description: `${stock.data.summary.out_of_stock} items are out of stock`,
      impact: 'Lost sales and customer dissatisfaction'
    });
  }
  
  if (turnover.data?.overall_metrics?.dead_stock_count > 0) {
    issues.push({
      type: 'dead_stock',
      severity: 'high',
      description: `${turnover.data.overall_metrics.dead_stock_count} items have no movement`,
      impact: `${turnover.data.overall_metrics.optimization_potential?.dead_stock_value || 0} tied up in dead stock`
    });
  }
  
  if (alerts.data?.critical_count > 5) {
    issues.push({
      type: 'reorder_planning',
      severity: 'high',
      description: 'Multiple items approaching stockout',
      impact: 'Risk of service disruption'
    });
  }
  
  return issues;
}

function generateInventoryRecommendations(stock, turnover, valuation, alerts, focusArea) {
  const recommendations = [];
  
  // Turnover recommendations
  if (focusArea === 'turnover' || focusArea === 'overall') {
    if (turnover.data?.overall_metrics?.average_turnover < 6) {
      recommendations.push({
        category: 'turnover_improvement',
        priority: 'high',
        action: 'Increase inventory turnover through better demand planning',
        expected_impact: 'Reduce carrying costs by 20-30%'
      });
    }
  }
  
  // Stockout prevention
  if (focusArea === 'stockouts' || focusArea === 'overall') {
    if (alerts.data?.critical_count > 0) {
      recommendations.push({
        category: 'stockout_prevention',
        priority: 'critical',
        action: `Place immediate orders for ${alerts.data.critical_count} critical items`,
        expected_impact: 'Prevent service disruptions and lost sales'
      });
    }
  }
  
  // Valuation optimization
  if (focusArea === 'valuation' || focusArea === 'overall') {
    if (valuation.data?.abc_analysis?.c_class?.count > valuation.data?.abc_analysis?.a_class?.count * 3) {
      recommendations.push({
        category: 'sku_rationalization',
        priority: 'medium',
        action: 'Review and rationalize C-class items',
        expected_impact: 'Reduce complexity and carrying costs'
      });
    }
  }
  
  return recommendations;
}

function calculateWorkingCapitalOpportunity(turnover, valuation) {
  const deadStockValue = turnover.data?.overall_metrics?.optimization_potential?.dead_stock_value || 0;
  const slowMovingValue = turnover.data?.overall_metrics?.optimization_potential?.slow_moving_value || 0;
  
  return {
    immediate_opportunity: deadStockValue,
    medium_term_opportunity: slowMovingValue * 0.5,
    total_opportunity: deadStockValue + (slowMovingValue * 0.5),
    actions: [
      'Liquidate dead stock through clearance sales',
      'Implement dynamic pricing for slow-moving items',
      'Negotiate return agreements with suppliers'
    ]
  };
}

function calculateServiceLevelOpportunity(alerts) {
  const criticalItems = alerts.data?.critical_count || 0;
  const totalAlerts = alerts.data?.total_alerts || 0;
  
  const currentServiceLevel = totalAlerts > 0 ? ((totalAlerts - criticalItems) / totalAlerts) * 100 : 100;
  const targetServiceLevel = 95;
  
  return {
    current_service_level: currentServiceLevel,
    target_service_level: targetServiceLevel,
    improvement_needed: Math.max(0, targetServiceLevel - currentServiceLevel),
    actions: [
      'Implement safety stock calculations',
      'Improve demand forecasting accuracy',
      'Reduce supplier lead time variability'
    ]
  };
}

function calculateCostReductionOpportunity(stock, turnover) {
  const overstockItems = stock.data?.summary?.overstock || 0;
  const averageHoldingCost = 0.25; // 25% annual holding cost
  
  return {
    overstock_reduction: overstockItems * 1000 * averageHoldingCost, // Rough estimate
    obsolescence_prevention: turnover.data?.overall_metrics?.optimization_potential?.dead_stock_value || 0,
    total_savings_potential: 0, // Would calculate based on detailed analysis
    strategies: [
      'Implement economic order quantity (EOQ) models',
      'Negotiate vendor-managed inventory agreements',
      'Improve demand forecasting accuracy'
    ]
  };
}

function optimizeOrdersForBudget(orders, budget) {
  // Sort by urgency and ROI
  const prioritized = [...orders].sort((a, b) => {
    if (a.urgency !== b.urgency) {
      const urgencyOrder = { critical: 0, high: 1, medium: 2 };
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    }
    return b.estimated_cost - a.estimated_cost;
  });
  
  let remainingBudget = budget;
  const optimizedOrders = [];
  
  prioritized.forEach(order => {
    if (remainingBudget >= order.estimated_cost) {
      optimizedOrders.push(order);
      remainingBudget -= order.estimated_cost;
    }
  });
  
  return {
    optimized_orders: optimizedOrders,
    total_cost: budget - remainingBudget,
    items_deferred: orders.length - optimizedOrders.length,
    remaining_budget: remainingBudget
  };
}

function calculateDaysOnHand(stock, movements) {
  const totalValue = stock.data?.summary?.total_value || 0;
  const dailyUsage = movements.data?.summary?.outbound?.value || 0 / 30;
  
  return dailyUsage > 0 ? totalValue / dailyUsage : 999;
}

function calculateStockoutRate(stock) {
  const totalItems = stock.data?.summary?.total_items || 1;
  const outOfStock = stock.data?.summary?.out_of_stock || 0;
  
  return (outOfStock / totalItems) * 100;
}

function calculateCarryingCostPercentage(valuation) {
  // Industry standard carrying cost
  return 25; // 25% annual carrying cost
}

function calculateGMROI(valuation, movements) {
  // Gross Margin Return on Investment
  const inventoryValue = valuation.data?.valuation?.total_value || 1;
  const annualSales = (movements.data?.summary?.outbound?.value || 0) * 12;
  const grossMargin = 0.4; // 40% assumed gross margin
  
  return (annualSales * grossMargin) / inventoryValue;
}

function calculateServiceLevel(stock) {
  const totalItems = stock.data?.summary?.total_items || 1;
  const availableItems = totalItems - (stock.data?.summary?.out_of_stock || 0);
  
  return (availableItems / totalItems) * 100;
}

function calculateObsolescenceRate(turnover) {
  const totalItems = Object.keys(turnover.data?.items || {}).length || 1;
  const deadStock = turnover.data?.overall_metrics?.dead_stock_count || 0;
  
  return (deadStock / totalItems) * 100;
}

function getBenchmarks(type) {
  const industryBenchmarks = {
    inventory_turnover_ratio: { target: 12, priority: 'high' },
    inventory_days_on_hand: { target: 30, priority: 'high' },
    stockout_rate: { target: 2, priority: 'critical' },
    inventory_accuracy: { target: 98, priority: 'medium' },
    carrying_cost_percentage: { target: 20, priority: 'medium' },
    gmroi: { target: 3.0, priority: 'high' },
    service_level: { target: 95, priority: 'critical' },
    obsolescence_rate: { target: 5, priority: 'medium' }
  };
  
  return industryBenchmarks;
}

function generateBestPractices(performance) {
  return [
    'Implement cycle counting program for inventory accuracy',
    'Use ABC analysis for differentiated inventory policies',
    'Establish vendor-managed inventory for A-class items',
    'Deploy demand forecasting with machine learning',
    'Implement automated reorder point calculations'
  ];
}

// MCP Server Integration
async function handleMCPRequest(tool, params) {
  if (!MCP_INVENTORY_TOOLS[tool]) {
    return {
      success: false,
      error: `Unknown tool: ${tool}`,
      available_tools: Object.keys(MCP_INVENTORY_TOOLS)
    };
  }

  try {
    const result = await MCP_INVENTORY_TOOLS[tool].handler(params);
    return result;
  } catch (error) {
    return {
      success: false,
      error: error.message,
      tool: tool,
      params: params
    };
  }
}

// Export for MCP server integration
module.exports = {
  MCP_INVENTORY_TOOLS,
  handleMCPRequest,
  
  // Direct function exports for programmatic use
  tools: {
    getCurrentStock: MCP_INVENTORY_TOOLS['get-current-stock'].handler,
    getInventoryMovements: MCP_INVENTORY_TOOLS['get-inventory-movements'].handler,
    getInventoryTurnover: MCP_INVENTORY_TOOLS['get-inventory-turnover'].handler,
    getInventoryValuation: MCP_INVENTORY_TOOLS['get-inventory-valuation'].handler,
    getLowStockAlerts: MCP_INVENTORY_TOOLS['get-low-stock-alerts'].handler,
    analyzeInventoryHealth: MCP_INVENTORY_TOOLS['analyze-inventory-health'].handler,
    getReorderPlan: MCP_INVENTORY_TOOLS['get-reorder-plan'].handler,
    analyzeInventoryPerformance: MCP_INVENTORY_TOOLS['analyze-inventory-performance'].handler
  }
};

// CLI for testing MCP tools
if (require.main === module) {
  const tool = process.argv[2];
  const paramsJson = process.argv[3];

  if (!tool || !paramsJson) {
    console.log('Usage: node mcp-inventory-tools.js <tool-name> \'{"param": "value"}\'');
    console.log('\nAvailable tools:');
    Object.entries(MCP_INVENTORY_TOOLS).forEach(([name, config]) => {
      console.log(`  ${name}: ${config.description}`);
    });
    process.exit(1);
  }

  try {
    const params = JSON.parse(paramsJson);
    handleMCPRequest(tool, params).then(result => {
      console.log(JSON.stringify(result, null, 2));
    }).catch(error => {
      console.error('Error:', error.message);
    });
  } catch (error) {
    console.error('Invalid JSON parameters:', error.message);
  }
}