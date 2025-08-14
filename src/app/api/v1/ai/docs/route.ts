import { NextRequest, NextResponse } from 'next/server'
import { universalAI, AI_SMART_CODES } from '@/lib/ai/universal-ai'

// HERA AI Documentation Generator
// Automatically generates documentation from code, APIs, and system components

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, content, type, context } = body

    if (!action || !content) {
      return NextResponse.json({
        success: false,
        error: 'Action and content are required',
        smart_code: 'HERA.AI.DOCS.ERROR.MISSING_PARAMS.v1',
        timestamp: new Date().toISOString()
      }, { status: 400 })
    }

    switch (action) {
      case 'generate_api_docs':
        const apiDocsResult = await universalAI.processRequest({
          smart_code: 'HERA.AI.DOCS.API.GENERATE.v1',
          task_type: 'analysis',
          prompt: `Generate comprehensive API documentation for this code:

${content}

Include:
- Endpoint description and purpose
- Request/response examples
- Parameter documentation
- Error handling
- Smart Code references
- Usage examples

Context: ${context || 'HERA Universal API'}`,
          max_tokens: 2000,
          temperature: 0.3,
          fallback_enabled: true
        })

        return NextResponse.json(apiDocsResult)

      case 'generate_component_docs':
        const componentDocsResult = await universalAI.processRequest({
          smart_code: 'HERA.AI.DOCS.COMPONENT.GENERATE.v1',
          task_type: 'analysis',
          prompt: `Generate comprehensive component documentation for this React component:

${content}

Include:
- Component overview and purpose
- Props interface documentation
- Usage examples
- Integration patterns
- Best practices
- Accessibility considerations

Context: ${context || 'HERA Universal Component'}`,
          max_tokens: 1500,
          temperature: 0.3,
          fallback_enabled: true
        })

        return NextResponse.json(componentDocsResult)

      case 'generate_smart_code_docs':
        const smartCodeDocsResult = await universalAI.processRequest({
          smart_code: 'HERA.AI.DOCS.SMART_CODE.GENERATE.v1',
          task_type: 'analysis',
          prompt: `Analyze and document these HERA Smart Codes:

${content}

Generate documentation including:
- Smart Code purpose and classification
- Usage patterns and examples
- Integration with universal architecture
- Business logic mapping
- Version evolution

Context: ${context || 'HERA Smart Code System'}`,
          max_tokens: 1800,
          temperature: 0.3,
          fallback_enabled: true
        })

        return NextResponse.json(smartCodeDocsResult)

      case 'generate_user_guide':
        const userGuideResult = await universalAI.processRequest({
          smart_code: 'HERA.AI.DOCS.USER_GUIDE.GENERATE.v1',
          task_type: 'analysis',
          prompt: `Create a user-friendly guide for this feature:

${content}

Generate documentation including:
- Step-by-step instructions
- Screenshots/UI descriptions
- Common use cases
- Troubleshooting tips
- Best practices
- Business benefits

Write in simple, non-technical language for business users.
Context: ${context || 'HERA Business Feature'}`,
          max_tokens: 2000,
          temperature: 0.4,
          fallback_enabled: true
        })

        return NextResponse.json(userGuideResult)

      case 'analyze_code_quality':
        const codeAnalysisResult = await universalAI.processRequest({
          smart_code: 'HERA.AI.DOCS.CODE_ANALYSIS.v1',
          task_type: 'analysis',
          prompt: `Analyze this code for quality, patterns, and documentation needs:

${content}

Provide analysis on:
- Code quality and best practices
- Security considerations
- Performance implications
- Documentation gaps
- Improvement suggestions
- HERA architecture compliance

Context: ${context || 'HERA Codebase Analysis'}`,
          max_tokens: 1500,
          temperature: 0.2,
          fallback_enabled: true
        })

        return NextResponse.json(codeAnalysisResult)

      case 'generate_changelog':
        const changelogResult = await universalAI.processRequest({
          smart_code: 'HERA.AI.DOCS.CHANGELOG.GENERATE.v1',
          task_type: 'analysis',
          prompt: `Generate a professional changelog entry from these changes:

${content}

Format as:
- Clear feature descriptions
- Bug fix summaries
- Breaking changes (if any)
- Migration instructions
- Impact assessment

Use conventional commit format and clear business language.
Context: ${context || 'HERA System Update'}`,
          max_tokens: 1000,
          temperature: 0.3,
          fallback_enabled: true
        })

        return NextResponse.json(changelogResult)

      case 'generate_architecture_docs':
        const architectureDocsResult = await universalAI.processRequest({
          smart_code: 'HERA.AI.DOCS.ARCHITECTURE.GENERATE.v1',
          task_type: 'analysis',
          prompt: `Document the architecture and design patterns in this system:

${content}

Include:
- System architecture overview
- Data flow diagrams (text descriptions)
- Component relationships  
- Universal table integration
- Smart Code patterns
- Scalability considerations
- Security architecture

Context: ${context || 'HERA Universal Architecture'}`,
          max_tokens: 2500,
          temperature: 0.2,
          fallback_enabled: true
        })

        return NextResponse.json(architectureDocsResult)

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown documentation action: ${action}`,
          available_actions: [
            'generate_api_docs',
            'generate_component_docs',
            'generate_smart_code_docs',
            'generate_user_guide',
            'analyze_code_quality',
            'generate_changelog',
            'generate_architecture_docs'
          ],
          smart_code: 'HERA.AI.DOCS.ERROR.UNKNOWN_ACTION.v1',
          timestamp: new Date().toISOString()
        }, { status: 400 })
    }

  } catch (error) {
    console.error('AI Documentation Error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to generate documentation',
      details: error instanceof Error ? error.message : 'Unknown error',
      smart_code: 'HERA.AI.DOCS.ERROR.GENERATION.v1',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Get documentation system status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'capabilities':
        return NextResponse.json({
          success: true,
          data: {
            documentation_types: [
              'API Documentation',
              'Component Documentation', 
              'Smart Code Documentation',
              'User Guides',
              'Code Quality Analysis',
              'Changelog Generation',
              'Architecture Documentation'
            ],
            supported_formats: ['Markdown', 'HTML', 'JSON', 'Plain Text'],
            ai_features: [
              'Automatic code analysis',
              'Context-aware documentation',
              'Multi-language support',
              'Quality scoring',
              'Consistency checking',
              'Business-friendly language'
            ],
            integration_points: [
              'Git commit hooks',
              'CI/CD pipelines',
              'Development workflow',
              'API discovery',
              'Component catalog'
            ]
          },
          smart_code: 'HERA.AI.DOCS.CAPABILITIES.v1',
          timestamp: new Date().toISOString()
        })

      default:
        return NextResponse.json({
          success: true,
          data: {
            message: 'HERA AI Documentation Generator is operational',
            version: '1.0.0',
            endpoints: {
              'POST /api/v1/ai/docs': 'Generate documentation',
              'GET /api/v1/ai/docs?action=capabilities': 'Get system capabilities'
            },
            usage_example: {
              action: 'generate_api_docs',
              content: 'Your code here',
              type: 'typescript',
              context: 'HERA Universal API'
            }
          },
          smart_code: 'HERA.AI.DOCS.INFO.v1',
          timestamp: new Date().toISOString()
        })
    }

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to process documentation request',
      details: error instanceof Error ? error.message : 'Unknown error',
      smart_code: 'HERA.AI.DOCS.ERROR.REQUEST.v1',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}