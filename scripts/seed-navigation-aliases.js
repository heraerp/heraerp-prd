#!/usr/bin/env node

/**
 * Seed Navigation Aliases Script
 * Creates alias mappings that point to canonical operations
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'
import { v4 as uuidv4 } from 'uuid'

const PLATFORM_ORGANIZATION_ID = '00000000-0000-0000-0000-000000000000'
const HERA_PLATFORM_USER_ID = '00000000-0000-0000-0000-000000000001'

console.log('🌱 HERA Navigation Aliases Seeding')
console.log('Project:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('=' .repeat(50))

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Alias definitions that map alternative URLs to canonical operations
 */
const ALIAS_DEFINITIONS = [
  // Waste Management aliases for enterprise operations
  {
    alias_code: 'WM_CUSTOMERS_ALIAS',
    alias_name: 'WM Customers Alias',
    alias_path: '/wm/customers',
    route_suffixes: ['new', 'list'],
    target_canonical_code: 'WM_CUSTOMERS_LIST',
    smart_code: 'HERA.WM.NAV.ALIAS.CUSTOMERS.v1'
  },
  {
    alias_code: 'WM_VENDORS_ALIAS',
    alias_name: 'WM Vendors Alias',
    alias_path: '/wm/vendors',
    route_suffixes: ['new', 'list'],
    target_canonical_code: 'PROC_VENDORS_LIST',
    smart_code: 'HERA.WM.NAV.ALIAS.VENDORS.v1'
  },
  {
    alias_code: 'WM_FINANCE_ALIAS',
    alias_name: 'WM Finance Alias',
    alias_path: '/wm/finance',
    route_suffixes: ['gl', 'ap', 'ar'],
    target_canonical_code: 'FIN_GL_LIST',
    smart_code: 'HERA.WM.NAV.ALIAS.FINANCE.v1'
  },
  
  // Jewelry aliases for enterprise operations
  {
    alias_code: 'JEWELRY_FINANCE_ALIAS',
    alias_name: 'Jewelry Finance Alias',
    alias_path: '/jewelry/finance',
    route_suffixes: ['gl', 'ap', 'ar'],
    target_canonical_code: 'FIN_GL_LIST',
    smart_code: 'HERA.JEWELRY.NAV.ALIAS.FINANCE.v1'
  },
  {
    alias_code: 'JEWELRY_VENDORS_ALIAS',
    alias_name: 'Jewelry Vendors Alias',
    alias_path: '/jewelry/vendors',
    route_suffixes: ['new', 'list'],
    target_canonical_code: 'PROC_VENDORS_LIST',
    smart_code: 'HERA.JEWELRY.NAV.ALIAS.VENDORS.v1'
  },
  {
    alias_code: 'JEWELRY_PROCUREMENT_ALIAS',
    alias_name: 'Jewelry Procurement Alias',
    alias_path: '/jewelry/procurement',
    route_suffixes: ['po', 'requisitions'],
    target_canonical_code: 'PROC_PO_LIST',
    smart_code: 'HERA.JEWELRY.NAV.ALIAS.PROCUREMENT.v1'
  },
  
  // Short form aliases for common operations
  {
    alias_code: 'CUSTOMERS_SHORT_ALIAS',
    alias_name: 'Customers Short Alias',
    alias_path: '/customers',
    route_suffixes: ['new', 'list'],
    target_canonical_code: 'JEWELRY_CUSTOMERS_LIST', // Default to jewelry for demo
    smart_code: 'HERA.PLATFORM.NAV.ALIAS.CUSTOMERS.v1'
  },
  {
    alias_code: 'VENDORS_SHORT_ALIAS',
    alias_name: 'Vendors Short Alias',
    alias_path: '/vendors',
    route_suffixes: ['new', 'list'],
    target_canonical_code: 'PROC_VENDORS_LIST',
    smart_code: 'HERA.PLATFORM.NAV.ALIAS.VENDORS.v1'
  },
  {
    alias_code: 'FINANCE_SHORT_ALIAS',
    alias_name: 'Finance Short Alias',
    alias_path: '/finance',
    route_suffixes: ['gl', 'ap', 'ar'],
    target_canonical_code: 'FIN_GL_LIST',
    smart_code: 'HERA.PLATFORM.NAV.ALIAS.FINANCE.v1'
  },
  
  // Legacy/compatibility aliases
  {
    alias_code: 'ENTERPRISE_CUSTOMERS_ALIAS',
    alias_name: 'Enterprise Customers Alias',
    alias_path: '/enterprise/customers',
    route_suffixes: ['new', 'list'],
    target_canonical_code: 'JEWELRY_CUSTOMERS_LIST',
    smart_code: 'HERA.ENTERPRISE.NAV.ALIAS.CUSTOMERS.v1'
  }
]

/**
 * Create alias entity
 */
