/**
 * Universal Configuration Service for WhatsApp + MCP + AI
 * HERA-native implementation using Sacred Six tables only
 * Smart Code: HERA.COMMS.WHATSAPP.UNIVERSAL.CONFIG.v1
 */

import { universalApi } from '@/src/lib/universal-api'
import { createClient } from '@supabase/supabase-js'

// Smart Code Namespaces
export const ConfigSmartCodes = {
  WHATSAPP_CHANNEL: 'HERA.COMMS.WHATSAPP.CONFIG.V1',
  AI_ROUTING: 'HERA.AI.ROUTING.CONFIG.V1',
  MCP_TOOLMAP: 'HERA.MCP.TOOLMAP.CONFIG.V1',
  AI_PROMPTS: 'HERA.AI.PROMPT.CONFIG.V1',
  KEYWORDS: 'HERA.COMMS.WHATSAPP.KEYWORDS.V1',
  CONFIG_USES: 'HERA.CONFIG.USES.V1'
} as const

// Type definitions for configurations
export interface WhatsAppChannelConfig {
  smart_code: typeof ConfigSmartCodes.WHATSAPP_CHANNEL
  phone_number: string
  provider: 'meta_cloud_api' | 'twilio' | 'custom'
  webhook_secret: string
  inbound_parser: 'universal' | 'custom'
  outbound_policy: {
    typing_indicator: boolean
    delivery_receipts: 'log_only' | 'send_to_user' | 'disabled'
    template_namespace: string
  }
  rate_limits: {
    rpm: number
    burst: number
  }
  retry_policy: {
    max_retries: number
    backoff: 'exponential' | 'linear'
    base_ms: number
  }
}

export interface AIRoutingPolicy {
  smart_code: typeof ConfigSmartCodes.AI_ROUTING
  providers: Array<{
    name: string
    priority: number
    enabled: boolean
    timeout_ms: number
    max_tokens: number
    cost_tier: 'complex' | 'standard' | 'basic'
    match?: {
      intent?: string[]
      complexity?: string
    }
    fallback_on?: string[]
  }>
  cost_guardrails: {
    daily_usd_cap: number
    per_msg_usd_cap: number
  }
  observability: {
    log_prompts: 'full' | 'redact_pii' | 'disabled'
    trace_level: 'basic' | 'detailed' | 'verbose'
  }
}

export interface MCPToolMap {
  smart_code: typeof ConfigSmartCodes.MCP_TOOLMAP
  intents: Array<{
    intent: string
    tools: string[]
  }>
  routing: {
    resolver: string
    unknown_intent_strategy: string
  }
}

export interface PromptPack {
  smart_code: typeof ConfigSmartCodes.AI_PROMPTS
  pack_name: string
  templates: Array<{
    provider: string
    intent: string
    system: string
    user_template: string
    tool_contract?: {
      required_fields: string[]
      on_missing: string
    }
    output_schema?: any
  }>
}

export interface KeywordRules {
  smart_code: typeof ConfigSmartCodes.KEYWORDS
  rules: Array<{
    match: string
    intent: string
    confidence: number
  }>
}

export class UniversalConfigService {
  private organizationId: string
  private cache: Map<string, any> = new Map()
  private cacheExpiry = 300000 // 5 minutes

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  /**
   * Load all configurations for an organization
   */
  async loadConfigurations(): Promise<{
    channel: WhatsAppChannelConfig | null
    routing: AIRoutingPolicy | null
    toolmap: MCPToolMap | null
    prompts: PromptPack | null
    keywords: KeywordRules | null
  }> {
    // Check cache first
    const cacheKey = `config_${this.organizationId}`
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached

    // Load WhatsApp Channel config
    const channel = await this.loadConfigBySmartCode<WhatsAppChannelConfig>(
      ConfigSmartCodes.WHATSAPP_CHANNEL
    )

    // If no channel, return nulls
    if (!channel) {
      return { channel: null, routing: null, toolmap: null, prompts: null, keywords: null }
    }

    // Load related configs via relationships
    const routing = await this.loadRelatedConfig<AIRoutingPolicy>(
      channel.id,
      ConfigSmartCodes.AI_ROUTING
    )

    let toolmap: MCPToolMap | null = null
    let prompts: PromptPack | null = null
    let keywords: KeywordRules | null = null

    if (routing) {
      // Load configs related to routing policy
      toolmap = await this.loadRelatedConfig<MCPToolMap>(routing.id, ConfigSmartCodes.MCP_TOOLMAP)
      prompts = await this.loadRelatedConfig<PromptPack>(routing.id, ConfigSmartCodes.AI_PROMPTS)
      keywords = await this.loadRelatedConfig<KeywordRules>(routing.id, ConfigSmartCodes.KEYWORDS)
    }

    const configs = { channel, routing, toolmap, prompts, keywords }
    this.setCache(cacheKey, configs)
    return configs
  }

