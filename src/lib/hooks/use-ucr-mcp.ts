import { useState, useCallback } from 'react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { toast } from '@/components/ui/use-toast'

export interface UCRTemplate {
  template_id: string
  industry: string
  module: string
  smart_code: string
  title: string
  rule_payload: any
}

export interface UCRRule {
  id: string
  organization_id: string
  smart_code: string
  title: string
  status: string
  tags: string[]
  owner: string
  created_by: string
  version: number
  schema_version: number
  rule_payload: any
}

export interface SimulationResult {
  scenario_id: string
  passed: boolean
  actual?: any
  expected?: any
  diff?: any
  error?: string
}

export function useUCRMCP() {
  const { currentOrganization } = useMultiOrgAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const callTool = useCallback(
    async (tool: string, args: any = {}) => {
      if (!currentOrganization) {
        throw new Error('No organization selected')
      }

      setLoading(true)
      setError(null)

      try {
        const response = await fetch('/api/v1/mcp/ucr', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tool,
            args,
            organizationId: currentOrganization.id
          })
        })

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Tool execution failed')
        }

        const result = await response.json()
        return result
      } catch (err: any) {
        setError(err.message)
        toast({
          title: 'Error',
          description: err.message,
          variant: 'destructive'
        })
        throw err
      } finally {
        setLoading(false)
      }
    },
    [currentOrganization]
  )

  // Convenience methods for common operations
  const listTemplates = useCallback(
    async (industry?: string, module?: string) => {
      const result = await callTool('list_templates', { industry, module })
      return result.templates as UCRTemplate[]
    },
    [callTool]
  )

  const cloneTemplate = useCallback(
    async (templateId: string, targetSmartCode: string) => {
      const result = await callTool('clone_template', {
        template_id: templateId,
        target_smart_code: targetSmartCode
      })
      return result as { rule_id: string; version: number }
    },
    [callTool]
  )

  const getRule = useCallback(
    async (ruleId?: string, smartCode?: string) => {
      const result = await callTool('get_rule', { rule_id: ruleId, smart_code: smartCode })
      return result.rule as UCRRule
    },
    [callTool]
  )

  const validateRule = useCallback(
    async (draftRule: Partial<UCRRule>) => {
      const result = await callTool('validate_rule', { draft_rule: draftRule })
      return result as { ok: boolean; errors: string[]; warnings: string[] }
    },
    [callTool]
  )

  const simulateRule = useCallback(
    async (scenarios: any[], ruleId?: string, draftRule?: any) => {
      const result = await callTool('simulate_rule', {
        rule_id: ruleId,
        draft_rule: draftRule,
        scenarios
      })
      return result as {
        results: SimulationResult[]
        coverage: number
        regressions: any[]
        passed: number
        failed: number
      }
    },
    [callTool]
  )

  const deployRule = useCallback(
    async (
      ruleId: string,
      scope: any,
      effectiveFrom: string,
      effectiveTo?: string,
      approvals?: any[]
    ) => {
      const result = await callTool('deploy_rule', {
        rule_id: ruleId,
        scope,
        effective_from: effectiveFrom,
        effective_to: effectiveTo,
        approvals: approvals || []
      })
      return result as { deployment_txn_id: string }
    },
    [callTool]
  )

  const searchRules = useCallback(
    async (query: string, tags?: string[], includeDeprecated = false) => {
      const result = await callTool('search', {
        query,
        tags,
        include_deprecated: includeDeprecated
      })
      return result.rules as UCRRule[]
    },
    [callTool]
  )

  const getAuditLog = useCallback(
    async (objectRef: string, from?: string, to?: string) => {
      const result = await callTool('audit_log', {
        object_ref: objectRef,
        from,
        to
      })
      return result.events as any[]
    },
    [callTool]
  )

  return {
    loading,
    error,
    callTool,
    // Convenience methods
    listTemplates,
    cloneTemplate,
    getRule,
    validateRule,
    simulateRule,
    deployRule,
    searchRules,
    getAuditLog
  }
}
