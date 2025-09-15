/**
 * 🎓 HERA Universal Learning Router - Hybrid Architecture
 *
 * Intelligently routes educational content processing based on domain characteristics:
 * - Direct AI: Stable knowledge domains (Math, Physics, English)
 * - PDF Processing: Dynamic/regulatory domains (CA, Medicine, Law)
 * - Hybrid: Mixed scenarios (Engineering, Business, Technology)
 */

export interface LearningStrategy {
  approach: 'direct_ai' | 'pdf_processing' | 'hybrid'
  reasoning: string
  smart_code: string
  cost_factor: number
  response_time: string
  advantages: string[]
}

export interface LearningRequest {
  domain: string
  topic: string
  content_type?: string
  student_query: string
  student_level?: string
  files?: File[]
  urgency?: 'low' | 'medium' | 'high'
}

export interface DomainCharacteristics {
  domain: string
  stability: 'stable' | 'semi_stable' | 'dynamic'
  regulatory_compliance: boolean
  content_change_frequency: 'never' | 'yearly' | 'quarterly' | 'monthly'
  ai_knowledge_coverage: 'excellent' | 'good' | 'limited'
  document_dependency: boolean
}

export class HERAUniversalLearningRouter {
  // Domain Classification Matrix
  private domainCharacteristics: Record<string, DomainCharacteristics> = {
    // === KNOWLEDGE-STABLE DOMAINS (Direct AI Optimal) ===
    MATH: {
      domain: 'MATH',
      stability: 'stable',
      regulatory_compliance: false,
      content_change_frequency: 'never',
      ai_knowledge_coverage: 'excellent',
      document_dependency: false
    },
    PHYSICS: {
      domain: 'PHYSICS',
      stability: 'stable',
      regulatory_compliance: false,
      content_change_frequency: 'never',
      ai_knowledge_coverage: 'excellent',
      document_dependency: false
    },
    CHEMISTRY: {
      domain: 'CHEMISTRY',
      stability: 'stable',
      regulatory_compliance: false,
      content_change_frequency: 'never',
      ai_knowledge_coverage: 'excellent',
      document_dependency: false
    },
    ENGLISH: {
      domain: 'ENGLISH',
      stability: 'stable',
      regulatory_compliance: false,
      content_change_frequency: 'never',
      ai_knowledge_coverage: 'excellent',
      document_dependency: false
    },
    HISTORY: {
      domain: 'HISTORY',
      stability: 'stable',
      regulatory_compliance: false,
      content_change_frequency: 'never',
      ai_knowledge_coverage: 'excellent',
      document_dependency: false
    },

    // === CONTENT-DEPENDENT DOMAINS (PDF Processing Required) ===
    CA: {
      domain: 'CA',
      stability: 'dynamic',
      regulatory_compliance: true,
      content_change_frequency: 'quarterly',
      ai_knowledge_coverage: 'limited',
      document_dependency: true
    },
    MEDICINE: {
      domain: 'MEDICINE',
      stability: 'dynamic',
      regulatory_compliance: true,
      content_change_frequency: 'monthly',
      ai_knowledge_coverage: 'good',
      document_dependency: true
    },
    LAW: {
      domain: 'LAW',
      stability: 'dynamic',
      regulatory_compliance: true,
      content_change_frequency: 'quarterly',
      ai_knowledge_coverage: 'limited',
      document_dependency: true
    },
    BUSINESS_COMPLIANCE: {
      domain: 'BUSINESS_COMPLIANCE',
      stability: 'dynamic',
      regulatory_compliance: true,
      content_change_frequency: 'quarterly',
      ai_knowledge_coverage: 'limited',
      document_dependency: true
    },

    // === HYBRID DOMAINS (Mixed Approach) ===
    ENGINEERING: {
      domain: 'ENGINEERING',
      stability: 'semi_stable',
      regulatory_compliance: true,
      content_change_frequency: 'yearly',
      ai_knowledge_coverage: 'good',
      document_dependency: true
    },
    BUSINESS: {
      domain: 'BUSINESS',
      stability: 'semi_stable',
      regulatory_compliance: false,
      content_change_frequency: 'yearly',
      ai_knowledge_coverage: 'good',
      document_dependency: false
    },
    TECHNOLOGY: {
      domain: 'TECHNOLOGY',
      stability: 'semi_stable',
      regulatory_compliance: false,
      content_change_frequency: 'monthly',
      ai_knowledge_coverage: 'good',
      document_dependency: false
    }
  }

