#!/usr/bin/env node

// ================================================================================
// HERA UNIVERSAL SALES REPORT DNA CLI TOOL
// Command-line interface for Sales Analytics and Reporting
// Smart Code: HERA.SALES.REPORT.DNA.CLI.v1
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
// SALES REPORT DNA CONFIGURATION
// ================================================================================

const SALES_REPORT_DNA_CONFIG = {
  // Universal DNA Component Definition
  component_id: 'HERA.SALES.REPORT.ENGINE.v1',
  component_name: 'Universal Sales Report Engine',
  version: '1.0.0',
  
  // Core capabilities
  capabilities: [
    'Real-time Sales Analytics',
    'Daily/Weekly/Monthly/Yearly Reports',
    'Top Products & Services Analysis',
    'Customer Behavior Analytics',
    'Staff Performance Tracking',
    'Industry-Specific KPIs',
    'Predictive Sales Forecasting',
    'MCP Integration for AI Access'
  ],
  
  // Industry configurations
  industries: {
    salon: {
      name: 'Hair Salon & Beauty Services',
      key_metrics: [
        'service_revenue',
        'product_revenue', 
        'average_ticket',
        'services_per_visit',
        'retail_attachment_rate',
        'repeat_visit_rate',
        'stylist_utilization',
        'chair_productivity'
      ],
      service_categories: {
        'hair_cutting': { codes: ['4100000'], name: 'Hair Cutting' },
        'hair_coloring': { codes: ['4110000'], name: 'Hair Coloring' },
        'treatments': { codes: ['4120000'], name: 'Hair Treatments' },
        'styling': { codes: ['4130000'], name: 'Styling Services' },
        'special_occasion': { codes: ['4140000'], name: 'Special Occasion' }
      },
      product_categories: {
        'hair_care': { codes: ['4200000'], name: 'Hair Care Products' },
        'styling_tools': { codes: ['4210000'], name: 'Styling Tools' }
      },
      kpi_targets: {
        avg_ticket_target: 150,
        retail_attachment_target: 30,
        repeat_visit_days: 45,
        utilization_target: 75,
        service_mix_target: { cutting: 40, coloring: 30, treatments: 20, other: 10 }
      },
      smart_codes: {
        daily_sales: 'HERA.SALON.SALES.DAILY.v1',
        service_analysis: 'HERA.SALON.SALES.SERVICE.v1',
        product_analysis: 'HERA.SALON.SALES.PRODUCT.v1',
        staff_performance: 'HERA.SALON.SALES.STAFF.v1'
      }
    },
    
    restaurant: {
      name: 'Restaurant & Food Service',
      key_metrics: [
        'food_revenue',
        'beverage_revenue',
        'average_check',
        'table_turnover',
        'items_per_order',
        'peak_hour_sales',
        'server_efficiency',
        'kitchen_throughput'
      ],
      service_categories: {
        'dine_in': { codes: ['4100000'], name: 'Dine-in Sales' },
        'takeout': { codes: ['4200000'], name: 'Takeout Orders' },
        'delivery': { codes: ['4300000'], name: 'Delivery Sales' },
        'catering': { codes: ['4400000'], name: 'Catering Services' }
      },
      kpi_targets: {
        avg_check_target: 85,
        table_turns_target: 2.5,
        beverage_attach_target: 70,
        peak_efficiency_target: 90
      }
    },
    
    retail: {
      name: 'Retail & E-commerce',
      key_metrics: [
        'sales_revenue',
        'units_sold',
        'basket_size',
        'conversion_rate',
        'average_item_value',
        'inventory_turnover',
        'cross_sell_rate',
        'customer_lifetime_value'
      ],
      kpi_targets: {
        avg_basket_target: 120,
        conversion_target: 3.5,
        cross_sell_target: 25,
        inventory_turns_target: 6
      }
    },
    
    universal: {
      name: 'Universal Business Template',
      key_metrics: [
        'total_revenue',
        'transaction_count',
        'average_transaction',
        'customer_count',
        'repeat_rate',
        'growth_rate'
      ],
      kpi_targets: {
        growth_target: 15,
        repeat_rate_target: 60
      }
    }
  }
};

// ================================================================================
// MCP-COMPATIBLE DATA STRUCTURES
// ================================================================================

// This structure is designed to be easily consumed by MCP tools
function createMCPResponse(data, metadata = {}) {
  return {
    success: true,
    component: 'HERA.SALES.REPORT.DNA',
    timestamp: new Date().toISOString(),
    organization_id: metadata.organization_id,
    period: metadata.period,
    data: data,
    smart_code: metadata.smart_code || 'HERA.SALES.REPORT.RESPONSE.v1'
  };
}

// ================================================================================
// MAIN SALES ANALYSIS FUNCTIONS
// ================================================================================

