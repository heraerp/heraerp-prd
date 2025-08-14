#!/usr/bin/env node

/**
 * HERA Relationship-Based Documentation Sync
 * Uses HERA's universal relationship pattern instead of foreign keys
 */

const fs = require('fs')
const path = require('path')

class RelationshipBasedDocSync {
  constructor() {
    this.apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    this.generatedDocsDir = './generated-docs'
    this.syncLog = []
    this.entityCache = new Map() // Cache for entity lookups
  }

  /**
   * Main sync function using relationship-based architecture
   */
  async sync() {
    console.log('🔄 Starting HERA relationship-based documentation sync...')
    
    try {
      // Step 1: Ensure system client exists
      const systemClient = await this.ensureSystemClient()
      console.log('✅ System client ready:', systemClient.client_name)

      // Step 2: Ensure system organization exists (no direct client reference)
      const systemOrg = await this.ensureSystemOrganization()
      console.log('✅ System organization ready:', systemOrg.organization_name)

      // Step 3: Create client-organization relationship
      await this.createClientOrganizationRelationship(systemClient.id, systemOrg.id)

      // Step 4: Ensure developer documentation organization exists
      const devDocOrg = await this.ensureDevDocOrganization()
      console.log('✅ Developer documentation organization ready:', devDocOrg.organization_name)

      // Step 5: Create organization hierarchy relationship
      await this.createOrganizationHierarchy(systemOrg.id, devDocOrg.id)

      // Step 6: Create client-documentation organization relationship
      await this.createClientOrganizationRelationship(systemClient.id, devDocOrg.id)

      // Step 7: Sync all documentation pages
      await this.syncDocumentationPages(devDocOrg)

      // Step 8: Create entity-organization relationships
      await this.createEntityOrganizationRelationships(devDocOrg.id)

      // Step 9: Create navigation relationships between pages
      await this.createDocumentationNavigation(devDocOrg.id)

      // Step 10: Create audit transaction
      await this.createSyncTransaction(devDocOrg.id)

      console.log('✅ Relationship-based documentation sync completed successfully!')
      this.printSyncSummary()

    } catch (error) {
      console.error('❌ Relationship-based documentation sync failed:', error)
      throw error
    }
  }

