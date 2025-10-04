#!/usr/bin/env tsx
/**
 * HERA Salon Services - Branch Availability Backfill Script
 *
 * Purpose: Bulk link all existing services to all branches using AVAILABLE_AT relationship
 * Smart Code: HERA.SALON.SERVICE.REL.AVAILABLE_AT.V1
 *
 * Usage:
 *   tsx scripts/backfill/service-available-at.ts <organization_id>
 *
 * Example:
 *   tsx scripts/backfill/service-available-at.ts f8e3d5c1-4a2b-9c7d-1e3f-8a9b2c3d4e5f
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL')
  console.error('   SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

interface BackfillStats {
  totalServices: number
  totalBranches: number
  totalPairs: number
  created: number
  skipped: number
  errors: number
  startTime: Date
  endTime?: Date
}

async function fetchServices(organizationId: string) {
  console.log('📋 Fetching services...')

  const { data, error } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_code')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'service')
    .neq('status', 'deleted')

  if (error) {
    throw new Error(`Failed to fetch services: ${error.message}`)
  }

  console.log(`   ✓ Found ${data.length} services`)
  return data
}

async function fetchBranches(organizationId: string) {
  console.log('📋 Fetching branches...')

  const { data, error } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_code')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'branch')
    .neq('status', 'deleted')

  if (error) {
    throw new Error(`Failed to fetch branches: ${error.message}`)
  }

  console.log(`   ✓ Found ${data.length} branches`)
  return data
}

async function checkExistingRelationships(organizationId: string, serviceIds: string[], branchIds: string[]) {
  console.log('🔍 Checking existing relationships...')

  const { data, error } = await supabase
    .from('core_relationships')
    .select('from_entity_id, to_entity_id')
    .eq('organization_id', organizationId)
    .eq('relationship_type', 'AVAILABLE_AT')
    .in('from_entity_id', serviceIds)
    .in('to_entity_id', branchIds)

  if (error) {
    throw new Error(`Failed to check existing relationships: ${error.message}`)
  }

  // Create a Set of existing pairs for fast lookup
  const existingPairs = new Set(
    data.map(r => `${r.from_entity_id}:${r.to_entity_id}`)
  )

  console.log(`   ✓ Found ${existingPairs.size} existing relationships`)
  return existingPairs
}

async function createRelationshipBatch(
  organizationId: string,
  batch: Array<{ serviceId: string; branchId: string }>,
  stats: BackfillStats
) {
  const relationships = batch.map(({ serviceId, branchId }) => ({
    organization_id: organizationId,
    from_entity_id: serviceId,
    to_entity_id: branchId,
    relationship_type: 'AVAILABLE_AT',
    relationship_direction: 'FORWARD',
    smart_code: 'HERA.SALON.SERVICE.REL.AVAILABLE_AT.V1',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))

  const { data, error } = await supabase
    .from('core_relationships')
    .insert(relationships)
    .select('id')

  if (error) {
    console.error(`   ✗ Batch failed: ${error.message}`)
    stats.errors += batch.length
    return
  }

  stats.created += data?.length || 0
}

async function backfillServiceBranchRelationships(organizationId: string) {
  const stats: BackfillStats = {
    totalServices: 0,
    totalBranches: 0,
    totalPairs: 0,
    created: 0,
    skipped: 0,
    errors: 0,
    startTime: new Date()
  }

  try {
    console.log('🚀 HERA Salon Services - Branch Availability Backfill')
    console.log('=' .repeat(60))
    console.log(`Organization ID: ${organizationId}`)
    console.log(`Started: ${stats.startTime.toISOString()}`)
    console.log('')

    // Fetch all services and branches
    const services = await fetchServices(organizationId)
    const branches = await fetchBranches(organizationId)

    stats.totalServices = services.length
    stats.totalBranches = branches.length
    stats.totalPairs = services.length * branches.length

    if (services.length === 0) {
      console.log('⚠️  No services found. Nothing to backfill.')
      return stats
    }

    if (branches.length === 0) {
      console.log('⚠️  No branches found. Nothing to backfill.')
      return stats
    }

    console.log('')
    console.log(`📊 Total pairs to process: ${stats.totalPairs}`)
    console.log('')

    // Check existing relationships to avoid duplicates
    const serviceIds = services.map(s => s.id)
    const branchIds = branches.map(b => b.id)
    const existingPairs = await checkExistingRelationships(organizationId, serviceIds, branchIds)

    // Create all (service, branch) pairs that don't exist yet
    const pairsToCreate: Array<{ serviceId: string; branchId: string; serviceName: string; branchName: string }> = []

    for (const service of services) {
      for (const branch of branches) {
        const pairKey = `${service.id}:${branch.id}`
        if (!existingPairs.has(pairKey)) {
          pairsToCreate.push({
            serviceId: service.id,
            branchId: branch.id,
            serviceName: service.entity_name,
            branchName: branch.entity_name
          })
        } else {
          stats.skipped++
        }
      }
    }

    console.log(`   ✓ Pairs to create: ${pairsToCreate.length}`)
    console.log(`   ✓ Pairs to skip (already exist): ${stats.skipped}`)
    console.log('')

    if (pairsToCreate.length === 0) {
      console.log('✅ All relationships already exist. Nothing to create.')
      return stats
    }

    // Process in batches of 500
    const BATCH_SIZE = 500
    const batches = []
    for (let i = 0; i < pairsToCreate.length; i += BATCH_SIZE) {
      batches.push(pairsToCreate.slice(i, i + BATCH_SIZE))
    }

    console.log(`🔄 Processing ${batches.length} batches...`)
    console.log('')

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]
      const batchNum = i + 1
      const progress = ((batchNum / batches.length) * 100).toFixed(1)

      console.log(`   Batch ${batchNum}/${batches.length} (${progress}%) - ${batch.length} pairs`)

      await createRelationshipBatch(organizationId, batch, stats)

      // Small delay between batches to avoid overwhelming the database
      if (i < batches.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    stats.endTime = new Date()
    const durationMs = stats.endTime.getTime() - stats.startTime.getTime()
    const durationSec = (durationMs / 1000).toFixed(2)

    console.log('')
    console.log('=' .repeat(60))
    console.log('✅ Backfill Complete')
    console.log('=' .repeat(60))
    console.log(`Total Services:    ${stats.totalServices}`)
    console.log(`Total Branches:    ${stats.totalBranches}`)
    console.log(`Total Pairs:       ${stats.totalPairs}`)
    console.log(`Created:           ${stats.created}`)
    console.log(`Skipped (exists):  ${stats.skipped}`)
    console.log(`Errors:            ${stats.errors}`)
    console.log(`Duration:          ${durationSec}s`)
    console.log('=' .repeat(60))

    return stats

  } catch (error) {
    stats.endTime = new Date()
    console.error('')
    console.error('=' .repeat(60))
    console.error('❌ Backfill Failed')
    console.error('=' .repeat(60))
    console.error(error)
    console.error('=' .repeat(60))
    throw error
  }
}

// Main execution
async function main() {
  const organizationId = process.argv[2]

  if (!organizationId) {
    console.error('❌ Error: Organization ID required')
    console.error('')
    console.error('Usage:')
    console.error('  tsx scripts/backfill/service-available-at.ts <organization_id>')
    console.error('')
    console.error('Example:')
    console.error('  tsx scripts/backfill/service-available-at.ts f8e3d5c1-4a2b-9c7d-1e3f-8a9b2c3d4e5f')
    process.exit(1)
  }

  // Validate UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (!uuidRegex.test(organizationId)) {
    console.error(`❌ Error: Invalid organization ID format: ${organizationId}`)
    console.error('   Expected UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx')
    process.exit(1)
  }

  try {
    await backfillServiceBranchRelationships(organizationId)
    process.exit(0)
  } catch (error) {
    process.exit(1)
  }
}

main()
