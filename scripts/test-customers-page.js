const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Hair Talkz organization ID
const HAIRTALKZ_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function testCustomersPage() {
  console.log('🧪 Testing Hair Talkz customers page data...\n')

  try {
    // 1. Get customers
    const { data: customers, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', HAIRTALKZ_ORG_ID)
      .eq('entity_type', 'customer')
      .not('entity_name', 'ilike', 'walk%')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching customers:', error)
      return
    }

    console.log(`✅ Found ${customers.length} customers for Hair Talkz\n`)

    // 2. Get dynamic data for each customer
    for (const customer of customers.slice(0, 3)) {
      console.log(`📋 Customer: ${customer.entity_name}`)
      console.log(`   ID: ${customer.id}`)
      console.log(`   Code: ${customer.entity_code}`)
      console.log(`   Status: ${customer.status}`)
      
      // Get dynamic fields
      const { data: dynamicFields } = await supabase
        .from('core_dynamic_data')
        .select('field_name, field_value_text, field_value_number')
        .eq('entity_id', customer.id)
        .in('field_name', ['email', 'phone', 'address', 'preferences'])

      if (dynamicFields?.length > 0) {
        console.log('   Dynamic Fields:')
        dynamicFields.forEach(field => {
          const value = field.field_value_text || field.field_value_number
          console.log(`     - ${field.field_name}: ${value}`)
        })
      }

      // Get transactions (appointments/sales)
      const { data: transactions } = await supabase
        .from('universal_transactions')
        .select('transaction_type, total_amount, transaction_date')
        .eq('organization_id', HAIRTALKZ_ORG_ID)
        .eq('source_entity_id', customer.id)
        .order('transaction_date', { ascending: false })
        .limit(3)

      if (transactions?.length > 0) {
        console.log(`   Recent Transactions: ${transactions.length}`)
        const totalSpend = transactions.reduce((sum, t) => sum + (t.total_amount || 0), 0)
        console.log(`   Lifetime Value: AED ${totalSpend}`)
      }

      console.log('')
    }

    // 3. Get stats
    const totalRevenue = await supabase
      .from('universal_transactions')
      .select('total_amount')
      .eq('organization_id', HAIRTALKZ_ORG_ID)
      .in('transaction_type', ['sale', 'APPOINTMENT'])
      .then(res => res.data?.reduce((sum, t) => sum + (t.total_amount || 0), 0) || 0)

    console.log('\n📊 Customer Stats:')
    console.log(`- Total Customers: ${customers.length}`)
    console.log(`- Total Revenue: AED ${totalRevenue}`)
    console.log(`- Average Spend: AED ${customers.length > 0 ? Math.round(totalRevenue / customers.length) : 0}`)

    console.log('\n✅ Customer page data is ready!')
    console.log('URL: http://localhost:3001/salon/customers')

  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the test
testCustomersPage()