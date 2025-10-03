import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function fixEntityTriggerConstraint() {
  console.log('🚀 Fixing entity creation trigger constraint...\n')
  
  const statements = [
    {
      name: 'Drop problematic triggers from core_entities',
      sql: `
        DROP TRIGGER IF EXISTS trigger_enforce_transaction_standards ON core_entities;
      `
    },
    {
      name: 'Drop existing transaction trigger',
      sql: `
        DROP TRIGGER IF EXISTS trigger_enforce_transaction_standards ON universal_transactions;
      `
    },
    {
      name: 'Create simplified enforcement function',
      sql: `
        CREATE OR REPLACE FUNCTION enforce_transaction_standards()
        RETURNS TRIGGER AS $$
        BEGIN
            -- Only validate smart codes - remove all the problematic audit logging
            IF NEW.smart_code IS NULL OR 
               NOT (NEW.smart_code ~ '^HERA\\.[A-Z0-9]{2,15}(?:\\.[A-Z0-9_]{1,30}){2,8}\\.V[0-9]+$') THEN
                RAISE EXCEPTION 'HERA_ENFORCEMENT_ERROR: Invalid or missing smart_code. Must follow pattern HERA.{INDUSTRY}.{MODULE}.{TYPE}.V{VERSION}';
            END IF;

            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    },
    {
      name: 'Apply fixed trigger to universal_transactions only',
      sql: `
        CREATE TRIGGER trigger_enforce_transaction_standards
            BEFORE INSERT OR UPDATE ON universal_transactions
            FOR EACH ROW EXECUTE FUNCTION enforce_transaction_standards();
      `
    },
    {
      name: 'Create entity validation function',
      sql: `
        CREATE OR REPLACE FUNCTION validate_entity_smart_code()
        RETURNS TRIGGER AS $$
        BEGIN
            -- Only validate smart code format if provided
            IF NEW.smart_code IS NOT NULL AND 
               NOT (NEW.smart_code ~ '^HERA\\.[A-Z0-9]{2,15}(?:\\.[A-Z0-9_]{1,30}){2,8}\\.V[0-9]+$') THEN
                RAISE EXCEPTION 'HERA_ENFORCEMENT_ERROR: Invalid smart_code format for entity';
            END IF;
            
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    },
    {
      name: 'Drop and recreate entity validation trigger',
      sql: `
        DROP TRIGGER IF EXISTS trigger_validate_entity_smart_code ON core_entities;
        DROP TRIGGER IF EXISTS trigger_enforce_entity_standards ON core_entities;
        CREATE TRIGGER trigger_validate_entity_smart_code
            BEFORE INSERT OR UPDATE ON core_entities
            FOR EACH ROW EXECUTE FUNCTION validate_entity_smart_code();
      `
    },
    {
      name: 'Create transaction lines enforcement function',
      sql: `
        CREATE OR REPLACE FUNCTION enforce_transaction_line_standards()
        RETURNS TRIGGER AS $$
        BEGIN
            -- Just ensure organization_id matches parent transaction
            IF NEW.transaction_id IS NOT NULL THEN
                SELECT organization_id INTO NEW.organization_id
                FROM universal_transactions 
                WHERE id = NEW.transaction_id;
            END IF;
            
            -- Validate smart code if provided
            IF NEW.smart_code IS NOT NULL AND 
               NOT (NEW.smart_code ~ '^HERA\\.[A-Z0-9]{2,15}(?:\\.[A-Z0-9_]{1,30}){2,8}\\.V[0-9]+$') THEN
                RAISE EXCEPTION 'HERA_ENFORCEMENT_ERROR: Invalid line smart_code format';
            END IF;

            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
      `
    },
    {
      name: 'Replace transaction lines trigger',
      sql: `
        DROP TRIGGER IF EXISTS trigger_enforce_line_gl_accounts ON universal_transaction_lines;
        CREATE TRIGGER trigger_enforce_line_standards
            BEFORE INSERT OR UPDATE ON universal_transaction_lines
            FOR EACH ROW EXECUTE FUNCTION enforce_transaction_line_standards();
      `
    }
  ]

  let successCount = 0
  let errorCount = 0

  for (const stmt of statements) {
    console.log(`\n📝 Executing: ${stmt.name}`)
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: stmt.sql })
      
      if (error) {
        // Try direct query as fallback
        const { data, error: directError } = await supabase
          .from('core_entities')
          .select('count')
          .limit(0)
          .maybeSingle()
        
        // If we can connect, try raw SQL
        if (!directError) {
          // Unfortunately, Supabase client doesn't support raw SQL execution
          // We'll need to use the Supabase dashboard or CLI
          console.error(`❌ Failed: ${error.message}`)
          console.log(`   ℹ️  Please run this SQL manually in Supabase SQL Editor`)
          errorCount++
        }
      } else {
        console.log(`✅ Success`)
        successCount++
      }
    } catch (err) {
      console.error(`❌ Error: ${err.message}`)
      errorCount++
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`\n📊 Summary:`)
  console.log(`   ✅ Successful: ${successCount}`)
  console.log(`   ❌ Failed: ${errorCount}`)
  
  if (errorCount > 0) {
    console.log(`\n⚠️  Some statements failed. You may need to run them manually in Supabase SQL Editor.`)
    console.log(`\nThe SQL file with all statements is available at:`)
    console.log(`   mcp-server/fix-entity-creation-trigger.sql`)
  } else {
    console.log(`\n🎉 All trigger constraints fixed successfully!`)
  }
}

fixEntityTriggerConstraint().catch(console.error)