async function getDailySales(organizationId, date = new Date()) {
  const startDate = date.toISOString().split('T')[0];
  const endDate = startDate;
  
  try {
    // Get all sales transactions for the day
    const { data: transactions, error } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        universal_transaction_lines!inner(*),
        from_entity:core_entities!from_entity_id(entity_name, entity_type),
        to_entity:core_entities!to_entity_id(entity_name, entity_type)
      `)
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'sale')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('transaction_date', { ascending: false });

    if (error) throw error;

    // Calculate daily metrics
    const metrics = {
      total_revenue: 0,
      transaction_count: transactions?.length || 0,
      unique_customers: new Set(),
      service_revenue: 0,
      product_revenue: 0,
      items_sold: 0,
      hourly_sales: {},
      payment_methods: {},
      staff_sales: {}
    };

    // Process each transaction
    transactions?.forEach(txn => {
      metrics.total_revenue += parseFloat(txn.total_amount || 0);
      
      if (txn.from_entity_id) {
        metrics.unique_customers.add(txn.from_entity_id);
      }

      // Process line items
      txn.universal_transaction_lines?.forEach(line => {
        metrics.items_sold += line.quantity || 1;
        
        // Categorize by type (would need entity lookup for accurate categorization)
        if (line.metadata?.item_type === 'service') {
          metrics.service_revenue += parseFloat(line.line_amount || 0);
        } else {
          metrics.product_revenue += parseFloat(line.line_amount || 0);
        }

        // Staff attribution
        if (line.metadata?.staff_id) {
          if (!metrics.staff_sales[line.metadata.staff_id]) {
            metrics.staff_sales[line.metadata.staff_id] = {
              revenue: 0,
              transactions: 0,
              items: 0
            };
          }
          metrics.staff_sales[line.metadata.staff_id].revenue += parseFloat(line.line_amount || 0);
          metrics.staff_sales[line.metadata.staff_id].transactions += 1;
          metrics.staff_sales[line.metadata.staff_id].items += line.quantity || 1;
        }
      });

      // Hour analysis
      const hour = new Date(txn.created_at).getHours();
      if (!metrics.hourly_sales[hour]) {
        metrics.hourly_sales[hour] = { revenue: 0, count: 0 };
      }
      metrics.hourly_sales[hour].revenue += parseFloat(txn.total_amount || 0);
      metrics.hourly_sales[hour].count += 1;
    });

    // Calculate derived metrics
    const summary = {
      date: startDate,
      total_revenue: metrics.total_revenue,
      transaction_count: metrics.transaction_count,
      unique_customers: metrics.unique_customers.size,
      average_transaction: metrics.transaction_count > 0 ? 
        metrics.total_revenue / metrics.transaction_count : 0,
      service_revenue: metrics.service_revenue,
      product_revenue: metrics.product_revenue,
      service_percentage: metrics.total_revenue > 0 ?
        (metrics.service_revenue / metrics.total_revenue * 100) : 0,
      items_per_transaction: metrics.transaction_count > 0 ?
        metrics.items_sold / metrics.transaction_count : 0,
      peak_hour: Object.entries(metrics.hourly_sales)
        .sort((a, b) => b[1].revenue - a[1].revenue)[0]?.[0] || 'N/A',
      hourly_breakdown: metrics.hourly_sales,
      staff_performance: metrics.staff_sales
    };

    return createMCPResponse(summary, {
      organization_id: organizationId,
      period: { start: startDate, end: endDate },
      smart_code: 'HERA.SALES.DAILY.REPORT.v1'
    });

  } catch (error) {
    console.error('Error getting daily sales:', error);
    return createMCPResponse(null, {
      success: false,
      error: error.message
    });
  }
}

async function getTopProducts(organizationId, options = {}) {
  const {
    startDate = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate = new Date().toISOString().split('T')[0],
    limit = 10,
    category = 'all'
  } = options;

  try {
    // Get all sales transactions with line items
    const { data: transactions, error } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        universal_transaction_lines!inner(
          *,
          product:core_entities!entity_id(
            id,
            entity_name,
            entity_code,
            entity_type,
            metadata
          )
        )
      `)
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'sale')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate);

    if (error) throw error;

    // Aggregate product sales
    const productSales = {};
    
    transactions?.forEach(txn => {
      txn.universal_transaction_lines?.forEach(line => {
        if (line.product) {
          const productId = line.product.id;
          const productName = line.product.entity_name;
          const productCode = line.product.entity_code;
          const productType = line.product.entity_type;
          
          if (!productSales[productId]) {
            productSales[productId] = {
              product_id: productId,
              product_name: productName,
              product_code: productCode,
              product_type: productType,
              units_sold: 0,
              revenue: 0,
              transaction_count: 0,
              customers: new Set()
            };
          }
          
          productSales[productId].units_sold += line.quantity || 1;
          productSales[productId].revenue += parseFloat(line.line_amount || 0);
          productSales[productId].transaction_count += 1;
          if (txn.from_entity_id) {
            productSales[productId].customers.add(txn.from_entity_id);
          }
        }
      });
    });

    // Convert to array and sort by revenue
    const topProducts = Object.values(productSales)
      .map(product => ({
        ...product,
        unique_customers: product.customers.size,
        average_price: product.units_sold > 0 ? 
          product.revenue / product.units_sold : 0
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);

    // Calculate totals
    const totals = {
      total_revenue: Object.values(productSales).reduce((sum, p) => sum + p.revenue, 0),
      total_units: Object.values(productSales).reduce((sum, p) => sum + p.units_sold, 0),
      total_products: Object.keys(productSales).length
    };

    return createMCPResponse({
      period: { start: startDate, end: endDate },
      top_products: topProducts,
      totals: totals,
      analysis: {
        pareto_80_20: calculatePareto(topProducts, totals.total_revenue),
        category_breakdown: categorizeSales(topProducts)
      }
    }, {
      organization_id: organizationId,
      smart_code: 'HERA.SALES.TOP.PRODUCTS.v1'
    });

  } catch (error) {
    console.error('Error getting top products:', error);
    return createMCPResponse(null, {
      success: false,
      error: error.message
    });
  }
}

