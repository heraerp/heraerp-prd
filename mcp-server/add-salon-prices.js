const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SALON_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';

async function addSalonPrices() {
  console.log('💰 Adding prices to Hair Talkz Salon');
  console.log('================================\n');

  try {
    // Get the price list
    const { data: priceList, error: plError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', SALON_ORG_ID)
      .eq('entity_type', 'pricelist')
      .eq('entity_code', 'PL-STANDARD')
      .single();

    if (plError || !priceList) {
      console.error('Could not find price list:', plError);
      return;
    }

    console.log(`✅ Found price list: ${priceList.entity_name} (${priceList.id})\n`);

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

    // Get all products
    const { data: products, error: productsError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', SALON_ORG_ID)
      .eq('entity_type', 'product')
      .eq('status', 'active');

    if (productsError) {
      console.error('Error loading products:', productsError);
      return;
    }

    // Define prices
    const servicePrices = {
      'SVC-HAIRCUT': 120,
      'SVC-COLOR': 350,
      'SVC-TREATMENT': 180,
      'SVC-MANICURE': 80,
      'SVC-PEDICURE': 100,
      'SVC-FACIAL': 250
    };

    const productPrices = {
      'PRD-SHAMPOO': 45,
      'PRD-CONDITIONER': 48,
      'PRD-SERUM': 85,
      'PRD-SPRAY': 55,
      'PRD-POLISH-RED': 25,
      'PRD-FACE-CREAM': 120
    };

    // Add service prices
    console.log('Adding service prices...');
    for (const service of services) {
      const price = servicePrices[service.entity_code];
      if (price) {
        const { error } = await supabase
          .from('core_dynamic_data')
          .insert({
            organization_id: SALON_ORG_ID,
            entity_id: priceList.id,
            field_name: `price_service_${service.id}`,
            field_value_number: price,
            field_type: 'number',
            smart_code: 'HERA.SALON.PRICE.ITEM.SERVICE.V1'
          });

        if (error) {
          console.error(`Error adding price for ${service.entity_name}:`, error);
        } else {
          console.log(`✅ Added price: ${service.entity_name} - AED ${price}`);
        }
      }
    }

    // Add product prices
    console.log('\nAdding product prices...');
    for (const product of products) {
      const price = productPrices[product.entity_code];
      if (price) {
        const { error } = await supabase
          .from('core_dynamic_data')
          .insert({
            organization_id: SALON_ORG_ID,
            entity_id: priceList.id,
            field_name: `price_product_${product.id}`,
            field_value_number: price,
            field_type: 'number',
            smart_code: 'HERA.SALON.PRICE.ITEM.PRODUCT.V1'
          });

        if (error) {
          console.error(`Error adding price for ${product.entity_name}:`, error);
        } else {
          console.log(`✅ Added price: ${product.entity_name} - AED ${price}`);
        }
      }
    }

    console.log('\n✨ Price setup complete!');

  } catch (error) {
    console.error('Error setting up prices:', error);
  }
}

addSalonPrices();