// Salon Tools for Claude API Integration
// Built following HERA's universal architecture principles

const { createClient } = require('@supabase/supabase-js');
const Anthropic = require('@anthropic-ai/sdk');

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Define tools for Claude to use
const salonTools = [
  {
    name: "check_revenue",
    description: "Calculate revenue for a specific time period (today, this week, this month, custom date range)",
    input_schema: {
      type: "object",
      properties: {
        organizationId: {
          type: "string",
          description: "Organization UUID"
        },
        period: {
          type: "string",
          enum: ["today", "this_week", "this_month", "last_month", "custom"],
          description: "Time period for revenue calculation"
        },
        startDate: {
          type: "string",
          description: "Start date for custom period (ISO format)"
        },
        endDate: {
          type: "string",
          description: "End date for custom period (ISO format)"
        }
      },
      required: ["organizationId", "period"]
    }
  },
  {
    name: "analyze_services",
    description: "Analyze service performance, popularity, and revenue contribution",
    input_schema: {
      type: "object",
      properties: {
        organizationId: {
          type: "string",
          description: "Organization UUID"
        },
        period: {
          type: "string",
          enum: ["today", "this_week", "this_month"],
          description: "Analysis period"
        }
      },
      required: ["organizationId", "period"]
    }
  },
  {
    name: "staff_performance",
    description: "Analyze staff performance including revenue, appointments, and commission",
    input_schema: {
      type: "object",
      properties: {
        organizationId: {
          type: "string",
          description: "Organization UUID"
        },
        staffId: {
          type: "string",
          description: "Specific staff member ID (optional)"
        },
        period: {
          type: "string",
          enum: ["today", "this_week", "this_month"],
          description: "Performance period"
        }
      },
      required: ["organizationId", "period"]
    }
  },
  {
    name: "find_quiet_times",
    description: "Find quiet times with low bookings for promotional opportunities",
    input_schema: {
      type: "object",
      properties: {
        organizationId: {
          type: "string",
          description: "Organization UUID"
        },
        daysAhead: {
          type: "number",
          description: "How many days ahead to check (default: 7)"
        }
      },
      required: ["organizationId"]
    }
  }
];

// Tool implementations
async function checkRevenue({ organizationId, period, startDate, endDate }) {
  let dateFrom, dateTo;
  const now = new Date();
  
  switch (period) {
    case 'today':
      dateFrom = new Date(now.setHours(0, 0, 0, 0));
      dateTo = new Date(now.setHours(23, 59, 59, 999));
      break;
    case 'this_week':
      const firstDay = now.getDate() - now.getDay();
      dateFrom = new Date(now.setDate(firstDay));
      dateFrom.setHours(0, 0, 0, 0);
      dateTo = new Date();
      break;
    case 'this_month':
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
      dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      break;
    case 'last_month':
      dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      dateTo = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case 'custom':
      dateFrom = new Date(startDate);
      dateTo = new Date(endDate);
      break;
  }
  
  // Query completed transactions (sales, appointments)
  const { data: transactions, error } = await supabase
    .from('universal_transactions')
    .select('*, universal_transaction_lines(*)')
    .eq('organization_id', organizationId)
    .in('transaction_type', ['sale', 'appointment'])
    .in('transaction_status', ['completed', 'paid'])
    .gte('transaction_date', dateFrom.toISOString())
    .lte('transaction_date', dateTo.toISOString());
    
  if (error) throw error;
  
  // Calculate totals
  const revenue = transactions?.reduce((sum, txn) => sum + (txn.total_amount || 0), 0) || 0;
  const transactionCount = transactions?.length || 0;
  const avgTransaction = transactionCount > 0 ? revenue / transactionCount : 0;
  
  // Get service breakdown
  const serviceRevenue = {};
  transactions?.forEach(txn => {
    const serviceName = txn.metadata?.service_name || 'Other';
    serviceRevenue[serviceName] = (serviceRevenue[serviceName] || 0) + (txn.total_amount || 0);
  });
  
  return {
    period,
    dateFrom: dateFrom.toISOString(),
    dateTo: dateTo.toISOString(),
    totalRevenue: revenue,
    transactionCount,
    averageTransaction: avgTransaction,
    serviceBreakdown: serviceRevenue,
    topServices: Object.entries(serviceRevenue)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([service, amount]) => ({ service, amount }))
  };
}

