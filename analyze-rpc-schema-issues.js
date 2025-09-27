#!/usr/bin/env node

/**
 * Analyze all RPC functions for schema mismatches
 */

const fs = require('fs');
const path = require('path');

// Actual table schemas from database
const tableSchemas = {
  core_organizations: [
    'id', 'organization_name', 'organization_code', 'organization_type',
    'industry_classification', 'parent_organization_id', 'ai_insights',
    'ai_classification', 'ai_confidence', 'settings', 'status',
    'created_at', 'updated_at', 'created_by', 'updated_by'
  ],
  core_entities: [
    'id', 'organization_id', 'entity_type', 'entity_name', 'entity_code',
    'entity_description', 'parent_entity_id', 'smart_code', 'smart_code_status',
    'ai_confidence', 'ai_classification', 'ai_insights', 'business_rules',
    'metadata', 'tags', 'status', 'created_at', 'updated_at', 'created_by',
    'updated_by', 'version'
  ],
  core_dynamic_data: [
    'id', 'organization_id', 'entity_id', 'field_name', 'field_type',
    'field_value_text', 'field_value_number', 'field_value_boolean',
    'field_value_date', 'field_value_json', 'field_value_file_url',
    'calculated_value', 'smart_code', 'smart_code_status', 'ai_confidence',
    'ai_enhanced_value', 'ai_insights', 'validation_rules', 'validation_status',
    'field_order', 'is_searchable', 'is_required', 'is_system_field',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'version'
  ],
  core_relationships: [
    'id', 'organization_id', 'from_entity_id', 'to_entity_id', 'relationship_type',
    'relationship_direction', 'relationship_strength', 'relationship_data',
    'smart_code', 'smart_code_status', 'ai_confidence', 'ai_classification',
    'ai_insights', 'business_logic', 'validation_rules', 'is_active',
    'effective_date', 'expiration_date', 'created_at', 'updated_at',
    'created_by', 'updated_by', 'version'
  ],
  universal_transactions: [
    'id', 'organization_id', 'transaction_type', 'transaction_code',
    'transaction_date', 'source_entity_id', 'target_entity_id', 'total_amount',
    'transaction_status', 'reference_number', 'external_reference', 'smart_code',
    'smart_code_status', 'ai_confidence', 'ai_classification', 'ai_insights',
    'business_context', 'metadata', 'approval_required', 'approved_by',
    'approved_at', 'created_at', 'updated_at', 'created_by', 'updated_by',
    'version', 'transaction_currency_code', 'base_currency_code', 'exchange_rate',
    'exchange_rate_date', 'exchange_rate_type', 'fiscal_period_entity_id',
    'fiscal_year', 'fiscal_period', 'posting_period_code'
  ],
  universal_transaction_lines: [
    'id', 'organization_id', 'transaction_id', 'line_number', 'entity_id',
    'line_type', 'description', 'quantity', 'unit_amount', 'line_amount',
    'discount_amount', 'tax_amount', 'smart_code', 'smart_code_status',
    'ai_confidence', 'ai_classification', 'ai_insights', 'line_data',
    'created_at', 'updated_at', 'created_by', 'updated_by', 'version'
  ]
};

// Function files to analyze
const functionFiles = [
  'database/functions/v2/hera_entity_read_v1.sql',
  'database/functions/v2/hera_dynamic_data_v1.sql',
  'database/functions/v2/relationship-crud.sql',
  'database/functions/v2/txn-crud.sql',
  'supabase/migrations/20240101000002_hera_complete_crud_functions.sql',
  'supabase/migrations/20240101000001_hera_entity_crud_functions.sql'
];

// Known issues to look for
const knownIssues = [
  'attributes',     // Column doesn't exist in core_entities
  'is_deleted',     // Column doesn't exist in any table
  'relationship_subtype',  // Doesn't exist in core_relationships
  'relationship_name',     // Doesn't exist in core_relationships
  'relationship_code',     // Doesn't exist in core_relationships
  'field_value_datetime',  // Should be field_value_date
];

