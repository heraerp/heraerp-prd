#!/usr/bin/env node

/**
 * Real HERA Documentation Sync Script
 * Syncs documentation to actual HERA database using real API endpoints
 */

const fs = require('fs')
const path = require('path')

class RealHERADocSync {
  constructor() {
    this.apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    this.generatedDocsDir = './generated-docs'
    this.syncLog = []
  }

  /**
   * Main sync function using real HERA APIs
   */
  async sync() {
    console.log('🔄 Starting REAL HERA documentation sync...')
    
    try {
      // Step 1: Ensure system client exists
      const systemClient = await this.ensureSystemClient()
      console.log('✅ System client ready:', systemClient.client_name)

      // Step 2: Ensure system organization exists
      const systemOrg = await this.ensureSystemOrganization(systemClient.id)
      console.log('✅ System organization ready:', systemOrg.organization_name)

      // Step 3: Ensure developer documentation organization exists
      const devDocOrg = await this.ensureDevDocOrganization(systemClient.id, systemOrg.id)
      console.log('✅ Developer documentation organization ready:', devDocOrg.organization_name)

      // Step 4: Sync all documentation pages
      await this.syncDocumentationPages(devDocOrg)

      // Step 5: Create navigation relationships
      await this.createNavigationRelationships(devDocOrg.id)

      // Step 6: Create audit transaction
      await this.createSyncTransaction(devDocOrg.id)

      console.log('✅ Real HERA documentation sync completed successfully!')
      this.printSyncSummary()

    } catch (error) {
      console.error('❌ Real HERA documentation sync failed:', error)
      throw error
    }
  }