async function getCustomerMetrics(organizationId, options = {}) {
  const {
    startDate = new Date(new Date().setMonth(new Date().getMonth() - 3)).toISOString().split('T')[0],
    endDate = new Date().toISOString().split('T')[0]
  } = options;

  try {
    // Get all customer transactions
    const { data: transactions, error } = await supabase
      .from('universal_transactions')
      .select(`
        *,
        customer:core_entities!from_entity_id(
          id,
          entity_name,
          entity_code,
          created_at
        )
      `)
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'sale')
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .not('from_entity_id', 'is', null);

    if (error) throw error;

    // Analyze customer behavior
    const customerData = {};
    const periodStart = new Date(startDate);
    const periodEnd = new Date(endDate);
    
    transactions?.forEach(txn => {
      const customerId = txn.from_entity_id;
      const customerName = txn.customer?.entity_name || 'Unknown';
      const customerSince = txn.customer?.created_at;
      
      if (!customerData[customerId]) {
        customerData[customerId] = {
          customer_id: customerId,
          customer_name: customerName,
          customer_since: customerSince,
          first_purchase: txn.transaction_date,
          last_purchase: txn.transaction_date,
          transaction_count: 0,
          total_spent: 0,
          visit_dates: [],
          products_purchased: new Set()
        };
      }
      
      customerData[customerId].transaction_count += 1;
      customerData[customerId].total_spent += parseFloat(txn.total_amount || 0);
      customerData[customerId].visit_dates.push(txn.transaction_date);
      
      if (txn.transaction_date < customerData[customerId].first_purchase) {
        customerData[customerId].first_purchase = txn.transaction_date;
      }
      if (txn.transaction_date > customerData[customerId].last_purchase) {
        customerData[customerId].last_purchase = txn.transaction_date;
      }
    });

    // Calculate customer metrics
    const customers = Object.values(customerData);
    const totalCustomers = customers.length;
    const newCustomers = customers.filter(c => 
      new Date(c.customer_since) >= periodStart
    ).length;
    const repeatCustomers = customers.filter(c => c.transaction_count > 1).length;
    
    // Segment customers
    const segments = {
      vip: customers.filter(c => c.total_spent > 1000).length,
      regular: customers.filter(c => c.transaction_count >= 3).length,
      occasional: customers.filter(c => c.transaction_count === 2).length,
      one_time: customers.filter(c => c.transaction_count === 1).length,
      dormant: customers.filter(c => {
        const daysSinceLastPurchase = 
          (new Date() - new Date(c.last_purchase)) / (1000 * 60 * 60 * 24);
        return daysSinceLastPurchase > 90;
      }).length
    };

    // Calculate averages
    const totalRevenue = customers.reduce((sum, c) => sum + c.total_spent, 0);
    const totalTransactions = customers.reduce((sum, c) => sum + c.transaction_count, 0);

    const metrics = {
      period: { start: startDate, end: endDate },
      customer_count: totalCustomers,
      new_customers: newCustomers,
      repeat_customers: repeatCustomers,
      repeat_rate: totalCustomers > 0 ? (repeatCustomers / totalCustomers * 100) : 0,
      average_customer_value: totalCustomers > 0 ? totalRevenue / totalCustomers : 0,
      average_purchase_frequency: totalCustomers > 0 ? totalTransactions / totalCustomers : 0,
      customer_segments: segments,
      top_customers: customers
        .sort((a, b) => b.total_spent - a.total_spent)
        .slice(0, 10)
        .map(c => ({
          customer_name: c.customer_name,
          total_spent: c.total_spent,
          visits: c.transaction_count,
          average_ticket: c.total_spent / c.transaction_count,
          last_visit: c.last_purchase,
          days_since_visit: Math.floor(
            (new Date() - new Date(c.last_purchase)) / (1000 * 60 * 60 * 24)
          )
        }))
    };

    return createMCPResponse(metrics, {
      organization_id: organizationId,
      smart_code: 'HERA.SALES.CUSTOMER.METRICS.v1'
    });

  } catch (error) {
    console.error('Error getting customer metrics:', error);
    return createMCPResponse(null, {
      success: false,
      error: error.message
    });
  }
}

