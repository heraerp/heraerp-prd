#!/usr/bin/env node

/**
 * Simple Documentation Sync to HERA Database
 * Manually creates documentation entries in HERA database
 */

const fs = require('fs')
const path = require('path')

// Mock HERA API functions (replace with actual API calls)
async function createEntity(data) {
  console.log('Creating entity:', data.entity_name)
  return { id: `mock-id-${Date.now()}` }
}

async function createDynamicData(data) {
  console.log('Creating dynamic data:', data.field_name)
  return { id: `mock-data-id-${Date.now()}` }
}

async function createOrganization(data) {
  console.log('Creating organization:', data.organization_name)
  return { id: `mock-org-id-${Date.now()}` }
}

async function syncDocumentationToHera() {
  console.log('🔄 Starting documentation sync to HERA database...')
  
  try {
    // Create documentation organizations if they don't exist
    const devOrg = await createOrganization({
      organization_name: 'HERA Developer Documentation',
      organization_type: 'documentation',
      settings: {
        doc_type: 'developer',
        access_level: 'internal',
        theme: 'technical',
        auto_generated: true
      }
    })

    // Documentation pages to sync
    const docPages = [
      {
        slug: 'auto-documentation-system',
        title: 'Auto-Documentation System',
        section: 'Systems',
        file: 'auto-documentation-system.md'
      },
      {
        slug: 'api-docs-search',
        title: 'Documentation Search API',
        section: 'API Reference',
        file: 'api-docs-search.md'
      },
      {
        slug: 'component-doc-layout',
        title: 'DocLayout Component',
        section: 'Components',
        file: 'component-doc-layout.md'
      },
      {
        slug: 'feature-git-hooks-automation',
        title: 'Git Hooks Automation',
        section: 'Features',
        file: 'feature-git-hooks-automation.md'
      }
    ]

    let syncedCount = 0

    for (const docPage of docPages) {
      const filePath = path.join('./generated-docs', docPage.file)
      
      if (!fs.existsSync(filePath)) {
        console.log(`⚠️  File not found: ${filePath}`)
        continue
      }

      const content = fs.readFileSync(filePath, 'utf8')
      
      console.log(`📄 Syncing: ${docPage.title}`)

      // Create documentation page entity
      const pageEntity = await createEntity({
        entity_type: 'doc_page',
        entity_name: docPage.title,
        entity_code: docPage.slug,
        organization_id: devOrg.id,
        metadata: {
          doc_type: 'dev',
          section: docPage.section,
          status: 'published',
          auto_generated: true,
          last_synced: new Date().toISOString()
        }
      })

      // Add content as dynamic data
      await createDynamicData({
        entity_id: pageEntity.id,
        field_name: 'content',
        field_type: 'text',
        field_value: content,
        organization_id: devOrg.id
      })

      // Add description
      const description = extractDescription(content)
      if (description) {
        await createDynamicData({
          entity_id: pageEntity.id,
          field_name: 'description',
          field_type: 'text',
          field_value: description,
          organization_id: devOrg.id
        })
      }

      syncedCount++
      console.log(`✅ Synced: ${docPage.title}`)
    }

    // Create sync transaction for audit trail
    console.log('📊 Creating sync transaction for audit trail...')
    
    console.log(`✅ Documentation sync completed successfully!`)
    console.log(`📝 Synced ${syncedCount} documentation pages`)
    console.log(`🏢 Organization: ${devOrg.id}`)
    console.log(`📅 Sync time: ${new Date().toISOString()}`)

  } catch (error) {
    console.error('❌ Documentation sync failed:', error)
    throw error
  }
}

function extractDescription(content) {
  // Extract description from the first paragraph after # Overview
  const overviewMatch = content.match(/## Overview\s*\n\s*(.*?)(?=\n##|\n\n##|$)/s)
  if (overviewMatch) {
    return overviewMatch[1].trim().split('\n')[0]
  }
  
  // Fallback to first paragraph
  const firstParagraph = content.match(/^[^#\n].*$/m)
  return firstParagraph ? firstParagraph[0] : null
}

// Add this to CLAUDE.md for actual implementation instructions
const implementationInstructions = `
## To implement real HERA database sync:

1. Replace mock functions with actual HERA API calls:

async function createEntity(data) {
  const response = await fetch('/api/v1/entities', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return response.json()
}

async function createDynamicData(data) {
  const response = await fetch('/api/v1/dynamic-data', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  return response.json()
}

2. Add authentication headers as needed
3. Add error handling and retry logic
4. Implement actual organization creation
5. Add navigation relationship creation

The mock implementation shows the structure and flow.
`

console.log(implementationInstructions)

// Run the sync
if (require.main === module) {
  syncDocumentationToHera().catch(error => {
    console.error('Sync failed:', error)
    process.exit(1)
  })
}

module.exports = { syncDocumentationToHera }