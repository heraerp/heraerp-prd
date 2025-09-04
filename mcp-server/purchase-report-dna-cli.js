#!/usr/bin/env node

// ================================================================================
// HERA UNIVERSAL PURCHASE REPORT DNA CLI TOOL
// Command-line interface for Purchase Analytics and Reporting
// Smart Code: HERA.PURCHASE.REPORT.DNA.CLI.v1
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
// PURCHASE REPORT DNA CONFIGURATION
// ================================================================================

const PURCHASE_REPORT_DNA_CONFIG = {
  // Universal DNA Component Definition
  component_id: 'HERA.PURCHASE.REPORT.ENGINE.v1',
  component_name: 'Universal Purchase Report Engine',
  version: '1.0.0',
  
  // Core capabilities
  capabilities: [
    'Real-time Purchase Analytics',
    'Daily/Weekly/Monthly/Yearly Reports',
    'Top Vendors & Supplier Analysis',
    'Purchase Order Tracking',
    'Inventory Impact Analysis',
    'Vendor Performance Metrics',
    'Industry-Specific KPIs',
    'Predictive Purchase Forecasting',
    'MCP Integration for AI Access'
  ],
  
  // Industry configurations
  industries: {
    salon: {
      name: 'Hair Salon & Beauty Services',
      key_metrics: [
        'product_purchases',
        'supply_purchases', 
        'equipment_purchases',
        'average_order_value',
        'vendor_count',
        'payment_terms_compliance',
        'inventory_turnover',
        'purchase_frequency'
      ],
      purchase_categories: {
        'hair_products': { codes: ['5100000'], name: 'Hair Care Products' },
        'color_supplies': { codes: ['5110000'], name: 'Color & Chemical Supplies' },
        'styling_tools': { codes: ['5120000'], name: 'Styling Tools & Equipment' },
        'salon_supplies': { codes: ['5130000'], name: 'General Salon Supplies' },
        'retail_products': { codes: ['5200000'], name: 'Retail Products for Resale' }
      },
      vendor_categories: {
        'product_suppliers': { name: 'Product Suppliers', priority: 'high' },
        'equipment_vendors': { name: 'Equipment Vendors', priority: 'medium' },
        'utility_providers': { name: 'Utility Providers', priority: 'low' },
        'service_providers': { name: 'Service Providers', priority: 'medium' }
      },
      kpi_targets: {
        avg_order_value_target: 500,
        vendor_payment_days: 30,
        inventory_days_target: 45,
        purchase_frequency_days: 14,
        vendor_concentration_max: 40
      },
      smart_codes: {
        daily_purchases: 'HERA.SALON.PURCHASE.DAILY.v1',
        vendor_analysis: 'HERA.SALON.PURCHASE.VENDOR.v1',
        inventory_impact: 'HERA.SALON.PURCHASE.INVENTORY.v1',
        payables_aging: 'HERA.SALON.PURCHASE.PAYABLES.v1'
      }
    },
    
    restaurant: {
      name: 'Restaurant & Food Service',
      key_metrics: [
        'food_purchases',
        'beverage_purchases',
        'supplies_purchases',
        'cost_per_cover',
        'vendor_reliability',
        'freshness_compliance',
        'waste_percentage',
        'emergency_orders'
      ],
      purchase_categories: {
        'fresh_produce': { codes: ['5100000'], name: 'Fresh Produce' },
        'meats_seafood': { codes: ['5110000'], name: 'Meats & Seafood' },
        'dry_goods': { codes: ['5120000'], name: 'Dry Goods & Staples' },
        'beverages': { codes: ['5130000'], name: 'Beverages' },
        'supplies': { codes: ['5140000'], name: 'Kitchen Supplies' }
      },
      vendor_categories: {
        'food_distributors': { name: 'Food Distributors', priority: 'critical' },
        'specialty_suppliers': { name: 'Specialty Suppliers', priority: 'high' },
        'beverage_vendors': { name: 'Beverage Vendors', priority: 'medium' },
        'equipment_maintenance': { name: 'Equipment & Maintenance', priority: 'low' }
      },
      kpi_targets: {
        food_cost_target: 30,
        freshness_days: 3,
        vendor_delivery_accuracy: 95,
        emergency_order_max: 5,
        waste_percentage_max: 3
      },
      smart_codes: {
        daily_purchases: 'HERA.REST.PURCHASE.DAILY.v1',
        food_cost_analysis: 'HERA.REST.PURCHASE.COST.v1',
        vendor_performance: 'HERA.REST.PURCHASE.VENDOR.PERF.v1',
        waste_tracking: 'HERA.REST.PURCHASE.WASTE.v1'
      }
    },
    
    retail: {
      name: 'Retail & E-commerce',
      key_metrics: [
        'merchandise_purchases',
        'seasonal_purchases',
        'vendor_lead_times',
        'purchase_margins',
        'stock_turnover',
        'vendor_terms',
        'quality_returns',
        'purchase_planning_accuracy'
      ],
      purchase_categories: {
        'merchandise': { codes: ['5100000'], name: 'Merchandise for Resale' },
        'seasonal_goods': { codes: ['5110000'], name: 'Seasonal Products' },
        'packaging': { codes: ['5120000'], name: 'Packaging Materials' },
        'marketing_materials': { codes: ['5130000'], name: 'Marketing Materials' }
      },
      vendor_categories: {
        'manufacturers': { name: 'Direct Manufacturers', priority: 'high' },
        'wholesalers': { name: 'Wholesalers', priority: 'high' },
        'dropship_partners': { name: 'Dropship Partners', priority: 'medium' },
        'logistics_providers': { name: 'Logistics Providers', priority: 'medium' }
      },
      kpi_targets: {
        gross_margin_target: 50,
        inventory_turns_target: 6,
        vendor_defect_rate_max: 2,
        lead_time_days: 14,
        payment_terms_days: 45
      },
      smart_codes: {
        purchase_planning: 'HERA.RETAIL.PURCHASE.PLAN.v1',
        vendor_scorecard: 'HERA.RETAIL.PURCHASE.VENDOR.SCORE.v1',
        margin_analysis: 'HERA.RETAIL.PURCHASE.MARGIN.v1'
      }
    }
  }
};

