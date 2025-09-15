import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { existsSync } from 'fs'
import path from 'path'

/**
 * HERA Module Generator API
 *
 * Safely execute npm template generation from frontend
 * Provides secure interface to CLI generator system
 */

// Allowed module names for security
const ALLOWED_MODULES = [
  'orders',
  'staff',
  'inventory',
  'menu',
  'kitchen',
  'delivery',
  'customers',
  'suppliers',
  'bom',
  'production',
  'patients',
  'products'
]

// Allowed business types
const ALLOWED_BUSINESS_TYPES = ['restaurant', 'manufacturing', 'healthcare', 'retail']

// POST /api/v1/development/generate - Generate individual module
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { moduleName, businessType = 'restaurant', customName, customDescription } = body

    // Validation
    if (!moduleName) {
      return NextResponse.json(
        { success: false, message: 'Module name is required' },
        { status: 400 }
      )
    }

    // Security: Only allow predefined modules or custom names with validation
    const moduleToGenerate = customName || moduleName
    const sanitizedModuleName = moduleToGenerate.toLowerCase().replace(/[^a-z0-9-]/g, '')

    if (!customName && !ALLOWED_MODULES.includes(moduleName)) {
      return NextResponse.json({ success: false, message: 'Invalid module name' }, { status: 400 })
    }

    if (!ALLOWED_BUSINESS_TYPES.includes(businessType)) {
      return NextResponse.json(
        { success: false, message: 'Invalid business type' },
        { status: 400 }
      )
    }

    // Prepare generation command - call script directly to avoid npm argument passing issues
    const command = `node scripts/generate-module.js --name=${sanitizedModuleName} --type=${businessType}`

    console.log(`🚀 Generating module: ${sanitizedModuleName} (${businessType})`)
    console.log(`Command: ${command}`)

    // Execute generation in safe environment
    try {
      const output = execSync(command, {
        cwd: process.cwd(),
        encoding: 'utf8',
        timeout: 60000, // 60 second timeout
        env: {
          ...process.env,
          NODE_ENV: 'development'
        }
      })

      console.log('Generation output:', output)

      // Verify module was created
      const modulePaths = [
        path.join(process.cwd(), 'src', 'app', 'restaurant', sanitizedModuleName),
        path.join(process.cwd(), 'src', 'app', 'api', 'v1', sanitizedModuleName)
      ]

      const moduleExists = modulePaths.some(p => existsSync(p))

      if (!moduleExists) {
        throw new Error('Module generation completed but files not found')
      }

      return NextResponse.json({
        success: true,
        data: {
          moduleName: sanitizedModuleName,
          businessType,
          generatedAt: new Date().toISOString(),
          paths: {
            ui: `/restaurant/${sanitizedModuleName}`,
            api: `/api/v1/${sanitizedModuleName}`,
            dashboard: `/restaurant/${sanitizedModuleName}/dashboard`,
            form: `/restaurant/${sanitizedModuleName}/form`
          },
          output: output
        },
        message: `${sanitizedModuleName} module generated successfully!`
      })
    } catch (execError) {
      console.error('Generation execution error:', execError)

      return NextResponse.json(
        {
          success: false,
          message: 'Module generation failed',
          error: execError.message,
          details: execError.toString()
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

// GET /api/v1/development/generate - Get generation status and available templates
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'templates') {
      // Return available templates
      return NextResponse.json({
        success: true,
        data: {
          modules: ALLOWED_MODULES,
          businessTypes: ALLOWED_BUSINESS_TYPES,
          quickSystems: [
            {
              id: 'restaurant-complete',
              name: 'Complete Restaurant System',
              modules: ['orders', 'staff', 'inventory', 'menu', 'kitchen', 'delivery'],
              estimatedTime: '3 minutes'
            }
          ]
        }
      })
    }

    if (action === 'status') {
      // Check if generator is available
      try {
        const generatorPath = path.join(process.cwd(), 'scripts', 'generate-module.js')
        const generatorExists = existsSync(generatorPath)

        return NextResponse.json({
          success: true,
          data: {
            generatorAvailable: generatorExists,
            allowedModules: ALLOWED_MODULES,
            allowedBusinessTypes: ALLOWED_BUSINESS_TYPES
          }
        })
      } catch (error) {
        return NextResponse.json({
          success: false,
          message: 'Generator status check failed',
          error: error.message
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: 'HERA Module Generator API is ready',
      endpoints: {
        generate: 'POST /api/v1/development/generate',
        templates: 'GET /api/v1/development/generate?action=templates',
        status: 'GET /api/v1/development/generate?action=status'
      }
    })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
