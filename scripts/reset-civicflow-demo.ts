#!/usr/bin/env ts-node

/**
 * Reset CivicFlow demo organization to initial state
 * Preserves: Organization, Users, Published Playbooks
 * Resets: Demo-generated transactions and dynamic data
 */

import * as fs from 'fs'
import * as path from 'path'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

// Environment validation
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables')
  console.error('Please ensure the following are set:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- NEXT_PUBLIC_SUPABASE_ANON_KEY')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

// Initialize Supabase client with service role key for RLS bypass
const supabase = createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// CivicFlow demo organization ID
const CIVICFLOW_DEMO_ORG_ID = 'civicflow_demo_org'

interface SeedData {
  entities?: any[]
  relationships?: any[]
  dynamic_data?: any[]
  transactions?: any[]
  transaction_lines?: any[]
  playbooks?: any[]
  runs?: any[]
}

async function loadSeedData(): Promise<SeedData> {
  const seedData: SeedData = {}
  
  // Load all seed files
  const seedFiles = [
    'civicflow-demo-entities.json',
    'civicflow-demo-relationships.json',
    'civicflow-demo-dynamic-data.json',
    'civicflow-demo-transactions.json',
    'civicflow-demo-playbooks.json',
    'civicflow-demo-runs.json'
  ]

  for (const file of seedFiles) {
    try {
      const filePath = path.join(__dirname, '..', 'seeds', file)
      if (fs.existsSync(filePath)) {
        const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
        
        // Extract data based on file type
        if (file.includes('entities')) {
          seedData.entities = content.entities || []
        } else if (file.includes('relationships')) {
          seedData.relationships = content.relationships || []
        } else if (file.includes('dynamic-data')) {
          seedData.dynamic_data = content.dynamic_data || []
        } else if (file.includes('transactions')) {
          seedData.transactions = content.transactions || []
          seedData.transaction_lines = content.transaction_lines || []
        } else if (file.includes('playbooks')) {
          seedData.playbooks = content.playbooks || []
        } else if (file.includes('runs')) {
          seedData.runs = content.runs || []
        }
        
        console.log(`✓ Loaded ${file}`)
      } else {
        console.warn(`⚠️  Seed file not found: ${file}`)
      }
    } catch (error) {
      console.error(`❌ Error loading ${file}:`, error)
    }
  }

  return seedData
}

async function deleteGeneratedData() {
  console.log('\n🗑️  Deleting demo-generated data...')

  try {
    // Start a transaction by deleting in the correct order to respect foreign key constraints
    
    // 1. Delete transaction lines first (they reference transactions)
    const { error: linesError, count: linesCount } = await supabase
      .from('universal_transaction_lines')
      .delete()
      .eq('organization_id', CIVICFLOW_DEMO_ORG_ID)
      .neq('smart_code', 'HERA.GOV.PLAYBOOK.LINE.STEP.V1') // Preserve playbook lines

    if (linesError) throw linesError
    console.log(`  ✓ Deleted ${linesCount || 0} transaction lines`)

    // 2. Delete transactions (except playbook transactions)
    const { error: txnError, count: txnCount } = await supabase
      .from('universal_transactions')
      .delete()
      .eq('organization_id', CIVICFLOW_DEMO_ORG_ID)
      .not('smart_code', 'like', '%PLAYBOOK%')

    if (txnError) throw txnError
    console.log(`  ✓ Deleted ${txnCount || 0} transactions`)

    // 3. Delete dynamic data (except playbook-related and entity metadata)
    const seedData = await loadSeedData()
    const seedEntityIds = (seedData.entities || []).map(e => e.id)
    
    const { error: dynError, count: dynCount } = await supabase
      .from('core_dynamic_data')
      .delete()
      .eq('organization_id', CIVICFLOW_DEMO_ORG_ID)
      .not('entity_id', 'in', `(${seedEntityIds.join(',')})`)

    if (dynError && dynError.code !== 'PGRST116') throw dynError // Ignore "no rows" error
    console.log(`  ✓ Deleted ${dynCount || 0} dynamic data records`)

    // 4. Delete relationships (except those in seed data)
    const seedRelIds = (seedData.relationships || []).map(r => r.id)
    
    if (seedRelIds.length > 0) {
      const { error: relError, count: relCount } = await supabase
        .from('core_relationships')
        .delete()
        .eq('organization_id', CIVICFLOW_DEMO_ORG_ID)
        .not('id', 'in', `(${seedRelIds.join(',')})`)

      if (relError && relError.code !== 'PGRST116') throw relError
      console.log(`  ✓ Deleted ${relCount || 0} relationships`)
    }

    // 5. Delete entities (except those in seed data and playbooks)
    if (seedEntityIds.length > 0) {
      const { error: entError, count: entCount } = await supabase
        .from('core_entities')
        .delete()
        .eq('organization_id', CIVICFLOW_DEMO_ORG_ID)
        .not('id', 'in', `(${seedEntityIds.join(',')})`)
        .not('entity_type', 'eq', 'playbook')

      if (entError && entError.code !== 'PGRST116') throw entError
      console.log(`  ✓ Deleted ${entCount || 0} entities`)
    }

  } catch (error) {
    console.error('❌ Error deleting data:', error)
    throw error
  }
}

