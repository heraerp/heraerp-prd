'use client'

// HERA 100% Vibe Coding System - React Provider
// Smart Code: HERA.VIBE.FRONTEND.PROVIDER.REACT.V1
// Purpose: Universal React context provider for vibe coding system

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useSupabaseAuth } from '@/contexts/supabase-auth-context'
import { vibeEngine } from '@/lib/vibe/core-engine'
import { VibeContext, VibeSession, VibeComponent, IntegrationWeave } from '@/lib/vibe/types'

interface VibeContextType {
  // Engine State
  isVibeInitialized: boolean
  isInitializing: boolean
  currentSession: VibeSession | null

  // Context Management
  preserveContext: (context: Partial<VibeContext>) => Promise<string>
  restoreContext: (contextId: string) => Promise<VibeContext>
  searchContexts: (query: string) => Promise<VibeContext[]>

  // Component Management
  registerComponent: (component: VibeComponent) => Promise<void>
  getComponent: (smartCode: string) => Promise<VibeComponent | null>
  searchComponents: (pattern: string) => Promise<VibeComponent[]>

  // Integration Management
  createIntegration: (
    sourceSmartCode: string,
    targetSmartCode: string,
    pattern: string
  ) => Promise<IntegrationWeave>
  validateIntegration: (integrationId: string) => Promise<any>

  // Quality Management
  validateQuality: (componentSmartCode: string) => Promise<any>

  // Session Management
  initializeVibe: () => Promise<void>
  destroyVibe: () => void

  // Error Handling
  lastError: string | null
  clearError: () => void
}

const VibeContext = createContext<VibeContextType | undefined>(undefined)

interface VibeProviderProps {
  children: ReactNode
  autoInitialize?: boolean
}

