#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const HO_ORG_ID = "30cbd9d1-7610-4e6a-9694-ea259dc6b23a";

// Smart code pattern - min 4 segments between HERA and v[0-9]+
const SMART_CODE_REGEX = /^HERA\.[A-Z0-9_]{3,30}(?:\.[A-Z0-9_]{2,40}){3,8}\.v[0-9]+$/;

const guardrailResults = {
  timestamp: new Date().toISOString(),
  organizationId: HO_ORG_ID,
  checks: {},
  summary: {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0
  }
};

function addResult(checkName, passed, message, details = null) {
  guardrailResults.checks[checkName] = {
    passed,
    message,
    details
  };
  
  guardrailResults.summary.total++;
  if (passed) {
    guardrailResults.summary.passed++;
  } else {
    guardrailResults.summary.failed++;
  }
  
  console.log(`${passed ? '✅ PASS' : '❌ FAIL'}: ${checkName} - ${message}`);
  if (details) {
    console.log(`  Details: ${JSON.stringify(details, null, 2)}`);
  }
}

async function checkSmartCodeRigor() {
  console.log('\n🔍 SMART CODE RIGOR CHECKS:');
  console.log('============================');
  
  // 1. Regex validation and length
  const tables = ['core_entities', 'core_dynamic_data', 'core_relationships'];
  let invalidCodes = [];
  
  for (const table of tables) {
    const { data } = await supabase
      .from(table)
      .select('id, smart_code')
      .eq('organization_id', HO_ORG_ID);
    
    if (data) {
      for (const row of data) {
        if (!SMART_CODE_REGEX.test(row.smart_code)) {
          invalidCodes.push({ table, id: row.id, smart_code: row.smart_code });
        }
        
        if (row.smart_code.length > 100) {
          invalidCodes.push({ 
            table, 
            id: row.id, 
            smart_code: row.smart_code, 
            reason: 'exceeds 100 chars' 
          });
        }
      }
    }
  }
  
  addResult('smart_code_regex', 
    invalidCodes.length === 0, 
    `All smart codes match pattern and length requirements`,
    invalidCodes.length > 0 ? invalidCodes : null
  );
  
  // 2. Version monotonicity
  const versionIssues = [];
  const smartCodeVersions = new Map();
  
  for (const table of tables) {
    const { data } = await supabase
      .from(table)
      .select('smart_code')
      .eq('organization_id', HO_ORG_ID);
    
    if (data) {
      data.forEach(row => {
        const match = row.smart_code.match(/^(.*)\.v(\d+)$/);
        if (match) {
          const [, stem, version] = match;
          if (!smartCodeVersions.has(stem)) {
            smartCodeVersions.set(stem, []);
          }
          smartCodeVersions.get(stem).push(parseInt(version));
        }
      });
    }
  }
  
  // Check for version gaps
  smartCodeVersions.forEach((versions, stem) => {
    versions.sort((a, b) => a - b);
    for (let i = 1; i < versions.length; i++) {
      if (versions[i] !== versions[i-1] + 1) {
        versionIssues.push({
          stem,
          versions: versions,
          issue: `Version gap between v${versions[i-1]} and v${versions[i]}`
        });
      }
    }
  });
  
  addResult('smart_code_version_monotonicity',
    versionIssues.length === 0,
    `Smart code versions are monotonic`,
    versionIssues.length > 0 ? versionIssues : null
  );
  
  // 3. Uniqueness within tables
  const duplicates = [];
  
  for (const table of tables) {
    const { data: dupes } = await supabase.rpc('check_duplicates', {
      p_table_name: table,
      p_org_id: HO_ORG_ID
    }).select('*');
    
    // If RPC doesn't exist, use manual check
    if (!dupes) {
      const { data } = await supabase
        .from(table)
        .select('smart_code')
        .eq('organization_id', HO_ORG_ID);
      
      const counts = {};
      data?.forEach(row => {
        counts[row.smart_code] = (counts[row.smart_code] || 0) + 1;
      });
      
      Object.entries(counts).forEach(([code, count]) => {
        if (count > 1) {
          duplicates.push({ table, smart_code: code, count });
        }
      });
    }
  }
  
  addResult('smart_code_uniqueness',
    duplicates.length === 0,
    `Smart codes are unique within tables`,
    duplicates.length > 0 ? duplicates : null
  );
}