// ================================================================================
// CORE PURCHASE ANALYTICS FUNCTIONS
// ================================================================================

async function getDailyPurchases(organizationId, date = new Date()) {
  try {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Get all purchase transactions for the day
    const { data: transactions, error } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        universal_transaction_lines!inner(*),
        from_entity:core_entities!from_entity_id(entity_name, entity_type),
        to_entity:core_entities!to_entity_id(entity_name, entity_type)
      `)
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'purchase')
      .gte('transaction_date', startOfDay.toISOString())
      .lte('transaction_date', endOfDay.toISOString())
      .order('transaction_date', { ascending: false });

    if (error) {
      throw error;
    }

    // Process purchase data
    const purchaseMetrics = {
      total_amount: 0,
      transaction_count: 0,
      product_purchases: 0,
      supply_purchases: 0,
      equipment_purchases: 0,
      vendor_breakdown: {},
      category_breakdown: {},
      payment_methods: {},
      hourly_purchases: {},
      largest_purchase: 0,
      average_purchase: 0
    };

    if (transactions && transactions.length > 0) {
      transactions.forEach(txn => {
        purchaseMetrics.total_amount += txn.total_amount || 0;
        purchaseMetrics.transaction_count++;
        
        if (txn.total_amount > purchaseMetrics.largest_purchase) {
          purchaseMetrics.largest_purchase = txn.total_amount;
        }

        // Vendor breakdown
        const vendorName = txn.to_entity?.entity_name || 'Unknown Vendor';
        if (!purchaseMetrics.vendor_breakdown[vendorName]) {
          purchaseMetrics.vendor_breakdown[vendorName] = {
            amount: 0,
            orders: 0,
            average_order: 0
          };
        }
        purchaseMetrics.vendor_breakdown[vendorName].amount += txn.total_amount || 0;
        purchaseMetrics.vendor_breakdown[vendorName].orders++;

        // Hourly breakdown
        const hour = new Date(txn.transaction_date).getHours();
        if (!purchaseMetrics.hourly_purchases[hour]) {
          purchaseMetrics.hourly_purchases[hour] = 0;
        }
        purchaseMetrics.hourly_purchases[hour] += txn.total_amount || 0;

        // Category breakdown from line items
        if (txn.universal_transaction_lines) {
          txn.universal_transaction_lines.forEach(line => {
            const category = line.metadata?.category || 'Uncategorized';
            if (!purchaseMetrics.category_breakdown[category]) {
              purchaseMetrics.category_breakdown[category] = {
                amount: 0,
                quantity: 0,
                items: 0
              };
            }
            purchaseMetrics.category_breakdown[category].amount += line.line_amount || 0;
            purchaseMetrics.category_breakdown[category].quantity += line.quantity || 0;
            purchaseMetrics.category_breakdown[category].items++;
          });
        }

        // Payment method tracking
        const paymentMethod = txn.metadata?.payment_method || 'Unknown';
        if (!purchaseMetrics.payment_methods[paymentMethod]) {
          purchaseMetrics.payment_methods[paymentMethod] = 0;
        }
        purchaseMetrics.payment_methods[paymentMethod] += txn.total_amount || 0;
      });

      // Calculate averages
      purchaseMetrics.average_purchase = purchaseMetrics.total_amount / purchaseMetrics.transaction_count;
      
      // Calculate vendor averages
      Object.keys(purchaseMetrics.vendor_breakdown).forEach(vendor => {
        const vendorData = purchaseMetrics.vendor_breakdown[vendor];
        vendorData.average_order = vendorData.amount / vendorData.orders;
      });
    }

    return createMCPResponse({
      success: true,
      component: 'HERA.PURCHASE.DAILY.REPORT.v1',
      timestamp: new Date().toISOString(),
      organization_id: organizationId,
      data: {
        date: date.toISOString().split('T')[0],
        transactions_found: transactions?.length || 0,
        ...purchaseMetrics
      }
    });

  } catch (error) {
    return createMCPResponse({
      success: false,
      error: error.message,
      component: 'HERA.PURCHASE.DAILY.REPORT.v1'
    });
  }
}

async function getTopVendors(organizationId, options = {}) {
  try {
    const {
      startDate = new Date(new Date().setDate(new Date().getDate() - 30)),
      endDate = new Date(),
      limit = 10
    } = options;

    // Get all vendors
    const { data: vendors, error: vendorError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'vendor')
      .order('entity_name');

    if (vendorError) throw vendorError;

    // Get purchase transactions
    const { data: transactions, error: txnError } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        universal_transaction_lines!inner(*),
        to_entity:core_entities!to_entity_id(entity_name, entity_type, entity_code)
      `)
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'purchase')
      .gte('transaction_date', startDate.toISOString())
      .lte('transaction_date', endDate.toISOString());

    if (txnError) throw txnError;

    // Aggregate vendor metrics
    const vendorMetrics = {};
    
    transactions?.forEach(txn => {
      const vendorId = txn.to_entity_id;
      const vendorName = txn.to_entity?.entity_name || 'Unknown';
      
      if (!vendorMetrics[vendorId]) {
        vendorMetrics[vendorId] = {
          vendor_id: vendorId,
          vendor_name: vendorName,
          vendor_code: txn.to_entity?.entity_code,
          total_amount: 0,
          order_count: 0,
          average_order_value: 0,
          last_order_date: null,
          payment_terms: txn.metadata?.payment_terms || 'NET30',
          categories_supplied: new Set(),
          reliability_score: 100
        };
      }
      
      vendorMetrics[vendorId].total_amount += txn.total_amount || 0;
      vendorMetrics[vendorId].order_count++;
      
      if (!vendorMetrics[vendorId].last_order_date || 
          new Date(txn.transaction_date) > new Date(vendorMetrics[vendorId].last_order_date)) {
        vendorMetrics[vendorId].last_order_date = txn.transaction_date;
      }
      
      // Track categories from line items
      txn.universal_transaction_lines?.forEach(line => {
        if (line.metadata?.category) {
          vendorMetrics[vendorId].categories_supplied.add(line.metadata.category);
        }
      });
    });

    // Calculate metrics and convert to array
    const topVendors = Object.values(vendorMetrics)
      .map(vendor => {
        vendor.average_order_value = vendor.order_count > 0 
          ? vendor.total_amount / vendor.order_count 
          : 0;
        vendor.categories_supplied = Array.from(vendor.categories_supplied);
        vendor.spend_percentage = 0; // Will calculate after total
        return vendor;
      })
      .sort((a, b) => b.total_amount - a.total_amount)
      .slice(0, limit);

    // Calculate total spend and percentages
    const totalSpend = topVendors.reduce((sum, v) => sum + v.total_amount, 0);
    topVendors.forEach(vendor => {
      vendor.spend_percentage = totalSpend > 0 ? (vendor.total_amount / totalSpend) * 100 : 0;
    });

    // Vendor concentration analysis
    const topVendorSpend = topVendors.slice(0, 3).reduce((sum, v) => sum + v.total_amount, 0);
    const concentration = totalSpend > 0 ? (topVendorSpend / totalSpend) * 100 : 0;

    return createMCPResponse({
      success: true,
      component: 'HERA.PURCHASE.VENDOR.ANALYSIS.v1',
      timestamp: new Date().toISOString(),
      organization_id: organizationId,
      data: {
        period: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        top_vendors: topVendors,
        totals: {
          total_vendors: Object.keys(vendorMetrics).length,
          total_spend: totalSpend,
          average_vendor_spend: totalSpend / Object.keys(vendorMetrics).length
        },
        analysis: {
          vendor_concentration: concentration,
          concentration_risk: concentration > 60 ? 'high' : concentration > 40 ? 'medium' : 'low',
          recommendations: generateVendorRecommendations(topVendors, concentration)
        }
      }
    });

  } catch (error) {
    return createMCPResponse({
      success: false,
      error: error.message,
      component: 'HERA.PURCHASE.VENDOR.ANALYSIS.v1'
    });
  }
}

