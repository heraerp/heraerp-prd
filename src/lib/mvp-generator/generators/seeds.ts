/**
 * Executable Seeds Generator
 * Smart Code: HERA.LIB.MVP_GENERATOR.SEEDS.v1
 * 
 * Generates executable seeders that call hera_entities_crud_v1 and hera_txn_crud_v1
 * instead of just writing JSON plans
 */

import { AppPack, EntityDefinition, TransactionDefinition } from '../index'

export function generateExecutableSeeder(config: AppPack): string {
  return `/**
 * HERA Executable Seeder
 * Generated from App Pack: ${config.app.name} v${config.app.version}
 * 
 * This script creates sample data by calling HERA RPC functions directly
 */

import { createClient } from '@supabase/supabase-js'
import { randomUUID } from 'crypto'

// Environment configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://awfcrncxngqwbhqapffb.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Command line arguments
const args = process.argv.slice(2)
const orgId = args.find(arg => arg.startsWith('--org='))?.split('=')[1]
const actorId = args.find(arg => arg.startsWith('--actor='))?.split('=')[1]
const dryRun = args.includes('--dry-run')

if (!orgId) {
  console.error('❌ Usage: node run.ts --org=<organization_id> --actor=<actor_user_id> [--dry-run]')
  process.exit(1)
}

if (!actorId) {
  console.error('❌ Usage: node run.ts --org=<organization_id> --actor=<actor_user_id> [--dry-run]')
  process.exit(1)
}

interface SeedResult {
  entity_type: string
  entity_id: string
  entity_name: string
  success: boolean
  error?: string
  created_relationships: number
  created_dynamic_fields: number
}

/**
 * Main seeder execution
 */
async function main() {
  console.log('🌱 HERA Executable Seeder')
  console.log(\`📦 App Pack: ${config.app.name} v${config.app.version}\`)
  console.log(\`🏢 Organization: \${orgId}\`)
  console.log(\`👤 Actor: \${actorId}\`)
  console.log(\`🔄 Dry Run: \${dryRun ? 'YES' : 'NO'}\`)
  console.log('')

  if (dryRun) {
    console.log('🏃‍♂️ DRY RUN MODE - No data will be created')
    console.log('')
  }

  const results: SeedResult[] = []
  
  try {
    // Validate actor and organization
    await validateActorAndOrg(actorId, orgId)
    
    // Seed entities
    console.log('📝 Creating entities...')
    for (const entityDef of entities) {
      const result = await seedEntity(entityDef, orgId, actorId, dryRun)
      results.push(result)
      
      if (result.success) {
        console.log(\`  ✅ \${result.entity_type}: \${result.entity_name} (ID: \${result.entity_id})\`)
        if (result.created_dynamic_fields > 0) {
          console.log(\`     📊 Dynamic fields: \${result.created_dynamic_fields}\`)
        }
        if (result.created_relationships > 0) {
          console.log(\`     🔗 Relationships: \${result.created_relationships}\`)
        }
      } else {
        console.log(\`  ❌ \${result.entity_type}: \${result.error}\`)
      }
    }
    
    console.log('')
    console.log('📊 SEEDING SUMMARY')
    console.log(\`✅ Success: \${results.filter(r => r.success).length}\`)
    console.log(\`❌ Failed: \${results.filter(r => !r.success).length}\`)
    console.log(\`📊 Total dynamic fields: \${results.reduce((sum, r) => sum + r.created_dynamic_fields, 0)}\`)
    console.log(\`🔗 Total relationships: \${results.reduce((sum, r) => sum + r.created_relationships, 0)}\`)
    
    if (dryRun) {
      console.log('')
      console.log('🎯 To execute for real, run without --dry-run flag')
    }
    
  } catch (error) {
    console.error('💥 Seeding failed:', error)
    process.exit(1)
  }
}

/**
 * Validate that actor exists and has membership in organization
 */
async function validateActorAndOrg(actorId: string, orgId: string): Promise<void> {
  // Check if actor exists
  const { data: actor, error: actorError } = await supabase
    .from('core_entities')
    .select('id, entity_name')
    .eq('id', actorId)
    .eq('entity_type', 'USER')
    .single()
    
  if (actorError || !actor) {
    throw new Error(\`Actor \${actorId} not found or is not a USER entity\`)
  }
  
  // Check if organization exists
  const { data: org, error: orgError } = await supabase
    .from('core_entities')
    .select('id, entity_name')
    .eq('id', orgId)
    .eq('entity_type', 'ORGANIZATION')
    .single()
    
  if (orgError || !org) {
    throw new Error(\`Organization \${orgId} not found or is not an ORGANIZATION entity\`)
  }
  
  // Check if actor is member of organization
  const { data: membership, error: membershipError } = await supabase
    .from('core_relationships')
    .select('id')
    .eq('source_entity_id', actorId)
    .eq('target_entity_id', orgId)
    .eq('relationship_type', 'USER_MEMBER_OF_ORG')
    .eq('status', 'active')
    .single()
    
  if (membershipError || !membership) {
    throw new Error(\`Actor \${actor.entity_name} is not a member of organization \${org.entity_name}\`)
  }
  
  console.log(\`✅ Validated actor: \${actor.entity_name}\`)
  console.log(\`✅ Validated organization: \${org.entity_name}\`)
  console.log('')
}

/**
 * Seed a single entity with its dynamic fields and relationships
 */
async function seedEntity(
  entityDef: EntityDefinition, 
  orgId: string, 
  actorId: string, 
  dryRun: boolean
): Promise<SeedResult> {
  const sampleData = getSampleDataForEntity(entityDef)
  
  const result: SeedResult = {
    entity_type: entityDef.entity_type,
    entity_id: '',
    entity_name: sampleData.entity_name,
    success: false,
    created_relationships: 0,
    created_dynamic_fields: 0
  }
  
  try {
    if (dryRun) {
      result.entity_id = \`dry-run-\${randomUUID()}\`
      result.success = true
      result.created_dynamic_fields = sampleData.dynamic_fields?.length || 0
      result.created_relationships = sampleData.relationships?.length || 0
      return result
    }
    
    // Call hera_entities_crud_v1 to create entity
    const { data, error } = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'CREATE',
      p_actor_user_id: actorId,
      p_organization_id: orgId,
      p_entity: {
        entity_type: entityDef.entity_type,
        entity_name: sampleData.entity_name,
        entity_code: sampleData.entity_code,
        smart_code: entityDef.smart_code,
        organization_id: orgId
      },
      p_dynamic: sampleData.dynamic_fields || [],
      p_relationships: sampleData.relationships || [],
      p_options: {}
    })
    
    if (error) {
      result.error = \`RPC Error: \${error.message}\`
      return result
    }
    
    if (!data?.entity_id) {
      result.error = 'No entity_id returned from RPC'
      return result
    }
    
    result.entity_id = data.entity_id
    result.success = true
    result.created_dynamic_fields = sampleData.dynamic_fields?.length || 0
    result.created_relationships = sampleData.relationships?.length || 0
    
    return result
    
  } catch (error: any) {
    result.error = error.message || 'Unknown error'
    return result
  }
}

/**
 * Generate sample data for entity type
 */
function getSampleDataForEntity(entityDef: EntityDefinition): any {
  const samples = ${JSON.stringify(generateSampleDataMap(config), null, 2)}
  
  return samples[entityDef.entity_type] || {
    entity_name: \`Sample \$\{entityDef.entity_name\}\`,
    entity_code: \`SAMPLE_\$\{entityDef.entity_type\}_001\`,
    dynamic_fields: entityDef.fields.slice(0, 3).map((field, index) => ({
      field_name: field.name,
      field_type: field.type,
      field_value_text: field.type === 'text' ? \`Sample \$\{field.name\}\` : undefined,
      field_value_number: field.type === 'number' ? 100 + index : undefined,
      field_value_boolean: field.type === 'boolean' ? true : undefined,
      smart_code: field.smart_code
    })),
    relationships: []
  }
}

// Generated entity definitions
const entities = ${JSON.stringify(config.entities, null, 2)}

// Execute if called directly
if (require.main === module) {
  main().catch(console.error)
}

/**
 * Usage Examples:
 * 
 * # Create sample data in development
 * node seeds/run.ts --org=6e1954fe-e34a-4056-84f4-745e5b8378ec --actor=user-uuid
 * 
 * # Dry run to see what would be created
 * node seeds/run.ts --org=6e1954fe-e34a-4056-84f4-745e5b8378ec --actor=user-uuid --dry-run
 * 
 * # With environment variables
 * SUPABASE_URL=https://xxx.supabase.co SUPABASE_SERVICE_ROLE_KEY=xxx node seeds/run.ts --org=xxx --actor=xxx
 */`
}

