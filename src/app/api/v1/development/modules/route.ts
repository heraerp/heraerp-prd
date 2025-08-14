import { NextRequest, NextResponse } from 'next/server'
import { readdirSync, statSync, existsSync, readFileSync } from 'fs'
import path from 'path'

/**
 * HERA Generated Modules API
 * 
 * Track and manage generated modules
 * Provides information about existing modules and their status
 */

// GET /api/v1/development/modules - Get list of generated modules
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const businessType = searchParams.get('business_type') || 'restaurant'

    // Scan for generated modules
    const modulesPath = path.join(process.cwd(), 'src', 'app', businessType)
    const apiPath = path.join(process.cwd(), 'src', 'app', 'api', 'v1')

    if (!existsSync(modulesPath)) {
      return NextResponse.json({
        success: true,
        data: [],
        message: `No ${businessType} modules found`
      })
    }

    const modules = []
    const moduleDirectories = readdirSync(modulesPath).filter(item => {
      const itemPath = path.join(modulesPath, item)
      return statSync(itemPath).isDirectory()
    })

    for (const moduleName of moduleDirectories) {
      try {
        const moduleConfigPath = path.join(modulesPath, moduleName, 'module.config.json')
        const moduleUIPath = path.join(modulesPath, moduleName)
        const moduleAPIPath = path.join(apiPath, moduleName)

        // Check if it's a generated module (has config file)
        if (existsSync(moduleConfigPath)) {
          const configContent = readFileSync(moduleConfigPath, 'utf8')
          const config = JSON.parse(configContent)

          // Get module stats
          const uiPages = existsSync(moduleUIPath) 
            ? readdirSync(moduleUIPath).filter(item => 
                statSync(path.join(moduleUIPath, item)).isDirectory()
              ) 
            : []

          const apiEndpoints = existsSync(moduleAPIPath)
            ? readdirSync(moduleAPIPath).filter(item => 
                statSync(path.join(moduleAPIPath, item)).isDirectory()
              )
            : []

          modules.push({
            name: config.name || moduleName,
            id: moduleName,
            type: config.type || businessType,
            description: config.customerDescription || config.description,
            generatedAt: config.generatedAt,
            generatedBy: config.generatedBy,
            version: config.version,
            status: 'active',
            paths: {
              ui: `/${businessType}/${moduleName}`,
              api: `/api/v1/${moduleName}`,
              dashboard: `/${businessType}/${moduleName}/dashboard`,
              form: `/${businessType}/${moduleName}/form`,
              list: `/${businessType}/${moduleName}/list`,
              reports: `/${businessType}/${moduleName}/reports`
            },
            stats: {
              uiPages: uiPages.length,
              apiEndpoints: apiEndpoints.length,
              totalFiles: uiPages.length + apiEndpoints.length
            },
            features: {
              hasUI: uiPages.length > 0,
              hasAPI: apiEndpoints.length > 0,
              hasDashboard: uiPages.includes('dashboard'),
              hasForm: uiPages.includes('form'),
              hasList: uiPages.includes('list'),
              hasReports: uiPages.includes('reports')
            }
          })
        }
      } catch (error) {
        console.error(`Error processing module ${moduleName}:`, error)
        // Continue processing other modules
      }
    }

    // Sort by generation date (newest first)
    modules.sort((a, b) => new Date(b.generatedAt) - new Date(a.generatedAt))

    return NextResponse.json({
      success: true,
      data: modules,
      count: modules.length,
      businessType,
      summary: {
        totalModules: modules.length,
        byType: modules.reduce((acc, module) => {
          acc[module.type] = (acc[module.type] || 0) + 1
          return acc
        }, {}),
        recentModules: modules.slice(0, 5).map(m => ({
          name: m.name,
          generatedAt: m.generatedAt
        }))
      }
    })

  } catch (error) {
    console.error('Error loading modules:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to load modules', error: error.message },
      { status: 500 }
    )
  }
}

// POST /api/v1/development/modules - Register a new module (for tracking)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { moduleName, businessType, metadata } = body

    // This endpoint can be used to register modules that were generated
    // or to update module metadata
    
    return NextResponse.json({
      success: true,
      message: 'Module registration not implemented yet',
      data: { moduleName, businessType, metadata }
    })

  } catch (error) {
    console.error('Error registering module:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to register module' },
      { status: 500 }
    )
  }
}

// DELETE /api/v1/development/modules - Remove a generated module
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const moduleName = searchParams.get('module')
    const businessType = searchParams.get('business_type') || 'restaurant'

    if (!moduleName) {
      return NextResponse.json(
        { success: false, message: 'Module name is required' },
        { status: 400 }
      )
    }

    // For security, we'll only mark modules as deleted rather than actually deleting files
    // Real file deletion should be done through careful administrative processes
    
    return NextResponse.json({
      success: true,
      message: 'Module deletion not implemented - use file system for manual cleanup',
      data: { moduleName, businessType }
    })

  } catch (error) {
    console.error('Error deleting module:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete module' },
      { status: 500 }
    )
  }
}