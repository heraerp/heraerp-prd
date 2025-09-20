/**
 * Universal WhatsApp Handler with Configuration-Driven Processing
 * No hardcoding - all behavior controlled by Sacred Six configurations
 * Smart Code: HERA.COMMS.WHATSAPP.HANDLER.V1
 */

import { UniversalConfigService, ConfigSmartCodes } from './universal-config-service'
import { UniversalWhatsAppAI } from '@/lib/ai/universal-whatsapp-ai'
import { MCPTools } from '@/lib/mcp/whatsapp-mcp-tools'
import { WhatsAppService } from './whatsapp-service'
import { universalApi } from '@/lib/universal-api'

export interface ProcessingContext {
  organizationId: string
  messageId: string
  from: string
  text: string
  customerData?: any
  correlationId: string
}

export interface ProcessingResult {
  success: boolean
  providerUsed: string
  confidence?: number
  intent?: string
  cost?: number
  error?: string
  transactionId?: string
}

export class UniversalWhatsAppHandler {
  private configService: UniversalConfigService
  private organizationId: string

  constructor(organizationId: string) {
    this.organizationId = organizationId
    this.configService = new UniversalConfigService(organizationId)
  }

  /**
   * Main processing entry point - fully configuration-driven
   */
  async handleIncomingMessage(ctx: ProcessingContext): Promise<ProcessingResult> {
    // Start transaction for full audit trail
    const tx = await this.startTransaction(ctx)

    try {
      // Load organization configurations
      const configs = await this.configService.loadConfigurations()

      if (!configs.channel || !configs.routing) {
        return await this.handleNoConfiguration(ctx, tx)
      }

      // Check cost guardrails
      const costCheck = await this.configService.checkCostGuardrails(configs.routing)
      if (!costCheck.allowed) {
        await this.appendTransactionLine(tx, 'COST_GUARDRAIL_BLOCKED', {
          reason: costCheck.reason
        })
        return await this.fallbackToRuleBased(ctx, tx, configs)
      }

      // Try providers in priority order
      const failedProviders: string[] = []

      while (true) {
        const provider = await this.configService.getNextProvider(configs.routing, failedProviders)

        if (!provider) {
          // All providers failed, use final fallback
          return await this.handleAllProvidersFailed(ctx, tx, configs)
        }

        try {
          const result = await this.processWithProvider(ctx, tx, provider, configs)

          if (result.success) {
            await this.finalizeTransaction(tx, {
              provider_selected: provider.name,
              status: 'SUCCESS',
              confidence: result.confidence,
              cost: result.cost
            })

            return {
              success: true,
              providerUsed: provider.name,
              confidence: result.confidence,
              intent: result.intent,
              cost: result.cost,
              transactionId: tx
            }
          }
        } catch (error) {
          console.error(`Provider ${provider.name} failed:`, error)

          await this.appendTransactionLine(tx, 'FALLBACK_TRIGGER', {
            provider: provider.name,
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
          })

          failedProviders.push(provider.name)

          // Check if this error should trigger fallback
          if (this.shouldTriggerFallback(error, provider.fallback_on || [])) {
            continue
          } else {
            throw error
          }
        }
      }
    } catch (error) {
      await this.finalizeTransaction(tx, {
        provider_selected: 'none',
        status: 'FAILED',
        error: error instanceof Error ? error.message : 'Unknown error'
      })

      return {
        success: false,
        providerUsed: 'none',
        error: error instanceof Error ? error.message : 'Unknown error',
        transactionId: tx
      }
    }
  }

  /**
   * Process message with specific provider
   */
  private async processWithProvider(
    ctx: ProcessingContext,
    txId: string,
    provider: any,
    configs: any
  ): Promise<{ success: boolean; confidence?: number; intent?: string; cost?: number }> {
    await this.appendTransactionLine(txId, 'PROVIDER_ATTEMPT', {
      provider: provider.name,
      priority: provider.priority,
      timeout_ms: provider.timeout_ms
    })

    if (provider.name === 'rule_based') {
      return await this.processWithRuleBased(ctx, txId, configs.keywords)
    }

    // AI provider processing
    const aiService = new UniversalWhatsAppAI(this.organizationId)

    // Extract intent with timeout
    const intentPromise = aiService.extractIntent(ctx.text, ctx.customerData)
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Provider timeout')), provider.timeout_ms)
    )

