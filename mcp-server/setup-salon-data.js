// Setup sample salon data for testing
require('dotenv').config();
const universalHandler = require('./hera-universal-salon-handler');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function setupSalonData() {
  const organizationId = '550e8400-e29b-41d4-a716-446655440000'; // Dubai Luxury Salon
  
  try {
    // Create staff members
    const staffMembers = [
      { name: 'Emma Johnson', specialties: 'Color & Highlights' },
      { name: 'Sarah Williams', specialties: 'Cuts & Styling' },
      { name: 'Maria Garcia', specialties: 'Treatments & Extensions' }
    ];
    
    for (const staff of staffMembers) {
      const existing = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('entity_type', 'employee')
        .eq('entity_name', staff.name)
        .single();
        
      if (!existing.data) {
        await supabase
          .from('core_entities')
          .insert({
            organization_id: organizationId,
            entity_type: 'employee',
            entity_name: staff.name,
            entity_code: `STAFF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            smart_code: universalHandler.SALON_SMART_CODES.STAFF,
            status: 'active'
          });
        console.log(`✅ Created staff: ${staff.name}`);
      }
    }
    
    // Create services
    const services = [
      { name: 'Highlights', price: 120, duration: 120 },
      { name: 'Haircut', price: 60, duration: 60 },
      { name: 'Color', price: 95, duration: 90 },
      { name: 'Blowdry', price: 45, duration: 45 },
      { name: 'Treatment', price: 80, duration: 60 }
    ];
    
    for (const service of services) {
      const existing = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('entity_type', 'salon_service')
        .eq('entity_name', service.name)
        .single();
        
      if (!existing.data) {
        const { data: entity } = await supabase
          .from('core_entities')
          .insert({
            organization_id: organizationId,
            entity_type: 'salon_service',
            entity_name: service.name,
            entity_code: `SERVICE-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            smart_code: universalHandler.SALON_SMART_CODES.SERVICE,
            status: 'active'
          })
          .select()
          .single();
          
        // Add price and duration
        if (entity) {
          await supabase
            .from('core_dynamic_data')
            .insert([
              {
                organization_id: organizationId,
                entity_id: entity.id,
                field_name: 'price',
                field_value_number: service.price,
                smart_code: universalHandler.SALON_SMART_CODES.PRICE
              },
              {
                organization_id: organizationId,
                entity_id: entity.id,
                field_name: 'duration',
                field_value_number: service.duration,
                smart_code: universalHandler.SALON_SMART_CODES.DURATION
              }
            ]);
        }
        console.log(`✅ Created service: ${service.name} - $${service.price}`);
      }
    }
    
    // Create products for inventory
    const products = [
      { name: 'Hair Color - Blonde', stock: 15, min: 10 },
      { name: 'Hair Color - Brown', stock: 20, min: 10 },
      { name: 'Hair Color - Black', stock: 5, min: 10 },
      { name: 'Toner - Blonde', stock: 8, min: 5 },
      { name: 'Shampoo - Professional', stock: 25, min: 20 },
      { name: 'Conditioner - Professional', stock: 30, min: 20 }
    ];
    
    for (const product of products) {
      const existing = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('entity_type', 'product')
        .eq('entity_name', product.name)
        .single();
        
      if (!existing.data) {
        const { data: entity } = await supabase
          .from('core_entities')
          .insert({
            organization_id: organizationId,
            entity_type: 'product',
            entity_name: product.name,
            entity_code: `PROD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            smart_code: universalHandler.SALON_SMART_CODES.PRODUCT,
            status: 'active'
          })
          .select()
          .single();
          
        // Add stock levels
        if (entity) {
          await supabase
            .from('core_dynamic_data')
            .insert([
              {
                organization_id: organizationId,
                entity_id: entity.id,
                field_name: 'current_stock',
                field_value_number: product.stock,
                smart_code: universalHandler.SALON_SMART_CODES.STOCK_LEVEL
              },
              {
                organization_id: organizationId,
                entity_id: entity.id,
                field_name: 'min_stock',
                field_value_number: product.min,
                smart_code: universalHandler.SALON_SMART_CODES.STOCK_LEVEL
              }
            ]);
        }
        console.log(`✅ Created product: ${product.name} - Stock: ${product.stock}`);
      }
    }
    
    console.log('\n✨ Salon data setup complete!');
    
  } catch (error) {
    console.error('Setup error:', error);
  }
}

// Run setup if called directly
if (require.main === module) {
  setupSalonData();
}

module.exports = { setupSalonData };