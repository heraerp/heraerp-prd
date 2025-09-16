import { NextRequest, NextResponse } from 'next/server'
import { BYOCService, BYOCConfiguration } from '@/src/lib/universal/byoc-service'

// Initialize BYOC service
const byocService = new BYOCService()

// Mock storage for configurations (in production, use database)
let mockConfigurations: Record<string, BYOCConfiguration[]> = {}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get('applicationId')
    const organizationId = searchParams.get('organizationId')
    const action = searchParams.get('action')

    if (!applicationId || !organizationId) {
      return NextResponse.json(
        { success: false, error: 'applicationId and organizationId are required' },
        { status: 400 }
      )
    }

    const configKey = `${applicationId}:${organizationId}`

    if (action === 'health') {
      const healthStatus = await byocService.performHealthCheck(applicationId, organizationId)

      return NextResponse.json({
        success: true,
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          applicationId,
          organizationId,
          ...healthStatus,
          version: '1.0.0'
        },
        message: 'BYOC health check completed'
      })
    }

    if (action === 'providers') {
      const providers = await byocService.getProviders()

      return NextResponse.json({
        success: true,
        data: { providers },
        message: 'Supported providers retrieved successfully'
      })
    }

    if (action === 'active') {
      const configs = mockConfigurations[configKey] || []
      const activeConfig = configs.find(c => c.metadata.isActive)

      return NextResponse.json({
        success: true,
        data: activeConfig || null,
        message: activeConfig ? 'Active configuration found' : 'No active configuration'
      })
    }

    // Default: return all configurations
    const configurations = mockConfigurations[configKey] || []

    // Filter out sensitive data for non-admin users
    const userRole = request.headers.get('x-user-role') || 'user'
    const sanitizedConfigs = configurations.map(config => ({
      ...config,
      encryptedSecrets: userRole === 'admin' ? config.encryptedSecrets : '***REDACTED***',
      config:
        userRole === 'admin'
          ? config.config
          : Object.keys(config.config).reduce(
              (acc, key) => {
                // Hide sensitive values for non-admin users
                const providers = byocService.getProviders()
                const provider = providers.find((p: any) => p.id === config.provider)
                const field = provider?.configSchema.find((f: any) => f.name === key)

                if (field?.sensitive && userRole !== 'admin') {
                  acc[key] = '***HIDDEN***'
                } else {
                  acc[key] = config.config[key]
                }
                return acc
              },
              {} as Record<string, any>
            )
    }))

    return NextResponse.json({
      success: true,
      data: sanitizedConfigs,
      message: 'Configurations retrieved successfully'
    })
  } catch (error) {
    console.error('Error in BYOC GET:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { applicationId, organizationId, userId, config, action = 'save' } = body

    if (!applicationId || !organizationId || !userId) {
      return NextResponse.json(
        { success: false, error: 'applicationId, organizationId, and userId are required' },
        { status: 400 }
      )
    }

    const configKey = `${applicationId}:${organizationId}`

    if (action === 'save') {
      if (!config) {
        return NextResponse.json(
          { success: false, error: 'Configuration data is required' },
          { status: 400 }
        )
      }

      // Use BYOC service to save configuration
      const result = await byocService.saveConfiguration(
        applicationId,
        organizationId,
        userId,
        config
      )

      if (result.success) {
        // Store in mock storage
        if (!mockConfigurations[configKey]) {
          mockConfigurations[configKey] = []
        }

        const existingIndex = mockConfigurations[configKey].findIndex(c => c.id === result.data!.id)
        if (existingIndex >= 0) {
          mockConfigurations[configKey][existingIndex] = result.data!
        } else {
          mockConfigurations[configKey].push(result.data!)
        }

        return NextResponse.json({
          success: true,
          data: result.data,
          message: 'Configuration saved successfully',
          audit: {
            action: existingIndex >= 0 ? 'updated' : 'created',
            timestamp: new Date().toISOString(),
            userId
          }
        })
      } else {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 })
      }
    }

    if (action === 'import') {
      const { jsonData } = body
      if (!jsonData) {
        return NextResponse.json(
          { success: false, error: 'JSON data is required for import' },
          { status: 400 }
        )
      }

      const result = await byocService.importConfiguration(
        jsonData,
        applicationId,
        organizationId,
        userId
      )

      if (result.success) {
        // Store in mock storage
        if (!mockConfigurations[configKey]) {
          mockConfigurations[configKey] = []
        }
        mockConfigurations[configKey].push(result.data!)

        return NextResponse.json({
          success: true,
          data: result.data,
          message: 'Configuration imported successfully'
        })
      } else {
        return NextResponse.json({ success: false, error: result.error }, { status: 400 })
      }
    }

    if (action === 'export') {
      const { configId, includeSecrets = false } = body
      if (!configId) {
        return NextResponse.json(
          { success: false, error: 'Configuration ID is required for export' },
          { status: 400 }
        )
      }

      const configs = mockConfigurations[configKey] || []
      const config = configs.find(c => c.id === configId)

      if (!config) {
        return NextResponse.json(
          { success: false, error: 'Configuration not found' },
          { status: 404 }
        )
      }

      const exportData = byocService.exportConfiguration(config, includeSecrets)

      return NextResponse.json({
        success: true,
        data: {
          exportData,
          filename: `byoc-config-${config.name.replace(/\s+/g, '-').toLowerCase()}.json`,
          timestamp: new Date().toISOString()
        },
        message: 'Configuration exported successfully'
      })
    }

    return NextResponse.json(
      { success: false, error: `Unknown action: ${action}` },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in BYOC POST:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { applicationId, organizationId, configId, updates, userId } = body

    if (!applicationId || !organizationId || !configId || !updates || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'applicationId, organizationId, configId, updates, and userId are required'
        },
        { status: 400 }
      )
    }

    const configKey = `${applicationId}:${organizationId}`
    const configs = mockConfigurations[configKey] || []
    const configIndex = configs.findIndex(c => c.id === configId)

    if (configIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Configuration not found' },
        { status: 404 }
      )
    }

    // Update configuration
    const updatedConfig = {
      ...configs[configIndex],
      ...updates,
      metadata: {
        ...configs[configIndex].metadata,
        ...updates.metadata,
        updatedAt: new Date().toISOString()
      }
    }

    // Re-encrypt secrets if config changed
    if (updates.config) {
      const providers = await byocService.getProviders()
      const provider = providers.find(p => p.id === updatedConfig.provider)

      if (provider) {
        const secrets: Record<string, any> = {}
        const regularConfig: Record<string, any> = {}

        Object.entries(updates.config).forEach(([key, value]) => {
          const field = provider.configSchema.find(f => f.name === key)
          if (field?.sensitive) {
            secrets[key] = value
          } else {
            regularConfig[key] = value
          }
        })

        if (Object.keys(secrets).length > 0) {
          updatedConfig.encryptedSecrets = await byocService.encryptSecrets(secrets)
        }
        updatedConfig.config = { ...updatedConfig.config, ...regularConfig }
      }
    }

    mockConfigurations[configKey][configIndex] = updatedConfig

    return NextResponse.json({
      success: true,
      data: updatedConfig,
      message: 'Configuration updated successfully',
      audit: {
        action: 'updated',
        updatedFields: Object.keys(updates),
        timestamp: new Date().toISOString(),
        userId
      }
    })
  } catch (error) {
    console.error('Error in BYOC PUT:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get('applicationId')
    const organizationId = searchParams.get('organizationId')
    const configId = searchParams.get('configId')
    const userId = searchParams.get('userId')

    if (!applicationId || !organizationId || !configId || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'applicationId, organizationId, configId, and userId are required'
        },
        { status: 400 }
      )
    }

    const configKey = `${applicationId}:${organizationId}`
    const configs = mockConfigurations[configKey] || []
    const configIndex = configs.findIndex(c => c.id === configId)

    if (configIndex === -1) {
      return NextResponse.json(
        { success: false, error: 'Configuration not found' },
        { status: 404 }
      )
    }

    const deletedConfig = configs[configIndex]

    // Don't allow deletion of active configurations
    if (deletedConfig.metadata.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot delete active configuration. Activate another configuration first.'
        },
        { status: 400 }
      )
    }

    // Remove from storage
    mockConfigurations[configKey].splice(configIndex, 1)

    return NextResponse.json({
      success: true,
      message: 'Configuration deleted successfully',
      audit: {
        action: 'deleted',
        configName: deletedConfig.name,
        timestamp: new Date().toISOString(),
        userId
      }
    })
  } catch (error) {
    console.error('Error in BYOC DELETE:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
