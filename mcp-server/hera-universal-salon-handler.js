// HERA Universal Salon Handler - Leveraging 6-table architecture properly
// Built by thinking like the world's best architect

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Universal entity types for salon
const SALON_ENTITY_TYPES = {
  CLIENT: 'customer',
  STAFF: 'employee', 
  SERVICE: 'salon_service',
  PRODUCT: 'product',
  APPOINTMENT_STATUS: 'workflow_status'
};

// Smart code patterns for salon operations
const SALON_SMART_CODES = {
  // Entities
  CLIENT: 'HERA.SALON.CLIENT.PROFILE.v1',
  STAFF: 'HERA.SALON.STAFF.PROFILE.v1',
  SERVICE: 'HERA.SALON.SERVICE.CATALOG.v1',
  PRODUCT: 'HERA.SALON.PRODUCT.INVENTORY.v1',
  
  // Transactions
  APPOINTMENT: 'HERA.SALON.APPOINTMENT.BOOKING.v1',
  SALE: 'HERA.SALON.SALE.POS.v1',
  INVENTORY_USAGE: 'HERA.SALON.INVENTORY.USAGE.v1',
  
  // Dynamic fields
  STOCK_LEVEL: 'HERA.SALON.INVENTORY.STOCK.v1',
  PRICE: 'HERA.SALON.PRICING.AMOUNT.v1',
  DURATION: 'HERA.SALON.SERVICE.DURATION.v1',
  COMMISSION: 'HERA.SALON.STAFF.COMMISSION.v1'
};

// Universal query helper
async function universalQuery(organizationId, entityType, filters = {}) {
  let query = supabase
    .from('core_entities')
    .select('*, core_dynamic_data(*)')
    .eq('organization_id', organizationId)
    .eq('entity_type', entityType);
    
  // Apply filters
  if (filters.name) {
    query = query.ilike('entity_name', `%${filters.name}%`);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }
  if (filters.smartCode) {
    query = query.eq('smart_code', filters.smartCode);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  
  // Transform dynamic data into usable format
  return (data || []).map(entity => {
    const fields = {};
    (entity.core_dynamic_data || []).forEach(field => {
      fields[field.field_name] = field.field_value_text || 
                                field.field_value_number || 
                                field.field_value_boolean ||
                                field.field_value_date;
    });
    return { ...entity, fields, core_dynamic_data: undefined };
  });
}

// Universal create helper
async function universalCreate(organizationId, entityType, name, smartCode, fields = {}) {
  // Validate required fields
  if (!name || !name.trim()) {
    throw new Error(`${entityType} name is required`);
  }
  
  // Create entity
  const { data: entity, error } = await supabase
    .from('core_entities')
    .insert({
      organization_id: organizationId,
      entity_type: entityType,
      entity_name: name.trim(),
      entity_code: `${entityType.toUpperCase()}-${Date.now()}`,
      smart_code: smartCode,
      status: 'active'
    })
    .select()
    .single();
    
  if (error) throw error;
  
  // Add dynamic fields
  if (Object.keys(fields).length > 0) {
    const dynamicData = Object.entries(fields).map(([fieldName, value]) => ({
      organization_id: organizationId,
      entity_id: entity.id,
      field_name: fieldName,
      field_value_text: typeof value === 'string' ? value : null,
      field_value_number: typeof value === 'number' ? value : null,
      field_value_boolean: typeof value === 'boolean' ? value : null,
      field_value_date: value instanceof Date ? value.toISOString() : null,
      smart_code: `${smartCode}.${fieldName.toUpperCase()}`
    }));
    
    await supabase.from('core_dynamic_data').insert(dynamicData);
  }
  
  return entity;
}

// Intelligent extraction for appointments
function extractAppointmentDetails(message) {
  const lower = message.toLowerCase();
  const details = {};
  
  // Extract client name - improved patterns
  const clientPatterns = [
    // "Book Emma for..."
    /book\s+([a-z]+(?:\s+[a-z]+)?)\s+for/i,
    // "Schedule Emma for..."
    /schedule\s+([a-z]+(?:\s+[a-z]+)?)\s+for/i,
    // "Emma appointment..."
    /^([a-z]+(?:\s+[a-z]+)?)\s+appointment/i,
    // "Appointment for Emma..."
    /appointment\s+for\s+([a-z]+(?:\s+[a-z]+)?)/i
  ];
  
  for (const pattern of clientPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      details.clientName = match[1].trim();
      break;
    }
  }
  
  // Extract service - look for common salon services
  const services = [
    'highlights', 'highlight', 
    'haircut', 'cut',
    'color', 'coloring', 'colour',
    'blowdry', 'blow dry', 'blowout',
    'treatment', 'conditioning',
    'manicure', 'pedicure',
    'facial', 'massage',
    'balayage', 'ombre'
  ];
  
  for (const service of services) {
    if (lower.includes(service)) {
      details.serviceName = service.charAt(0).toUpperCase() + service.slice(1);
      break;
    }
  }
  
  // Extract time
  const timePatterns = [
    /at\s+(\d{1,2})\s*(?::(\d{2}))?\s*(am|pm)/i,
    /at\s+(\d{1,2})\s*(am|pm)/i,
    /(\d{1,2})\s*(?::(\d{2}))?\s*(am|pm)/i
  ];
  
  for (const pattern of timePatterns) {
    const match = message.match(pattern);
    if (match) {
      let hour = parseInt(match[1]);
      const minutes = match[2] ? parseInt(match[2]) : 0;
      const ampm = match[3] || match[4];
      
      if (ampm && ampm.toLowerCase() === 'pm' && hour < 12) hour += 12;
      if (ampm && ampm.toLowerCase() === 'am' && hour === 12) hour = 0;
      
      details.hour = hour;
      details.minutes = minutes;
      break;
    }
  }
  
  // Extract date
  if (lower.includes('tomorrow')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    details.date = tomorrow;
  } else if (lower.includes('today')) {
    details.date = new Date();
  } else {
    // Default to today if no date specified
    details.date = new Date();
  }
  
  // Combine date and time
  if (details.date && details.hour !== undefined) {
    details.dateTime = new Date(details.date);
    details.dateTime.setHours(details.hour, details.minutes || 0, 0, 0);
  }
  
  return details;
}