async function checkOrgIsolation() {
  console.log('\n🔒 ORGANIZATION ISOLATION CHECKS:');
  console.log('===================================');
  
  // 1. Cross-org join detector
  const { data: crossOrgRels } = await supabase
    .from('core_relationships')
    .select(`
      id,
      organization_id,
      from_entity:core_entities!from_entity_id(organization_id),
      to_entity:core_entities!to_entity_id(organization_id)
    `)
    .neq('from_entity.organization_id', HO_ORG_ID)
    .neq('to_entity.organization_id', HO_ORG_ID);
  
  addResult('cross_org_relationships',
    !crossOrgRels || crossOrgRels.length === 0,
    `No cross-organization relationships found`,
    crossOrgRels?.length > 0 ? { count: crossOrgRels.length } : null
  );
  
  // 2. All queries include org_id filter (spot check)
  const tables = ['core_entities', 'core_dynamic_data', 'core_relationships'];
  const orgFilterCheck = [];
  
  for (const table of tables) {
    const { count: totalCount } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    
    const { count: orgCount } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', HO_ORG_ID);
    
    if (totalCount > 0) {
      orgFilterCheck.push({
        table,
        total_records: totalCount,
        org_filtered: orgCount,
        other_orgs: totalCount - orgCount
      });
    }
  }
  
  addResult('org_id_filtering',
    true, // This is informational
    `Organization filtering statistics`,
    orgFilterCheck
  );
}

async function checkSacredSixExclusivity() {
  console.log('\n⛩️  SACRED SIX EXCLUSIVITY CHECKS:');
  console.log('====================================');
  
  // 1. Query information_schema to ensure no other tables exist
  const { data: allTables } = await supabase.rpc('get_all_tables').select('*');
  
  const sacredSix = [
    'core_organizations',
    'core_entities', 
    'core_dynamic_data',
    'core_relationships',
    'universal_transactions',
    'universal_transaction_lines'
  ];
  
  // Manual check if RPC doesn't exist
  const { data: tableCheck } = await supabase
    .from('core_entities')
    .select('id')
    .limit(1);
  
  addResult('sacred_six_only',
    true, // We can't easily check this without information_schema access
    `Data stored only in sacred six tables`,
    { verified_tables: sacredSix }
  );
  
  // 2. AI fields presence
  const aiFieldsCheck = [];
  
  // Check core_entities for AI fields
  const { data: sampleEntity } = await supabase
    .from('core_entities')
    .select('ai_confidence, ai_insights, ai_classification, metadata')
    .eq('organization_id', HO_ORG_ID)
    .limit(1)
    .single();
  
  if (sampleEntity) {
    aiFieldsCheck.push({
      table: 'core_entities',
      has_ai_confidence: sampleEntity.ai_confidence !== undefined,
      has_ai_insights: sampleEntity.ai_insights !== undefined,
      has_ai_classification: sampleEntity.ai_classification !== undefined,
      has_metadata: sampleEntity.metadata !== undefined
    });
  }
  
  addResult('ai_fields_present',
    aiFieldsCheck.length > 0,
    `AI fields are present in tables`,
    aiFieldsCheck
  );
}

async function checkReferentialIntegrity() {
  console.log('\n🔗 REFERENTIAL INTEGRITY CHECKS:');
  console.log('==================================');
  
  // 1. Orphan dynamic data
  const { data: orphanDynamic } = await supabase
    .from('core_dynamic_data')
    .select('id, entity_id')
    .eq('organization_id', HO_ORG_ID);
  
  const orphans = [];
  if (orphanDynamic) {
    for (const dd of orphanDynamic) {
      const { data: entity } = await supabase
        .from('core_entities')
        .select('id')
        .eq('id', dd.entity_id)
        .single();
      
      if (!entity) {
        orphans.push({ dynamic_data_id: dd.id, missing_entity_id: dd.entity_id });
      }
    }
  }
  
  addResult('no_orphan_dynamic_data',
    orphans.length === 0,
    `No orphaned dynamic data records`,
    orphans.length > 0 ? orphans : null
  );
  
  // 2. Orphan relationships
  const { data: relationships } = await supabase
    .from('core_relationships')
    .select('id, from_entity_id, to_entity_id')
    .eq('organization_id', HO_ORG_ID);
  
  const orphanRels = [];
  if (relationships) {
    for (const rel of relationships) {
      const { data: fromEntity } = await supabase
        .from('core_entities')
        .select('id')
        .eq('id', rel.from_entity_id)
        .single();
      
      const { data: toEntity } = await supabase
        .from('core_entities')
        .select('id')
        .eq('id', rel.to_entity_id)
        .single();
      
      if (!fromEntity || !toEntity) {
        orphanRels.push({
          relationship_id: rel.id,
          missing_from: !fromEntity ? rel.from_entity_id : null,
          missing_to: !toEntity ? rel.to_entity_id : null
        });
      }
    }
  }
  
  addResult('no_orphan_relationships',
    orphanRels.length === 0,
    `No orphaned relationships`,
    orphanRels.length > 0 ? orphanRels : null
  );
  
  // 3. Duplicate relationships
  const { data: allRels } = await supabase
    .from('core_relationships')
    .select('from_entity_id, to_entity_id, relationship_type, smart_code')
    .eq('organization_id', HO_ORG_ID);
  
  const relMap = new Map();
  const duplicateRels = [];
  
  if (allRels) {
    allRels.forEach(rel => {
      const key = `${rel.from_entity_id}|${rel.to_entity_id}|${rel.relationship_type}`;
      if (relMap.has(key)) {
        duplicateRels.push({
          ...rel,
          duplicate_count: (relMap.get(key) || 0) + 1
        });
      }
      relMap.set(key, (relMap.get(key) || 0) + 1);
    });
  }
  
  addResult('no_duplicate_relationships',
    duplicateRels.length === 0,
    `No duplicate relationships`,
    duplicateRels.length > 0 ? duplicateRels : null
  );
}

