/**
 * Delete All Appointments - Clean Test Data
 * Deletes all appointment transactions from universal_transactions
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://awfcrncxngqwbhqapffb.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env file')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

const ORGANIZATION_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function deleteAppointments() {
  console.log('Step 1: Checking appointments...\n')

  try {
    const { data: countData, error: countError } = await supabase
      .from('universal_transactions')
      .select('id, transaction_code, transaction_date', { count: 'exact' })
      .eq('organization_id', ORGANIZATION_ID)
      .eq('transaction_type', 'APPOINTMENT')

    if (countError) {
      console.error('Error counting:', countError)
      return
    }

    const count = countData?.length || 0
    console.log(`Found ${count} appointments\n`)

    if (count === 0) {
      console.log('No appointments to delete.')
      return
    }

    console.log('Sample appointments:')
    const sample = countData.slice(0, 5)
    sample.forEach((appt, i) => {
      console.log(`  ${i + 1}. ${appt.transaction_code} (${appt.transaction_date})`)
    })
    if (count > 5) console.log(`  ... and ${count - 5} more\n`)

    console.log('Step 2: Deleting...\n')

    const { error: deleteError } = await supabase
      .from('universal_transactions')
      .delete()
      .eq('organization_id', ORGANIZATION_ID)
      .eq('transaction_type', 'APPOINTMENT')

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return
    }

    console.log(`Deleted ${count} appointments\n`)

    console.log('Step 3: Verifying...\n')

    const { data: verifyData } = await supabase
      .from('universal_transactions')
      .select('id')
      .eq('organization_id', ORGANIZATION_ID)
      .eq('transaction_type', 'APPOINTMENT')

    const remaining = verifyData?.length || 0
    console.log(remaining === 0 ? 'Verified: All deleted' : `Warning: ${remaining} remain`)

    console.log('\nSummary:')
    console.log(`  Deleted: ${count}`)
    console.log(`  Remaining: ${remaining}`)

  } catch (error) {
    console.error('Error:', error)
  }
}

console.log('APPOINTMENT CLEANUP')
console.log('='.repeat(40))
deleteAppointments()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Failed:', err)
    process.exit(1)
  })