export function generateSeedPlan(config: AppPack): any {
  return {
    app: {
      name: config.app.name,
      version: config.app.version,
      smart_code: config.app.smart_code
    },
    entities: config.entities.map(entity => ({
      entity_type: entity.entity_type,
      entity_name: entity.entity_name,
      smart_code: entity.smart_code,
      sample_count: getSampleCountForEntity(entity.entity_type),
      dynamic_fields_count: entity.fields.length,
      relationships_count: entity.relationships.length
    })),
    transactions: config.transactions.map(transaction => ({
      transaction_type: transaction.transaction_type,
      transaction_name: transaction.transaction_name,
      smart_code: transaction.smart_code,
      sample_count: getSampleCountForTransaction(transaction.transaction_type),
      lines_count: transaction.lines.length
    })),
    execution_plan: {
      total_entities: config.entities.length,
      total_transactions: config.transactions.length,
      estimated_duration: '2-5 minutes',
      prerequisites: [
        'Valid organization_id',
        'Valid actor_user_id with membership',
        'SUPABASE_SERVICE_ROLE_KEY environment variable'
      ]
    }
  }
}

function generateSampleDataMap(config: AppPack): Record<string, any> {
  const sampleData: Record<string, any> = {}
  
  config.entities.forEach(entity => {
    sampleData[entity.entity_type] = generateSampleForEntityType(entity)
  })
  
  return sampleData
}

