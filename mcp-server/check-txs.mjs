
import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://awfcrncxngqwbhqapffb.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const ORG = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

const { data: allTxs } = await supabase
  .from('universal_transactions')
  .select('transaction_type, transaction_code, transaction_status, smart_code')
  .eq('organization_id', ORG)

console.log('Total transactions:', allTxs ? allTxs.length : 0)
if (allTxs) {
  const byType = {}
  allTxs.forEach(tx => {
    byType[tx.transaction_type] = (byType[tx.transaction_type] || 0) + 1
  })
  console.log('By type:', byType)
  
  allTxs.slice(0, 10).forEach((tx, i) => {
    console.log(i+1 + '. ' + tx.transaction_type + ' - ' + tx.transaction_code)
  })
}
