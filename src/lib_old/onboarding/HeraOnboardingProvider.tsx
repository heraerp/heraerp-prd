/**
 * HERA Universal Onboarding - Provider Component
 *
 * Context provider for onboarding tours
 * Manages Joyride state and universal transaction emission
 */

'use client'

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'

import type {
  HeraOnboardingConfig,
  UseOnboardingReturn,
  OnboardingState,
  StartTourOptions,
  SmartCode,
  HeraTour,
  JoyrideCallBackProps
} from './types'

import { getTourByCode, getAllTours } from './stepRegistry'
import { OnboardingEventEmitter } from './events'
import { toJoyrideSteps } from './transformers'
import { defaultMessages } from './i18n'
import { lightTheme, darkTheme, highContrastTheme } from './themes'
import { isStepReady } from './guards'

// Dynamically import Joyride to avoid SSR issues
const Joyride = dynamic(() => import('react-joyride'), { ssr: false })

/**
 * Onboarding context type
 */
interface OnboardingContextValue extends UseOnboardingReturn {
  config: HeraOnboardingConfig
}

/**
 * Create context with undefined default
 */
const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined)

/**
 * Provider props
 */
interface HeraOnboardingProviderProps {
  children: React.ReactNode
  config: HeraOnboardingConfig
}

/**
 * Main provider component
 */
