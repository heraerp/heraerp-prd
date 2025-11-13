import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLeakedModules() {
  console.log('🔍 ANALYZING APP MODULE RELATIONSHIPS...\n');

  try {
    // Get all APP_HAS_MODULE relationships
    console.log('=== Step 1: Getting all APP_HAS_MODULE relationships ===');
    const { data: allRelationships, error: allRelError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('relationship_type', 'APP_HAS_MODULE');
      
    if (allRelError) {
      console.error('❌ Error getting relationships:', allRelError);
      return;
    }
    
    console.log(`Found ${allRelationships?.length || 0} APP_HAS_MODULE relationships\n`);
    
    // Get all APP entities
    console.log('=== Step 2: Getting all APP entities ===');
    const { data: apps, error: appsError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'APP')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000');
      
    if (appsError) {
      console.error('❌ Error getting apps:', appsError);
      return;
    }
    
    console.log(`Found ${apps?.length || 0} APP entities:`);
    apps?.forEach(app => {
      console.log(`   ${app.entity_name} (${app.metadata?.app_code || 'NO_CODE'})`);
    });
    console.log();
    
    // Get all APP_MODULE entities  
    console.log('=== Step 3: Getting all APP_MODULE entities ===');
    const { data: modules, error: modulesError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'APP_MODULE')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000');
      
    if (modulesError) {
      console.error('❌ Error getting modules:', modulesError);
      return;
    }
    
    console.log(`Found ${modules?.length || 0} APP_MODULE entities:`);
    
    // Group by app_code
    const modulesByApp = {};
    modules?.forEach(module => {
      const appCode = module.metadata?.app_code || 'NO_CODE';
      if (!modulesByApp[appCode]) {
        modulesByApp[appCode] = [];
      }
      modulesByApp[appCode].push(module);
    });

    Object.entries(modulesByApp).forEach(([appCode, modules]) => {
      console.log(`   App Code: ${appCode}`);
      modules.forEach(module => {
        console.log(`     - ${module.entity_name} (ID: ${module.id})`);
      });
    });
    console.log();
    
    // Analyze relationships for leaks
    console.log('=== Step 4: Analyzing for leaked modules ===');
    let leakedCount = 0;
    const leakedModules = [];
    
    allRelationships?.forEach(rel => {
      const app = apps?.find(a => a.id === rel.from_entity_id);
      const module = modules?.find(m => m.id === rel.to_entity_id);
      
      if (app && module) {
        const appCode = app.metadata?.app_code;
        const moduleAppCode = module.metadata?.app_code;
        
        console.log(`Checking: ${app.entity_name} (${appCode || 'NO_CODE'}) -> ${module.entity_name} (${moduleAppCode || 'NO_CODE'})`);
        
        if (appCode !== moduleAppCode) {
          leakedCount++;
          const leaked = {
            relationship_id: rel.id,
            app_name: app.entity_name,
            app_code: appCode || 'NO_CODE',
            module_name: module.entity_name,
            module_app_code: moduleAppCode || 'NO_CODE',
            app_id: app.id,
            module_id: module.id
          };
          leakedModules.push(leaked);
          
          console.log('🚨 LEAKED MODULE FOUND:');
          console.log(`   App: ${leaked.app_name} (${leaked.app_code})`);
          console.log(`   Module: ${leaked.module_name} (${leaked.module_app_code})`);
          console.log(`   Relationship ID: ${rel.id}`);
          console.log(`   App ID: ${leaked.app_id}`);
          console.log(`   Module ID: ${leaked.module_id}\n`);
        }
      } else {
        console.log(`⚠️  Orphaned relationship: ${rel.id} (missing app or module)`);
      }
    });
    
    console.log('\n📊 SUMMARY:');
    console.log(`   Total APP entities: ${apps?.length || 0}`);
    console.log(`   Total APP_MODULE entities: ${modules?.length || 0}`);
    console.log(`   Total APP_HAS_MODULE relationships: ${allRelationships?.length || 0}`);
    console.log(`   Leaked modules: ${leakedCount}`);
    
    if (leakedCount === 0) {
      console.log('\n✅ No leaked modules found! All relationships are properly aligned.');
    } else {
      console.log(`\n❌ Found ${leakedCount} leaked modules!`);
      console.log('\n🔧 LEAKED MODULES DETAILS:');
      leakedModules.forEach((leaked, index) => {
        console.log(`${index + 1}. ${leaked.module_name}`);
        console.log(`   Current app: ${leaked.app_name} (${leaked.app_code})`);
        console.log(`   Module expects: ${leaked.module_app_code}`);
        console.log(`   Relationship ID: ${leaked.relationship_id}`);
        console.log();
      });
      
      console.log('\n🔧 RECOMMENDED ACTIONS:');
      console.log('1. Review the leaked modules above');
      console.log('2. For each leaked module, either:');
      console.log('   a. Fix the module app_code to match the current app');
      console.log('   b. Move the module to the correct app');
      console.log('   c. Delete the incorrect relationship');
      console.log('3. Re-run this script to verify fixes');
      
      console.log('\n💡 EXAMPLE FIX COMMANDS:');
      console.log('-- To delete a leaked relationship:');
      console.log('DELETE FROM core_relationships WHERE id = \'RELATIONSHIP_ID\';');
      console.log('-- To update module app_code:');
      console.log('UPDATE core_entities SET metadata = jsonb_set(metadata, \'{app_code}\', \'"NEW_APP_CODE"\') WHERE id = \'MODULE_ID\';');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkLeakedModules().catch(console.error);