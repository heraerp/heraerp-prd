#!/usr/bin/env node
/**
 * Create PC Retail Shop Product using API v2 and hera_entities_crud_v1
 * Smart Code: HERA.RETAIL.PC.PRODUCT.CREATE.DEMO.v1
 * 
 * Demonstrates creating a computer product with comprehensive dynamic data
 * for a PC retail shop use case
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ralywraqvuqgdezttfde.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbHl3cmFxdnVxZ2RlenR0ZmRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM2MzQ3NiwiZXhwIjoyMDc2OTM5NDc2fQ.yG7IzdXluaPiT6mHf3Yu4LV_pyY_S6iHHi7JrR-iA-w';
const RETAIL_ORG_ID = 'ff837c4c-95f2-43ac-a498-39597018b10c'; // HERA Retail Demo
const RETAIL_USER_ID = 'f7f778da-e629-40f2-a255-38825ed1db37'; // Working retail user

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// PC Products for retail shop
const pcProducts = [
  {
    name: 'Dell OptiPlex 7090 Desktop',
    category: 'desktop',
    brand: 'Dell',
    model: 'OptiPlex 7090',
    sku: 'DELL-7090-DT-001',
    price: 899.99,
    cost: 675.00,
    description: 'Business desktop computer with Intel i5 processor, ideal for office work and productivity tasks',
    
    // Technical specifications
    cpu: 'Intel Core i5-11500 6-Core 2.7GHz',
    ram: '8GB DDR4',
    storage: '256GB SSD',
    graphics: 'Intel UHD Graphics 750',
    os: 'Windows 11 Pro',
    ports: 'USB 3.2, HDMI, DisplayPort, Ethernet',
    
    // Physical specs
    dimensions: '11.5 x 3.7 x 11.1 inches',
    weight: '11.68 lbs',
    color: 'Black',
    
    // Business data
    vendor: 'Dell Technologies',
    vendor_sku: 'N006O7090SFF',
    warranty: '3 years',
    stock_level: 15,
    reorder_point: 5,
    supplier_lead_time: '7-10 days'
  },
  {
    name: 'HP Pavilion Gaming Laptop 15-dk2',
    category: 'laptop',
    brand: 'HP',
    model: 'Pavilion Gaming 15-dk2',
    sku: 'HP-PAV-15DK2-001',
    price: 1299.99,
    cost: 950.00,
    description: 'High-performance gaming laptop with dedicated graphics, perfect for gaming and content creation',
    
    // Technical specifications  
    cpu: 'Intel Core i7-11370H 4-Core 3.3GHz',
    ram: '16GB DDR4',
    storage: '512GB NVMe SSD',
    graphics: 'NVIDIA GeForce RTX 3050 4GB',
    os: 'Windows 11 Home',
    display: '15.6" Full HD 144Hz',
    
    // Physical specs
    dimensions: '14.09 x 10.12 x 0.93 inches',
    weight: '5.07 lbs',
    color: 'Shadow Black',
    battery: '52.5 Wh, up to 8 hours',
    
    // Business data
    vendor: 'HP Inc.',
    vendor_sku: '15-dk2075wm',
    warranty: '1 year',
    stock_level: 8,
    reorder_point: 3,
    supplier_lead_time: '5-7 days'
  },
  {
    name: 'ASUS ROG Strix B550-F Gaming Motherboard',
    category: 'component',
    brand: 'ASUS',
    model: 'ROG STRIX B550-F',
    sku: 'ASUS-B550F-MB-001',
    price: 189.99,
    cost: 135.00,
    description: 'ATX gaming motherboard with AMD B550 chipset, perfect for Ryzen processors and gaming builds',
    
    // Technical specifications
    socket: 'AM4',
    chipset: 'AMD B550',
    memory_support: 'DDR4-4400+ (OC)',
    expansion_slots: '2x PCIe 4.0 x16, 2x PCIe 3.0 x1',
    storage: '2x M.2, 6x SATA 6Gb/s',
    networking: 'Intel 2.5Gb Ethernet, WiFi 6',
    
    // Physical specs  
    form_factor: 'ATX',
    dimensions: '12 x 9.6 inches',
    weight: '2.18 lbs',
    
    // Business data
    vendor: 'ASUSTeK Computer Inc.',
    vendor_sku: 'ROG STRIX B550-F GAMING',
    warranty: '3 years',
    stock_level: 12,
    reorder_point: 4,
    supplier_lead_time: '3-5 days'
  },
  {
    name: 'Samsung 27" Odyssey G7 Gaming Monitor',
    category: 'monitor',
    brand: 'Samsung',
    model: 'Odyssey G7 C27G75T',
    sku: 'SAM-G7-27-001',
    price: 599.99,
    cost: 420.00,
    description: 'Curved 27-inch QLED gaming monitor with 240Hz refresh rate and 1ms response time',
    
    // Technical specifications
    screen_size: '27 inches',
    resolution: '2560 x 1440 (QHD)',
    panel_type: 'VA QLED',
    refresh_rate: '240Hz',
    response_time: '1ms (GTG)',
    curvature: '1000R',
    brightness: '600 cd/m²',
    contrast_ratio: '2500:1',
    
    // Connectivity
    inputs: '2x HDMI 2.1, 1x DisplayPort 1.4, 2x USB 3.0',
    
    // Physical specs
    dimensions: '24.7 x 21.5 x 11.4 inches (with stand)',
    weight: '17.6 lbs',
    
    // Business data  
    vendor: 'Samsung Electronics',
    vendor_sku: 'LC27G75TQSUXEN',
    warranty: '3 years',
    stock_level: 6,
    reorder_point: 2,
    supplier_lead_time: '2-4 days'
  },
  {
    name: 'Logitech MX Master 3S Wireless Mouse',
    category: 'accessory',
    brand: 'Logitech',
    model: 'MX Master 3S',
    sku: 'LOGI-MX3S-001',
    price: 99.99,
    cost: 65.00,
    description: 'Premium wireless mouse with ultra-precise scrolling and multi-device connectivity',
    
    // Technical specifications
    connectivity: 'Bluetooth, 2.4GHz wireless, USB-C',
    sensor: 'Darkfield high precision (4000 DPI)',
    battery: 'Rechargeable Li-Po, 70 days on full charge',
    buttons: '7 buttons including scroll wheel',
    compatibility: 'Windows, macOS, Linux, iPadOS',
    
    // Physical specs
    dimensions: '4.9 x 3.3 x 2.0 inches',
    weight: '5.0 oz',
    color: 'Graphite',
    
    // Business data
    vendor: 'Logitech International',
    vendor_sku: '910-006556',
    warranty: '1 year',
    stock_level: 25,
    reorder_point: 10,
    supplier_lead_time: '1-2 days'
  }
];

async function createPCRetailProducts() {
  console.log('🖥️ Creating PC Retail Shop Products using API v2 and hera_entities_crud_v1');
  console.log(`📋 Target Organization: ${RETAIL_ORG_ID} (HERA Retail Demo)`);
  console.log(`👤 Actor User: ${RETAIL_USER_ID}`);
  console.log(`💻 Creating ${pcProducts.length} PC retail products\n`);

  const results = [];

  for (let i = 0; i < pcProducts.length; i++) {
    const product = pcProducts[i];
    console.log(`📍 CREATING PC PRODUCT ${i + 1}/${pcProducts.length}: ${product.name}`);
    console.log('='.repeat(70));

    try {
      // Generate Smart Code for this PC product  
      const smartCode = `HERA.RETAIL.PC.PRODUCT.${product.category.toUpperCase()}.v1`;
      console.log(`   🏷️  Product: ${product.name}`);
      console.log(`   🔖 SKU: ${product.sku}`);
      console.log(`   💰 Price: $${product.price} (Cost: $${product.cost})`);
      console.log(`   📦 Category: ${product.category}`);
      console.log(`   🧬 Smart Code: ${smartCode}`);

      // Call hera_entities_crud_v1 RPC function
      const createResult = await supabase.rpc('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: RETAIL_USER_ID,
        p_organization_id: RETAIL_ORG_ID,
        p_entity: {
          entity_type: 'PRODUCT',
          entity_name: product.name,
          entity_code: product.sku,
          entity_description: product.description,
          smart_code: smartCode
        },
        p_dynamic: {
          // Basic product info
          category: {
            field_type: 'text',
            field_value_text: product.category,
            smart_code: 'HERA.RETAIL.PC.PRODUCT.FIELD.CATEGORY.v1'
          },
          brand: {
            field_type: 'text',
            field_value_text: product.brand,
            smart_code: 'HERA.RETAIL.PC.PRODUCT.FIELD.BRAND.v1'
          },
          model: {
            field_type: 'text',
            field_value_text: product.model,
            smart_code: 'HERA.RETAIL.PC.PRODUCT.FIELD.MODEL.v1'
          },
          sku: {
            field_type: 'text',
            field_value_text: product.sku,
            smart_code: 'HERA.RETAIL.PC.PRODUCT.FIELD.SKU.v1'
          },
          
          // Pricing
          price: {
            field_type: 'number',
            field_value_number: product.price,
            smart_code: 'HERA.RETAIL.PC.PRODUCT.FIELD.PRICE.v1'
          },
          cost: {
            field_type: 'number',
            field_value_number: product.cost,
            smart_code: 'HERA.RETAIL.PC.PRODUCT.FIELD.COST.v1'
          },
          margin: {
            field_type: 'number',
            field_value_number: ((product.price - product.cost) / product.price * 100),
            smart_code: 'HERA.RETAIL.PC.PRODUCT.FIELD.MARGIN.v1'
          },
          
          // Technical specifications
          cpu: {
            field_type: 'text',
            field_value_text: product.cpu || 'N/A',
            smart_code: 'HERA.RETAIL.PC.PRODUCT.FIELD.CPU.v1'
          },
          ram: {
            field_type: 'text',
            field_value_text: product.ram || 'N/A',
            smart_code: 'HERA.RETAIL.PC.PRODUCT.FIELD.RAM.v1'
          },
          storage: {
            field_type: 'text',
            field_value_text: product.storage || 'N/A',
            smart_code: 'HERA.RETAIL.PC.PRODUCT.FIELD.STORAGE.v1'
          },
          graphics: {
            field_type: 'text',
            field_value_text: product.graphics || 'N/A',
            smart_code: 'HERA.RETAIL.PC.PRODUCT.FIELD.GRAPHICS.v1'
          },
          
          // Physical specifications
          dimensions: {
            field_type: 'text',
            field_value_text: product.dimensions || 'N/A',
            smart_code: 'HERA.RETAIL.PC.PRODUCT.FIELD.DIMENSIONS.v1'
          },
          weight: {
            field_type: 'text',
            field_value_text: product.weight || 'N/A',
            smart_code: 'HERA.RETAIL.PC.PRODUCT.FIELD.WEIGHT.v1'
          },
          color: {
            field_type: 'text',
            field_value_text: product.color || 'N/A',
            smart_code: 'HERA.RETAIL.PC.PRODUCT.FIELD.COLOR.v1'
          },
          
          // Business data
          vendor: {
            field_type: 'text',
            field_value_text: product.vendor,
            smart_code: 'HERA.RETAIL.PC.PRODUCT.FIELD.VENDOR.v1'
          },
          vendor_sku: {
            field_type: 'text',
            field_value_text: product.vendor_sku,
            smart_code: 'HERA.RETAIL.PC.PRODUCT.FIELD.VENDOR_SKU.v1'
          },
          warranty: {
            field_type: 'text',
            field_value_text: product.warranty,
            smart_code: 'HERA.RETAIL.PC.PRODUCT.FIELD.WARRANTY.v1'
          },
          
          // Inventory management
          stock_level: {
            field_type: 'number',
            field_value_number: product.stock_level,
            smart_code: 'HERA.RETAIL.PC.PRODUCT.FIELD.STOCK_LEVEL.v1'
          },
          reorder_point: {
            field_type: 'number',
            field_value_number: product.reorder_point,
            smart_code: 'HERA.RETAIL.PC.PRODUCT.FIELD.REORDER_POINT.v1'
          },
          supplier_lead_time: {
            field_type: 'text',
            field_value_text: product.supplier_lead_time,
            smart_code: 'HERA.RETAIL.PC.PRODUCT.FIELD.LEAD_TIME.v1'
          },
          
          // Status and metadata
          status: {
            field_type: 'text',
            field_value_text: 'active',
            smart_code: 'HERA.RETAIL.PC.PRODUCT.FIELD.STATUS.v1'
          },
          featured: {
            field_type: 'boolean',
            field_value_boolean: i < 2, // First 2 products are featured
            smart_code: 'HERA.RETAIL.PC.PRODUCT.FIELD.FEATURED.v1'
          }
        },
        p_relationships: [],
        p_options: {}
      });

      // Handle response
      if (createResult.error) {
        console.error('   ❌ Supabase Error:', createResult.error);
        results.push({ product: product.name, status: 'failed', error: createResult.error });
      } else if (createResult.data?.error) {
        console.error('   ❌ RPC Error:', createResult.data.error);
        results.push({ product: product.name, status: 'failed', error: createResult.data.error });
      } else {
        const entityId = createResult.data?.items?.[0]?.id || 
                        createResult.data?.entity_id ||
                        createResult.data?.id;
        console.log(`   ✅ SUCCESS - Entity ID: ${entityId}`);
        console.log(`   📊 Margin: ${((product.price - product.cost) / product.price * 100).toFixed(1)}%`);
        console.log(`   📦 Stock: ${product.stock_level} units`);
        results.push({ product: product.name, status: 'success', entityId, sku: product.sku, price: product.price });
      }

      console.log(''); // Empty line for readability

    } catch (error) {
      console.error(`   💥 EXCEPTION:`, error);
      results.push({ product: product.name, status: 'exception', error: error.message });
    }
  }

  console.log('\n🎯 PC RETAIL PRODUCT CREATION SUMMARY');
  console.log('=====================================');
  
  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status !== 'success');
  
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  
  if (successful.length > 0) {
    console.log('\n✅ Successfully Created PC Products:');
    successful.forEach(r => {
      console.log(`   - ${r.product} (${r.sku}) - $${r.price} - ID: ${r.entityId}`);
    });
    
    console.log('\n💰 Total Inventory Value:');
    const totalValue = successful.reduce((sum, r) => sum + r.price, 0);
    console.log(`   💵 Total Retail Value: $${totalValue.toFixed(2)}`);
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed Products:');
    failed.forEach(r => {
      console.log(`   - ${r.product}: ${r.error}`);
    });
  }

  console.log('\n📊 DATABASE VERIFICATION');
  console.log('========================');
  
  try {
    // Query created PC products
    const { data: createdProducts, error: queryError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_code, smart_code, created_at')
      .eq('entity_type', 'PRODUCT')
      .eq('organization_id', RETAIL_ORG_ID)
      .ilike('smart_code', '%PC.PRODUCT%')
      .order('created_at', { ascending: false })
      .limit(10);

    if (queryError) {
      console.error('❌ Query Error:', queryError);
    } else {
      console.log(`🖥️ Found ${createdProducts.length} PC PRODUCT entities in retail organization:`);
      createdProducts.forEach(p => {
        console.log(`   - ${p.entity_name}`);
        console.log(`     SKU: ${p.entity_code}`);
        console.log(`     Smart Code: ${p.smart_code}`);
        console.log(`     Created: ${new Date(p.created_at).toLocaleString()}`);
        console.log('');
      });
    }
    
    // Check dynamic data for one product
    if (createdProducts.length > 0) {
      console.log('📋 Sample Dynamic Data (First Product):');
      console.log('======================================');
      
      const { data: dynamicData, error: dynamicError } = await supabase
        .from('core_dynamic_data')
        .select('field_name, field_value_text, field_value_number, field_value_boolean')
        .eq('entity_id', createdProducts[0].id)
        .order('field_name');
        
      if (!dynamicError && dynamicData) {
        dynamicData.forEach(field => {
          const value = field.field_value_text || field.field_value_number || field.field_value_boolean;
          console.log(`   ${field.field_name}: ${value}`);
        });
      }
    }
    
  } catch (error) {
    console.error('💥 Verification Error:', error);
  }

  console.log('\n🎉 PC RETAIL PRODUCT CREATION COMPLETE!');
  console.log('========================================');
  console.log('🖥️ Products Created: Desktop, Laptop, Motherboard, Monitor, Mouse');
  console.log('📊 Complete with technical specs, pricing, and inventory data');
  console.log('🔍 Ready for retail operations and sales tracking');
  console.log('🛒 Perfect for PC retail shop management');
  console.log(`\n🏢 Organization: HERA Retail Demo (${RETAIL_ORG_ID})`);
  console.log('🌐 View in Universal Entity Generator: http://localhost:3000/universal-entity-generator');
}

createPCRetailProducts();