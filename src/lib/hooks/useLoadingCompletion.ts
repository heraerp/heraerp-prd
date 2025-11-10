/**
 * HERA Enterprise Loading Completion Hook v1.0
 *
 * 🎯 PURPOSE:
 * Automatically completes the global loading overlay animation when users
 * land on a page after authentication. Handles the 70% → 100% progress completion
 * that starts from the login page.
 *
 * 🏗️ ARCHITECTURE:
 * - Uses direct DOM access (window.location.search) for reliability
 * - No Next.js Suspense boundary required
 * - Automatic cleanup of URL parameters
 * - Performance monitoring built-in
 * - Comprehensive error handling
 *
 * 📊 MONITORING:
 * - Tracks loading completion time
 * - Logs performance metrics
 * - Alerts on failures
 * - Provides observability for production debugging
 *
 * 🔒 PRODUCTION-READY:
 * - TypeScript strict mode
 * - Fail-safe error handling
 * - Memory leak prevention
 * - Race condition protection
 * - SSR/CSR compatible
 *
 * @example
 * ```tsx
 * export default function DashboardPage() {
 *   useLoadingCompletion() // That's it!
 *   return <div>Dashboard Content</div>
 * }
 * ```
 *
 * @author HERA Engineering Team
 * @version 1.0.0
 * @since 2025-01-05
 */

import { useEffect, useRef } from 'react'
import { useLoadingStore } from '@/lib/stores/loading-store'

/**
 * Configuration options for loading completion behavior
 */
export interface LoadingCompletionOptions {
  /**
   * Starting progress percentage (default: 70)
   * Should match where login page leaves off
   */
  startProgress?: number

  /**
   * Progress increment per interval (default: 5)
   * Smaller = smoother animation, larger = faster completion
   */
  progressIncrement?: number

  /**
   * Interval between progress updates in ms (default: 50)
   * Smaller = smoother but more CPU, larger = choppier but efficient
   */
  intervalMs?: number

  /**
   * Delay before hiding overlay at 100% in ms (default: 500)
   * Gives user time to perceive completion
   */
  completionDelayMs?: number

  /**
   * Whether to clean up URL parameter after completion (default: true)
   */
  cleanupUrl?: boolean

  /**
   * Custom message to show while loading (default: 'Loading your workspace...')
   */
  loadingMessage?: string

  /**
   * Custom message to show at 100% (default: 'Ready!')
   */
  completionMessage?: string

  /**
   * Enable performance monitoring (default: true in production)
   */
  enableMonitoring?: boolean

  /**
   * Enable debug logging (default: false)
   */
  debug?: boolean
}

/**
 * Performance metrics for monitoring
 */
interface LoadingMetrics {
  startTime: number
  endTime: number
  duration: number
  wasInitializing: boolean
  progressSteps: number
  pagePath: string
}

/**
 * Default configuration values
 */
const DEFAULT_OPTIONS: Required<LoadingCompletionOptions> = {
  startProgress: 70,
  progressIncrement: 5,
  intervalMs: 50,
  completionDelayMs: 500,
  cleanupUrl: true,
  loadingMessage: 'Loading your workspace...',
  completionMessage: 'Ready!',
  enableMonitoring: process.env.NODE_ENV === 'production',
  debug: false,
}

/**
 * Safely log performance metrics
 */
function logMetrics(metrics: LoadingMetrics, options: Required<LoadingCompletionOptions>): void {
  if (!options.enableMonitoring) return

  try {
    const metricsData = {
      ...metrics,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
    }

    // Log to console in development
    if (options.debug) {
      console.log('📊 Loading Completion Metrics:', metricsData)
    }

    // In production, send to analytics service
    if (options.enableMonitoring && typeof window !== 'undefined') {
      // Store metrics for potential analytics integration
      const metricsKey = 'hera_loading_metrics'
      const existingMetrics = JSON.parse(localStorage.getItem(metricsKey) || '[]')
      existingMetrics.push(metricsData)

      // Keep only last 50 metrics
      if (existingMetrics.length > 50) {
        existingMetrics.shift()
      }

      localStorage.setItem(metricsKey, JSON.stringify(existingMetrics))
    }

    // Alert on slow loading (> 2 seconds)
    if (metrics.duration > 2000) {
      console.warn('⚠️ Slow loading completion detected:', {
        duration: metrics.duration,
        page: metrics.pagePath,
      })
    }
  } catch (error) {
    // Fail silently - don't break app for metrics
    if (options.debug) {
      console.error('Failed to log metrics:', error)
    }
  }
}

