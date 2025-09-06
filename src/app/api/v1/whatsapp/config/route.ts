import { NextRequest, NextResponse } from 'next/server'
import { UniversalConfigService } from '@/lib/whatsapp/universal-config-service'
import { universalApi } from '@/lib/universal-api'

// Universal Configuration API for WhatsApp + MCP + AI
// Customers have full control without hardcoding

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const organizationId = searchParams.get('organization_id') || 
                          process.env.DEFAULT_ORGANIZATION_ID ||
                          'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258'
    
    const configService = new UniversalConfigService(organizationId)
    const configurations = await configService.loadConfigurations()
    
    // Test all providers
    const providerTests: Record<string, any> = {}
    if (configurations.routing?.providers) {
      for (const provider of configurations.routing.providers) {
        providerTests[provider.name] = await configService.testProviderConfig(provider.name)
      }
    }
    
    return NextResponse.json({
      success: true,
      organization_id: organizationId,
      configurations,
      provider_tests: providerTests,
      smart_codes: {
        whatsapp_channel: 'HERA.COMMS.WHATSAPP.CONFIG.V1',
        ai_routing: 'HERA.AI.ROUTING.CONFIG.V1',
        mcp_toolmap: 'HERA.MCP.TOOLMAP.CONFIG.V1',
        ai_prompts: 'HERA.AI.PROMPT.CONFIG.V1',
        keywords: 'HERA.COMMS.WHATSAPP.KEYWORDS.V1'
      },
      message: 'All configurations loaded from Sacred Six tables - zero hardcoding!'
    })
    
  } catch (error) {
    console.error('Config API error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to load WhatsApp configurations',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, organization_id, config_type, config_data } = body
    
    const orgId = organization_id || process.env.DEFAULT_ORGANIZATION_ID
    if (!orgId) {
      return NextResponse.json({ 
        success: false,
        error: 'Organization ID required'
      }, { status: 400 })
    }

    const configService = new UniversalConfigService(orgId)
    
    switch (action) {
      case 'setup_defaults':
        return await setupDefaultConfigs(configService, orgId, body.phone_number)
        
      case 'upsert_channel':
        return await upsertChannelConfig(configService, config_data)
        
      case 'upsert_routing':
        return await upsertRoutingConfig(configService, config_data)
        
      case 'test_provider':
        return await testProviderConfig(configService, body.provider_name)
        
      case 'link_configs':
        return await linkConfigs(configService, body.from_id, body.to_id)
        
      case 'toggle_provider':
        return await toggleProvider(configService, orgId, body.provider_name, body.enabled)
        
      default:
        return NextResponse.json({
          success: false,
          error: 'Unknown action',
          supported_actions: [
            'setup_defaults', 'upsert_channel', 'upsert_routing', 
            'test_provider', 'link_configs', 'toggle_provider'
          ]
        }, { status: 400 })
    }
    
  } catch (error) {
    console.error('Config API error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to process configuration request',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Setup default configurations for new organization
async function setupDefaultConfigs(
  configService: UniversalConfigService,
  organizationId: string,
  phoneNumber: string
): Promise<NextResponse> {
  const defaults = UniversalConfigService.generateDefaultConfigs(organizationId, phoneNumber)
  
  // Create all configuration entities
  const channelId = await configService.upsertWhatsAppChannel(defaults.channel)
  const routingId = await configService.upsertAIRoutingPolicy(defaults.routing)
  
  // Create other config entities using universal API
  universalApi.setOrganizationId(organizationId)
  
  const toolmapEntity = await universalApi.createEntity({
    entity_type: 'mcp_toolmap',
    entity_name: 'Default MCP Tool Mapping',
    entity_code: 'HERA.MCP.TOOLMAP.CONFIG.V1',
    smart_code: 'HERA.MCP.TOOLMAP.CONFIG.V1'
  })
  await universalApi.setDynamicField(toolmapEntity.id, 'config', JSON.stringify(defaults.toolmap))
  
  const promptsEntity = await universalApi.createEntity({
    entity_type: 'ai_prompts',
    entity_name: 'Default AI Prompts',
    entity_code: 'HERA.AI.PROMPT.CONFIG.V1',
    smart_code: 'HERA.AI.PROMPT.CONFIG.V1'
  })
  await universalApi.setDynamicField(promptsEntity.id, 'config', JSON.stringify(defaults.prompts))
  
  const keywordsEntity = await universalApi.createEntity({
    entity_type: 'keyword_rules',
    entity_name: 'Default Keyword Rules',
    entity_code: 'HERA.COMMS.WHATSAPP.KEYWORDS.V1',
    smart_code: 'HERA.COMMS.WHATSAPP.KEYWORDS.V1'
  })
  await universalApi.setDynamicField(keywordsEntity.id, 'config', JSON.stringify(defaults.keywords))
  
  // Link all configurations together
  await configService.linkConfigurations(channelId, routingId)
  await configService.linkConfigurations(routingId, toolmapEntity.id)
  await configService.linkConfigurations(routingId, promptsEntity.id)
  await configService.linkConfigurations(routingId, keywordsEntity.id)
  
  return NextResponse.json({
    success: true,
    message: 'Default WhatsApp configuration created successfully',
    entities: {
      channel_id: channelId,
      routing_id: routingId,
      toolmap_id: toolmapEntity.id,
      prompts_id: promptsEntity.id,
      keywords_id: keywordsEntity.id
    },
    next_steps: [
      'Test your configuration with /api/v1/whatsapp/config',
      'Customize AI providers in the routing policy',
      'Add custom keywords and prompts',
      'Configure MCP tool mappings for your business'
    ]
  })
}

// Upsert WhatsApp channel configuration
async function upsertChannelConfig(
  configService: UniversalConfigService,
  configData: any
): Promise<NextResponse> {
  const channelId = await configService.upsertWhatsAppChannel(configData)
  
  return NextResponse.json({
    success: true,
    message: 'WhatsApp channel configuration updated',
    channel_id: channelId
  })
}

// Upsert AI routing policy
async function upsertRoutingConfig(
  configService: UniversalConfigService,
  configData: any
): Promise<NextResponse> {
  const routingId = await configService.upsertAIRoutingPolicy(configData)
  
  return NextResponse.json({
    success: true,
    message: 'AI routing policy updated',
    routing_id: routingId
  })
}

// Test specific provider
async function testProviderConfig(
  configService: UniversalConfigService,
  providerName: string
): Promise<NextResponse> {
  const result = await configService.testProviderConfig(providerName)
  
  return NextResponse.json({
    success: true,
    provider: providerName,
    test_result: result,
    message: result.success ? 
      `Provider ${providerName} is working correctly` :
      `Provider ${providerName} failed: ${result.error}`
  })
}

// Link configurations
async function linkConfigs(
  configService: UniversalConfigService,
  fromId: string,
  toId: string
): Promise<NextResponse> {
  await configService.linkConfigurations(fromId, toId)
  
  return NextResponse.json({
    success: true,
    message: 'Configurations linked successfully',
    relationship: `${fromId} USES ${toId}`
  })
}

// Toggle provider on/off
async function toggleProvider(
  configService: UniversalConfigService,
  organizationId: string,
  providerName: string,
  enabled: boolean
): Promise<NextResponse> {
  const configs = await configService.loadConfigurations()
  
  if (!configs.routing) {
    return NextResponse.json({
      success: false,
      error: 'No AI routing configuration found'
    }, { status: 404 })
  }
  
  // Update provider enabled status
  const provider = configs.routing.providers.find(p => p.name === providerName)
  if (!provider) {
    return NextResponse.json({
      success: false,
      error: `Provider ${providerName} not found in routing configuration`
    }, { status: 404 })
  }
  
  provider.enabled = enabled
  
  // Update the configuration
  await configService.upsertAIRoutingPolicy(configs.routing)
  
  return NextResponse.json({
    success: true,
    message: `Provider ${providerName} ${enabled ? 'enabled' : 'disabled'}`,
    provider: providerName,
    enabled
  })
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { entity_id, updates } = body
    
    if (!entity_id) {
      return NextResponse.json({ 
        success: false,
        error: 'Entity ID required for updates'
      }, { status: 400 })
    }

    // Update entity using universal API
    const entity = await universalApi.getEntity(entity_id)
    if (!entity) {
      return NextResponse.json({ 
        success: false,
        error: 'Configuration entity not found'
      }, { status: 404 })
    }

    // Apply updates to dynamic data
    for (const [key, value] of Object.entries(updates)) {
      await universalApi.setDynamicField(entity_id, key, JSON.stringify(value))
    }
    
    return NextResponse.json({
      success: true,
      message: 'Configuration updated successfully',
      entity_id,
      updates_applied: Object.keys(updates)
    })
    
  } catch (error) {
    console.error('Config update error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to update configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const entityId = searchParams.get('entity_id')
    
    if (!entityId) {
      return NextResponse.json({ 
        success: false,
        error: 'Entity ID required for deletion'
      }, { status: 400 })
    }

    // Delete entity and all relationships
    await universalApi.deleteEntity(entityId)
    
    return NextResponse.json({
      success: true,
      message: 'Configuration deleted successfully',
      entity_id: entityId
    })
    
  } catch (error) {
    console.error('Config deletion error:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Failed to delete configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}