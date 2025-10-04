/**
 * Backfill Branch Relationships Script
 * Smart Code: HERA.SCRIPT.BACKFILL_BRANCH_RELATIONSHIPS.V1
 * 
 * This script helps migrate existing data to use branch relationships
 * instead of metadata.branch_id
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.log('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface BackfillOptions {
  organizationId?: string
  dryRun?: boolean
  createDefaultBranch?: boolean
}

async function backfillBranchRelationships(options: BackfillOptions = {}) {
  const { organizationId, dryRun = false, createDefaultBranch = true } = options

  console.log('🚀 Starting branch relationship backfill...')
  console.log('Options:', { organizationId, dryRun, createDefaultBranch })

  try {
    // Get organizations to process
    let orgsQuery = supabase.from('core_organizations').select('id, organization_name')
    if (organizationId) {
      orgsQuery = orgsQuery.eq('id', organizationId)
    }
    const { data: organizations, error: orgError } = await orgsQuery

    if (orgError) throw orgError
    if (!organizations || organizations.length === 0) {
      console.log('❌ No organizations found')
      return
    }
    
    // For demo purposes, filter to show salon organizations
    if (!organizationId) {
      console.log('\n📋 Available organizations:')
      const salonOrgs = organizations.filter(org => 
        org.organization_name.toLowerCase().includes('salon') || 
        org.organization_name.toLowerCase().includes('hair') ||
        org.organization_name.toLowerCase().includes('beauty')
      )
      
      if (salonOrgs.length > 0) {
        console.log('🏢 Salon organizations found:')
        salonOrgs.forEach(org => {
          console.log(`  - ${org.organization_name} (${org.id})`)
        })
        console.log('\nTip: Use --org <id> to process a specific organization\n')
      }
    }

    console.log(`📋 Processing ${organizations.length} organization(s)`)

    for (const org of organizations) {
      console.log(`\n🏢 Processing organization: ${org.organization_name} (${org.id})`)

      // 1. Check for existing branches
      const { data: branches, error: branchError } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', org.id)
        .eq('entity_type', 'BRANCH')
        .neq('status', 'deleted')

      if (branchError) throw branchError

      let defaultBranchId: string | null = null

      if (!branches || branches.length === 0) {
        if (createDefaultBranch) {
          console.log('  📍 Creating default branch...')
          
          if (!dryRun) {
            const { data: newBranch, error: createError } = await supabase
              .from('core_entities')
              .insert({
                organization_id: org.id,
                entity_type: 'BRANCH',
                entity_name: 'Main Branch',
                entity_code: 'BR-001',
                smart_code: 'HERA.SALON.BRANCH.ENTITY.LOCATION.V1',
                metadata: { is_default: true }
              })
              .select()
              .single()

            if (createError) throw createError
            defaultBranchId = newBranch.id
            console.log('  ✅ Created default branch:', defaultBranchId)
          } else {
            console.log('  📝 [DRY RUN] Would create default branch')
          }
        } else {
          console.log('  ⚠️  No branches found and createDefaultBranch is false')
          continue
        }
      } else {
        // Find default branch or use first one
        const defaultBranch = branches.find(b => b.metadata?.is_default) || branches[0]
        defaultBranchId = defaultBranch.id
        console.log(`  📍 Using branch: ${defaultBranch.entity_name} (${defaultBranchId})`)
      }

      // 2. Process each entity type
      const entityTypes = [
        { type: 'STAFF', relationship: 'MEMBER_OF', smartCode: 'HERA.SALON.STAFF.REL.MEMBER_OF.V1' },
        { type: 'SERVICE', relationship: 'AVAILABLE_AT', smartCode: 'HERA.SALON.SERVICE.REL.AVAILABLE_AT.V1' },
        { type: 'PRODUCT', relationship: 'STOCK_AT', smartCode: 'HERA.SALON.PRODUCT.REL.STOCK_AT.V1' },
        { type: 'CUSTOMER', relationship: 'CUSTOMER_OF', smartCode: 'HERA.SALON.CUSTOMER.REL.CUSTOMER_OF.V1' }
      ]

      for (const entityConfig of entityTypes) {
        console.log(`\n  📊 Processing ${entityConfig.type} entities...`)

        // Get entities without branch relationships
        const { data: entities, error: entityError } = await supabase
          .from('core_entities')
          .select('id, entity_name, metadata')
          .eq('organization_id', org.id)
          .eq('entity_type', entityConfig.type)
          .neq('status', 'deleted')

        if (entityError) throw entityError
        if (!entities || entities.length === 0) {
          console.log(`    No ${entityConfig.type} entities found`)
          continue
        }

        // Check which ones already have branch relationships
        const entityIds = entities.map(e => e.id)
        const { data: existingRelationships, error: relError } = await supabase
          .from('core_relationships')
          .select('from_entity_id')
          .eq('organization_id', org.id)
          .eq('relationship_type', entityConfig.relationship)
          .in('from_entity_id', entityIds)

        if (relError) throw relError

        const entitiesWithRelationships = new Set(existingRelationships?.map(r => r.from_entity_id) || [])
        const entitiesToLink = entities.filter(e => !entitiesWithRelationships.has(e.id))

        console.log(`    Found ${entities.length} ${entityConfig.type} entities`)
        console.log(`    ${entitiesWithRelationships.size} already have branch relationships`)
        console.log(`    ${entitiesToLink.length} need branch relationships`)

        if (entitiesToLink.length === 0) continue

        // Create relationships
        if (!dryRun && defaultBranchId) {
          const relationships = entitiesToLink.map(entity => {
            // Use metadata.branch_id if available, otherwise use default
            const targetBranchId = entity.metadata?.branch_id || defaultBranchId

            return {
              organization_id: org.id,
              from_entity_id: entity.id,
              to_entity_id: targetBranchId,
              relationship_type: entityConfig.relationship,
              smart_code: entityConfig.smartCode,
              relationship_direction: 'forward',
              is_active: true,
              metadata: {
                migrated_from_metadata: true,
                migration_date: new Date().toISOString()
              }
            }
          })

          // Insert in batches of 100
          const batchSize = 100
          for (let i = 0; i < relationships.length; i += batchSize) {
            const batch = relationships.slice(i, i + batchSize)
            const { error: insertError } = await supabase
              .from('core_relationships')
              .insert(batch)

            if (insertError) {
              console.error(`    ❌ Error inserting batch: ${insertError.message}`)
            } else {
              console.log(`    ✅ Created ${batch.length} relationships`)
            }
          }
        } else {
          console.log(`    📝 [DRY RUN] Would create ${entitiesToLink.length} relationships`)
        }
      }
    }

    console.log('\n✅ Backfill completed successfully!')

  } catch (error) {
    console.error('❌ Backfill failed:', error)
    process.exit(1)
  }
}

// Command line interface
const args = process.argv.slice(2)
const options: BackfillOptions = {}

// Parse arguments
for (let i = 0; i < args.length; i++) {
  switch (args[i]) {
    case '--org':
    case '--organization':
      options.organizationId = args[++i]
      break
    case '--dry-run':
      options.dryRun = true
      break
    case '--no-default-branch':
      options.createDefaultBranch = false
      break
    case '--help':
      console.log(`
Branch Relationship Backfill Script

Usage: npm run backfill:branches [options]

Options:
  --org, --organization <id>   Process only the specified organization
  --dry-run                    Show what would be done without making changes
  --no-default-branch          Don't create a default branch if none exists
  --help                       Show this help message

Examples:
  npm run backfill:branches --dry-run
  npm run backfill:branches --org 378f24fb-d496-4ff7-8afa-ea34895a0eb8
  npm run backfill:branches --org your-salon-org-id --no-default-branch

Common Salon Organization IDs:
  Hair Talkz: 378f24fb-d496-4ff7-8afa-ea34895a0eb8
  Demo Salon: Look for organizations with 'Salon' or 'Hair' in the name
      `)
      process.exit(0)
  }
}

// Run the backfill
backfillBranchRelationships(options)