async function analyzeServices({ organizationId, period }) {
  const revenueData = await checkRevenue({ organizationId, period });
  
  // Get all services
  const { data: services } = await supabase
    .from('core_entities')
    .select('*, core_dynamic_data(*)')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'salon_service')
    .eq('status', 'active');
    
  // Transform dynamic data
  const serviceDetails = services?.map(service => {
    const fields = {};
    service.core_dynamic_data?.forEach(field => {
      fields[field.field_name] = field.field_value_number || field.field_value_text;
    });
    return {
      id: service.id,
      name: service.entity_name,
      price: fields.price || 0,
      duration: fields.duration || 60,
      revenue: revenueData.serviceBreakdown[service.entity_name] || 0
    };
  }) || [];
  
  return {
    period,
    services: serviceDetails.sort((a, b) => b.revenue - a.revenue),
    mostPopular: serviceDetails[0],
    totalServices: serviceDetails.length,
    averagePrice: serviceDetails.reduce((sum, s) => sum + s.price, 0) / serviceDetails.length
  };
}

async function staffPerformance({ organizationId, staffId, period }) {
  const revenueData = await checkRevenue({ organizationId, period });
  
  // Query staff-specific transactions
  let query = supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', organizationId)
    .in('transaction_type', ['sale', 'appointment'])
    .gte('transaction_date', revenueData.dateFrom)
    .lte('transaction_date', revenueData.dateTo);
    
  if (staffId) {
    query = query.eq('target_entity_id', staffId);
  }
  
  const { data: transactions } = await query;
  
  // Get staff details
  const { data: staff } = await supabase
    .from('core_entities')
    .select('*, core_dynamic_data(*)')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'employee');
    
  // Calculate performance by staff
  const staffMetrics = {};
  transactions?.forEach(txn => {
    const id = txn.target_entity_id;
    if (!staffMetrics[id]) {
      staffMetrics[id] = {
        revenue: 0,
        appointments: 0,
        commission: 0
      };
    }
    staffMetrics[id].revenue += txn.total_amount || 0;
    staffMetrics[id].appointments += 1;
    staffMetrics[id].commission += (txn.total_amount || 0) * 0.3; // 30% commission
  });
  
  // Combine with staff info
  const results = staff?.map(member => ({
    id: member.id,
    name: member.entity_name,
    ...staffMetrics[member.id] || { revenue: 0, appointments: 0, commission: 0 }
  })) || [];
  
  return {
    period,
    staff: results.sort((a, b) => b.revenue - a.revenue),
    topPerformer: results[0],
    totalRevenue: results.reduce((sum, s) => sum + s.revenue, 0),
    totalCommission: results.reduce((sum, s) => sum + s.commission, 0)
  };
}

async function findQuietTimes({ organizationId, daysAhead = 7 }) {
  const now = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + daysAhead);
  
  // Get all appointments in the period
  const { data: appointments } = await supabase
    .from('universal_transactions')
    .select('metadata')
    .eq('organization_id', organizationId)
    .eq('transaction_type', 'appointment')
    .gte('transaction_date', now.toISOString())
    .lte('transaction_date', endDate.toISOString());
    
  // Create time slots (hourly from 9 AM to 6 PM)
  const timeSlots = {};
  for (let d = 0; d < daysAhead; d++) {
    const date = new Date();
    date.setDate(date.getDate() + d);
    const dateStr = date.toISOString().split('T')[0];
    
    for (let hour = 9; hour <= 18; hour++) {
      const slot = `${dateStr} ${hour}:00`;
      timeSlots[slot] = 0;
    }
  }
  
  // Count appointments per slot
  appointments?.forEach(apt => {
    if (apt.metadata?.appointment_time) {
      const aptTime = new Date(apt.metadata.appointment_time);
      const dateStr = aptTime.toISOString().split('T')[0];
      const hour = aptTime.getHours();
      const slot = `${dateStr} ${hour}:00`;
      if (timeSlots[slot] !== undefined) {
        timeSlots[slot]++;
      }
    }
  });
  
  // Find quiet times (less than 2 appointments)
  const quietSlots = Object.entries(timeSlots)
    .filter(([_, count]) => count < 2)
    .map(([slot, count]) => ({ slot, appointments: count }))
    .slice(0, 10);
    
  return {
    daysAnalyzed: daysAhead,
    quietTimes: quietSlots,
    recommendation: quietSlots.length > 0 
      ? `Found ${quietSlots.length} quiet time slots perfect for promotions`
      : 'No quiet times found - business is fully booked!'
  };
}

// Execute tool function
async function executeTool(toolName, args) {
  switch (toolName) {
    case 'check_revenue':
      return await checkRevenue(args);
    case 'analyze_services':
      return await analyzeServices(args);
    case 'staff_performance':
      return await staffPerformance(args);
    case 'find_quiet_times':
      return await findQuietTimes(args);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

module.exports = {
  salonTools,
  executeTool,
  checkRevenue,
  analyzeServices,
  staffPerformance,
  findQuietTimes
};