// Check inventory with proper universal pattern
async function checkInventory(organizationId, productName = null) {
  try {
    const filters = productName ? { name: productName } : {};
    const products = await universalQuery(organizationId, SALON_ENTITY_TYPES.PRODUCT, filters);
    
    return {
      success: true,
      inventory: products.map(p => ({
        id: p.id,
        name: p.entity_name,
        currentStock: p.fields.current_stock || 0,
        minStock: p.fields.min_stock || 5,
        maxStock: p.fields.max_stock || 50,
        price: p.fields.price || 0,
        isLow: (p.fields.current_stock || 0) <= (p.fields.min_stock || 5)
      })),
      summary: {
        totalProducts: products.length,
        lowStockItems: products.filter(p => (p.fields.current_stock || 0) <= (p.fields.min_stock || 5)).length
      }
    };
  } catch (error) {
    throw error;
  }
}

// Create appointment with universal pattern
async function createAppointment(organizationId, appointmentDetails) {
  const { clientName, serviceName, dateTime } = appointmentDetails;
  
  try {
    // 1. Find or create client
    let clients = await universalQuery(organizationId, SALON_ENTITY_TYPES.CLIENT, { name: clientName });
    let client = clients[0];
    
    if (!client) {
      // Create new client
      client = await universalCreate(
        organizationId,
        SALON_ENTITY_TYPES.CLIENT,
        clientName,
        SALON_SMART_CODES.CLIENT
      );
    }
    
    // 2. Find service
    const services = await universalQuery(organizationId, SALON_ENTITY_TYPES.SERVICE, { name: serviceName });
    const service = services[0];
    
    if (!service) {
      throw new Error(`Service "${serviceName}" not found. Please check available services.`);
    }
    
    // 3. Find available staff (for now, get any active staff)
    const staff = await universalQuery(organizationId, SALON_ENTITY_TYPES.STAFF, { status: 'active' });
    const availableStaff = staff[0]; // In production, check availability
    
    if (!availableStaff) {
      throw new Error('No staff available for this service.');
    }
    
    // 4. Create appointment transaction
    const { data: appointment, error } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: organizationId,
        transaction_type: 'appointment',
        transaction_code: `APT-${Date.now()}`,
        transaction_date: new Date().toISOString(),
        source_entity_id: client.id,
        target_entity_id: availableStaff.id,
        total_amount: service.fields.price || 0,
        transaction_status: 'confirmed',
        smart_code: SALON_SMART_CODES.APPOINTMENT,
        metadata: {
          appointment_time: dateTime.toISOString(),
          service_id: service.id,
          service_name: service.entity_name,
          duration: service.fields.duration || 60,
          client_name: client.entity_name,
          staff_name: availableStaff.entity_name
        }
      })
      .select()
      .single();
      
    if (error) throw error;
    
    return {
      success: true,
      appointment,
      message: `✅ Appointment booked!\n\n📅 ${dateTime.toLocaleDateString()} at ${dateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}\n👤 Client: ${client.entity_name}\n💇 Service: ${service.entity_name}\n👩‍💼 Staff: ${availableStaff.entity_name}\n💰 Price: $${service.fields.price || 0}`
    };
    
  } catch (error) {
    throw error;
  }
}