export function VibeProvider({ children, autoInitialize = true }: VibeProviderProps) {
  const { user, isAuthenticated } = useSupabaseAuth()
  const [isVibeInitialized, setIsVibeInitialized] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [currentSession, setCurrentSession] = useState<VibeSession | null>(null)
  const [lastError, setLastError] = useState<string | null>(null)

  // Initialize vibe engine when user is authenticated
  useEffect(() => {
    if (
      isAuthenticated &&
      user?.user_metadata?.organization_id &&
      autoInitialize &&
      !isVibeInitialized &&
      !isInitializing
    ) {
      initializeVibe()
    }
  }, [
    isAuthenticated,
    user?.user_metadata?.organization_id,
    autoInitialize,
    isVibeInitialized,
    isInitializing
  ])

  const initializeVibe = async (): Promise<void> => {
    if (!user?.user_metadata?.organization_id) {
      setLastError('No organization context available')
      return
    }

    setIsInitializing(true)
    setLastError(null)

    try {
      console.log('🧬 Initializing HERA Vibe Coding System...')

      // Initialize the vibe engine
      await vibeEngine.initialize(user.user_metadata.organization_id)

      // Get current session information
      const session = vibeEngine.getCurrentSession()
      setCurrentSession(session)

      // Preserve initialization context
      await preserveContext({
        smart_code: 'HERA.VIBE.FRONTEND.INIT.SUCCESS.V1',
        user_intent: 'Initialize HERA Vibe Coding System',
        business_context: {
          initialization_method: 'react_provider',
          user_id: user.id,
          user_role: user.user_metadata?.role || 'user',
          organization_name: user.user_metadata?.organization_name || 'Unknown'
        },
        conversation_state: {
          frontend_connected: true,
          auth_status: 'authenticated',
          vibe_version: 'v1'
        }
      })

      setIsVibeInitialized(true)
      console.log('✅ HERA Vibe Coding System initialized successfully')
      console.log('   Session ID:', session.session_id)
      console.log('   Organization:', user.user_metadata.organization_id)
    } catch (error) {
      console.error('❌ Failed to initialize HERA Vibe Coding System:', error)
      setLastError(error instanceof Error ? error.message : 'Initialization failed')
    } finally {
      setIsInitializing(false)
    }
  }

  const preserveContext = async (context: Partial<VibeContext>): Promise<string> => {
    try {
      if (!isVibeInitialized) {
        throw new Error('Vibe system not initialized')
      }

      const contextId = await vibeEngine.preserveContext(context)
      console.log('💾 Context preserved:', contextId)
      return contextId
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Context preservation failed'
      setLastError(errorMessage)
      throw error
    }
  }

  const restoreContext = async (contextId: string): Promise<VibeContext> => {
    try {
      if (!isVibeInitialized) {
        throw new Error('Vibe system not initialized')
      }

      const context = await vibeEngine.restoreContext(contextId)
      console.log('🔄 Context restored:', contextId)
      return context
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Context restoration failed'
      setLastError(errorMessage)
      throw error
    }
  }

  const searchContexts = async (query: string): Promise<VibeContext[]> => {
    try {
      if (!isVibeInitialized) {
        throw new Error('Vibe system not initialized')
      }

      // This would be implemented by the context manager
      // For now, return empty array
      return []
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Context search failed'
      setLastError(errorMessage)
      throw error
    }
  }

  const registerComponent = async (component: VibeComponent): Promise<void> => {
    try {
      if (!isVibeInitialized) {
        throw new Error('Vibe system not initialized')
      }

      await vibeEngine.registerComponent(component)
      console.log('🔗 Component registered:', component.smart_code)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Component registration failed'
      setLastError(errorMessage)
      throw error
    }
  }

  const getComponent = async (smartCode: string): Promise<VibeComponent | null> => {
    try {
      if (!isVibeInitialized) {
        throw new Error('Vibe system not initialized')
      }

      // This would use the smart code registry
      // For now, return null
      return null
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Component retrieval failed'
      setLastError(errorMessage)
      throw error
    }
  }

  const searchComponents = async (pattern: string): Promise<VibeComponent[]> => {
    try {
      if (!isVibeInitialized) {
        throw new Error('Vibe system not initialized')
      }

      // This would use the smart code registry
      // For now, return empty array
      return []
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Component search failed'
      setLastError(errorMessage)
      throw error
    }
  }

  const createIntegration = async (
    sourceSmartCode: string,
    targetSmartCode: string,
    pattern: string
  ): Promise<IntegrationWeave> => {
    try {
      if (!isVibeInitialized) {
        throw new Error('Vibe system not initialized')
      }

      const integration = await vibeEngine.createIntegration(
        sourceSmartCode,
        targetSmartCode,
        pattern
      )
      console.log('🔀 Integration created:', sourceSmartCode, '→', targetSmartCode)
      return integration
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Integration creation failed'
      setLastError(errorMessage)
      throw error
    }
  }

  const validateIntegration = async (integrationId: string): Promise<any> => {
    try {
      if (!isVibeInitialized) {
        throw new Error('Vibe system not initialized')
      }

      // This would use the integration weaver
      // For now, return mock validation
      return {
        integration_id: integrationId,
        health_status: 'healthy',
        performance_score: 95,
        recommendations: []
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Integration validation failed'
      setLastError(errorMessage)
      throw error
    }
  }

  const validateQuality = async (componentSmartCode: string): Promise<any> => {
    try {
      if (!isVibeInitialized) {
        throw new Error('Vibe system not initialized')
      }

      const qualityReport = await vibeEngine.validateQuality(componentSmartCode)
      console.log(
        '📊 Quality validation:',
        componentSmartCode,
        '- Score:',
        qualityReport.quality_score
      )
      return qualityReport
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Quality validation failed'
      setLastError(errorMessage)
      throw error
    }
  }

  const destroyVibe = (): void => {
    try {
      if (isVibeInitialized) {
        // The engine cleanup would happen here
        setIsVibeInitialized(false)
        setCurrentSession(null)
        console.log('🧹 HERA Vibe Coding System destroyed')
      }
    } catch (error) {
      console.error('⚠️ Error during vibe system cleanup:', error)
    }
  }

  const clearError = (): void => {
    setLastError(null)
  }

  const contextValue: VibeContextType = {
    // Engine State
    isVibeInitialized,
    isInitializing,
    currentSession,

    // Context Management
    preserveContext,
    restoreContext,
    searchContexts,

    // Component Management
    registerComponent,
    getComponent,
    searchComponents,

    // Integration Management
    createIntegration,
    validateIntegration,

    // Quality Management
    validateQuality,

    // Session Management
    initializeVibe,
    destroyVibe,

    // Error Handling
    lastError,
    clearError
  }

  return <VibeContext.Provider value={contextValue}>{children}</VibeContext.Provider>
}

export function useVibe(): VibeContextType {
  const context = useContext(VibeContext)
  if (context === undefined) {
    throw new Error('useVibe must be used within a VibeProvider')
  }
  return context
}

// Hook for vibe-aware components
export function useVibeComponent(smartCode: string) {
  const vibe = useVibe()
  const [component, setComponent] = useState<VibeComponent | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (vibe.isVibeInitialized && smartCode) {
      setIsLoading(true)
      vibe
        .getComponent(smartCode)
        .then(setComponent)
        .catch(error => console.warn('Failed to load vibe component:', error))
        .finally(() => setIsLoading(false))
    }
  }, [vibe.isVibeInitialized, smartCode])

  return { component, isLoading }
}

// Hook for automatic context preservation
export function useVibeContext(smartCode: string, userIntent: string) {
  const vibe = useVibe()

  const preserveCurrentContext = async (additionalContext?: object) => {
    if (!vibe.isVibeInitialized) return null

    try {
      return await vibe.preserveContext({
        smart_code: smartCode,
        user_intent: userIntent,
        business_context: additionalContext || {},
        conversation_state: {
          timestamp: new Date().toISOString(),
          component_smart_code: smartCode
        }
      })
    } catch (error) {
      console.warn('Auto context preservation failed:', error)
      return null
    }
  }

  return { preserveCurrentContext }
}
