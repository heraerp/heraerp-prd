import { NextRequest, NextResponse } from 'next/server'

// Mock storage reference (same as main BYOC route)
// In production, this would be replaced with actual database operations
declare global {
  var mockConfigurations: Record<string, any[]> | undefined;
}

if (!global.mockConfigurations) {
  global.mockConfigurations = {}
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { applicationId, organizationId, configId, userId } = body

    if (!applicationId || !organizationId || !configId || !userId) {
      return NextResponse.json(
        { success: false, error: 'applicationId, organizationId, configId, and userId are required' },
        { status: 400 }
      )
    }

    const configKey = `${applicationId}:${organizationId}`
    const configs = global.mockConfigurations![configKey] || []
    
    // Check if the configuration exists
    const targetConfig = configs.find((c: any) => c.id === configId)
    if (!targetConfig) {
      return NextResponse.json(
        { success: false, error: 'Configuration not found' },
        { status: 404 }
      )
    }

    // Deactivate all configurations first
    configs.forEach((config: any) => {
      config.metadata.isActive = false
      config.metadata.updatedAt = new Date().toISOString()
    })

    // Activate the target configuration
    targetConfig.metadata.isActive = true
    targetConfig.metadata.updatedAt = new Date().toISOString()
    targetConfig.audit.accessCount += 1
    targetConfig.audit.lastAccessed = new Date().toISOString()

    // Update storage
    global.mockConfigurations![configKey] = configs

    // Create audit log entry
    const auditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      applicationId,
      organizationId,
      configId,
      userId,
      action: 'activate_configuration',
      details: {
        configName: targetConfig.name,
        provider: targetConfig.provider,
        previousActiveConfig: configs.find((c: any) => c.id !== configId && c.metadata.isActive)?.id
      },
      success: true,
      timestamp: new Date().toISOString(),
      heraSmartCode: 'HERA.UNIVERSAL.BYOC.CONFIG.ACTIVATED.v1'
    }

    console.log('BYOC Configuration Activated:', auditEntry)

    return NextResponse.json({
      success: true,
      data: {
        activatedConfig: targetConfig,
        activeConfigId: configId,
        previousActiveConfig: null // Would track this in production
      },
      message: `Configuration '${targetConfig.name}' activated successfully`,
      audit: auditEntry
    })
  } catch (error) {
    console.error('Error activating BYOC configuration:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to activate configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get('applicationId')
    const organizationId = searchParams.get('organizationId')

    if (!applicationId || !organizationId) {
      return NextResponse.json(
        { success: false, error: 'applicationId and organizationId are required' },
        { status: 400 }
      )
    }

    const configKey = `${applicationId}:${organizationId}`
    const configs = global.mockConfigurations![configKey] || []
    
    // Find active configuration
    const activeConfig = configs.find((c: any) => c.metadata.isActive)

    return NextResponse.json({
      success: true,
      data: {
        activeConfig: activeConfig || null,
        hasActiveConfig: !!activeConfig,
        totalConfigurations: configs.length,
        inactiveConfigurations: configs.filter((c: any) => !c.metadata.isActive).length
      },
      message: activeConfig 
        ? `Active configuration: ${activeConfig.name}` 
        : 'No active configuration found'
    })
  } catch (error) {
    console.error('Error getting active BYOC configuration:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to get active configuration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}