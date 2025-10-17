#!/usr/bin/env node
/**
 * Check lowercase 'appointment' entities
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAppointments() {
  console.log('🔍 Checking lowercase "appointment" entities...\n')

  try {
    // Get appointment entities
    const { data: appointments, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'appointment')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error:', error)
      return
    }

    if (!appointments || appointments.length === 0) {
      console.log('⚠️  No appointments found\n')
      return
    }

    console.log(`✅ Found ${appointments.length} appointments:\n`)
    console.log('='.repeat(100))

    // Map to store branch details
    const branchCache = {}

    for (const appt of appointments) {
      const metadata = appt.metadata || {}

      console.log(`\n📅 Appointment: ${appt.entity_name || 'Unnamed'}`)
      console.log(`   ID: ${appt.id}`)
      console.log(`   Created: ${new Date(appt.created_at).toLocaleString()}`)
      console.log(`   Organization: ${appt.organization_id}`)

      // Check metadata structure
      console.log(`\n   📋 Full Metadata:`)
      console.log(JSON.stringify(metadata, null, 4))

      // Check for branch_id in different locations
      const branch_id = metadata.branch_id || metadata.branch || null

      if (branch_id) {
        console.log(`\n   🏢 Branch ID found: ${branch_id}`)

        // Look up branch details (use cache to avoid duplicate lookups)
        if (!branchCache[branch_id]) {
          const { data: branch, error: branchError } = await supabase
            .from('core_entities')
            .select('entity_name, entity_type')
            .eq('id', branch_id)
            .single()

          if (!branchError && branch) {
            // Get branch address
            const { data: addressData, error: addressError } = await supabase
              .from('core_dynamic_data')
              .select('field_value_text')
              .eq('entity_id', branch_id)
              .eq('field_name', 'address')
              .maybeSingle()

            branchCache[branch_id] = {
              name: branch.entity_name,
              address: addressData?.field_value_text || 'No address'
            }
          } else {
            branchCache[branch_id] = { name: 'BRANCH NOT FOUND', address: 'N/A' }
          }
        }

        const branchInfo = branchCache[branch_id]
        console.log(`   📍 Branch Name: ${branchInfo.name}`)
        console.log(`   📍 Branch Address: "${branchInfo.address}"`)

        // Check for address issues
        if (branchInfo.address && branchInfo.address.length > 150) {
          console.log(`   🚨 WARNING: Very long address (${branchInfo.address.length} chars)`)
        }
        if (branchInfo.address && (branchInfo.address.match(/Hotel/gi) || []).length > 1) {
          console.log(`   🚨 POTENTIAL ISSUE: Multiple "Hotel" references in address!`)
        }
      } else {
        console.log(`\n   ⚠️  No branch_id found`)
      }

      console.log('\n' + '-'.repeat(100))
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

checkAppointments()
