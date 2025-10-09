#!/usr/bin/env node

/**
 * Diagnostic script to show what's preventing entity deletion
 * Usage: node scripts/diagnose-entity-references.js <entity-id>
 */

const entityId = process.argv[2]

if (!entityId) {
  console.error('❌ Please provide an entity ID')
  console.error('Usage: node scripts/diagnose-entity-references.js <entity-id>')
  process.exit(1)
}

async function diagnose() {
  try {
    // Get auth token from environment or prompt user
    const authToken = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!authToken) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY not set in environment')
      process.exit(1)
    }

    console.log(`\n🔍 Diagnosing entity: ${entityId}\n`)

    const response = await fetch(`http://localhost:3000/api/v2/entities/${entityId}/references`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'x-hera-api-version': 'v2',
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('❌ Error:', error)
      process.exit(1)
    }

    const data = await response.json()

    console.log('📋 Entity Details:')
    console.log(`   Type: ${data.entity.entity_type}`)
    console.log(`   Name: ${data.entity.entity_name}`)
    console.log(`   Status: ${data.entity.status}`)
    console.log()

    console.log('🔗 References Found:')
    console.log()

    if (data.references.transaction_lines.count > 0) {
      console.log(`   ⚠️  Transaction Lines: ${data.references.transaction_lines.count}`)
      console.log('       This entity is used in transaction line items')
      console.log('       Samples:')
      data.references.transaction_lines.samples.forEach(line => {
        console.log(`       - Transaction: ${line.transaction_id} (AED ${line.line_amount})`)
      })
      console.log()
    }

    if (data.references.transactions_from.count > 0) {
      console.log(`   ⚠️  Transactions (FROM): ${data.references.transactions_from.count}`)
      console.log('       This entity is the source/actor in these transactions')
      console.log('       Samples:')
      data.references.transactions_from.samples.forEach(txn => {
        console.log(`       - ${txn.transaction_type}: ${txn.smart_code} (AED ${txn.total_amount})`)
      })
      console.log()
    }

    if (data.references.transactions_to.count > 0) {
      console.log(`   ⚠️  Transactions (TO): ${data.references.transactions_to.count}`)
      console.log('       This entity is the target/recipient in these transactions')
      console.log('       Samples:')
      data.references.transactions_to.samples.forEach(txn => {
        console.log(`       - ${txn.transaction_type}: ${txn.smart_code} (AED ${txn.total_amount})`)
      })
      console.log()
    }

    if (data.references.relationships.count > 0) {
      console.log(`   ℹ️  Relationships: ${data.references.relationships.count}`)
      console.log('       These can be cascaded on delete')
      console.log()
    }

    if (data.references.dynamic_fields.count > 0) {
      console.log(`   ℹ️  Dynamic Fields: ${data.references.dynamic_fields.count}`)
      console.log('       These can be cascaded on delete')
      console.log()
    }

    console.log('📊 Summary:')
    console.log(`   Total References: ${data.summary.total_references}`)
    console.log(`   Can Hard Delete: ${data.summary.can_hard_delete ? '✅ Yes' : '❌ No'}`)
    console.log(`   Can Soft Delete: ${data.summary.can_soft_delete ? '✅ Yes' : '❌ No'}`)
    console.log()
    console.log('💡 Recommendation:')
    console.log(`   ${data.summary.recommendation}`)
    console.log()

    if (!data.summary.can_hard_delete) {
      console.log('⚠️  HERA enforces audit trail integrity:')
      console.log(
        '   Entities with transaction history CANNOT be permanently deleted.'
      )
      console.log('   This protects financial audit trails and regulatory compliance.')
      console.log('   Use Archive (soft delete) instead.')
      console.log()
    }
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

diagnose()
