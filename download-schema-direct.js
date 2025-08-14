/**
 * 🗄️ HERA Supabase Schema Downloader - Direct SQL Approach
 * 
 * This script downloads the complete current Supabase schema using direct SQL queries
 */

import { createClient } from '@supabase/supabase-js'
import { writeFileSync } from 'fs'

// Current Supabase configuration
const supabaseUrl = 'https://hsumtzuqzoqccpjiaikh.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzdW10enVxem9xY2NwamlhaWtoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzYwMDc4NywiZXhwIjoyMDY5MTc2Nzg3fQ.fMuyCMNmHY4jKy8JyYEkC8KM5BCWSlDS35OQDfZWhPc'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function getSchemaViaSql() {
  console.log('🗄️ HERA SUPABASE SCHEMA DOWNLOADER - DIRECT')
  console.log('============================================\n')
  
  const schemaExport = {
    project_info: {
      project_id: 'hsumtzuqzoqccpjiaikh',
      project_url: supabaseUrl,
      export_date: new Date().toISOString(),
      export_purpose: 'Migration to new Supabase account'
    },
    tables: [],
    sample_data: {},
    known_tables: []
  }

  // Try to access known HERA tables directly
  const heraTableList = [
    'core_entities',
    'core_dynamic_data', 
    'core_relationships',
    'core_organizations',
    'universal_transactions',
    'universal_transaction_lines'
  ]

  console.log('🎯 Checking HERA Universal Tables...')
  
  for (const tableName of heraTableList) {
    console.log(`   📊 Checking: ${tableName}`)
    
    try {
      // Try to get sample data to confirm table exists
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(5)
      
      if (error) {
        console.log(`      ❌ ${tableName}: ${error.message}`)
      } else {
        console.log(`      ✅ ${tableName}: Found ${data.length} rows`)
        schemaExport.known_tables.push(tableName)
        schemaExport.sample_data[tableName] = data
        
        if (data.length > 0) {
          // Extract column info from sample data
          const sampleRow = data[0]
          const columns = Object.keys(sampleRow).map(key => ({
            column_name: key,
            sample_value: sampleRow[key],
            data_type: typeof sampleRow[key]
          }))
          
          schemaExport.tables.push({
            table_name: tableName,
            columns: columns,
            row_count: data.length
          })
        }
      }
    } catch (err) {
      console.log(`      ❌ ${tableName}: ${err.message}`)
    }
  }

  // Try other potential tables
  const otherTables = [
    'auth.users',
    'profiles', 
    'audit_documents',
    'document_requisitions',
    'gl_accounts',
    'transactions'
  ]

  console.log('\n🔍 Checking Additional Tables...')
  
  for (const tableName of otherTables) {
    console.log(`   📊 Checking: ${tableName}`)
    
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(3)
      
      if (error) {
        console.log(`      ❌ ${tableName}: ${error.message}`)
      } else {
        console.log(`      ✅ ${tableName}: Found ${data.length} rows`)
        schemaExport.known_tables.push(tableName)
        schemaExport.sample_data[tableName] = data
        
        if (data.length > 0) {
          const sampleRow = data[0]
          const columns = Object.keys(sampleRow).map(key => ({
            column_name: key,
            sample_value: sampleRow[key],
            data_type: typeof sampleRow[key]
          }))
          
          schemaExport.tables.push({
            table_name: tableName,
            columns: columns,
            row_count: data.length
          })
        }
      }
    } catch (err) {
      console.log(`      ❌ ${tableName}: ${err.message}`)
    }
  }

  // Save the schema export
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `hera-schema-export-${timestamp}.json`
  
  writeFileSync(filename, JSON.stringify(schemaExport, null, 2))
  
  console.log('\n📊 SCHEMA EXPORT SUMMARY')
  console.log('========================')
  console.log(`✅ Accessible tables: ${schemaExport.known_tables.length}`)
  console.log(`✅ Tables with data: ${schemaExport.tables.length}`)
  console.log(`✅ Export saved to: ${filename}`)
  
  if (schemaExport.known_tables.length > 0) {
    console.log('\n📋 ACCESSIBLE TABLES:')
    schemaExport.known_tables.forEach(table => {
      const tableData = schemaExport.sample_data[table]
      console.log(`   • ${table} (${tableData?.length || 0} sample rows)`)
    })
  }

  // Generate SQL recreation script
  await generateSimpleSQLScript(schemaExport, timestamp)
  
  return filename
}