  /**
   * Ensure system client exists (no changes needed)
   */
  async ensureSystemClient() {
    try {
      // Check if system client exists
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

      // Create system client
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
   * Ensure system organization exists (NO client_id field)
   */
  async ensureSystemOrganization() {
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

      // Create system organization WITHOUT client_id
      const createResponse = await fetch(`${this.apiBase}/api/v1/organizations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_name: 'HERA System Organization',
          organization_type: 'system',
          // NO client_id field - relationships will handle this
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
   * Ensure developer documentation organization exists (NO foreign keys)
   */
  async ensureDevDocOrganization() {
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

      // Create developer documentation organization WITHOUT foreign keys
      const createResponse = await fetch(`${this.apiBase}/api/v1/organizations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_name: 'HERA Developer Documentation',
          organization_type: 'documentation',
          // NO client_id or parent organization - relationships will handle this
          status: 'active',
          settings: {
            doc_type: 'developer',
            access_level: 'internal',
            theme: 'technical',
            auto_generated: true,
            system: 'auto-documentation',
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
   * Create client-organization relationship
   */
  async createClientOrganizationRelationship(clientId, organizationId) {
    try {
      console.log('🔗 Creating client-organization relationship...')

      const response = await fetch(`${this.apiBase}/api/v1/relationships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          source_entity_id: clientId,
          target_entity_id: organizationId,
          relationship_type: 'client_organization',
          relationship_strength: 1.0,
          relationship_data: {
            relationship: 'owns',
            access_level: 'system'
          },
          is_bidirectional: false,
          hierarchy_level: 0,
          workflow_state: 'active'
        })
      })

      if (response.ok) {
        console.log('✅ Client-organization relationship created')
      } else {
        console.warn('⚠️  Client-organization relationship may already exist')
      }
    } catch (error) {
      console.error('Error creating client-organization relationship:', error)
    }
  }

  /**
   * Create organization hierarchy relationship
   */
  async createOrganizationHierarchy(parentOrgId, childOrgId) {
    try {
      console.log('🔗 Creating organization hierarchy relationship...')

      const response = await fetch(`${this.apiBase}/api/v1/relationships`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: parentOrgId,
          source_entity_id: parentOrgId,
          target_entity_id: childOrgId,
          relationship_type: 'organization_parent',
          relationship_strength: 1.0,
          relationship_data: {
            relationship: 'parent',
            hierarchy: 'system->documentation'
          },
          is_bidirectional: false,
          hierarchy_level: 1,
          workflow_state: 'active'
        })
      })

      if (response.ok) {
        console.log('✅ Organization hierarchy relationship created')
      } else {
        console.warn('⚠️  Organization hierarchy relationship may already exist')
      }
    } catch (error) {
      console.error('Error creating organization hierarchy:', error)
    }
  }

  /**
   * Create entity-organization relationships for all documentation pages
   */
  async createEntityOrganizationRelationships(organizationId) {
    console.log('🔗 Creating entity-organization relationships...')

    try {
      // Get all documentation pages in this organization
      const pagesResponse = await fetch(`${this.apiBase}/api/v1/entities/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: 'doc_page',
          filters: {
            organization_id: organizationId
          }
        })
      })

      if (!pagesResponse.ok) {
        console.warn('⚠️  Could not fetch pages for entity-organization relationships')
        return
      }

      const pagesData = await pagesResponse.json()
      const pages = pagesData.entities || []

      for (const page of pages) {
        await this.createRelationship({
          organization_id: organizationId,
          source_entity_id: page.id,
          target_entity_id: organizationId,
          relationship_type: 'entity_organization',
          relationship_data: {
            entity_type: page.entity_type,
            section: page.metadata?.section,
            doc_type: page.metadata?.doc_type
          }
        })
      }

      console.log(`✅ Created entity-organization relationships for ${pages.length} pages`)
    } catch (error) {
      console.error('Error creating entity-organization relationships:', error)
    }
  }

  /**
   * Create documentation navigation relationships
   */
  async createDocumentationNavigation(organizationId) {
    console.log('🗺️  Creating documentation navigation relationships...')

    const navigationPairs = [
      ['auto-documentation-system', 'api-docs-search', 1],
      ['api-docs-search', 'component-doc-layout', 2], // If this page exists
      ['component-doc-layout', 'feature-git-hooks-automation', 3] // If this page exists
    ]

    for (const [sourceCode, targetCode, order] of navigationPairs) {
      try {
        // Find source and target entities
        const sourceEntity = await this.findEntityByCode(sourceCode, organizationId)
        const targetEntity = await this.findEntityByCode(targetCode, organizationId)

        if (!sourceEntity || !targetEntity) {
          console.warn(`⚠️  Skipping navigation relationship: ${sourceCode} -> ${targetCode} (entities not found)`)
          continue
        }

        await this.createRelationship({
          organization_id: organizationId,
          source_entity_id: sourceEntity.id,
          target_entity_id: targetEntity.id,
          relationship_type: 'navigation_next',
          relationship_data: {
            nav_order: order,
            section_order: order,
            relationship_type: 'sequential'
          }
        })

        console.log(`✅ Created navigation: ${sourceCode} -> ${targetCode}`)
      } catch (error) {
        console.error(`Error creating navigation relationship: ${sourceCode} -> ${targetCode}`, error)
      }
    }
  }

  /**
   * Generic relationship creation method
   */
  async createRelationship(relationshipData) {
    const response = await fetch(`${this.apiBase}/api/v1/relationships`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        relationship_strength: 1.0,
        is_bidirectional: false,
        hierarchy_level: 0,
        workflow_state: 'active',
        ...relationshipData
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to create relationship: ${response.statusText}`)
    }

    return await response.json()
  }

  /**
   * Find entity by code (with caching)
   */
  async findEntityByCode(entityCode, organizationId) {
    const cacheKey = `${entityCode}-${organizationId}`
    
    if (this.entityCache.has(cacheKey)) {
      return this.entityCache.get(cacheKey)
    }

    try {
      const response = await fetch(`${this.apiBase}/api/v1/entities/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: 'doc_page',
          filters: {
            entity_code: entityCode,
            organization_id: organizationId
          }
        })
      })

