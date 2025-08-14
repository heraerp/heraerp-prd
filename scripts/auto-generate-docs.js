#!/usr/bin/env node

/**
 * HERA Auto-Documentation Generator
 * Automatically generates and updates documentation based on code changes
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// Configuration
const CONFIG = {
  srcDir: './src',
  docsDir: './docs',
  apiDir: './src/app/api',
  componentsDir: './src/components',
  pagesDir: './src/app',
  outputFile: './scripts/generated-docs.json',
  templateDir: './scripts/doc-templates'
}

class AutoDocGenerator {
  constructor() {
    this.changes = {
      newFiles: [],
      modifiedFiles: [],
      deletedFiles: [],
      newFeatures: [],
      apiChanges: [],
      componentChanges: []
    }
    this.generatedDocs = []
  }

  /**
   * Main execution function
   */
  async run() {
    console.log('🚀 Starting HERA Auto-Documentation Generation...')
    
    try {
      // Detect changes since last run
      await this.detectChanges()
      
      // Analyze code for new features
      await this.analyzeCodeChanges()
      
      // Generate documentation content
      await this.generateDocumentationContent()
      
      // Update HERA documentation entities
      await this.updateHeraDocumentation()
      
      // Create changelog entries
      await this.generateChangelog()
      
      console.log('✅ Auto-documentation generation complete!')
      console.log(`📝 Generated ${this.generatedDocs.length} documentation updates`)
      
    } catch (error) {
      console.error('❌ Error in auto-documentation:', error)
      process.exit(1)
    }
  }

  /**
   * Detect file changes using git
   */
  async detectChanges() {
    console.log('🔍 Detecting changes...')
    
    try {
      // Get git status
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' })
      const lines = gitStatus.trim().split('\\n').filter(line => line.trim())
      
      for (const line of lines) {
        const status = line.substring(0, 2)
        const filePath = line.substring(3)
        
        if (status.includes('A') || status.includes('??')) {
          this.changes.newFiles.push(filePath)
        } else if (status.includes('M')) {
          this.changes.modifiedFiles.push(filePath)
        } else if (status.includes('D')) {
          this.changes.deletedFiles.push(filePath)
        }
      }
      
      // Also check recent commits for context
      try {
        const recentCommits = execSync('git log --oneline -10', { encoding: 'utf8' })
        console.log('📋 Recent commits context:', recentCommits.split('\\n')[0])
      } catch (e) {
        // Ignore if no git history
      }
      
      console.log(`📊 Changes detected: \${this.changes.newFiles.length} new, \${this.changes.modifiedFiles.length} modified, \${this.changes.deletedFiles.length} deleted`)
      
    } catch (error) {
      console.log('⚠️  No git repository found, analyzing all files...')
      // Fallback to analyzing all files
      await this.analyzeAllFiles()
    }
  }

  /**
   * Analyze code changes for documentation needs
   */
  async analyzeCodeChanges() {
    console.log('🔬 Analyzing code changes...')
    
    const allChangedFiles = [...this.changes.newFiles, ...this.changes.modifiedFiles]
    
    for (const filePath of allChangedFiles) {
      if (!fs.existsSync(filePath)) continue
      
      const content = fs.readFileSync(filePath, 'utf8')
      const analysis = this.analyzeFile(filePath, content)
      
      if (analysis.isApiRoute) {
        this.changes.apiChanges.push(analysis)
      }
      
      if (analysis.isComponent) {
        this.changes.componentChanges.push(analysis)
      }
      
      if (analysis.isNewFeature) {
        this.changes.newFeatures.push(analysis)
      }
    }
  }

  /**
   * Analyze individual file for documentation needs
   */
  analyzeFile(filePath, content) {
    const analysis = {
      filePath,
      type: this.getFileType(filePath),
      isApiRoute: filePath.includes('/api/') && filePath.endsWith('route.ts'),
      isComponent: filePath.includes('/components/') && (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')),
      isPage: filePath.includes('/app/') && filePath.endsWith('page.tsx'),
      isNewFeature: false,
      exports: [],
      imports: [],
      functions: [],
      components: [],
      types: [],
      description: '',
      examples: []
    }

    // Extract exports
    const exportMatches = content.match(/export\\s+(default\\s+)?(function|const|class|interface|type)\\s+([\\w]+)/g)
    if (exportMatches) {
      analysis.exports = exportMatches.map(match => {
        const parts = match.split(/\\s+/)
        return parts[parts.length - 1]
      })
    }

    // Extract function signatures
    const functionMatches = content.match(/(?:export\\s+)?(?:async\\s+)?function\\s+(\\w+)\\s*\\([^)]*\\)/g)
    if (functionMatches) {
      analysis.functions = functionMatches
    }

    // Extract React components
    if (analysis.isComponent) {
      const componentMatches = content.match(/(?:export\\s+(?:default\\s+)?)?function\\s+(\\w+)\\s*\\([^)]*\\)(?:\\s*:\\s*[^{]+)?\\s*{/g)
      if (componentMatches) {
        analysis.components = componentMatches.map(match => {
          const nameMatch = match.match(/function\\s+(\\w+)/)
          return nameMatch ? nameMatch[1] : 'Unknown'
        })
      }
    }

    // Extract TypeScript interfaces and types
    const typeMatches = content.match(/(?:export\\s+)?(?:interface|type)\\s+(\\w+)/g)
    if (typeMatches) {
      analysis.types = typeMatches.map(match => match.split(/\\s+/).pop())
    }

    // Determine if this is a new feature
    analysis.isNewFeature = this.isNewFeature(filePath, content, analysis)

    // Generate description
    analysis.description = this.generateFileDescription(analysis)

    return analysis
  }

  /**
   * Determine if file represents a new feature
   */
  isNewFeature(filePath, content, analysis) {
    // New API routes are always new features
    if (analysis.isApiRoute && this.changes.newFiles.includes(filePath)) {
      return true
    }

    // New pages are new features
    if (analysis.isPage && this.changes.newFiles.includes(filePath)) {
      return true
    }

    // New major components
    if (analysis.isComponent && this.changes.newFiles.includes(filePath)) {
      const isUtilityComponent = filePath.includes('/ui/') || filePath.includes('/common/')
      return !isUtilityComponent
    }

    // Check for feature keywords in content
    const featureKeywords = ['feature', 'functionality', 'capability', 'service', 'module']
    const hasFeatureKeywords = featureKeywords.some(keyword => 
      content.toLowerCase().includes(keyword)
    )

    return hasFeatureKeywords && this.changes.newFiles.includes(filePath)
  }

  /**
   * Generate documentation content
   */
  async generateDocumentationContent() {
    console.log('📝 Generating documentation content...')

    // Generate API documentation
    for (const apiChange of this.changes.apiChanges) {
      const apiDoc = await this.generateApiDocumentation(apiChange)
      this.generatedDocs.push(apiDoc)
    }

    // Generate component documentation
    for (const componentChange of this.changes.componentChanges) {
      const componentDoc = await this.generateComponentDocumentation(componentChange)
      this.generatedDocs.push(componentDoc)
    }

    // Generate feature documentation
    for (const feature of this.changes.newFeatures) {
      const featureDoc = await this.generateFeatureDocumentation(feature)
      this.generatedDocs.push(featureDoc)
    }

    // Update existing documentation sections
    await this.updateExistingDocumentation()
  }

  /**
   * Generate API endpoint documentation
   */
  async generateApiDocumentation(apiAnalysis) {
    const apiPath = apiAnalysis.filePath.replace('src/app/api', '').replace('/route.ts', '')
    const methodMatch = fs.readFileSync(apiAnalysis.filePath, 'utf8').match(/export\\s+async\\s+function\\s+(GET|POST|PUT|DELETE|PATCH)/g)
    const methods = methodMatch ? methodMatch.map(m => m.split(' ').pop()) : ['GET']

    const docContent = `# \${apiPath.replace(/\\//g, ' ').replace(/^\\s+/, '').replace(/\\w/g, (c, i) => i === 0 ? c.toUpperCase() : c)} API

## Endpoint
\\`\\`\\`
\${methods.map(method => `\${method} /api\${apiPath}`).join('\\n')}
\\`\\`\\`

## Description
${this.generateApiDescription(apiAnalysis)}

## Request
\${this.generateApiRequestDocs(apiAnalysis)}

## Response
\${this.generateApiResponseDocs(apiAnalysis)}

## Example
\${this.generateApiExampleDocs(apiAnalysis)}

## Error Handling
Standard HTTP status codes are returned:
- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 404: Not Found
- 500: Internal Server Error

*Auto-generated on \${new Date().toISOString()}*
`

    return {
      type: 'api',
      docType: 'dev',
      slug: `api\${apiPath.replace(/\\//g, '-')}`,
      title: `\${apiPath.replace(/\\//g, ' ').trim()} API`,
      section: 'API Reference',
      content: docContent,
      order: 100 + this.changes.apiChanges.indexOf(apiAnalysis)
    }
  }

  /**
   * Generate component documentation
   */
  async generateComponentDocumentation(componentAnalysis) {
    const componentName = componentAnalysis.components[0] || path.basename(componentAnalysis.filePath, '.tsx')
    
    const docContent = `# \${componentName} Component

## Overview
\${this.generateComponentDescription(componentAnalysis)}

## Usage
\\`\\`\\`typescript
import { \${componentName} } from '@/components/...'

export function MyPage() {
  return (
    <\${componentName} 
      // props here
    />
  )
}
\\`\\`\\`

## Props
\${this.generateComponentPropsDocs(componentAnalysis)}

## Examples
\${this.generateComponentExamples(componentAnalysis)}

## Styling
This component uses the HERA design system with Tailwind CSS classes.

*Auto-generated on \${new Date().toISOString()}*
`

    return {
      type: 'component',
      docType: 'dev',
      slug: `components/\${componentName.toLowerCase()}`,
      title: `\${componentName} Component`,
      section: 'Components',
      content: docContent,
      order: 200 + this.changes.componentChanges.indexOf(componentAnalysis)
    }
  }

  /**
   * Generate feature documentation
   */
  async generateFeatureDocumentation(featureAnalysis) {
    const featureName = this.extractFeatureName(featureAnalysis)
    
    const docContent = `# \${featureName}

## Overview
\${this.generateFeatureDescription(featureAnalysis)}

## How to Use
\${this.generateFeatureUsageGuide(featureAnalysis)}

## Key Features
\${this.generateFeatureList(featureAnalysis)}

## Examples
\${this.generateFeatureExamples(featureAnalysis)}

## Related
\${this.generateRelatedContent(featureAnalysis)}

*Auto-generated on \${new Date().toISOString()}*
`

    return {
      type: 'feature',
      docType: featureAnalysis.isComponent ? 'dev' : 'user',
      slug: `features/\${featureName.toLowerCase().replace(/\\s+/g, '-')}`,
      title: featureName,
      section: 'Features',
      content: docContent,
      order: 300 + this.changes.newFeatures.indexOf(featureAnalysis)
    }
  }

  /**
   * Update HERA documentation entities
   */
  async updateHeraDocumentation() {
    console.log('💾 Updating HERA documentation entities...')

    for (const doc of this.generatedDocs) {
      try {
        // Create or update documentation page entity
        await this.createOrUpdateDocPage(doc)
        console.log(`✅ Updated documentation: \${doc.title}`)
      } catch (error) {
        console.error(`❌ Failed to update \${doc.title}:, error`)
      }
    }

    // Update navigation relationships
    await this.updateDocumentationNavigation()
  }

  /**
   * Create or update documentation page in HERA
   */
  async createOrUpdateDocPage(doc) {
    // This would integrate with your HERA API
    const apiCall = `
    // Check if page exists
    const existing = await fetch('/api/v1/entities/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entity_type: 'doc_page',
        filters: { entity_code: '\${doc.slug}' }
      })
    })

    const existingData = await existing.json()
    
    if (existingData.entities?.length > 0) {
      // Update existing page
      const pageId = existingData.entities[0].id
      await updateDynamicData(pageId, 'content', doc.content)
    } else {
      // Create new page
      const page = await createEntity({
        entity_type: 'doc_page',
        entity_name: '\${doc.title}',
        entity_code: '\${doc.slug}',
        metadata: {
          doc_type: '\${doc.docType}',
          section: '\${doc.section}',
          order: \${doc.order},
          status: 'published',
          auto_generated: true,
          last_updated: '\${new Date().toISOString()}'
        }
      })

      await createDynamicData({
        entity_id: page.id,
        field_name: 'content',
        field_type: 'text',
        field_value: `\${doc.content}`
      })
    }
    `

    // For now, save to file system for manual import
    const outputDir = './generated-docs'
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true })
    }

    fs.writeFileSync(
      path.join(outputDir, `\${doc.slug.replace(/\\//g, '-')}.md`),
      doc.content
    )
  }

  /**
   * Generate changelog entries
   */
  async generateChangelog() {
    console.log('📋 Generating changelog...')

    const changelogEntry = {
      date: new Date().toISOString().split('T')[0],
      version: this.getCurrentVersion(),
      changes: {
        added: [],
        modified: [],
        deprecated: [],
        removed: []
      }
    }

    // Categorize changes
    for (const doc of this.generatedDocs) {
      if (doc.type === 'api') {
        changelogEntry.changes.added.push(`Added API endpoint: \${doc.title}`)
      } else if (doc.type === 'component') {
        changelogEntry.changes.added.push(`Added component: \${doc.title}`)
      } else if (doc.type === 'feature') {
        changelogEntry.changes.added.push(`Added feature: \${doc.title}`)
      }
    }

    // Save changelog
    const changelogPath = './CHANGELOG.md'
    let changelogContent = ''
    
    if (fs.existsSync(changelogPath)) {
      changelogContent = fs.readFileSync(changelogPath, 'utf8')
    } else {
      changelogContent = '# Changelog\\n\\nAll notable changes to this project will be documented in this file.\\n\\n'
    }

    const newEntry = this.formatChangelogEntry(changelogEntry)
    const lines = changelogContent.split('\\n')
    const insertIndex = lines.findIndex(line => line.startsWith('## ')) || 2
    
    lines.splice(insertIndex, 0, newEntry)
    fs.writeFileSync(changelogPath, lines.join('\\n'))
  }

  // Helper methods
  getFileType(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.jsx')) return 'component'
    if (filePath.endsWith('.ts') || filePath.endsWith('.js')) return 'script'
    if (filePath.includes('/api/')) return 'api'
    if (filePath.endsWith('page.tsx')) return 'page'
    return 'other'
  }

  generateFileDescription(analysis) {
    if (analysis.isApiRoute) {
      return `API endpoint for \${analysis.filePath.replace('src/app/api', '').replace('/route.ts', '')}`
    }
    if (analysis.isComponent) {
      return `React component: \${analysis.components.join(', ')}`
    }
    if (analysis.isPage) {
      return `Application page component`
    }
    return 'Project file'
  }

  getCurrentVersion() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
      return packageJson.version || '1.0.0'
    } catch {
      return '1.0.0'
    }
  }

  formatChangelogEntry(entry) {
    let formatted = `\\n## [\${entry.version}] - \${entry.date}\\n`
    
    if (entry.changes.added.length) {
      formatted += '\\n### Added\\n'
      entry.changes.added.forEach(change => formatted += `- \${change}\\n`)
    }
    
    if (entry.changes.modified.length) {
      formatted += '\\n### Changed\\n'
      entry.changes.modified.forEach(change => formatted += `- \${change}\\n`)
    }

    return formatted
  }

  // Stub methods for detailed analysis
  generateApiDescription(analysis) { return 'API endpoint for handling requests' }
  generateApiRequestDocs(analysis) { return 'Request documentation to be generated' }
  generateApiResponseDocs(analysis) { return 'Response documentation to be generated' }
  generateApiExampleDocs(analysis) { return 'Example usage to be generated' }
  generateComponentDescription(analysis) { return 'React component for UI functionality' }
  generateComponentPropsDocs(analysis) { return 'Props documentation to be generated' }
  generateComponentExamples(analysis) { return 'Component examples to be generated' }
  generateFeatureDescription(analysis) { return 'New feature functionality' }
  generateFeatureUsageGuide(analysis) { return 'Usage guide to be generated' }
  generateFeatureList(analysis) { return 'Feature list to be generated' }
  generateFeatureExamples(analysis) { return 'Feature examples to be generated' }
  generateRelatedContent(analysis) { return 'Related content to be generated' }
  extractFeatureName(analysis) { return path.basename(analysis.filePath, path.extname(analysis.filePath)) }
  updateDocumentationNavigation() { return Promise.resolve() }
  analyzeAllFiles() { return Promise.resolve() }
  updateExistingDocumentation() { return Promise.resolve() }
}

// Run the auto-documentation generator
if (require.main === module) {
  const generator = new AutoDocGenerator()
  generator.run()
}

module.exports = AutoDocGenerator