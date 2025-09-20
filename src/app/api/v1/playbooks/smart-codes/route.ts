/**
 * HERA Playbooks Smart Codes API
 *
 * Provides smart code generation, validation, and management endpoints
 * for all playbook-related entities and operations.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  playbookSmartCodeService,
  PlaybookSmartCodes
} from '@/lib/playbooks/smart-codes/playbook-smart-codes'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const smartCode = searchParams.get('code')

    switch (action) {
      case 'validate':
        if (!smartCode) {
          return NextResponse.json(
            {
              error: 'Smart code parameter required for validation'
            },
            { status: 400 }
          )
        }

        const validation = playbookSmartCodeService.validateSmartCode(smartCode)

        return NextResponse.json({
          smartCode,
          validation,
          category: playbookSmartCodeService.getSmartCodeCategory(smartCode),
          isPlaybookCode: playbookSmartCodeService.isPlaybookSmartCode(smartCode)
        })

      case 'parse':
        if (!smartCode) {
          return NextResponse.json(
            {
              error: 'Smart code parameter required for parsing'
            },
            { status: 400 }
          )
        }

        const components = playbookSmartCodeService.parseSmartCode(smartCode)

        return NextResponse.json({
          smartCode,
          components,
          category: playbookSmartCodeService.getSmartCodeCategory(smartCode)
        })

      case 'templates':
        const templates = playbookSmartCodeService.getSmartCodeTemplates()

        return NextResponse.json({
          templates,
          count: Object.keys(templates).length
        })

      case 'categories':
        return NextResponse.json({
          categories: [
            'playbook_definition',
            'step_definition',
            'playbook_run',
            'step_execution',
            'contract',
            'policy',
            'compliance',
            'relationship'
          ]
        })

      default:
        return NextResponse.json(
          {
            error: 'Invalid action. Supported actions: validate, parse, templates, categories'
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Smart codes API error:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, ...params } = body

    switch (action) {
      case 'generate-playbook':
        const { industry, name, version = '1' } = params

        if (!industry || !name) {
          return NextResponse.json(
            {
              error: 'Industry and name parameters required'
            },
            { status: 400 }
          )
        }

        const playbookCode = PlaybookSmartCodes.forPlaybookDefinition(industry, name, version)
        const playbookValidation = playbookSmartCodeService.validateSmartCode(playbookCode)

        return NextResponse.json({
          smartCode: playbookCode,
          validation: playbookValidation,
          category: 'playbook_definition'
        })

      case 'generate-step':
        const { industry: stepIndustry, stepName, version: stepVersion = '1' } = params

        if (!stepIndustry || !stepName) {
          return NextResponse.json(
            {
              error: 'Industry and stepName parameters required'
            },
            { status: 400 }
          )
        }

        const stepCode = PlaybookSmartCodes.forStepDefinition(stepIndustry, stepName, stepVersion)
        const stepValidation = playbookSmartCodeService.validateSmartCode(stepCode)

        return NextResponse.json({
          smartCode: stepCode,
          validation: stepValidation,
          category: 'step_definition'
        })

      case 'generate-contract':
        const { contractType, version: contractVersion = '1' } = params

        if (
          !contractType ||
          !['input', 'output', 'step_input', 'step_output'].includes(contractType)
        ) {
          return NextResponse.json(
            {
              error: 'Valid contractType required (input, output, step_input, step_output)'
            },
            { status: 400 }
          )
        }

        const contractCode = PlaybookSmartCodes.forContract(contractType, contractVersion)
        const contractValidation = playbookSmartCodeService.validateSmartCode(contractCode)

        return NextResponse.json({
          smartCode: contractCode,
          validation: contractValidation,
          category: 'contract'
        })

      case 'generate-policy':
        const { policyType, version: policyVersion = '1' } = params

        if (
          !policyType ||
          !['sla', 'quorum', 'segregation', 'approval', 'retry'].includes(policyType)
        ) {
          return NextResponse.json(
            {
              error: 'Valid policyType required (sla, quorum, segregation, approval, retry)'
            },
            { status: 400 }
          )
        }

        const policyCode = PlaybookSmartCodes.forPolicy(policyType, policyVersion)
        const policyValidation = playbookSmartCodeService.validateSmartCode(policyCode)

        return NextResponse.json({
          smartCode: policyCode,
          validation: policyValidation,
          category: 'policy'
        })

      case 'next-version':
        const { smartCode: originalCode } = params

        if (!originalCode) {
          return NextResponse.json(
            {
              error: 'Smart code parameter required'
            },
            { status: 400 }
          )
        }

        const nextVersionCode = playbookSmartCodeService.generateNextVersion(originalCode)
        const nextVersionValidation = playbookSmartCodeService.validateSmartCode(nextVersionCode)

        return NextResponse.json({
          originalCode,
          nextVersionCode,
          validation: nextVersionValidation
        })

      case 'batch-validate':
        const { smartCodes } = params

        if (!Array.isArray(smartCodes)) {
          return NextResponse.json(
            {
              error: 'smartCodes array parameter required'
            },
            { status: 400 }
          )
        }

        const batchResults = smartCodes.map(code => ({
          smartCode: code,
          validation: playbookSmartCodeService.validateSmartCode(code),
          category: playbookSmartCodeService.getSmartCodeCategory(code)
        }))

        const validCount = batchResults.filter(r => r.validation.valid).length

        return NextResponse.json({
          results: batchResults,
          summary: {
            total: batchResults.length,
            valid: validCount,
            invalid: batchResults.length - validCount,
            validationRate: (validCount / batchResults.length) * 100
          }
        })

      default:
        return NextResponse.json(
          {
            error:
              'Invalid action. Supported actions: generate-playbook, generate-step, generate-contract, generate-policy, next-version, batch-validate'
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Smart codes POST API error:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { smartCode, updates } = body

    if (!smartCode) {
      return NextResponse.json(
        {
          error: 'Smart code parameter required'
        },
        { status: 400 }
      )
    }

    // Parse current smart code
    const components = playbookSmartCodeService.parseSmartCode(smartCode)

    if (!components) {
      return NextResponse.json(
        {
          error: 'Invalid smart code format'
        },
        { status: 400 }
      )
    }

    // Apply updates
    const updatedComponents = { ...components, ...updates }

    // Reconstruct smart code
    const updatedCode = `${updatedComponents.prefix}.${updatedComponents.industry}.${updatedComponents.module}.${updatedComponents.type}.${updatedComponents.subtype}.V${updatedComponents.version}`

    // Validate updated code
    const validation = playbookSmartCodeService.validateSmartCode(updatedCode)

    return NextResponse.json({
      originalCode: smartCode,
      updatedCode,
      components: updatedComponents,
      validation
    })
  } catch (error) {
    console.error('Smart codes PUT API error:', error)

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
