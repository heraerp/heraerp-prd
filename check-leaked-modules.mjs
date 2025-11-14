import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLeakedModules() {
  console.log('🔍 ANALYZING APP MODULE RELATIONSHIPS...\n');

  // Query 1: Find leaked modules where relationship exists but app_code mismatches
  console.log('=== QUERY 1: Leaked Modules (Relationship exists but app_code mismatches) ===');
  
  const { data: leakedModules, error: leakedError } = await supabase.rpc('hera_entities_crud_v1', {
    p_action: 'READ',
    p_actor_user_id: '00000000-0000-0000-0000-000000000000',
    p_organization_id: '00000000-0000-0000-0000-000000000000',
    p_entity: { entity_type: 'QUERY' },
    p_dynamic: {},
    p_relationships: [],
    p_options: {
      custom_sql: `
        SELECT 
          r.id as relationship_id,
          a.id AS app_id, 
          a.entity_name as app_name,
          a.metadata->>'app_code' AS app_code,
          m.id AS module_id, 
          m.entity_name as module_name,
          m.metadata->>'app_code' AS module_app_code
        FROM core_relationships r
        JOIN core_entities a ON a.id = r.from_entity_id AND a.entity_type='APP'
        JOIN core_entities m ON m.id = r.to_entity_id AND m.entity_type='APP_MODULE'
        WHERE r.relationship_type='APP_HAS_MODULE'
          AND NULLIF(m.metadata->>'app_code','') IS DISTINCT FROM a.metadata->>'app_code'
          AND a.organization_id = '00000000-0000-0000-0000-000000000000';
      `
    }
  });
  
  if (leakedError) {
    console.error('❌ Error querying leaked modules:', leakedError);
    
    // Fallback: Get all relationships first
    const { data: allRelationships, error: allRelError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('relationship_type', 'APP_HAS_MODULE');
      
    if (allRelError) {
      console.error('❌ Error getting relationships:', allRelError);
      return;
    }
    
    console.log(`Found ${allRelationships?.length || 0} APP_HAS_MODULE relationships`);
    
    // Get entities separately
    const { data: apps, error: appsError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'APP')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000');
      
    const { data: modules, error: modulesError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'APP_MODULE')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000');
      
    if (appsError || modulesError) {
      console.error('❌ Error getting entities:', { appsError, modulesError });
      return;
    }
    
    console.log(`Found ${apps?.length || 0} apps and ${modules?.length || 0} modules`);
    
    // Manual analysis
    let leakedCount = 0;
    allRelationships?.forEach(rel => {
      const app = apps?.find(a => a.id === rel.from_entity_id);
      const module = modules?.find(m => m.id === rel.to_entity_id);
      
      if (app && module) {
        const appCode = app.metadata?.app_code;
        const moduleAppCode = module.metadata?.app_code;
        
        if (appCode !== moduleAppCode) {
          leakedCount++;
          console.log('🚨 LEAKED MODULE FOUND:');
          console.log(`   App: ${app.entity_name} (${appCode || 'NO_CODE'})`);
          console.log(`   Module: ${module.entity_name} (${moduleAppCode || 'NO_CODE'})`);
          console.log(`   Relationship ID: ${rel.id}\n`);
        }
      }
    });
    
    if (leakedCount === 0) {
      console.log('✅ No leaked modules found!\n');
    } else {
      console.log(`❌ Found ${leakedCount} leaked modules!\n`);
    }
    
    return;
  }

  console.log(`Found ${relationships?.length || 0} APP_HAS_MODULE relationships\n`);

  let leakedCount = 0;
  const leakedModules = [];

  if (relationships) {
    for (const rel of relationships) {
      const appCode = rel.from_entity?.metadata?.app_code;
      const moduleAppCode = rel.to_entity?.metadata?.app_code;
      
      if (appCode !== moduleAppCode) {
        leakedCount++;
        const leakedModule = {
          relationship_id: rel.id,
          app_id: rel.from_entity_id,
          app_name: rel.from_entity?.entity_name,
          app_code: appCode,
          module_id: rel.to_entity_id,
          module_name: rel.to_entity?.entity_name,
          module_app_code: moduleAppCode
        };
        leakedModules.push(leakedModule);
        console.log('🚨 LEAKED MODULE FOUND:');
        console.log(`   App: ${leakedModule.app_name} (${leakedModule.app_code})`);
        console.log(`   Module: ${leakedModule.module_name} (${leakedModule.module_app_code})`);
        console.log(`   Relationship ID: ${rel.id}\n`);
      }
    }
  }

  if (leakedCount === 0) {
    console.log('✅ No leaked modules found!\n');
  } else {
    console.log(`❌ Found ${leakedCount} leaked modules!\n`);
  }

  // Query 2: All APP entities
  console.log('=== QUERY 2: All APP Entities ===');
  const { data: apps, error: appsError } = await supabase
    .from('core_entities')
    .select('id, entity_name, metadata')
    .eq('entity_type', 'APP')
    .eq('organization_id', '00000000-0000-0000-0000-000000000000')
    .order('entity_name');
    
  if (appsError) {
    console.error('❌ Error querying apps:', appsError);
  } else {
    console.log(`Found ${apps?.length || 0} APP entities:`);
    apps?.forEach(app => {
      console.log(`   ${app.entity_name} (${app.metadata?.app_code || 'NO_APP_CODE'})`);
    });
    console.log();
  }

  // Query 3: All APP_MODULE entities
  console.log('=== QUERY 3: All APP_MODULE Entities ===');
  const { data: modules, error: modulesError } = await supabase
    .from('core_entities')
    .select('id, entity_name, metadata')
    .eq('entity_type', 'APP_MODULE')
    .eq('organization_id', '00000000-0000-0000-0000-000000000000')
    .order('entity_name');
    
  if (modulesError) {
    console.error('❌ Error querying modules:', modulesError);
  } else {
    console.log(`Found ${modules?.length || 0} APP_MODULE entities:`);
    
    // Group by app_code
    const modulesByApp = {};
    modules?.forEach(module => {
      const appCode = module.metadata?.app_code || 'NO_APP_CODE';
      if (!modulesByApp[appCode]) {
        modulesByApp[appCode] = [];
      }
      modulesByApp[appCode].push(module);
    });

    Object.entries(modulesByApp).forEach(([appCode, modules]) => {
      console.log(`   App Code: ${appCode}`);
      modules.forEach(module => {
        console.log(`     - ${module.entity_name}`);
      });
    });
    console.log();
  }

  // Query 4: Current APP_HAS_MODULE relationships summary
  console.log('=== QUERY 4: Current APP_HAS_MODULE Relationships Summary ===');
  if (relationships) {
    console.log('Current relationships:');
    relationships.forEach(rel => {
      const appCode = rel.from_entity?.metadata?.app_code;
      const moduleAppCode = rel.to_entity?.metadata?.app_code;
      const isMatched = appCode === moduleAppCode ? '✅' : '❌';
      console.log(`   ${isMatched} ${rel.from_entity?.entity_name} -> ${rel.to_entity?.entity_name}`);
      console.log(`      App: ${appCode} | Module: ${moduleAppCode}`);
    });
  }

  console.log('\n📊 SUMMARY:');
  console.log(`   Total APP entities: ${apps?.length || 0}`);
  console.log(`   Total APP_MODULE entities: ${modules?.length || 0}`);
  console.log(`   Total relationships: ${relationships?.length || 0}`);
  console.log(`   Leaked modules: ${leakedCount}`);

  if (leakedCount > 0) {
    console.log('\n🔧 RECOMMENDED ACTIONS:');
    console.log('1. Review the leaked modules above');
    console.log('2. Either fix the module app_code or create correct relationships');
    console.log('3. Delete incorrect relationships');
    console.log('4. Re-run this script to verify fixes');
  }
}

checkLeakedModules().catch(console.error);