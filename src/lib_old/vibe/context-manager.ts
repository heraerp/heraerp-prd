// HERA 100% Vibe Coding System - Context Manager
// Smart Code: HERA.VIBE.FOUNDATION.CONTEXT.MANAGER.v1
// Purpose: Context preservation and amnesia elimination system

import { VibeContext, ContextPreservationRequest, ContextPreservationError } from './types'

export class ContextManager {
  private contexts: Map<string, VibeContext> = new Map()
  private sessionId: string = ''
  private organizationId: string = ''
  private sessionStartTime: Date = new Date()
  private autoPreserveInterval: NodeJS.Timeout | null = null
  private isInitialized: boolean = false

  // Initialize context manager with organization and session
  async initialize(organizationId: string, sessionId?: string): Promise<void> {
    try {
      this.organizationId = organizationId
      this.sessionId = sessionId || this.generateSessionId()
      this.sessionStartTime = new Date()

      // Load existing contexts for this session
      await this.loadSessionContexts()

      // Start auto-preservation if enabled
      this.startAutoPreservation()

      this.isInitialized = true

      console.log('🧠 Context Manager initialized')
      console.log(`   Session: ${this.sessionId}`)
      console.log(`   Organization: ${this.organizationId}`)
      console.log(`   Loaded contexts: ${this.contexts.size}`)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new ContextPreservationError(`Failed to initialize Context Manager: ${errorMessage}`, {
        organization_id: organizationId,
        session_id: sessionId
      })
    }
  }

  // Preserve context for seamless continuity
  async preserveContext(context: VibeContext): Promise<string> {
    if (!this.isInitialized) {
      throw new ContextPreservationError('Context Manager not initialized')
    }

    // Generate unique context ID
    const contextId = this.generateContextId()

    // Enrich context with session information
    const enrichedContext: VibeContext = {
      ...context,
      session_id: this.sessionId,
      organization_id: this.organizationId,
      timestamp: new Date()
    }

    // Store in memory
    this.contexts.set(contextId, enrichedContext)

    // Persist to database
    await this.persistContext(contextId, enrichedContext)

    // Log preservation event
    await this.logContextEvent('context_preserved', {
      context_id: contextId,
      smart_code: context.smart_code,
      user_intent: context.user_intent
    })

    console.log(`💾 Context preserved: ${contextId}`)
    console.log(`   Smart Code: ${context.smart_code}`)
    console.log(`   Intent: ${context.user_intent}`)

    return contextId
  }

  // Restore context for amnesia-free operation
  async restoreContext(contextId: string): Promise<VibeContext> {
    if (!this.isInitialized) {
      throw new ContextPreservationError('Context Manager not initialized')
    }

    // Check memory cache first
    if (this.contexts.has(contextId)) {
      const context = this.contexts.get(contextId)!

      // Log restoration event
      await this.logContextEvent('context_restored', {
        context_id: contextId,
        smart_code: context.smart_code,
        restore_method: 'memory_cache'
      })

      console.log(`🔄 Context restored from cache: ${contextId}`)
      return context
    }

    // Load from database
    const context = await this.loadContextFromDatabase(contextId)
    if (!context) {
      throw new ContextPreservationError(`Context not found: ${contextId}`, {
        context_id: contextId
      })
    }

    // Cache for future use
    this.contexts.set(contextId, context)

    // Log restoration event
    await this.logContextEvent('context_restored', {
      context_id: contextId,
      smart_code: context.smart_code,
      restore_method: 'database_load'
    })

    console.log(`🔄 Context restored from database: ${contextId}`)
    return context
  }

  // Get current session context snapshot
  getCurrentSessionContext(): SessionSnapshot {
    return {
      session_id: this.sessionId,
      organization_id: this.organizationId,
      start_time: this.sessionStartTime,
      context_count: this.contexts.size,
      active_contexts: Array.from(this.contexts.keys()),
      last_activity: new Date(),
      session_duration: Date.now() - this.sessionStartTime.getTime()
    }
  }

  // Search contexts by intent or smart code
  async searchContexts(query: string): Promise<VibeContext[]> {
    const results: VibeContext[] = []
    const queryLower = query.toLowerCase()

    for (const context of this.contexts.values()) {
      if (
        context.user_intent.toLowerCase().includes(queryLower) ||
        context.smart_code.toLowerCase().includes(queryLower) ||
        JSON.stringify(context.business_context).toLowerCase().includes(queryLower)
      ) {
        results.push(context)
      }
    }

    return results
  }

  // Get related contexts based on task lineage
  getRelatedContexts(contextId: string): VibeContext[] {
    const context = this.contexts.get(contextId)
    if (!context) return []

    const relatedContexts: VibeContext[] = []

    for (const [id, ctx] of this.contexts) {
      if (id === contextId) continue

      // Check for task lineage connections
      const hasSharedLineage = context.task_lineage.some(task => ctx.task_lineage.includes(task))

      // Check for smart code relationships
      const hasSmartCodeRelation =
        context.smart_code.split('.').slice(0, 3).join('.') ===
        ctx.smart_code.split('.').slice(0, 3).join('.')

      if (hasSharedLineage || hasSmartCodeRelation) {
        relatedContexts.push(ctx)
      }
    }

    return relatedContexts
  }

