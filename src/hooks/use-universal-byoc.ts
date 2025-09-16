'use client'

/**
 * Universal BYOC React Hook
 * Easy integration hook for managing BYOC configurations in any HERA application
 */

import { useState, useEffect, useCallback } from 'react'
import { BYOCConfiguration, BYOCTestResult, createBYOCService } from '@/src/lib/universal/byoc-service'

export interface UseBYOCOptions {
  applicationId: string
  organizationId: string
  userId: string
  userRole?: 'admin' | 'user' | 'viewer'
  autoLoad?: boolean
  encryptionKey?: string
}

export interface BYOCHookReturn {
  // State
  configurations: BYOCConfiguration[]
  activeConfig: BYOCConfiguration | null
  loading: boolean
  error: string | null
  testResults: Record<string, BYOCTestResult>

  // Actions
  loadConfigurations: () => Promise<void>
  saveConfiguration: (config: Partial<BYOCConfiguration>) => Promise<boolean>
  activateConfiguration: (configId: string) => Promise<boolean>
  deleteConfiguration: (configId: string) => Promise<boolean>
  testConnection: (configId: string) => Promise<BYOCTestResult | null>
  testPermissions: (configId: string) => Promise<BYOCTestResult | null>
  testPerformance: (configId: string) => Promise<BYOCTestResult | null>
  testSecurity: (configId: string) => Promise<BYOCTestResult | null>
  runFullTest: (configId: string) => Promise<BYOCTestResult | null>
  exportConfiguration: (configId: string, includeSecrets?: boolean) => string | null
  importConfiguration: (jsonData: string) => Promise<boolean>

  // Utilities
  isActiveConfig: (configId: string) => boolean
  getConfigByProvider: (provider: string) => BYOCConfiguration | null
  getHealthStatus: () => { healthy: number; unhealthy: number; total: number }
  clearError: () => void
}