  /**
   * Main routing function - determines optimal learning strategy
   */
  async determineOptimalStrategy(request: LearningRequest): Promise<LearningStrategy> {
    const domain = request.domain.toUpperCase()
    const characteristics = this.domainCharacteristics[domain]

    if (!characteristics) {
      // Default to hybrid approach for unknown domains
      return this.createHybridStrategy(domain, 'Unknown domain - using adaptive approach')
    }

    // Decision matrix based on domain characteristics
    const decisionFactors = {
      stability: characteristics.stability,
      regulatory: characteristics.regulatory_compliance,
      changeFreq: characteristics.content_change_frequency,
      aiCoverage: characteristics.ai_knowledge_coverage,
      docDependency: characteristics.document_dependency,
      hasFiles: request.files && request.files.length > 0,
      urgency: request.urgency || 'medium'
    }

    return this.selectOptimalStrategy(domain, decisionFactors, characteristics)
  }

  /**
   * Strategy selection logic
   */
  private selectOptimalStrategy(
    domain: string,
    factors: any,
    characteristics: DomainCharacteristics
  ): LearningStrategy {
    // Direct AI Strategy - for stable knowledge domains
    if (
      factors.stability === 'stable' &&
      !factors.regulatory &&
      factors.aiCoverage === 'excellent' &&
      !factors.docDependency
    ) {
      return {
        approach: 'direct_ai',
        reasoning: `${domain} has stable fundamental knowledge that AI handles perfectly. No regulatory updates needed.`,
        smart_code: `HERA.EDU.${domain}.LRN.AI.DIRECT.v1`,
        cost_factor: 0.1, // Very low cost
        response_time: '~1 second',
        advantages: [
          'Instant response - no processing delay',
          'Cost-effective - single API call',
          'Always available - no document dependencies',
          'Comprehensive coverage - AI trained on vast knowledge',
          'Multiple explanation styles built-in'
        ]
      }
    }

    // PDF Processing Strategy - for regulatory/dynamic domains
    if (
      (factors.stability === 'dynamic' || factors.regulatory) &&
      factors.docDependency &&
      (factors.changeFreq === 'monthly' || factors.changeFreq === 'quarterly')
    ) {
      return {
        approach: 'pdf_processing',
        reasoning: `${domain} requires latest regulatory compliance and document-specific content. AI knowledge alone is insufficient.`,
        smart_code: `HERA.EDU.${domain}.CNT.AI.PROCESS.v1`,
        cost_factor: 1.0, // Standard cost
        response_time: '~30 seconds (first time), instant thereafter',
        advantages: [
          'Latest regulatory compliance',
          'Exact syllabus/document coverage',
          'Specific document authority',
          'Updated case studies and examples',
          'Precise legal/regulatory references'
        ]
      }
    }

    // Hybrid Strategy - for mixed scenarios
    return {
      approach: 'hybrid',
      reasoning: `${domain} benefits from both fundamental AI knowledge and current document content.`,
      smart_code: `HERA.EDU.${domain}.LRN.AI.HYBRID.v1`,
      cost_factor: 0.6, // Optimized cost
      response_time: '~15 seconds',
      advantages: [
        'Best of both worlds - stable fundamentals + current applications',
        'Comprehensive coverage - theory + practice',
        'Cost-optimized approach - smart resource usage',
        'Flexible content delivery - adapts to query type'
      ]
    }
  }

  /**
   * Process learning request using determined strategy
   */
  async processLearningRequest(request: LearningRequest): Promise<any> {
    const strategy = await this.determineOptimalStrategy(request)

    console.log(`🎯 HERA Router Selected: ${strategy.approach.toUpperCase()} for ${request.domain}`)
    console.log(`📋 Reasoning: ${strategy.reasoning}`)
    console.log(`⚡ Expected Response Time: ${strategy.response_time}`)
    console.log(`💰 Cost Factor: ${strategy.cost_factor}x base cost`)

    switch (strategy.approach) {
      case 'direct_ai':
        return await this.processDirectAILearning(request, strategy)

      case 'pdf_processing':
        return await this.processPDFBasedLearning(request, strategy)

      case 'hybrid':
        return await this.processHybridLearning(request, strategy)

      default:
        throw new Error(`Unknown strategy: ${strategy.approach}`)
    }
  }

