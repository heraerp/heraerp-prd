#!/usr/bin/env node
/**
 * Fix User Relationship - Simple Approach
 * Creates the USER_MEMBER_OF_ORG relationship using insert approach
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
const TARGET_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

console.log('🔗 FIXING USER_MEMBER_OF_ORG RELATIONSHIP');
console.log('========================================');
console.log(`User ID: ${USER_ID}`);
console.log(`Target Org: ${TARGET_ORG_ID}`);
console.log('');

async function fixUserRelationship() {
  try {
    console.log('🔍 Checking if relationship already exists...');
    
    // Check if relationship already exists
    const { data: existingRel, error: checkError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', USER_ID)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
      .eq('organization_id', TARGET_ORG_ID);
    
    if (checkError) {
      console.log('❌ Error checking existing relationship:', checkError.message);
      return;
    }
    
    if (existingRel && existingRel.length > 0) {
      console.log('✅ USER_MEMBER_OF_ORG relationship already exists!');
      console.log('📊 Relationship details:', existingRel[0]);
      return;
    }
    
    console.log('⚠️ No existing relationship found, creating new one...');
    
    // Find target organization entity
    const { data: targetOrgEntity, error: targetOrgError } = await supabase
      .from('core_entities')
      .select('id')
      .eq('entity_type', 'organization')
      .eq('organization_id', TARGET_ORG_ID)
      .single();
    
    if (targetOrgError || !targetOrgEntity) {
      console.log('❌ Target organization entity not found:', targetOrgError?.message);
      return;
    }
    
    console.log('✅ Found target organization entity:', targetOrgEntity.id);
    
    // Create relationship using simple insert
    const { data: newRel, error: relError } = await supabase
      .from('core_relationships')
      .insert({
        organization_id: TARGET_ORG_ID,
        from_entity_id: USER_ID,
        to_entity_id: targetOrgEntity.id,
        relationship_type: 'USER_MEMBER_OF_ORG',
        smart_code: 'HERA.UNIVERSAL.MEMBERSHIP.USER.ORG.v1'
      })
      .select()
      .single();
    
    if (relError) {
      console.log('❌ Error creating relationship:', relError.message);
      
      // Try alternative approach - check if it's a duplicate
      if (relError.message.includes('duplicate') || relError.message.includes('unique')) {
        console.log('💡 Relationship might already exist, let me check again...');
        
        const { data: finalCheck } = await supabase
          .from('core_relationships')
          .select('*')
          .eq('from_entity_id', USER_ID)
          .eq('relationship_type', 'USER_MEMBER_OF_ORG');
        
        if (finalCheck && finalCheck.length > 0) {
          console.log('✅ Found existing relationship after all:', finalCheck[0]);
        } else {
          console.log('❌ Still no relationship found');
        }
      }
      return;
    }
    
    console.log('✅ USER_MEMBER_OF_ORG relationship created successfully!');
    console.log('📊 New relationship:', newRel);
    
    console.log('');
    console.log('🔍 FINAL VERIFICATION');
    console.log('=====================');
    
    // Final verification
    const { data: finalRel } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', USER_ID)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
      .eq('organization_id', TARGET_ORG_ID);
    
    console.log('🔗 USER_MEMBER_OF_ORG relationships found:', finalRel?.length || 0);
    
    if (finalRel && finalRel.length > 0) {
      console.log('✅ Relationship details:');
      finalRel.forEach((rel, index) => {
        console.log(`   ${index + 1}. ID: ${rel.id}`);
        console.log(`      From: ${rel.from_entity_id}`);
        console.log(`      To: ${rel.to_entity_id}`);
        console.log(`      Type: ${rel.relationship_type}`);
        console.log(`      Org: ${rel.organization_id}`);
      });
    }
    
    console.log('');
    console.log('🎉 USER RELATIONSHIP FIXED!');
    console.log('===========================');
    console.log('✅ USER_MEMBER_OF_ORG relationship is now properly established');
    console.log('🚀 User authentication should work correctly');
    
  } catch (error) {
    console.log('');
    console.log('🔥 FATAL ERROR:', error.message);
    console.log('Stack:', error.stack);
  }
}

// Execute the relationship fix
fixUserRelationship();