#!/usr/bin/env node
/**
 * Simple schema check for core_relationships table
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

console.log('🔍 CHECKING CORE_RELATIONSHIPS SCHEMA');
console.log('=====================================');
console.log('');

async function checkRelationshipsSchema() {
  try {
    // Try to select from the table to see what columns exist
    console.log('1️⃣ Attempting to query core_relationships with all possible columns...');
    
    // Try a basic select to see if table exists
    const { data: basicData, error: basicError } = await supabase
      .from('core_relationships')
      .select('*')
      .limit(1);

    if (basicError) {
      console.log('❌ Basic query failed:', basicError.message);
      return;
    }

    if (basicData && basicData.length > 0) {
      console.log('✅ Table exists and has data. Sample record:');
      console.log(JSON.stringify(basicData[0], null, 2));
      console.log('');
      
      console.log('📋 Available columns in the first record:');
      Object.keys(basicData[0]).forEach(key => {
        console.log(`   - ${key}: ${typeof basicData[0][key]}`);
      });
    } else {
      console.log('⚠️ Table exists but is empty. Trying column detection...');
      
      // Try to detect columns by attempting inserts
      console.log('');
      console.log('2️⃣ Testing column existence by attempting structured query...');
      
      const { data: emptyData, error: emptyError } = await supabase
        .from('core_relationships')
        .select('id, organization_id, from_entity_id, to_entity_id, relationship_type')
        .limit(1);

      if (emptyError) {
        console.log('❌ Structured query failed:', emptyError.message);
        
        // Try with different column names
        console.log('');
        console.log('3️⃣ Testing alternative column names...');
        
        const alternativeColumns = [
          'created_at, updated_at',
          'smart_code',
          'status',
          'metadata',
          'is_active'
        ];
        
        for (const cols of alternativeColumns) {
          const { data, error } = await supabase
            .from('core_relationships')
            .select(cols)
            .limit(1);
            
          if (error) {
            console.log(`❌ ${cols}: ${error.message}`);
          } else {
            console.log(`✅ ${cols}: Column exists`);
          }
        }
      } else {
        console.log('✅ Core columns exist: id, organization_id, from_entity_id, to_entity_id, relationship_type');
      }
    }

    // Check our specific user relationship
    console.log('');
    console.log('4️⃣ Checking for existing user relationships...');
    
    const TEST_USER_ID = '48089a0e-5199-4d82-b9ac-3a09b68a6864';
    const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
    
    const { data: userRels, error: userRelsError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', TEST_USER_ID)
      .eq('to_entity_id', TEST_ORG_ID);

    if (userRelsError) {
      console.log('❌ User relationship query failed:', userRelsError.message);
    } else {
      console.log(`✅ Found ${userRels.length} existing relationships for user`);
      
      if (userRels.length > 0) {
        userRels.forEach((rel, index) => {
          console.log(`   Relationship ${index + 1}:`);
          console.log(`     ID: ${rel.id}`);
          console.log(`     Type: ${rel.relationship_type}`);
          console.log(`     From: ${rel.from_entity_id}`);
          console.log(`     To: ${rel.to_entity_id}`);
          console.log(`     Organization: ${rel.organization_id}`);
          
          // Check if metadata column exists
          if (rel.hasOwnProperty('metadata')) {
            console.log(`     Metadata: ${JSON.stringify(rel.metadata)}`);
          } else {
            console.log(`     Metadata: Column not available`);
          }
          
          if (rel.hasOwnProperty('smart_code')) {
            console.log(`     Smart Code: ${rel.smart_code}`);
          }
          
          if (rel.hasOwnProperty('status')) {
            console.log(`     Status: ${rel.status}`);
          }
          
          console.log('');
        });
      }
    }

  } catch (error) {
    console.log('');
    console.log('🔥 SCHEMA CHECK ERROR:', error.message);
    console.log('Stack:', error.stack);
  }
}

// Run the schema check
checkRelationshipsSchema();