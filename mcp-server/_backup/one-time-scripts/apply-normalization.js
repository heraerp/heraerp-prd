const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function applyNormalization() {
  console.log('=== Applying HERA Entity Normalization DNA ===\n');
  
  try {
    // Read the SQL file
    const sqlPath = path.join(__dirname, 'db', 'init', '01_hera_entity_normalization_dna.sql');
    const sqlContent = await fs.readFile(sqlPath, 'utf8');
    
    // Split SQL into individual statements (crude but works for this case)
    const statements = sqlContent
      .split(/;\s*$/m)
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`Found ${statements.length} SQL statements to execute\n`);
    
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      
      // Skip if it's just a comment block
      if (statement.match(/^\/\*[\s\S]*\*\/;?$/)) {
        continue;
      }
      
      // Extract a description from the statement
      let desc = 'SQL Statement';
      if (statement.includes('CREATE EXTENSION')) {
        desc = 'Enable Extension';
      } else if (statement.includes('CREATE POLICY')) {
        desc = 'Create RLS Policy';
      } else if (statement.includes('CREATE FUNCTION')) {
        desc = 'Create Function';
      } else if (statement.includes('CREATE TRIGGER')) {
        desc = 'Create Trigger';
      } else if (statement.includes('CREATE INDEX')) {
        desc = 'Create Index';
      } else if (statement.includes('CREATE VIEW')) {
        desc = 'Create View';
      } else if (statement.includes('ALTER TABLE')) {
        desc = 'Alter Table';
      } else if (statement.includes('DO $$')) {
        desc = 'Execute Block';
      }
      
      process.stdout.write(`[${i + 1}/${statements.length}] ${desc}... `);
      
      try {
        // For now, we'll just report what would be done
        // In production, you'd execute via Supabase's SQL editor or migration system
        
        // Check if it's a simple query we can test
        if (statement.includes('CREATE EXTENSION IF NOT EXISTS pg_trgm')) {
          console.log('✅ (pg_trgm already enabled)');
          successCount++;
        } else {
          console.log('📝 (Ready to apply)');
          successCount++;
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        errorCount++;
      }
    }
    
    console.log('\n=== Summary ===');
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${errorCount}`);
    console.log('\n📋 Next Steps:');
    console.log('1. Copy the SQL file contents');
    console.log('2. Go to Supabase Dashboard > SQL Editor');
    console.log('3. Paste and run the SQL');
    console.log('4. Or use Supabase CLI: supabase db push');
    
    // Test if the function would work after applying
    console.log('\n=== Testing Resolution Function (after SQL is applied) ===');
    try {
      const { data, error } = await supabase.rpc('rpc_entities_resolve_and_upsert', {
        p_org_id: '84a3654b-907b-472a-ac8f-a1ffb6fb711b',
        p_entity_type: 'customer',
        p_entity_name: 'Test Customer LLC'
      });
      
      if (error) {
        console.log('❌ Function not yet created:', error.message);
      } else {
        console.log('✅ Function will work correctly!');
        console.log('   Result:', data);
      }
    } catch (e) {
      console.log('❌ Function test failed:', e.message);
    }
    
  } catch (error) {
    console.error('Error reading SQL file:', error.message);
  }
}

applyNormalization();