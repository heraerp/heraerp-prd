#!/usr/bin/env node

/**
 * Test Relationship Creation - Working Example
 * Shows how to properly create relationships between entities
 */

const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const organizationId = "3df8cc52-3d81-42d5-b088-7736ae26cc7c"; // Mario's Restaurant

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testRelationshipCreation() {
  console.log('🔗 Testing HERA Relationship Creation...\n');
  
  try {
    // Step 1: Create two entities that we'll relate
    console.log('📄 Creating entities to relate...');
    
    // Create a customer entity
    const customer = {
      id: uuidv4(),
      organization_id: organizationId,
      entity_type: 'customer',
      entity_name: 'Test Customer for Relationships',
      entity_code: 'CUST-TEST-REL',
      smart_code: 'HERA.TEST.CUST.ENT.v1',
      created_at: new Date().toISOString()
    };
    
    const { data: customerEntity, error: customerError } = await supabase
      .from('core_entities')
      .insert(customer)
      .select()
      .single();
    
    if (customerError) throw customerError;
    console.log(`✅ Created customer: ${customerEntity.id}`);
    
    // Create a service entity
    const service = {
      id: uuidv4(),
      organization_id: organizationId,
      entity_type: 'service',
      entity_name: 'Test Hair Styling Service',
      entity_code: 'SVC-TEST-REL',
      smart_code: 'HERA.TEST.SVC.ENT.v1',
      created_at: new Date().toISOString()
    };
    
    const { data: serviceEntity, error: serviceError } = await supabase
      .from('core_entities')
      .insert(service)
      .select()
      .single();
    
    if (serviceError) throw serviceError;
    console.log(`✅ Created service: ${serviceEntity.id}`);
    
    // Step 2: Create a relationship between them
    console.log('\n🔗 Creating relationship...');
    
    const relationship = {
      id: uuidv4(),
      organization_id: organizationId,
      from_entity_id: customerEntity.id,
      to_entity_id: serviceEntity.id,
      relationship_type: 'favorite_service',
      relationship_data: {
        preference_level: 'primary',
        notes: 'Customer loves this service',
        last_used: new Date().toISOString()
      },
      smart_code: 'HERA.SALON.REL.FAVORITE.v1',
      is_active: true,
      created_at: new Date().toISOString()
    };
    
    console.log('Relationship data:', JSON.stringify(relationship, null, 2));
    
    const { data: relationshipData, error: relationshipError } = await supabase
      .from('core_relationships')
      .insert(relationship)
      .select()
      .single();
    
    if (relationshipError) {
      console.error('❌ Relationship creation failed:', relationshipError.message);
      throw relationshipError;
    }
    
    console.log(`✅ Created relationship: ${relationshipData.id}`);
    console.log('   Type:', relationshipData.relationship_type);
    console.log('   From:', customerEntity.entity_name);
    console.log('   To:', serviceEntity.entity_name);
    
    // Step 3: Query the relationship
    console.log('\n🔍 Querying relationships...');
    
    const { data: relationships, error: queryError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('from_entity_id', customerEntity.id);
    
    if (queryError) throw queryError;
    
    console.log(`✅ Found ${relationships.length} relationships for this customer`);
    
    // Step 4: Create a status workflow example
    console.log('\n📊 Creating status workflow example...');
    
    // Create status entity
    const status = {
      id: uuidv4(),
      organization_id: organizationId,
      entity_type: 'workflow_status',
      entity_name: 'Active',
      entity_code: 'STATUS-ACTIVE',
      smart_code: 'HERA.WORKFLOW.STATUS.ACTIVE.v1',
      created_at: new Date().toISOString()
    };
    
    const { data: statusEntity, error: statusError } = await supabase
      .from('core_entities')
      .insert(status)
      .select()
      .single();
    
    if (statusError) throw statusError;
    console.log(`✅ Created status entity: ${statusEntity.id}`);
    
    // Create status relationship
    const statusRelationship = {
      id: uuidv4(),
      organization_id: organizationId,
      from_entity_id: customerEntity.id,
      to_entity_id: statusEntity.id,
      relationship_type: 'has_status',
      relationship_data: {
        assigned_at: new Date().toISOString(),
        assigned_by: 'test-script',
        reason: 'Initial customer status'
      },
      smart_code: 'HERA.WORKFLOW.STATUS.ASSIGN.v1',
      is_active: true,
      created_at: new Date().toISOString()
    };
    
    const { data: statusRel, error: statusRelError } = await supabase
      .from('core_relationships')
      .insert(statusRelationship)
      .select()
      .single();
    
    if (statusRelError) throw statusRelError;
    console.log(`✅ Created status relationship: ${statusRel.id}`);
    
    console.log('\n🎉 SUCCESS! Relationships work perfectly in HERA!');
    console.log('\n📊 Summary:');
    console.log(`- Customer Entity: ${customerEntity.id}`);
    console.log(`- Service Entity: ${serviceEntity.id}`);
    console.log(`- Status Entity: ${statusEntity.id}`);
    console.log(`- Favorite Service Relationship: ${relationshipData.id}`);
    console.log(`- Status Relationship: ${statusRel.id}`);
    console.log(`- Organization: ${organizationId}`);
    
    console.log('\n💡 Key Insight: Relationships connect ENTITIES to ENTITIES');
    console.log('   (not transactions to entities, which causes foreign key errors)');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.details) console.error('Details:', error.details);
    if (error.hint) console.error('Hint:', error.hint);
  }
}

// Run the test
testRelationshipCreation();