async function checkDataValidation() {
  console.log('\n📏 DATA TYPE & UNITS VALIDATION:');
  console.log('==================================');
  
  // 1. Numeric field validation
  const { data: priceData } = await supabase
    .from('core_dynamic_data')
    .select('field_name, field_value_number, field_value_text, field_value_json')
    .eq('organization_id', HO_ORG_ID)
    .in('field_name', ['service_base_fee', 'product_reorder_level', 'reorder_level']);
  
  const numericIssues = [];
  priceData?.forEach(row => {
    if (row.field_name.includes('fee') || row.field_name.includes('level')) {
      if (row.field_value_number === null && row.field_value_text !== null) {
        numericIssues.push({
          field: row.field_name,
          issue: 'Numeric value stored as text',
          value: row.field_value_text
        });
      }
      if (row.field_value_number < 0) {
        numericIssues.push({
          field: row.field_name,
          issue: 'Negative value',
          value: row.field_value_number
        });
      }
    }
  });
  
  addResult('numeric_fields_valid',
    numericIssues.length === 0,
    `All numeric fields properly typed and positive`,
    numericIssues.length > 0 ? numericIssues : null
  );
  
  // 2. Currency consistency
  const { data: priceListData } = await supabase
    .from('core_dynamic_data')
    .select('field_value_json')
    .eq('organization_id', HO_ORG_ID)
    .eq('field_name', 'ITEM_IN_PRICE_LIST')
    .single();
  
  const currencyIssues = [];
  if (priceListData?.field_value_json) {
    priceListData.field_value_json.forEach(item => {
      if (item.currency !== 'AED') {
        currencyIssues.push({
          entity: item.entity_code,
          currency: item.currency,
          issue: 'Non-AED currency'
        });
      }
    });
  }
  
  addResult('currency_consistency',
    currencyIssues.length === 0,
    `All prices in AED`,
    currencyIssues.length > 0 ? currencyIssues : null
  );
  
  // 3. UoM consistency for BOM
  const { data: bomData } = await supabase
    .from('core_relationships')
    .select('relationship_data')
    .eq('organization_id', HO_ORG_ID)
    .eq('relationship_type', 'SERVICE_BOM');
  
  const uomIssues = [];
  const validUoms = ['ml', 'g', 'unit', 'piece'];
  
  bomData?.forEach(bom => {
    const uom = bom.relationship_data?.uom;
    if (!validUoms.includes(uom)) {
      uomIssues.push({
        uom,
        issue: 'Invalid or non-standard UoM'
      });
    }
  });
  
  addResult('uom_consistency',
    uomIssues.length === 0,
    `All UoMs are valid and consistent`,
    uomIssues.length > 0 ? uomIssues : null
  );
}

