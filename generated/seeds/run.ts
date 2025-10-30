/**
 * HERA Executable Seeder
 * Generated from App Pack: Purchasing Rebate Processing v1.0.0
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
  console.log(`📦 App Pack: Purchasing Rebate Processing v1.0.0`)
  console.log(`🏢 Organization: ${orgId}`)
  console.log(`👤 Actor: ${actorId}`)
  console.log(`🔄 Dry Run: ${dryRun ? 'YES' : 'NO'}`)
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
        console.log(`  ✅ ${result.entity_type}: ${result.entity_name} (ID: ${result.entity_id})`)
        if (result.created_dynamic_fields > 0) {
          console.log(`     📊 Dynamic fields: ${result.created_dynamic_fields}`)
        }
        if (result.created_relationships > 0) {
          console.log(`     🔗 Relationships: ${result.created_relationships}`)
        }
      } else {
        console.log(`  ❌ ${result.entity_type}: ${result.error}`)
      }
    }
    
    console.log('')
    console.log('📊 SEEDING SUMMARY')
    console.log(`✅ Success: ${results.filter(r => r.success).length}`)
    console.log(`❌ Failed: ${results.filter(r => !r.success).length}`)
    console.log(`📊 Total dynamic fields: ${results.reduce((sum, r) => sum + r.created_dynamic_fields, 0)}`)
    console.log(`🔗 Total relationships: ${results.reduce((sum, r) => sum + r.created_relationships, 0)}`)
    
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
    throw new Error(`Actor ${actorId} not found or is not a USER entity`)
  }
  
  // Check if organization exists
  const { data: org, error: orgError } = await supabase
    .from('core_entities')
    .select('id, entity_name')
    .eq('id', orgId)
    .eq('entity_type', 'ORGANIZATION')
    .single()
    
  if (orgError || !org) {
    throw new Error(`Organization ${orgId} not found or is not an ORGANIZATION entity`)
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
    throw new Error(`Actor ${actor.entity_name} is not a member of organization ${org.entity_name}`)
  }
  
  console.log(`✅ Validated actor: ${actor.entity_name}`)
  console.log(`✅ Validated organization: ${org.entity_name}`)
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
      result.entity_id = `dry-run-${randomUUID()}`
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
      result.error = `RPC Error: ${error.message}`
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
  const samples = {
  "VENDOR": {
    "entity_name": "Sample Vendor",
    "entity_code": "SAMPLE_VENDOR_001",
    "dynamic_fields": [
      {
        "field_name": "vendor_name",
        "field_type": "text",
        "field_value_text": "Sample vendor_name",
        "smart_code": "HERA.PURCHASE.MASTER.VENDOR.FIELD.NAME.v1"
      },
      {
        "field_name": "tax_id",
        "field_type": "text",
        "field_value_text": "Sample tax_id",
        "smart_code": "HERA.PURCHASE.MASTER.VENDOR.FIELD.TAX_ID.v1"
      },
      {
        "field_name": "payment_terms",
        "field_type": "text",
        "field_value_text": "Sample payment_terms",
        "smart_code": "HERA.PURCHASE.MASTER.VENDOR.FIELD.PAYMENT_TERMS.v1"
      }
    ],
    "relationships": []
  },
  "REBATE_AGREEMENT": {
    "entity_name": "Sample Rebate Agreement",
    "entity_code": "SAMPLE_REBATE_AGREEMENT_001",
    "dynamic_fields": [
      {
        "field_name": "agreement_name",
        "field_type": "text",
        "field_value_text": "Sample agreement_name",
        "smart_code": "HERA.PURCHASE.REBATE.AGREEMENT.FIELD.NAME.v1"
      },
      {
        "field_name": "agreement_type",
        "field_type": "text",
        "field_value_text": "Sample agreement_type",
        "smart_code": "HERA.PURCHASE.REBATE.AGREEMENT.FIELD.TYPE.v1"
      },
      {
        "field_name": "valid_from",
        "field_type": "text",
        "field_value_text": "Sample valid_from",
        "smart_code": "HERA.PURCHASE.REBATE.AGREEMENT.FIELD.VALID_FROM.v1"
      }
    ],
    "relationships": []
  },
  "REBATE_TIER": {
    "entity_name": "Sample Rebate Tier",
    "entity_code": "SAMPLE_REBATE_TIER_001",
    "dynamic_fields": [
      {
        "field_name": "min_volume",
        "field_type": "number",
        "field_value_number": 100,
        "smart_code": "HERA.PURCHASE.REBATE.TIER.FIELD.MIN_VOLUME.v1"
      },
      {
        "field_name": "max_volume",
        "field_type": "number",
        "field_value_number": 100,
        "smart_code": "HERA.PURCHASE.REBATE.TIER.FIELD.MAX_VOLUME.v1"
      },
      {
        "field_name": "rate",
        "field_type": "number",
        "field_value_number": 100,
        "smart_code": "HERA.PURCHASE.REBATE.TIER.FIELD.RATE.v1"
      }
    ],
    "relationships": []
  },
  "PRODUCT": {
    "entity_name": "Premium Widget",
    "entity_code": "PROD_WIDGET_001",
    "dynamic_fields": [
      {
        "field_name": "price",
        "field_type": "number",
        "field_value_number": 299.99,
        "smart_code": "HERA.ENTERPRISE.PRODUCT.FIELD.PRICE.v1"
      },
      {
        "field_name": "category",
        "field_type": "text",
        "field_value_text": "Widgets",
        "smart_code": "HERA.ENTERPRISE.PRODUCT.FIELD.CATEGORY.v1"
      },
      {
        "field_name": "active",
        "field_type": "boolean",
        "field_value_boolean": true,
        "smart_code": "HERA.ENTERPRISE.PRODUCT.FIELD.ACTIVE.v1"
      }
    ],
    "relationships": []
  }
}
  
  return samples[entityDef.entity_type] || {
    entity_name: `Sample ${entityDef.entity_name}`,
    entity_code: `SAMPLE_${entityDef.entity_type}_001`,
    dynamic_fields: entityDef.fields.slice(0, 3).map((field, index) => ({
      field_name: field.name,
      field_type: field.type,
      field_value_text: field.type === 'text' ? `Sample ${field.name}` : undefined,
      field_value_number: field.type === 'number' ? 100 + index : undefined,
      field_value_boolean: field.type === 'boolean' ? true : undefined,
      smart_code: field.smart_code
    })),
    relationships: []
  }
}

// Generated entity definitions
const entities = [
  {
    "entity_type": "VENDOR",
    "entity_name": "Vendor",
    "description": "Supplier vendor master data",
    "smart_code": "HERA.PURCHASE.MASTER.VENDOR.ENTITY.v1",
    "icon": "building2",
    "fields": [
      {
        "name": "vendor_name",
        "type": "text",
        "required": true,
        "smart_code": "HERA.PURCHASE.MASTER.VENDOR.FIELD.NAME.v1"
      },
      {
        "name": "tax_id",
        "type": "text",
        "required": false,
        "smart_code": "HERA.PURCHASE.MASTER.VENDOR.FIELD.TAX_ID.v1"
      },
      {
        "name": "payment_terms",
        "type": "text",
        "required": false,
        "smart_code": "HERA.PURCHASE.MASTER.VENDOR.FIELD.PAYMENT_TERMS.v1"
      },
      {
        "name": "is_active",
        "type": "boolean",
        "required": true,
        "smart_code": "HERA.PURCHASE.MASTER.VENDOR.FIELD.IS_ACTIVE.v1"
      }
    ],
    "relationships": []
  },
  {
    "entity_type": "REBATE_AGREEMENT",
    "entity_name": "Rebate Agreement",
    "description": "Supplier rebate agreement header",
    "smart_code": "HERA.PURCHASE.REBATE.AGREEMENT.ENTITY.v1",
    "icon": "file-contract",
    "fields": [
      {
        "name": "agreement_name",
        "type": "text",
        "required": true,
        "smart_code": "HERA.PURCHASE.REBATE.AGREEMENT.FIELD.NAME.v1"
      },
      {
        "name": "agreement_type",
        "type": "text",
        "required": true,
        "smart_code": "HERA.PURCHASE.REBATE.AGREEMENT.FIELD.TYPE.v1"
      },
      {
        "name": "valid_from",
        "type": "text",
        "required": true,
        "smart_code": "HERA.PURCHASE.REBATE.AGREEMENT.FIELD.VALID_FROM.v1"
      },
      {
        "name": "valid_to",
        "type": "text",
        "required": true,
        "smart_code": "HERA.PURCHASE.REBATE.AGREEMENT.FIELD.VALID_TO.v1"
      },
      {
        "name": "base_rate",
        "type": "number",
        "required": true,
        "smart_code": "HERA.PURCHASE.REBATE.AGREEMENT.FIELD.BASE_RATE.v1"
      },
      {
        "name": "target_volume",
        "type": "number",
        "required": false,
        "smart_code": "HERA.PURCHASE.REBATE.AGREEMENT.FIELD.TARGET_VOLUME.v1"
      },
      {
        "name": "settlement_method",
        "type": "text",
        "required": true,
        "smart_code": "HERA.PURCHASE.REBATE.AGREEMENT.FIELD.SETTLEMENT_METHOD.v1"
      },
      {
        "name": "settlement_frequency",
        "type": "text",
        "required": true,
        "smart_code": "HERA.PURCHASE.REBATE.AGREEMENT.FIELD.SETTLEMENT_FREQUENCY.v1"
      },
      {
        "name": "status",
        "type": "text",
        "required": true,
        "smart_code": "HERA.PURCHASE.REBATE.AGREEMENT.FIELD.STATUS.v1"
      }
    ],
    "relationships": []
  },
  {
    "entity_type": "REBATE_TIER",
    "entity_name": "Rebate Tier",
    "description": "Volume-based rebate tier/slab definition",
    "smart_code": "HERA.PURCHASE.REBATE.TIER.ENTITY.v1",
    "icon": "layers",
    "fields": [
      {
        "name": "min_volume",
        "type": "number",
        "required": true,
        "smart_code": "HERA.PURCHASE.REBATE.TIER.FIELD.MIN_VOLUME.v1"
      },
      {
        "name": "max_volume",
        "type": "number",
        "required": true,
        "smart_code": "HERA.PURCHASE.REBATE.TIER.FIELD.MAX_VOLUME.v1"
      },
      {
        "name": "rate",
        "type": "number",
        "required": true,
        "smart_code": "HERA.PURCHASE.REBATE.TIER.FIELD.RATE.v1"
      }
    ],
    "relationships": []
  },
  {
    "entity_type": "PRODUCT",
    "entity_name": "Product",
    "description": "Product master for rebate eligibility",
    "smart_code": "HERA.PROCURE.MASTER.PRODUCT.ENTITY.v1",
    "icon": "package",
    "fields": [
      {
        "name": "product_name",
        "type": "text",
        "required": true,
        "smart_code": "HERA.PROCURE.MASTER.PRODUCT.FIELD.NAME.v1"
      },
      {
        "name": "product_code",
        "type": "text",
        "required": true,
        "smart_code": "HERA.PROCURE.MASTER.PRODUCT.FIELD.CODE.v1"
      },
      {
        "name": "category",
        "type": "text",
        "required": false,
        "smart_code": "HERA.PROCURE.MASTER.PRODUCT.FIELD.CATEGORY.v1"
      },
      {
        "name": "unit_price",
        "type": "number",
        "required": false,
        "smart_code": "HERA.PROCURE.MASTER.PRODUCT.FIELD.UNIT_PRICE.v1"
      }
    ],
    "relationships": []
  }
]

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
 */