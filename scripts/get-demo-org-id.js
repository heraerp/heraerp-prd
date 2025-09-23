#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function getDemoOrgId() {
  try {
    // Look for Hair Talkz demo organization
    const { data: orgs, error } = await supabase
      .from('core_organizations')
      .select('id, organization_name, organization_code, metadata')
      .or('organization_name.ilike.%Hair Talkz%,organization_code.eq.HAIR-TALKZ')
      .limit(1)
      .single()

    if (error) {
      console.error('❌ Error finding demo organization:', error)
      
      // Try to find any demo organization
      const { data: anyOrg } = await supabase
        .from('core_organizations')
        .select('id, organization_name, organization_code')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
        
      if (anyOrg) {
        console.log('\n📍 Found most recent organization:')
        console.log(`   ID: ${anyOrg.id}`)
        console.log(`   Name: ${anyOrg.organization_name}`)
        console.log(`   Code: ${anyOrg.organization_code}`)
        console.log('\n📋 Add this to your .env.local:')
        console.log(`   DEMO_ORG_ID=${anyOrg.id}`)
      }
      
      return
    }

    console.log('\n✅ Found Hair Talkz demo organization:')
    console.log(`   ID: ${orgs.id}`)
    console.log(`   Name: ${orgs.organization_name}`)
    console.log(`   Code: ${orgs.organization_code}`)
    
    console.log('\n📋 Add this to your .env.local:')
    console.log(`   DEMO_ORG_ID=${orgs.id}`)
    
  } catch (err) {
    console.error('❌ Failed to get demo organization:', err)
  }
}

getDemoOrgId()