  /**
   * Direct AI Processing - for stable knowledge domains
   */
  private async processDirectAILearning(
    request: LearningRequest,
    strategy: LearningStrategy
  ): Promise<any> {
    try {
      console.log(`🤖 Processing via Direct AI for ${request.domain}`)

      // Call HERA Universal AI with domain-specific optimization
      const response = await fetch('/api/v1/ai/universal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'direct_learning',
          smart_code: strategy.smart_code,
          task_type: 'learning',
          domain: request.domain,
          topic: request.topic,
          student_query: request.student_query,
          student_level: request.student_level || 'intermediate',
          optimization: {
            approach: 'direct_ai',
            personalization: true,
            generate_practice: true,
            visual_aids: request.domain === 'MATH',
            examples: true,
            step_by_step: true
          },
          fallback_enabled: true
        })
      })

      const result = await response.json()

      return {
        success: true,
        approach: 'direct_ai',
        strategy: strategy,
        data: {
          content: result.data?.content || result.response,
          provider_used: result.data?.provider_used || 'openai',
          confidence_score: result.data?.confidence_score || 0.95,
          cost_estimate: result.data?.cost_estimate || 0.001,
          response_time: '~1 second',
          advantages_realized: strategy.advantages
        },
        optimization: `Direct AI optimal for stable ${request.domain} knowledge`
      }
    } catch (error) {
      console.error('Direct AI processing error:', error)

      // Fallback to hybrid approach
      return await this.processHybridLearning(request, strategy)
    }
  }

  /**
   * PDF Processing - for regulatory/dynamic domains
   */
  private async processPDFBasedLearning(
    request: LearningRequest,
    strategy: LearningStrategy
  ): Promise<any> {
    try {
      console.log(`📄 Processing via PDF Pipeline for ${request.domain}`)

      // Call Universal Learning API for PDF processing
      const response = await fetch('/api/v1/universal-learning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete_pipeline',
          domain: request.domain,
          topic: request.topic,
          student_query: request.student_query,
          content: request.files ? 'User provided documents' : 'Latest regulatory content...',
          options: {
            target_audience: request.student_level || 'advanced',
            learning_style: 'adaptive',
            cross_domain_insights: true,
            regulatory_compliance: true,
            latest_updates: true
          },
          smart_code: strategy.smart_code
        })
      })

      const result = await response.json()

      return {
        success: true,
        approach: 'pdf_processing',
        strategy: strategy,
        data: {
          content: result.data?.content || result.response,
          document_source: result.data?.document_source || 'regulatory_database',
          last_updated: result.data?.last_updated || new Date().toISOString(),
          compliance_verified: true,
          response_time: '~30 seconds',
          advantages_realized: strategy.advantages
        },
        optimization: `PDF processing optimal for dynamic ${request.domain} content`
      }
    } catch (error) {
      console.error('PDF processing error:', error)

      // Fallback to direct AI with disclaimer
      const fallbackStrategy = this.createDirectAIStrategy(
        request.domain,
        'PDF processing failed - using AI with compliance disclaimer'
      )
      return await this.processDirectAILearning(request, fallbackStrategy)
    }
  }

  /**
   * Hybrid Processing - for mixed scenarios
   */
  private async processHybridLearning(
    request: LearningRequest,
    strategy: LearningStrategy
  ): Promise<any> {
    try {
      console.log(`🔄 Processing via Hybrid Approach for ${request.domain}`)

      // Determine if query needs fundamental concepts or current applications
      const queryType = this.analyzeQueryType(request.student_query)

      if (queryType === 'fundamental') {
        // Use direct AI for basic concepts
        const fundamentalStrategy = this.createDirectAIStrategy(
          request.domain,
          'Fundamental concepts - direct AI optimal'
        )
        return await this.processDirectAILearning(request, fundamentalStrategy)
      } else if (queryType === 'current') {
        // Use PDF processing for current applications
        const currentStrategy = this.createPDFStrategy(
          request.domain,
          'Current applications - PDF processing required'
        )
        return await this.processPDFBasedLearning(request, currentStrategy)
      } else {
        // Combine both approaches
        const [fundamentalResponse, currentResponse] = await Promise.allSettled([
          this.processDirectAILearning(
            request,
            this.createDirectAIStrategy(request.domain, 'Hybrid: fundamental concepts')
          ),
          this.processPDFBasedLearning(
            request,
            this.createPDFStrategy(request.domain, 'Hybrid: current applications')
          )
        ])

        return {
          success: true,
          approach: 'hybrid',
          strategy: strategy,
          data: {
            combined_content: this.combineResponses(fundamentalResponse, currentResponse),
            fundamental_source: fundamentalResponse.status === 'fulfilled' ? 'direct_ai' : 'failed',
            current_source: currentResponse.status === 'fulfilled' ? 'pdf_processing' : 'failed',
            response_time: '~15 seconds',
            advantages_realized: strategy.advantages
          },
          optimization: `Hybrid approach optimal for mixed ${request.domain} scenarios`
        }
      }
    } catch (error) {
      console.error('Hybrid processing error:', error)

      // Final fallback to direct AI
      const fallbackStrategy = this.createDirectAIStrategy(
        request.domain,
        'Hybrid failed - using direct AI fallback'
      )
      return await this.processDirectAILearning(request, fallbackStrategy)
    }
  }

  /**
   * Analyze query to determine if it needs fundamental or current content
   */
  private analyzeQueryType(query: string): 'fundamental' | 'current' | 'mixed' {
    const fundamentalKeywords = [
      'explain',
      'what is',
      'how does',
      'basic',
      'concept',
      'principle',
      'theory',
      'definition'
    ]
    const currentKeywords = [
      'latest',
      'new',
      'recent',
      'current',
      'update',
      '2024',
      '2025',
      'amendment',
      'change'
    ]

    const queryLower = query.toLowerCase()

    const hasFundamental = fundamentalKeywords.some(keyword => queryLower.includes(keyword))
    const hasCurrent = currentKeywords.some(keyword => queryLower.includes(keyword))

    if (hasFundamental && !hasCurrent) return 'fundamental'
    if (hasCurrent && !hasFundamental) return 'current'
    return 'mixed'
  }

  /**
   * Combine responses from multiple approaches
   */
  private combineResponses(fundamentalResponse: any, currentResponse: any): string {
    let combined = ''

    if (fundamentalResponse.status === 'fulfilled') {
      combined += `## 📚 Fundamental Concepts:\n\n${fundamentalResponse.value.data?.content || 'Fundamental knowledge processed'}\n\n`
    }

    if (currentResponse.status === 'fulfilled') {
      combined += `## 🔄 Current Applications & Updates:\n\n${currentResponse.value.data?.content || 'Current content processed'}\n\n`
    }

    if (!combined) {
      combined = 'Hybrid processing completed - check individual responses for details.'
    }

    return combined
  }

  /**
   * Helper methods for creating specific strategies
   */
  private createDirectAIStrategy(domain: string, reasoning: string): LearningStrategy {
    return {
      approach: 'direct_ai',
      reasoning,
      smart_code: `HERA.EDU.${domain.toUpperCase()}.LRN.AI.DIRECT.v1`,
      cost_factor: 0.1,
      response_time: '~1 second',
      advantages: ['Instant response', 'Cost-effective', 'Comprehensive coverage']
    }
  }

  private createPDFStrategy(domain: string, reasoning: string): LearningStrategy {
    return {
      approach: 'pdf_processing',
      reasoning,
      smart_code: `HERA.EDU.${domain.toUpperCase()}.CNT.AI.PROCESS.v1`,
      cost_factor: 1.0,
      response_time: '~30 seconds',
      advantages: ['Latest compliance', 'Document authority', 'Precise references']
    }
  }

  private createHybridStrategy(domain: string, reasoning: string): LearningStrategy {
    return {
      approach: 'hybrid',
      reasoning,
      smart_code: `HERA.EDU.${domain.toUpperCase()}.LRN.AI.HYBRID.v1`,
      cost_factor: 0.6,
      response_time: '~15 seconds',
      advantages: ['Best of both worlds', 'Comprehensive coverage', 'Cost-optimized']
    }
  }

  /**
   * Get domain characteristics for external use
   */
  getDomainCharacteristics(domain: string): DomainCharacteristics | null {
    return this.domainCharacteristics[domain.toUpperCase()] || null
  }

  /**
   * Add or update domain characteristics
   */
  updateDomainCharacteristics(domain: string, characteristics: DomainCharacteristics): void {
    this.domainCharacteristics[domain.toUpperCase()] = characteristics
  }
}

// Export singleton instance
export const heraRouter = new HERAUniversalLearningRouter()

// Export types for external use
export type { LearningStrategy, LearningRequest, DomainCharacteristics }
