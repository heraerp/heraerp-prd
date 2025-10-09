import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTableSchema(tableName) {
  console.log(`\n=== Checking schema for table: ${tableName} ===\n`);
  
  try {
    // Use raw SQL to get table schema
    const { data, error } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable, column_default
          FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = '${tableName}'
          ORDER BY ordinal_position;
        `
      });

    if (error) {
      console.error('Error fetching schema:', error);
      
      // Try alternative approach
      console.log('\nTrying alternative approach - querying table directly...');
      
      const { data: sampleData, error: sampleError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
        
      if (sampleError) {
        console.error('Error with sample query:', sampleError);
      } else {
        console.log('Sample data structure:');
        if (sampleData && sampleData.length > 0) {
          Object.keys(sampleData[0]).forEach(key => {
            console.log(`  - ${key}`);
          });
        } else {
          console.log('  No data found, but table exists');
        }
      }
      return;
    }

    console.log('Columns:');
    console.log('--------');
    data.forEach(col => {
      console.log(`${col.column_name.padEnd(25)} | ${col.data_type.padEnd(20)} | ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });

    console.log(`\nTotal columns: ${data.length}`);
  } catch (err) {
    console.error('Exception:', err);
    
    // Fallback: try to query the table directly
    console.log('\nFallback: Querying table directly...');
    try {
      const { data: sampleData, error: sampleError } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
        
      if (sampleError) {
        console.error('Error with sample query:', sampleError);
      } else {
        console.log('Sample data structure:');
        if (sampleData && sampleData.length > 0) {
          Object.keys(sampleData[0]).forEach(key => {
            console.log(`  - ${key}`);
          });
        } else {
          console.log('  No data found, but table exists');
        }
      }
    } catch (fallbackErr) {
      console.error('Fallback also failed:', fallbackErr);
    }
  }
}

async function checkOrganizationData(orgId) {
  console.log(`\n=== Checking data for organization: ${orgId} ===\n`);
  
  try {
    // Check users
    const { data: users, error: usersError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_type, entity_code')
      .eq('organization_id', orgId)
      .eq('entity_type', 'user')
      .limit(10);

    if (usersError) {
      console.error('Error fetching users:', usersError);
    } else {
      console.log(`Users found: ${users.length}`);
      users.forEach(user => {
        console.log(`  - ${user.entity_name} (${user.entity_code}) [${user.id}]`);
      });
    }

    // Check GL accounts
    const { data: glAccounts, error: glError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_type, entity_code')
      .eq('organization_id', orgId)
      .eq('entity_type', 'gl_account')
      .limit(10);

    if (glError) {
      console.error('Error fetching GL accounts:', glError);
    } else {
      console.log(`\nGL accounts found: ${glAccounts.length}`);
      glAccounts.forEach(account => {
        console.log(`  - ${account.entity_name} (${account.entity_code}) [${account.id}]`);
      });
    }

    // Check relationships
    const { data: relationships, error: relError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('organization_id', orgId)
      .limit(10);

    if (relError) {
      console.error('Error fetching relationships:', relError);
    } else {
      console.log(`\nRelationships found: ${relationships.length}`);
      relationships.forEach(rel => {
        console.log(`  - ${rel.relationship_type}: ${rel.from_entity_id} -> ${rel.to_entity_id}`);
      });
    }

  } catch (err) {
    console.error('Exception:', err);
  }
}

const tableName = process.argv[2] || 'core_relationships';
const orgId = process.argv[3];

await checkTableSchema(tableName);

if (orgId) {
  await checkOrganizationData(orgId);
}