async function getSalesTrends(organizationId, options = {}) {
  const {
    period = 'daily',
    lookback = 30,
    comparison = true
  } = options;

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - lookback);

    // Get sales data for the period
    const { data: transactions, error } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'sale')
      .gte('transaction_date', startDate.toISOString().split('T')[0])
      .lte('transaction_date', endDate.toISOString().split('T')[0])
      .order('transaction_date');

    if (error) throw error;

    // Group by period
    const groupedData = {};
    
    transactions?.forEach(txn => {
      let periodKey;
      const txnDate = new Date(txn.transaction_date);
      
      switch (period) {
        case 'daily':
          periodKey = txn.transaction_date;
          break;
        case 'weekly':
          const weekStart = new Date(txnDate);
          weekStart.setDate(txnDate.getDate() - txnDate.getDay());
          periodKey = weekStart.toISOString().split('T')[0];
          break;
        case 'monthly':
          periodKey = `${txnDate.getFullYear()}-${String(txnDate.getMonth() + 1).padStart(2, '0')}`;
          break;
      }
      
      if (!groupedData[periodKey]) {
        groupedData[periodKey] = {
          period: periodKey,
          revenue: 0,
          transactions: 0,
          customers: new Set()
        };
      }
      
      groupedData[periodKey].revenue += parseFloat(txn.total_amount || 0);
      groupedData[periodKey].transactions += 1;
      if (txn.from_entity_id) {
        groupedData[periodKey].customers.add(txn.from_entity_id);
      }
    });

    // Convert to array and calculate metrics
    const trendData = Object.values(groupedData)
      .map(period => ({
        period: period.period,
        revenue: period.revenue,
        transactions: period.transactions,
        unique_customers: period.customers.size,
        average_transaction: period.transactions > 0 ? 
          period.revenue / period.transactions : 0
      }))
      .sort((a, b) => a.period.localeCompare(b.period));

    // Calculate growth rates
    for (let i = 1; i < trendData.length; i++) {
      const current = trendData[i];
      const previous = trendData[i - 1];
      
      current.revenue_growth = previous.revenue > 0 ?
        ((current.revenue - previous.revenue) / previous.revenue * 100) : 0;
      current.transaction_growth = previous.transactions > 0 ?
        ((current.transactions - previous.transactions) / previous.transactions * 100) : 0;
    }

    // Calculate summary statistics
    const totalRevenue = trendData.reduce((sum, p) => sum + p.revenue, 0);
    const avgRevenue = trendData.length > 0 ? totalRevenue / trendData.length : 0;
    const revenues = trendData.map(p => p.revenue);
    const maxRevenue = Math.max(...revenues);
    const minRevenue = Math.min(...revenues);

    const analysis = {
      period_type: period,
      data_points: trendData.length,
      total_revenue: totalRevenue,
      average_revenue: avgRevenue,
      peak_revenue: maxRevenue,
      lowest_revenue: minRevenue,
      trend_direction: calculateTrendDirection(trendData),
      seasonality: detectSeasonality(trendData),
      forecast: period === 'daily' ? forecastNextPeriods(trendData, 7) : null
    };

    return createMCPResponse({
      trends: trendData,
      analysis: analysis
    }, {
      organization_id: organizationId,
      smart_code: 'HERA.SALES.TRENDS.v1'
    });

  } catch (error) {
    console.error('Error getting sales trends:', error);
    return createMCPResponse(null, {
      success: false,
      error: error.message
    });
  }
}

// ================================================================================
// HELPER FUNCTIONS
// ================================================================================

function calculatePareto(products, totalRevenue) {
  let cumulativeRevenue = 0;
  let paretoIndex = -1;
  
  for (let i = 0; i < products.length; i++) {
    cumulativeRevenue += products[i].revenue;
    if (cumulativeRevenue >= totalRevenue * 0.8 && paretoIndex === -1) {
      paretoIndex = i + 1;
    }
  }
  
  return {
    products_for_80_percent: paretoIndex,
    percentage_of_products: products.length > 0 ? 
      (paretoIndex / products.length * 100) : 0
  };
}

function categorizeSales(products) {
  const categories = {};
  
  products.forEach(product => {
    const type = product.product_type || 'other';
    if (!categories[type]) {
      categories[type] = {
        count: 0,
        revenue: 0,
        units: 0
      };
    }
    categories[type].count += 1;
    categories[type].revenue += product.revenue;
    categories[type].units += product.units_sold;
  });
  
  return categories;
}

function calculateTrendDirection(trendData) {
  if (trendData.length < 2) return 'insufficient_data';
  
  // Simple linear regression
  const n = trendData.length;
  const sumX = trendData.reduce((sum, _, i) => sum + i, 0);
  const sumY = trendData.reduce((sum, p) => sum + p.revenue, 0);
  const sumXY = trendData.reduce((sum, p, i) => sum + i * p.revenue, 0);
  const sumX2 = trendData.reduce((sum, _, i) => sum + i * i, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  
  if (slope > 0.05) return 'upward';
  if (slope < -0.05) return 'downward';
  return 'stable';
}

function detectSeasonality(trendData) {
  // Simple seasonality detection - would be more sophisticated in production
  if (trendData.length < 7) return null;
  
  const dayOfWeekRevenue = {};
  trendData.forEach(period => {
    const date = new Date(period.period);
    const dayOfWeek = date.getDay();
    
    if (!dayOfWeekRevenue[dayOfWeek]) {
      dayOfWeekRevenue[dayOfWeek] = {
        total: 0,
        count: 0
      };
    }
    
    dayOfWeekRevenue[dayOfWeek].total += period.revenue;
    dayOfWeekRevenue[dayOfWeek].count += 1;
  });
  
  // Find peak days
  const avgByDay = Object.entries(dayOfWeekRevenue).map(([day, data]) => ({
    day: parseInt(day),
    average: data.total / data.count
  })).sort((a, b) => b.average - a.average);
  
  return {
    peak_days: avgByDay.slice(0, 2).map(d => getDayName(d.day)),
    low_days: avgByDay.slice(-2).map(d => getDayName(d.day))
  };
}

function getDayName(dayIndex) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex];
}

