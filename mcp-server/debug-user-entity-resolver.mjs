#!/usr/bin/env node
/**
 * Debug User Entity Resolver
 * Tests the exact query used by the user-entity-resolver
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '../.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value && !key.startsWith('#')) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674';

console.log('🔍 DEBUGGING USER ENTITY RESOLVER');
console.log('=================================');
console.log(`User ID: ${USER_ID}`);
console.log('');

async function debugUserEntityResolver() {
  try {
    console.log('1️⃣ Testing the exact query from user-entity-resolver...');
    
    // This is the EXACT query from the resolver
    const { data: relationship, error: relError } = await supabase
      .from('core_relationships')
      .select('to_entity_id, organization_id')
      .eq('from_entity_id', USER_ID)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
      .maybeSingle();
    
    if (relError) {
      console.log('❌ Relationship query error:', relError.message);
    } else if (!relationship) {
      console.log('❌ No relationship found with maybeSingle()');
      console.log('💡 This is why the resolver is failing');
    } else {
      console.log('✅ Relationship found with maybeSingle():');
      console.log(`   To Entity: ${relationship.to_entity_id}`);
      console.log(`   Organization: ${relationship.organization_id}`);
    }
    
    console.log('');
    console.log('2️⃣ Testing without maybeSingle()...');
    
    // Test without maybeSingle to see if there are multiple results
    const { data: relationships, error: relMultiError } = await supabase
      .from('core_relationships')
      .select('to_entity_id, organization_id')
      .eq('from_entity_id', USER_ID)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG');
    
    if (relMultiError) {
      console.log('❌ Multiple relationship query error:', relMultiError.message);
    } else {
      console.log(`✅ Found ${relationships?.length || 0} relationships without maybeSingle()`);
      
      if (relationships && relationships.length > 0) {
        relationships.forEach((rel, index) => {
          console.log(`   Relationship ${index + 1}:`);
          console.log(`     To Entity: ${rel.to_entity_id}`);
          console.log(`     Organization: ${rel.organization_id}`);
        });
        
        if (relationships.length > 1) {
          console.log('💡 Multiple relationships found - maybeSingle() fails with multiple results!');
        }
      }
    }
    
    console.log('');
    console.log('3️⃣ Testing all relationships for this user...');
    
    // Get all relationships to see what exists
    const { data: allRels, error: allError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', USER_ID);
    
    if (allError) {
      console.log('❌ All relationships query error:', allError.message);
    } else {
      console.log(`✅ Found ${allRels?.length || 0} total relationships for this user`);
      
      if (allRels && allRels.length > 0) {
        allRels.forEach((rel, index) => {
          console.log(`   Relationship ${index + 1}:`);
          console.log(`     ID: ${rel.id}`);
          console.log(`     Type: ${rel.relationship_type}`);
          console.log(`     Organization: ${rel.organization_id}`);
          console.log(`     To Entity: ${rel.to_entity_id}`);
          console.log(`     Active: ${rel.is_active}`);
        });
        
        // Check for duplicate USER_MEMBER_OF_ORG relationships
        const userMemberRels = allRels.filter(rel => rel.relationship_type === 'USER_MEMBER_OF_ORG');
        if (userMemberRels.length > 1) {
          console.log('');
          console.log('⚠️ ISSUE FOUND: Multiple USER_MEMBER_OF_ORG relationships!');
          console.log('💡 maybeSingle() fails when there are multiple relationships');
          console.log('🔧 Need to either:');
          console.log('   1. Remove duplicate relationships, or');
          console.log('   2. Change query to use .single() or handle multiple results');
        }
      }
    }
    
    console.log('');
    console.log('4️⃣ Testing the full resolver logic...');
    
    if (relationship) {
      const organizationId = relationship.organization_id;
      console.log(`✅ Using organization: ${organizationId}`);
      
      // Test the dynamic data query
      const { data: dynamicData, error: dynamicError } = await supabase
        .from('core_dynamic_data')
        .select('field_name, field_value_text, field_value_json, field_type, smart_code')
        .eq('entity_id', USER_ID)
        .eq('organization_id', organizationId);
      
      if (dynamicError) {
        console.log('❌ Dynamic data query error:', dynamicError.message);
      } else {
        console.log(`✅ Found ${dynamicData?.length || 0} dynamic data fields`);
        
        if (dynamicData && dynamicData.length > 0) {
          // Build dynamic data map like the resolver does
          const dynamicDataMap = {};
          dynamicData.forEach(field => {
            const value = field.field_type === 'json' ? field.field_value_json : field.field_value_text;
            dynamicDataMap[field.field_name] = {
              value,
              type: field.field_type,
              smart_code: field.smart_code
            };
          });
          
          console.log('✅ Dynamic data map:');
          Object.entries(dynamicDataMap).forEach(([key, data]) => {
            console.log(`   ${key}: ${data.value}`);
          });
          
          // Extract business information
          const salonRole = dynamicDataMap.salon_role?.value || 'user';
          const permissions = dynamicDataMap.permissions?.value || [];
          
          console.log('');
          console.log('✅ Resolved business data:');
          console.log(`   Salon Role: ${salonRole}`);
          console.log(`   Permissions: ${Array.isArray(permissions) ? JSON.stringify(permissions) : permissions}`);
        }
      }
    }
    
    console.log('');
    console.log('🎯 DIAGNOSIS');
    console.log('=============');
    
    const hasRelWithMaybeSingle = relationship !== null;
    const hasMultipleRels = relationships && relationships.length > 1;
    
    console.log(`Relationship found with maybeSingle(): ${hasRelWithMaybeSingle ? '✅' : '❌'}`);
    console.log(`Multiple relationships exist: ${hasMultipleRels ? '⚠️' : '✅'}`);
    
    if (!hasRelWithMaybeSingle && hasMultipleRels) {
      console.log('');
      console.log('🔧 SOLUTION REQUIRED: maybeSingle() fails with multiple relationships');
      console.log('💡 Need to clean up duplicate relationships or modify query');
    } else if (!hasRelWithMaybeSingle) {
      console.log('');
      console.log('❌ NO RELATIONSHIPS FOUND');
      console.log('💡 The USER_MEMBER_OF_ORG relationship creation failed');
    } else {
      console.log('');
      console.log('✅ USER ENTITY RESOLVER SHOULD WORK');
      console.log('💡 The relationship exists and should be found correctly');
    }
    
  } catch (error) {
    console.log('');
    console.log('🔥 DEBUG ERROR:', error.message);
    console.log('Stack:', error.stack);
  }
}

// Execute the debug
debugUserEntityResolver();