/**
 * HERA ERP Readiness Questionnaire API Service
 * Smart Code: HERA.ERP.READINESS.API.SERVICE.V1
 * 
 * Integration layer for Sacred Six Tables architecture
 */

import type {
  QuestionnaireTemplate,
  QuestionnaireSession,
  CreateSessionRequest,
  SaveAnswerRequest,
  AnswerLine,
  AIInsights,
  ExportRequest,
  ExportResult,
  SessionAPI
} from './types'

/**
 * Sacred Six Tables Mapping:
 * 
 * core_organizations: Multi-tenant isolation
 * core_entities: Questionnaire sessions, templates, questions as entities
 * core_dynamic_data: Question properties, AI insights, custom configurations
 * core_relationships: Question -> Section, Session -> Template relationships
 * universal_transactions: Session headers (one per assessment session)
 * universal_transaction_lines: Individual question answers
 */

export class ReadinessQuestionnaireService {
  private baseUrl: string
  private organizationId: string

  constructor(baseUrl = '/api/v1', organizationId: string) {
    this.baseUrl = baseUrl
    this.organizationId = organizationId
  }

  /**
   * Create new questionnaire session
   * Creates entities and transaction header in Sacred Six Tables
   */
  async createSession(request: CreateSessionRequest): Promise<QuestionnaireSession> {
    // In production, this would:
    // 1. Create session entity in core_entities with entity_type='questionnaire_session'
    // 2. Create transaction header in universal_transactions
    // 3. Link session to template via core_relationships
    
    const response = await fetch(`${this.baseUrl}/readiness/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-ID': this.organizationId
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Save question answer
   * Stores answer as transaction line in universal_transaction_lines
   */
  async saveAnswer(sessionId: string, answer: SaveAnswerRequest): Promise<void> {
    // In production, this would:
    // 1. Create/update transaction line in universal_transaction_lines
    // 2. Store response_value, response_text, and smart_code
    // 3. Update session progress in core_dynamic_data
    
    const response = await fetch(`${this.baseUrl}/readiness/sessions/${sessionId}/answers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-ID': this.organizationId
      },
      body: JSON.stringify({
        ...answer,
        smart_code: 'HERA.ERP.Readiness.Answer.Line.V1'
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to save answer: ${response.statusText}`)
    }
  }

  /**
   * Update session navigation (next/prev)
   * Updates current_index in core_dynamic_data
   */
  async updateSessionProgress(sessionId: string, currentIndex: number): Promise<QuestionnaireSession> {
    const response = await fetch(`${this.baseUrl}/readiness/sessions/${sessionId}/progress`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-ID': this.organizationId
      },
      body: JSON.stringify({
        current_index: currentIndex,
        smart_code: 'HERA.ERP.Readiness.Session.Progress.V1'
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to update progress: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Complete assessment session
   * Triggers AI analysis and stores insights in core_dynamic_data
   */
  async completeSession(sessionId: string): Promise<QuestionnaireSession> {
    const response = await fetch(`${this.baseUrl}/readiness/sessions/${sessionId}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-ID': this.organizationId
      },
      body: JSON.stringify({
        smart_code: 'HERA.ERP.Readiness.Session.Complete.V1'
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to complete session: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get session by ID
   * Retrieves from core_entities with related transaction lines
   */
  async getSession(sessionId: string): Promise<QuestionnaireSession> {
    const response = await fetch(`${this.baseUrl}/readiness/sessions/${sessionId}`, {
      headers: {
        'X-Organization-ID': this.organizationId
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get session: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get AI insights for completed session
   * Retrieves insights from core_dynamic_data
   */
  async getAIInsights(sessionId: string): Promise<AIInsights> {
    const response = await fetch(`${this.baseUrl}/readiness/sessions/${sessionId}/insights`, {
      headers: {
        'X-Organization-ID': this.organizationId
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get insights: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Export session results
   * Generates downloadable report from Sacred Six Tables data
   */
  async exportSession(request: ExportRequest): Promise<ExportResult> {
    const response = await fetch(`${this.baseUrl}/readiness/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-ID': this.organizationId
      },
      body: JSON.stringify(request)
    })

    if (!response.ok) {
      throw new Error(`Failed to export session: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Create SessionAPI for React components
   * Provides component-friendly interface to the service
   */
  createSessionAPI(session: QuestionnaireSession): SessionAPI {
    return {
      saveAnswer: async (line: AnswerLine): Promise<void> => {
        await this.saveAnswer(session.id, {
          question_id: line.question_id,
          sequence: line.sequence,
          response_value: line.response_value,
          response_text: line.response_text,
          attachments: line.attachments
        })
      },

      next: async (): Promise<QuestionnaireSession> => {
        return this.updateSessionProgress(session.id, session.current_index + 1)
      },

      prev: async (): Promise<QuestionnaireSession> => {
        return this.updateSessionProgress(session.id, Math.max(0, session.current_index - 1))
      },

      complete: async (): Promise<QuestionnaireSession> => {
        return this.completeSession(session.id)
      }
    }
  }
}

/**
 * AI Analysis Service
 * Processes questionnaire responses for intelligent insights
 */
export class ReadinessAIService {
  private organizationId: string

  constructor(organizationId: string) {
    this.organizationId = organizationId
  }

  /**
   * Analyze questionnaire responses
   * Uses HERA Universal AI System for intelligent analysis
   */
  async analyzeResponses(sessionId: string, answers: AnswerLine[]): Promise<AIInsights> {
    // In production, this would:
    // 1. Query all answers from universal_transaction_lines
    // 2. Send to HERA Universal AI System for analysis
    // 3. Generate readiness scores, risk flags, and recommendations
    // 4. Store results in core_dynamic_data with smart codes

    const analysisPrompt = this.buildAnalysisPrompt(answers)
    
    const response = await fetch('/api/v1/ai/universal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Organization-ID': this.organizationId
      },
      body: JSON.stringify({
        action: 'analyze_erp_readiness',
        smart_code: 'HERA.ERP.Readiness.AI.Analysis.V1',
        task_type: 'data_analysis',
        prompt: analysisPrompt,
        context: {
          session_id: sessionId,
          total_questions: answers.length,
          organization_id: this.organizationId
        }
      })
    })

    if (!response.ok) {
      throw new Error(`AI analysis failed: ${response.statusText}`)
    }

    const result = await response.json()
    return this.parseAIResponse(result)
  }

  private buildAnalysisPrompt(answers: AnswerLine[]): string {
    return `
      Analyze the following ERP readiness assessment responses and provide:
      1. Overall readiness score (0-100)
      2. Section-specific scores and gaps
      3. Risk flags for credit, compliance, and operational areas
      4. Top 3 priority recommendations
      5. Integration suggestions based on responses

      Assessment Responses:
      ${answers.map(answer => 
        `Question ${answer.question_id}: ${JSON.stringify(answer.response_value)}`
      ).join('\n')}

      Provide analysis in structured JSON format following the AIInsights interface.
    `
  }

  private parseAIResponse(result: any): AIInsights {
    // Parse AI response and structure it according to AIInsights interface
    return {
      overall_readiness: result.overall_readiness || 75,
      section_summaries: result.section_summaries || {},
      risk_flags: result.risk_flags || {},
      integration_suggestions: result.integration_suggestions || {},
      top_priorities: result.top_priorities || []
    }
  }
}

/**
 * Validation Service
 * Provides client-side and server-side validation
 */
export class ReadinessValidationService {
  validateAnswer(question: any, value: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    // Required field validation
    if (question.required) {
      if (value === undefined || value === null || value === '') {
        errors.push('This field is required')
      }
      
      if (Array.isArray(value) && value.length === 0) {
        errors.push('Please select at least one option')
      }
    }

    // Type-specific validation
    switch (question.input_type) {
      case 'number':
        if (value && isNaN(Number(value))) {
          errors.push('Please enter a valid number')
        }
        if (value && Number(value) < 0) {
          errors.push('Please enter a positive number')
        }
        break

      case 'text':
      case 'textarea':
        if (value && typeof value === 'string' && value.length > 1000) {
          errors.push('Response is too long (max 1000 characters)')
        }
        break

      case 'multiselect':
        if (value && Array.isArray(value) && value.length > 10) {
          errors.push('Please select no more than 10 options')
        }
        break
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }
}

// Export service instances
export const createReadinessServices = (organizationId: string) => ({
  questionnaireService: new ReadinessQuestionnaireService('/api/v1', organizationId),
  aiService: new ReadinessAIService(organizationId),
  validationService: new ReadinessValidationService()
})