function generateSampleForEntityType(entity: EntityDefinition): any {
  // Entity type specific samples
  const typeSpecificSamples: Record<string, any> = {
    'CUSTOMER': {
      entity_name: 'Acme Corporation',
      entity_code: 'CUST_ACME_001',
      dynamic_fields: [
        {
          field_name: 'email',
          field_type: 'text',
          field_value_text: 'contact@acme.com',
          smart_code: 'HERA.ENTERPRISE.CUSTOMER.FIELD.EMAIL.v1'
        },
        {
          field_name: 'phone',
          field_type: 'text',
          field_value_text: '+1-555-0123',
          smart_code: 'HERA.ENTERPRISE.CUSTOMER.FIELD.PHONE.v1'
        },
        {
          field_name: 'credit_limit',
          field_type: 'number',
          field_value_number: 10000.00,
          smart_code: 'HERA.ENTERPRISE.CUSTOMER.FIELD.CREDIT_LIMIT.v1'
        }
      ],
      relationships: []
    },
    'PRODUCT': {
      entity_name: 'Premium Widget',
      entity_code: 'PROD_WIDGET_001',
      dynamic_fields: [
        {
          field_name: 'price',
          field_type: 'number',
          field_value_number: 299.99,
          smart_code: 'HERA.ENTERPRISE.PRODUCT.FIELD.PRICE.v1'
        },
        {
          field_name: 'category',
          field_type: 'text',
          field_value_text: 'Widgets',
          smart_code: 'HERA.ENTERPRISE.PRODUCT.FIELD.CATEGORY.v1'
        },
        {
          field_name: 'active',
          field_type: 'boolean',
          field_value_boolean: true,
          smart_code: 'HERA.ENTERPRISE.PRODUCT.FIELD.ACTIVE.v1'
        }
      ],
      relationships: []
    },
    'ACCOUNT': {
      entity_name: 'Global Manufacturing Inc',
      entity_code: 'ACC_GLOBAL_001',
      dynamic_fields: [
        {
          field_name: 'industry',
          field_type: 'text',
          field_value_text: 'Manufacturing',
          smart_code: 'HERA.ENTERPRISE.ACCOUNT.FIELD.INDUSTRY.v1'
        },
        {
          field_name: 'revenue',
          field_type: 'number',
          field_value_number: 50000000,
          smart_code: 'HERA.ENTERPRISE.ACCOUNT.FIELD.REVENUE.v1'
        }
      ],
      relationships: []
    }
  }
  
  return typeSpecificSamples[entity.entity_type] || {
    entity_name: `Sample ${entity.entity_name}`,
    entity_code: `SAMPLE_${entity.entity_type}_001`,
    dynamic_fields: entity.fields.slice(0, 3).map(field => ({
      field_name: field.name,
      field_type: field.type,
      field_value_text: field.type === 'text' ? `Sample ${field.name}` : undefined,
      field_value_number: field.type === 'number' ? 100 : undefined,
      field_value_boolean: field.type === 'boolean' ? true : undefined,
      smart_code: field.smart_code
    })),
    relationships: []
  }
}

function getSampleCountForEntity(entityType: string): number {
  const counts: Record<string, number> = {
    'CUSTOMER': 5,
    'PRODUCT': 10,
    'ACCOUNT': 3,
    'CONTACT': 8,
    'LEAD': 6,
    'OPPORTUNITY': 4
  }
  
  return counts[entityType] || 2
}

function getSampleCountForTransaction(transactionType: string): number {
  const counts: Record<string, number> = {
    'SALE': 10,
    'PURCHASE': 8,
    'PAYMENT': 15,
    'INVOICE': 12
  }
  
  return counts[transactionType] || 5
}