      if (!response.ok) return null

      const data = await response.json()
      const entity = data.entities && data.entities.length > 0 ? data.entities[0] : null
      
      this.entityCache.set(cacheKey, entity)
      return entity
    } catch (error) {
      console.error('Error finding entity by code:', error)
      return null
    }
  }

  /**
   * Sync documentation pages (reuse existing method)
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
      }
      // Add more pages as needed...
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
   * Sync individual documentation page (reuse existing method with relationship emphasis)
   */
  async syncDocumentationPage(pageConfig, devDocOrg) {
    console.log(`📄 Syncing: ${pageConfig.entity_name}`)

    // Check if page already exists
    const existingPage = await this.findEntityByCode(pageConfig.entity_code, devDocOrg.id)
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
          order: pageConfig.order,
          relationship_based: true
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
    await this.createDynamicData(entity.id, devDocOrg.id, 'content', content, 'Auto-generated comprehensive documentation with relationship architecture')

    // Add description if available
    if (description) {
      await this.createDynamicData(entity.id, devDocOrg.id, 'description', description, 'AI-enhanced description for relationship-based documentation')
    }

    console.log(`✅ Synced: ${pageConfig.entity_name}`)
    return entity
  }

  /**
   * Create dynamic data field (reuse existing method)
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
   * Create sync transaction with relationship emphasis
   */
  async createSyncTransaction(organizationId) {
    console.log('📊 Creating relationship-based sync transaction...')

    try {
      const response = await fetch(`${this.apiBase}/api/v1/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organization_id: organizationId,
          transaction_type: 'documentation_sync',
          transaction_number: `DOC-REL-SYNC-${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}`,
          transaction_date: new Date().toISOString().split('T')[0],
          reference_number: 'AUTO-DOC-RELATIONSHIP-SYNC',
          total_amount: 0.00,
          currency: 'USD',
          status: 'completed',
          workflow_state: 'active',
          metadata: {
            sync_type: 'relationship_based_setup',
            pages_created: this.syncLog.filter(log => log.action === 'created').length,
            relationships_created: 5, // Approximate count
            sections: ['Systems', 'API Reference'],
            automated: true,
            source: 'auto-documentation-system',
            documentation_type: 'developer',
            architecture: 'relationship_based'
          },
          ai_insights: {
            confidence: 1.0,
            classification: 'system_documentation_sync',
            insights: 'Successfully created relationship-based developer documentation structure using HERA universal patterns'
          }
        })
      })

      if (response.ok) {
        console.log('✅ Relationship-based sync transaction created successfully')
      } else {
        console.warn('⚠️  Failed to create sync transaction')
      }
    } catch (error) {
      console.error('Error creating sync transaction:', error)
    }
  }

  /**
   * Extract description from content (reuse existing method)
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
   * Print sync summary with relationship emphasis
   */
  printSyncSummary() {
    console.log('\n📊 Relationship-Based HERA Sync Summary:')
    console.log('=======================================')
    
    const created = this.syncLog.filter(log => log.action === 'created').length
    const failed = this.syncLog.filter(log => log.action === 'failed').length

    console.log(`✅ Created: ${created} pages`)
    console.log(`🔗 Created: ~5 relationships`)
    if (failed > 0) {
      console.log(`❌ Failed: ${failed} pages`)
    }
    console.log(`📚 Total operations: ${this.syncLog.length}`)
    console.log(`🏗️  Architecture: Relationship-based (no foreign keys)`)
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
  const syncer = new RelationshipBasedDocSync()
  syncer.sync().catch(error => {
    console.error('Relationship-based HERA sync failed:', error)
    process.exit(1)
  })
}

module.exports = RelationshipBasedDocSync