export function useUniversalBYOC({
  applicationId,
  organizationId,
  userId,
  userRole = 'user',
  autoLoad = true,
  encryptionKey
}: UseBYOCOptions): BYOCHookReturn {
  // State
  const [configurations, setConfigurations] = useState<BYOCConfiguration[]>([])
  const [activeConfig, setActiveConfig] = useState<BYOCConfiguration | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<Record<string, BYOCTestResult>>({})

  // Service instance
  const byocService = createBYOCService(encryptionKey)

  // Load configurations
  const loadConfigurations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const configs = await byocService.getConfigurations(applicationId, organizationId)
      setConfigurations(configs)

      // Find and set active configuration
      const active = configs.find(c => c.metadata.isActive) || null
      setActiveConfig(active)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configurations')
      console.error('Error loading BYOC configurations:', err)
    } finally {
      setLoading(false)
    }
  }, [applicationId, organizationId, byocService])

  // Save configuration
  const saveConfiguration = useCallback(
    async (config: Partial<BYOCConfiguration>): Promise<boolean> => {
      try {
        setLoading(true)
        setError(null)

        const result = await byocService.saveConfiguration(
          applicationId,
          organizationId,
          userId,
          config
        )

        if (result.success) {
          await loadConfigurations() // Reload to get updated list
          return true
        } else {
          setError(result.error || 'Failed to save configuration')
          return false
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save configuration')
        return false
      } finally {
        setLoading(false)
      }
    },
    [applicationId, organizationId, userId, byocService, loadConfigurations]
  )

  // Activate configuration
  const activateConfiguration = useCallback(
    async (configId: string): Promise<boolean> => {
      try {
        setLoading(true)
        setError(null)

        const result = await byocService.activateConfiguration(
          configId,
          applicationId,
          organizationId,
          userId
        )

        if (result.success) {
          await loadConfigurations() // Reload to get updated active status
          return true
        } else {
          setError(result.error || 'Failed to activate configuration')
          return false
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to activate configuration')
        return false
      } finally {
        setLoading(false)
      }
    },
    [applicationId, organizationId, userId, byocService, loadConfigurations]
  )

  // Delete configuration
  const deleteConfiguration = useCallback(
    async (configId: string): Promise<boolean> => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(
          `/api/v1/universal/byoc?applicationId=${applicationId}&organizationId=${organizationId}&configId=${configId}&userId=${userId}`,
          { method: 'DELETE' }
        )

        const result = await response.json()

        if (result.success) {
          await loadConfigurations() // Reload to get updated list
          return true
        } else {
          setError(result.error || 'Failed to delete configuration')
          return false
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete configuration')
        return false
      } finally {
        setLoading(false)
      }
    },
    [applicationId, organizationId, userId, loadConfigurations]
  )

  // Test connection
  const testConnection = useCallback(
    async (configId: string): Promise<BYOCTestResult | null> => {
      try {
        const result = await byocService.testConnection(configId, applicationId, organizationId)
        setTestResults(prev => ({ ...prev, [`${configId}_connection`]: result }))
        return result
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Connection test failed')
        return null
      }
    },
    [applicationId, organizationId, byocService]
  )

  // Test permissions
  const testPermissions = useCallback(
    async (configId: string): Promise<BYOCTestResult | null> => {
      try {
        const result = await byocService.testPermissions(configId, applicationId, organizationId)
        setTestResults(prev => ({ ...prev, [`${configId}_permissions`]: result }))
        return result
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Permissions test failed')
        return null
      }
    },
    [applicationId, organizationId, byocService]
  )

  // Test performance
  const testPerformance = useCallback(
    async (configId: string): Promise<BYOCTestResult | null> => {
      try {
        const response = await fetch('/api/v1/universal/byoc/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicationId,
            organizationId,
            configId,
            testType: 'performance'
          })
        })

        const result = await response.json()

        if (result.success) {
          const testResult: BYOCTestResult = {
            configId,
            testType: 'performance',
            success: result.success,
            results: { performance: result.data },
            timestamp: (result.data.metadata as any)?.timestamp || new Date().toISOString(),
            duration: (result.data.metadata as any)?.duration || 0
          }

          setTestResults(prev => ({ ...prev, [`${configId}_performance`]: testResult }))
          return testResult
        } else {
          setError(result.error || 'Performance test failed')
          return null
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Performance test failed')
        return null
      }
    },
    [applicationId, organizationId]
  )

  // Test security
  const testSecurity = useCallback(
    async (configId: string): Promise<BYOCTestResult | null> => {
      try {
        const response = await fetch('/api/v1/universal/byoc/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicationId,
            organizationId,
            configId,
            testType: 'security'
          })
        })

        const result = await response.json()

        if (result.success) {
          const testResult: BYOCTestResult = {
            configId,
            testType: 'security',
            success: result.success,
            results: { security: result.data },
            timestamp: (result.data.metadata as any)?.timestamp || new Date().toISOString(),
            duration: (result.data.metadata as any)?.duration || 0
          }

          setTestResults(prev => ({ ...prev, [`${configId}_security`]: testResult }))
          return testResult
        } else {
          setError(result.error || 'Security test failed')
          return null
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Security test failed')
        return null
      }
    },
    [applicationId, organizationId]
  )

  // Run full test suite
  const runFullTest = useCallback(
    async (configId: string): Promise<BYOCTestResult | null> => {
      try {
        const response = await fetch('/api/v1/universal/byoc/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            applicationId,
            organizationId,
            configId,
            testType: 'full'
          })
        })

        const result = await response.json()

        if (result.success) {
          const testResult: BYOCTestResult = {
            configId,
            testType: 'full',
            success: result.success,
            results: result.data,
            timestamp: (result.data.metadata as any)?.timestamp || new Date().toISOString(),
            duration: (result.data.metadata as any)?.duration || 0
          }

          setTestResults(prev => ({ ...prev, [`${configId}_full`]: testResult }))
          return testResult
        } else {
          setError(result.error || 'Full test failed')
          return null
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Full test failed')
        return null
      }
    },
    [applicationId, organizationId]
  )

  // Export configuration
  const exportConfiguration = useCallback(
    (configId: string, includeSecrets = false): string | null => {
      const config = configurations.find(c => c.id === configId)
      if (!config) {
        setError('Configuration not found for export')
        return null
      }

      try {
        return byocService.exportConfiguration(config, includeSecrets)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to export configuration')
        return null
      }
    },
    [configurations, byocService]
  )

  // Import configuration
  const importConfiguration = useCallback(
    async (jsonData: string): Promise<boolean> => {
      try {
        setLoading(true)
        setError(null)

        const result = await byocService.importConfiguration(
          jsonData,
          applicationId,
          organizationId,
          userId
        )

        if (result.success) {
          await loadConfigurations() // Reload to get updated list
          return true
        } else {
          setError(result.error || 'Failed to import configuration')
          return false
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to import configuration')
        return false
      } finally {
        setLoading(false)
      }
    },
    [applicationId, organizationId, userId, byocService, loadConfigurations]
  )

  // Utility functions
  const isActiveConfig = useCallback(
    (configId: string): boolean => {
      return activeConfig?.id === configId
    },
    [activeConfig]
  )

  const getConfigByProvider = useCallback(
    (provider: string): BYOCConfiguration | null => {
      return configurations.find(c => c.provider === provider) || null
    },
    [configurations]
  )

  const getHealthStatus = useCallback(() => {
    const total = configurations.length
    const healthy = configurations.filter(c => c.metadata.isHealthy).length
    const unhealthy = total - healthy

    return { healthy, unhealthy, total }
  }, [configurations])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Auto-load configurations on mount
  useEffect(() => {
    if (autoLoad && applicationId && organizationId) {
      loadConfigurations()
    }
  }, [autoLoad, applicationId, organizationId, loadConfigurations])

  return {
    // State
    configurations,
    activeConfig,
    loading,
    error,
    testResults,

    // Actions
    loadConfigurations,
    saveConfiguration,
    activateConfiguration,
    deleteConfiguration,
    testConnection,
    testPermissions,
    testPerformance,
    testSecurity,
    runFullTest,
    exportConfiguration,
    importConfiguration,

    // Utilities
    isActiveConfig,
    getConfigByProvider,
    getHealthStatus,
    clearError
  }
}

export default useUniversalBYOC
