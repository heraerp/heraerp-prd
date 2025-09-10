const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDemoFurnitureOrganization() {
  try {
    // Create demo furniture organization similar to salon demo
    const { data: demoOrg, error: demoError } = await supabase
      .from('core_organizations')
      .insert({
        organization_name: 'Kerala Furniture Works (Demo)',
        organization_code: 'DEMO-FURNITURE',
        organization_type: 'furniture_manufacturer',
        industry_classification: 'furniture',
        ai_insights: { 
          purpose: 'Demo furniture manufacturer for showcasing HERA capabilities',
          smart_code_namespace: 'HERA.MANUFACTURING.FURNITURE'
        },
        settings: { 
          public_access: true,
          demo_organization: true,
          location: 'Cochin, Kerala, India',
          specialization: 'Premium wooden furniture - dining sets, bedroom furniture, office furniture'
        },
        status: 'active'
      })
      .select()
      .single();

    if (demoError) throw demoError;
    console.log('✅ Created demo furniture organization:', demoOrg.id, demoOrg.organization_name);

    // Create some sample master data for the demo
    const masterData = [
      // Products
      { 
        entity_type: 'product', 
        entity_name: 'Executive Office Desk', 
        entity_code: 'PROD-DESK-001',
        smart_code: 'HERA.MANUFACTURING.FURNITURE.MASTER.PRODUCT.v1'
      },
      { 
        entity_type: 'product', 
        entity_name: 'Ergonomic Office Chair', 
        entity_code: 'PROD-CHAIR-001',
        smart_code: 'HERA.MANUFACTURING.FURNITURE.MASTER.PRODUCT.v1'
      },
      { 
        entity_type: 'product', 
        entity_name: '6-Seater Dining Set', 
        entity_code: 'PROD-DINING-001',
        smart_code: 'HERA.MANUFACTURING.FURNITURE.MASTER.PRODUCT.v1'
      },
      // Raw Materials
      { 
        entity_type: 'raw_material', 
        entity_name: 'Teak Wood Plank', 
        entity_code: 'RM-TEAK-001',
        smart_code: 'HERA.MANUFACTURING.FURNITURE.MASTER.PRODUCT.v1'
      },
      { 
        entity_type: 'raw_material', 
        entity_name: 'Italian Leather', 
        entity_code: 'RM-LEATHER-001',
        smart_code: 'HERA.MANUFACTURING.FURNITURE.MASTER.PRODUCT.v1'
      },
      // Work Centers
      { 
        entity_type: 'work_center', 
        entity_name: 'Cutting Station', 
        entity_code: 'WC-CUT-001',
        smart_code: 'HERA.MANUFACTURING.FURNITURE.MASTER.WORK_CENTER.v1'
      },
      { 
        entity_type: 'work_center', 
        entity_name: 'Assembly Station', 
        entity_code: 'WC-ASSM-001',
        smart_code: 'HERA.MANUFACTURING.FURNITURE.MASTER.WORK_CENTER.v1'
      },
      // Employees
      { 
        entity_type: 'employee', 
        entity_name: 'Rajesh Kumar', 
        entity_code: 'EMP-001',
        smart_code: 'HERA.MANUFACTURING.FURNITURE.MASTER.EMPLOYEE.v1'
      },
      { 
        entity_type: 'employee', 
        entity_name: 'Priya Nair', 
        entity_code: 'EMP-002',
        smart_code: 'HERA.MANUFACTURING.FURNITURE.MASTER.EMPLOYEE.v1'
      },
      // Customers
      { 
        entity_type: 'customer', 
        entity_name: 'Office Solutions Ltd', 
        entity_code: 'CUST-001',
        smart_code: 'HERA.MANUFACTURING.FURNITURE.MASTER.CUSTOMER.v1'
      },
      { 
        entity_type: 'customer', 
        entity_name: 'Home Decor Mart', 
        entity_code: 'CUST-002',
        smart_code: 'HERA.MANUFACTURING.FURNITURE.MASTER.CUSTOMER.v1'
      }
    ];

    console.log('\n📦 Creating master data...');
    for (const entity of masterData) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: demoOrg.id,
          entity_type: entity.entity_type,
          entity_name: entity.entity_name,
          entity_code: entity.entity_code,
          smart_code: entity.smart_code,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error(`❌ Error creating ${entity.entity_type}:`, error);
      } else {
        console.log(`✅ Created ${entity.entity_type}: ${entity.entity_name}`);

        // Add some dynamic data
        if (entity.entity_type === 'product') {
          await supabase.from('core_dynamic_data').insert([
            { entity_id: data.id, field_name: 'price', field_value_number: 25000, smart_code: entity.smart_code },
            { entity_id: data.id, field_name: 'material', field_value_text: 'Premium Teak Wood', smart_code: entity.smart_code },
            { entity_id: data.id, field_name: 'lead_time_days', field_value_number: 15, smart_code: entity.smart_code }
          ]);
        } else if (entity.entity_type === 'employee') {
          await supabase.from('core_dynamic_data').insert([
            { entity_id: data.id, field_name: 'department', field_value_text: 'Production', smart_code: entity.smart_code },
            { entity_id: data.id, field_name: 'pf_number', field_value_text: `KL/COC/12345/${data.entity_code}`, smart_code: entity.smart_code },
            { entity_id: data.id, field_name: 'esi_number', field_value_text: `1234567890000${data.entity_code.slice(-1)}`, smart_code: entity.smart_code }
          ]);
        }
      }
    }

    // Create a sample sales order
    const { data: salesOrder } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: demoOrg.id,
        transaction_type: 'sales_order',
        transaction_code: 'SO-DEMO-001',
        transaction_date: new Date().toISOString(),
        smart_code: 'HERA.MANUFACTURING.FURNITURE.SALES.SO.HEADER.v1',
        total_amount: 175000,
        currency_code: 'INR',
        metadata: {
          customer_name: 'Office Solutions Ltd',
          delivery_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          payment_terms: 'Net 30'
        }
      })
      .select()
      .single();

    console.log('✅ Created sample sales order');

    console.log('\n🎉 Demo furniture organization setup complete!');
    console.log('Organization ID:', demoOrg.id);
    console.log('\nTo add this to demo routes:');
    console.log('1. Update setup-demo-org-mappings.js to include:');
    console.log(`   {
      path: '/furniture',
      orgId: '${demoOrg.id}',
      orgName: 'Kerala Furniture Works (Demo)',
      industry: 'furniture'
    }`);
    console.log('2. Run: node setup-demo-org-mappings.js');
    console.log('3. Access demo at: http://localhost:3000/furniture');

  } catch (error) {
    console.error('Error:', error);
  }
}

createDemoFurnitureOrganization();