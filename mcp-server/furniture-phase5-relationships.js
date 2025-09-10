#!/usr/bin/env node

/**
 * HERA Furniture Module - Phase 5: Relationship Graph
 * 
 * This script implements the relationship structure for the furniture industry,
 * creating connections between products, BOMs, suppliers, customers, and more.
 * 
 * Architecture: Universal 6-table design using core_relationships
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * FURNITURE RELATIONSHIP DEFINITIONS
 * Using HERA Universal Architecture - all relationships in core_relationships table
 */
const FURNITURE_RELATIONSHIPS = {
  // Product Relationships
  PRODUCT_BOM: {
    type: 'has_bom',
    smart_code: 'HERA.IND.FURN.REL.PRODUCT_BOM.V1',
    description: 'Links products to their bill of materials',
    validation: {
      from_entity_types: ['product'],
      to_entity_types: ['bom'],
      cardinality: 'one_to_many'
    }
  },
  
  BOM_COMPONENT: {
    type: 'includes_component',
    smart_code: 'HERA.IND.FURN.REL.BOM_COMPONENT.V1',
    description: 'Links BOMs to their component materials',
    validation: {
      from_entity_types: ['bom'],
      to_entity_types: ['product', 'material', 'hardware'],
      cardinality: 'many_to_many'
    },
    metadata_fields: ['quantity', 'unit_of_measure', 'scrap_percentage']
  },
  
  PRODUCT_ROUTING: {
    type: 'uses_routing',
    smart_code: 'HERA.IND.FURN.REL.PRODUCT_ROUTING.V1',
    description: 'Links products to their manufacturing routing',
    validation: {
      from_entity_types: ['product'],
      to_entity_types: ['routing'],
      cardinality: 'one_to_many'
    }
  },
  
  ROUTING_WORKCENTER: {
    type: 'performed_at',
    smart_code: 'HERA.IND.FURN.REL.ROUTING_WORKCENTER.V1',
    description: 'Links routing operations to work centers',
    validation: {
      from_entity_types: ['routing'],
      to_entity_types: ['workcenter'],
      cardinality: 'many_to_many'
    },
    metadata_fields: ['operation_number', 'setup_time_minutes', 'run_time_minutes']
  },

  // Supply Chain Relationships
  SUPPLIER_PRODUCT: {
    type: 'sources',
    smart_code: 'HERA.IND.FURN.REL.SUPPLIER_PRODUCT.V1',
    description: 'Links suppliers to the products they provide',
    validation: {
      from_entity_types: ['supplier'],
      to_entity_types: ['product', 'material', 'hardware'],
      cardinality: 'many_to_many'
    },
    metadata_fields: ['lead_time_days', 'minimum_order_quantity', 'unit_price']
  },
  
  WAREHOUSE_LOCATION: {
    type: 'contains',
    smart_code: 'HERA.IND.FURN.REL.WAREHOUSE_LOCATION.V1',
    description: 'Links warehouses to their storage locations',
    validation: {
      from_entity_types: ['warehouse'],
      to_entity_types: ['location'],
      cardinality: 'one_to_many'
    }
  },
  
  PRODUCT_VARIANT: {
    type: 'variant_of',
    smart_code: 'HERA.IND.FURN.REL.PRODUCT_VARIANT.V1',
    description: 'Links product variants to their parent product',
    validation: {
      from_entity_types: ['product'],
      to_entity_types: ['product'],
      cardinality: 'many_to_one'
    },
    metadata_fields: ['variant_attributes', 'sku_suffix']
  },
  
  CUSTOMER_ORDER: {
    type: 'requests',
    smart_code: 'HERA.IND.FURN.REL.CUSTOMER_ORDER.V1',
    description: 'Links customers to their sales orders',
    validation: {
      from_entity_types: ['customer'],
      to_entity_types: ['sales_order'],
      cardinality: 'one_to_many'
    }
  },

  // Organizational Relationships
  EMPLOYEE_ROLE: {
    type: 'has_role',
    smart_code: 'HERA.IND.FURN.REL.EMPLOYEE_ROLE.V1',
    description: 'Links employees to their roles',
    validation: {
      from_entity_types: ['employee'],
      to_entity_types: ['role'],
      cardinality: 'many_to_many'
    },
    metadata_fields: ['effective_date', 'expiry_date']
  },
  
  BRANCH_WAREHOUSE: {
    type: 'operates',
    smart_code: 'HERA.IND.FURN.REL.BRANCH_WAREHOUSE.V1',
    description: 'Links branches to their warehouses',
    validation: {
      from_entity_types: ['branch'],
      to_entity_types: ['warehouse'],
      cardinality: 'one_to_many'
    }
  },
  
  WORKCENTER_EMPLOYEE: {
    type: 'staffed_by',
    smart_code: 'HERA.IND.FURN.REL.WORKCENTER_EMPLOYEE.V1',
    description: 'Links work centers to their staff',
    validation: {
      from_entity_types: ['workcenter'],
      to_entity_types: ['employee'],
      cardinality: 'many_to_many'
    },
    metadata_fields: ['shift', 'skill_level', 'certification']
  },
  
  CUSTOMER_PRICELIST: {
    type: 'uses_pricing',
    smart_code: 'HERA.IND.FURN.REL.CUSTOMER_PRICELIST.V1',
    description: 'Links customers to their contract pricing',
    validation: {
      from_entity_types: ['customer'],
      to_entity_types: ['pricelist'],
      cardinality: 'many_to_one'
    },
    metadata_fields: ['effective_date', 'expiry_date', 'discount_percentage']
  }
};

