/**
 * HERA Playbooks Security Middleware
 *
 * Enforces permissions_required on step entry points and handles
 * security validation for playbook execution.
 */
import { universalApi } from '@/lib/universal-api'
import { playbookAuthService } from '../auth/playbook-auth'
import { PlaybookSmartCodes } from '../smart-codes/playbook-smart-codes'

interface StepPermissionCheck {
  stepId: string
  stepName: string
  requiredPermissions: string[]
  userId: string
  organizationId: string
  context?: Record<string, any>
}

interface PermissionCheckResult {
  allowed: boolean
  missingPermissions?: string[]
  reason?: string
}

export class PlaybookSecurityMiddleware {
  /**
   * Check if a user has all required permissions for a step
   */
  async checkStepPermissions(check: StepPermissionCheck): Promise<PermissionCheckResult> {
    try {
      const { stepId, requiredPermissions, userId, organizationId, context } = check

      // If no permissions required, allow access
      if (!requiredPermissions || requiredPermissions.length === 0) {
        return { allowed: true }
      }

      // Check each required permission
      const missingPermissions: string[] = []

      for (const permission of requiredPermissions) {
        const hasPermission = await playbookAuthService.checkPermission(
          userId,
          organizationId,
          permission,
          context
        )

        if (!hasPermission) {
          missingPermissions.push(permission)
        }
      }

      // Log permission check
      await this.logPermissionCheck({
        ...check,
        allowed: missingPermissions.length === 0,
        missingPermissions
      })

      if (missingPermissions.length > 0) {
        return {
          allowed: false,
          missingPermissions,
          reason: `Missing required permissions: ${missingPermissions.join(', ')}`
        }
      }

      return { allowed: true }
    } catch (error) {
      console.error('Permission check failed:', error)

      // Log error
      await this.logPermissionError(check, error)

      // Fail closed - deny access on error
      return {
        allowed: false,
        reason: 'Permission check failed due to system error'
      }
    }
  }

  /**
   * Validate step execution permissions before running
   */
  async validateStepExecution(
    runId: string,
    stepSequence: number,
    userId: string,
    organizationId: string
  ): Promise<PermissionCheckResult> {
    try {
      // Get the step line
      const stepLines = await universalApi.readTransactionLines({
        transaction_id: runId,
        filters: { line_number: stepSequence }
      })

      if (!stepLines || stepLines.length === 0) {
        return {
          allowed: false,
          reason: 'Step not found'
        }
      }

      const stepLine = stepLines[0]
      const metadata = stepLine.metadata || {}

      // Get step configuration with permissions
      const stepConfig = await this.getStepConfiguration(metadata.step_id)
      const requiredPermissions = stepConfig?.permissions_required || []

      // Special handling for different step types
      const stepTypePermissions = this.getStepTypePermissions(metadata.step_type)
      const allPermissions = [...new Set([...requiredPermissions, ...stepTypePermissions])]

      // Check permissions
      const result = await this.checkStepPermissions({
        stepId: metadata.step_id,
        stepName: metadata.step_name,
        requiredPermissions: allPermissions,
        userId,
        organizationId,
        context: {
          runId,
          stepSequence,
          playbookId: metadata.playbook_id
        }
      })

      return result
    } catch (error) {
      console.error('Step execution validation failed:', error)
      return {
        allowed: false,
        reason: 'Validation failed due to system error'
      }
    }
  }

  /**
   * Get step-type specific permissions
   */
  private getStepTypePermissions(stepType: string): string[] {
    const typePermissions: Record<string, string[]> = {
      human: ['PLAYBOOK_STEP_EXECUTE_HUMAN'],
      system: ['PLAYBOOK_STEP_EXECUTE_SYSTEM'],
      ai: ['PLAYBOOK_STEP_EXECUTE_AI'],
      external: ['PLAYBOOK_STEP_EXECUTE_EXTERNAL']
    }

    return typePermissions[stepType] || []
  }

  /**
   * Get step configuration including permissions
   */
  private async getStepConfiguration(stepId: string): Promise<any> {
    if (!stepId) return null

    const steps = await universalApi.readEntities({
      filters: {
        id: stepId,
        entity_type: 'playbook_step'
      }
    })

    return steps && steps.length > 0 ? steps[0].metadata : null
  }

  /**
   * Check data access permissions for step inputs/outputs
   */
  async checkDataAccess(
    userId: string,
    organizationId: string,
    dataType: 'read' | 'write',
    entityIds: string[]
  ): Promise<PermissionCheckResult> {
    try {
      // Check if user can access the specified entities
      const permission = dataType === 'read' ? 'ENTITY_DATA_READ' : 'ENTITY_DATA_WRITE'

      const unauthorizedEntities: string[] = []

      for (const entityId of entityIds) {
        // Check entity-specific permission
        const hasAccess = await playbookAuthService.checkPermission(
          userId,
          organizationId,
          permission,
          { entityId }
        )

        if (!hasAccess) {
          unauthorizedEntities.push(entityId)
        }
      }

      if (unauthorizedEntities.length > 0) {
        return {
          allowed: false,
          reason: `Unauthorized access to entities: ${unauthorizedEntities.join(', ')}`
        }
      }

      return { allowed: true }
    } catch (error) {
      console.error('Data access check failed:', error)
      return {
        allowed: false,
        reason: 'Data access check failed'
      }
    }
  }

