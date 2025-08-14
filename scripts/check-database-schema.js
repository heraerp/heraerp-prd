#!/usr/bin/env node
/**
 * Check Database Schema for HERA Universal Tables
 */

require('dotenv').config();

async function checkDatabaseSchema() {
  console.log('🔍 CHECKING HERA DATABASE SCHEMA');
  console.log('=' .repeat(50));
  
  const { createClient } = await import('@supabase/supabase-js');
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );
  
  // Check core_relationships table structure
  console.log('\n📋 Checking core_relationships table...');
  console.log('-'.repeat(40));
  
  try {
    // Try to get schema information by selecting a single record
    const { data, error } = await supabase
      .from('core_relationships')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log(`Error accessing core_relationships: ${error.message}`);
    } else {
      console.log('✅ core_relationships table accessible');
      if (data && data.length > 0) {
        console.log('Available columns:', Object.keys(data[0]));
      } else {
        console.log('Table exists but no data to show column structure');
        // Try inserting a test record to see what columns are required
        const { data: testData, error: testError } = await supabase
          .from('core_relationships')
          .insert({})
          .select();
        
        if (testError) {
          console.log('Required columns based on error:', testError.message);
        }
      }
    }
  } catch (e) {
    console.log(`Exception: ${e.message}`);
  }
  
  // Check all HERA universal tables
  const tables = [
    'core_organizations',
    'core_entities', 
    'core_dynamic_data',
    'core_relationships',
    'universal_transactions',
    'universal_transaction_lines'
  ];
  
  console.log('\n📊 Checking all HERA Universal Tables...');
  console.log('-'.repeat(40));
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: accessible`);
        if (data && data.length > 0) {
          console.log(`   Columns: ${Object.keys(data[0]).join(', ')}`);
        }
      }
    } catch (e) {
      console.log(`❌ ${table}: ${e.message}`);
    }
  }
  
  // Check Mario's organization data
  console.log('\n🍝 Checking Mario\'s Organization Data...');
  console.log('-'.repeat(40));
  
  const orgId = '6f591f1a-ea86-493e-8ae4-639d28a7e3c8';
  
  try {
    const { data: entities } = await supabase
      .from('core_entities')
      .select('entity_type, count(*)')
      .eq('organization_id', orgId)
      .group('entity_type');
    
    if (entities) {
      console.log('Mario\'s entity types:');
      entities.forEach(entity => {
        console.log(`   • ${entity.entity_type}: ${entity.count} records`);
      });
    }
  } catch (e) {
    console.log(`Error checking entities: ${e.message}`);
  }
  
  // Check existing relationships
  try {
    const { data: relationships } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('organization_id', orgId)
      .limit(5);
    
    if (relationships && relationships.length > 0) {
      console.log('\nExisting relationships structure:');
      console.log('Columns:', Object.keys(relationships[0]));
      console.log('Sample relationship:', relationships[0]);
    } else {
      console.log('\nNo existing relationships found');
    }
  } catch (e) {
    console.log(`Error checking relationships: ${e.message}`);
  }
}

checkDatabaseSchema().catch(console.error);