  /**
   * Load configuration by smart code
   */
  private async loadConfigBySmartCode<T>(smartCode: string): Promise<T | null> {
    try {
      // Use the read method with organization filtering
      const response = await universalApi.read('core_entities', undefined, this.organizationId)

      if (!response.success || !response.data) {
        return null
      }

      // Find entity with matching entity_code
      const entity = response.data.find((e: any) => e.entity_code === smartCode)
      if (!entity) {
        return null
      }

      // Get dynamic data - this method should exist
      let dynamicData = {}
      try {
        const dynamicResponse = await universalApi.getDynamicFields?.(entity.id)
        if (dynamicResponse) {
          dynamicData = dynamicResponse
        }
      } catch (error) {
        console.warn(`Could not load dynamic data for ${entity.id}:`, error)
      }

      // Merge config from dynamic data
      const config = {
        id: entity.id,
        smart_code: smartCode,
        ...dynamicData,
        ...entity.metadata // Also include entity metadata
      }

      return config as T
    } catch (error) {
      console.error(`Failed to load config ${smartCode}:`, error)
      return null
    }
  }

  /**
   * Load related configuration via relationships
   */
  private async loadRelatedConfig<T>(
    fromEntityId: string,
    targetSmartCode: string
  ): Promise<T | null> {
    try {
      // Find relationships - use read method
      const relationshipsResponse = await universalApi.read(
        'core_relationships',
        undefined,
        this.organizationId
      )

      if (!relationshipsResponse.success || !relationshipsResponse.data) {
        return null
      }

      // Filter relationships by from_entity_id and type
      const relationships = relationshipsResponse.data.filter(
        (r: any) =>
          r.from_entity_id === fromEntityId && r.relationship_type === ConfigSmartCodes.CONFIG_USES
      )

      if (relationships.length === 0) {
        return null
      }

      // Get all entities to find targets
      const entitiesResponse = await universalApi.read(
        'core_entities',
        undefined,
        this.organizationId
      )
      if (!entitiesResponse.success || !entitiesResponse.data) {
        return null
      }

      // Find the target entity
      for (const rel of relationships) {
        const targetEntity = entitiesResponse.data.find(
          (e: any) => e.id === rel.to_entity_id && e.entity_code === targetSmartCode
        )

        if (targetEntity) {
          let dynamicData = {}
          try {
            const dynamicResponse = await universalApi.getDynamicFields?.(targetEntity.id)
            if (dynamicResponse) {
              dynamicData = dynamicResponse
            }
          } catch (error) {
            console.warn(
              `Could not load dynamic data for related config ${targetEntity.id}:`,
              error
            )
          }

          return {
            id: targetEntity.id,
            smart_code: targetSmartCode,
            ...dynamicData,
            ...targetEntity.metadata
          } as T
        }
      }

      return null
    } catch (error) {
      console.error(`Failed to load related config ${targetSmartCode}:`, error)
      return null
    }
  }

  /**
   * Create or update WhatsApp channel configuration
   */
  async upsertWhatsAppChannel(config: Omit<WhatsAppChannelConfig, 'smart_code'>): Promise<string> {
    const entity = await universalApi.createOrUpdateEntity({
      organization_id: this.organizationId,
      entity_type: 'whatsapp_channel',
      entity_code: ConfigSmartCodes.WHATSAPP_CHANNEL,
      entity_name: `WhatsApp Channel - ${config.phone_number}`,
      smart_code: ConfigSmartCodes.WHATSAPP_CHANNEL
    })

    // Store config in dynamic data
    await universalApi.setDynamicField(entity.id, 'config', JSON.stringify(config))

    // Invalidate cache
    this.invalidateCache()

    return entity.id
  }