/**
 * HERA Enterprise Loading Completion Hook
 *
 * Automatically handles the loading overlay completion animation when
 * landing on a page after authentication. Safe to use on any page.
 *
 * @param options - Optional configuration
 *
 * @example
 * ```tsx
 * // Basic usage (recommended)
 * export default function DashboardPage() {
 *   useLoadingCompletion()
 *   return <div>Content</div>
 * }
 *
 * // Custom configuration
 * export default function DashboardPage() {
 *   useLoadingCompletion({
 *     startProgress: 80,
 *     progressIncrement: 10,
 *     loadingMessage: 'Preparing your dashboard...',
 *     debug: true
 *   })
 *   return <div>Content</div>
 * }
 * ```
 */
export function useLoadingCompletion(options: LoadingCompletionOptions = {}): void {
  // Merge with defaults
  const config: Required<LoadingCompletionOptions> = {
    ...DEFAULT_OPTIONS,
    ...options,
  }

  const { updateProgress, completeLoading } = useLoadingStore()

  // Use ref to prevent re-running effect on config changes
  const hasRunRef = useRef(false)
  const metricsRef = useRef<Partial<LoadingMetrics>>({})

  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (hasRunRef.current) return
    hasRunRef.current = true

    // SSR safety check
    if (typeof window === 'undefined') {
      if (config.debug) {
        console.log('🔍 Loading completion skipped: SSR environment')
      }
      return
    }

    try {
      // Check if we're coming from login (initializing=true parameter)
      const urlParams = new URLSearchParams(window.location.search)
      const isInitializing = urlParams.get('initializing') === 'true'

      // Initialize metrics
      metricsRef.current = {
        startTime: Date.now(),
        wasInitializing: isInitializing,
        progressSteps: 0,
        pagePath: window.location.pathname,
      }

      if (!isInitializing) {
        if (config.debug) {
          console.log('🔍 Loading completion skipped: Not initializing')
        }
        return
      }

      if (config.debug) {
        console.log('🎯 Starting loading completion animation', {
          startProgress: config.startProgress,
          increment: config.progressIncrement,
          interval: config.intervalMs,
        })
      }

      // Animate from startProgress to 100% smoothly
      let progress = config.startProgress
      const progressInterval = setInterval(() => {
        progress += config.progressIncrement
        metricsRef.current.progressSteps = (metricsRef.current.progressSteps || 0) + 1

        if (progress <= 100) {
          const message = progress === 100 ? config.completionMessage : config.loadingMessage
          updateProgress(progress, undefined, message)

          if (config.debug) {
            console.log(`📊 Progress: ${progress}% - ${message}`)
          }
        }

        if (progress >= 100) {
          clearInterval(progressInterval)

          if (config.debug) {
            console.log('✅ Progress complete, hiding overlay in', config.completionDelayMs, 'ms')
          }

          // Complete and hide overlay after brief delay
          setTimeout(() => {
            completeLoading()

            // Clean up URL parameter
            if (config.cleanupUrl) {
              try {
                window.history.replaceState({}, '', window.location.pathname)
                if (config.debug) {
                  console.log('🧹 URL parameter cleaned up')
                }
              } catch (error) {
                // Fail silently - don't break app for URL cleanup
                if (config.debug) {
                  console.error('Failed to clean up URL:', error)
                }
              }
            }

            // Record completion metrics
            metricsRef.current.endTime = Date.now()
            metricsRef.current.duration = metricsRef.current.endTime! - metricsRef.current.startTime!

            logMetrics(metricsRef.current as LoadingMetrics, config)

            if (config.debug) {
              console.log('✅ Loading completion finished', {
                duration: metricsRef.current.duration,
                steps: metricsRef.current.progressSteps,
              })
            }
          }, config.completionDelayMs)
        }
      }, config.intervalMs)

      // Cleanup function
      return () => {
        clearInterval(progressInterval)
        if (config.debug) {
          console.log('🧹 Loading completion cleanup')
        }
      }
    } catch (error) {
      // Fail-safe error handling - don't break the page
      console.error('❌ Loading completion error:', error)

      // Attempt to complete loading anyway to prevent stuck overlay
      try {
        completeLoading()
      } catch (fallbackError) {
        console.error('❌ Failed to complete loading in error handler:', fallbackError)
      }
    }
  }, [updateProgress, completeLoading, config.debug]) // Note: config is NOT in deps to prevent re-runs

  // No return value needed - hook handles everything internally
}

/**
 * Export default options for consistency
 */
export const LOADING_COMPLETION_DEFAULTS = DEFAULT_OPTIONS

/**
 * Utility function to get loading metrics from localStorage
 * Useful for debugging production issues
 */
export function getLoadingMetrics(): LoadingMetrics[] {
  if (typeof window === 'undefined') return []

  try {
    const metricsKey = 'hera_loading_metrics'
    const metrics = localStorage.getItem(metricsKey)
    return metrics ? JSON.parse(metrics) : []
  } catch (error) {
    console.error('Failed to get loading metrics:', error)
    return []
  }
}

/**
 * Utility function to clear loading metrics
 */
export function clearLoadingMetrics(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem('hera_loading_metrics')
  } catch (error) {
    console.error('Failed to clear loading metrics:', error)
  }
}