  // Update context with new information
  async updateContext(contextId: string, updates: Partial<VibeContext>): Promise<void> {
    const context = this.contexts.get(contextId)
    if (!context) {
      throw new ContextPreservationError(`Context not found for update: ${contextId}`, {
        context_id: contextId
      })
    }

    // Merge updates
    const updatedContext: VibeContext = {
      ...context,
      ...updates,
      timestamp: new Date() // Update timestamp
    }

    // Update in memory
    this.contexts.set(contextId, updatedContext)

    // Persist updated context
    await this.persistContext(contextId, updatedContext)

    // Log update event
    await this.logContextEvent('context_updated', {
      context_id: contextId,
      smart_code: updatedContext.smart_code,
      update_fields: Object.keys(updates)
    })

    console.log(`📝 Context updated: ${contextId}`)
  }

  // Archive old contexts to free memory
  async archiveOldContexts(maxAge: number = 24 * 60 * 60 * 1000): Promise<number> {
    const now = Date.now()
    const archiveCount = 0
    const toArchive: string[] = []

    for (const [contextId, context] of this.contexts) {
      if (now - context.timestamp.getTime() > maxAge) {
        toArchive.push(contextId)
      }
    }

    // Remove from memory (they're still in database)
    for (const contextId of toArchive) {
      this.contexts.delete(contextId)
    }

    if (toArchive.length > 0) {
      console.log(`🗄️ Archived ${toArchive.length} old contexts`)
    }

    return toArchive.length
  }

  // Getters for session information
  getCurrentSessionId(): string {
    return this.sessionId
  }

  getOrganizationId(): string {
    return this.organizationId
  }

  getSessionStartTime(): Date {
    return this.sessionStartTime
  }

  getContextCount(): number {
    return this.contexts.size
  }

  // Private helper methods
  private generateSessionId(): string {
    return `vibe-session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private generateContextId(): string {
    return `vibe-context-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  private async loadSessionContexts(): Promise<void> {
    try {
      // Load contexts for current session from database
      // This would query the universal tables for session contexts
      console.log('📂 Loading session contexts...')

      // Placeholder - would implement actual database loading
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.warn('⚠️ Could not load session contexts:', errorMessage)
    }
  }

  private startAutoPreservation(): void {
    // Auto-preserve session context every 30 seconds
    this.autoPreserveInterval = setInterval(async () => {
      try {
        const sessionContext: VibeContext = {
          smart_code: 'HERA.VIBE.CONTEXT.SESSION.AUTO.v1',
          session_id: this.sessionId,
          conversation_state: this.getCurrentSessionContext(),
          task_lineage: [],
          code_evolution: [],
          relationship_map: {},
          business_context: {
            auto_preservation: true,
            context_count: this.contexts.size
          },
          user_intent: 'Automatic session preservation',
          timestamp: new Date(),
          organization_id: this.organizationId
        }

        await this.preserveContext(sessionContext)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.warn('⚠️ Auto-preservation failed:', errorMessage)
      }
    }, 30000) // 30 seconds
  }

  private async persistContext(contextId: string, context: VibeContext): Promise<void> {
    try {
      const response = await fetch('/api/v1/universal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('hera_auth_token')}`
        },
        body: JSON.stringify({
          action: 'create',
          table: 'core_entities',
          data: {
            entity_type: 'vibe_context',
            entity_name: `Context: ${context.user_intent}`,
            entity_code: contextId,
            smart_code: context.smart_code,
            description: context.user_intent,
            status: 'active',
            metadata: {
              session_id: context.session_id,
              conversation_state: context.conversation_state,
              task_lineage: context.task_lineage,
              code_evolution: context.code_evolution,
              relationship_map: context.relationship_map,
              business_context: context.business_context,
              timestamp: context.timestamp
            }
          }
        })
      })

      if (!response.ok) {
        console.warn('⚠️ Failed to persist context to database')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.warn('⚠️ Context persistence failed:', errorMessage)
    }
  }

  private async loadContextFromDatabase(contextId: string): Promise<VibeContext | null> {
    try {
      // This would query the database for the specific context
      // Implementation depends on actual API structure
      return null
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.warn('⚠️ Failed to load context from database:', errorMessage)
      return null
    }
  }

  private async logContextEvent(eventType: string, data: any): Promise<void> {
    try {
      const response = await fetch('/api/v1/universal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('hera_auth_token')}`
        },
        body: JSON.stringify({
          action: 'create',
          table: 'universal_transactions',
          data: {
            transaction_type: 'vibe_context_event',
            smart_code: 'HERA.VIBE.CONTEXT.EVENT.LOG.v1',
            metadata: {
              event_type: eventType,
              session_id: this.sessionId,
              organization_id: this.organizationId,
              timestamp: new Date().toISOString(),
              ...data
            }
          }
        })
      })

      if (!response.ok) {
        console.warn('⚠️ Failed to log context event')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.warn('⚠️ Context event logging failed:', errorMessage)
    }
  }

  // Cleanup when destroying context manager
  destroy(): void {
    if (this.autoPreserveInterval) {
      clearInterval(this.autoPreserveInterval)
      this.autoPreserveInterval = null
    }

    this.contexts.clear()
    this.isInitialized = false

    console.log('🧹 Context Manager destroyed')
  }
}

// Session snapshot interface
interface SessionSnapshot {
  session_id: string
  organization_id: string
  start_time: Date
  context_count: number
  active_contexts: string[]
  last_activity: Date
  session_duration: number
}