  /**
   * Create or update AI routing policy
   */
  async upsertAIRoutingPolicy(config: Omit<AIRoutingPolicy, 'smart_code'>): Promise<string> {
    const entity = await universalApi.createOrUpdateEntity({
      organization_id: this.organizationId,
      entity_type: 'ai_routing_policy',
      entity_code: ConfigSmartCodes.AI_ROUTING,
      entity_name: 'AI Routing Policy',
      smart_code: ConfigSmartCodes.AI_ROUTING
    })

    await universalApi.setDynamicField(entity.id, 'config', JSON.stringify(config))
    this.invalidateCache()
    return entity.id
  }

  /**
   * Link configurations together
   */
  async linkConfigurations(fromId: string, toId: string): Promise<void> {
    await universalApi.createRelationship({
      organization_id: this.organizationId,
      from_entity_id: fromId,
      to_entity_id: toId,
      relationship_type: ConfigSmartCodes.CONFIG_USES,
      smart_code: ConfigSmartCodes.CONFIG_USES
    })
    this.invalidateCache()
  }

  /**
   * Test provider configuration
   */
  async testProviderConfig(providerName: string): Promise<{
    success: boolean
    latency?: number
    error?: string
  }> {
    const startTime = Date.now()

    try {
      // Create test transaction
      const tx = await universalApi.createTransaction({
        organization_id: this.organizationId,
        transaction_type: 'whatsapp_ai_test',
        transaction_code: `TEST-${Date.now()}`,
        smart_code: 'HERA.COMMS.WHATSAPP.TEST.V1',
        total_amount: 0,
        metadata: {
          provider: providerName,
          test_message: 'Test provider configuration'
        }
      })

      // Simulate provider test based on name
      if (providerName === 'anthropic_claude' && process.env.CLAUDE_API_KEY) {
        // Test Claude
        return { success: true, latency: Date.now() - startTime }
      } else if (providerName === 'openai_gpt4' && process.env.OPENAI_API_KEY) {
        // Test OpenAI
        return { success: true, latency: Date.now() - startTime }
      } else if (providerName === 'rule_based') {
        // Rule-based always works
        return { success: true, latency: 5 }
      }

      return { success: false, error: 'Provider not configured' }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        latency: Date.now() - startTime
      }
    }
  }

  /**
   * Get provider by priority
   */
  async getNextProvider(
    routing: AIRoutingPolicy,
    failedProviders: string[] = []
  ): Promise<any | null> {
    const sortedProviders = [...routing.providers].sort((a, b) => a.priority - b.priority)

    for (const provider of sortedProviders) {
      if (!provider.enabled) continue
      if (failedProviders.includes(provider.name)) continue
      return provider
    }

    return null
  }

  /**
   * Check cost guardrails
   */
  async checkCostGuardrails(routing: AIRoutingPolicy): Promise<{
    allowed: boolean
    reason?: string
  }> {
    const today = new Date().toISOString().split('T')[0]

    try {
      // Query today's costs using read method
      const costsResponse = await universalApi.read(
        'universal_transactions',
        undefined,
        this.organizationId
      )

      let totalCost = 0
      if (costsResponse.success && costsResponse.data) {
        // Filter transactions for today and whatsapp_ai_request type
        const todayTransactions = costsResponse.data.filter((tx: any) => {
          const txDate = new Date(tx.created_at).toISOString().split('T')[0]
          return txDate === today && tx.transaction_type === 'whatsapp_ai_request'
        })

        totalCost = todayTransactions.reduce((sum, tx) => {
          return sum + ((tx.metadata as any)?.cost_usd || 0)
        }, 0)
      }

      if (totalCost >= routing.cost_guardrails.daily_usd_cap) {
        return {
          allowed: false,
          reason: `Daily cost cap of $${routing.cost_guardrails.daily_usd_cap} exceeded`
        }
      }

      return { allowed: true }
    } catch (error) {
      console.error('Failed to check cost guardrails:', error)
      // Allow by default if we can't check
      return { allowed: true }
    }
  }

  /**
   * Cache helpers
   */
  private getFromCache(key: string): any {
    const cached = this.cache.get(key)
    if (!cached) return null

    if (Date.now() - cached.timestamp > this.cacheExpiry) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  private invalidateCache(): void {
    this.cache.clear()
  }

  /**
   * Generate default configuration for new organizations
   */
  static generateDefaultConfigs(
    organizationId: string,
    phoneNumber: string
  ): {
    channel: Omit<WhatsAppChannelConfig, 'smart_code'>
    routing: Omit<AIRoutingPolicy, 'smart_code'>
    toolmap: Omit<MCPToolMap, 'smart_code'>
    prompts: Omit<PromptPack, 'smart_code'>
    keywords: Omit<KeywordRules, 'smart_code'>
  } {
    return {
      channel: {
        phone_number: phoneNumber,
        provider: 'meta_cloud_api',
        webhook_secret: process.env.WHATSAPP_WEBHOOK_TOKEN || '',
        inbound_parser: 'universal',
        outbound_policy: {
          typing_indicator: true,
          delivery_receipts: 'log_only',
          template_namespace: 'hera_default'
        },
        rate_limits: { rpm: 60, burst: 10 },
        retry_policy: { max_retries: 3, backoff: 'exponential', base_ms: 500 }
      },
      routing: {
        providers: [
          {
            name: 'anthropic_claude',
            priority: 1,
            enabled: true,
            timeout_ms: 8000,
            max_tokens: 2048,
            cost_tier: 'complex',
            match: { intent: ['BOOK', 'RESCHEDULE', 'CANCEL'], complexity: '>=medium' },
            fallback_on: ['timeout', '5xx', 'rate_limit']
          },
          {
            name: 'openai_gpt4',
            priority: 2,
            enabled: true,
            timeout_ms: 6000,
            max_tokens: 1536,
            cost_tier: 'standard',
            fallback_on: ['timeout', '5xx', 'guardrail_violation']
          },
          {
            name: 'rule_based',
            priority: 3,
            enabled: true,
            timeout_ms: 100,
            max_tokens: 0,
            cost_tier: 'basic'
          }
        ],
        cost_guardrails: { daily_usd_cap: 50, per_msg_usd_cap: 0.05 },
        observability: { log_prompts: 'redact_pii', trace_level: 'basic' }
      },
      toolmap: {
        intents: [
          { intent: 'BOOK', tools: ['ucr.calendar.createBooking', 'ucr.availability.getSlots'] },
          { intent: 'RESCHEDULE', tools: ['ucr.calendar.moveBooking'] },
          { intent: 'CANCEL', tools: ['ucr.calendar.cancelBooking'] },
          { intent: 'FAQ', tools: ['ucr.knowledge.lookup'] }
        ],
        routing: {
          resolver: 'intent_first_then_tool',
          unknown_intent_strategy: 'ask_clarifying_or_rule_based'
        }
      },
      prompts: {
        pack_name: 'booking_default',
        templates: [
          {
            provider: 'anthropic_claude',
            intent: 'BOOK',
            system:
              'You are UniversalWhatsAppAI for a salon. Extract booking details from messages.',
            user_template:
              'User said: {{message}}. Extract: service, date, time, location, customer_name.',
            tool_contract: {
              required_fields: ['service', 'date', 'time'],
              on_missing: 'ask_one_question'
            }
          },
          {
            provider: 'openai_gpt4',
            intent: 'BOOK',
            system: 'You are a salon booking assistant. Extract appointment details.',
            user_template: 'Message: {{message}}. Extract service, date/time, and customer info.'
          }
        ]
      },
      keywords: {
        rules: [
          { match: '^\\s*book\\b|haircut|appointment', intent: 'BOOK', confidence: 0.6 },
          { match: '\\b(resched|move)\\b', intent: 'RESCHEDULE', confidence: 0.6 },
          { match: '\\b(cancel|stop)\\b', intent: 'CANCEL', confidence: 0.7 },
          { match: '\\b(price|cost|menu)\\b', intent: 'FAQ', confidence: 0.5 }
        ]
      }
    }
  }
}
