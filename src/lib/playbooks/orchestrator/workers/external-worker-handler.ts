/**
 * HERA Playbooks External Worker Handler
 *
 * Handles external API integrations, webhook calls, and third-party
 * service orchestration with retry logic and response mapping.
 */
import { universalApi } from '@/lib/universal-api'
import { ExecutionResult } from '../playbook-orchestrator-daemon'
import { PlaybookSmartCodes } from '../../smart-codes/playbook-smart-codes'

interface ExternalTaskConfig {
  endpoint: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  authentication?: {
    type: 'bearer' | 'basic' | 'api-key' | 'oauth2'
    credentials: Record<string, string>
  }
  body?: any
  responseMapping?: ResponseMapping
  retryConfig?: {
    maxAttempts: number
    backoffMs: number
    backoffMultiplier: number
  }
  timeout?: number
  validationRules?: ValidationRule[]
}

interface ResponseMapping {
  successPath?: string
  dataPath?: string
  errorPath?: string
  transformations?: Array<{
    from: string
    to: string
    transform?: 'uppercase' | 'lowercase' | 'date' | 'number' | 'boolean'
  }>
}

interface ValidationRule {
  field: string
  type: 'required' | 'type' | 'pattern' | 'range'
  value?: any
  message: string
}

interface ExternalExecutionContext {
  runId: string
  stepId: string
  organizationId: string
  metadata: any
  config: ExternalTaskConfig
}

export class ExternalWorkerHandler {
  private requestCache: Map<string, any> = new Map()

  async execute(context: ExternalExecutionContext): Promise<ExecutionResult> {
    const startTime = Date.now()

    try {
      console.log(`Executing external API call for step ${context.stepId}`)

      // 1. Prepare request with authentication
      const request = await this.prepareRequest(context)

      // 2. Execute with retry logic
      const response = await this.executeWithRetry(request, context.config.retryConfig)

      // 3. Validate response
      await this.validateResponse(response, context.config.validationRules)

      // 4. Map response data
      const mappedData = await this.mapResponseData(response, context.config.responseMapping)

      // 5. Store external call metadata
      await this.storeExternalMetadata(context, response, mappedData, startTime)

      // 6. Create result transaction
      const resultTransaction = await universalApi.createTransaction({
        transaction_type: 'playbook_external_result',
        organization_id: context.organizationId,
        reference_entity_id: context.stepId,
        smart_code: PlaybookSmartCodes.EXECUTION.EXTERNAL_RESULT,
        total_amount: 0,
        metadata: {
          run_id: context.runId,
          step_id: context.stepId,
          endpoint: context.config.endpoint,
          method: context.config.method,
          status_code: response.status,
          execution_time_ms: Date.now() - startTime,
          response_size: JSON.stringify(mappedData).length,
          result: mappedData
        }
      })

      return {
        success: true,
        status: 'completed',
        outputData: {
          external_response: mappedData,
          status_code: response.status,
          transaction_id: resultTransaction.id
        }
      }
    } catch (error) {
      console.error('External execution failed:', error)

      // Log error
      await this.logExternalError(context, error, startTime)

      return {
        success: false,
        status: 'failed',
        error: error instanceof Error ? error.message : 'External API call failed'
      }
    }
  }

  private async prepareRequest(context: ExternalExecutionContext): Promise<any> {
    const { config } = context
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.headers
    }