async function getPurchaseMetrics(organizationId, options = {}) {
  try {
    const {
      startDate = new Date(new Date().setDate(new Date().getDate() - 30)),
      endDate = new Date()
    } = options;

    // Get purchase transactions
    const { data: purchases, error: purchaseError } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        universal_transaction_lines!inner(*),
        to_entity:core_entities!to_entity_id(entity_name, entity_type)
      `)
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'purchase')
      .gte('transaction_date', startDate.toISOString())
      .lte('transaction_date', endDate.toISOString());

    if (purchaseError) throw purchaseError;

    // Get payables data
    const { data: payables, error: payablesError } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'payment')
      .eq('metadata->>payment_type', 'vendor_payment')
      .gte('transaction_date', startDate.toISOString())
      .lte('transaction_date', endDate.toISOString());

    if (payablesError) throw payablesError;

    // Calculate metrics
    const metrics = {
      total_purchases: 0,
      purchase_count: 0,
      average_purchase_value: 0,
      payment_metrics: {
        total_paid: 0,
        payment_count: 0,
        average_payment_days: 0,
        on_time_payments: 0,
        late_payments: 0
      },
      category_analysis: {},
      purchase_frequency: {
        daily_average: 0,
        weekly_pattern: {},
        peak_day: null
      },
      vendor_metrics: {
        active_vendors: new Set(),
        new_vendors: 0,
        vendor_retention: 0
      }
    };

    // Process purchases
    purchases?.forEach(purchase => {
      metrics.total_purchases += purchase.total_amount || 0;
      metrics.purchase_count++;
      metrics.vendor_metrics.active_vendors.add(purchase.to_entity_id);

      // Category analysis
      purchase.universal_transaction_lines?.forEach(line => {
        const category = line.metadata?.category || 'Uncategorized';
        if (!metrics.category_analysis[category]) {
          metrics.category_analysis[category] = {
            amount: 0,
            count: 0,
            percentage: 0
          };
        }
        metrics.category_analysis[category].amount += line.line_amount || 0;
        metrics.category_analysis[category].count++;
      });

      // Day of week pattern
      const dayOfWeek = new Date(purchase.transaction_date).toLocaleDateString('en-US', { weekday: 'long' });
      if (!metrics.purchase_frequency.weekly_pattern[dayOfWeek]) {
        metrics.purchase_frequency.weekly_pattern[dayOfWeek] = 0;
      }
      metrics.purchase_frequency.weekly_pattern[dayOfWeek]++;
    });

    // Calculate averages and percentages
    if (metrics.purchase_count > 0) {
      metrics.average_purchase_value = metrics.total_purchases / metrics.purchase_count;
      
      // Category percentages
      Object.keys(metrics.category_analysis).forEach(category => {
        metrics.category_analysis[category].percentage = 
          (metrics.category_analysis[category].amount / metrics.total_purchases) * 100;
      });

      // Find peak day
      const peakDay = Object.entries(metrics.purchase_frequency.weekly_pattern)
        .sort(([,a], [,b]) => b - a)[0];
      if (peakDay) {
        metrics.purchase_frequency.peak_day = peakDay[0];
      }

      // Daily average
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
      metrics.purchase_frequency.daily_average = metrics.purchase_count / daysDiff;
    }

    // Process payments
    payables?.forEach(payment => {
      metrics.payment_metrics.total_paid += payment.total_amount || 0;
      metrics.payment_metrics.payment_count++;
    });

    // Vendor metrics
    metrics.vendor_metrics.active_vendors = metrics.vendor_metrics.active_vendors.size;

    return createMCPResponse({
      success: true,
      component: 'HERA.PURCHASE.METRICS.ANALYSIS.v1',
      timestamp: new Date().toISOString(),
      organization_id: organizationId,
      data: {
        period: {
          start: startDate.toISOString().split('T')[0],
          end: endDate.toISOString().split('T')[0]
        },
        ...metrics,
        insights: generatePurchaseInsights(metrics)
      }
    });

  } catch (error) {
    return createMCPResponse({
      success: false,
      error: error.message,
      component: 'HERA.PURCHASE.METRICS.ANALYSIS.v1'
    });
  }
}

async function getPurchaseTrends(organizationId, options = {}) {
  try {
    const {
      period = 'daily',
      lookback = 30
    } = options;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - lookback);

    // Get historical purchase data
    const { data: purchases, error } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'purchase')
      .gte('transaction_date', startDate.toISOString())
      .lte('transaction_date', endDate.toISOString())
      .order('transaction_date');

    if (error) throw error;

    // Aggregate by period
    const trendData = [];
    const periodData = {};

    purchases?.forEach(purchase => {
      const date = new Date(purchase.transaction_date);
      let periodKey;
      
      switch (period) {
        case 'daily':
          periodKey = date.toISOString().split('T')[0];
          break;
        case 'weekly':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
      }

      if (!periodData[periodKey]) {
        periodData[periodKey] = {
          period: periodKey,
          amount: 0,
          count: 0,
          vendors: new Set()
        };
      }

      periodData[periodKey].amount += purchase.total_amount || 0;
      periodData[periodKey].count++;
      periodData[periodKey].vendors.add(purchase.to_entity_id);
    });

    // Convert to array and calculate metrics
    Object.entries(periodData).forEach(([period, data]) => {
      trendData.push({
        period,
        amount: data.amount,
        count: data.count,
        vendor_count: data.vendors.size,
        average_purchase: data.count > 0 ? data.amount / data.count : 0
      });
    });

    trendData.sort((a, b) => a.period.localeCompare(b.period));

    // Calculate trend analysis
    const amounts = trendData.map(d => d.amount);
    const avgAmount = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
    const recentAvg = amounts.slice(-5).reduce((sum, a) => sum + a, 0) / 5;
    const trend = recentAvg > avgAmount * 1.1 ? 'upward' : recentAvg < avgAmount * 0.9 ? 'downward' : 'stable';

    // Generate forecast
    const forecast = generatePurchaseForecast(trendData, period);

    return createMCPResponse({
      success: true,
      component: 'HERA.PURCHASE.TRENDS.ANALYSIS.v1',
      timestamp: new Date().toISOString(),
      organization_id: organizationId,
      data: {
        period_type: period,
        lookback_days: lookback,
        trend_data: trendData,
        analysis: {
          trend_direction: trend,
          average_amount: avgAmount,
          peak_amount: Math.max(...amounts),
          low_amount: Math.min(...amounts),
          volatility: calculateVolatility(amounts),
          seasonality: detectSeasonality(trendData)
        },
        forecast,
        recommendations: generateTrendRecommendations(trend, trendData)
      }
    });

  } catch (error) {
    return createMCPResponse({
      success: false,
      error: error.message,
      component: 'HERA.PURCHASE.TRENDS.ANALYSIS.v1'
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

function generateVendorRecommendations(vendors, concentration) {
  const recommendations = [];
  
  if (concentration > 60) {
    recommendations.push('High vendor concentration risk - consider diversifying suppliers');
  }
  
  if (vendors.length < 3) {
    recommendations.push('Limited vendor base - explore additional suppliers for better pricing');
  }
  
  const inactiveVendors = vendors.filter(v => {
    const lastOrder = new Date(v.last_order_date);
    const daysSinceOrder = (new Date() - lastOrder) / (1000 * 60 * 60 * 24);
    return daysSinceOrder > 60;
  });
  
  if (inactiveVendors.length > 0) {
    recommendations.push(`${inactiveVendors.length} vendors inactive for 60+ days - review relationships`);
  }
  
  return recommendations;
}

function generatePurchaseInsights(metrics) {
  const insights = [];
  
  if (metrics.average_purchase_value > 1000) {
    insights.push('High average purchase value - ensure approval workflows are followed');
  }
  
  if (metrics.purchase_frequency.daily_average > 5) {
    insights.push('High purchase frequency - consider bulk ordering to reduce transaction costs');
  }
  
  if (metrics.vendor_metrics.active_vendors < 3) {
    insights.push('Low vendor diversity - risk of supply chain disruption');
  }
  
  const topCategory = Object.entries(metrics.category_analysis)
    .sort(([,a], [,b]) => b.amount - a.amount)[0];
  
  if (topCategory) {
    insights.push(`Highest spend category: ${topCategory[0]} (${topCategory[1].percentage.toFixed(1)}%)`);
  }
  
  return insights;
}

function generatePurchaseForecast(trendData, period) {
  if (trendData.length < 3) return [];
  
  const recentData = trendData.slice(-7);
  const avgAmount = recentData.reduce((sum, d) => sum + d.amount, 0) / recentData.length;
  const trend = recentData[recentData.length - 1].amount > recentData[0].amount ? 1.05 : 0.95;
  
  const forecast = [];
  for (let i = 1; i <= 3; i++) {
    const forecastAmount = avgAmount * Math.pow(trend, i);
    const forecastDate = new Date();
    
    switch (period) {
      case 'daily':
        forecastDate.setDate(forecastDate.getDate() + i);
        break;
      case 'weekly':
        forecastDate.setDate(forecastDate.getDate() + (i * 7));
        break;
      case 'monthly':
        forecastDate.setMonth(forecastDate.getMonth() + i);
        break;
    }
    
    forecast.push({
      date: forecastDate.toISOString().split('T')[0],
      predicted_amount: forecastAmount,
      confidence_interval: forecastAmount * 0.2
    });
  }
  
  return forecast;
}

function calculateVolatility(amounts) {
  if (amounts.length < 2) return 0;
  
  const avg = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
  const variance = amounts.reduce((sum, a) => sum + Math.pow(a - avg, 2), 0) / amounts.length;
  const stdDev = Math.sqrt(variance);
  
  return (stdDev / avg) * 100;
}

function detectSeasonality(trendData) {
  // Simple seasonality detection
  if (trendData.length < 7) return null;
  
  const dayTotals = {};
  trendData.forEach(data => {
    const date = new Date(data.period);
    const dayOfWeek = date.getDay();
    if (!dayTotals[dayOfWeek]) {
      dayTotals[dayOfWeek] = { total: 0, count: 0 };
    }
    dayTotals[dayOfWeek].total += data.amount;
    dayTotals[dayOfWeek].count++;
  });
  
  const dayAverages = Object.entries(dayTotals).map(([day, data]) => ({
    day: parseInt(day),
    average: data.total / data.count
  })).sort((a, b) => b.average - a.average);
  
  return {
    peak_day: dayAverages[0].day,
    low_day: dayAverages[dayAverages.length - 1].day,
    variation: ((dayAverages[0].average - dayAverages[dayAverages.length - 1].average) / dayAverages[0].average) * 100
  };
}

function generateTrendRecommendations(trend, trendData) {
  const recommendations = [];
  
  if (trend === 'upward') {
    recommendations.push('Purchase spending increasing - review budget allocations');
    recommendations.push('Negotiate volume discounts with top vendors');
  } else if (trend === 'downward') {
    recommendations.push('Purchase spending decreasing - verify inventory levels are adequate');
    recommendations.push('Check for any supply chain disruptions');
  }
  
  const volatility = calculateVolatility(trendData.map(d => d.amount));
  if (volatility > 30) {
    recommendations.push('High purchase volatility - implement better demand planning');
  }
  
  return recommendations;
}

// ================================================================================
// CLI INTERFACE
// ================================================================================

async function showHelp() {
  console.log(`
🧬 HERA UNIVERSAL PURCHASE REPORT DNA CLI TOOL
==============================================

Advanced purchase analytics and vendor management for any business type.

USAGE:
  node purchase-report-dna-cli.js <command> [options]

COMMANDS:
  daily [date]           Get daily purchase report
                        Date format: YYYY-MM-DD (default: today)

  weekly                 Get weekly purchase summary
    --weeks <n>          Number of weeks to analyze (default: 4)

  monthly               Get monthly purchase analysis
    --months <n>         Number of months (default: 3)

  vendors               Analyze top vendors and supplier metrics
    --limit <n>          Number of vendors to show (default: 10)
    --days <n>           Days to analyze (default: 30)

  metrics               Get comprehensive purchase metrics
    --start <date>       Start date (YYYY-MM-DD)
    --end <date>         End date (YYYY-MM-DD)

  trends                Analyze purchase trends and forecast
    --period <type>      daily|weekly|monthly (default: daily)
    --lookback <days>    Days to analyze (default: 30)

  payables              Analyze accounts payable and payment performance
    --aging              Show aging buckets

  inventory-impact      Show how purchases affect inventory levels

  hair-talkz            Run complete analysis for Hair Talkz orgs

  help                  Show this help message

EXAMPLES:
  node purchase-report-dna-cli.js daily
  node purchase-report-dna-cli.js vendors --limit 5 --days 60
  node purchase-report-dna-cli.js trends --period weekly --lookback 90
  node purchase-report-dna-cli.js hair-talkz

ENVIRONMENT VARIABLES:
  DEFAULT_ORGANIZATION_ID   Your organization UUID
  SUPABASE_URL             Your Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY Your Supabase service role key

SMART CODE: HERA.PURCHASE.REPORT.DNA.CLI.v1

🔧 MCP Integration Ready - Use with salon-manager for AI insights
`);
}

// ================================================================================
// MAIN EXECUTION
// ================================================================================

async function main() {
  console.log('🧬 HERA Universal Purchase Report DNA CLI Tool\n');

  if (!organizationId && command !== 'help' && command !== 'hair-talkz') {
    console.error('❌ DEFAULT_ORGANIZATION_ID not set in environment');
    console.log('   Set it in your .env file or use --org flag');
    return;
  }

  switch (command) {
    case 'daily':
      const date = process.argv[3] ? new Date(process.argv[3]) : new Date();
      const dailyResult = await getDailyPurchases(organizationId, date);
      console.log(JSON.stringify(dailyResult, null, 2));
      break;

    case 'vendors':
      const vendorLimit = parseInt(process.argv[process.argv.indexOf('--limit') + 1] || '10');
      const vendorDays = parseInt(process.argv[process.argv.indexOf('--days') + 1] || '30');
      const vendorResult = await getTopVendors(organizationId, {
        limit: vendorLimit,
        startDate: new Date(new Date().setDate(new Date().getDate() - vendorDays))
      });
      console.log(JSON.stringify(vendorResult, null, 2));
      break;

    case 'metrics':
      const metricsResult = await getPurchaseMetrics(organizationId);
      console.log(JSON.stringify(metricsResult, null, 2));
      break;

    case 'trends':
      const trendPeriod = process.argv[process.argv.indexOf('--period') + 1] || 'daily';
      const trendLookback = parseInt(process.argv[process.argv.indexOf('--lookback') + 1] || '30');
      const trendsResult = await getPurchaseTrends(organizationId, {
        period: trendPeriod,
        lookback: trendLookback
      });
      console.log(JSON.stringify(trendsResult, null, 2));
      break;

    case 'hair-talkz':
      console.log('💇‍♀️ Running Purchase Analysis for Hair Talkz Organizations...\n');
      for (const org of HAIR_TALKZ_ORGS) {
        console.log(`\n📊 ${org.name}`);
        console.log('─'.repeat(60));
        
        const dailyPurchases = await getDailyPurchases(org.id);
        if (dailyPurchases.success && dailyPurchases.data.transactions_found > 0) {
          console.log(`✅ Daily Purchases: ${dailyPurchases.data.total_amount.toFixed(2)} AED`);
          console.log(`   Transactions: ${dailyPurchases.data.transaction_count}`);
          console.log(`   Vendors: ${Object.keys(dailyPurchases.data.vendor_breakdown).length}`);
        } else {
          console.log(`⚠️  No purchase activity today`);
        }
        
        const vendors = await getTopVendors(org.id, { limit: 3, days: 30 });
        if (vendors.success && vendors.data.top_vendors.length > 0) {
          console.log(`\n🏢 Top Vendors (30 days):`);
          vendors.data.top_vendors.forEach((v, i) => {
            console.log(`   ${i+1}. ${v.vendor_name}: ${v.total_amount.toFixed(2)} AED (${v.spend_percentage.toFixed(1)}%)`);
          });
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
  getDailyPurchases,
  getTopVendors,
  getPurchaseMetrics,
  getPurchaseTrends,
  PURCHASE_REPORT_DNA_CONFIG,
  HAIR_TALKZ_ORGS
};