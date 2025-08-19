#!/usr/bin/env node
/**
 * HERA Status Workflow Example
 * Shows how to implement status workflows using relationships
 * instead of adding status columns
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const orgId = process.env.DEFAULT_ORGANIZATION_ID;

async function main() {
  console.log('\n🔄 HERA Status Workflow Example\n');
  console.log('Instead of adding status columns, we use relationships!\n');

  // First, create status entities
  console.log('1️⃣ Creating Status Entities...\n');
  
  const statuses = ['draft', 'pending', 'approved', 'rejected', 'completed'];
  const statusEntities = [];
  
  for (const status of statuses) {
    const { data, error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: orgId,
        entity_type: 'workflow_status',
        entity_name: status.charAt(0).toUpperCase() + status.slice(1) + ' Status',
        entity_code: `STATUS-${status.toUpperCase()}`,
        smart_code: `HERA.WORKFLOW.STATUS.${status.toUpperCase()}.v1`,
        ai_confidence: 1.0,
        ai_classification: 'WORKFLOW'
      })
      .select()
      .single();
    
    if (!error) {
      statusEntities.push(data);
      console.log(`  ✅ Created status: ${status} (${data.id})`);
    }
  }

  // Create a sample transaction
  console.log('\n2️⃣ Creating a Sample Transaction...\n');
  
  const { data: transaction, error: txError } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: orgId,
      transaction_type: 'purchase_order',
      transaction_number: `PO-${Date.now()}`,
      transaction_date: new Date().toISOString(),
      total_amount: 25000,
      smart_code: 'HERA.SCM.PO.CREATE.v1'
    })
    .select()
    .single();

  if (transaction) {
    console.log(`  ✅ Created transaction: ${transaction.transaction_number}`);
    
    // Now create status relationship
    console.log('\n3️⃣ Setting Transaction Status via Relationship...\n');
    
    // Find the 'pending' status entity
    const pendingStatus = statusEntities.find(s => s.entity_code === 'STATUS-PENDING');
    
    if (pendingStatus) {
      const { data: relationship, error: relError } = await supabase
        .from('core_relationships')
        .insert({
          organization_id: orgId,
          parent_entity_id: transaction.id,
          child_entity_id: pendingStatus.id,
          relationship_type: 'has_status',
          smart_code: 'HERA.WORKFLOW.STATUS.ASSIGN.v1',
          metadata: {
            assigned_at: new Date().toISOString(),
            assigned_by: 'system'
          }
        })
        .select()
        .single();
      
      if (relationship) {
        console.log(`  ✅ Transaction ${transaction.transaction_number} now has status: PENDING`);
      }
    }
  }

  // Show how to query transactions with their status
  console.log('\n4️⃣ Querying Transactions with Status...\n');
  
  const query = `
    SELECT 
      t.transaction_number,
      t.transaction_type,
      t.total_amount,
      s.entity_name as current_status,
      r.created_at as status_assigned_at
    FROM universal_transactions t
    LEFT JOIN core_relationships r ON t.id = r.parent_entity_id 
      AND r.relationship_type = 'has_status'
      AND r.organization_id = '${orgId}'
    LEFT JOIN core_entities s ON r.child_entity_id = s.id 
      AND s.entity_type = 'workflow_status'
    WHERE t.organization_id = '${orgId}'
    ORDER BY t.created_at DESC
    LIMIT 5
  `;

  console.log('  SQL Query to get transactions with status:');
  console.log('  ' + query.split('\n').join('\n  '));

  // Create workflow transition example
  console.log('\n\n5️⃣ Status Workflow Transitions...\n');
  console.log('  To change status, we:');
  console.log('  1. End the current status relationship (set end_date in metadata)');
  console.log('  2. Create a new relationship to the new status');
  console.log('  3. This creates a complete audit trail!\n');

  // Show status history query
  console.log('6️⃣ Query Status History:\n');
  const historyQuery = `
    SELECT 
      s.entity_name as status,
      r.created_at as from_date,
      r.metadata->>'end_date' as to_date,
      r.metadata->>'changed_by' as changed_by
    FROM core_relationships r
    JOIN core_entities s ON r.child_entity_id = s.id
    WHERE r.parent_entity_id = 'transaction_id_here'
      AND r.relationship_type = 'has_status'
    ORDER BY r.created_at ASC
  `;
  
  console.log('  ' + historyQuery.split('\n').join('\n  '));

  console.log('\n\n✨ Benefits of Relationship-based Status:');
  console.log('  ✅ No schema changes needed');
  console.log('  ✅ Complete audit trail');
  console.log('  ✅ Multiple simultaneous statuses possible');
  console.log('  ✅ Status metadata (who, when, why)');
  console.log('  ✅ Works for ANY entity type');
  console.log('  ✅ Reusable status entities\n');
}

main().catch(console.error);