function analyzeFunction(filePath) {
  console.log(`\n📋 Analyzing: ${filePath}`);
  console.log('=' . repeat(60));

  if (!fs.existsSync(filePath)) {
    console.log('❌ File not found');
    return { issues: [], recommendations: [] };
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  const recommendations = [];

  // Check for each known issue
  knownIssues.forEach(issue => {
    const regex = new RegExp(`\\b${issue}\\b`, 'gi');
    const matches = content.match(regex);

    if (matches) {
      issues.push({
        type: 'unknown_column',
        column: issue,
        occurrences: matches.length,
        lines: findLineNumbers(content, issue)
      });

      // Provide recommendations
      switch (issue) {
        case 'attributes':
          recommendations.push(`Replace 'attributes' with 'metadata' or remove if not needed`);
          break;
        case 'is_deleted':
          recommendations.push(`Remove 'is_deleted' filters - HERA doesn't use soft deletes`);
          break;
        case 'relationship_subtype':
        case 'relationship_name':
        case 'relationship_code':
          recommendations.push(`Use 'relationship_type' instead of '${issue}'`);
          break;
        case 'field_value_datetime':
          recommendations.push(`Use 'field_value_date' instead of 'field_value_datetime'`);
          break;
      }
    }
  });

  // Check for table schema mismatches
  Object.keys(tableSchemas).forEach(tableName => {
    const tableRegex = new RegExp(`FROM\\s+${tableName}|JOIN\\s+${tableName}`, 'gi');
    if (content.match(tableRegex)) {
      // Extract column references after table alias
      const aliasRegex = new RegExp(`${tableName}\\s+(\\w+)`, 'i');
      const aliasMatch = content.match(aliasRegex);
      if (aliasMatch) {
        const alias = aliasMatch[1];
        const columnRefs = extractColumnReferences(content, alias);

        columnRefs.forEach(col => {
          if (!tableSchemas[tableName].includes(col)) {
            issues.push({
              type: 'invalid_column',
              table: tableName,
              column: col,
              suggestion: findSimilarColumn(col, tableSchemas[tableName])
            });
          }
        });
      }
    }
  });

  // Display results
  if (issues.length === 0) {
    console.log('✅ No schema issues found');
  } else {
    console.log(`❌ Found ${issues.length} issue(s):`);
    issues.forEach((issue, i) => {
      console.log(`\n${i + 1}. ${issue.type.toUpperCase()}: ${issue.column || `${issue.table}.${issue.column}`}`);
      if (issue.occurrences) console.log(`   Occurrences: ${issue.occurrences}`);
      if (issue.lines) console.log(`   Lines: ${issue.lines.join(', ')}`);
      if (issue.suggestion) console.log(`   Suggestion: Use '${issue.suggestion}' instead`);
    });

    if (recommendations.length > 0) {
      console.log('\n🔧 Recommendations:');
      recommendations.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec}`);
      });
    }
  }

  return { issues, recommendations };
}

function findLineNumbers(content, searchTerm) {
  const lines = content.split('\n');
  const lineNumbers = [];

  lines.forEach((line, index) => {
    if (line.toLowerCase().includes(searchTerm.toLowerCase())) {
      lineNumbers.push(index + 1);
    }
  });

  return lineNumbers;
}

function extractColumnReferences(content, alias) {
  const regex = new RegExp(`${alias}\\.(\\w+)`, 'gi');
  const matches = content.match(regex) || [];
  return [...new Set(matches.map(m => m.split('.')[1]))];
}

function findSimilarColumn(column, availableColumns) {
  // Simple similarity check
  const lower = column.toLowerCase();
  const similar = availableColumns.find(col =>
    col.toLowerCase().includes(lower) || lower.includes(col.toLowerCase())
  );
  return similar || availableColumns[0]; // Return first available as fallback
}

// Main analysis
console.log('🧪 HERA RPC Function Schema Analysis');
console.log('=' . repeat(60));

const allIssues = [];
const allRecommendations = [];

functionFiles.forEach(file => {
  const result = analyzeFunction(file);
  allIssues.push(...result.issues);
  allRecommendations.push(...result.recommendations);
});

// Summary
console.log('\n\n📊 ANALYSIS SUMMARY');
console.log('=' . repeat(60));
console.log(`Total files analyzed: ${functionFiles.length}`);
console.log(`Total issues found: ${allIssues.length}`);
console.log(`Total recommendations: ${allRecommendations.length}`);

if (allIssues.length > 0) {
  console.log('\n⚠️ Issues by type:');
  const issuesByType = {};
  allIssues.forEach(issue => {
    issuesByType[issue.type] = (issuesByType[issue.type] || 0) + 1;
  });
  Object.entries(issuesByType).forEach(([type, count]) => {
    console.log(`   ${type}: ${count}`);
  });

  console.log('\n❌ Most common issues:');
  const issuesByColumn = {};
  allIssues.forEach(issue => {
    const key = issue.column || `${issue.table}.${issue.column}`;
    issuesByColumn[key] = (issuesByColumn[key] || 0) + 1;
  });
  Object.entries(issuesByColumn)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .forEach(([column, count]) => {
      console.log(`   ${column}: ${count} occurrences`);
    });
}

console.log('\n✅ Analysis complete!');