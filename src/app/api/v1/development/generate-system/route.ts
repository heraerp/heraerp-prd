import { NextRequest, NextResponse } from 'next/server'
import { execSync } from 'child_process'
import { existsSync } from 'fs'
import path from 'path'

/**
 * HERA Complete System Generator API
 * 
 * Generate complete business systems (multiple modules at once)
 * Uses quick generation commands from package.json
 */

// System definitions
const AVAILABLE_SYSTEMS = {
  'restaurant-complete': {
    name: 'Complete Restaurant System',
    command: 'npm run quick:restaurant-complete',
    modules: ['inventory', 'menu', 'staff', 'suppliers'],
    description: 'Generate complete restaurant ERP system',
    estimatedTime: '3 minutes'
  }
}

// POST /api/v1/development/generate-system - Generate complete business system
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { moduleName: systemId, businessType = 'restaurant' } = body

    // Validation
    if (!systemId) {
      return NextResponse.json(
        { success: false, message: 'System ID is required' },
        { status: 400 }
      )
    }

    const system = AVAILABLE_SYSTEMS[systemId]
    if (!system) {
      return NextResponse.json(
        { success: false, message: 'Invalid system ID' },
        { status: 400 }
      )
    }

    console.log(`🚀 Generating complete system: ${system.name}`)
    console.log(`Command: ${system.command}`)

    // Execute system generation
    try {
      const output = execSync(system.command, {
        cwd: process.cwd(),
        encoding: 'utf8',
        timeout: 300000, // 5 minute timeout for complete systems
        env: {
          ...process.env,
          NODE_ENV: 'development'
        }
      })

      console.log('System generation output:', output)

      // Verify modules were created
      const verificationResults = system.modules.map(moduleName => {
        const modulePaths = [
          path.join(process.cwd(), 'src', 'app', 'restaurant', moduleName),
          path.join(process.cwd(), 'src', 'app', 'api', 'v1', moduleName)
        ]
        
        const exists = modulePaths.some(p => existsSync(p))
        return { moduleName, exists, paths: modulePaths }
      })

      const allModulesCreated = verificationResults.every(result => result.exists)
      const createdModules = verificationResults.filter(result => result.exists)

      return NextResponse.json({
        success: true,
        data: {
          systemId,
          systemName: system.name,
          businessType,
          generatedAt: new Date().toISOString(),
          modules: createdModules.map(module => ({
            name: module.moduleName,
            ui: `/restaurant/${module.moduleName}`,
            api: `/api/v1/${module.moduleName}`,
            dashboard: `/restaurant/${module.moduleName}/dashboard`,
            form: `/restaurant/${module.moduleName}/form`
          })),
          totalModules: system.modules.length,
          successfulModules: createdModules.length,
          allSuccess: allModulesCreated,
          output: output,
          nextSteps: [
            'Visit restaurant dashboard to see all modules',
            'Test individual module forms',
            'Customize generated components as needed'
          ]
        },
        message: allModulesCreated 
          ? `Complete ${system.name} generated successfully!`
          : `System partially generated: ${createdModules.length}/${system.modules.length} modules created`
      })

    } catch (execError) {
      console.error('System generation execution error:', execError)
      
      return NextResponse.json(
        { 
          success: false, 
          message: 'System generation failed',
          error: execError.message,
          details: execError.toString(),
          systemId,
          systemName: system.name
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

// GET /api/v1/development/generate-system - Get available systems
export async function GET(request: NextRequest) {
  try {
    const systems = Object.entries(AVAILABLE_SYSTEMS).map(([id, system]) => ({
      id,
      ...system
    }))

    return NextResponse.json({
      success: true,
      data: {
        systems,
        totalSystems: systems.length
      },
      message: 'Available complete systems'
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}