function forecastNextPeriods(trendData, periods) {
  // Simple moving average forecast
  const recentPeriods = trendData.slice(-7);
  const avgRevenue = recentPeriods.reduce((sum, p) => sum + p.revenue, 0) / recentPeriods.length;
  const avgTransactions = recentPeriods.reduce((sum, p) => sum + p.transactions, 0) / recentPeriods.length;
  
  const forecast = [];
  const lastDate = new Date(trendData[trendData.length - 1].period);
  
  for (let i = 1; i <= periods; i++) {
    const forecastDate = new Date(lastDate);
    forecastDate.setDate(lastDate.getDate() + i);
    
    forecast.push({
      period: forecastDate.toISOString().split('T')[0],
      revenue: avgRevenue,
      transactions: Math.round(avgTransactions),
      confidence: 0.7 - (i * 0.05) // Confidence decreases with distance
    });
  }
  
  return forecast;
}

// ================================================================================
// CLI DISPLAY FUNCTIONS
// ================================================================================

function displayDailySalesReport(salesData) {
  if (!salesData.success || !salesData.data) {
    console.log('❌ No sales data available');
    return;
  }

  const data = salesData.data;
  
  console.log('\n📊 DAILY SALES REPORT');
  console.log('='.repeat(60));
  console.log(`Date: ${data.date}`);
  console.log(`Organization: ${salesData.organization_id}`);
  
  console.log('\n💰 REVENUE SUMMARY:');
  console.log(`   Total Revenue: ${data.total_revenue.toFixed(2)} AED`);
  console.log(`   Service Revenue: ${data.service_revenue.toFixed(2)} AED (${data.service_percentage.toFixed(1)}%)`);
  console.log(`   Product Revenue: ${data.product_revenue.toFixed(2)} AED (${(100 - data.service_percentage).toFixed(1)}%)`);
  
  console.log('\n📈 TRANSACTION METRICS:');
  console.log(`   Total Transactions: ${data.transaction_count}`);
  console.log(`   Unique Customers: ${data.unique_customers}`);
  console.log(`   Average Transaction: ${data.average_transaction.toFixed(2)} AED`);
  console.log(`   Items per Transaction: ${data.items_per_transaction.toFixed(1)}`);
  
  console.log('\n⏰ HOURLY BREAKDOWN:');
  const sortedHours = Object.entries(data.hourly_breakdown)
    .sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
  
  sortedHours.forEach(([hour, data]) => {
    const barLength = Math.round(data.revenue / 1000);
    const bar = '█'.repeat(Math.min(barLength, 50));
    console.log(`   ${hour.padStart(2, '0')}:00 ${bar} ${data.revenue.toFixed(2)} AED (${data.count} sales)`);
  });
  
  console.log(`\n   Peak Hour: ${data.peak_hour}:00`);
  
  if (Object.keys(data.staff_performance).length > 0) {
    console.log('\n👥 STAFF PERFORMANCE:');
    Object.entries(data.staff_performance)
      .sort((a, b) => b[1].revenue - a[1].revenue)
      .forEach(([staffId, performance]) => {
        console.log(`   Staff ${staffId}: ${performance.revenue.toFixed(2)} AED (${performance.transactions} sales)`);
      });
  }
}

function displayTopProductsReport(productsData) {
  if (!productsData.success || !productsData.data) {
    console.log('❌ No product data available');
    return;
  }

  const data = productsData.data;
  
  console.log('\n🏆 TOP PRODUCTS & SERVICES');
  console.log('='.repeat(80));
  console.log(`Period: ${data.period.start} to ${data.period.end}`);
  
  console.log('\n   Rank │ Product/Service                    │ Revenue │ Units │ Avg Price │ Customers');
  console.log('   ─────┼────────────────────────────────────┼─────────┼───────┼───────────┼──────────');
  
  data.top_products.forEach((product, index) => {
    console.log(`   ${(index + 1).toString().padStart(4)} │ ${product.product_name.padEnd(34)} │ ${product.revenue.toFixed(2).padStart(7)} │ ${product.units_sold.toString().padStart(5)} │ ${product.average_price.toFixed(2).padStart(9)} │ ${product.unique_customers.toString().padStart(8)}`);
  });
  
  console.log('\n📊 ANALYSIS:');
  console.log(`   Total Products: ${data.totals.total_products}`);
  console.log(`   Total Revenue: ${data.totals.total_revenue.toFixed(2)} AED`);
  console.log(`   Total Units Sold: ${data.totals.total_units}`);
  
  if (data.analysis.pareto_80_20) {
    console.log(`\n   💡 Pareto Analysis: ${data.analysis.pareto_80_20.products_for_80_percent} products (${data.analysis.pareto_80_20.percentage_of_products.toFixed(1)}%) generate 80% of revenue`);
  }
}