async function replaySeedData(seedData: SeedData) {
  console.log('\n📥 Replaying seed data...')

  try {
    // 1. Replay entities
    if (seedData.entities && seedData.entities.length > 0) {
      const { error } = await supabase
        .from('core_entities')
        .upsert(seedData.entities, {
          onConflict: 'id',
          ignoreDuplicates: false
        })

      if (error) throw error
      console.log(`  ✓ Restored ${seedData.entities.length} entities`)
    }

    // 2. Replay relationships
    if (seedData.relationships && seedData.relationships.length > 0) {
      const { error } = await supabase
        .from('core_relationships')
        .upsert(seedData.relationships, {
          onConflict: 'id',
          ignoreDuplicates: false
        })

      if (error) throw error
      console.log(`  ✓ Restored ${seedData.relationships.length} relationships`)
    }

    // 3. Replay dynamic data
    if (seedData.dynamic_data && seedData.dynamic_data.length > 0) {
      const { error } = await supabase
        .from('core_dynamic_data')
        .upsert(seedData.dynamic_data, {
          onConflict: 'id',
          ignoreDuplicates: false
        })

      if (error) throw error
      console.log(`  ✓ Restored ${seedData.dynamic_data.length} dynamic data records`)
    }

    // 4. Process runs from the runs file
    if (seedData.runs && seedData.runs.length > 0) {
      let totalTransactions = 0
      let totalLines = 0

      for (const run of seedData.runs) {
        // Create run transaction
        const runTransaction = {
          id: run.id,
          organization_id: CIVICFLOW_DEMO_ORG_ID,
          transaction_type: 'playbook_run',
          transaction_date: new Date().toISOString(),
          smart_code: run.smart_code,
          total_amount: 0,
          metadata: {
            ...run.metadata,
            playbook_id: run.playbook_id,
            status: run.status,
            current_step: run.current_step
          }
        }

        const { error: runError } = await supabase
          .from('universal_transactions')
          .upsert(runTransaction, {
            onConflict: 'id',
            ignoreDuplicates: false
          })

        if (runError) throw runError
        totalTransactions++

        // Process each step
        for (const step of run.steps) {
          // Create step transaction lines
          const stepLine = {
            id: `${run.id}_${step.step_id}`,
            transaction_id: run.id,
            line_number: parseInt(step.step_id.split('_')[1]),
            organization_id: CIVICFLOW_DEMO_ORG_ID,
            line_amount: 0,
            smart_code: step.smart_code,
            metadata: {
              status: step.status,
              started_at: step.started_at,
              completed_at: step.completed_at
            }
          }

          const { error: stepError } = await supabase
            .from('universal_transaction_lines')
            .upsert(stepLine, {
              onConflict: 'id',
              ignoreDuplicates: false
            })

          if (stepError) throw stepError
          totalLines++

          // Create step transactions
          for (const txn of step.transactions) {
            const stepTxn = {
              id: `${run.id}_${step.step_id}_txn_${step.transactions.indexOf(txn) + 1}`,
              organization_id: CIVICFLOW_DEMO_ORG_ID,
              transaction_type: txn.transaction_type,
              transaction_date: step.started_at || new Date().toISOString(),
              smart_code: txn.smart_code,
              total_amount: txn.total_amount,
              metadata: {
                ...txn.metadata,
                run_id: run.id,
                step_id: step.step_id
              }
            }

            const { error: txnError } = await supabase
              .from('universal_transactions')
              .upsert(stepTxn, {
                onConflict: 'id',
                ignoreDuplicates: false
              })

            if (txnError) throw txnError
            totalTransactions++

            // Create transaction lines
            for (const line of txn.lines) {
              const txnLine = {
                id: `${stepTxn.id}_line_${line.line_number}`,
                transaction_id: stepTxn.id,
                line_number: line.line_number,
                organization_id: CIVICFLOW_DEMO_ORG_ID,
                line_amount: line.amount || 0,
                description: line.description,
                smart_code: line.smart_code
              }

              const { error: lineError } = await supabase
                .from('universal_transaction_lines')
                .upsert(txnLine, {
                  onConflict: 'id',
                  ignoreDuplicates: false
                })

              if (lineError) throw lineError
              totalLines++
            }
          }
        }
      }

      console.log(`  ✓ Restored ${seedData.runs.length} playbook runs`)
      console.log(`  ✓ Created ${totalTransactions} transactions`)
      console.log(`  ✓ Created ${totalLines} transaction lines`)
    }

  } catch (error) {
    console.error('❌ Error replaying seed data:', error)
    throw error
  }
}

