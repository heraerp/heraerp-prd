const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createFurnitureOrganizations() {
  try {
    // Create parent holding organization
    const { data: parentOrg, error: parentError } = await supabase
      .from('core_organizations')
      .insert({
        organization_name: 'Kerala Furniture Group',
        organization_code: 'FURNITURE-GROUP',
        organization_type: 'holding',
        industry_classification: 'MANUFACTURING',
        ai_insights: { purpose: 'Parent org for all furniture manufacturing branches' },
        settings: { public_access: true },
        status: 'active'
      })
      .select()
      .single();

    if (parentError) throw parentError;
    console.log('✅ Created parent organization:', parentOrg.id, parentOrg.organization_name);

    // Create the main furniture manufacturing branch
    const { data: branch, error: branchError } = await supabase
      .from('core_organizations')
      .insert({
        organization_name: 'Kerala Furniture Works • Cochin Factory',
        organization_code: 'FURNITURE-BR1',
        organization_type: 'business_unit',
        industry_classification: 'MANUFACTURING',
        parent_organization_id: parentOrg.id,
        ai_insights: { 
          notes: 'Primary manufacturing facility in Cochin, Kerala - Premium wooden furniture',
          smart_code_namespace: 'HERA.MANUFACTURING.FURNITURE'
        },
        settings: { 
          public_access: true,
          location: 'Cochin, Kerala, India',
          specialization: 'Premium wooden furniture - dining sets, bedroom furniture, custom designs'
        },
        status: 'active'
      })
      .select()
      .single();

    if (branchError) throw branchError;
    console.log('✅ Created branch organization:', branch.id, branch.organization_name);

    // Create some basic entity types for furniture manufacturing
    const entityTypes = [
      { type: 'raw_material', name: 'Teak Wood', code: 'RM-TEAK-001', smart_code: 'HERA.MANUFACTURING.FURNITURE.RM.WOOD.TEAK.v1' },
      { type: 'raw_material', name: 'Rosewood', code: 'RM-ROSE-001', smart_code: 'HERA.MANUFACTURING.FURNITURE.RM.WOOD.ROSE.v1' },
      { type: 'raw_material', name: 'MDF Board', code: 'RM-MDF-001', smart_code: 'HERA.MANUFACTURING.FURNITURE.RM.BOARD.MDF.v1' },
      { type: 'product', name: 'Classic Dining Table Set', code: 'PROD-DT-001', smart_code: 'HERA.MANUFACTURING.FURNITURE.PROD.DINING.TABLE.v1' },
      { type: 'product', name: 'King Size Bed Frame', code: 'PROD-BED-001', smart_code: 'HERA.MANUFACTURING.FURNITURE.PROD.BEDROOM.BED.v1' },
      { type: 'product', name: 'Wardrobe 3-Door', code: 'PROD-WD-001', smart_code: 'HERA.MANUFACTURING.FURNITURE.PROD.STORAGE.WARDROBE.v1' },
      { type: 'customer', name: 'Furniture Mall Kochi', code: 'CUST-FMK-001', smart_code: 'HERA.MANUFACTURING.FURNITURE.CUST.RETAIL.v1' },
      { type: 'vendor', name: 'Kerala Wood Suppliers', code: 'VEND-KWS-001', smart_code: 'HERA.MANUFACTURING.FURNITURE.VEND.SUPPLIER.v1' }
    ];

    for (const entity of entityTypes) {
      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: branch.id,
          entity_type: entity.type,
          entity_name: entity.name,
          entity_code: entity.code,
          smart_code: entity.smart_code,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error(`Error creating ${entity.type}:`, error);
      } else {
        console.log(`✅ Created ${entity.type}:`, data.entity_name);
      }
    }

    console.log('\n🎉 Furniture manufacturing organization setup complete\!');
    console.log('Parent Organization ID:', parentOrg.id);
    console.log('Branch Organization ID:', branch.id);
    console.log('\nYou can now use this organization ID for furniture manufacturing operations.');

  } catch (error) {
    console.error('Error:', error);
  }
}

createFurnitureOrganizations();