function displayCustomerMetrics(customerData) {
  if (!customerData.success || !customerData.data) {
    console.log('❌ No customer data available');
    return;
  }

  const data = customerData.data;
  
  console.log('\n👥 CUSTOMER ANALYTICS');
  console.log('='.repeat(60));
  console.log(`Period: ${data.period.start} to ${data.period.end}`);
  
  console.log('\n📊 CUSTOMER SUMMARY:');
  console.log(`   Total Customers: ${data.customer_count}`);
  console.log(`   New Customers: ${data.new_customers}`);
  console.log(`   Repeat Customers: ${data.repeat_customers} (${data.repeat_rate.toFixed(1)}%)`);
  console.log(`   Average Customer Value: ${data.average_customer_value.toFixed(2)} AED`);
  console.log(`   Average Purchase Frequency: ${data.average_purchase_frequency.toFixed(1)} visits`);
  
  console.log('\n🎯 CUSTOMER SEGMENTS:');
  console.log(`   VIP (>1000 AED): ${data.customer_segments.vip} customers`);
  console.log(`   Regular (3+ visits): ${data.customer_segments.regular} customers`);
  console.log(`   Occasional (2 visits): ${data.customer_segments.occasional} customers`);
  console.log(`   One-time: ${data.customer_segments.one_time} customers`);
  console.log(`   Dormant (>90 days): ${data.customer_segments.dormant} customers`);
  
  console.log('\n🏆 TOP CUSTOMERS:');
  console.log('   Customer                    │ Total Spent │ Visits │ Avg Ticket │ Last Visit │ Days');
  console.log('   ────────────────────────────┼─────────────┼────────┼────────────┼────────────┼──────');
  
  data.top_customers.forEach(customer => {
    console.log(`   ${customer.customer_name.padEnd(28)} │ ${customer.total_spent.toFixed(2).padStart(11)} │ ${customer.visits.toString().padStart(6)} │ ${customer.average_ticket.toFixed(2).padStart(10)} │ ${customer.last_visit} │ ${customer.days_since_visit.toString().padStart(4)}`);
  });
}

function displaySalesTrends(trendsData) {
  if (!trendsData.success || !trendsData.data) {
    console.log('❌ No trends data available');
    return;
  }

  const data = trendsData.data;
  
  console.log('\n📈 SALES TRENDS ANALYSIS');
  console.log('='.repeat(60));
  console.log(`Period Type: ${data.analysis.period_type}`);
  console.log(`Data Points: ${data.analysis.data_points}`);
  
  console.log('\n📊 SUMMARY STATISTICS:');
  console.log(`   Total Revenue: ${data.analysis.total_revenue.toFixed(2)} AED`);
  console.log(`   Average Revenue: ${data.analysis.average_revenue.toFixed(2)} AED`);
  console.log(`   Peak Revenue: ${data.analysis.peak_revenue.toFixed(2)} AED`);
  console.log(`   Lowest Revenue: ${data.analysis.lowest_revenue.toFixed(2)} AED`);
  console.log(`   Trend Direction: ${data.analysis.trend_direction.toUpperCase()}`);
  
  if (data.analysis.seasonality) {
    console.log('\n🔄 SEASONALITY:');
    console.log(`   Peak Days: ${data.analysis.seasonality.peak_days.join(', ')}`);
    console.log(`   Low Days: ${data.analysis.seasonality.low_days.join(', ')}`);
  }
  
  console.log('\n📈 PERIOD DETAILS:');
  console.log('   Period      │   Revenue │ Sales │ Customers │ Avg Trans │ Growth %');
  console.log('   ────────────┼───────────┼───────┼───────────┼───────────┼──────────');
  
  data.trends.forEach(period => {
    const growth = period.revenue_growth !== undefined ? 
      `${period.revenue_growth > 0 ? '+' : ''}${period.revenue_growth.toFixed(1)}%` : 'N/A';
    
    console.log(`   ${period.period.padEnd(12)} │ ${period.revenue.toFixed(2).padStart(9)} │ ${period.transactions.toString().padStart(5)} │ ${period.unique_customers.toString().padStart(9)} │ ${period.average_transaction.toFixed(2).padStart(9)} │ ${growth.padStart(8)}`);
  });
  
  if (data.analysis.forecast) {
    console.log('\n🔮 7-DAY FORECAST:');
    data.analysis.forecast.forEach(forecast => {
      console.log(`   ${forecast.period}: ${forecast.revenue.toFixed(2)} AED (${forecast.transactions} sales) - Confidence: ${(forecast.confidence * 100).toFixed(0)}%`);
    });
  }
}

// ================================================================================
// CLI COMMAND HANDLERS
// ================================================================================

