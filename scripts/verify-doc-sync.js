#!/usr/bin/env node

/**
 * Verify Documentation Sync
 * Checks if documentation was successfully synced to HERA database
 */

const { execSync } = require('child_process')

function runQuery(query, description) {
  try {
    console.log(`🔍 ${description}...`)
    const result = execSync(`psql "${process.env.DATABASE_URL}" -c "${query}"`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    })
    console.log(result)
    return true
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`)
    return false
  }
}

function verifyDocumentationSync() {
  console.log('🔍 Verifying HERA documentation sync...')
  console.log('')

  const queries = [
    {
      query: `SELECT client_name, client_code, client_type, status FROM core_clients WHERE client_name = 'HERA System Client';`,
      description: 'Checking system client'
    },
    {
      query: `SELECT organization_name, organization_type, status FROM core_organizations WHERE organization_name LIKE 'HERA%' ORDER BY organization_name;`,
      description: 'Checking HERA organizations'
    },
    {
      query: `SELECT e.entity_name, e.entity_code, e.metadata->>'section' as section, e.status FROM core_entities e JOIN core_organizations o ON e.organization_id = o.id WHERE o.organization_name = 'HERA Developer Documentation' AND e.entity_type = 'doc_page' ORDER BY (e.metadata->>'order')::int;`,
      description: 'Checking documentation pages'
    },
    {
      query: `SELECT COUNT(*) as content_count FROM core_dynamic_data cd JOIN core_entities e ON cd.entity_id = e.id WHERE e.entity_type = 'doc_page' AND cd.field_name = 'content';`,
      description: 'Checking page content'
    },
    {
      query: `SELECT COUNT(*) as relationship_count FROM core_relationships r JOIN core_entities e1 ON r.source_entity_id = e1.id WHERE e1.entity_type = 'doc_page' AND r.relationship_type = 'navigation_next';`,
      description: 'Checking navigation relationships'
    },
    {
      query: `SELECT transaction_type, reference_number, status FROM universal_transactions WHERE reference_number = 'AUTO-DOC-INITIAL-SYNC';`,
      description: 'Checking sync transaction'
    }
  ]

  let passedChecks = 0
  for (const { query, description } of queries) {
    const success = runQuery(query, description)
    if (success) passedChecks++
    console.log('')
  }

  console.log('📊 Verification Summary:')
  console.log(`✅ Passed: ${passedChecks}/${queries.length} checks`)
  
  if (passedChecks === queries.length) {
    console.log('🎉 Documentation sync verification PASSED!')
    console.log('')
    console.log('🌐 Your documentation should now be available at:')
    console.log('  • /docs - Documentation hub')
    console.log('  • /docs/dev - Developer documentation')
    console.log('  • /docs/dev/auto-documentation-system')
    console.log('  • /docs/dev/api-docs-search')
    console.log('  • /docs/dev/component-doc-layout')
    console.log('  • /docs/dev/feature-git-hooks-automation')
  } else {
    console.log('⚠️  Some verification checks failed')
    console.log('💡 You may need to run the SQL sync script manually')
  }

  return passedChecks === queries.length
}

// Check if DATABASE_URL is set
if (!process.env.DATABASE_URL) {
  console.log('❌ DATABASE_URL environment variable is not set')
  console.log('💡 Make sure your .env.local file contains: DATABASE_URL=your_connection_string')
  process.exit(1)
}

if (require.main === module) {
  const success = verifyDocumentationSync()
  process.exit(success ? 0 : 1)
}

module.exports = { verifyDocumentationSync }