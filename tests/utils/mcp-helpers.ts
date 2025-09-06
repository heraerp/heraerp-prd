/**
 * HERA MCP Test Utilities
 * Smart Code: HERA.TEST.UTILS.MCP.HELPERS.v1
 */

import { Page, APIResponse } from '@playwright/test'

export interface MCPToolCall {
  tool: string
  input: any
}

export interface MCPResponse {
  success: boolean
  data?: any
  error?: string
  smart_code?: string
}

export class MCPTestHelpers {
  private page: Page
  private baseURL: string
  private organizationId: string

  constructor(page: Page, baseURL = 'http://localhost:3000') {
    this.page = page
    this.baseURL = baseURL
    this.organizationId = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || 'demo-org-123'
  }

  /**
   * Call MCP tool and return response
   */
  async callMCPTool(tool: string, input: any): Promise<MCPResponse> {
    const response = await this.page.request.post(`${this.baseURL}/api/v1/mcp/tools`, {
      data: { tool, input }
    })
    
    return await response.json()
  }

  /**
   * Create test entity via MCP
   */
  async createTestEntity(entityType: string, entityName: string, metadata?: any): Promise<MCPResponse> {
    return this.callMCPTool('create-entity', {
      entity_type: entityType,
      entity_name: entityName,
      organization_id: this.organizationId,
      smart_code: `HERA.TEST.${entityType.toUpperCase()}.v1`,
      ...metadata
    })
  }

  /**
   * Create test transaction via MCP
   */
  async createTestTransaction(transactionType: string, amount: number, metadata?: any): Promise<MCPResponse> {
    return this.callMCPTool('create-transaction', {
      transaction_type: transactionType,
      total_amount: amount,
      organization_id: this.organizationId,
      smart_code: `HERA.TEST.${transactionType.toUpperCase()}.v1`,
      ...metadata
    })
  }

  /**
   * Get intelligent form completion from MCP
   */
  async getIntelligentFormCompletion(businessContext: {
    businessType: string
    industry: string
    size: string
    goals: string[]
  }): Promise<MCPResponse> {
    const response = await this.page.request.post(`${this.baseURL}/api/v1/mcp/intelligent-form-completion`, {
      data: {
        businessContext,
        organizationId: this.organizationId
      }
    })
    
    return await response.json()
  }

  /**
   * Query entities via MCP
   */
  async queryEntities(entityType?: string, filters?: any): Promise<MCPResponse> {
    return this.callMCPTool('query-entities', {
      entity_type: entityType,
      organization_id: this.organizationId,
      filters,
      smart_code: 'HERA.TEST.QUERY.ENTITIES.v1'
    })
  }

  /**
   * Clean up test data
   */
  async cleanupTestData(entityTypes: string[] = []): Promise<MCPResponse> {
    return this.callMCPTool('cleanup-test-data', {
      entity_types: entityTypes,
      organization_id: this.organizationId,
      smart_code: 'HERA.TEST.CLEANUP.v1'
    })
  }

  /**
   * Wait for MCP operation to complete
   */
  async waitForMCPOperation(operationId: string, timeout = 30000): Promise<MCPResponse> {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
      const response = await this.callMCPTool('check-operation-status', {
        operation_id: operationId,
        organization_id: this.organizationId
      })
      
      if (response.success && response.data?.status === 'completed') {
        return response
      }
      
      if (response.data?.status === 'failed') {
        throw new Error(`MCP operation failed: ${response.error}`)
      }
      
      await this.page.waitForTimeout(1000) // Wait 1 second before retry
    }
    
    throw new Error(`MCP operation timed out after ${timeout}ms`)
  }

  /**
   * Validate MCP response
   */
  validateMCPResponse(response: MCPResponse, expectedFields: string[] = []): boolean {
    if (!response.success) {
      console.error('MCP operation failed:', response.error)
      return false
    }
    
    for (const field of expectedFields) {
      if (!(field in (response.data || {}))) {
        console.error(`Missing expected field: ${field}`)
        return false
      }
    }
    
    return true
  }

  /**
   * Log MCP operation for debugging
   */
  logMCPOperation(operation: string, input: any, response: MCPResponse): void {
    console.log(`🔌 MCP Operation: ${operation}`)
    console.log(`📤 Input:`, JSON.stringify(input, null, 2))
    console.log(`📥 Response:`, JSON.stringify(response, null, 2))
  }
}

// Business context presets for testing
export const BUSINESS_CONTEXTS = {
  RESTAURANT: {
    businessType: 'restaurant',
    industry: 'hospitality',
    size: 'medium',
    goals: ['improve_efficiency', 'better_inventory_control', 'financial_visibility']
  },
  
  HEALTHCARE: {
    businessType: 'healthcare',
    industry: 'medical_services',
    size: 'large',
    goals: ['patient_data_management', 'compliance_tracking', 'operational_efficiency']
  },
  
  MANUFACTURING: {
    businessType: 'manufacturing',
    industry: 'industrial',
    size: 'enterprise',
    goals: ['cost_reduction', 'quality_control', 'supply_chain_optimization']
  },
  
  RETAIL: {
    businessType: 'retail',
    industry: 'consumer_goods',
    size: 'medium',
    goals: ['inventory_optimization', 'customer_experience', 'multichannel_sales']
  },
  
  CONSULTING: {
    businessType: 'consulting',
    industry: 'professional_services',
    size: 'small',
    goals: ['project_profitability', 'resource_utilization', 'client_management']
  }
}

// Question type mappings for form automation
export const QUESTION_TYPES = {
  TEXT: 'text',
  TEXTAREA: 'textarea', 
  SELECT: 'select',
  MULTISELECT: 'multiselect',
  YESNO: 'yesno',
  NUMBER: 'number'
}

// Common selectors for form elements
export const FORM_SELECTORS = {
  TEXT_INPUT: 'input[placeholder*="Type your answer"]',
  TEXTAREA: 'textarea[placeholder*="Share your thoughts"]',
  YESNO_YES: 'button:has-text("Yes")',
  YESNO_NO: 'button:has-text("No")',
  NUMBER_INPUT: 'input[type="number"]',
  NEXT_BUTTON: 'button:has-text("Next")',
  PREVIOUS_BUTTON: 'button:has-text("Previous")',
  COMPLETE_BUTTON: 'button:has-text("Complete Assessment")',
  QUESTION_CARD: '[data-testid="question-card"]',
  ERROR_MESSAGE: 'text=This field is required'
}