  /**
   * Ensure system client exists
   */
  async ensureSystemClient() {
    try {
      // First check if system client exists
      const searchResponse = await fetch(`${this.apiBase}/api/v1/clients/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: {
            client_name: 'HERA System Client'
          }
        })
      })

      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        if (searchData.clients && searchData.clients.length > 0) {
          return searchData.clients[0]
        }
      }

      // Create system client if it doesn't exist
      const createResponse = await fetch(`${this.apiBase}/api/v1/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_name: 'HERA System Client',
          client_code: 'HERA-SYSTEM',
          client_type: 'system',
          status: 'active',
          client_settings: {
            system_client: true,
            access_level: 'system',
            auto_generated: true
          },
          ai_insights: {
            classification: 'system_client',
            confidence: 1.0
          },
          ai_classification: 'system_client',
          ai_confidence: 1.0
        })
      })

      if (!createResponse.ok) {
        throw new Error(`Failed to create system client: ${createResponse.statusText}`)
      }

      return await createResponse.json()
    } catch (error) {
      console.error('Error ensuring system client:', error)
      throw error
    }
  }

  /**
   * Ensure system organization exists
   */
  async ensureSystemOrganization(clientId) {
    try {
      // Check if system organization exists
      const searchResponse = await fetch(`${this.apiBase}/api/v1/organizations/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: {
            organization_name: 'HERA System Organization'
          }
        })
      })

      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        if (searchData.organizations && searchData.organizations.length > 0) {
          return searchData.organizations[0]
        }
      }

      // Create system organization
      const createResponse = await fetch(`${this.apiBase}/api/v1/organizations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_name: 'HERA System Organization',
          organization_type: 'system',
          client_id: clientId,
          status: 'active',
          settings: {
            doc_type: 'system',
            access_level: 'internal',
            system: true,
            client_name: 'HERA System Client'
          },
          ai_insights: {
            classification: 'system_organization',
            confidence: 1.0
          },
          ai_classification: 'system_organization',
          ai_confidence: 1.0
        })
      })

      if (!createResponse.ok) {
        throw new Error(`Failed to create system organization: ${createResponse.statusText}`)
      }

      return await createResponse.json()
    } catch (error) {
      console.error('Error ensuring system organization:', error)
      throw error
    }
  }

  /**
   * Ensure developer documentation organization exists
   */
  async ensureDevDocOrganization(clientId, systemOrgId) {
    try {
      // Check if developer documentation organization exists
      const searchResponse = await fetch(`${this.apiBase}/api/v1/organizations/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: {
            organization_name: 'HERA Developer Documentation'
          }
        })
      })

      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        if (searchData.organizations && searchData.organizations.length > 0) {
          return searchData.organizations[0]
        }
      }

      // Create developer documentation organization
      const createResponse = await fetch(`${this.apiBase}/api/v1/organizations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_name: 'HERA Developer Documentation',
          organization_code: systemOrgId,
          organization_type: 'documentation',
          client_id: clientId,
          status: 'active',
          settings: {
            doc_type: 'developer',
            access_level: 'internal',
            theme: 'technical',
            auto_generated: true,
            system: 'auto-documentation',
            parent_org: systemOrgId,
            client_name: 'HERA System Client'
          },
          ai_insights: {
            classification: 'documentation_organization',
            confidence: 1.0
          },
          ai_classification: 'documentation_organization',
          ai_confidence: 1.0
        })
      })

      if (!createResponse.ok) {
        throw new Error(`Failed to create developer documentation organization: ${createResponse.statusText}`)
      }

      return await createResponse.json()
    } catch (error) {
      console.error('Error ensuring developer documentation organization:', error)
      throw error
    }
  }

  /**
   * Sync all documentation pages
   */
  async syncDocumentationPages(devDocOrg) {
    const documentationPages = [
      {
        entity_code: 'auto-documentation-system',
        entity_name: 'Auto-Documentation System',
        section: 'Systems',
        order: 1,
        file: 'auto-documentation-system.md',
        classification: 'system_documentation'
      },
      {
        entity_code: 'api-docs-search',
        entity_name: 'Documentation Search API',
        section: 'API Reference',
        order: 2,
        file: 'api-docs-search.md',
        classification: 'api_documentation'
      },
      {
        entity_code: 'component-doc-layout',
        entity_name: 'DocLayout Component',
        section: 'Components',
        order: 3,
        file: 'component-doc-layout.md',
        classification: 'component_documentation'
      },
      {
        entity_code: 'feature-git-hooks-automation',
        entity_name: 'Git Hooks Automation',
        section: 'Features',
        order: 4,
        file: 'feature-git-hooks-automation.md',
        classification: 'feature_documentation'
      }
    ]

    for (const pageConfig of documentationPages) {
      try {
        await this.syncDocumentationPage(pageConfig, devDocOrg)
        this.syncLog.push({
          action: 'created',
          title: pageConfig.entity_name,
          code: pageConfig.entity_code
        })
      } catch (error) {
        console.error(`Failed to sync ${pageConfig.entity_name}:`, error)
        this.syncLog.push({
          action: 'failed',
          title: pageConfig.entity_name,
          code: pageConfig.entity_code,
          error: error.message
        })
      }
    }
  }

  /**
   * Sync individual documentation page
   */
  async syncDocumentationPage(pageConfig, devDocOrg) {
    console.log(`📄 Syncing: ${pageConfig.entity_name}`)

    // Check if page already exists
    const existingPage = await this.findExistingPage(pageConfig.entity_code, devDocOrg.id)
    if (existingPage) {
      console.log(`⏭️  Page already exists: ${pageConfig.entity_name}`)
      return existingPage
    }

    // Read content from file
    const filePath = path.join(this.generatedDocsDir, pageConfig.file)
    if (!fs.existsSync(filePath)) {
      throw new Error(`Documentation file not found: ${filePath}`)
    }

    const content = fs.readFileSync(filePath, 'utf8')
    const description = this.extractDescription(content)

    // Create documentation page entity
    const entityResponse = await fetch(`${this.apiBase}/api/v1/entities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entity_type: 'doc_page',
        entity_name: pageConfig.entity_name,
        entity_code: pageConfig.entity_code,
        organization_id: devDocOrg.id,
        status: 'active',
        metadata: {
          doc_type: 'dev',
          section: pageConfig.section,
          status: 'published',
          auto_generated: true,
          priority: 'high',
          order: pageConfig.order
        },
        ai_confidence: 1.0,
        ai_classification: pageConfig.classification
      })
    })

    if (!entityResponse.ok) {
      throw new Error(`Failed to create entity: ${entityResponse.statusText}`)
    }

    const entity = await entityResponse.json()

    // Add content as dynamic data
    await this.createDynamicData(entity.id, devDocOrg.id, 'content', content, 'Auto-generated comprehensive documentation')

    // Add description if available
    if (description) {
      await this.createDynamicData(entity.id, devDocOrg.id, 'description', description, 'AI-enhanced description')
    }

    console.log(`✅ Synced: ${pageConfig.entity_name}`)
    return entity
  }

  /**
   * Find existing documentation page
   */
  async findExistingPage(entityCode, organizationId) {
    try {
      const response = await fetch(`${this.apiBase}/api/v1/entities/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: 'doc_page',
          filters: {
            entity_code: entityCode,
            organization_id: organizationId
          },
          include_dynamic_data: true
        })
      })

      if (!response.ok) return null

      const data = await response.json()
      return data.entities && data.entities.length > 0 ? data.entities[0] : null
    } catch (error) {
      console.error('Error finding existing page:', error)
      return null
    }
  }

  /**
   * Create dynamic data field
   */
  async createDynamicData(entityId, organizationId, fieldName, fieldValue, aiEnhancedValue) {
    const response = await fetch(`${this.apiBase}/api/v1/dynamic-data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organization_id: organizationId,
        entity_id: entityId,
        field_name: fieldName,
        field_type: 'text',
        field_value: fieldValue,
        ai_enhanced_value: aiEnhancedValue || fieldValue,
        ai_confidence: 0.95,
        validation_status: 'valid'
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to create dynamic data: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Create navigation relationships
   */
  async createNavigationRelationships(organizationId) {
    console.log('🗺️  Creating navigation relationships...')

    const navigationPairs = [
      ['auto-documentation-system', 'api-docs-search', 1],
      ['api-docs-search', 'component-doc-layout', 2],
      ['component-doc-layout', 'feature-git-hooks-automation', 3]
    ]

    for (const [sourceCode, targetCode, order] of navigationPairs) {
      try {
        // Find source and target entities
        const sourceEntity = await this.findExistingPage(sourceCode, organizationId)
        const targetEntity = await this.findExistingPage(targetCode, organizationId)

        if (!sourceEntity || !targetEntity) {
          console.warn(`⚠️  Skipping navigation relationship: ${sourceCode} -> ${targetCode}`)
          continue
        }

        // Create relationship
        const response = await fetch(`${this.apiBase}/api/v1/relationships`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            organization_id: organizationId,
            source_entity_id: sourceEntity.id,
            target_entity_id: targetEntity.id,
            relationship_type: 'navigation_next',
            relationship_strength: 1.0,
            relationship_data: {
              nav_order: order,
              section_order: order
            },
            is_bidirectional: false,
            hierarchy_level: 0,
            workflow_state: 'active'
          })
        })

        if (response.ok) {
          console.log(`✅ Created navigation: ${sourceCode} -> ${targetCode}`)
        } else {
          console.warn(`⚠️  Failed to create navigation: ${sourceCode} -> ${targetCode}`)
        }
      } catch (error) {
        console.error(`Error creating navigation relationship: ${sourceCode} -> ${targetCode}`, error)
      }
    }
  }

  /**
   * Create sync transaction for audit trail
   */
  async createSyncTransaction(organizationId) {
    console.log('📊 Creating sync transaction for audit trail...')

    try {
      const response = await fetch(`${this.apiBase}/api/v1/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          transaction_type: 'documentation_sync',
          transaction_number: `DOC-SYNC-${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}`,
          transaction_date: new Date().toISOString().split('T')[0],
          reference_number: 'AUTO-DOC-INITIAL-SYNC',
          total_amount: 0.00,
          currency: 'USD',
          status: 'completed',
          workflow_state: 'active',
          metadata: {
            sync_type: 'initial_setup',
            pages_created: this.syncLog.filter(log => log.action === 'created').length,
            sections: ['Systems', 'API Reference', 'Components', 'Features'],
            automated: true,
            source: 'auto-documentation-system',
            documentation_type: 'developer'
          },
          ai_insights: {
            confidence: 1.0,
            classification: 'system_documentation_sync',
            insights: 'Successfully created comprehensive developer documentation structure'
          }
        })
      })

      if (response.ok) {
        console.log('✅ Sync transaction created successfully')
      } else {
        console.warn('⚠️  Failed to create sync transaction')
      }
    } catch (error) {
      console.error('Error creating sync transaction:', error)
    }
  }

  /**
   * Extract description from content
   */
  extractDescription(content) {
    const overviewMatch = content.match(/## Overview\s*\n\s*(.*?)(?=\n##|\n\n##|$)/s)
    if (overviewMatch) {
      return overviewMatch[1].trim().split('\n')[0]
    }
    
    const firstParagraph = content.match(/^[^#\n].*$/m)
    return firstParagraph ? firstParagraph[0] : null
  }

  /**
   * Print sync summary
   */
  printSyncSummary() {
    console.log('\n📊 Real HERA Sync Summary:')
    console.log('==========================')
    
    const created = this.syncLog.filter(log => log.action === 'created').length
    const failed = this.syncLog.filter(log => log.action === 'failed').length

    console.log(`✅ Created: ${created} pages`)
    if (failed > 0) {
      console.log(`❌ Failed: ${failed} pages`)
    }
    console.log(`📚 Total operations: ${this.syncLog.length}`)
    console.log('')

    if (created > 0) {
      console.log('🌐 Documentation now available at:')
      this.syncLog.filter(log => log.action === 'created').forEach(log => {
        console.log(`  • /docs/dev/${log.code}`)
      })
    }
  }
}

// CLI usage
if (require.main === module) {
  const syncer = new RealHERADocSync()
  syncer.sync().catch(error => {
    console.error('Real HERA sync failed:', error)
    process.exit(1)
  })
}

module.exports = RealHERADocSync