export function HeraOnboardingProvider({ children, config }: HeraOnboardingProviderProps) {
  const router = useRouter()
  const eventEmitterRef = useRef<OnboardingEventEmitter | null>(null)

  // State
  const [state, setState] = useState<OnboardingState>({
    activeTour: null,
    currentStep: 0,
    totalSteps: 0,
    isRunning: false,
    isLoading: false,
    error: null,
    startedAt: null,
    stepDurations: {}
  })

  const [joyrideSteps, setJoyrideSteps] = useState<any[]>([])
  const [runTour, setRunTour] = useState(false)

  // Get theme
  const theme =
    config.theme === 'dark'
      ? darkTheme
      : config.theme === 'highContrast'
        ? highContrastTheme
        : lightTheme

  // Get messages
  const messages = { ...defaultMessages, ...config.messages }

  /**
   * Start a tour
   */
  const startTour = useCallback(
    async (code: SmartCode, options?: StartTourOptions) => {
      if (state.isRunning) {
        console.warn('Tour already running')
        return
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }))

      try {
        // Get tour definition
        const tour = getTourByCode(code)
        if (!tour) {
          throw new Error(`Tour not found: ${code}`)
        }

        // Apply overrides if provided
        const finalTour: HeraTour = options?.overrides ? { ...tour, ...options.overrides } : tour

        // Convert to Joyride format
        const steps = toJoyrideSteps(finalTour.steps, messages, theme)

        // Wait for first step to be ready
        if (steps.length > 0) {
          const firstStep = finalTour.steps[0]
          const ready = await isStepReady(firstStep.selector, {
            route: firstStep.route,
            waitFor: firstStep.waitFor,
            timeoutMs: firstStep.timeoutMs,
            router: config.router || router
          })

          if (!ready) {
            throw new Error('First step not ready')
          }
        }

        // Create event emitter
        eventEmitterRef.current = new OnboardingEventEmitter(
          config.organizationId,
          code,
          config.onEmit
        )

        // Emit tour start
        eventEmitterRef.current.tourStart({
          auto_start: options?.auto || finalTour.autoStart,
          start_at: options?.startAt
        })

        // Update state
        setState({
          activeTour: code,
          currentStep: options?.startAt || 0,
          totalSteps: steps.length,
          isRunning: true,
          isLoading: false,
          error: null,
          startedAt: new Date().toISOString(),
          stepDurations: {}
        })

        setJoyrideSteps(steps)
        setRunTour(true)
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: errorMessage
        }))
        console.error('Failed to start tour:', error)
      }
    },
    [state.isRunning, config, router, messages, theme]
  )

  /**
   * Stop current tour
   */
  const stopTour = useCallback(() => {
    if (!state.isRunning) return

    if (eventEmitterRef.current) {
      eventEmitterRef.current.tourDismissed('dismissed', state.currentStep, state.totalSteps, {
        reason: 'user_stopped'
      })
    }

    setState({
      activeTour: null,
      currentStep: 0,
      totalSteps: 0,
      isRunning: false,
      isLoading: false,
      error: null,
      startedAt: null,
      stepDurations: {}
    })

    setRunTour(false)
    setJoyrideSteps([])
    eventEmitterRef.current = null
  }, [state])

  /**
   * Navigate to next step
   */
  const next = useCallback(() => {
    if (!state.isRunning || state.currentStep >= state.totalSteps - 1) return

    setState(prev => ({
      ...prev,
      currentStep: prev.currentStep + 1
    }))
  }, [state])

  /**
   * Navigate to previous step
   */
  const back = useCallback(() => {
    if (!state.isRunning || state.currentStep <= 0) return

    setState(prev => ({
      ...prev,
      currentStep: prev.currentStep - 1
    }))
  }, [state])

  /**
   * Get current state
   */
  const getState = useCallback(() => state, [state])

  /**
   * Handle Joyride callbacks
   */
  const handleJoyrideCallback = useCallback(
    (data: JoyrideCallBackProps) => {
      const { action, index, status, type } = data

      if (config.debug) {
        console.log('Joyride callback:', { action, index, status, type })
      }

      // Get current tour
      const tour = state.activeTour ? getTourByCode(state.activeTour) : null
      if (!tour) return

      const currentStep = tour.steps[index]

      // Handle different events
      if (type === 'step:after') {
        // Step shown
        if (eventEmitterRef.current && currentStep) {
          eventEmitterRef.current.stepShown(currentStep.smartCode, index, { action, status })
        }
      }

      if (type === 'step:before' && index > 0) {
        // Previous step completed
        const previousStep = tour.steps[index - 1]
        if (eventEmitterRef.current && previousStep) {
          eventEmitterRef.current.stepCompleted(previousStep.smartCode, index - 1, {
            action,
            status
          })
        }
      }

      // Handle tour completion
      if (status === 'finished' || status === 'skipped') {
        if (eventEmitterRef.current) {
          if (status === 'finished') {
            eventEmitterRef.current.tourCompleted(tour.steps.length, index + 1, { action })
          } else {
            eventEmitterRef.current.tourDismissed('skipped', index, tour.steps.length, { action })
          }
        }

        // Clean up
        stopTour()
      }

      // Update current step
      if (type === 'step:after') {
        setState(prev => ({
          ...prev,
          currentStep: index
        }))
      }
    },
    [state, config.debug, stopTour]
  )

  // Context value
  const value: OnboardingContextValue = {
    config,
    startTour,
    stopTour,
    next,
    back,
    getState,
    isActive: state.isRunning,
    currentStep: state.currentStep,
    totalSteps: state.totalSteps
  }

  return (
    <OnboardingContext.Provider value={value}>
      {children}
      {typeof window !== 'undefined' && (
        <Joyride
          steps={joyrideSteps}
          run={runTour}
          continuous
          showProgress
          showSkipButton
          stepIndex={state.currentStep}
          callback={handleJoyrideCallback}
          styles={{
            options: {
              primaryColor: theme.tokens.beaconColor,
              backgroundColor: theme.tokens.bubbleBackground,
              textColor: theme.tokens.bubbleText,
              overlayColor: theme.tokens.overlayColor,
              spotlightShadow: `0 0 15px ${theme.tokens.spotlightBorder}`
            }
          }}
          locale={{
            back: messages['ui.onboard.controls.back'],
            close: messages['ui.onboard.controls.close'],
            last: messages['ui.onboard.controls.last'],
            next: messages['ui.onboard.controls.next'],
            open: messages['ui.onboard.controls.open'],
            skip: messages['ui.onboard.controls.skip']
          }}
          floaterProps={{
            disableAnimation: config.respectReducedMotion
          }}
          disableCloseOnEsc={false}
          disableOverlayClose={false}
          hideCloseButton={false}
        />
      )}
    </OnboardingContext.Provider>
  )
}

/**
 * Hook to use onboarding context
 */
export function useOnboarding(): UseOnboardingReturn {
  const context = useContext(OnboardingContext)

  if (!context) {
    throw new Error('useOnboarding must be used within HeraOnboardingProvider')
  }

  const { config, ...rest } = context
  return rest
}

/**
 * Hook to get onboarding config
 */
export function useOnboardingConfig(): HeraOnboardingConfig {
  const context = useContext(OnboardingContext)

  if (!context) {
    throw new Error('useOnboardingConfig must be used within HeraOnboardingProvider')
  }

  return context.config
}
