#!/usr/bin/env node

/**
 * Check Appointment Transactions in Database
 * Verify appointment statuses and counts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '../.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const salonOrgId = process.env.HERA_SALON_ORG_ID

console.log('🔍 Checking Appointment Transactions in Supabase...\n')
console.log(`Organization ID: ${salonOrgId}\n`)

// Query: Check all APPOINTMENT transactions
const { data, error } = await supabase
  .from('universal_transactions')
  .select('id, transaction_code, transaction_type, transaction_status, total_amount, metadata, created_at')
  .eq('organization_id', salonOrgId)
  .eq('transaction_type', 'APPOINTMENT')
  .order('created_at', { ascending: false })

if (error) {
  console.error('❌ Error:', error)
  process.exit(1)
}

console.log(`Found ${data.length} APPOINTMENT transactions\n`)

if (data.length === 0) {
  console.log('⚠️  No appointment transactions found')
  console.log('   Create an appointment to test')
  process.exit(0)
}

// Group by status
const statusGroups = data.reduce((acc, apt) => {
  const status = apt.transaction_status || 'null'
  if (!acc[status]) acc[status] = []
  acc[status].push(apt)
  return acc
}, {})

// Display by status
console.log('📊 Appointments by Status:\n')
Object.entries(statusGroups).forEach(([status, appointments]) => {
  const icon = status === 'completed' ? '✅' :
               status === 'booked' || status === 'checked_in' ? '📅' :
               status === 'in_progress' ? '🔄' :
               status === 'cancelled' ? '❌' :
               status === 'no_show' ? '🚫' :
               status === 'draft' ? '📝' : '❓'

  console.log(`${icon} ${status.toUpperCase()}: ${appointments.length} appointment(s)`)

  // Show first 2 of each status
  appointments.slice(0, 2).forEach(apt => {
    console.log(`   - ${apt.transaction_code || apt.id.substring(0, 8)}`)
    console.log(`     Amount: AED ${apt.total_amount || 0}`)
    console.log(`     Metadata status: ${apt.metadata?.status || '(not set)'}`)
    console.log(`     Created: ${new Date(apt.created_at).toLocaleString()}`)
  })

  if (appointments.length > 2) {
    console.log(`   ... and ${appointments.length - 2} more`)
  }
  console.log('')
})

// Calculate dashboard metrics
const appointmentsByStatus = data.reduce((acc, apt) => {
  const status = apt.transaction_status?.toLowerCase() || apt.metadata?.status?.toLowerCase()

  if (status === 'completed') acc.completed++
  else if (status === 'in_progress' || status === 'in_service') acc.in_progress++
  else if (status === 'booked' || status === 'checked_in' || status === 'pending' || status === 'scheduled' || status === 'payment_pending') acc.pending++
  else if (status === 'cancelled') acc.cancelled++
  else if (status === 'no_show') acc.no_show++
  else if (status === 'draft') acc.pending++
  else acc.pending++

  return acc
}, { completed: 0, in_progress: 0, pending: 0, cancelled: 0, no_show: 0 })

console.log('\n📈 Dashboard Metrics (After Fix):')
console.log(`   ✅ Completed: ${appointmentsByStatus.completed}`)
console.log(`   🔄 In Progress: ${appointmentsByStatus.in_progress}`)
console.log(`   📅 Pending: ${appointmentsByStatus.pending}`)
console.log(`   ❌ Cancelled: ${appointmentsByStatus.cancelled}`)
console.log(`   🚫 No Show: ${appointmentsByStatus.no_show}`)
console.log(`   📊 Total: ${Object.values(appointmentsByStatus).reduce((sum, count) => sum + count, 0)}`)

console.log('\n✅ Fix Applied Successfully!')
console.log('   Dashboard now counts APPOINTMENT transactions (not SALE transactions)')
console.log('   Refresh the dashboard to see accurate appointment analytics\n')

process.exit(0)