    // Add authentication headers
    if (config.authentication) {
      switch (config.authentication.type) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${config.authentication.credentials.token}`
          break
        case 'basic':
          const basicAuth = Buffer.from(
            `${config.authentication.credentials.username}:${config.authentication.credentials.password}`
          ).toString('base64')
          headers['Authorization'] = `Basic ${basicAuth}`
          break
        case 'api-key':
          const keyName = config.authentication.credentials.headerName || 'X-API-Key'
          headers[keyName] = config.authentication.credentials.key
          break
        case 'oauth2':
          // OAuth2 would require token refresh logic
          headers['Authorization'] = `Bearer ${config.authentication.credentials.accessToken}`
          break
      }
    }

    // Interpolate variables in endpoint and body
    const interpolatedEndpoint = await this.interpolateVariables(config.endpoint, context)
    const interpolatedBody = config.body
      ? await this.interpolateVariables(JSON.stringify(config.body), context)
      : undefined

    return {
      url: interpolatedEndpoint,
      method: config.method,
      headers,
      body: interpolatedBody ? JSON.parse(interpolatedBody) : undefined,
      timeout: config.timeout || 30000
    }
  }

  private async executeWithRetry(request: any, retryConfig?: any): Promise<any> {
    const maxAttempts = retryConfig?.maxAttempts || 3
    let backoff = retryConfig?.backoffMs || 1000
    const multiplier = retryConfig?.backoffMultiplier || 2

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxAttempts}: ${request.method} ${request.url}`)

        // Simulate external API call
        const response = await this.simulateExternalCall(request)

        // Check if response indicates success
        if (response.status >= 200 && response.status < 300) {
          return response
        }

        // Retry on 5xx errors or specific 4xx errors
        if (response.status >= 500 || response.status === 429) {
          if (attempt < maxAttempts) {
            console.log(`Retrying after ${backoff}ms...`)
            await new Promise(resolve => setTimeout(resolve, backoff))
            backoff *= multiplier
            continue
          }
        }

