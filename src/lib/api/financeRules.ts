// ================================================================================
// FINANCE RULES API WRAPPER
// Smart Code: HERA.API.FINANCE_RULES.v1
// Thin wrapper over useUniversalApi for Finance DNA posting rules
// ================================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { universalApi } from '@/lib/universal-api'
import { PostingRule } from '@/lib/schemas/financeRules'

const RULE_KEY_PREFIX = 'FIN_DNA.RULES.'
const RULE_SMART_CODE = 'HERA.FIN.DNA.RULES.CONFIG.V1'

export function useFinanceRulesApi(organizationId: string) {
  const queryClient = useQueryClient()

  // Query keys
  const keys = {
    list: ['finance-rules', organizationId],
    rule: (key: string) => ['finance-rules', organizationId, key]
  }

  // List all rules
  const list = useQuery({
    queryKey: keys.list,
    queryFn: async (): Promise<PostingRule[]> => {
      if (!organizationId) return []

      try {
        // Get all dynamic data with FIN_DNA.RULES. prefix
        const allData = await universalApi.getDynamicDataByPrefix(organizationId, RULE_KEY_PREFIX)

        // Filter and parse as PostingRule
        return Object.entries(allData || {})
          .filter(([key]) => key.startsWith(RULE_KEY_PREFIX))
          .map(([_, value]) => value as PostingRule)
          .sort((a, b) => a.key.localeCompare(b.key))
      } catch (error) {
        console.error('Failed to list finance rules:', error)
        return []
      }
    },
    staleTime: 60 * 1000, // 1 minute
    enabled: !!organizationId
  })

  // Get single rule
  const get = async (key: string): Promise<PostingRule | null> => {
    if (!organizationId || !key) return null

    try {
      const data = await universalApi.getDynamicData(organizationId, key)
      return data as PostingRule | null
    } catch (error) {
      console.error('Failed to get finance rule:', error)
      return null
    }
  }

  // Upsert rule
  const upsert = useMutation({
    mutationFn: async (rule: PostingRule): Promise<void> => {
      if (!organizationId) throw new Error('Organization ID required')

      await universalApi.setDynamicData(
        organizationId,
        rule.key,
        {
          ...rule,
          updated_at: new Date().toISOString()
        },
        RULE_SMART_CODE
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list })
    }
  })

  // Toggle enabled status
  const toggle = useMutation({
    mutationFn: async ({ key, enabled }: { key: string; enabled: boolean }): Promise<void> => {
      if (!organizationId) throw new Error('Organization ID required')

      const rule = await get(key)
      if (!rule) throw new Error('Rule not found')

      await universalApi.setDynamicData(
        organizationId,
        key,
        {
          ...rule,
          enabled,
          updated_at: new Date().toISOString()
        },
        RULE_SMART_CODE
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list })
    }
  })

  // Clone to new version
  const cloneToNewVersion = useMutation({
    mutationFn: async (key: string): Promise<PostingRule> => {
      if (!organizationId) throw new Error('Organization ID required')

      const rule = await get(key)
      if (!rule) throw new Error('Rule not found')

      // Extract version number and increment
      const versionMatch = rule.version.match(/v(\d+)$/)
      const currentVersion = versionMatch ? parseInt(versionMatch[1]) : 1
      const nextVersion = currentVersion + 1

      const newRule: PostingRule = {
        ...rule,
        key: rule.key.replace(/v\d+$/, `v${nextVersion}`),
        version: `v${nextVersion}`,
        enabled: false,
        last_run_at: undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await universalApi.setDynamicData(organizationId, newRule.key, newRule, RULE_SMART_CODE)

      return newRule
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list })
    }
  })

  // Delete rule (soft delete by disabling)
  const remove = useMutation({
    mutationFn: async (key: string): Promise<void> => {
      if (!organizationId) throw new Error('Organization ID required')

      // In production, we might want to soft delete instead
      // For now, we'll just disable the rule
      await toggle.mutateAsync({ key, enabled: false })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: keys.list })
    }
  })

  return {
    // Queries
    rules: list.data || [],
    isLoading: list.isLoading,
    error: list.error,

    // Mutations
    get,
    upsert,
    toggle,
    cloneToNewVersion,
    remove,

    // Refresh
    refetch: () => queryClient.invalidateQueries({ queryKey: keys.list })
  }
}