/**
 * Create relationship with metadata
 */
async function createRelationship({
  fromEntityId,
  toEntityId,
  relationshipType,
  smartCode,
  metadata = {},
  organizationId
}) {
  const { data, error } = await supabase
    .from('core_relationships')
    .insert({
      from_entity_id: fromEntityId,
      to_entity_id: toEntityId,
      relationship_type: relationshipType,
      smart_code: smartCode,
      relationship_data: metadata,  // Changed from metadata to relationship_data
      organization_id: organizationId,
      ai_confidence: 1.0,  // Changed from confidence_score to ai_confidence
      is_active: true,
      effective_date: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    console.error(`❌ Error creating relationship: ${error.message}`);
    throw error;
  }

  return data;
}

/**
 * Create sample BOM structure
 */
async function createSampleBOM(organizationId) {
  console.log('\n📦 Creating Sample BOM Structure...');

  try {
    // Get existing entities
    const { data: entities } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .in('entity_type', ['product', 'material', 'bom']);

    // Use the actual furniture products we can see exist
    const deskProduct = entities.find(e => e.entity_name === 'Executive Office Desk - Premium Teak' && e.entity_code === 'DESK-EXE-001');
    const chairProduct = entities.find(e => e.entity_name === 'Ergonomic High-Back Office Chair');

    if (!deskProduct) {
      console.log('⚠️  Required product not found for BOM creation');
      return;
    }

    // Create a material entity for the BOM
    const { data: teakMaterial } = await supabase
      .from('core_entities')
      .insert({
        entity_type: 'material',
        entity_name: 'Premium Teak Wood',
        entity_code: 'MAT-TEAK-001',
        smart_code: 'HERA.IND.FURN.ENTITY.Material.V1',
        organization_id: organizationId,
        metadata: {
          material_type: 'wood',
          grade: 'A+',
          unit_of_measure: 'SQM'
        }
      })
      .select()
      .single();

    // Create BOM entity
    const { data: bom } = await supabase
      .from('core_entities')
      .insert({
        entity_type: 'bom',
        entity_name: 'BOM - Executive Office Desk',
        entity_code: 'BOM-DESK-001',
        smart_code: 'HERA.IND.FURN.ENTITY.BOM.V1',
        organization_id: organizationId,
        metadata: {
          version: '1.0',
          status: 'active',
          total_components: 5
        }
      })
      .select()
      .single();

    // Link Product to BOM
    await createRelationship({
      fromEntityId: deskProduct.id,
      toEntityId: bom.id,
      relationshipType: FURNITURE_RELATIONSHIPS.PRODUCT_BOM.type,
      smartCode: FURNITURE_RELATIONSHIPS.PRODUCT_BOM.smart_code,
      metadata: {
        is_primary: true,
        version: '1.0'
      },
      organizationId
    });

    // Link BOM to Components
    await createRelationship({
      fromEntityId: bom.id,
      toEntityId: teakMaterial.id,
      relationshipType: FURNITURE_RELATIONSHIPS.BOM_COMPONENT.type,
      smartCode: FURNITURE_RELATIONSHIPS.BOM_COMPONENT.smart_code,
      metadata: {
        quantity: 2.5,
        unit_of_measure: 'SQM',
        scrap_percentage: 5,
        component_type: 'primary_material'
      },
      organizationId
    });

    console.log('✅ Sample BOM structure created successfully');
  } catch (error) {
    console.error('❌ Error creating BOM structure:', error.message);
  }
}

/**
 * Create supplier-product relationships
 */
async function createSupplierRelationships(organizationId) {
  console.log('\n🤝 Creating Supplier-Product Relationships...');

  try {
    // Create a supplier entity first
    const { data: supplier } = await supabase
      .from('core_entities')
      .insert({
        entity_type: 'supplier',
        entity_name: 'Premium Wood Suppliers Ltd',
        entity_code: 'SUP-WOOD-001',
        smart_code: 'HERA.IND.FURN.ENTITY.Supplier.V1',
        organization_id: organizationId,
        metadata: {
          supplier_type: 'raw_materials',
          payment_terms: 'NET30',
          country: 'India'
        }
      })
      .select()
      .single();

    // Get the material we just created
    const { data: materials } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'material')
      .eq('entity_code', 'MAT-TEAK-001');

    const teakMaterial = materials?.[0];

    if (!supplier || !teakMaterial) {
      console.log('⚠️  Required entities not found for supplier relationships');
      return;
    }

    // Link Supplier to Material
    await createRelationship({
      fromEntityId: supplier.id,
      toEntityId: teakMaterial.id,
      relationshipType: FURNITURE_RELATIONSHIPS.SUPPLIER_PRODUCT.type,
      smartCode: FURNITURE_RELATIONSHIPS.SUPPLIER_PRODUCT.smart_code,
      metadata: {
        lead_time_days: 14,
        minimum_order_quantity: 10,
        unit_price: 150.00,
        price_unit: 'SQM',
        contract_number: 'SUP-2024-001'
      },
      organizationId
    });

    console.log('✅ Supplier relationships created successfully');
  } catch (error) {
    console.error('❌ Error creating supplier relationships:', error.message);
  }
}