        // Non-retryable error
        throw new Error(`External API returned ${response.status}: ${response.statusText}`)
      } catch (error) {
        if (attempt === maxAttempts) {
          throw error
        }
        console.log(`Request failed, retrying after ${backoff}ms...`)
        await new Promise(resolve => setTimeout(resolve, backoff))
        backoff *= multiplier
      }
    }

    throw new Error('Max retry attempts exceeded')
  }

  private async simulateExternalCall(request: any): Promise<any> {
    // Simulate different external API responses
    const simulatedResponses = [
      {
        url: /crm/,
        response: {
          status: 200,
          statusText: 'OK',
          data: {
            success: true,
            customer: {
              id: 'cust_123',
              name: 'ACME Corp',
              email: 'contact@acme.com',
              status: 'active'
            }
          }
        }
      },
      {
        url: /payment/,
        response: {
          status: 200,
          statusText: 'OK',
          data: {
            success: true,
            transaction: {
              id: 'txn_456',
              amount: 1500,
              currency: 'USD',
              status: 'completed'
            }
          }
        }
      },
      {
        url: /inventory/,
        response: {
          status: 200,
          statusText: 'OK',
          data: {
            success: true,
            items: [
              { sku: 'PROD001', quantity: 50, location: 'A1' },
              { sku: 'PROD002', quantity: 30, location: 'B2' }
            ]
          }
        }
      },
      {
        url: /webhook/,
        response: {
          status: 200,
          statusText: 'OK',
          data: {
            received: true,
            processed: true,
            message: 'Webhook processed successfully'
          }
        }
      }
    ]

    // Find matching simulated response
    const match = simulatedResponses.find(sim => sim.url.test(request.url))
    if (match) {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 400))
      return match.response
    }

    // Default response
    return {
      status: 200,
      statusText: 'OK',
      data: {
        success: true,
        message: 'External API call simulated',
        timestamp: new Date().toISOString()
      }
    }
  }

  private async validateResponse(response: any, rules?: ValidationRule[]): Promise<void> {
    if (!rules || rules.length === 0) return

    const data = response.data

    for (const rule of rules) {
      const value = this.getNestedValue(data, rule.field)

      switch (rule.type) {
        case 'required':
          if (value === undefined || value === null || value === '') {
            throw new Error(rule.message)
          }
          break

        case 'type':
          if (typeof value !== rule.value) {
            throw new Error(rule.message)
          }
          break

        case 'pattern':
          if (!new RegExp(rule.value).test(String(value))) {
            throw new Error(rule.message)
          }
          break

        case 'range':
          const num = Number(value)
          const [min, max] = rule.value
          if (num < min || num > max) {
            throw new Error(rule.message)
          }
          break
      }
    }
  }

  private async mapResponseData(response: any, mapping?: ResponseMapping): Promise<any> {
    if (!mapping) return response.data

    const data = response.data
    let result: any = {}

    // Extract success status
    if (mapping.successPath) {
      result.success = this.getNestedValue(data, mapping.successPath)
    }

    // Extract main data
    if (mapping.dataPath) {
      result.data = this.getNestedValue(data, mapping.dataPath)
    } else {
      result.data = data
    }

    // Extract error if any
    if (mapping.errorPath) {
      result.error = this.getNestedValue(data, mapping.errorPath)
    }

    // Apply transformations
    if (mapping.transformations) {
      for (const transform of mapping.transformations) {
        const value = this.getNestedValue(result.data, transform.from)
        if (value !== undefined) {
          const transformedValue = this.applyTransformation(value, transform.transform)
          this.setNestedValue(result.data, transform.to, transformedValue)
        }
      }
    }

    return result
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  private setNestedValue(obj: any, path: string, value: any): void {
    const keys = path.split('.')
    const lastKey = keys.pop()!
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {}
      return current[key]
    }, obj)
    target[lastKey] = value
  }

  private applyTransformation(value: any, transform?: string): any {
    if (!transform) return value

    switch (transform) {
      case 'uppercase':
        return String(value).toUpperCase()
      case 'lowercase':
        return String(value).toLowerCase()
      case 'date':
        return new Date(value).toISOString()
      case 'number':
        return Number(value)
      case 'boolean':
        return Boolean(value)
      default:
        return value
    }
  }

  private async interpolateVariables(
    template: string,
    context: ExternalExecutionContext
  ): Promise<string> {
    // Get previous step results
    const previousResults = await this.getPreviousStepResults(context.runId)

    // Build variable context
    const variables: Record<string, any> = {
      run_id: context.runId,
      step_id: context.stepId,
      organization_id: context.organizationId,
      ...context.metadata
    }

    // Add previous step results
    previousResults.forEach((result, index) => {
      variables[`step_${index}_result`] = result.metadata?.result
    })

    // Replace variables in template
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] !== undefined ? String(variables[key]) : match
    })
  }

  private async getPreviousStepResults(runId: string): Promise<any[]> {
    const results = await universalApi.readTransactions({
      filters: {
        organization_id: universalApi.organizationId,
        transaction_type: 'playbook_step_result',
        metadata: { run_id: runId }
      },
      limit: 10
    })

    return results || []
  }

  private async storeExternalMetadata(
    context: ExternalExecutionContext,
    response: any,
    mappedData: any,
    startTime: number
  ): Promise<void> {
    await universalApi.setDynamicField(
      context.stepId,
      'external_call_details',
      JSON.stringify({
        endpoint: context.config.endpoint,
        method: context.config.method,
        status_code: response.status,
        execution_time_ms: Date.now() - startTime,
        response_size: JSON.stringify(mappedData).length,
        timestamp: new Date().toISOString()
      })
    )
  }

  private async logExternalError(
    context: ExternalExecutionContext,
    error: any,
    startTime: number
  ): Promise<void> {
    await universalApi.createTransaction({
      transaction_type: 'playbook_external_error',
      organization_id: context.organizationId,
      reference_entity_id: context.stepId,
      smart_code: PlaybookSmartCodes.EXECUTION.ERROR,
      total_amount: 0,
      metadata: {
        run_id: context.runId,
        step_id: context.stepId,
        endpoint: context.config.endpoint,
        method: context.config.method,
        error_message: error.message || 'Unknown error',
        error_stack: error.stack,
        execution_time_ms: Date.now() - startTime,
        timestamp: new Date().toISOString()
      }
    })
  }
}
