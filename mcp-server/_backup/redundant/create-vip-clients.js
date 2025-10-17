// Create VIP clients with proper dynamic data for testing
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function createVIPClients() {
  const organizationId = '550e8400-e29b-41d4-a716-446655440000';
  
  try {
    // VIP client data
    const vipClients = [
      {
        name: 'Sophia Laurent',
        vipStatus: true,
        loyaltyTier: 'platinum',
        totalSpend: 5200,
        visitCount: 24,
        email: 'sophia.laurent@email.com',
        phone: '+971-50-555-0001',
        birthDate: new Date(1985, 7, 15), // August 15
        preferredServices: 'Balayage, Facial Premium'
      },
      {
        name: 'Isabella Martinez',
        vipStatus: true,
        loyaltyTier: 'gold',
        totalSpend: 3800,
        visitCount: 18,
        email: 'isabella.m@email.com',
        phone: '+971-50-555-0002',
        birthDate: new Date(1990, 7, 22), // August 22
        preferredServices: 'Highlights, Gel Nails'
      },
      {
        name: 'Amelia Chen',
        vipStatus: true,
        loyaltyTier: 'platinum',
        totalSpend: 4500,
        visitCount: 20,
        email: 'amelia.chen@email.com',
        phone: '+971-50-555-0003',
        birthDate: new Date(1988, 3, 10), // April 10
        preferredServices: 'Color, Treatment'
      },
      {
        name: 'Victoria Johnson',
        vipStatus: false,
        loyaltyTier: 'silver',
        totalSpend: 1200,
        visitCount: 12,
        email: 'victoria.j@email.com',
        phone: '+971-50-555-0004',
        birthDate: new Date(1992, 7, 30), // August 30
        preferredServices: 'Haircut, Blowdry'
      }
    ];
    
    for (const clientData of vipClients) {
      // Check if client already exists
      const { data: existing } = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('entity_type', 'customer')
        .eq('entity_name', clientData.name)
        .single();
        
      let clientId;
      
      if (!existing) {
        // Create the client entity
        const { data: entity, error } = await supabase
          .from('core_entities')
          .insert({
            organization_id: organizationId,
            entity_type: 'customer',
            entity_name: clientData.name,
            entity_code: `CLIENT-VIP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            smart_code: 'HERA.SALON.CLIENT.VIP.v1',
            status: 'active'
          })
          .select()
          .single();
          
        if (error) throw error;
        clientId = entity.id;
        console.log(`✅ Created VIP client: ${clientData.name}`);
      } else {
        clientId = existing.id;
        console.log(`✓ VIP client already exists: ${clientData.name}`);
      }
      
      // Add/Update dynamic fields
      const dynamicFields = [
        {
          organization_id: organizationId,
          entity_id: clientId,
          field_name: 'vip_status',
          field_value_boolean: clientData.vipStatus,
          smart_code: 'HERA.SALON.CLIENT.VIP.STATUS.v1'
        },
        {
          organization_id: organizationId,
          entity_id: clientId,
          field_name: 'loyalty_tier',
          field_value_text: clientData.loyaltyTier,
          smart_code: 'HERA.SALON.CLIENT.LOYALTY.TIER.v1'
        },
        {
          organization_id: organizationId,
          entity_id: clientId,
          field_name: 'total_spend',
          field_value_number: clientData.totalSpend,
          smart_code: 'HERA.SALON.CLIENT.SPEND.TOTAL.v1'
        },
        {
          organization_id: organizationId,
          entity_id: clientId,
          field_name: 'visit_count',
          field_value_number: clientData.visitCount,
          smart_code: 'HERA.SALON.CLIENT.VISIT.COUNT.v1'
        },
        {
          organization_id: organizationId,
          entity_id: clientId,
          field_name: 'email',
          field_value_text: clientData.email,
          smart_code: 'HERA.SALON.CLIENT.CONTACT.EMAIL.v1'
        },
        {
          organization_id: organizationId,
          entity_id: clientId,
          field_name: 'phone',
          field_value_text: clientData.phone,
          smart_code: 'HERA.SALON.CLIENT.CONTACT.PHONE.v1'
        },
        {
          organization_id: organizationId,
          entity_id: clientId,
          field_name: 'birth_date',
          field_value_date: clientData.birthDate.toISOString(),
          smart_code: 'HERA.SALON.CLIENT.BIRTH.DATE.v1'
        },
        {
          organization_id: organizationId,
          entity_id: clientId,
          field_name: 'preferred_services',
          field_value_text: clientData.preferredServices,
          smart_code: 'HERA.SALON.CLIENT.PREFERENCES.v1'
        }
      ];
      
      // Delete existing dynamic data for clean update
      await supabase
        .from('core_dynamic_data')
        .delete()
        .eq('entity_id', clientId);
        
      // Insert new dynamic data
      const { error: dynamicError } = await supabase
        .from('core_dynamic_data')
        .insert(dynamicFields);
        
      if (dynamicError) throw dynamicError;
      
      console.log(`   • Added dynamic fields for ${clientData.name}`);
    }
    
    console.log('\n✨ VIP client setup complete!');
    console.log('📊 Summary:');
    console.log(`   • 3 Platinum/Gold VIP clients`);
    console.log(`   • 3 clients with August birthdays`);
    console.log(`   • Total VIP spend: $${vipClients.filter(c => c.vipStatus).reduce((sum, c) => sum + c.totalSpend, 0)}`);
    
  } catch (error) {
    console.error('Error creating VIP clients:', error);
  }
}

createVIPClients();