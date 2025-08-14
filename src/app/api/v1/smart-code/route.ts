import { NextRequest, NextResponse } from 'next/server'
import { smartCodeEngine, SmartCodeExecution } from '@/lib/smart-code-engine'

/**
 * Smart Code API Endpoint
 * 
 * Handles execution of HERA Smart Codes for automatic business logic processing
 * Integrates with Universal 7-Table Schema for consistent data management
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const pattern = searchParams.get('pattern')
    const domain = searchParams.get('domain')

    switch (action) {
      case 'list':
        const allCodes = smartCodeEngine.getAllSmartCodes()
        return NextResponse.json({
          success: true,
          data: {
            smartCodes: allCodes,
            total: allCodes.length,
            message: 'Smart Codes retrieved successfully'
          }
        })

      case 'search':
        if (!pattern) {
          return NextResponse.json({
            success: false,
            error: 'Search pattern required'
          }, { status: 400 })
        }
        
        const searchResults = smartCodeEngine.searchSmartCodes(pattern)
        return NextResponse.json({
          success: true,
          data: {
            smartCodes: searchResults,
            total: searchResults.length,
            pattern,
            message: `Found ${searchResults.length} Smart Codes matching pattern`
          }
        })

      case 'domain':
        if (!domain) {
          return NextResponse.json({
            success: false,
            error: 'Domain parameter required'
          }, { status: 400 })
        }
        
        const domainCodes = smartCodeEngine.getSmartCodesByDomain(domain)
        return NextResponse.json({
          success: true,
          data: {
            smartCodes: domainCodes,
            total: domainCodes.length,
            domain,
            message: `Found ${domainCodes.length} Smart Codes for ${domain} domain`
          }
        })

      case 'registry':
        const registry = {
          totalCodes: smartCodeEngine.getAllSmartCodes().length,
          domains: [...new Set(smartCodeEngine.getAllSmartCodes().map(code => code.domain))],
          entities: [...new Set(smartCodeEngine.getAllSmartCodes().map(code => code.entity))],
          actions: [...new Set(smartCodeEngine.getAllSmartCodes().map(code => code.action))],
          recentlyAdded: smartCodeEngine.getAllSmartCodes()
            .sort((a, b) => b.code.localeCompare(a.code))
            .slice(0, 10)
        }
        
        return NextResponse.json({
          success: true,
          data: registry,
          message: 'Smart Code registry information'
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Available: list, search, domain, registry'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Smart Code GET error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, smart_code, data, organization_id, user_id, metadata } = body

    // Validate required fields
    if (!action) {
      return NextResponse.json({
        success: false,
        error: 'Action parameter required'
      }, { status: 400 })
    }

    switch (action) {
      case 'execute':
        if (!smart_code) {
          return NextResponse.json({
            success: false,
            error: 'Smart code parameter required for execution'
          }, { status: 400 })
        }

        if (!organization_id) {
          return NextResponse.json({
            success: false,
            error: 'Organization ID required for execution'
          }, { status: 400 })
        }

        const execution: SmartCodeExecution = {
          smartCode: smart_code,
          data: data || {},
          organizationId: organization_id,
          userId: user_id,
          metadata
        }

        const result = await smartCodeEngine.executeSmartCode(execution)
        
        return NextResponse.json({
          success: result.success,
          data: result.data,
          generatedRecords: result.generatedRecords,
          validationErrors: result.validationErrors,
          businessRules: result.businessRules,
          nextActions: result.nextActions,
          error: result.error,
          execution: {
            smartCode: smart_code,
            timestamp: new Date().toISOString(),
            organizationId: organization_id
          }
        })

      case 'generate':
        const { domain, entity, action: businessAction, businessLogic } = body
        
        if (!domain || !entity || !businessAction) {
          return NextResponse.json({
            success: false,
            error: 'Domain, entity, and action required for generation'
          }, { status: 400 })
        }

        const generatedCode = smartCodeEngine.generateSmartCode(
          domain,
          entity,
          businessAction,
          businessLogic || {
            entityType: entity.toLowerCase(),
            requiredFields: ['entity_name'],
            validation: true,
            workflow: true,
            aiInsights: true
          }
        )

        return NextResponse.json({
          success: true,
          data: generatedCode,
          message: `Smart Code generated: ${generatedCode.code}`
        })

      case 'validate':
        if (!smart_code) {
          return NextResponse.json({
            success: false,
            error: 'Smart code required for validation'
          }, { status: 400 })
        }

        const allCodes = smartCodeEngine.getAllSmartCodes()
        const codeExists = allCodes.find(code => code.code === smart_code)
        
        if (!codeExists) {
          return NextResponse.json({
            success: false,
            error: `Smart Code not found: ${smart_code}`,
            suggestions: allCodes
              .filter(code => code.code.includes(smart_code.split('.')[1] || ''))
              .slice(0, 5)
              .map(code => code.code)
          })
        }

        return NextResponse.json({
          success: true,
          data: {
            smartCode: codeExists,
            isValid: true,
            message: 'Smart Code is valid and ready for execution'
          }
        })

      case 'batch_execute':
        const { executions } = body
        
        if (!Array.isArray(executions) || executions.length === 0) {
          return NextResponse.json({
            success: false,
            error: 'Executions array required for batch execution'
          }, { status: 400 })
        }

        const batchResults = []
        for (const exec of executions) {
          const batchExecution: SmartCodeExecution = {
            smartCode: exec.smart_code,
            data: exec.data || {},
            organizationId: exec.organization_id || organization_id,
            userId: exec.user_id || user_id,
            metadata: exec.metadata
          }

          const batchResult = await smartCodeEngine.executeSmartCode(batchExecution)
          batchResults.push({
            smartCode: exec.smart_code,
            result: batchResult
          })
        }

        const successCount = batchResults.filter(r => r.result.success).length
        const failureCount = batchResults.length - successCount

        return NextResponse.json({
          success: true,
          data: {
            results: batchResults,
            summary: {
              total: batchResults.length,
              successful: successCount,
              failed: failureCount,
              successRate: `${Math.round((successCount / batchResults.length) * 100)}%`
            }
          },
          message: `Batch execution completed: ${successCount}/${batchResults.length} successful`
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Available: execute, generate, validate, batch_execute'
        }, { status: 400 })
    }

  } catch (error) {
    console.error('Smart Code POST error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { smart_code, updates } = body

    if (!smart_code || !updates) {
      return NextResponse.json({
        success: false,
        error: 'Smart code and updates required'
      }, { status: 400 })
    }

    // Mock update - implement actual update logic
    return NextResponse.json({
      success: true,
      data: {
        smartCode: smart_code,
        updates: updates,
        updatedAt: new Date().toISOString(),
        message: 'Smart Code updated successfully'
      }
    })

  } catch (error) {
    console.error('Smart Code PUT error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const smartCode = searchParams.get('smart_code')

    if (!smartCode) {
      return NextResponse.json({
        success: false,
        error: 'Smart code parameter required'
      }, { status: 400 })
    }

    // Mock deletion - implement actual deletion logic
    return NextResponse.json({
      success: true,
      data: {
        smartCode,
        deletedAt: new Date().toISOString(),
        message: 'Smart Code deleted successfully'
      }
    })

  } catch (error) {
    console.error('Smart Code DELETE error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}