const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SALON_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';

async function updateServiceMetadataPrices() {
  console.log('💰 Updating service metadata with prices');
  console.log('===================================\n');

  try {
    // Get all services
    const { data: services, error: servicesError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', SALON_ORG_ID)
      .eq('entity_type', 'service')
      .eq('status', 'active');

    if (servicesError) {
      console.error('Error loading services:', servicesError);
      return;
    }

    // Define prices for each service code
    const servicePrices = {
      'SVC-HAIRCUT': { price: 120, description: 'Professional haircut and styling' },
      'SVC-COLOR': { price: 350, description: 'Full hair color treatment' },
      'SVC-TREATMENT': { price: 180, description: 'Deep conditioning and repair treatment' },
      'SVC-MANICURE': { price: 80, description: 'Classic manicure with polish' },
      'SVC-PEDICURE': { price: 100, description: 'Relaxing pedicure with polish' },
      'SVC-FACIAL': { price: 250, description: 'Rejuvenating facial treatment' }
    };

    console.log(`Found ${services.length} services to update\n`);

    // Update each service with price in metadata
    for (const service of services) {
      const priceInfo = servicePrices[service.entity_code];
      
      if (priceInfo) {
        // Merge with existing metadata
        const updatedMetadata = {
          ...(service.metadata || {}),
          price: priceInfo.price,
          description: priceInfo.description,
          available: true,
          popular: ['SVC-HAIRCUT', 'SVC-COLOR'].includes(service.entity_code),
          rating: 4.5 + Math.random() * 0.5 // 4.5 to 5.0
        };

        const { error } = await supabase
          .from('core_entities')
          .update({ metadata: updatedMetadata })
          .eq('id', service.id);

        if (error) {
          console.error(`Error updating ${service.entity_name}:`, error);
        } else {
          console.log(`✅ Updated ${service.entity_name}: AED ${priceInfo.price}`);
        }
      } else {
        // For services without specific prices, use a default
        const defaultPrice = 150;
        const updatedMetadata = {
          ...(service.metadata || {}),
          price: defaultPrice,
          description: service.entity_name,
          available: true
        };

        const { error } = await supabase
          .from('core_entities')
          .update({ metadata: updatedMetadata })
          .eq('id', service.id);

        if (!error) {
          console.log(`✅ Updated ${service.entity_name}: AED ${defaultPrice} (default)`);
        }
      }
    }

    console.log('\n✨ Service metadata update complete!');

  } catch (error) {
    console.error('Error updating service metadata:', error);
  }
}

updateServiceMetadataPrices();