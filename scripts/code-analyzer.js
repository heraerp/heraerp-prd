#!/usr/bin/env node

/**
 * Advanced Code Analyzer for HERA Documentation
 * Deep analysis of code changes to generate comprehensive documentation
 */

const fs = require('fs')
const path = require('path')
const { parse } = require('@typescript-eslint/parser')

class CodeAnalyzer {
  constructor() {
    this.patterns = {
      // API patterns
      apiRoutes: /export\s+async\s+function\s+(GET|POST|PUT|DELETE|PATCH)\s*\([^)]*\)/g,
      apiRequestBody: /await\s+request\.json\(\)/g,
      apiResponse: /return\s+(?:NextResponse\.json|Response\.json)\([^)]*\)/g,
      
      // Component patterns
      reactComponents: /(?:export\s+(?:default\s+)?)?function\s+(\w+)\s*\([^)]*\)(?:\s*:\s*[^{]+)?\s*{/g,
      propTypes: /interface\s+(\w+Props)\s*{([^}]*)}/g,
      hooks: /use\w+\(/g,
      
      // Database patterns
      supabaseQueries: /supabase\s*\.\s*from\s*\(\s*['"`]([^'"`]+)['"`]\s*\)/g,
      sqlQueries: /(?:SELECT|INSERT|UPDATE|DELETE)\s+.*?FROM\s+(\w+)/gi,
      
      // HERA patterns
      heraEntities: /entity_type\s*:\s*['"`]([^'"`]+)['"`]/g,
      heraDynamicData: /field_name\s*:\s*['"`]([^'"`]+)['"`]/g,
      heraRelationships: /relationship_type\s*:\s*['"`]([^'"`]+)['"`]/g,
      
      // Feature patterns
      newFeatures: /\/\*\*\s*\n\s*\*\s*@feature\s+([^\n]*)/g,
      deprecations: /\/\*\*\s*\n\s*\*\s*@deprecated\s+([^\n]*)/g,
      todos: /\/\/\s*TODO[:\s]+([^\n]*)/gi,
      
      // Security patterns
      authChecks: /getServerSession|auth\.|requireAuth|checkPermission/g,
      validationSchemas: /z\.|yup\.|joi\./g,
      
      // Performance patterns
      caching: /cache\.|revalidate|ISR/g,
      optimizations: /useMemo|useCallback|React\.memo/g
    }
  }

  /**
   * Analyze file for comprehensive documentation data
   */
  analyzeFile(filePath, content) {
    const analysis = {
      filePath,
      fileName: path.basename(filePath),
      fileType: this.getFileType(filePath),
      lastModified: this.getFileModificationTime(filePath),
      
      // Basic structure
      exports: this.extractExports(content),
      imports: this.extractImports(content),
      
      // API analysis
      apiEndpoints: this.extractApiEndpoints(content),
      requestHandling: this.extractRequestHandling(content),
      responseFormats: this.extractResponseFormats(content),
      
      // Component analysis
      components: this.extractComponents(content),
      props: this.extractProps(content),
      hooks: this.extractHooks(content),
      
      // Database analysis
      databaseOperations: this.extractDatabaseOperations(content),
      heraOperations: this.extractHeraOperations(content),
      
      // Feature analysis
      features: this.extractFeatures(content),
      deprecations: this.extractDeprecations(content),
      todos: this.extractTodos(content),
      
      // Security analysis
      authMethods: this.extractAuthMethods(content),
      validations: this.extractValidations(content),
      
      // Performance analysis
      optimizations: this.extractOptimizations(content),
      caching: this.extractCaching(content),
      
      // Documentation quality
      comments: this.extractComments(content),
      jsdocBlocks: this.extractJSDocBlocks(content),
      complexity: this.calculateComplexity(content),
      
      // Change impact
      dependencies: this.extractDependencies(content),
      affectedAreas: this.identifyAffectedAreas(filePath, content)
    }

    // Enhanced analysis for specific file types
    if (analysis.fileType === 'api') {
      analysis.apiAnalysis = this.deepAnalyzeApiRoute(content)
    } else if (analysis.fileType === 'component') {
      analysis.componentAnalysis = this.deepAnalyzeComponent(content)
    } else if (analysis.fileType === 'page') {
      analysis.pageAnalysis = this.deepAnalyzePage(content)
    }

    return analysis
  }

  /**
   * Extract API endpoints and their methods
   */
  extractApiEndpoints(content) {
    const endpoints = []
    const matches = content.matchAll(this.patterns.apiRoutes)
    
    for (const match of matches) {
      const method = match[1]
      const functionContent = this.extractFunctionBody(content, match.index)
      
      endpoints.push({
        method,
        parameters: this.extractApiParameters(functionContent),
        middleware: this.extractMiddleware(functionContent),
        validation: this.extractApiValidation(functionContent),
        errorHandling: this.extractErrorHandling(functionContent)
      })
    }
    
    return endpoints
  }

  /**
   * Extract React components and their details
   */
  extractComponents(content) {
    const components = []
    const matches = content.matchAll(this.patterns.reactComponents)
    
    for (const match of matches) {
      const componentName = match[1]
      const functionContent = this.extractFunctionBody(content, match.index)
      
      components.push({
        name: componentName,
        isDefault: content.includes(\`export default \${componentName}\`),
        params: this.extractComponentParams(match[0]),
        returnType: this.extractReturnType(functionContent),
        usedHooks: this.extractUsedHooks(functionContent),
        stateVariables: this.extractStateVariables(functionContent),
        effects: this.extractEffects(functionContent),
        eventHandlers: this.extractEventHandlers(functionContent)
      })
    }
    
    return components
  }

  /**
   * Extract HERA-specific operations
   */
  extractHeraOperations(content) {
    const operations = {
      entities: [],
      dynamicData: [],
      relationships: [],
      transactions: []
    }

    // Extract entity operations
    const entityMatches = content.matchAll(this.patterns.heraEntities)
    for (const match of entityMatches) {
      operations.entities.push({
        type: match[1],
        context: this.getOperationContext(content, match.index)
      })
    }

    // Extract dynamic data operations
    const dynamicDataMatches = content.matchAll(this.patterns.heraDynamicData)
    for (const match of dynamicDataMatches) {
      operations.dynamicData.push({
        fieldName: match[1],
        context: this.getOperationContext(content, match.index)
      })
    }

    return operations
  }

  /**
   * Deep analyze API route files
   */
  deepAnalyzeApiRoute(content) {
    return {
      routePattern: this.extractRoutePattern(content),
      middleware: this.extractMiddleware(content),
      authRequired: this.checkAuthRequirement(content),
      rateLimiting: this.checkRateLimiting(content),
      cors: this.checkCorsConfiguration(content),
      requestValidation: this.extractRequestValidation(content),
      responseSchema: this.extractResponseSchema(content),
      errorTypes: this.extractErrorTypes(content),
      databaseOperations: this.extractDatabaseOperations(content),
      caching: this.extractCachingStrategy(content)
    }
  }

  /**
   * Deep analyze React component files
   */
  deepAnalyzeComponent(content) {
    return {
      componentType: this.identifyComponentType(content),
      designPatterns: this.identifyDesignPatterns(content),
      accessibility: this.checkAccessibilityFeatures(content),
      performance: this.analyzeComponentPerformance(content),
      testing: this.extractTestingPatterns(content),
      styling: this.analyzeStyling(content),
      internalization: this.checkInternationalization(content),
      dependencies: this.extractComponentDependencies(content)
    }
  }

  /**
   * Generate documentation recommendations
   */
  generateDocumentationRecommendations(analysis) {
    const recommendations = []

    // API documentation recommendations
    if (analysis.apiEndpoints.length > 0) {
      recommendations.push({
        type: 'api',
        priority: 'high',
        title: 'API Documentation Needed',
        description: \`Document \${analysis.apiEndpoints.length} API endpoint(s)\`,
        sections: ['Authentication', 'Request Format', 'Response Format', 'Error Codes']
      })
    }

    // Component documentation recommendations
    if (analysis.components.length > 0) {
      const complexComponents = analysis.components.filter(c => 
        c.usedHooks.length > 2 || c.stateVariables.length > 3
      )
      
      if (complexComponents.length > 0) {
        recommendations.push({
          type: 'component',
          priority: 'medium',
          title: 'Component Documentation Needed',
          description: \`Document \${complexComponents.length} complex component(s)\`,
          sections: ['Props', 'Usage Examples', 'Styling Guide']
        })
      }
    }

    // Feature documentation recommendations
    if (analysis.features.length > 0) {
      recommendations.push({
        type: 'feature',
        priority: 'high',
        title: 'Feature Documentation Needed',
        description: \`Document \${analysis.features.length} new feature(s)\`,
        sections: ['Overview', 'Usage Guide', 'Examples']
      })
    }

    // Security documentation recommendations
    if (analysis.authMethods.length > 0 || analysis.validations.length > 0) {
      recommendations.push({
        type: 'security',
        priority: 'high',
        title: 'Security Documentation Needed',
        description: 'Document authentication and validation patterns',
        sections: ['Authentication Flow', 'Validation Rules', 'Security Best Practices']
      })
    }

    return recommendations
  }

  /**
   * Generate user-facing documentation
   */
  generateUserDocumentation(analysis) {
    const userDocs = []

    // Generate user guides for new pages
    if (analysis.fileType === 'page') {
      userDocs.push({
        type: 'user_guide',
        title: \`How to use \${this.getPageTitle(analysis.filePath)}\`,
        sections: [
          'Getting Started',
          'Key Features',
          'Step-by-step Guide',
          'Common Tasks',
          'Troubleshooting'
        ]
      })
    }

    // Generate user guides for new features
    for (const feature of analysis.features) {
      userDocs.push({
        type: 'feature_guide',
        title: \`\${feature.name} Feature Guide\`,
        description: feature.description,
        sections: [
          'What is this feature?',
          'How to access it',
          'How to use it',
          'Examples',
          'FAQ'
        ]
      })
    }

    return userDocs
  }

  // Helper methods for extraction
  extractExports(content) {
    const exports = []
    const patterns = [
      /export\s+(?:default\s+)?(?:function|const|class|interface|type)\s+(\w+)/g,
      /export\s*{\s*([^}]+)\s*}/g
    ]

    for (const pattern of patterns) {
      const matches = content.matchAll(pattern)
      for (const match of matches) {
        if (match[1].includes(',')) {
          // Named exports
          exports.push(...match[1].split(',').map(e => e.trim()))
        } else {
          exports.push(match[1])
        }
      }
    }

    return exports
  }

  extractImports(content) {
    const imports = []
    const importPattern = /import\s+(?:{[^}]+}|\w+|[*]\s+as\s+\w+)\s+from\s+['"`]([^'"`]+)['"`]/g
    const matches = content.matchAll(importPattern)

    for (const match of matches) {
      imports.push(match[1])
    }

    return imports
  }

  extractComments(content) {
    const comments = []
    const commentPatterns = [
      /\/\*\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+\//g, // JSDoc comments
      /\/\*([^*]|[\r\n]|(\*+([^*/]|[\r\n])))*\*+\//g,   // Block comments
      /\/\/.*$/gm                                          // Line comments
    ]

    for (const pattern of commentPatterns) {
      const matches = content.matchAll(pattern)
      for (const match of matches) {
        comments.push(match[0])
      }
    }

    return comments
  }

  calculateComplexity(content) {
    // Simple complexity calculation based on control structures
    const complexityIndicators = [
      /if\s*\(/g,
      /else\s+if\s*\(/g,
      /while\s*\(/g,
      /for\s*\(/g,
      /switch\s*\(/g,
      /catch\s*\(/g,
      /&&|\|\|/g
    ]

    let complexity = 1 // Base complexity
    for (const pattern of complexityIndicators) {
      const matches = content.match(pattern)
      if (matches) {
        complexity += matches.length
      }
    }

    return complexity
  }

  getFileType(filePath) {
    if (filePath.includes('/api/') && filePath.endsWith('route.ts')) return 'api'
    if (filePath.includes('/components/') && (filePath.endsWith('.tsx') || filePath.endsWith('.jsx'))) return 'component'
    if (filePath.endsWith('page.tsx')) return 'page'
    if (filePath.endsWith('layout.tsx')) return 'layout'
    if (filePath.endsWith('.test.') || filePath.endsWith('.spec.')) return 'test'
    if (filePath.includes('/lib/')) return 'utility'
    return 'other'
  }

  getFileModificationTime(filePath) {
    try {
      const stats = fs.statSync(filePath)
      return stats.mtime
    } catch {
      return new Date()
    }
  }

  // Stub methods for detailed extraction (implement as needed)
  extractRequestHandling(content) { return [] }
  extractResponseFormats(content) { return [] }
  extractProps(content) { return [] }
  extractHooks(content) { return [] }
  extractDatabaseOperations(content) { return [] }
  extractFeatures(content) { return [] }
  extractDeprecations(content) { return [] }
  extractTodos(content) { return [] }
  extractAuthMethods(content) { return [] }
  extractValidations(content) { return [] }
  extractOptimizations(content) { return [] }
  extractCaching(content) { return [] }
  extractJSDocBlocks(content) { return [] }
  extractDependencies(content) { return [] }
  identifyAffectedAreas(filePath, content) { return [] }
  extractFunctionBody(content, index) { return '' }
  extractApiParameters(content) { return [] }
  extractMiddleware(content) { return [] }
  extractApiValidation(content) { return [] }
  extractErrorHandling(content) { return [] }
  extractComponentParams(functionSignature) { return [] }
  extractReturnType(content) { return '' }
  extractUsedHooks(content) { return [] }
  extractStateVariables(content) { return [] }
  extractEffects(content) { return [] }
  extractEventHandlers(content) { return [] }
  getOperationContext(content, index) { return '' }
  extractRoutePattern(content) { return '' }
  checkAuthRequirement(content) { return false }
  checkRateLimiting(content) { return false }
  checkCorsConfiguration(content) { return false }
  extractRequestValidation(content) { return [] }
  extractResponseSchema(content) { return null }
  extractErrorTypes(content) { return [] }
  extractCachingStrategy(content) { return null }
  identifyComponentType(content) { return 'functional' }
  identifyDesignPatterns(content) { return [] }
  checkAccessibilityFeatures(content) { return [] }
  analyzeComponentPerformance(content) { return {} }
  extractTestingPatterns(content) { return [] }
  analyzeStyling(content) { return {} }
  checkInternationalization(content) { return false }
  extractComponentDependencies(content) { return [] }
  getPageTitle(filePath) { return path.basename(filePath, '.tsx') }
}

module.exports = CodeAnalyzer