async function showSalesConfig(industryType = 'salon') {
  console.log(`🧬 HERA Universal Sales Report DNA Configuration - ${industryType.toUpperCase()}\n`);
  
  const config = SALES_REPORT_DNA_CONFIG.industries[industryType];
  if (!config) {
    console.log(`❌ Unknown industry type: ${industryType}`);
    console.log('Available industries:', Object.keys(SALES_REPORT_DNA_CONFIG.industries).join(', '));
    return;
  }

  console.log(`🏢 INDUSTRY: ${config.name}`);
  console.log('='.repeat(config.name.length + 12));
  
  console.log('\n📊 KEY METRICS:');
  config.key_metrics.forEach(metric => {
    console.log(`   • ${metric.replace(/_/g, ' ').toUpperCase()}`);
  });

  if (config.service_categories) {
    console.log('\n💇 SERVICE CATEGORIES:');
    Object.entries(config.service_categories).forEach(([key, cat]) => {
      console.log(`   ${cat.name}: ${cat.codes.join(', ')}`);
    });
  }

  if (config.product_categories) {
    console.log('\n🛍️ PRODUCT CATEGORIES:');
    Object.entries(config.product_categories).forEach(([key, cat]) => {
      console.log(`   ${cat.name}: ${cat.codes.join(', ')}`);
    });
  }

  console.log('\n🎯 KPI TARGETS:');
  Object.entries(config.kpi_targets).forEach(([metric, target]) => {
    if (typeof target === 'object') {
      console.log(`   ${metric.replace(/_/g, ' ').toUpperCase()}:`);
      Object.entries(target).forEach(([k, v]) => {
        console.log(`      ${k}: ${v}%`);
      });
    } else {
      console.log(`   ${metric.replace(/_/g, ' ').toUpperCase()}: ${target}`);
    }
  });

  console.log('\n🔧 DNA INTEGRATION:');
  console.log('   ✅ Transaction DNA: Real-time sales data');
  console.log('   ✅ Customer DNA: Customer behavior tracking');
  console.log('   ✅ Product DNA: Product performance analysis');
  console.log('   ✅ Staff DNA: Employee performance metrics');
  console.log('   ✅ MCP Integration: AI-accessible analytics');
  console.log('   ✅ P&L DNA: Links to revenue reporting');
}

async function generateHairTalkzSalesReports(options = {}) {
  console.log('💇‍♀️ HAIR TALKZ GROUP - SALES ANALYTICS');
  console.log('='.repeat(70));
  console.log(`Generated: ${new Date().toLocaleString()}\n`);

  for (const org of HAIR_TALKZ_ORGS) {
    console.log(`\n🔄 Processing: ${org.name}`);
    console.log('─'.repeat(50));
    
    try {
      // Daily sales
      const dailySales = await getDailySales(org.id, new Date());
      displayDailySalesReport(dailySales);
      
      // Top products
      const topProducts = await getTopProducts(org.id, { limit: 5 });
      displayTopProductsReport(topProducts);
      
      // Customer metrics
      const customerMetrics = await getCustomerMetrics(org.id);
      displayCustomerMetrics(customerMetrics);
      
    } catch (error) {
      console.log(`❌ Error processing ${org.name}:`, error.message);
    }
  }
}

function showUsageHelp() {
  console.log(`
🧬 HERA UNIVERSAL SALES REPORT DNA CLI TOOL
==============================================

Sales analytics and reporting for any business type using HERA's 
Universal DNA architecture with MCP integration.

USAGE:
  node sales-report-dna-cli.js <command> [options]

COMMANDS:
  config [industry]         Show sales DNA configuration for industry
                           Industries: salon, restaurant, retail, universal

  daily                    Generate daily sales report
    --org <org-id>           Organization UUID (required)
    --date <YYYY-MM-DD>      Date to analyze (default: today)
    --export                 Export as JSON for MCP

  weekly                   Generate weekly sales summary
    --org <org-id>           Organization UUID (required)
    --week <YYYY-WW>         Week to analyze

  monthly                  Generate monthly sales report
    --org <org-id>           Organization UUID (required)
    --month <YYYY-MM>        Month to analyze

  top-products             Show top selling products/services
    --org <org-id>           Organization UUID (required)
    --limit <number>         Number of products (default: 10)
    --period <days>          Days to analyze (default: 30)

  customer-analysis        Analyze customer behavior
    --org <org-id>           Organization UUID (required)
    --segment <type>         vip|regular|dormant|all (default: all)

  staff-performance        Analyze staff sales performance
    --org <org-id>           Organization UUID (required)
    --period <days>          Days to analyze (default: 30)

  trends                   Show sales trends and forecast
    --org <org-id>           Organization UUID (required)
    --period <type>          daily|weekly|monthly (default: daily)
    --lookback <days>        Days to analyze (default: 30)

  hair-talkz               Generate reports for all Hair Talkz orgs
    --consolidated           Include group totals

  export-mcp               Export data for MCP consumption
    --org <org-id>           Organization UUID (required)
    --type <report>          daily|products|customers|trends
    --output <file>          Output JSON file

  help                     Show this help message

EXAMPLES:
  node sales-report-dna-cli.js config salon
  node sales-report-dna-cli.js daily --org uuid-here
  node sales-report-dna-cli.js top-products --org uuid-here --limit 20
  node sales-report-dna-cli.js customer-analysis --org uuid-here
  node sales-report-dna-cli.js trends --org uuid-here --period weekly
  node sales-report-dna-cli.js hair-talkz
  node sales-report-dna-cli.js export-mcp --org uuid-here --type daily

ENVIRONMENT VARIABLES:
  DEFAULT_ORGANIZATION_ID   Your organization UUID (optional)
  SUPABASE_URL             Your Supabase project URL
  SUPABASE_SERVICE_ROLE_KEY Your Supabase service role key

SMART CODE: HERA.SALES.REPORT.DNA.CLI.v1

🌟 This DNA component provides comprehensive sales analytics with
   MCP integration for AI-powered insights and natural language queries.
`);
}

