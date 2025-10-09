#!/usr/bin/env node
/**
 * Check and clean up Michele's relationships
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

async function checkMicheleRelationships() {
  const MICHELE_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674';
  
  console.log('🔍 Checking all relationships for Michele...');
  console.log('');
  
  const { data: relationships, error } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', MICHELE_USER_ID);
  
  if (error) {
    console.log('❌ Error:', error.message);
    return;
  }
  
  console.log(`Found ${relationships.length} relationships for Michele:`);
  relationships.forEach((rel, index) => {
    console.log(`${index + 1}. ID: ${rel.id}`);
    console.log(`   Type: ${rel.relationship_type}`);
    console.log(`   To: ${rel.to_entity_id}`);
    console.log(`   Organization: ${rel.organization_id}`);
    console.log(`   Smart Code: ${rel.smart_code}`);
    console.log(`   Created: ${rel.created_at}`);
    console.log('');
  });
  
  // Clean up and keep only one USER_MEMBER_OF_ORG
  const userMemberRelationships = relationships.filter(r => r.relationship_type === 'USER_MEMBER_OF_ORG');
  
  if (userMemberRelationships.length > 1) {
    console.log(`❌ Found ${userMemberRelationships.length} USER_MEMBER_OF_ORG relationships. Cleaning up...`);
    
    // Keep the newest one, delete the rest
    const sortedRels = userMemberRelationships.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const toKeep = sortedRels[0];
    const toDelete = sortedRels.slice(1);
    
    console.log(`Keeping relationship: ${toKeep.id} (created: ${toKeep.created_at})`);
    
    for (const rel of toDelete) {
      console.log(`Deleting duplicate: ${rel.id} (created: ${rel.created_at})`);
      const { error: deleteError } = await supabase
        .from('core_relationships')
        .delete()
        .eq('id', rel.id);
        
      if (deleteError) {
        console.log(`❌ Failed to delete ${rel.id}:`, deleteError.message);
      } else {
        console.log(`✅ Deleted ${rel.id}`);
      }
    }
    
    console.log('✅ Cleanup complete');
  } else if (userMemberRelationships.length === 1) {
    console.log('✅ Exactly one USER_MEMBER_OF_ORG relationship found - perfect!');
  } else {
    console.log('❌ No USER_MEMBER_OF_ORG relationships found');
  }
  
  console.log('');
  
  // Test the auth query one more time
  console.log('🧪 Testing authentication query...');
  
  const { data: authTest, error: authError } = await supabase
    .from('core_relationships')
    .select('to_entity_id, organization_id, relationship_data')
    .eq('from_entity_id', MICHELE_USER_ID)
    .eq('relationship_type', 'USER_MEMBER_OF_ORG')
    .maybeSingle();
    
  if (authError) {
    console.log('❌ Auth query error:', authError.message);
  } else if (!authTest) {
    console.log('❌ Auth query returned null');
  } else {
    console.log('🎉 AUTH QUERY SUCCESS!');
    console.log(`   Organization: ${authTest.organization_id}`);
    console.log(`   To Entity: ${authTest.to_entity_id}`);
    console.log(`   Role: ${authTest.relationship_data?.role}`);
    console.log('');
    console.log('✅ Michele can now authenticate with Hair Talkz!');
  }
}

checkMicheleRelationships();