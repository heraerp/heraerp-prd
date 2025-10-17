#!/usr/bin/env node
/**
 * Check appointments and their branch assignments
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
  console.log('🔍 Checking appointments and their branch assignments...\n')

  try {
    // Get recent appointments
    const { data: appointments, error } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_type, metadata, created_at')
      .eq('entity_type', 'APPOINTMENT')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('❌ Error:', error)
      return
    }

    if (!appointments || appointments.length === 0) {
      console.log('⚠️  No appointments found\n')
      return
    }

    console.log(`✅ Found ${appointments.length} recent appointments:\n`)
    console.log('='.repeat(100))

    for (const appt of appointments) {
      const metadata = appt.metadata || {}

      console.log(`\n📅 Appointment: ${appt.entity_name}`)
      console.log(`   ID: ${appt.id}`)
      console.log(`   Created: ${new Date(appt.created_at).toLocaleString()}`)

      // Check for branch_id in different locations
      const branch_id = metadata.branch_id || metadata.branch || null

      if (branch_id) {
        console.log(`   🏢 Branch ID: ${branch_id}`)

        // Look up branch details
        const { data: branch, error: branchError } = await supabase
          .from('core_entities')
          .select('entity_name, entity_type')
          .eq('id', branch_id)
          .single()

        if (branchError) {
          console.log(`      ❌ Branch lookup failed: ${branchError.message}`)
        } else if (branch) {
          console.log(`      📍 Branch Name: ${branch.entity_name}`)

          // Get branch address
          const { data: addressData, error: addressError } = await supabase
            .from('core_dynamic_data')
            .select('field_value_text')
            .eq('entity_id', branch_id)
            .eq('field_name', 'address')
            .single()

          if (!addressError && addressData) {
            const address = addressData.field_value_text
            console.log(`      📍 Address: "${address}"`)

            // Check for potential issues
            if (address && address.length > 150) {
              console.log(`      🚨 WARNING: Very long address (${address.length} chars)`)
            }
            if (address && (address.match(/Hotel/gi) || []).length > 1) {
              console.log(`      🚨 POTENTIAL ISSUE: Multiple "Hotel" references in address!`)
            }
          }
        }
      } else {
        console.log(`   ⚠️  No branch_id found in metadata`)
      }

      // Show customer and stylist info
      console.log(`   👤 Customer: ${metadata.customer_name || 'N/A'}`)
      console.log(`   💇 Stylist: ${metadata.stylist_name || 'N/A'}`)
      console.log(`   🎨 Services: ${metadata.service_names?.join(', ') || 'N/A'}`)
    }

    // Check for branch relationships
    console.log('\n' + '='.repeat(100))
    console.log('\n🔗 Checking appointment-branch relationships...\n')

    const { data: relationships, error: relError } = await supabase
      .from('core_relationships')
      .select('source_entity_id, target_entity_id, relationship_type')
      .eq('relationship_type', 'APPOINTMENT_LOCATION')
      .limit(10)

    if (relError) {
      console.log('⚠️  No relationship check:', relError.message)
    } else if (relationships && relationships.length > 0) {
      console.log(`✅ Found ${relationships.length} appointment-location relationships:`)
      relationships.forEach(rel => {
        console.log(`   • Appointment ${rel.source_entity_id} → Branch ${rel.target_entity_id}`)
      })
    } else {
      console.log('⚠️  No APPOINTMENT_LOCATION relationships found')
    }

  } catch (err) {
    console.error('❌ Unexpected error:', err)
  }
}

checkAppointments()
