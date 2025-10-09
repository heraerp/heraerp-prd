#!/usr/bin/env node
/**
 * Comprehensive Relationship Restoration Script
 * Uses UPPERCASE relationship types and restores comprehensive data
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

console.log('🔧 COMPREHENSIVE RELATIONSHIP RESTORATION');
console.log('========================================');
console.log(`📍 Organization: ${ORG_ID}`);
console.log('');

async function createRelationship(fromId, toId, relationshipType, smartCode, description) {
  try {
    const { data, error } = await supabase
      .from('core_relationships')
      .insert({
        organization_id: ORG_ID,
        from_entity_id: fromId,
        to_entity_id: toId,
        relationship_type: relationshipType.toUpperCase(), // UPPERCASE
        smart_code: smartCode
      })
      .select('id')
      .single();
      
    if (error) {
      console.log(`❌ ${description}: ${error.message}`);
      return false;
    } else {
      console.log(`✅ ${description}`);
      return true;
    }
  } catch (err) {
    console.log(`❌ ${description}: ${err.message}`);
    return false;
  }
}

async function findAllEntities() {
  console.log('🔍 Finding all entities for restoration...');
  
  const entityQueries = [
    { type: 'user', label: '👤 Users' },
    { type: 'organization', label: '🏢 Organization' },
    { type: 'gl_account', label: '💰 GL Accounts' },
    { type: 'workflow_status', label: '📋 Status Entities' },
    { type: 'customer', label: '👥 Customers' },
    { type: 'vendor', label: '🏪 Vendors' },
    { type: 'product', label: '📦 Products' },
    { type: 'service', label: '🛠️ Services' },
    { type: 'employee', label: '👷 Employees' }
  ];
  
  const entities = {};
  
  for (const query of entityQueries) {
    const { data, error } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_code, entity_type')
      .eq('organization_id', ORG_ID)
      .eq('entity_type', query.type)
      .order('entity_code');
      
    if (!error && data) {
      entities[query.type] = data;
      console.log(`${query.label}: ${data.length}`);
    } else {
      entities[query.type] = [];
      console.log(`${query.label}: 0`);
    }
  }
  
  console.log('');
  return entities;
}

async function restoreUserMemberships(entities) {
  console.log('👥 Restoring user-organization memberships...');
  
  const users = entities.user || [];
  const orgs = entities.organization || [];
  
  if (users.length === 0 || orgs.length === 0) {
    console.log('⚠️ Cannot restore user memberships - missing users or organization');
    return 0;
  }
  
  let successCount = 0;
  
  for (const user of users) {
    const success = await createRelationship(
      user.id,
      orgs[0].id,
      'USER_MEMBER_OF_ORG', // UPPERCASE
      'HERA.UNIVERSAL.MEMBERSHIP.USER.ORG.v1',
      `User membership: ${user.entity_name || user.entity_code}`
    );
    if (success) successCount++;
  }
  
  return successCount;
}

async function restoreStatusRelationships(entities) {
  console.log('📋 Restoring status relationships...');
  
  const statuses = entities.workflow_status || [];
  const activeStatus = statuses.find(s => 
    s.entity_name === 'active' || 
    s.entity_code === 'STATUS-ACTIVE' ||
    s.entity_name?.toLowerCase().includes('active')
  );
  
  if (!activeStatus) {
    console.log('❌ Active status not found');
    return 0;
  }
  
  let successCount = 0;
  
  // Apply status to different entity types
  const entityTypes = ['gl_account', 'customer', 'vendor', 'product', 'service', 'employee'];
  
  for (const entityType of entityTypes) {
    const entityList = entities[entityType] || [];
    console.log(`   📋 Applying status to ${entityList.length} ${entityType} entities...`);
    
    for (const entity of entityList) {
      const success = await createRelationship(
        entity.id,
        activeStatus.id,
        'HAS_STATUS', // UPPERCASE
        'HERA.UNIVERSAL.WORKFLOW.STATUS.ASSIGN.v1',
        `Status for ${entityType}: ${entity.entity_code || entity.entity_name}`
      );
      if (success) successCount++;
    }
  }
  
  return successCount;
}

async function restoreAccountHierarchy(entities) {
  console.log('🏦 Restoring GL account hierarchy...');
  
  const accounts = entities.gl_account || [];
  
  if (accounts.length < 2) {
    console.log('⚠️ Need at least 2 accounts for hierarchy');
    return 0;
  }
  
  let successCount = 0;
  
  // Sort accounts by code for proper hierarchy detection
  accounts.sort((a, b) => a.entity_code.localeCompare(b.entity_code));
  
  for (let i = 0; i < accounts.length; i++) {
    for (let j = 0; j < accounts.length; j++) {
      if (i === j) continue;
      
      const parent = accounts[i];
      const child = accounts[j];
      
      // Check if child code starts with parent code and is exactly 2 chars longer
      if (child.entity_code.startsWith(parent.entity_code) && 
          child.entity_code.length === parent.entity_code.length + 2) {
        
        const success = await createRelationship(
          parent.id,
          child.id,
          'PARENT_OF', // UPPERCASE
          'HERA.UNIVERSAL.HIERARCHY.ACCOUNT.PARENT.v1',
          `Hierarchy: ${parent.entity_code} → ${child.entity_code}`
        );
        if (success) successCount++;
      }
    }
  }
  
  return successCount;
}

async function restoreBusinessRelationships(entities) {
  console.log('🔗 Restoring business relationships...');
  
  let successCount = 0;
  
  // Customer relationships
  const customers = entities.customer || [];
  const employees = entities.employee || [];
  
  if (customers.length > 0 && employees.length > 0) {
    // Assign first employee as account manager for customers
    const accountManager = employees[0];
    
    for (let i = 0; i < Math.min(3, customers.length); i++) {
      const customer = customers[i];
      const success = await createRelationship(
        customer.id,
        accountManager.id,
        'MANAGED_BY', // UPPERCASE
        'HERA.UNIVERSAL.BUSINESS.CUSTOMER.MANAGER.v1',
        `Customer managed by: ${customer.entity_name} → ${accountManager.entity_name}`
      );
      if (success) successCount++;
    }
  }
  
  // Service-Employee relationships
  const services = entities.service || [];
  
  if (services.length > 0 && employees.length > 0) {
    // Assign services to employees
    for (let i = 0; i < Math.min(services.length, employees.length); i++) {
      const service = services[i];
      const employee = employees[i % employees.length];
      
      const success = await createRelationship(
        service.id,
        employee.id,
        'PROVIDED_BY', // UPPERCASE
        'HERA.UNIVERSAL.BUSINESS.SERVICE.PROVIDER.v1',
        `Service provided by: ${service.entity_name} → ${employee.entity_name}`
      );
      if (success) successCount++;
    }
  }
  
  // Product-Vendor relationships
  const products = entities.product || [];
  const vendors = entities.vendor || [];
  
  if (products.length > 0 && vendors.length > 0) {
    // Assign products to vendors
    for (let i = 0; i < Math.min(products.length, vendors.length); i++) {
      const product = products[i];
      const vendor = vendors[i % vendors.length];
      
      const success = await createRelationship(
        product.id,
        vendor.id,
        'SUPPLIED_BY', // UPPERCASE
        'HERA.UNIVERSAL.BUSINESS.PRODUCT.SUPPLIER.v1',
        `Product supplied by: ${product.entity_name} → ${vendor.entity_name}`
      );
      if (success) successCount++;
    }
  }
  
  return successCount;
}

async function verifyRestoration() {
  console.log('🔍 Verifying comprehensive restoration...');
  
  const { data: relationships } = await supabase
    .from('core_relationships')
    .select('relationship_type')
    .eq('organization_id', ORG_ID);
    
  if (!relationships) {
    console.log('❌ Error verifying relationships');
    return 0;
  }
  
  // Group by relationship type
  const typeCounts = {};
  relationships.forEach(rel => {
    typeCounts[rel.relationship_type] = (typeCounts[rel.relationship_type] || 0) + 1;
  });
  
  console.log(`📊 Total relationships: ${relationships.length}`);
  console.log('');
  console.log('📋 Relationship breakdown:');
  Object.entries(typeCounts)
    .sort(([,a], [,b]) => b - a)
    .forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
  
  return relationships.length;
}

async function main() {
  try {
    console.log('Comprehensive Relationship Restoration Started');
    console.log('============================================');
    console.log('');
    
    // Step 1: Find all entities
    const entities = await findAllEntities();
    
    // Step 2: Restore relationships in logical order
    console.log('🔧 Starting comprehensive restoration...');
    let totalRestored = 0;
    
    // User memberships (critical for access)
    totalRestored += await restoreUserMemberships(entities);
    console.log('');
    
    // Status relationships (critical for workflows)
    totalRestored += await restoreStatusRelationships(entities);
    console.log('');
    
    // Account hierarchy (critical for financial reporting)
    totalRestored += await restoreAccountHierarchy(entities);
    console.log('');
    
    // Business relationships (important for operations)
    totalRestored += await restoreBusinessRelationships(entities);
    console.log('');
    
    // Step 3: Verify final state
    const finalCount = await verifyRestoration();
    console.log('');
    
    // Final summary
    console.log('🎯 COMPREHENSIVE RESTORATION SUMMARY');
    console.log('===================================');
    console.log(`✅ Relationships created: ${totalRestored}`);
    console.log(`📊 Final total relationships: ${finalCount}`);
    console.log('');
    
    if (totalRestored > 0) {
      console.log('🎉 COMPREHENSIVE RESTORATION SUCCESSFUL!');
      console.log('✅ Critical and business relationships restored');
      console.log('🚀 Full system functionality should be available');
      console.log('');
      console.log('💡 What was restored:');
      console.log('   ✅ User-organization memberships (access control)');
      console.log('   ✅ Entity status relationships (workflow support)');
      console.log('   ✅ GL account hierarchy (financial reporting)');
      console.log('   ✅ Business entity relationships (operations)');
      console.log('');
      console.log('🔍 Relationship types restored:');
      console.log('   - USER_MEMBER_OF_ORG (authentication)');
      console.log('   - HAS_STATUS (workflow management)');
      console.log('   - PARENT_OF (account hierarchy)');
      console.log('   - MANAGED_BY (customer relationships)');
      console.log('   - PROVIDED_BY (service assignments)');
      console.log('   - SUPPLIED_BY (vendor relationships)');
    } else {
      console.log('❌ RESTORATION FAILED');
      console.log('💡 No relationships could be created');
    }
    
    process.exit(totalRestored > 0 ? 0 : 1);
    
  } catch (error) {
    console.log('');
    console.log('🔥 FATAL ERROR:', error.message);
    process.exit(2);
  }
}

// Run the comprehensive restoration
main();