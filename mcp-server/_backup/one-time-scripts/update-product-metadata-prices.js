const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const SALON_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0';

async function updateProductMetadataPrices() {
  console.log('💰 Updating product metadata with prices');
  console.log('===================================\n');

  try {
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

    // Define prices for each product code
    const productPrices = {
      'PRD-SHAMPOO': { price: 45, description: 'Professional shampoo for all hair types' },
      'PRD-CONDITIONER': { price: 48, description: 'Nourishing conditioner' },
      'PRD-SERUM': { price: 85, description: 'Hair repair serum' },
      'PRD-SPRAY': { price: 55, description: 'Heat protection spray' },
      'PRD-POLISH-RED': { price: 25, description: 'Long-lasting nail polish' },
      'PRD-FACE-CREAM': { price: 120, description: 'Anti-aging face cream' }
    };

    console.log(`Found ${products.length} products to update\n`);

    // Update each product with price in metadata
    for (const product of products) {
      const priceInfo = productPrices[product.entity_code];
      
      if (priceInfo) {
        // Merge with existing metadata
        const updatedMetadata = {
          ...(product.metadata || {}),
          price: priceInfo.price,
          description: priceInfo.description,
          available: true,
          category: 'RETAIL'
        };

        const { error } = await supabase
          .from('core_entities')
          .update({ metadata: updatedMetadata })
          .eq('id', product.id);

        if (error) {
          console.error(`Error updating ${product.entity_name}:`, error);
        } else {
          console.log(`✅ Updated ${product.entity_name}: AED ${priceInfo.price}`);
        }
      } else {
        // For products without specific prices, use a default
        const defaultPrice = 75;
        const updatedMetadata = {
          ...(product.metadata || {}),
          price: defaultPrice,
          description: product.entity_name,
          available: true,
          category: 'RETAIL'
        };

        const { error } = await supabase
          .from('core_entities')
          .update({ metadata: updatedMetadata })
          .eq('id', product.id);

        if (!error) {
          console.log(`✅ Updated ${product.entity_name}: AED ${defaultPrice} (default)`);
        }
      }
    }

    console.log('\n✨ Product metadata update complete!');

  } catch (error) {
    console.error('Error updating product metadata:', error);
  }
}

updateProductMetadataPrices();