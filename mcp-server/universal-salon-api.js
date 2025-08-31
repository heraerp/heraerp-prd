// Universal API for Salon operations - following HERA DNA principles
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Query entities using universal pattern
async function queryEntities(organizationId, entityType, filters = {}) {
  let query = supabase
    .from('core_entities')
    .select('*, core_dynamic_data(*)')
    .eq('organization_id', organizationId)
    .eq('entity_type', entityType);

  // Apply additional filters
  if (filters.name) {
    query = query.ilike('entity_name', `%${filters.name}%`);
  }
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Process dynamic data into a more usable format
  return data?.map(entity => {
    const dynamicFields = {};
    (entity.core_dynamic_data || []).forEach(field => {
      dynamicFields[field.field_name] = field.field_value_text || field.field_value_number || field.field_value_boolean;
    });
    return {
      ...entity,
      dynamicFields,
      core_dynamic_data: undefined // Remove the raw array
    };
  }) || [];
}

// Create entity with dynamic fields
async function createEntity(organizationId, entityType, entityName, smartCode, dynamicFields = {}) {
  // Create the entity
  const { data: entity, error: entityError } = await supabase
    .from('core_entities')
    .insert({
      organization_id: organizationId,
      entity_type: entityType,
      entity_name: entityName,
      entity_code: `${entityType.toUpperCase()}-${Date.now()}`,
      smart_code: smartCode,
      status: 'active'
    })
    .select()
    .single();

  if (entityError) throw entityError;

  // Add dynamic fields if any
  if (Object.keys(dynamicFields).length > 0) {
    const fields = Object.entries(dynamicFields).map(([fieldName, value]) => ({
      organization_id: organizationId,
      entity_id: entity.id,
      field_name: fieldName,
      field_value_text: typeof value === 'string' ? value : null,
      field_value_number: typeof value === 'number' ? value : null,
      field_value_boolean: typeof value === 'boolean' ? value : null,
      smart_code: `${smartCode}.${fieldName.toUpperCase()}`
    }));

    const { error: fieldsError } = await supabase
      .from('core_dynamic_data')
      .insert(fields);

    if (fieldsError) throw fieldsError;
  }

  return entity;
}

// Query transactions
async function queryTransactions(organizationId, transactionType, filters = {}) {
  let query = supabase
    .from('universal_transactions')
    .select('*, universal_transaction_lines(*)')
    .eq('organization_id', organizationId)
    .eq('transaction_type', transactionType);

  // Always use transaction_date for date filtering
  if (filters.dateFrom) {
    query = query.gte('transaction_date', filters.dateFrom);
  }
  if (filters.dateTo) {
    query = query.lte('transaction_date', filters.dateTo);
  }
  if (filters.entityId) {
    query = query.or(`source_entity_id.eq.${filters.entityId},target_entity_id.eq.${filters.entityId}`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

// Create transaction with lines
async function createTransaction(organizationId, transactionType, smartCode, details) {
  const { data: transaction, error: txnError } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: organizationId,
      transaction_type: transactionType,
      transaction_code: `TXN-${Date.now()}`,
      smart_code: smartCode,
      transaction_date: details.date || new Date().toISOString(),
      source_entity_id: details.fromEntityId,
      target_entity_id: details.toEntityId,
      total_amount: details.totalAmount || 0,
      metadata: details.metadata || {},
      transaction_status: details.status || 'pending'
    })
    .select()
    .single();

  if (txnError) throw txnError;

  // Add transaction lines if provided
  if (details.lines && details.lines.length > 0) {
    const lines = details.lines.map((line, index) => ({
      transaction_id: transaction.id,
      line_entity_id: line.entityId,
      line_number: index + 1,
      quantity: line.quantity || 1,
      unit_price: line.unitPrice || 0,
      line_amount: line.amount || 0,
      smart_code: `${smartCode}.LINE`,
      metadata: line.metadata || {}
    }));

    const { error: linesError } = await supabase
      .from('universal_transaction_lines')
      .insert(lines);

    if (linesError) throw linesError;
  }

  return transaction;
}

// Helper to get inventory with stock levels
async function getInventoryWithStock(organizationId, productName = null) {
  const filters = productName ? { name: productName } : {};
  const products = await queryEntities(organizationId, 'product', filters);
  
  return products.map(product => ({
    id: product.id,
    name: product.entity_name,
    code: product.entity_code,
    currentStock: product.dynamicFields.current_stock || 0,
    minStock: product.dynamicFields.min_stock || 5,
    maxStock: product.dynamicFields.max_stock || 50,
    price: product.dynamicFields.price || 0,
    isLow: (product.dynamicFields.current_stock || 0) <= (product.dynamicFields.min_stock || 5)
  }));
}

// Helper to get available staff
async function getAvailableStaff(organizationId, dateTime = new Date()) {
  const staff = await queryEntities(organizationId, 'employee', { status: 'active' });
  
  // Get appointments for the time period
  const startTime = new Date(dateTime);
  const endTime = new Date(dateTime);
  endTime.setHours(endTime.getHours() + 1);
  
  const appointments = await queryTransactions(organizationId, 'appointment', {
    dateFrom: startTime.toISOString(),
    dateTo: endTime.toISOString()
  });
  
  // Mark staff as available or busy
  return staff.map(member => {
    const hasAppointment = appointments.some(apt => apt.target_entity_id === member.id);
    return {
      ...member,
      isAvailable: !hasAppointment
    };
  });
}

module.exports = {
  queryEntities,
  createEntity,
  queryTransactions,
  createTransaction,
  getInventoryWithStock,
  getAvailableStaff
};