async function createAliasEntity(aliasDef) {
  console.log(`🔗 Creating alias entity: ${aliasDef.alias_name}`)
  
  const entity = {
    id: uuidv4(),
    organization_id: PLATFORM_ORGANIZATION_ID,
    entity_type: 'navigation_alias',
    entity_name: aliasDef.alias_name,
    entity_code: aliasDef.alias_code,
    smart_code: aliasDef.smart_code,
    metadata: {
      alias_path: aliasDef.alias_path,
      route_suffixes: aliasDef.route_suffixes,
      target_canonical_code: aliasDef.target_canonical_code
    },
    created_by: HERA_PLATFORM_USER_ID,
    updated_by: HERA_PLATFORM_USER_ID,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
  
  const { data, error } = await supabase
    .from('core_entities')
    .insert(entity)
    .select('id')
    .single()
  
  if (error) {
    console.error(`❌ Error creating alias entity ${aliasDef.alias_code}:`, error)
    return null
  }
  
  return data.id
}

/**
 * Create alias relationship to canonical operation
 */
async function createAliasRelationship(aliasId, canonicalId, aliasDef) {
  console.log(`🔗 Creating alias relationship: ${aliasDef.alias_code} → ${aliasDef.target_canonical_code}`)
  
  const relationship = {
    id: uuidv4(),
    from_entity_id: aliasId,
    to_entity_id: canonicalId,
    relationship_type: 'ALIAS_OF_OPERATION',
    relationship_direction: 'forward',
    relationship_strength: 1,
    organization_id: PLATFORM_ORGANIZATION_ID,
    smart_code: `HERA.PLATFORM.NAV.REL.ALIAS.${aliasDef.alias_code}.v1`,
    smart_code_status: 'ACTIVE',
    ai_confidence: 1,
    is_active: true,
    effective_date: new Date().toISOString(),
    relationship_data: {
      alias_path: aliasDef.alias_path,
      route_suffixes: aliasDef.route_suffixes
    },
    created_by: HERA_PLATFORM_USER_ID,
    updated_by: HERA_PLATFORM_USER_ID,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
    ai_classification: null,
    ai_insights: {},
    business_logic: {},
    validation_rules: {}
  }
  
  const { error } = await supabase
    .from('core_relationships')
    .insert(relationship)
  
  if (error) {
    console.error(`❌ Error creating alias relationship:`, error)
    return false
  }
  
  return true
}

/**
 * Find canonical operation by code
 */
async function findCanonicalOperation(canonicalCode) {
  const { data, error } = await supabase
    .from('core_entities')
    .select('id')
    .eq('entity_type', 'navigation_canonical')
    .eq('entity_code', canonicalCode)
    .eq('organization_id', PLATFORM_ORGANIZATION_ID)
    .single()
  
  if (error) {
    console.error(`❌ Error finding canonical operation ${canonicalCode}:`, error)
    return null
  }
  
  return data?.id
}

/**
 * Main seeding function
 */
async function seedNavigationAliases() {
  try {
    console.log('\n🌱 Seeding navigation aliases...')
    
    let successCount = 0
    let relationshipCount = 0
    
    for (const aliasDef of ALIAS_DEFINITIONS) {
      // Find the target canonical operation
      const canonicalId = await findCanonicalOperation(aliasDef.target_canonical_code)
      if (!canonicalId) {
        console.error(`❌ Canonical operation not found: ${aliasDef.target_canonical_code}`)
        continue
      }
      
      // Create alias entity
      const aliasId = await createAliasEntity(aliasDef)
      if (!aliasId) continue
      
      successCount++
      
      // Create alias relationship
      const relationshipCreated = await createAliasRelationship(aliasId, canonicalId, aliasDef)
      if (relationshipCreated) {
        relationshipCount++
      }
    }
    
    console.log(`\n🎉 NAVIGATION ALIASES SEEDED!`)
    console.log(`✅ Successfully created: ${successCount}/${ALIAS_DEFINITIONS.length} aliases`)
    console.log(`✅ Successfully created: ${relationshipCount}/${ALIAS_DEFINITIONS.length} relationships`)
    
    console.log('\n🔍 Verification queries:')
    console.log(`
-- Aliases
SELECT entity_code, entity_name, metadata->>'alias_path' as alias_path
FROM core_entities 
WHERE entity_type = 'navigation_alias'
  AND organization_id = '${PLATFORM_ORGANIZATION_ID}'
ORDER BY entity_code;

-- Alias relationships
SELECT 
  a.entity_code as alias_code,
  c.entity_code as canonical_code,
  r.relationship_data->>'alias_path' as alias_path
FROM core_relationships r
JOIN core_entities a ON a.id = r.from_entity_id
JOIN core_entities c ON c.id = r.to_entity_id
WHERE r.relationship_type = 'ALIAS_OF_OPERATION'
  AND r.organization_id = '${PLATFORM_ORGANIZATION_ID}'
ORDER BY a.entity_code;
    `)
    
  } catch (error) {
    console.error('❌ Alias seeding failed:', error)
  }
}

seedNavigationAliases()