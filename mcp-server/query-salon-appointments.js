#!/usr/bin/env node
// ================================================================================
// QUERY SALON APPOINTMENTS
// Lists all salon appointments with customer and stylist details
// ================================================================================

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const SALON_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function queryAppointments() {
  try {
    console.log('🎯 Querying salon appointments...\n')
    
    // Query appointments with related entities
    const { data: appointments, error } = await supabase
      .from('universal_transactions')
      .select(`
        id,
        transaction_code,
        transaction_date,
        total_amount,
        metadata,
        source:core_entities!source_entity_id(entity_name, metadata),
        target:core_entities!target_entity_id(entity_name, metadata)
      `)
      .eq('organization_id', SALON_ORG_ID)
      .in('transaction_type', ['appointment', 'APPOINTMENT'])
      .order('created_at', { ascending: false })
      .limit(20)
      
    if (error) throw error
    
    if (appointments && appointments.length > 0) {
      console.log(`Found ${appointments.length} appointments:\n`)
      
      appointments.forEach((apt, index) => {
        console.log(`${index + 1}. Appointment: ${apt.transaction_code}`)
        console.log(`   Date: ${apt.transaction_date}`)
        console.log(`   Customer: ${apt.source?.entity_name || 'Unknown'}`)
        console.log(`   Phone: ${apt.source?.metadata?.phone || 'N/A'}`)
        console.log(`   Stylist: ${apt.target?.entity_name || 'Unknown'}`)
        console.log(`   Service: ${apt.metadata?.service || 'N/A'}`)
        console.log(`   Time: ${apt.metadata?.appointment_time ? new Date(apt.metadata.appointment_time).toLocaleTimeString() : 'N/A'}`)
        console.log(`   Duration: ${apt.metadata?.duration_minutes || 0} minutes`)
        console.log(`   Amount: AED ${apt.total_amount}`)
        console.log(`   Status: ${apt.metadata?.status || 'unknown'}`)
        console.log(`   Notes: ${apt.metadata?.notes || 'None'}`)
        console.log('   ---')
      })
    } else {
      console.log('No appointments found.')
    }
    
    // Also show summary stats
    console.log('\n📊 Summary Statistics:')
    
    const { data: stats, error: statsError } = await supabase
      .from('universal_transactions')
      .select('total_amount')
      .eq('organization_id', SALON_ORG_ID)
      .in('transaction_type', ['appointment', 'APPOINTMENT'])
      
    if (!statsError && stats) {
      const totalRevenue = stats.reduce((sum, apt) => sum + (apt.total_amount || 0), 0)
      console.log(`- Total appointments: ${stats.length}`)
      console.log(`- Total revenue: AED ${totalRevenue.toFixed(2)}`)
      console.log(`- Average appointment value: AED ${(totalRevenue / stats.length || 0).toFixed(2)}`)
    }
    
  } catch (error) {
    console.error('❌ Error querying appointments:', error.message)
    if (error.details) console.error('Details:', error.details)
  }
}

// Run the script
queryAppointments()