/**
 * Display relationship statistics
 */
async function displayRelationshipStats(organizationId) {
  console.log('\n📊 RELATIONSHIP GRAPH STATISTICS:');
  
  const stats = {};
  
  for (const [key, rel] of Object.entries(FURNITURE_RELATIONSHIPS)) {
    const { data } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('relationship_type', rel.type);
    
    stats[rel.type] = data?.length || 0;
  }
  
  console.log('Relationship Type Distribution:');
  Object.entries(stats).forEach(([type, count]) => {
    if (count > 0) {
      console.log(`  ${type}: ${count} relationships`);
    }
  });
  
  const totalRelationships = Object.values(stats).reduce((sum, count) => sum + count, 0);
  console.log(`\n  Total Relationships: ${totalRelationships}`);
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 HERA FURNITURE - PHASE 5: RELATIONSHIP GRAPH');
  console.log('================================================\n');

  // Use the organization where furniture entities were created
  const organizationId = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258';

  try {
    // Display relationship definitions
    console.log('📋 FURNITURE RELATIONSHIP DEFINITIONS:');
    console.log(`Total relationship types: ${Object.keys(FURNITURE_RELATIONSHIPS).length}`);
    
    Object.entries(FURNITURE_RELATIONSHIPS).forEach(([key, rel]) => {
      console.log(`\n${key}:`);
      console.log(`  Type: ${rel.type}`);
      console.log(`  Smart Code: ${rel.smart_code}`);
      console.log(`  Description: ${rel.description}`);
      if (rel.metadata_fields) {
        console.log(`  Metadata Fields: ${rel.metadata_fields.join(', ')}`);
      }
    });

    // Create sample relationships
    const action = process.argv[2];
    
    if (action === 'create') {
      console.log('\n🔧 Creating sample relationships...');
      await createSampleBOM(organizationId);
      await createSupplierRelationships(organizationId);
    }

    // Display statistics
    await displayRelationshipStats(organizationId);

    console.log('\n✅ Phase 5: Relationship Graph implementation complete!');
    console.log('\n📌 Next Steps:');
    console.log('  1. Run with "create" to create sample relationships');
    console.log('  2. Integrate relationship queries into UI components');
    console.log('  3. Implement UCR validation for relationship rules');
    console.log('  4. Move to Phase 6: Universal Configuration Rules (UCR)');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Export for testing and reuse
module.exports = {
  FURNITURE_RELATIONSHIPS,
  createRelationship,
  createSampleBOM,
  createSupplierRelationships
};

// Run if called directly
if (require.main === module) {
  main();
}