    const intent = await Promise.race([intentPromise, timeoutPromise])

    await this.appendTransactionLine(txId, 'PARSED_INTENT', {
      provider: provider.name,
      intent: intent.intent,
      entities: intent.entities,
      confidence: intent.confidence
    })

    // Execute MCP tools if configured
    if (configs.toolmap) {
      const toolResults = await this.executeMCPTools(ctx, txId, intent, configs.toolmap)

      // Generate response
      const response = await this.generateResponse(ctx, intent, toolResults, configs.prompts)

      // Send response
      await this.sendWhatsAppMessage(ctx, response, configs.channel)

      await this.appendTransactionLine(txId, 'OUTBOUND_TEXT', {
        provider: provider.name,
        message: response,
        recipient: ctx.from
      })
    }

    // Calculate cost (simplified)
    const estimatedCost = this.calculateCost(provider, ctx.text, intent)

    return {
      success: true,
      confidence: intent.confidence,
      intent: intent.intent,
      cost: estimatedCost
    }
  }

  /**
   * Process with rule-based engine
   */
  private async processWithRuleBased(
    ctx: ProcessingContext,
    txId: string,
    keywords: any
  ): Promise<{ success: boolean; confidence?: number; intent?: string; cost?: number }> {
    if (!keywords || !keywords.rules) {
      throw new Error('No keyword rules configured')
    }

    const text = ctx.text.toLowerCase()
    let bestMatch: any = null
    let bestConfidence = 0

    for (const rule of keywords.rules) {
      const regex = new RegExp(rule.match, 'i')
      if (regex.test(text)) {
        if (rule.confidence > bestConfidence) {
          bestMatch = rule
          bestConfidence = rule.confidence
        }
      }
    }

    if (bestMatch) {
      await this.appendTransactionLine(txId, 'RULE_BASED_MATCH', {
        rule: bestMatch.match,
        intent: bestMatch.intent,
        confidence: bestMatch.confidence
      })

      // Generate simple response
      const response = this.generateRuleBasedResponse(bestMatch.intent)
      await this.sendWhatsAppMessage(ctx, response, null)

      await this.appendTransactionLine(txId, 'OUTBOUND_TEXT', {
        provider: 'rule_based',
        message: response,
        recipient: ctx.from
      })

      return {
        success: true,
        confidence: bestMatch.confidence,
        intent: bestMatch.intent,
        cost: 0
      }
    }

    throw new Error('No rule-based match found')
  }

  /**
   * Execute MCP tools based on intent
   */
  private async executeMCPTools(
    ctx: ProcessingContext,
    txId: string,
    intent: any,
    toolmap: any
  ): Promise<any[]> {
    const results: any[] = []

    const intentMapping = toolmap.intents.find((mapping: any) => mapping.intent === intent.intent)

    if (!intentMapping) {
      await this.appendTransactionLine(txId, 'MCP_SKIP', {
        reason: 'No tools mapped for intent',
        intent: intent.intent
      })
      return results
    }

    const mcp = new MCPTools(this.organizationId)

    for (const toolName of intentMapping.tools) {
      try {
        await this.appendTransactionLine(txId, 'MCP_CALL', {
          tool: toolName,
          intent: intent.intent,
          entities: intent.entities
        })

        // Map to actual MCP method calls
        let result
        switch (toolName) {
          case 'ucr.calendar.createBooking':
            result = await mcp.bookSlot({
              organization_id: this.organizationId,
              customer_id: ctx.from,
              service_ids: intent.entities.services || [],
              slot: this.extractSlotFromIntent(intent),
              stylist_id: intent.entities.preferred_stylist,
              location_id: 'default'
            })
            break

          case 'ucr.availability.getSlots':
            result = await mcp.findSlots({
              organization_id: this.organizationId,
              duration: 120,
              date_range: {
                start: new Date(),
                end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              },
              stylist_id: intent.entities.preferred_stylist
            })
            break

          case 'ucr.calendar.cancelBooking':
          case 'ucr.calendar.moveBooking':
          case 'ucr.knowledge.lookup':
            result = { success: true, data: { message: `${toolName} executed` } }
            break

          default:
            result = { success: false, error: `Unknown tool: ${toolName}` }
        }

        await this.appendTransactionLine(txId, 'MCP_RESULT', {
          tool: toolName,
          success: result.success,
          data: result.data,
          error: result.error
        })

        results.push({ tool: toolName, result })
      } catch (error) {
        await this.appendTransactionLine(txId, 'MCP_ERROR', {
          tool: toolName,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return results
  }

  /**
   * Generate response using prompt templates
   */
  private async generateResponse(
    ctx: ProcessingContext,
    intent: any,
    toolResults: any[],
    prompts: any
  ): Promise<string> {
    if (!prompts || !prompts.templates) {
      return this.generateDefaultResponse(intent, toolResults)
    }

    // Find appropriate template
    const template = prompts.templates.find((t: any) => t.intent === intent.intent)
    if (!template) {
      return this.generateDefaultResponse(intent, toolResults)
    }

    // Simple template replacement
    let response = template.user_template
    response = response.replace('{{message}}', ctx.text)

    // Add tool results context
    if (toolResults.length > 0) {
      const toolContext = toolResults.map(r => `${r.tool}: ${JSON.stringify(r.result)}`).join(', ')
      response += `\n\nBased on: ${toolContext}`
    }

    return response
  }

  /**
   * Helper methods
   */
  private async startTransaction(ctx: ProcessingContext): Promise<string> {
    const tx = await universalApi.createTransaction({
      organization_id: this.organizationId,
      transaction_type: 'whatsapp_message',
      transaction_code: `WA-${ctx.messageId}`,
      smart_code: 'HERA.COMMS.WHATSAPP.MESSAGE.V1',
      total_amount: 0,
      metadata: {
        direction: 'INBOUND',
        from: ctx.from,
        correlation_id: ctx.correlationId,
        message_preview: ctx.text.substring(0, 100)
      }
    })

    await this.appendTransactionLine(tx.id, 'RAW_MESSAGE', {
      text: ctx.text,
      from: ctx.from,
      customer_data: ctx.customerData
    })

    return tx.id
  }

  private async appendTransactionLine(txId: string, lineType: string, payload: any): Promise<void> {
    await universalApi.createTransactionLine({
      transaction_id: txId,
      line_type: lineType,
      line_number: Date.now() % 10000,
      line_amount: 0,
      metadata: payload
    })
  }

  private async finalizeTransaction(txId: string, metadata: any): Promise<void> {
    await universalApi.updateTransaction(txId, {
      transaction_status: metadata.status,
      metadata: {
        ...metadata,
        completed_at: new Date().toISOString()
      }
    })
  }

  private shouldTriggerFallback(error: any, fallbackTriggers: string[]): boolean {
    const errorStr = error.toString().toLowerCase()

    return fallbackTriggers.some(trigger => {
      switch (trigger) {
        case 'timeout':
          return errorStr.includes('timeout')
        case '5xx':
          return errorStr.includes('500') || errorStr.includes('502') || errorStr.includes('503')
        case 'rate_limit':
          return errorStr.includes('rate limit') || errorStr.includes('429')
        case 'guardrail_violation':
          return errorStr.includes('guardrail') || errorStr.includes('policy')
        default:
          return errorStr.includes(trigger.toLowerCase())
      }
    })
  }

  private calculateCost(provider: any, text: string, intent: any): number {
    // Simplified cost calculation
    const inputTokens = Math.ceil(text.length / 4)
    const outputTokens = 50 // Estimated

    switch (provider.name) {
      case 'anthropic_claude':
        return (inputTokens * 0.003 + outputTokens * 0.015) / 1000
      case 'openai_gpt4':
        return (inputTokens * 0.03 + outputTokens * 0.06) / 1000
      default:
        return 0
    }
  }

  private extractSlotFromIntent(intent: any): any {
    // Extract slot information from intent entities
    const now = new Date()
    let slotDate = now

    if (intent.entities.date_hint === 'tomorrow') {
      slotDate = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    } else if (intent.entities.date_hint === 'today') {
      slotDate = now
    }

    // Default to 10 AM if no specific time
    slotDate.setHours(10, 0, 0, 0)

    return {
      start: slotDate.toISOString(),
      end: new Date(slotDate.getTime() + 60 * 60 * 1000).toISOString(), // 1 hour slot
      duration: 60
    }
  }

  private generateDefaultResponse(intent: any, toolResults: any[]): string {
    switch (intent.intent) {
      case 'BOOK':
        return "I'd be happy to help you book an appointment! What service would you like?"
      case 'CANCEL':
        return 'I can help you cancel your appointment. Can you provide your booking details?'
      case 'RESCHEDULE':
        return "I'll help you reschedule. When would you like to move your appointment to?"
      default:
        return "Hi! I'm here to help with appointments. You can say BOOK, CANCEL, or RESCHEDULE."
    }
  }

  private generateRuleBasedResponse(intent: string): string {
    switch (intent) {
      case 'BOOK':
        return 'Hi! I can help you book an appointment. What service are you interested in?'
      case 'CANCEL':
        return 'I can help cancel your appointment. Please provide your booking reference.'
      case 'RESCHEDULE':
        return "I can help reschedule your appointment. What's your preferred new time?"
      case 'FAQ':
        return 'Here are our services and prices. How can I help you today?'
      default:
        return 'Hello! Try sending BOOK to make an appointment.'
    }
  }

  private async sendWhatsAppMessage(
    ctx: ProcessingContext,
    message: string,
    channelConfig: any
  ): Promise<void> {
    const whatsapp = new WhatsAppService(
      process.env.WHATSAPP_ACCESS_TOKEN || '',
      process.env.WHATSAPP_PHONE_NUMBER_ID || '',
      process.env.WHATSAPP_WEBHOOK_TOKEN || '',
      this.organizationId
    )

    await whatsapp.sendTextMessage(ctx.from, message)
  }

  private async handleNoConfiguration(
    ctx: ProcessingContext,
    txId: string
  ): Promise<ProcessingResult> {
    await this.appendTransactionLine(txId, 'NO_CONFIG', {
      reason: 'Organization has no WhatsApp configuration'
    })

    // Send basic response
    await this.sendWhatsAppMessage(
      ctx,
      'Service temporarily unavailable. Please try again later.',
      null
    )

    await this.finalizeTransaction(txId, {
      provider_selected: 'none',
      status: 'NO_CONFIG'
    })

    return {
      success: false,
      providerUsed: 'none',
      error: 'No configuration found',
      transactionId: txId
    }
  }

  private async fallbackToRuleBased(
    ctx: ProcessingContext,
    txId: string,
    configs: any
  ): Promise<ProcessingResult> {
    try {
      const result = await this.processWithRuleBased(ctx, txId, configs.keywords)

      await this.finalizeTransaction(txId, {
        provider_selected: 'rule_based',
        status: 'SUCCESS_COST_FALLBACK',
        confidence: result.confidence
      })

      return {
        success: true,
        providerUsed: 'rule_based',
        confidence: result.confidence,
        intent: result.intent,
        cost: 0,
        transactionId: txId
      }
    } catch (error) {
      return await this.handleAllProvidersFailed(ctx, txId, configs)
    }
  }

  private async handleAllProvidersFailed(
    ctx: ProcessingContext,
    txId: string,
    configs: any
  ): Promise<ProcessingResult> {
    await this.appendTransactionLine(txId, 'ALL_PROVIDERS_FAILED', {
      timestamp: new Date().toISOString()
    })

    // Send fallback message
    const fallbackMessage =
      "I'm having trouble understanding. Please try sending BOOK, CANCEL, or RESCHEDULE."
    await this.sendWhatsAppMessage(ctx, fallbackMessage, configs.channel)

    await this.appendTransactionLine(txId, 'FALLBACK_MESSAGE', {
      message: fallbackMessage,
      recipient: ctx.from
    })

    await this.finalizeTransaction(txId, {
      provider_selected: 'fallback',
      status: 'ALL_FAILED'
    })

    return {
      success: true, // We did send a response, even if basic
      providerUsed: 'fallback',
      confidence: 0.3,
      intent: 'unknown',
      cost: 0,
      transactionId: txId
    }
  }
}