// Main handler for salon requests
async function handleSalonRequest(message, organizationId) {
  const lower = message.toLowerCase();
  
  try {
    // Inventory checks
    if (lower.includes('stock') || lower.includes('inventory')) {
      // Extract product name if specified
      let productName = null;
      const productMatch = message.match(/(?:stock|inventory)\s+(?:of\s+|for\s+)?(.+?)(?:\s+level|$)/i);
      if (productMatch) {
        productName = productMatch[1].trim();
      }
      
      return await checkInventory(organizationId, productName);
    }
    
    // Appointment booking
    if (lower.includes('book') || lower.includes('appointment') || lower.includes('schedule')) {
      const details = extractAppointmentDetails(message);
      
      if (!details.clientName) {
        return {
          success: false,
          error: 'Could not identify client name. Please specify who the appointment is for.',
          example: 'Try: "Book Emma for highlights tomorrow at 2pm"'
        };
      }
      
      if (!details.serviceName) {
        return {
          success: false,
          error: 'Could not identify service. Please specify what service is needed.',
          example: 'Try: "Book Emma for highlights tomorrow at 2pm"'
        };
      }
      
      if (!details.dateTime) {
        return {
          success: false,
          error: 'Could not identify appointment time. Please specify when.',
          example: 'Try: "Book Emma for highlights tomorrow at 2pm"'
        };
      }
      
      return await createAppointment(organizationId, details);
    }
    
    // Staff availability
    if (lower.includes('available') || lower.includes('who')) {
      const staff = await universalQuery(organizationId, SALON_ENTITY_TYPES.STAFF, { status: 'active' });
      return {
        success: true,
        staff: staff.map(s => ({
          id: s.id,
          name: s.entity_name,
          specialties: s.fields.specialties || 'All services'
        })),
        message: `👥 ${staff.length} staff members available`
      };
    }
    
    // Revenue and analytics
    if (lower.includes('revenue') || lower.includes('sales') || lower.includes('income')) {
      // Determine period
      let period = 'today';
      if (lower.includes('month')) period = 'this_month';
      else if (lower.includes('week')) period = 'this_week';
      else if (lower.includes('yesterday')) period = 'yesterday';
      
      const salonTools = require('./salon-tools');
      const revenueData = await salonTools.checkRevenue({ organizationId, period });
      
      return {
        success: true,
        revenue: revenueData,
        message: `💰 Revenue for ${period}: $${revenueData.totalRevenue.toFixed(2)}\n📊 Transactions: ${revenueData.transactionCount}\n💵 Average: $${revenueData.averageTransaction.toFixed(2)}`
      };
    }
    
    // Commission calculations
    if (lower.includes('commission')) {
      const salonTools = require('./salon-tools');
      const period = lower.includes('month') ? 'this_month' : 'this_week';
      const staffData = await salonTools.staffPerformance({ organizationId, period });
      
      return {
        success: true,
        commissions: staffData,
        message: `💸 Total Commission (${period}): $${staffData.totalCommission.toFixed(2)}\n👑 Top performer: ${staffData.topPerformer?.name || 'N/A'} - $${staffData.topPerformer?.commission.toFixed(2) || 0}`
      };
    }
    
    // Find quiet times for promotions
    if (lower.includes('quiet') || lower.includes('promotion')) {
      const salonTools = require('./salon-tools');
      const quietData = await salonTools.findQuietTimes({ organizationId });
      
      return {
        success: true,
        quietTimes: quietData,
        message: quietData.recommendation
      };
    }
    
    // Find VIP clients
    if (lower.includes('vip') || lower.includes('important') || lower.includes('premium')) {
      // Query all customers with their dynamic data
      const clients = await universalQuery(organizationId, SALON_ENTITY_TYPES.CLIENT, { status: 'active' });
      
      // Filter VIP clients based on various criteria
      const vipClients = clients.filter(client => {
        // Check VIP status field
        if (client.fields.vip_status === true || client.fields.vip_status === 'true') return true;
        
        // Check loyalty tier
        if (client.fields.loyalty_tier && ['platinum', 'gold', 'vip'].includes(client.fields.loyalty_tier.toLowerCase())) return true;
        
        // Check total spend (if tracked)
        if (client.fields.total_spend && client.fields.total_spend >= 1000) return true;
        
        // Check visit frequency
        if (client.fields.visit_count && client.fields.visit_count >= 10) return true;
        
        return false;
      });
      
      // Get recent transaction data for these clients
      const clientIds = vipClients.map(c => c.id);
      let recentActivity = [];
      
      if (clientIds.length > 0) {
        const { data: transactions } = await supabase
          .from('universal_transactions')
          .select('*')
          .eq('organization_id', organizationId)
          .in('source_entity_id', clientIds)
          .order('transaction_date', { ascending: false })
          .limit(20);
          
        recentActivity = transactions || [];
      }
      
      return {
        success: true,
        vipClients: vipClients.map(client => ({
          id: client.id,
          name: client.entity_name,
          vipStatus: client.fields.vip_status || false,
          loyaltyTier: client.fields.loyalty_tier || 'Standard',
          totalSpend: client.fields.total_spend || 0,
          visitCount: client.fields.visit_count || 0,
          lastVisit: recentActivity.find(t => t.source_entity_id === client.id)?.transaction_date || 'Never',
          preferredServices: client.fields.preferred_services || 'Not specified'
        })),
        message: vipClients.length > 0 
          ? `⭐ Found ${vipClients.length} VIP clients`
          : '📋 No VIP clients found. Consider creating a VIP program!',
        summary: {
          totalVips: vipClients.length,
          recentActivity: recentActivity.length
        }
      };
    }
    
    // Birthday clients
    if (lower.includes('birthday')) {
      const clients = await universalQuery(organizationId, SALON_ENTITY_TYPES.CLIENT, { status: 'active' });
      
      const currentMonth = new Date().getMonth() + 1;
      const birthdayClients = clients.filter(client => {
        if (client.fields.birth_date) {
          const birthMonth = new Date(client.fields.birth_date).getMonth() + 1;
          return birthMonth === currentMonth;
        }
        return false;
      });
      
      return {
        success: true,
        birthdayClients: birthdayClients.map(client => ({
          id: client.id,
          name: client.entity_name,
          birthDate: client.fields.birth_date,
          email: client.fields.email || 'No email',
          phone: client.fields.phone || 'No phone'
        })),
        message: birthdayClients.length > 0
          ? `🎂 ${birthdayClients.length} clients have birthdays this month!`
          : '📅 No birthdays this month',
        marketingTip: birthdayClients.length > 0 
          ? 'Send birthday offers for 20% off any service!'
          : null
      };
    }
    
    // Default response
    return {
      success: false,
      error: 'I didn\'t understand that request.',
      suggestions: [
        'Check hair color stock',
        'Book Emma for highlights tomorrow at 2pm',
        'Who is available now?',
        'Show revenue this month',
        'Calculate commission this week',
        'Find quiet times for promotions',
        'Find VIP clients',
        'Show birthday clients this month'
      ]
    };
    
  } catch (error) {
    console.error('Salon handler error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  handleSalonRequest,
  checkInventory,
  createAppointment,
  extractAppointmentDetails,
  universalQuery,
  universalCreate,
  SALON_ENTITY_TYPES,
  SALON_SMART_CODES
};