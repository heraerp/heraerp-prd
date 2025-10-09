#!/usr/bin/env node
/**
 * Cleanup Lowercase Relationships Script
 * Removes old lowercase relationship types to maintain consistency
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

const ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

console.log('🧹 CLEANUP LOWERCASE RELATIONSHIPS');
console.log('=================================');
console.log(`📍 Organization: ${ORG_ID}`);
console.log('');

async function identifyLowercaseRelationships() {
  console.log('🔍 Identifying lowercase relationships...');
  
  const { data: relationships, error } = await supabase
    .from('core_relationships')
    .select('id, relationship_type')
    .eq('organization_id', ORG_ID);
    
  if (error) {
    console.log('❌ Error querying relationships:', error.message);
    return [];
  }
  
  // Find relationships that have lowercase equivalents
  const lowercaseRelationships = relationships.filter(rel => {
    const type = rel.relationship_type;
    return type !== type.toUpperCase() && 
           relationships.some(r => r.relationship_type === type.toUpperCase());
  });
  
  console.log(`📊 Total relationships: ${relationships.length}`);
  console.log(`🔻 Lowercase to cleanup: ${lowercaseRelationships.length}`);
  
  // Group by type
  const typeCounts = {};
  lowercaseRelationships.forEach(rel => {
    typeCounts[rel.relationship_type] = (typeCounts[rel.relationship_type] || 0) + 1;
  });
  
  console.log('');
  console.log('📋 Lowercase relationships to remove:');
  Object.entries(typeCounts).forEach(([type, count]) => {
    console.log(`   ${type}: ${count} (will be removed)`);
  });
  
  return lowercaseRelationships;
}

async function cleanupLowercaseRelationships(lowercaseRelationships) {
  console.log('');
  console.log('🧹 Cleaning up lowercase relationships...');
  
  if (lowercaseRelationships.length === 0) {
    console.log('✅ No lowercase relationships to cleanup');
    return 0;
  }
  
  const relationshipIds = lowercaseRelationships.map(rel => rel.id);
  
  const { data, error } = await supabase
    .from('core_relationships')
    .delete()
    .in('id', relationshipIds)
    .select('id');
    
  if (error) {
    console.log('❌ Error deleting lowercase relationships:', error.message);
    return 0;
  }
  
  console.log(`✅ Deleted ${data?.length || 0} lowercase relationships`);
  return data?.length || 0;
}

async function verifyCleanup() {
  console.log('');
  console.log('🔍 Verifying cleanup...');
  
  const { data: relationships } = await supabase
    .from('core_relationships')
    .select('relationship_type')
    .eq('organization_id', ORG_ID);
    
  // Group by relationship type
  const typeCounts = {};
  relationships?.forEach(rel => {
    typeCounts[rel.relationship_type] = (typeCounts[rel.relationship_type] || 0) + 1;
  });
  
  console.log(`📊 Final relationships: ${relationships?.length || 0}`);
  console.log('');
  console.log('📋 Final relationship types:');
  Object.entries(typeCounts)
    .sort(([,a], [,b]) => b - a)
    .forEach(([type, count]) => {
      const isUppercase = type === type.toUpperCase();
      const status = isUppercase ? '✅' : '⚠️';
      console.log(`   ${status} ${type}: ${count}`);
    });
  
  // Check if any lowercase remain
  const lowercaseRemaining = Object.keys(typeCounts).filter(type => type !== type.toUpperCase());
  
  if (lowercaseRemaining.length === 0) {
    console.log('');
    console.log('🎉 SUCCESS: All relationship types are now UPPERCASE!');
    return true;
  } else {
    console.log('');
    console.log(`⚠️ WARNING: ${lowercaseRemaining.length} lowercase types still remain:`);
    lowercaseRemaining.forEach(type => console.log(`   - ${type}`));
    return false;
  }
}

async function main() {
  try {
    console.log('Cleanup Lowercase Relationships Started');
    console.log('======================================');
    console.log('');
    
    // Step 1: Identify lowercase relationships
    const lowercaseRelationships = await identifyLowercaseRelationships();
    
    // Step 2: Clean them up
    const deletedCount = await cleanupLowercaseRelationships(lowercaseRelationships);
    
    // Step 3: Verify the cleanup
    const isClean = await verifyCleanup();
    
    // Final summary
    console.log('');
    console.log('🎯 CLEANUP SUMMARY');
    console.log('==================');
    console.log(`🗑️ Relationships deleted: ${deletedCount}`);
    console.log(`✅ All UPPERCASE: ${isClean ? 'Yes' : 'No'}`);
    console.log('');
    
    if (isClean) {
      console.log('🎉 CLEANUP SUCCESSFUL!');
      console.log('✅ All relationship types are now properly UPPERCASE');
      console.log('🚀 Database consistency restored');
    } else {
      console.log('⚠️ CLEANUP INCOMPLETE');
      console.log('💡 Some lowercase relationship types may need manual review');
    }
    
    process.exit(isClean ? 0 : 1);
    
  } catch (error) {
    console.log('');
    console.log('🔥 FATAL ERROR:', error.message);
    process.exit(2);
  }
}

// Run the cleanup
main();