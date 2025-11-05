import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const DEMO_EMAIL = 'demo@heraerp.com'
const DEMO_AUTH_UID = 'a55cc033-e909-4c59-b974-8ff3e098f2bf'

console.log('🔍 Searching for demo@heraerp.com USER entity\n')
console.log('='.repeat(80))

// Search for USER entity by email in dynamic data
const { data: dynamicData, error: dynamicError } = await supabase
  .from('core_dynamic_data')
  .select(`
    id,
    entity_id,
    field_name,
    field_value_text,
    field_value_json
  `)
  .eq('field_name', 'email')
  .ilike('field_value_text', DEMO_EMAIL)

if (dynamicError) {
  console.error('❌ Error searching dynamic data:', dynamicError.message)
}

console.log('📧 Email field matches:', dynamicData?.length || 0)

if (dynamicData && dynamicData.length > 0) {
  for (const field of dynamicData) {
    console.log('\n  Entity ID:', field.entity_id)
    console.log('  Email:', field.field_value_text)

    // Get the entity details
    const { data: entity } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', field.entity_id)
      .single()

    if (entity) {
      console.log('  Entity Type:', entity.entity_type)
      console.log('  Entity Name:', entity.entity_name)
      console.log('  Organization ID:', entity.organization_id)
      console.log('  Status:', entity.status)

      // Check if this entity has memberships
      const { data: memberships } = await supabase
        .from('core_relationships')
        .select(`
          id,
          organization_id,
          to_entity_id,
          relationship_type,
          is_active
        `)
        .eq('from_entity_id', field.entity_id)
        .eq('relationship_type', 'USER_MEMBER_OF_ORG')
        .eq('is_active', true)

      console.log('  Memberships:', memberships?.length || 0)

      if (memberships && memberships.length > 0) {
        for (const membership of memberships) {
          const { data: org } = await supabase
            .from('core_entities')
            .select('entity_name, entity_code')
            .eq('id', membership.to_entity_id)
            .single()

          console.log('    - Organization:', org?.entity_name || 'Unknown')
          console.log('      Org ID:', membership.to_entity_id)

          // Check apps for this org
          const { data: apps } = await supabase
            .from('core_relationships')
            .select('to_entity_id')
            .eq('organization_id', membership.organization_id)
            .eq('relationship_type', 'ORG_HAS_APP')
            .eq('is_active', true)

          if (apps && apps.length > 0) {
            console.log('      Apps:')
            for (const app of apps) {
              const { data: appEntity } = await supabase
                .from('core_entities')
                .select('entity_name, entity_code')
                .eq('id', app.to_entity_id)
                .single()

              console.log('        -', appEntity?.entity_name, '(' + appEntity?.entity_code + ')')
            }
          } else {
            console.log('      Apps: ❌ None')
          }
        }
      }
    }
  }
} else {
  console.log('❌ No USER entity found with email demo@heraerp.com')
}

console.log('\n' + '='.repeat(80))
console.log('✅ Search complete')
