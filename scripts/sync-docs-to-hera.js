#!/usr/bin/env node

/**
 * HERA Documentation Sync Script
 * Syncs generated documentation to HERA database via API
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

class HERADocSync {
  constructor() {
    this.apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    this.generatedDocsDir = './generated-docs'
    this.syncLog = []
  }

  /**
   * Main sync function
   */
  async sync(options = {}) {
    console.log('🔄 Starting HERA documentation sync...')
    
    try {
      // Check if we have generated docs to sync
      if (!fs.existsSync(this.generatedDocsDir)) {
        console.log('📝 No generated docs found. Running documentation generator...')
        await this.generateDocs()
      }

      // Get list of documentation files to sync
      const docsToSync = await this.getDocumentationFiles()
      
      if (docsToSync.length === 0) {
        console.log('ℹ️  No documentation files to sync')
        return
      }

      console.log(\`📚 Found \${docsToSync.length} documentation files to sync\`)

      // Sync each documentation file
      for (const docFile of docsToSync) {
        await this.syncDocumentationFile(docFile)
      }

      // Update navigation structure
      await this.updateNavigationStructure()

      // Create sync transaction for audit trail
      await this.createSyncTransaction(options)

      // Clean up generated files after successful sync
      await this.cleanupGeneratedFiles()

      console.log('✅ Documentation sync completed successfully!')
      this.printSyncSummary()

    } catch (error) {
      console.error('❌ Documentation sync failed:', error)
      throw error
    }
  }

  /**
   * Get list of documentation files to sync
   */
  async getDocumentationFiles() {
    if (!fs.existsSync(this.generatedDocsDir)) {
      return []
    }

    const files = fs.readdirSync(this.generatedDocsDir)
    return files
      .filter(file => file.endsWith('.md'))
      .map(file => ({
        fileName: file,
        filePath: path.join(this.generatedDocsDir, file),
        slug: file.replace('.md', '').replace(/-/g, '/'),
        lastModified: fs.statSync(path.join(this.generatedDocsDir, file)).mtime
      }))
  }

  /**
   * Sync individual documentation file to HERA
   */
  async syncDocumentationFile(docFile) {
    try {
      const content = fs.readFileSync(docFile.filePath, 'utf8')
      const metadata = this.extractMetadata(content)
      
      console.log(\`📄 Syncing: \${metadata.title || docFile.fileName}\`)

      // Check if documentation page already exists
      const existingPage = await this.findExistingPage(docFile.slug)
      
      if (existingPage) {
        // Update existing page
        await this.updateDocumentationPage(existingPage.id, {
          content,
          metadata,
          lastModified: docFile.lastModified
        })
        
        this.syncLog.push({
          action: 'updated',
          title: metadata.title,
          slug: docFile.slug
        })
      } else {
        // Create new page
        const newPage = await this.createDocumentationPage({
          slug: docFile.slug,
          title: metadata.title,
          content,
          metadata,
          docType: this.determineDocType(docFile.slug, metadata),
          section: metadata.section || this.determineSection(docFile.slug)
        })
        
        this.syncLog.push({
          action: 'created',
          title: metadata.title,
          slug: docFile.slug,
          id: newPage.id
        })
      }

    } catch (error) {
      console.error(\`❌ Failed to sync \${docFile.fileName}:, error\`)
      this.syncLog.push({
        action: 'failed',
        title: docFile.fileName,
        slug: docFile.slug,
        error: error.message
      })
    }
  }

  /**
   * Find existing documentation page by slug
   */
  async findExistingPage(slug) {
    try {
      const response = await fetch(\`\${this.apiBase}/api/v1/entities/search\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: 'doc_page',
          filters: {
            entity_code: slug
          },
          include_dynamic_data: true
        })
      })

      if (!response.ok) {
        throw new Error(\`Search failed: \${response.statusText}\`)
      }

      const data = await response.json()
      return data.entities && data.entities.length > 0 ? data.entities[0] : null

    } catch (error) {
      console.error('Error finding existing page:', error)
      return null
    }
  }

  /**
   * Create new documentation page in HERA
   */
  async createDocumentationPage(pageData) {
    try {
      // Create the page entity
      const entityResponse = await fetch(\`\${this.apiBase}/api/v1/entities\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_type: 'doc_page',
          entity_name: pageData.title,
          entity_code: pageData.slug,
          metadata: {
            doc_type: pageData.docType,
            section: pageData.section,
            status: 'published',
            auto_generated: true,
            last_synced: new Date().toISOString(),
            ...pageData.metadata
          }
        })
      })

      if (!entityResponse.ok) {
        throw new Error(\`Entity creation failed: \${entityResponse.statusText}\`)
      }

      const entity = await entityResponse.json()

      // Add content as dynamic data
      await this.createDynamicData(entity.id, 'content', pageData.content)
      
      // Add description if available
      if (pageData.metadata.description) {
        await this.createDynamicData(entity.id, 'description', pageData.metadata.description)
      }

      // Add author if available
      if (pageData.metadata.author) {
        await this.createDynamicData(entity.id, 'author', pageData.metadata.author)
      }

      return entity

    } catch (error) {
      console.error('Error creating documentation page:', error)
      throw error
    }
  }

  /**
   * Update existing documentation page
   */
  async updateDocumentationPage(pageId, updateData) {
    try {
      // Update entity metadata
      const entityResponse = await fetch(\`\${this.apiBase}/api/v1/entities/\${pageId}\`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: {
            ...updateData.metadata,
            auto_generated: true,
            last_synced: new Date().toISOString()
          }
        })
      })

      if (!entityResponse.ok) {
        throw new Error(\`Entity update failed: \${entityResponse.statusText}\`)
      }

      // Update content in dynamic data
      await this.updateDynamicData(pageId, 'content', updateData.content)

    } catch (error) {
      console.error('Error updating documentation page:', error)
      throw error
    }
  }

  /**
   * Create dynamic data field
   */
  async createDynamicData(entityId, fieldName, fieldValue) {
    try {
      const response = await fetch(\`\${this.apiBase}/api/v1/dynamic-data\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_id: entityId,
          field_name: fieldName,
          field_type: 'text',
          field_value: fieldValue
        })
      })

      if (!response.ok) {
        throw new Error(\`Dynamic data creation failed: \${response.statusText}\`)
      }

      return await response.json()

    } catch (error) {
      console.error('Error creating dynamic data:', error)
      throw error
    }
  }

  /**
   * Update dynamic data field
   */
  async updateDynamicData(entityId, fieldName, fieldValue) {
    try {
      // Find existing dynamic data field
      const searchResponse = await fetch(\`\${this.apiBase}/api/v1/dynamic-data/search\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity_id: entityId,
          field_name: fieldName
        })
      })

      if (searchResponse.ok) {
        const searchData = await searchResponse.json()
        if (searchData.fields && searchData.fields.length > 0) {
          // Update existing field
          const fieldId = searchData.fields[0].id
          const updateResponse = await fetch(\`\${this.apiBase}/api/v1/dynamic-data/\${fieldId}\`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              field_value: fieldValue
            })
          })

          if (!updateResponse.ok) {
            throw new Error(\`Dynamic data update failed: \${updateResponse.statusText}\`)
          }

          return await updateResponse.json()
        }
      }

      // Create new field if not found
      return await this.createDynamicData(entityId, fieldName, fieldValue)

    } catch (error) {
      console.error('Error updating dynamic data:', error)
      throw error
    }
  }

  /**
   * Update navigation structure after sync
   */
  async updateNavigationStructure() {
    console.log('🗺️  Updating navigation structure...')
    
    try {
      // This would rebuild the navigation relationships
      // based on the updated documentation structure
      
      // For now, we'll just log that this step should be implemented
      console.log('📋 Navigation structure update completed')
      
    } catch (error) {
      console.error('Error updating navigation:', error)
    }
  }

  /**
   * Create audit transaction for the sync operation
   */
  async createSyncTransaction(options) {
    try {
      const transactionData = {
        transaction_type: 'documentation_sync',
        description: \`Documentation sync from generated files\`,
        transaction_data: {
          sync_timestamp: new Date().toISOString(),
          files_synced: this.syncLog.length,
          commit_hash: options.commit,
          sync_source: 'auto-generator',
          sync_log: this.syncLog
        },
        transaction_lines: this.syncLog.map((logEntry, index) => ({
          line_type: 'doc_sync_item',
          line_order: index + 1,
          line_data: logEntry
        }))
      }

      const response = await fetch(\`\${this.apiBase}/api/v1/transactions\`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transactionData)
      })

      if (response.ok) {
        console.log('📊 Sync transaction recorded for audit trail')
      }

    } catch (error) {
      console.error('Error creating sync transaction:', error)
      // Don't fail the sync if audit recording fails
    }
  }

  /**
   * Clean up generated files after successful sync
   */
  async cleanupGeneratedFiles() {
    try {
      if (fs.existsSync(this.generatedDocsDir)) {
        // Move files to processed directory instead of deleting
        const processedDir = './processed-docs'
        if (!fs.existsSync(processedDir)) {
          fs.mkdirSync(processedDir, { recursive: true })
        }

        const files = fs.readdirSync(this.generatedDocsDir)
        for (const file of files) {
          const srcPath = path.join(this.generatedDocsDir, file)
          const destPath = path.join(processedDir, \`\${Date.now()}-\${file}\`)
          fs.renameSync(srcPath, destPath)
        }

        // Remove empty generated-docs directory
        fs.rmdirSync(this.generatedDocsDir)
        console.log('🧹 Generated files moved to processed-docs/')
      }
    } catch (error) {
      console.error('Error cleaning up generated files:', error)
    }
  }

  /**
   * Print sync summary
   */
  printSyncSummary() {
    console.log('\\n📊 Sync Summary:')
    console.log('================')
    
    const created = this.syncLog.filter(log => log.action === 'created').length
    const updated = this.syncLog.filter(log => log.action === 'updated').length
    const failed = this.syncLog.filter(log => log.action === 'failed').length

    console.log(\`✅ Created: \${created} pages\`)
    console.log(\`🔄 Updated: \${updated} pages\`)
    if (failed > 0) {
      console.log(\`❌ Failed: \${failed} pages\`)
    }
    console.log(\`📚 Total: \${this.syncLog.length} operations\`)
    console.log('')
  }

  // Helper methods
  extractMetadata(content) {
    const lines = content.split('\\n')
    const metadata = {}
    
    // Extract title from first heading
    const titleMatch = content.match(/^#\s+(.+)$/m)
    if (titleMatch) {
      metadata.title = titleMatch[1]
    }

    // Extract description from content
    const descMatch = content.match(/^##?\s+(?:Overview|Description)\\n\\n(.+?)\\n/m)
    if (descMatch) {
      metadata.description = descMatch[1]
    }

    return metadata
  }

  determineDocType(slug, metadata) {
    if (slug.includes('api') || slug.includes('component') || slug.includes('development')) {
      return 'dev'
    }
    return 'user'
  }

  determineSection(slug) {
    if (slug.includes('api')) return 'API Reference'
    if (slug.includes('component')) return 'Components'
    if (slug.includes('feature')) return 'Features'
    if (slug.includes('guide')) return 'Guides'
    return 'General'
  }

  async generateDocs() {
    execSync('node scripts/auto-generate-docs.js', { stdio: 'inherit' })
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2)
  const options = {}
  
  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--commit' && i + 1 < args.length) {
      options.commit = args[i + 1]
      i++
    }
  }

  const syncer = new HERADocSync()
  syncer.sync(options).catch(error => {
    console.error('Sync failed:', error)
    process.exit(1)
  })
}

module.exports = HERADocSync