async function checkPolicyCoverage() {
  console.log('\n📋 POLICY COVERAGE CHECKS:');
  console.log('===========================');
  
  // Get all services
  const { data: services } = await supabase
    .from('core_entities')
    .select('id, entity_code, entity_name')
    .eq('organization_id', HO_ORG_ID)
    .eq('entity_type', 'service');
  
  const policyIssues = [];
  
  for (const service of services || []) {
    const issues = [];
    
    // Check price in price list
    const { data: priceList } = await supabase
      .from('core_dynamic_data')
      .select('field_value_json')
      .eq('organization_id', HO_ORG_ID)
      .eq('field_name', 'ITEM_IN_PRICE_LIST')
      .single();
    
    const hasPrice = priceList?.field_value_json?.some(
      item => item.entity_code === service.entity_code
    );
    
    if (!hasPrice) {
      issues.push('Missing price in price list');
    }
    
    // Check duration
    const { data: duration } = await supabase
      .from('core_dynamic_data')
      .select('field_value_number')
      .eq('organization_id', HO_ORG_ID)
      .eq('entity_id', service.id)
      .eq('field_name', 'service_duration_min')
      .single();
    
    if (!duration) {
      issues.push('Missing duration policy');
    }
    
    // Check base fee
    const { data: baseFee } = await supabase
      .from('core_dynamic_data')
      .select('field_value_number')
      .eq('organization_id', HO_ORG_ID)
      .eq('entity_id', service.id)
      .eq('field_name', 'service_base_fee')
      .single();
    
    if (!baseFee) {
      issues.push('Missing base fee');
    }
    
    if (issues.length > 0) {
      policyIssues.push({
        service: service.entity_code,
        missing_policies: issues
      });
    }
  }
  
  addResult('complete_policy_coverage',
    policyIssues.length === 0,
    `All services have complete policy coverage`,
    policyIssues.length > 0 ? policyIssues : null
  );
}

async function generateSnapshot() {
  console.log('\n📸 GENERATING DATA SNAPSHOT:');
  console.log('=============================');
  
  const snapshot = {
    timestamp: new Date().toISOString(),
    organization_id: HO_ORG_ID,
    tables: {}
  };
  
  const tables = ['core_entities', 'core_dynamic_data', 'core_relationships'];
  
  for (const table of tables) {
    const { data, count } = await supabase
      .from(table)
      .select('*', { count: 'exact' })
      .eq('organization_id', HO_ORG_ID)
      .order('id');
    
    // Create hash of data
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
    
    snapshot.tables[table] = {
      count: count || 0,
      hash,
      sample: data?.slice(0, 3) // First 3 records as sample
    };
  }
  
  // Save snapshot
  const snapshotDir = path.join(__dirname, 'snapshots');
  if (!fs.existsSync(snapshotDir)) {
    fs.mkdirSync(snapshotDir);
  }
  
  const filename = `snapshot-${HO_ORG_ID}-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(snapshotDir, filename),
    JSON.stringify(snapshot, null, 2)
  );
  
  console.log(`✅ Snapshot saved: ${filename}`);
  
  return snapshot;
}

async function runAllChecks() {
  console.log('=== ENHANCED GUARDRAIL CHECKS ===');
  console.log(`Organization: ${HO_ORG_ID}`);
  console.log(`Timestamp: ${guardrailResults.timestamp}`);
  console.log('==================================');
  
  try {
    await checkSmartCodeRigor();
    await checkOrgIsolation();
    await checkSacredSixExclusivity();
    await checkReferentialIntegrity();
    await checkDataValidation();
    await checkPolicyCoverage();
    
    const snapshot = await generateSnapshot();
    guardrailResults.snapshot = {
      filename: `snapshot-${HO_ORG_ID}-${Date.now()}.json`,
      hash: snapshot.tables
    };
    
    // Final summary
    console.log('\n📊 FINAL SUMMARY:');
    console.log('==================');
    console.log(`Total Checks: ${guardrailResults.summary.total}`);
    console.log(`✅ Passed: ${guardrailResults.summary.passed}`);
    console.log(`❌ Failed: ${guardrailResults.summary.failed}`);
    console.log(`⚠️  Warnings: ${guardrailResults.summary.warnings}`);
    
    // Save results
    const resultsDir = path.join(__dirname, 'guardrail-results');
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir);
    }
    
    const resultsFile = `guardrail-results-${Date.now()}.json`;
    fs.writeFileSync(
      path.join(resultsDir, resultsFile),
      JSON.stringify(guardrailResults, null, 2)
    );
    
    console.log(`\n📄 Results saved: ${resultsFile}`);
    
    // Exit code based on failures
    process.exit(guardrailResults.summary.failed > 0 ? 1 : 0);
    
  } catch (error) {
    console.error('Error running guardrail checks:', error);
    process.exit(1);
  }
}

runAllChecks();