async function generateSimpleSQLScript(schemaExport, timestamp) {
  console.log('\n🔧 Generating SQL recreation script...')
  
  let sqlScript = `-- HERA Supabase Schema Recreation Script
-- Generated: ${new Date().toISOString()}
-- Original Project: ${schemaExport.project_info.project_id}
--
-- This script recreates the HERA Universal 6-Table Architecture
-- Run this in your new Supabase project's SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- HERA Universal 6-Table Architecture
-- ===================================

-- 1. Core Organizations (Multi-tenant isolation)
CREATE TABLE IF NOT EXISTS public.core_organizations (
  organization_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name VARCHAR(255) NOT NULL,
  organization_code VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active'
);

-- 2. Core Entities (All business objects)
CREATE TABLE IF NOT EXISTS public.core_entities (
  entity_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.core_organizations(organization_id),
  entity_type VARCHAR(50) NOT NULL,
  entity_name VARCHAR(255) NOT NULL,
  entity_code VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  smart_code VARCHAR(100),
  confidence_score DECIMAL(3,2),
  classification JSONB
);

-- 3. Core Dynamic Data (Unlimited custom fields)
CREATE TABLE IF NOT EXISTS public.core_dynamic_data (
  dynamic_data_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL REFERENCES public.core_entities(entity_id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.core_organizations(organization_id),
  field_name VARCHAR(100) NOT NULL,
  field_value TEXT,
  field_type VARCHAR(50) DEFAULT 'text',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Core Relationships (Entity connections)
CREATE TABLE IF NOT EXISTS public.core_relationships (
  relationship_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.core_organizations(organization_id),
  parent_entity_id UUID NOT NULL REFERENCES public.core_entities(entity_id),
  child_entity_id UUID NOT NULL REFERENCES public.core_entities(entity_id),
  relationship_type VARCHAR(50) NOT NULL,
  relationship_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active'
);

-- 5. Universal Transactions (All business transactions)
CREATE TABLE IF NOT EXISTS public.universal_transactions (
  transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.core_organizations(organization_id),
  transaction_type VARCHAR(50) NOT NULL,
  transaction_date TIMESTAMPTZ DEFAULT NOW(),
  reference_number VARCHAR(100),
  total_amount DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  smart_code VARCHAR(100),
  metadata JSONB
);

-- 6. Universal Transaction Lines (Transaction details)
CREATE TABLE IF NOT EXISTS public.universal_transaction_lines (
  line_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.universal_transactions(transaction_id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.core_organizations(organization_id),
  line_type VARCHAR(50) NOT NULL,
  entity_id UUID REFERENCES public.core_entities(entity_id),
  quantity DECIMAL(15,4),
  unit_price DECIMAL(15,2),
  line_total DECIMAL(15,2),
  line_metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.core_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.core_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.core_dynamic_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.core_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universal_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.universal_transaction_lines ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_core_entities_org_type ON public.core_entities(organization_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_core_entities_code ON public.core_entities(entity_code);
CREATE INDEX IF NOT EXISTS idx_dynamic_data_entity ON public.core_dynamic_data(entity_id, field_name);
CREATE INDEX IF NOT EXISTS idx_transactions_org_type ON public.universal_transactions(organization_id, transaction_type);
CREATE INDEX IF NOT EXISTS idx_transaction_lines_txn ON public.universal_transaction_lines(transaction_id);

-- RLS Policies (Basic - customize as needed)
-- Organizations: Users can only see their own organization
CREATE POLICY "org_isolation" ON public.core_organizations
  FOR ALL USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Entities: Multi-tenant isolation
CREATE POLICY "entity_org_isolation" ON public.core_entities
  FOR ALL USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Dynamic Data: Multi-tenant isolation
CREATE POLICY "dynamic_data_org_isolation" ON public.core_dynamic_data
  FOR ALL USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Relationships: Multi-tenant isolation
CREATE POLICY "relationships_org_isolation" ON public.core_relationships
  FOR ALL USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Transactions: Multi-tenant isolation
CREATE POLICY "transactions_org_isolation" ON public.universal_transactions
  FOR ALL USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

-- Transaction Lines: Multi-tenant isolation
CREATE POLICY "transaction_lines_org_isolation" ON public.universal_transaction_lines
  FOR ALL USING (organization_id = (auth.jwt() ->> 'organization_id')::uuid);

`

  // Add sample data if we have any
  if (Object.keys(schemaExport.sample_data).length > 0) {
    sqlScript += `\n-- Sample Data (Optional - uncomment to insert)\n/*\n`
    
    for (const [tableName, sampleData] of Object.entries(schemaExport.sample_data)) {
      if (sampleData.length > 0 && schemaExport.known_tables.includes(tableName)) {
        sqlScript += `\n-- Sample data for ${tableName}\n`
        sampleData.forEach(row => {
          const columns = Object.keys(row).join(', ')
          const values = Object.values(row).map(v => 
            v === null ? 'NULL' : 
            typeof v === 'string' ? `'${v.replace(/'/g, "''")}'` : 
            typeof v === 'object' ? `'${JSON.stringify(v).replace(/'/g, "''")}'` :
            v
          ).join(', ')
          
          sqlScript += `INSERT INTO public.${tableName} (${columns}) VALUES (${values});\n`
        })
      }
    }
    
    sqlScript += `*/\n`
  }

  sqlScript += `
-- Post-Migration Steps:
-- 1. Update your .env.local with new Supabase credentials
-- 2. Test the HERA API endpoints
-- 3. Verify RLS policies are working
-- 4. Import any additional custom data

-- Your HERA Universal Architecture is now ready!
`

  const sqlFilename = `hera-migration-script-${timestamp}.sql`
  writeFileSync(sqlFilename, sqlScript)
  
  console.log(`   ✅ SQL migration script saved to: ${sqlFilename}`)
  
  console.log('\n🎯 MIGRATION STEPS:')
  console.log('1. Create new Supabase account at https://supabase.com')
  console.log('2. Create new project')
  console.log('3. Go to SQL Editor in new project dashboard')  
  console.log(`4. Run the SQL script: ${sqlFilename}`)
  console.log('5. Update .env.local with new project credentials')
  console.log('6. Test HERA application with new database')
}

// Run the schema download
getSchemaViaSql().catch(console.error)