#!/usr/bin/env node

/**
 * HERA MCP Sales Tools Integration
 * Exposes Sales Report DNA functions as MCP tools for AI access
 * Smart Code: HERA.MCP.SALES.TOOLS.v1
 */

const {
  getDailySales,
  getTopProducts,
  getCustomerMetrics,
  getSalesTrends
} = require('./sales-report-dna-cli');

// MCP Tool Definitions
const MCP_SALES_TOOLS = {
  'get-daily-sales': {
    description: 'Get daily sales report with revenue, transactions, and hourly breakdown',
    parameters: {
      organization_id: { type: 'string', required: true },
      date: { type: 'string', format: 'YYYY-MM-DD', required: false }
    },
    handler: async (params) => {
      const date = params.date ? new Date(params.date) : new Date();
      return await getDailySales(params.organization_id, date);
    }
  },

  'get-top-products': {
    description: 'Get top selling products and services with revenue and units sold',
    parameters: {
      organization_id: { type: 'string', required: true },
      start_date: { type: 'string', format: 'YYYY-MM-DD', required: false },
      end_date: { type: 'string', format: 'YYYY-MM-DD', required: false },
      limit: { type: 'number', default: 10, required: false }
    },
    handler: async (params) => {
      return await getTopProducts(params.organization_id, {
        startDate: params.start_date,
        endDate: params.end_date,
        limit: params.limit || 10
      });
    }
  },

  'get-customer-metrics': {
    description: 'Analyze customer behavior, segments, and lifetime value',
    parameters: {
      organization_id: { type: 'string', required: true },
      start_date: { type: 'string', format: 'YYYY-MM-DD', required: false },
      end_date: { type: 'string', format: 'YYYY-MM-DD', required: false }
    },
    handler: async (params) => {
      return await getCustomerMetrics(params.organization_id, {
        startDate: params.start_date,
        endDate: params.end_date
      });
    }
  },

  'get-sales-trends': {
    description: 'Get sales trends with growth analysis and forecasting',
    parameters: {
      organization_id: { type: 'string', required: true },
      period: { type: 'string', enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
      lookback: { type: 'number', default: 30, required: false }
    },
    handler: async (params) => {
      return await getSalesTrends(params.organization_id, {
        period: params.period || 'daily',
        lookback: params.lookback || 30
      });
    }
  },

  'analyze-sales-performance': {
    description: 'Get comprehensive sales performance analysis with KPIs',
    parameters: {
      organization_id: { type: 'string', required: true },
      analysis_type: { 
        type: 'string', 
        enum: ['summary', 'detailed', 'comparative'], 
        default: 'summary' 
      }
    },
    handler: async (params) => {
      // Comprehensive analysis combining multiple reports
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const [dailySales, topProducts, customerMetrics, salesTrends] = await Promise.all([
        getDailySales(params.organization_id, today),
        getTopProducts(params.organization_id, { limit: 5 }),
        getCustomerMetrics(params.organization_id),
        getSalesTrends(params.organization_id, { period: 'daily', lookback: 30 })
      ]);

      // Combine insights
      const analysis = {
        success: true,
        component: 'HERA.SALES.PERFORMANCE.ANALYSIS.v1',
        timestamp: new Date().toISOString(),
        organization_id: params.organization_id,
        analysis_type: params.analysis_type,
        insights: {
          current_performance: {
            today_revenue: dailySales.data?.total_revenue || 0,
            today_transactions: dailySales.data?.transaction_count || 0,
            average_ticket: dailySales.data?.average_transaction || 0,
            service_mix: dailySales.data?.service_percentage || 0
          },
          product_insights: {
            top_revenue_generator: topProducts.data?.top_products?.[0]?.product_name || 'N/A',
            product_diversity: topProducts.data?.totals?.total_products || 0,
            pareto_efficiency: topProducts.data?.analysis?.pareto_80_20 || null
          },
          customer_insights: {
            total_customers: customerMetrics.data?.customer_count || 0,
            repeat_rate: customerMetrics.data?.repeat_rate || 0,
            average_customer_value: customerMetrics.data?.average_customer_value || 0,
            vip_customers: customerMetrics.data?.customer_segments?.vip || 0
          },
          trend_insights: {
            trend_direction: salesTrends.data?.analysis?.trend_direction || 'unknown',
            average_daily_revenue: salesTrends.data?.analysis?.average_revenue || 0,
            peak_revenue: salesTrends.data?.analysis?.peak_revenue || 0,
            seasonality: salesTrends.data?.analysis?.seasonality || null
          },
          recommendations: generateRecommendations(dailySales, topProducts, customerMetrics, salesTrends)
        }
      };

      return analysis;
    }
  },

  'get-staff-performance': {
    description: 'Analyze individual staff sales performance and productivity',
    parameters: {
      organization_id: { type: 'string', required: true },
      staff_id: { type: 'string', required: false },
      period_days: { type: 'number', default: 30, required: false }
    },
    handler: async (params) => {
      // This would need to be implemented with staff-specific queries
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - (params.period_days || 30));

      const dailySales = await getDailySales(params.organization_id, endDate);
      
      return {
        success: true,
        component: 'HERA.SALES.STAFF.PERFORMANCE.v1',
        timestamp: new Date().toISOString(),
        organization_id: params.organization_id,
        period: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        staff_performance: dailySales.data?.staff_performance || {},
        summary: {
          total_staff: Object.keys(dailySales.data?.staff_performance || {}).length,
          message: 'Detailed staff performance requires additional implementation'
        }
      };
    }
  }
};

