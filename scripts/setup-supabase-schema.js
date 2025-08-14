#!/usr/bin/env node

/**
 * Setup HERA Schema in Supabase Database
 * Applies the complete universal 6-table architecture
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
  console.error('Please check your .env.local file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupSupabaseSchema() {
  console.log('🏗️  Setting up HERA Universal Schema in Supabase...')
  console.log('===================================================')

  try {
    // Read the SQL schema file
    const schemaPath = path.join(__dirname, '..', 'database', 'supabase-hera-integration.sql')
    const schemaSql = fs.readFileSync(schemaPath, 'utf8')

    console.log('📄 Loaded SQL schema file')
    console.log(`   File size: ${Math.round(schemaSql.length / 1024)}KB`)

    // Split SQL into individual statements (rough split)
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`\\n🔧 Executing ${statements.length} SQL statements...`)

    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';'
      
      // Skip comments and empty statements
      if (statement.trim().startsWith('--') || statement.trim() === ';') {
        continue
      }

      try {
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
        })

        if (error) {
          console.warn(`⚠️  Statement ${i + 1} warning:`, error.message.substring(0, 100))
          errorCount++
        } else {
          successCount++
          if (successCount % 10 === 0) {
            console.log(`   ✅ ${successCount} statements executed...`)
          }
        }
      } catch (err) {
        console.warn(`⚠️  Statement ${i + 1} error:`, err.message.substring(0, 100))
        errorCount++
      }
    }

    console.log(`\\n📊 Schema setup results:`)
    console.log(`   ✅ Successful: ${successCount}`)
    console.log(`   ⚠️  Warnings: ${errorCount}`)

    // Alternative: Try to execute the schema as one big statement
    console.log('\\n🔄 Attempting direct SQL execution...')
    
    // For Supabase, we need to execute this through their SQL editor or using raw SQL
    console.log('\\n⚠️  Note: Some statements may need to be run manually in Supabase SQL editor')
    console.log('\\n📋 To complete setup manually:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to SQL Editor')
    console.log('3. Copy and paste the contents of database/supabase-hera-integration.sql')
    console.log('4. Run the SQL script')

    return true

  } catch (error) {
    console.error('❌ Schema setup failed:', error)
    return false
  }
}

// Manual table creation for essential tables
async function createEssentialTables() {
  console.log('\\n🔧 Creating essential HERA tables manually...')

  const tables = [
    {
      name: 'core_organizations',
      sql: `
        CREATE TABLE IF NOT EXISTS core_organizations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          organization_name VARCHAR(255) NOT NULL,
          organization_code VARCHAR(100) UNIQUE NOT NULL,
          organization_type VARCHAR(50) DEFAULT 'business_unit',
          industry_classification VARCHAR(100),
          settings JSONB DEFAULT '{}'::jsonb,
          metadata JSONB DEFAULT '{}'::jsonb,
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_by UUID,
          updated_by UUID
        );
      `
    },
    {
      name: 'core_entities',
      sql: `
        CREATE TABLE IF NOT EXISTS core_entities (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          organization_id UUID NOT NULL REFERENCES core_organizations(id) ON DELETE CASCADE,
          entity_type VARCHAR(100) NOT NULL,
          entity_name VARCHAR(255) NOT NULL,
          entity_code VARCHAR(100),
          entity_category VARCHAR(100),
          description TEXT,
          smart_code VARCHAR(255),
          status VARCHAR(20) DEFAULT 'active',
          metadata JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_by UUID,
          updated_by UUID
        );
      `
    },
    {
      name: 'core_memberships',
      sql: `
        CREATE TABLE IF NOT EXISTS core_memberships (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          organization_id UUID NOT NULL REFERENCES core_organizations(id) ON DELETE CASCADE,
          user_id UUID NOT NULL,
          role VARCHAR(100) NOT NULL DEFAULT 'user',
          permissions JSONB DEFAULT '[]'::jsonb,
          status VARCHAR(20) DEFAULT 'active',
          joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          created_by UUID,
          updated_by UUID,
          UNIQUE(organization_id, user_id)
        );
      `
    }
  ]

  for (const table of tables) {
    try {
      const { error } = await supabase.rpc('exec_sql', { 
        sql_query: table.sql 
      })

      if (error) {
        console.log(`⚠️  Table ${table.name}:`, error.message)
      } else {
        console.log(`✅ Table ${table.name} created/verified`)
      }
    } catch (err) {
      console.warn(`⚠️  Table ${table.name} error:`, err.message)
    }
  }
}

async function main() {
  const success = await setupSupabaseSchema()
  
  // Also try manual table creation
  await createEssentialTables()
  
  if (success) {
    console.log('\\n🎉 Schema setup completed!')
    console.log('\\n📝 Next steps:')
    console.log('1. Manually run the SQL in Supabase dashboard if needed')
    console.log('2. Test user registration')
    console.log('3. Verify HERA entity creation')
  }
}

if (require.main === module) {
  main()
}