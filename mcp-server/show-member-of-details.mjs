/**
 * 🔍 SHOW: All MEMBER_OF relationship details
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🔍 SHOWING: All MEMBER_OF Relationships')
console.log('='.repeat(80))
console.log('')

async function showMemberOfDetails() {
  const { data: rels, error } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('relationship_type', 'MEMBER_OF')
    .order('created_at', { ascending: false })

  if (error) {
    console.log('❌ Error:', error.message)
    return
  }

  console.log(`✅ Found ${rels.length} MEMBER_OF relationships`)
  console.log('')

  for (let i = 0; i < rels.length; i++) {
    const rel = rels[i]

    console.log(`📍 Relationship #${i + 1}:`)
    console.log(`   ID: ${rel.id}`)
    console.log(`   Source Entity: ${rel.source_entity_id}`)
    console.log(`   Target Entity: ${rel.target_entity_id}`)
    console.log(`   Active: ${rel.is_active}`)
    console.log(`   Created: ${rel.created_at}`)

    // Get source entity details
    const { data: sourceEntity } = await supabase
      .from('core_entities')
      .select('entity_name, entity_type, organization_id')
      .eq('id', rel.source_entity_id)
      .maybeSingle()

    if (sourceEntity) {
      console.log(`   Source: ${sourceEntity.entity_name} (${sourceEntity.entity_type})`)
      console.log(`      Org: ${sourceEntity.organization_id}`)

      // If source is USER, get email
      if (sourceEntity.entity_type === 'USER') {
        const { data: emailField } = await supabase
          .from('core_dynamic_data')
          .select('field_value_text')
          .eq('entity_id', rel.source_entity_id)
          .eq('field_name', 'email')
          .maybeSingle()

        if (emailField) {
          console.log(`      📧 Email: ${emailField.field_value_text}`)
        }
      }
    } else {
      console.log(`   Source: Entity not found`)
    }

    // Get target entity/org details
    const { data: targetOrg } = await supabase
      .from('core_organizations')
      .select('name')
      .eq('id', rel.target_entity_id)
      .maybeSingle()

    if (targetOrg) {
      console.log(`   Target Org: ${targetOrg.name}`)
    } else {
      // Maybe it's an entity, not an org
      const { data: targetEntity } = await supabase
        .from('core_entities')
        .select('entity_name, entity_type')
        .eq('id', rel.target_entity_id)
        .maybeSingle()

      if (targetEntity) {
        console.log(`   Target: ${targetEntity.entity_name} (${targetEntity.entity_type})`)
      } else {
        console.log(`   Target: Not found`)
      }
    }

    // Show relationship_data
    if (rel.relationship_data) {
      console.log(`   Relationship Data:`)
      if (rel.relationship_data.role) {
        console.log(`      📌 Role: ${rel.relationship_data.role}`)
      }
      if (rel.relationship_data.is_primary !== undefined) {
        console.log(`      Primary: ${rel.relationship_data.is_primary}`)
      }
      if (Object.keys(rel.relationship_data).length > 2) {
        console.log(`      Other: ${JSON.stringify(rel.relationship_data)}`)
      }
    }

    console.log('')

    // Stop after showing 10 for brevity
    if (i >= 9) {
      console.log(`... and ${rels.length - 10} more relationships`)
      console.log('')
      break
    }
  }
}

showMemberOfDetails().catch(err => {
  console.error('💥 Fatal error:', err)
  process.exit(1)
})