async function verifyReset() {
  console.log('\n🔍 Verifying reset...')

  try {
    // Count entities
    const { count: entityCount } = await supabase
      .from('core_entities')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', CIVICFLOW_DEMO_ORG_ID)

    // Count relationships
    const { count: relCount } = await supabase
      .from('core_relationships')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', CIVICFLOW_DEMO_ORG_ID)

    // Count transactions
    const { count: txnCount } = await supabase
      .from('universal_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', CIVICFLOW_DEMO_ORG_ID)

    // Count playbooks
    const { count: playCount } = await supabase
      .from('core_entities')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', CIVICFLOW_DEMO_ORG_ID)
      .eq('entity_type', 'playbook')

    console.log(`  ✓ Entities: ${entityCount}`)
    console.log(`  ✓ Relationships: ${relCount}`)
    console.log(`  ✓ Transactions: ${txnCount}`)
    console.log(`  ✓ Playbooks: ${playCount}`)

  } catch (error) {
    console.error('❌ Error verifying reset:', error)
  }
}

// Main execution
async function main() {
  console.log('🏛️  CivicFlow Demo Reset Tool')
  console.log('============================')
  console.log(`Organization ID: ${CIVICFLOW_DEMO_ORG_ID}`)
  
  try {
    // Load seed data first
    const seedData = await loadSeedData()
    
    // Delete generated data
    await deleteGeneratedData()
    
    // Replay seed data
    await replaySeedData(seedData)
    
    // Verify the reset
    await verifyReset()
    
    console.log('\n✅ CivicFlow demo successfully reset!')
    
  } catch (error) {
    console.error('\n❌ Reset failed:', error)
    process.exit(1)
  }
}

// Execute if run directly
if (require.main === module) {
  main().catch(console.error)
}

export { main as resetCivicFlowDemo }