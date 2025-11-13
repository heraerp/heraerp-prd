#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAgroDomains() {
  try {
    console.log('🔍 Checking for APP_DOMAIN entities in database...\n')

    // Query APP_DOMAIN entities
    const { data: domains, error: domainsError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'APP_DOMAIN')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000')

    if (domainsError) {
      console.error('❌ Error fetching APP_DOMAIN entities:', domainsError)
      return
    }

    console.log(`📊 Found ${domains?.length || 0} APP_DOMAIN entities:\n`)

    if (domains && domains.length > 0) {
      domains.forEach(domain => {
        console.log(`  ✅ ${domain.entity_name}`)
        console.log(`     ID: ${domain.id}`)
        console.log(`     Code: ${domain.entity_code}`)
        console.log(`     Slug: ${domain.metadata?.slug || 'N/A'}`)
        console.log(`     Smart Code: ${domain.smart_code}`)
        console.log('')
      })
    } else {
      console.log('  ⚠️  No APP_DOMAIN entities found')
    }

    // Query AGRO APP entity
    console.log('🔍 Checking for AGRO APP entity...\n')

    const { data: apps, error: appsError } = await supabase
      .from('core_entities')
      .select('id, entity_code, entity_name, metadata')
      .eq('entity_type', 'APP')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000')
      .eq('entity_code', 'AGRO')

    if (appsError) {
      console.error('❌ Error fetching AGRO APP:', appsError)
      return
    }

    if (apps && apps.length > 0) {
      console.log('✅ AGRO APP found:')
      console.log(`   ID: ${apps[0].id}`)
      console.log(`   Code: ${apps[0].entity_code}`)
      console.log(`   Name: ${apps[0].entity_name}\n`)

      // Query APP_HAS_DOMAIN relationships
      console.log('🔍 Checking APP_HAS_DOMAIN relationships for AGRO...\n')

      const { data: relationships, error: relsError } = await supabase
        .from('core_relationships')
        .select('*')
        .eq('from_entity_id', apps[0].id)
        .eq('relationship_type', 'APP_HAS_DOMAIN')

      if (relsError) {
        console.error('❌ Error fetching relationships:', relsError)
        return
      }

      if (relationships && relationships.length > 0) {
        console.log(`✅ Found ${relationships.length} APP_HAS_DOMAIN relationships:`)
        for (const rel of relationships) {
          // Get the domain name
          const { data: domain } = await supabase
            .from('core_entities')
            .select('entity_name, entity_code, metadata')
            .eq('id', rel.to_entity_id)
            .single()

          console.log(`   → ${domain?.entity_name || 'Unknown'} (${domain?.entity_code})`)
          console.log(`      Slug: ${domain?.metadata?.slug || 'N/A'}`)
        }
        console.log('')
      } else {
        console.log('  ⚠️  No APP_HAS_DOMAIN relationships found for AGRO\n')
      }
    } else {
      console.log('  ⚠️  AGRO APP entity not found\n')
    }

    // Query APP_SECTION entities
    console.log('🔍 Checking for APP_SECTION entities...\n')

    const { data: sections, error: sectionsError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'APP_SECTION')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000')

    if (sectionsError) {
      console.error('❌ Error fetching APP_SECTION entities:', sectionsError)
      return
    }

    console.log(`📊 Found ${sections?.length || 0} APP_SECTION entities:\n`)

    if (sections && sections.length > 0) {
      sections.forEach(section => {
        console.log(`  ✅ ${section.entity_name}`)
        console.log(`     ID: ${section.id}`)
        console.log(`     Code: ${section.entity_code}`)
        console.log(`     Parent Domain ID: ${section.parent_entity_id || 'N/A'}`)
        console.log(`     Slug: ${section.metadata?.slug || 'N/A'}`)
        console.log('')
      })
    } else {
      console.log('  ⚠️  No APP_SECTION entities found')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkAgroDomains()
