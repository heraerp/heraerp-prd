const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Connecting to Supabase...');
console.log('URL:', supabaseUrl ? 'Found' : 'Missing');
console.log('Key:', supabaseKey ? 'Found' : 'Missing');

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function listEntitiesAndFunctions() {
  try {
    // List entities from core_entities
    console.log('\n=== ENTITIES IN CORE_ENTITIES TABLE ===');
    const { data: entities, error: entitiesError } = await supabase
      .from('core_entities')
      .select('entity_type, entity_name, smart_code, organization_id')
      .limit(30);
    
    if (entitiesError) {
      console.error('Error fetching entities:', entitiesError.message);
    } else if (entities && entities.length > 0) {
      // Group by entity_type
      const grouped = {};
      entities.forEach(e => {
        if (!grouped[e.entity_type]) grouped[e.entity_type] = [];
        grouped[e.entity_type].push(e);
      });
      
      console.log('\nFound', Object.keys(grouped).length, 'entity types:');
      Object.keys(grouped).sort().forEach(type => {
        console.log('\n📦 Entity Type:', type, '(' + grouped[type].length + ' entities)');
        grouped[type].slice(0, 3).forEach(e => {
          console.log('  -', e.entity_name, e.smart_code ? '[' + e.smart_code + ']' : '');
        });
        if (grouped[type].length > 3) {
          console.log('  ... and', grouped[type].length - 3, 'more');
        }
      });
    } else {
      console.log('No entities found or table is empty');
    }
    
    // Try to list functions using RPC
    console.log('\n=== ATTEMPTING TO LIST DATABASE FUNCTIONS ===');
    
    // First check if execute_sql function exists
    try {
      const { data: funcData, error: funcError } = await supabase.rpc('execute_sql', {
        query: "SELECT proname as function_name, pronargs as arg_count FROM pg_proc WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public') ORDER BY proname LIMIT 20"
      });
      
      if (funcError) {
        throw funcError;
      }
      
      if (funcData && funcData.length > 0) {
        console.log('\nDatabase functions found:');
        funcData.forEach(f => {
          console.log('  - ' + f.function_name + ' (args: ' + f.arg_count + ')');
        });
      }
    } catch (rpcError) {
      console.log('execute_sql RPC not available:', rpcError.message);
      
      // List expected functions based on SQL files
      console.log('\n=== EXPECTED FUNCTIONS (from SQL files) ===');
      const expectedFunctions = {
        'Organization Management': [
          'create_organization_with_owner',
          'create_organization_with_salon',
          'update_organization_settings'
        ],
        'Smart Code System': [
          'generate_smart_code',
          'validate_smart_code', 
          'parse_smart_code',
          'get_smart_code_context'
        ],
        'Financial': [
          'post_to_gl',
          'calculate_profitability',
          'generate_coa',
          'process_auto_journal'
        ],
        'Tender Management': [
          'execute_sql',
          'create_tender',
          'update_tender_status'
        ],
        'Workflow': [
          'create_workflow_status',
          'assign_status',
          'get_current_status'
        ]
      };
      
      Object.entries(expectedFunctions).forEach(([category, funcs]) => {
        console.log('\n' + category + ':');
        funcs.forEach(f => console.log('  - ' + f));
      });
    }
    
    // Check organization count
    console.log('\n=== ORGANIZATION SUMMARY ===');
    const { data: orgs, error: orgsError } = await supabase
      .from('core_organizations')
      .select('organization_name, organization_type')
      .limit(10);
    
    if (!orgsError && orgs) {
      console.log('Organizations found:', orgs.length);
      orgs.forEach(o => {
        console.log('  -', o.organization_name, '(' + o.organization_type + ')');
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

listEntitiesAndFunctions().then(() => process.exit(0));