// Helper function to generate AI-friendly recommendations
function generateRecommendations(dailySales, topProducts, customerMetrics, salesTrends) {
  const recommendations = [];

  // Revenue recommendations
  if (dailySales.data?.service_percentage < 70) {
    recommendations.push({
      category: 'revenue_mix',
      priority: 'high',
      recommendation: 'Service revenue is below 70%. Focus on promoting high-margin services.',
      impact: 'Could increase overall margins by 5-10%'
    });
  }

  // Customer recommendations
  if (customerMetrics.data?.repeat_rate < 50) {
    recommendations.push({
      category: 'customer_retention',
      priority: 'high',
      recommendation: 'Repeat customer rate is low. Implement loyalty program or follow-up campaigns.',
      impact: 'Increasing repeat rate by 10% could add 15% to revenue'
    });
  }

  // Trend recommendations
  if (salesTrends.data?.analysis?.trend_direction === 'downward') {
    recommendations.push({
      category: 'sales_trend',
      priority: 'critical',
      recommendation: 'Sales showing downward trend. Review pricing, promotions, and market conditions.',
      impact: 'Reversing trend could prevent 20% revenue loss'
    });
  }

  // Product recommendations
  if (topProducts.data?.analysis?.pareto_80_20?.percentage_of_products > 30) {
    recommendations.push({
      category: 'product_optimization',
      priority: 'medium',
      recommendation: 'Product portfolio is inefficient. Consider focusing on top performers.',
      impact: 'Could reduce inventory costs by 25%'
    });
  }

  return recommendations;
}

// MCP Server Integration
async function handleMCPRequest(tool, params) {
  if (!MCP_SALES_TOOLS[tool]) {
    return {
      success: false,
      error: `Unknown tool: ${tool}`,
      available_tools: Object.keys(MCP_SALES_TOOLS)
    };
  }

  try {
    const result = await MCP_SALES_TOOLS[tool].handler(params);
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
  MCP_SALES_TOOLS,
  handleMCPRequest,
  
  // Direct function exports for programmatic use
  tools: {
    getDailySales: MCP_SALES_TOOLS['get-daily-sales'].handler,
    getTopProducts: MCP_SALES_TOOLS['get-top-products'].handler,
    getCustomerMetrics: MCP_SALES_TOOLS['get-customer-metrics'].handler,
    getSalesTrends: MCP_SALES_TOOLS['get-sales-trends'].handler,
    analyzeSalesPerformance: MCP_SALES_TOOLS['analyze-sales-performance'].handler,
    getStaffPerformance: MCP_SALES_TOOLS['get-staff-performance'].handler
  }
};

// CLI for testing MCP tools
if (require.main === module) {
  const tool = process.argv[2];
  const paramsJson = process.argv[3];

  if (!tool || !paramsJson) {
    console.log('Usage: node mcp-sales-tools.js <tool-name> \'{"param": "value"}\'');
    console.log('\nAvailable tools:');
    Object.entries(MCP_SALES_TOOLS).forEach(([name, config]) => {
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