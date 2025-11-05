/**
 * Verify HERA Retail Demo Organization
 * Check: parent_organization_id, settings, relationships
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const RETAIL_ORG_ID = 'ff837c4c-95f2-43ac-a498-39597018b10c'
const PARENT_ORG_ID = process.env.DEFAULT_ORGANIZATION_ID

async function verifyRetailDemoOrg() {
  console.log('🔍 Verifying HERA Retail Demo Organization...\n')
  console.log('Expected Retail Org ID:', RETAIL_ORG_ID)
  console.log('Expected Parent Org ID:', PARENT_ORG_ID)
  console.log('='.repeat(80) + '\n')

  // 1. Get organization from core_organizations
  const { data: org, error: orgError } = await supabase
    .from('core_organizations')
    .select('*')
    .eq('id', RETAIL_ORG_ID)
    .single()

  if (orgError) {
    console.error('❌ Error fetching organization:', orgError)
    return
  }

  console.log('✅ Organization Found in core_organizations:')
  console.log('='.repeat(80))
  console.log('ID:                      ', org.id)
  console.log('Name:                    ', org.organization_name)
  console.log('Code:                    ', org.organization_code)
  console.log('Type:                    ', org.organization_type)
  console.log('Industry:                ', org.industry_classification)
  console.log('Parent Org ID:           ', org.parent_organization_id || '❌ NULL')
  console.log('Status:                  ', org.status)
  console.log('Settings:                ', JSON.stringify(org.settings, null, 2))
  console.log('='.repeat(80) + '\n')

  // 2. Check if parent org is set correctly
  if (org.parent_organization_id === PARENT_ORG_ID) {
    console.log('✅ Parent organization is correctly set!')
  } else if (org.parent_organization_id === null) {
    console.log('❌ Parent organization is NULL (expected:', PARENT_ORG_ID + ')')
  } else {
    console.log('⚠️  Parent organization mismatch:')
    console.log('   Expected:', PARENT_ORG_ID)
    console.log('   Actual:  ', org.parent_organization_id)
  }
  console.log('')

  // 3. Get parent organization details
  if (PARENT_ORG_ID) {
    const { data: parentOrg, error: parentError } = await supabase
      .from('core_organizations')
      .select('id, organization_name, organization_code')
      .eq('id', PARENT_ORG_ID)
      .single()

    if (!parentError && parentOrg) {
      console.log('📋 Parent Organization Details:')
      console.log('='.repeat(80))
      console.log('ID:                      ', parentOrg.id)
      console.log('Name:                    ', parentOrg.organization_name)
      console.log('Code:                    ', parentOrg.organization_code)
      console.log('='.repeat(80) + '\n')
    }
  }

  // 4. Check for organization entity in core_entities
  const { data: orgEntity, error: entityError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', RETAIL_ORG_ID)
    .eq('entity_type', 'ORGANIZATION')
    .limit(1)

  if (entityError) {
    console.log('⚠️  No ORGANIZATION entity found (this is optional)')
  } else if (orgEntity && orgEntity.length > 0) {
    console.log('✅ Organization Shadow Entity Found:')
    console.log('='.repeat(80))
    console.log('Entity ID:               ', orgEntity[0].id)
    console.log('Entity Name:             ', orgEntity[0].entity_name)
    console.log('Smart Code:              ', orgEntity[0].smart_code)
    console.log('='.repeat(80) + '\n')
  } else {
    console.log('ℹ️  No organization shadow entity yet (created on first user onboarding)\n')
  }

  // 5. Check for any relationships
  const { data: relationships, error: relError } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('organization_id', RETAIL_ORG_ID)

  if (!relError && relationships && relationships.length > 0) {
    console.log('📊 Relationships Found: ' + relationships.length)
    console.log('='.repeat(80))
    relationships.forEach((rel, idx) => {
      console.log(`${idx + 1}. Type: ${rel.relationship_type}`)
      console.log(`   From: ${rel.from_entity_id}`)
      console.log(`   To:   ${rel.to_entity_id}`)
    })
    console.log('='.repeat(80) + '\n')
  } else {
    console.log('ℹ️  No relationships yet (created on user onboarding)\n')
  }

  // 6. Summary
  console.log('📊 VERIFICATION SUMMARY:')
  console.log('='.repeat(80))
  console.log('Organization Created:    ✅ YES')
  console.log('Parent Org Set:          ' + (org.parent_organization_id ? '✅ YES' : '❌ NO'))
  console.log('Settings Configured:     ' + (org.settings ? '✅ YES' : '❌ NO'))
  console.log('Is Demo Org:             ' + (org.settings?.is_demo ? '✅ YES' : '❌ NO'))
  console.log('='.repeat(80))
}

verifyRetailDemoOrg()
