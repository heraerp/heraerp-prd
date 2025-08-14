#!/usr/bin/env node

/**
 * AI-Powered Documentation Generator for HERA
 * Uses AI to generate comprehensive documentation from code analysis
 */

const fs = require('fs')
const path = require('path')
const CodeAnalyzer = require('./code-analyzer')

class AIDocumentationGenerator {
  constructor() {
    this.analyzer = new CodeAnalyzer()
    this.templates = {
      api: this.loadTemplate('api-template.md'),
      component: this.loadTemplate('component-template.md'),
      feature: this.loadTemplate('feature-template.md'),
      userGuide: this.loadTemplate('user-guide-template.md')
    }
  }

  /**
   * Generate documentation using AI analysis
   */
  async generateDocumentation(filePath) {
    console.log(\`🤖 AI-generating documentation for: \${filePath}\`)
    
    try {
      const content = fs.readFileSync(filePath, 'utf8')
      const analysis = this.analyzer.analyzeFile(filePath, content)
      
      // Generate different types of documentation based on file type
      const generatedDocs = []
      
      if (analysis.fileType === 'api') {
        generatedDocs.push(await this.generateApiDocumentation(analysis))
      }
      
      if (analysis.fileType === 'component') {
        generatedDocs.push(await this.generateComponentDocumentation(analysis))
        generatedDocs.push(await this.generateComponentUserGuide(analysis))
      }
      
      if (analysis.fileType === 'page') {
        generatedDocs.push(await this.generatePageDocumentation(analysis))
        generatedDocs.push(await this.generateUserGuide(analysis))
      }
      
      // Generate feature documentation for new features
      if (analysis.features && analysis.features.length > 0) {
        for (const feature of analysis.features) {
          generatedDocs.push(await this.generateFeatureDocumentation(feature, analysis))
        }
      }
      
      return generatedDocs
      
    } catch (error) {
      console.error(\`❌ Error generating documentation for \${filePath}:, error\`)
      return []
    }
  }

  /**
   * Generate comprehensive API documentation
   */
  async generateApiDocumentation(analysis) {
    const apiPath = analysis.filePath.replace('src/app/api', '').replace('/route.ts', '')
    const methods = analysis.apiEndpoints.map(endpoint => endpoint.method)
    
    const prompt = \`
    Generate comprehensive API documentation for the following endpoint:
    
    Path: \${apiPath}
    Methods: \${methods.join(', ')}
    File: \${analysis.fileName}
    
    Code Analysis:
    - Endpoints: \${JSON.stringify(analysis.apiEndpoints, null, 2)}
    - Auth Methods: \${JSON.stringify(analysis.authMethods)}
    - Validations: \${JSON.stringify(analysis.validations)}
    - Database Operations: \${JSON.stringify(analysis.databaseOperations)}
    - HERA Operations: \${JSON.stringify(analysis.heraOperations)}
    
    Please generate a complete API documentation including:
    1. Clear endpoint description
    2. Authentication requirements
    3. Request/response formats with examples
    4. Error handling
    5. Rate limiting information
    6. HERA-specific patterns used
    \`

    const documentation = await this.generateWithAI(prompt, 'api')
    
    return {
      type: 'api',
      docType: 'dev',
      slug: \`api\${apiPath.replace(/\\//g, '-')}\`,
      title: \`\${this.formatApiTitle(apiPath)} API\`,
      section: 'API Reference',
      content: documentation,
      priority: 'high',
      aiGenerated: true
    }
  }

  /**
   * Generate component documentation
   */
  async generateComponentDocumentation(analysis) {
    const componentName = analysis.components[0]?.name || path.basename(analysis.filePath, '.tsx')
    
    const prompt = \`
    Generate comprehensive component documentation for a React component:
    
    Component: \${componentName}
    File: \${analysis.fileName}
    
    Code Analysis:
    - Components: \${JSON.stringify(analysis.components, null, 2)}
    - Props: \${JSON.stringify(analysis.props)}
    - Hooks Used: \${JSON.stringify(analysis.components[0]?.usedHooks || [])}
    - State Variables: \${JSON.stringify(analysis.components[0]?.stateVariables || [])}
    - Event Handlers: \${JSON.stringify(analysis.components[0]?.eventHandlers || [])}
    - Dependencies: \${JSON.stringify(analysis.dependencies)}
    
    Please generate complete component documentation including:
    1. Component overview and purpose
    2. Props interface with types and descriptions
    3. Usage examples with code snippets
    4. Styling information (uses HERA design system)
    5. Accessibility features
    6. Performance considerations
    7. Testing recommendations
    \`

    const documentation = await this.generateWithAI(prompt, 'component')
    
    return {
      type: 'component',
      docType: 'dev',
      slug: \`components/\${componentName.toLowerCase()}\`,
      title: \`\${componentName} Component\`,
      section: 'Components',
      content: documentation,
      priority: 'medium',
      aiGenerated: true
    }
  }

  /**
   * Generate user guide for components
   */
  async generateComponentUserGuide(analysis) {
    const componentName = analysis.components[0]?.name || path.basename(analysis.filePath, '.tsx')
    
    const prompt = \`
    Generate a user-friendly guide for using this UI component:
    
    Component: \${componentName}
    
    Code Analysis:
    - Component Purpose: \${this.inferComponentPurpose(analysis)}
    - User Interactions: \${JSON.stringify(analysis.components[0]?.eventHandlers || [])}
    - Features: \${JSON.stringify(analysis.features)}
    
    Please generate a user guide including:
    1. What this component does (non-technical explanation)
    2. When and where users will encounter it
    3. How to interact with it
    4. Common use cases
    5. Tips and best practices for users
    6. Troubleshooting common issues
    \`

    const documentation = await this.generateWithAI(prompt, 'userGuide')
    
    return {
      type: 'user_guide',
      docType: 'user',
      slug: \`ui/\${componentName.toLowerCase()}\`,
      title: \`Using \${componentName}\`,
      section: 'User Interface',
      content: documentation,
      priority: 'low',
      aiGenerated: true
    }
  }

  /**
   * Generate feature documentation
   */
  async generateFeatureDocumentation(feature, analysis) {
    const prompt = \`
    Generate comprehensive feature documentation:
    
    Feature: \${feature.name}
    Description: \${feature.description}
    File Context: \${analysis.fileName}
    
    Code Analysis:
    - File Type: \${analysis.fileType}
    - Components: \${JSON.stringify(analysis.components)}
    - API Endpoints: \${JSON.stringify(analysis.apiEndpoints)}
    - Database Operations: \${JSON.stringify(analysis.databaseOperations)}
    - HERA Operations: \${JSON.stringify(analysis.heraOperations)}
    
    Generate both developer AND user documentation:
    
    DEVELOPER SECTION:
    1. Technical implementation details
    2. Architecture decisions
    3. API integration points
    4. Database/HERA patterns used
    5. Code examples and snippets
    6. Testing approach
    
    USER SECTION:
    1. What this feature does (simple explanation)
    2. How to access and use it
    3. Step-by-step usage guide
    4. Benefits and use cases
    5. Screenshots or UI descriptions
    6. FAQ and troubleshooting
    \`

    const documentation = await this.generateWithAI(prompt, 'feature')
    
    return {
      type: 'feature',
      docType: 'both', // Indicates both dev and user content
      slug: \`features/\${feature.name.toLowerCase().replace(/\\s+/g, '-')}\`,
      title: feature.name,
      section: 'Features',
      content: documentation,
      priority: 'high',
      aiGenerated: true
    }
  }

  /**
   * Generate user guide for new pages
   */
  async generateUserGuide(analysis) {
    const pageName = this.extractPageName(analysis.filePath)
    
    const prompt = \`
    Generate a user guide for this application page:
    
    Page: \${pageName}
    File: \${analysis.fileName}
    
    Code Analysis:
    - Components Used: \${JSON.stringify(analysis.components)}
    - Features: \${JSON.stringify(analysis.features)}
    - User Interactions: Inferred from component analysis
    
    Generate a comprehensive user guide including:
    1. Page overview - what users can do here
    2. Navigation - how to reach this page
    3. Key features and functionality
    4. Step-by-step usage instructions
    5. Common tasks and workflows
    6. Tips for effective use
    7. Related pages and features
    8. Troubleshooting common issues
    
    Write in a friendly, accessible tone for end users.
    \`

    const documentation = await this.generateWithAI(prompt, 'userGuide')
    
    return {
      type: 'user_guide',
      docType: 'user',
      slug: \`pages/\${pageName.toLowerCase().replace(/\\s+/g, '-')}\`,
      title: \`\${pageName} Page Guide\`,
      section: 'Page Guides',
      content: documentation,
      priority: 'medium',
      aiGenerated: true
    }
  }

  /**
   * Generate documentation using AI (placeholder for actual AI integration)
   */
  async generateWithAI(prompt, type) {
    // This is where you would integrate with an AI service like OpenAI, Claude, etc.
    // For now, we'll generate structured documentation based on templates
    
    console.log(\`🧠 Generating \${type} documentation with AI...\`)
    
    // Load appropriate template
    const template = this.templates[type] || this.templates.feature
    
    // For demonstration, we'll create structured documentation
    // In a real implementation, you would send the prompt to an AI service
    
    const documentation = this.generateFromTemplate(template, prompt, type)
    
    return documentation
  }

  /**
   * Generate documentation from template (fallback method)
   */
  generateFromTemplate(template, prompt, type) {
    const timestamp = new Date().toISOString()
    
    // Extract key information from the prompt
    const promptLines = prompt.split('\\n')
    const contextData = this.extractContextFromPrompt(promptLines)
    
    let documentation = template
    
    // Replace template variables
    documentation = documentation.replace(/{{timestamp}}/g, timestamp)
    documentation = documentation.replace(/{{type}}/g, type)
    documentation = documentation.replace(/{{title}}/g, contextData.title || 'Generated Documentation')
    documentation = documentation.replace(/{{description}}/g, contextData.description || 'AI-generated documentation')
    documentation = documentation.replace(/{{content}}/g, this.generateSectionContent(contextData, type))
    
    return documentation
  }

  /**
   * Generate section content based on context and type
   */
  generateSectionContent(contextData, type) {
    switch (type) {
      case 'api':
        return this.generateApiContent(contextData)
      case 'component':
        return this.generateComponentContent(contextData)
      case 'feature':
        return this.generateFeatureContent(contextData)
      case 'userGuide':
        return this.generateUserGuideContent(contextData)
      default:
        return 'Generated content based on code analysis.'
    }
  }

  /**
   * Generate API-specific content
   */
  generateApiContent(contextData) {
    return \`
## Authentication
This endpoint requires authentication. Include a valid JWT token in the Authorization header.

\\\`\\\`\\\`
Authorization: Bearer <your-jwt-token>
\\\`\\\`\\\`

## Request Format
\\\`\\\`\\\`json
{
  "example": "request",
  "data": "structure"
}
\\\`\\\`\\\`

## Response Format
\\\`\\\`\\\`json
{
  "success": true,
  "data": {},
  "message": "Operation completed successfully"
}
\\\`\\\`\\\`

## Error Responses
- \`400 Bad Request\` - Invalid request data
- \`401 Unauthorized\` - Missing or invalid authentication
- \`404 Not Found\` - Resource not found
- \`500 Internal Server Error\` - Server error

## HERA Integration
This endpoint integrates with HERA's universal architecture using:
- Entity management for data storage
- Dynamic data for flexible fields
- Transactions for audit trails
\`
  }

  /**
   * Generate component-specific content
   */
  generateComponentContent(contextData) {
    return \`
## Props
| Prop | Type | Required | Description |
|------|------|----------|-------------|
| className | string | No | Additional CSS classes |
| children | ReactNode | No | Child components |

## Usage Example
\\\`\\\`\\\`tsx
import { ComponentName } from '@/components/...'

export function ExampleUsage() {
  return (
    <ComponentName className="custom-styles">
      <p>Content goes here</p>
    </ComponentName>
  )
}
\\\`\\\`\\\`

## Styling
This component uses the HERA design system with:
- Tailwind CSS classes
- HERA brand colors
- Responsive design patterns

## Accessibility
- Semantic HTML structure
- Keyboard navigation support
- Screen reader compatibility
\`
  }

  /**
   * Generate feature-specific content
   */
  generateFeatureContent(contextData) {
    return \`
## Developer Guide

### Implementation
This feature is implemented using HERA's universal architecture patterns.

### Key Components
- Data storage via core_entities
- Custom fields via core_dynamic_data
- Audit trail via universal_transactions

### Code Examples
\\\`\\\`\\\`typescript
// Example usage
const feature = await useFeature()
\\\`\\\`\\\`

---

## User Guide

### Getting Started
This feature helps you accomplish specific tasks more efficiently.

### How to Use
1. Navigate to the feature location
2. Follow the on-screen instructions
3. Complete your task

### Tips
- Use keyboard shortcuts for faster navigation
- Check the help section for additional information
\`
  }

  /**
   * Generate user guide content
   */
  generateUserGuideContent(contextData) {
    return \`
## Overview
This page provides essential functionality for your daily tasks.

## Getting Started
1. Access the page from the main navigation
2. Familiarize yourself with the layout
3. Start with the most common tasks

## Key Features
- Feature 1: Description and benefits
- Feature 2: Description and benefits
- Feature 3: Description and benefits

## Common Tasks
### Task 1
Step-by-step instructions for completing this task.

### Task 2
Step-by-step instructions for completing this task.

## Tips and Best Practices
- Tip 1: Helpful advice
- Tip 2: Helpful advice
- Tip 3: Helpful advice

## Need Help?
If you encounter issues, check the troubleshooting section or contact support.
\`
  }

  // Helper methods
  loadTemplate(templateName) {
    const templatePath = path.join(__dirname, 'doc-templates', templateName)
    try {
      return fs.readFileSync(templatePath, 'utf8')
    } catch {
      return this.getDefaultTemplate()
    }
  }

  getDefaultTemplate() {
    return \`# {{title}}

{{description}}

{{content}}

---
*AI-generated documentation on {{timestamp}}*
\`
  }

  extractContextFromPrompt(promptLines) {
    const context = {}
    
    for (const line of promptLines) {
      if (line.includes('Component:')) {
        context.title = line.split('Component:')[1]?.trim()
      } else if (line.includes('Feature:')) {
        context.title = line.split('Feature:')[1]?.trim()
      } else if (line.includes('Path:')) {
        context.title = line.split('Path:')[1]?.trim()
      } else if (line.includes('Description:')) {
        context.description = line.split('Description:')[1]?.trim()
      }
    }
    
    return context
  }

  formatApiTitle(apiPath) {
    return apiPath
      .split('/')
      .filter(part => part)
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ')
  }

  inferComponentPurpose(analysis) {
    // Infer purpose from component name and structure
    const componentName = analysis.components[0]?.name || ''
    
    if (componentName.toLowerCase().includes('button')) return 'Interactive button for user actions'
    if (componentName.toLowerCase().includes('form')) return 'Form for collecting user input'
    if (componentName.toLowerCase().includes('card')) return 'Display card for showing information'
    if (componentName.toLowerCase().includes('modal')) return 'Modal dialog for focused interactions'
    if (componentName.toLowerCase().includes('nav')) return 'Navigation component for site structure'
    
    return 'UI component for application functionality'
  }

  extractPageName(filePath) {
    const parts = filePath.split('/')
    const filename = parts[parts.length - 2] // Get directory name for pages
    return filename?.charAt(0).toUpperCase() + filename?.slice(1) || 'Page'
  }
}

// CLI usage
if (require.main === module) {
  const generator = new AIDocumentationGenerator()
  const filePath = process.argv[2]
  
  if (!filePath) {
    console.error('Usage: node ai-doc-generator.js <file-path>')
    process.exit(1)
  }
  
  generator.generateDocumentation(filePath)
    .then(docs => {
      console.log(\`✅ Generated \${docs.length} documentation files\`)
      docs.forEach(doc => console.log(\`  - \${doc.title} (\${doc.type})\`))
    })
    .catch(error => {
      console.error('Generation failed:', error)
      process.exit(1)
    })
}

module.exports = AIDocumentationGenerator