// ================================================================================
// MAIN EXECUTION
// ================================================================================

async function main() {
  console.log('🧬 HERA Universal Sales Report DNA CLI Tool\n');

  switch (command) {
    case 'config':
      const industry = process.argv[3] || 'salon';
      await showSalesConfig(industry);
      break;
      
    case 'daily':
      const dailyOrgFlag = process.argv.indexOf('--org');
      const dailyDateFlag = process.argv.indexOf('--date');
      const exportFlag = process.argv.includes('--export');
      
      const dailyOrgId = dailyOrgFlag > -1 ? process.argv[dailyOrgFlag + 1] : organizationId;
      const dailyDate = dailyDateFlag > -1 ? 
        new Date(process.argv[dailyDateFlag + 1]) : new Date();
      
      if (!dailyOrgId) {
        console.error('❌ Organization ID required');
        return;
      }
      
      const dailySales = await getDailySales(dailyOrgId, dailyDate);
      
      if (exportFlag) {
        console.log(JSON.stringify(dailySales, null, 2));
      } else {
        displayDailySalesReport(dailySales);
      }
      break;

    case 'top-products':
      const prodOrgFlag = process.argv.indexOf('--org');
      const limitFlag = process.argv.indexOf('--limit');
      const periodFlag = process.argv.indexOf('--period');
      
      const prodOrgId = prodOrgFlag > -1 ? process.argv[prodOrgFlag + 1] : organizationId;
      const limit = limitFlag > -1 ? parseInt(process.argv[limitFlag + 1]) : 10;
      const periodDays = periodFlag > -1 ? parseInt(process.argv[periodFlag + 1]) : 30;
      
      if (!prodOrgId) {
        console.error('❌ Organization ID required');
        return;
      }
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodDays);
      
      const topProducts = await getTopProducts(prodOrgId, {
        startDate: startDate.toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        limit: limit
      });
      
      displayTopProductsReport(topProducts);
      break;

    case 'customer-analysis':
      const custOrgFlag = process.argv.indexOf('--org');
      const segmentFlag = process.argv.indexOf('--segment');
      
      const custOrgId = custOrgFlag > -1 ? process.argv[custOrgFlag + 1] : organizationId;
      const segment = segmentFlag > -1 ? process.argv[segmentFlag + 1] : 'all';
      
      if (!custOrgId) {
        console.error('❌ Organization ID required');
        return;
      }
      
      const customerMetrics = await getCustomerMetrics(custOrgId);
      displayCustomerMetrics(customerMetrics);
      break;

    case 'trends':
      const trendOrgFlag = process.argv.indexOf('--org');
      const trendPeriodFlag = process.argv.indexOf('--period');
      const lookbackFlag = process.argv.indexOf('--lookback');
      
      const trendOrgId = trendOrgFlag > -1 ? process.argv[trendOrgFlag + 1] : organizationId;
      const trendPeriod = trendPeriodFlag > -1 ? process.argv[trendPeriodFlag + 1] : 'daily';
      const lookback = lookbackFlag > -1 ? parseInt(process.argv[lookbackFlag + 1]) : 30;
      
      if (!trendOrgId) {
        console.error('❌ Organization ID required');
        return;
      }
      
      const salesTrends = await getSalesTrends(trendOrgId, {
        period: trendPeriod,
        lookback: lookback
      });
      
      displaySalesTrends(salesTrends);
      break;

    case 'hair-talkz':
      await generateHairTalkzSalesReports();
      break;

    case 'export-mcp':
      const mcpOrgFlag = process.argv.indexOf('--org');
      const typeFlag = process.argv.indexOf('--type');
      const outputFlag = process.argv.indexOf('--output');
      
      const mcpOrgId = mcpOrgFlag > -1 ? process.argv[mcpOrgFlag + 1] : organizationId;
      const reportType = typeFlag > -1 ? process.argv[typeFlag + 1] : 'daily';
      const outputFile = outputFlag > -1 ? process.argv[outputFlag + 1] : null;
      
      if (!mcpOrgId) {
        console.error('❌ Organization ID required');
        return;
      }
      
      let mcpData;
      switch (reportType) {
        case 'daily':
          mcpData = await getDailySales(mcpOrgId);
          break;
        case 'products':
          mcpData = await getTopProducts(mcpOrgId);
          break;
        case 'customers':
          mcpData = await getCustomerMetrics(mcpOrgId);
          break;
        case 'trends':
          mcpData = await getSalesTrends(mcpOrgId);
          break;
        default:
          console.error('❌ Unknown report type:', reportType);
          return;
      }
      
      const output = JSON.stringify(mcpData, null, 2);
      
      if (outputFile) {
        require('fs').writeFileSync(outputFile, output);
        console.log(`✅ Exported to ${outputFile}`);
      } else {
        console.log(output);
      }
      break;

    case 'help':
    default:
      showUsageHelp();
      break;
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Fatal Error:', error.message);
    process.exit(1);
  });
}

// Export functions for MCP integration
module.exports = {
  SALES_REPORT_DNA_CONFIG,
  getDailySales,
  getTopProducts,
  getCustomerMetrics,
  getSalesTrends,
  createMCPResponse,
  HAIR_TALKZ_ORGS
};