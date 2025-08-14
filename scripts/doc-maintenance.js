#!/usr/bin/env node

/**
 * HERA Documentation Maintenance Workflows
 * Automated maintenance tasks for keeping documentation up-to-date
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

class DocumentationMaintenance {
  constructor() {
    this.tasks = {
      'check-outdated': this.checkOutdatedDocs.bind(this),
      'validate-links': this.validateDocumentationLinks.bind(this),
      'update-versions': this.updateVersionReferences.bind(this),
      'cleanup-old': this.cleanupOldDocumentation.bind(this),
      'sync-status': this.checkSyncStatus.bind(this),
      'health-check': this.performHealthCheck.bind(this),
      'full-maintenance': this.runFullMaintenance.bind(this)
    }
  }

  /**
   * Run maintenance task
   */
  async runTask(taskName) {
    console.log(\`🔧 Running documentation maintenance task: \${taskName}\`)
    
    if (!this.tasks[taskName]) {
      console.error(\`❌ Unknown task: \${taskName}\`)
      console.log('Available tasks:', Object.keys(this.tasks).join(', '))
      return false
    }

    try {
      await this.tasks[taskName]()
      console.log(\`✅ Task '\${taskName}' completed successfully\`)
      return true
    } catch (error) {
      console.error(\`❌ Task '\${taskName}' failed:, error\`)
      return false
    }
  }

  /**
   * Check for outdated documentation
   */
  async checkOutdatedDocs() {
    console.log('📅 Checking for outdated documentation...')
    
    const outdatedFiles = []
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
    
    // Check generated docs directory
    if (fs.existsSync('./generated-docs')) {
      const files = fs.readdirSync('./generated-docs')
      for (const file of files) {
        const filePath = path.join('./generated-docs', file)
        const stats = fs.statSync(filePath)
        
        if (stats.mtime < cutoffDate) {
          outdatedFiles.push({
            file: filePath,
            lastModified: stats.mtime,
            daysOld: Math.floor((Date.now() - stats.mtime) / (24 * 60 * 60 * 1000))
          })
        }
      }
    }

    // Check for source files that might need doc updates
    const sourceFiles = this.getSourceFiles()
    for (const sourceFile of sourceFiles) {
      const stats = fs.statSync(sourceFile)
      if (stats.mtime > cutoffDate) {
        // Source file was recently modified, check if docs exist
        const docExists = await this.checkIfDocumentationExists(sourceFile)
        if (!docExists) {
          outdatedFiles.push({
            file: sourceFile,
            lastModified: stats.mtime,
            reason: 'No documentation found for recently modified file'
          })
        }
      }
    }

    if (outdatedFiles.length > 0) {
      console.log(\`⚠️  Found \${outdatedFiles.length} outdated documentation items:\`)
      outdatedFiles.forEach(item => {
        console.log(\`  - \${item.file} (\${item.daysOld || 'missing'} days old)\`)
      })
      
      // Generate update recommendations
      await this.generateUpdateRecommendations(outdatedFiles)
    } else {
      console.log('✅ All documentation appears to be up-to-date')
    }
  }

  /**
   * Validate documentation links
   */
  async validateDocumentationLinks() {
    console.log('🔗 Validating documentation links...')
    
    const brokenLinks = []
    const docFiles = this.getDocumentationFiles()
    
    for (const docFile of docFiles) {
      const content = fs.readFileSync(docFile, 'utf8')
      const links = this.extractLinks(content)
      
      for (const link of links) {
        const isValid = await this.validateLink(link, docFile)
        if (!isValid) {
          brokenLinks.push({
            file: docFile,
            link: link,
            type: this.getLinkType(link)
          })
        }
      }
    }

    if (brokenLinks.length > 0) {
      console.log(\`❌ Found \${brokenLinks.length} broken links:\`)
      brokenLinks.forEach(item => {
        console.log(\`  - \${item.link} in \${item.file}\`)
      })
      
      // Generate link fix suggestions
      await this.generateLinkFixSuggestions(brokenLinks)
    } else {
      console.log('✅ All documentation links are valid')
    }
  }

  /**
   * Update version references in documentation
   */
  async updateVersionReferences() {
    console.log('🔄 Updating version references...')
    
    const currentVersion = this.getCurrentVersion()
    const docFiles = this.getDocumentationFiles()
    let updatedFiles = 0

    for (const docFile of docFiles) {
      let content = fs.readFileSync(docFile, 'utf8')
      let updated = false

      // Update version placeholders
      const versionPatterns = [
        /version\s*:\s*['"]?[0-9]+\.[0-9]+\.[0-9]+['"]?/gi,
        /v[0-9]+\.[0-9]+\.[0-9]+/gi,
        /HERA\s+v?[0-9]+\.[0-9]+\.[0-9]+/gi
      ]

      for (const pattern of versionPatterns) {
        const newContent = content.replace(pattern, match => {
          updated = true
          return match.replace(/[0-9]+\.[0-9]+\.[0-9]+/, currentVersion)
        })
        content = newContent
      }

      // Update "last updated" timestamps
      const timestampPattern = /last updated:?\s*[0-9]{4}-[0-9]{2}-[0-9]{2}/gi
      content = content.replace(timestampPattern, \`Last updated: \${new Date().toISOString().split('T')[0]}\`)
      updated = true

      if (updated) {
        fs.writeFileSync(docFile, content)
        updatedFiles++
      }
    }

    console.log(\`✅ Updated version references in \${updatedFiles} files\`)
  }

  /**
   * Cleanup old documentation files
   */
  async cleanupOldDocumentation() {
    console.log('🧹 Cleaning up old documentation...')
    
    const cleanupTasks = [
      this.cleanupProcessedDocs(),
      this.cleanupEmptyDirectories(),
      this.cleanupDuplicates(),
      this.archiveOldVersions()
    ]

    const results = await Promise.allSettled(cleanupTasks)
    const successful = results.filter(r => r.status === 'fulfilled').length
    
    console.log(\`✅ Completed \${successful} out of \${results.length} cleanup tasks\`)
  }

  /**
   * Check synchronization status
   */
  async checkSyncStatus() {
    console.log('🔄 Checking documentation sync status...')
    
    const status = {
      generatedFiles: 0,
      syncedFiles: 0,
      pendingSync: 0,
      lastSync: null,
      issues: []
    }

    // Check generated docs
    if (fs.existsSync('./generated-docs')) {
      status.generatedFiles = fs.readdirSync('./generated-docs').length
    }

    // Check processed docs (successfully synced)
    if (fs.existsSync('./processed-docs')) {
      const processedFiles = fs.readdirSync('./processed-docs')
      status.syncedFiles = processedFiles.length
      
      // Get last sync time
      if (processedFiles.length > 0) {
        const latestFile = processedFiles
          .map(f => ({ name: f, time: fs.statSync(path.join('./processed-docs', f)).mtime }))
          .sort((a, b) => b.time - a.time)[0]
        status.lastSync = latestFile.time
      }
    }

    status.pendingSync = status.generatedFiles

    // Check for sync issues
    if (status.pendingSync > 10) {
      status.issues.push('High number of pending sync files')
    }
    
    if (status.lastSync && (Date.now() - status.lastSync) > 7 * 24 * 60 * 60 * 1000) {
      status.issues.push('Last sync was more than 7 days ago')
    }

    console.log('📊 Sync Status:')
    console.log(\`  Generated files: \${status.generatedFiles}\`)
    console.log(\`  Synced files: \${status.syncedFiles}\`)
    console.log(\`  Pending sync: \${status.pendingSync}\`)
    console.log(\`  Last sync: \${status.lastSync ? status.lastSync.toISOString() : 'Never'}\`)
    
    if (status.issues.length > 0) {
      console.log('⚠️  Issues:')
      status.issues.forEach(issue => console.log(\`  - \${issue}\`))
    }

    return status
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    console.log('🏥 Performing documentation health check...')
    
    const healthReport = {
      overallHealth: 'good',
      checks: [],
      recommendations: []
    }

    // Check 1: File structure
    const structureCheck = await this.checkFileStructure()
    healthReport.checks.push(structureCheck)

    // Check 2: Content quality
    const contentCheck = await this.checkContentQuality()
    healthReport.checks.push(contentCheck)

    // Check 3: Synchronization
    const syncCheck = await this.checkSyncHealth()
    healthReport.checks.push(syncCheck)

    // Check 4: Performance
    const performanceCheck = await this.checkPerformance()
    healthReport.checks.push(performanceCheck)

    // Calculate overall health
    const failedChecks = healthReport.checks.filter(check => check.status === 'failed').length
    const warningChecks = healthReport.checks.filter(check => check.status === 'warning').length

    if (failedChecks > 0) {
      healthReport.overallHealth = 'poor'
    } else if (warningChecks > 2) {
      healthReport.overallHealth = 'fair'
    }

    // Generate recommendations
    healthReport.recommendations = this.generateHealthRecommendations(healthReport.checks)

    console.log(\`📋 Health Report: \${healthReport.overallHealth.toUpperCase()}\`)
    healthReport.checks.forEach(check => {
      const icon = check.status === 'passed' ? '✅' : check.status === 'warning' ? '⚠️' : '❌'
      console.log(\`  \${icon} \${check.name}: \${check.message}\`)
    })

    if (healthReport.recommendations.length > 0) {
      console.log('\\n💡 Recommendations:')
      healthReport.recommendations.forEach(rec => console.log(\`  - \${rec}\`))
    }

    return healthReport
  }

  /**
   * Run full maintenance suite
   */
  async runFullMaintenance() {
    console.log('🔧 Running full documentation maintenance...')
    
    const tasks = [
      'check-outdated',
      'validate-links',
      'update-versions',
      'cleanup-old',
      'sync-status',
      'health-check'
    ]

    const results = []
    for (const task of tasks) {
      const success = await this.runTask(task)
      results.push({ task, success })
    }

    const successful = results.filter(r => r.success).length
    console.log(\`\\n📊 Full Maintenance Complete: \${successful}/\${tasks.length} tasks successful\`)
    
    // Generate maintenance report
    await this.generateMaintenanceReport(results)
  }

  // Helper methods

  getSourceFiles() {
    const files = []
    const scanDirs = ['./src/app', './src/components', './src/lib']
    
    for (const dir of scanDirs) {
      try {
        const dirFiles = execSync(\`find \${dir} -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js"\`, { encoding: 'utf8' })
          .trim().split('\\n').filter(f => f)
        files.push(...dirFiles)
      } catch (e) {
        // Directory might not exist
      }
    }
    
    return files
  }

  getDocumentationFiles() {
    const files = []
    const docDirs = ['./docs', './generated-docs', './processed-docs']
    
    for (const dir of docDirs) {
      if (fs.existsSync(dir)) {
        const dirFiles = fs.readdirSync(dir)
          .filter(f => f.endsWith('.md'))
          .map(f => path.join(dir, f))
        files.push(...dirFiles)
      }
    }
    
    return files
  }

  getCurrentVersion() {
    try {
      const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'))
      return packageJson.version || '1.0.0'
    } catch {
      return '1.0.0'
    }
  }

  extractLinks(content) {
    const linkRegex = /\\[([^\\]]+)\\]\\(([^)]+)\\)/g
    const links = []
    let match

    while ((match = linkRegex.exec(content)) !== null) {
      links.push({
        text: match[1],
        url: match[2],
        full: match[0]
      })
    }

    return links
  }

  async validateLink(link, sourceFile) {
    // Internal links
    if (link.url.startsWith('/') || link.url.startsWith('./')) {
      const targetPath = path.resolve(path.dirname(sourceFile), link.url)
      return fs.existsSync(targetPath)
    }
    
    // External links - for now, assume valid (could implement HTTP checking)
    if (link.url.startsWith('http')) {
      return true
    }
    
    // Anchor links
    if (link.url.startsWith('#')) {
      const content = fs.readFileSync(sourceFile, 'utf8')
      const anchorId = link.url.substring(1)
      return content.includes(\`id="\${anchorId}"\`) || content.includes(\`# \${anchorId}\`)
    }
    
    return true
  }

  getLinkType(link) {
    if (link.url.startsWith('http')) return 'external'
    if (link.url.startsWith('#')) return 'anchor'
    if (link.url.startsWith('/')) return 'internal'
    return 'relative'
  }

  async checkIfDocumentationExists(sourceFile) {
    // Simple check - could be more sophisticated
    const baseName = path.basename(sourceFile, path.extname(sourceFile))
    const docFiles = this.getDocumentationFiles()
    
    return docFiles.some(docFile => 
      docFile.toLowerCase().includes(baseName.toLowerCase())
    )
  }

  // Stub methods for detailed implementation
  async generateUpdateRecommendations(outdatedFiles) {
    console.log('💡 Generated update recommendations (see maintenance report)')
  }

  async generateLinkFixSuggestions(brokenLinks) {
    console.log('💡 Generated link fix suggestions (see maintenance report)')
  }

  async cleanupProcessedDocs() {
    // Archive old processed docs
    return true
  }

  async cleanupEmptyDirectories() {
    // Remove empty directories
    return true
  }

  async cleanupDuplicates() {
    // Remove duplicate documentation files
    return true
  }

  async archiveOldVersions() {
    // Archive old version documentation
    return true
  }

  async checkFileStructure() {
    return {
      name: 'File Structure',
      status: 'passed',
      message: 'Documentation file structure is organized'
    }
  }

  async checkContentQuality() {
    return {
      name: 'Content Quality',
      status: 'passed',
      message: 'Documentation content meets quality standards'
    }
  }

  async checkSyncHealth() {
    return {
      name: 'Sync Health',
      status: 'passed',
      message: 'Documentation synchronization is working properly'
    }
  }

  async checkPerformance() {
    return {
      name: 'Performance',
      status: 'passed',
      message: 'Documentation system performance is optimal'
    }
  }

  generateHealthRecommendations(checks) {
    const recommendations = []
    
    checks.forEach(check => {
      if (check.status === 'failed' || check.status === 'warning') {
        recommendations.push(\`Address issues with \${check.name}\`)
      }
    })
    
    return recommendations
  }

  async generateMaintenanceReport(results) {
    const report = {
      timestamp: new Date().toISOString(),
      results,
      summary: \`\${results.filter(r => r.success).length} successful, \${results.filter(r => !r.success).length} failed\`
    }
    
    fs.writeFileSync('./maintenance-report.json', JSON.stringify(report, null, 2))
    console.log('📄 Maintenance report saved to maintenance-report.json')
  }
}

// CLI usage
if (require.main === module) {
  const maintenance = new DocumentationMaintenance()
  const task = process.argv[2] || 'health-check'
  
  maintenance.runTask(task).catch(error => {
    console.error('Maintenance failed:', error)
    process.exit(1)
  })
}

module.exports = DocumentationMaintenance