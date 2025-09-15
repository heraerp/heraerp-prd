import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkOrganizationsSchema() {
  console.log('Checking core_organizations table schema...\n')

  try {
    // Get a sample row to see the actual columns
    const { data, error } = await supabase
      .from('core_organizations')
      .select('*')
      .limit(1)

    if (error) {
      console.error('Error querying table:', error.message)
      return
    }

    if (data && data.length > 0) {
      console.log('Columns in core_organizations table:')
      console.log('=====================================')
      
      const columns = Object.keys(data[0])
      columns.forEach(col => {
        const value = data[0][col]
        const type = value === null ? 'null' : typeof value
        console.log(`- ${col}: ${type} (sample: ${JSON.stringify(value)})`)
      })
      
      console.log('\nTotal columns:', columns.length)
    } else {
      console.log('No data found in core_organizations table')
    }

    // Also try to get the table structure using RPC if available
    console.log('\n\nAttempting to get detailed schema information...')
    
    const { data: schemaData, error: schemaError } = await supabase
      .rpc('get_table_info', { 
        table_schema: 'public', 
        table_name: 'core_organizations' 
      })
      .select('*')

    if (!schemaError && schemaData) {
      console.log('\nDetailed column information:')
      console.log('===========================')
      schemaData.forEach(col => {
        console.log(`- ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`)
      })
    } else {
      // If RPC doesn't exist, that's okay
      if (schemaError) {
        console.log('(Could not get detailed schema info - RPC may not exist)')
      }
    }

  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

// Run the check
checkOrganizationsSchema()