  /**
   * Validate API endpoint access for external steps
   */
  async validateExternalEndpoint(
    userId: string,
    organizationId: string,
    endpoint: string,
    method: string
  ): Promise<PermissionCheckResult> {
    try {
      // Parse endpoint to extract domain
      const url = new URL(endpoint)
      const domain = url.hostname

      // Check if domain is whitelisted for the organization
      const whitelistedDomains = await this.getWhitelistedDomains(organizationId)

      if (!whitelistedDomains.includes(domain) && !whitelistedDomains.includes('*')) {
        return {
          allowed: false,
          reason: `Domain ${domain} is not whitelisted for external API calls`
        }
      }

      // Check method-specific permissions
      const methodPermission = `EXTERNAL_API_${method.toUpperCase()}`
      const hasPermission = await playbookAuthService.checkPermission(
        userId,
        organizationId,
        methodPermission
      )

      if (!hasPermission) {
        return {
          allowed: false,
          missingPermissions: [methodPermission],
          reason: `Missing permission for ${method} requests to external APIs`
        }
      }

      return { allowed: true }
    } catch (error) {
      console.error('External endpoint validation failed:', error)
      return {
        allowed: false,
        reason: 'Invalid endpoint URL'
      }
    }
  }

  /**
   * Get whitelisted domains for external API calls
   */
  private async getWhitelistedDomains(organizationId: string): Promise<string[]> {
    // Get organization settings
    const settings = await universalApi.readDynamicData({
      filters: {
        organization_id: organizationId,
        entity_type: 'organization',
        field_name: 'whitelisted_domains'
      }
    })

    if (settings && settings.length > 0) {
      const domains = settings[0].field_value_text
      return domains ? JSON.parse(domains) : []
    }

    // Default whitelist (can be configured)
    return ['api.heraerp.com', 'localhost', '127.0.0.1']
  }

  /**
   * Enforce rate limiting for step execution
   */
  async checkRateLimit(
    userId: string,
    organizationId: string,
    stepType: string
  ): Promise<PermissionCheckResult> {
    try {
      const rateLimitKey = `playbook_step_${stepType}_${userId}`
      const windowMinutes = 5
      const maxRequests = this.getStepTypeRateLimit(stepType)

      // Get recent executions
      const recentExecutions = await universalApi.readTransactions({
        filters: {
          organization_id: organizationId,
          transaction_type: 'playbook_step_execution',
          'metadata.user_id': userId,
          'metadata.step_type': stepType,
          created_at: {
            $gte: new Date(Date.now() - windowMinutes * 60 * 1000).toISOString()
          }
        }
      })

      const executionCount = recentExecutions?.length || 0

      if (executionCount >= maxRequests) {
        return {
          allowed: false,
          reason: `Rate limit exceeded: ${executionCount}/${maxRequests} ${stepType} steps in ${windowMinutes} minutes`
        }
      }

      return { allowed: true }
    } catch (error) {
      console.error('Rate limit check failed:', error)
      // Allow on error to prevent blocking legitimate requests
      return { allowed: true }
    }
  }

  /**
   * Get rate limits by step type
   */
  private getStepTypeRateLimit(stepType: string): number {
    const limits: Record<string, number> = {
      human: 100, // 100 human tasks per 5 minutes
      system: 500, // 500 system tasks per 5 minutes
      ai: 50, // 50 AI tasks per 5 minutes (expensive)
      external: 200 // 200 external API calls per 5 minutes
    }

    return limits[stepType] || 100
  }

  /**
   * Log permission check for audit trail
   */
  private async logPermissionCheck(
    check: StepPermissionCheck & { allowed: boolean; missingPermissions?: string[] }
  ): Promise<void> {
    try {
      await universalApi.createTransaction({
        transaction_type: 'playbook_permission_check',
        organization_id: check.organizationId,
        smart_code: PlaybookSmartCodes.SECURITY.PERMISSION_CHECK,
        total_amount: 0,
        metadata: {
          step_id: check.stepId,
          step_name: check.stepName,
          user_id: check.userId,
          required_permissions: check.requiredPermissions,
          missing_permissions: check.missingPermissions,
          allowed: check.allowed,
          context: check.context,
          timestamp: new Date().toISOString()
        }
      })
    } catch (error) {
      console.error('Failed to log permission check:', error)
    }
  }

  /**
   * Log permission error
   */
  private async logPermissionError(check: StepPermissionCheck, error: any): Promise<void> {
    try {
      await universalApi.createTransaction({
        transaction_type: 'playbook_permission_error',
        organization_id: check.organizationId,
        smart_code: PlaybookSmartCodes.SECURITY.PERMISSION_ERROR,
        total_amount: 0,
        metadata: {
          step_id: check.stepId,
          step_name: check.stepName,
          user_id: check.userId,
          error_message: error.message || 'Unknown error',
          error_stack: error.stack,
          timestamp: new Date().toISOString()
        }
      })
    } catch (logError) {
      console.error('Failed to log permission error:', logError)
    }
  }
}

// Export singleton instance
export const playbookSecurityMiddleware = new PlaybookSecurityMiddleware()
