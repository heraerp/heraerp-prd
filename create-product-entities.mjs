#!/usr/bin/env node
/**
 * Create PRODUCT entities for Software Retailer Organization
 * Smart Code: HERA.SOFTWARE.PRODUCT.ENTITY.CREATE.SCRIPT.v1
 * 
 * Uses hera_entities_crud_v1 RPC function to create software product entities
 * with proper dynamic data fields for software retailer use case.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ralywraqvuqgdezttfde.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhbHl3cmFxdnVxZ2RlenR0ZmRlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTM2MzQ3NiwiZXhwIjoyMDc2OTM5NDc2fQ.yG7IzdXluaPiT6mHf3Yu4LV_pyY_S6iHHi7JrR-iA-w';
const TARGET_ORG_ID = 'ff837c4c-95f2-43ac-a498-39597018b10c';
const DEFAULT_USER_ID = 'f7f778da-e629-40f2-a255-38825ed1db37'; // USER_b9789231866a4bca921f9148deb36eac from search results

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// Sample software products for retailer
const softwareProducts = [
  {
    name: 'Microsoft Office 365 Business',
    category: 'productivity',
    version: '2024',
    licenseType: 'subscription',
    price: 99.99,
    platform: 'windows,mac,web',
    vendor: 'Microsoft',
    description: 'Complete office suite with Word, Excel, PowerPoint, and cloud services',
    sku: 'MS-O365-BUS-2024',
    minimumUsers: 1,
    maximumUsers: 300,
    billingCycle: 'monthly'
  },
  {
    name: 'Adobe Creative Cloud All Apps',
    category: 'design',
    version: '2024',
    licenseType: 'subscription',
    price: 599.99,
    platform: 'windows,mac',
    vendor: 'Adobe',
    description: 'Complete creative suite including Photoshop, Illustrator, Premiere Pro, and more',
    sku: 'ADO-CC-ALL-2024',
    minimumUsers: 1,
    maximumUsers: 10,
    billingCycle: 'annual'
  },
  {
    name: 'QuickBooks Pro 2024',
    category: 'accounting',
    version: '2024',
    licenseType: 'perpetual',
    price: 249.99,
    platform: 'windows',
    vendor: 'Intuit',
    description: 'Small business accounting software with invoicing, expense tracking, and reporting',
    sku: 'QB-PRO-2024',
    minimumUsers: 1,
    maximumUsers: 3,
    billingCycle: 'one-time'
  },
  {
    name: 'Salesforce Sales Cloud',
    category: 'crm',
    version: 'Lightning',
    licenseType: 'subscription',
    price: 25.00,
    platform: 'web,mobile',
    vendor: 'Salesforce',
    description: 'Cloud-based CRM solution for sales teams and customer relationship management',
    sku: 'SF-SALES-CLOUD',
    minimumUsers: 1,
    maximumUsers: 1000,
    billingCycle: 'monthly'
  },
  {
    name: 'Slack Business+',
    category: 'communication',
    version: 'Current',
    licenseType: 'subscription',
    price: 12.50,
    platform: 'web,windows,mac,mobile',
    vendor: 'Slack',
    description: 'Team communication and collaboration platform with advanced features',
    sku: 'SLACK-BUS-PLUS',
    minimumUsers: 1,
    maximumUsers: 500,
    billingCycle: 'monthly'
  },
  {
    name: 'Zoom Pro',
    category: 'video-conferencing',
    version: '5.17',
    licenseType: 'subscription',
    price: 14.99,
    platform: 'web,windows,mac,mobile',
    vendor: 'Zoom',
    description: 'Professional video conferencing and webinar solution',
    sku: 'ZOOM-PRO-2024',
    minimumUsers: 1,
    maximumUsers: 9,
    billingCycle: 'monthly'
  }
];

async function createSoftwareProducts() {
  console.log('🚀 Creating PRODUCT entities for Software Retailer Organization');
  console.log(`📋 Target Organization: ${TARGET_ORG_ID}`);
  console.log(`📦 Creating ${softwareProducts.length} software products\n`);

  const results = [];

  for (let i = 0; i < softwareProducts.length; i++) {
    const product = softwareProducts[i];
    console.log(`📍 CREATING PRODUCT ${i + 1}/${softwareProducts.length}: ${product.name}`);
    console.log('======================================================');

    try {
      // Generate Smart Code for this product
      const smartCode = `HERA.SOFTWARE.PRODUCT.${product.category.toUpperCase()}.${product.licenseType.toUpperCase()}.v1`;
      console.log(`   Smart Code: ${smartCode}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Price: $${product.price}`);
      console.log(`   License: ${product.licenseType}`);

      const createResult = await supabase.rpc('hera_entities_crud_v1', {
        p_action: 'CREATE',
        p_actor_user_id: DEFAULT_USER_ID,
        p_organization_id: TARGET_ORG_ID,
        p_entity: {
          entity_type: 'PRODUCT',
          entity_name: product.name,
          entity_code: product.sku,
          entity_description: product.description,
          smart_code: smartCode
        },
        p_dynamic: {
          // Core product information
          category: {
            field_type: 'text',
            field_value_text: product.category,
            smart_code: 'HERA.SOFTWARE.PRODUCT.FIELD.CATEGORY.v1'
          },
          version: {
            field_type: 'text',
            field_value_text: product.version,
            smart_code: 'HERA.SOFTWARE.PRODUCT.FIELD.VERSION.v1'
          },
          license_type: {
            field_type: 'text',
            field_value_text: product.licenseType,
            smart_code: 'HERA.SOFTWARE.PRODUCT.FIELD.LICENSE_TYPE.v1'
          },
          price: {
            field_type: 'number',
            field_value_number: product.price,
            smart_code: 'HERA.SOFTWARE.PRODUCT.FIELD.PRICE.v1'
          },
          platform: {
            field_type: 'text',
            field_value_text: product.platform,
            smart_code: 'HERA.SOFTWARE.PRODUCT.FIELD.PLATFORM.v1'
          },
          vendor: {
            field_type: 'text',
            field_value_text: product.vendor,
            smart_code: 'HERA.SOFTWARE.PRODUCT.FIELD.VENDOR.v1'
          },
          
          // Business information
          sku: {
            field_type: 'text',
            field_value_text: product.sku,
            smart_code: 'HERA.SOFTWARE.PRODUCT.FIELD.SKU.v1'
          },
          minimum_users: {
            field_type: 'number',
            field_value_number: product.minimumUsers,
            smart_code: 'HERA.SOFTWARE.PRODUCT.FIELD.MIN_USERS.v1'
          },
          maximum_users: {
            field_type: 'number',
            field_value_number: product.maximumUsers,
            smart_code: 'HERA.SOFTWARE.PRODUCT.FIELD.MAX_USERS.v1'
          },
          billing_cycle: {
            field_type: 'text',
            field_value_text: product.billingCycle,
            smart_code: 'HERA.SOFTWARE.PRODUCT.FIELD.BILLING_CYCLE.v1'
          },
          
          // Metadata
          status: {
            field_type: 'text',
            field_value_text: 'active',
            smart_code: 'HERA.SOFTWARE.PRODUCT.FIELD.STATUS.v1'
          },
          featured: {
            field_type: 'boolean',
            field_value_boolean: i < 3, // First 3 products are featured
            smart_code: 'HERA.SOFTWARE.PRODUCT.FIELD.FEATURED.v1'
          }
        },
        p_relationships: [],
        p_options: {}
      });

      if (createResult.error) {
        console.error('   ❌ ERROR:', createResult.error);
        results.push({ product: product.name, status: 'failed', error: createResult.error });
      } else {
        // Check if there's an error in the data field
        if (createResult.data?.error) {
          console.error('   ❌ RPC ERROR:', createResult.data.error);
          results.push({ product: product.name, status: 'failed', error: createResult.data.error });
        } else {
          const entityId = createResult.data?.items?.[0]?.id || 
                          createResult.data?.entity_id ||
                          createResult.data?.id ||
                          'ID not found in response';
          console.log(`   ✅ SUCCESS - Entity ID: ${entityId}`);
          results.push({ product: product.name, status: 'success', entityId });
        }
      }

      console.log(''); // Empty line for readability

    } catch (error) {
      console.error(`   💥 EXCEPTION:`, error);
      results.push({ product: product.name, status: 'exception', error: error.message });
    }
  }

  console.log('\n🎯 PRODUCT CREATION SUMMARY');
  console.log('============================');
  
  const successful = results.filter(r => r.status === 'success');
  const failed = results.filter(r => r.status !== 'success');
  
  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}`);
  
  if (successful.length > 0) {
    console.log('\n✅ Successfully Created Products:');
    successful.forEach(r => {
      console.log(`   - ${r.product} (${r.entityId})`);
    });
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
    // Query created products
    const { data: createdProducts, error: queryError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_code, smart_code, created_at')
      .eq('entity_type', 'PRODUCT')
      .eq('organization_id', TARGET_ORG_ID)
      .order('created_at', { ascending: false })
      .limit(10);

    if (queryError) {
      console.error('❌ Query Error:', queryError);
    } else {
      console.log(`📦 Found ${createdProducts.length} PRODUCT entities in target organization:`);
      createdProducts.forEach(p => {
        console.log(`   - ${p.entity_name} (${p.entity_code}) - ${p.smart_code}`);
      });
    }
  } catch (error) {
    console.error('💥 Verification Error:', error);
  }

  console.log('\n🎉 PRODUCT CREATION COMPLETE!');
  console.log('==============================');
  console.log('Next Steps:');
  console.log('1. Verify products in HERA dashboard');
  console.log('2. Create universal entity generator frontend');
  console.log('3. Test with additional entity types');
  console.log(`4. Organization ID: ${TARGET_ORG_ID}`);
}

createSoftwareProducts();