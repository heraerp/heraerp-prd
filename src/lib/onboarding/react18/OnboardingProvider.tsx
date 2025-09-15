/**
 * HERA Universal Onboarding - React 18 Compatible Provider
 *
 * Lightweight onboarding implementation without deprecated React methods
 * Uses Floating UI for positioning and native React 18 features
 */

'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { computePosition, flip, shift, offset, arrow, autoUpdate } from '@floating-ui/dom'
import type {
  HeraTour,
  HeraStep,
  OnboardingState,
  StartTourOptions,
  UseOnboardingReturn,
  HeraOnboardingConfig,
  OnboardingStatus
} from '../types'
import { tourRegistry } from '../stepRegistry'
import { useRouter } from 'next/navigation'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface OnboardingContextType extends UseOnboardingReturn {
  config: HeraOnboardingConfig
}

const OnboardingContext = createContext<OnboardingContextType | null>(null)

export function HeraOnboardingProvider({
  children,
  config
}: {
  children: React.ReactNode
  config: HeraOnboardingConfig
}) {
  const router = useRouter()
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

  const [currentTour, setCurrentTour] = useState<HeraTour | null>(null)
  const stepStartTimeRef = useRef<number | null>(null)

  // Start a tour
  const startTour = useCallback(
    async (code: string, options?: StartTourOptions) => {
      const tour = tourRegistry.getTourByCode(code as any)
      if (!tour) {
        console.error(`Tour not found: ${code}`)
        return
      }

      // Check if already completed
      if (!options?.auto && localStorage.getItem(`hera_onboarding_${code}_completed`) === 'true') {
        return
      }

      setCurrentTour(tour)
      setState({
        activeTour: tour.tourSmartCode,
        currentStep: options?.startAt || 0,
        totalSteps: tour.steps.length,
        isRunning: true,
        isLoading: false,
        error: null,
        startedAt: new Date().toISOString(),
        stepDurations: {}
      })

      stepStartTimeRef.current = Date.now()

      // Emit start event
      config.onEmit?.(
        {
          id: crypto.randomUUID(),
          organization_id: config.organizationId,
          smart_code: tour.tourSmartCode,
          occurred_at: new Date().toISOString(),
          ai_confidence: null,
          ai_insights: null,
          metadata: {
            tour_id: tour.tourSmartCode,
            user_id: 'current-user',
            session_id: 'current-session'
          }
        },
        []
      )
    },
    [config]
  )

  // Stop tour
  const stopTour = useCallback(() => {
    if (currentTour) {
      // Mark as completed
      localStorage.setItem(`hera_onboarding_${currentTour.tourSmartCode}_completed`, 'true')

      // Emit completion event
      config.onEmit?.(
        {
          id: crypto.randomUUID(),
          organization_id: config.organizationId,
          smart_code: currentTour.tourSmartCode,
          occurred_at: new Date().toISOString(),
          ai_confidence: null,
          ai_insights: null,
          metadata: {
            tour_id: currentTour.tourSmartCode,
            status: 'completed' as OnboardingStatus
          }
        },
        []
      )
    }

    setCurrentTour(null)
    setState(prev => ({
      ...prev,
      activeTour: null,
      isRunning: false,
      currentStep: 0,
      totalSteps: 0
    }))
  }, [currentTour, config])

  // Navigate to next step
  const next = useCallback(() => {
    if (!currentTour || state.currentStep >= state.totalSteps - 1) {
      stopTour()
      return
    }

    // Record step duration
    if (stepStartTimeRef.current) {
      const duration = Date.now() - stepStartTimeRef.current
      const currentStepCode = currentTour.steps[state.currentStep].smartCode
      setState(prev => ({
        ...prev,
        stepDurations: {
          ...prev.stepDurations,
          [currentStepCode]: duration
        }
      }))
    }

    setState(prev => ({
      ...prev,
      currentStep: prev.currentStep + 1
    }))
    stepStartTimeRef.current = Date.now()
  }, [currentTour, state.currentStep, state.totalSteps, stopTour])

  // Navigate to previous step
  const back = useCallback(() => {
    if (!currentTour || state.currentStep <= 0) return

    setState(prev => ({
      ...prev,
      currentStep: prev.currentStep - 1
    }))
    stepStartTimeRef.current = Date.now()
  }, [currentTour, state.currentStep])

  const contextValue: OnboardingContextType = {
    startTour,
    stopTour,
    next,
    back,
    getState: () => state,
    isActive: state.isRunning,
    currentStep: state.currentStep,
    totalSteps: state.totalSteps,
    config
  }

  return (
    <OnboardingContext.Provider value={contextValue}>
      {children}
      {state.isRunning && currentTour && (
        <OnboardingOverlay
          tour={currentTour}
          currentStep={state.currentStep}
          onNext={next}
          onBack={back}
          onClose={stopTour}
          theme={config.theme || 'dark'}
        />
      )}
    </OnboardingContext.Provider>
  )
}

// Onboarding overlay component
function OnboardingOverlay({
  tour,
  currentStep,
  onNext,
  onBack,
  onClose,
  theme
}: {
  tour: HeraTour
  currentStep: number
  onNext: () => void
  onBack: () => void
  onClose: () => void
  theme: string
}) {
  const [isVisible, setIsVisible] = useState(false)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const tooltipRef = useRef<HTMLDivElement>(null)
  const arrowRef = useRef<HTMLDivElement>(null)
  const cleanupRef = useRef<(() => void) | null>(null)

  const step = tour.steps[currentStep]
  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === tour.steps.length - 1

  useEffect(() => {
    const setupStep = async () => {
      setIsVisible(false)

      // Wait for element
      const waitForElement = async (): Promise<Element | null> => {
        const maxAttempts = 50
        let attempts = 0

        while (attempts < maxAttempts) {
          const element = document.querySelector(step.selector)
          if (element) return element

          await new Promise(resolve => setTimeout(resolve, 100))
          attempts++
        }

        return null
      }

      const targetElement = await waitForElement()
      if (!targetElement || !tooltipRef.current) return

      // Clean up previous positioning
      if (cleanupRef.current) {
        cleanupRef.current()
      }

      // Set up auto-updating position
      const cleanup = autoUpdate(targetElement, tooltipRef.current, async () => {
        const { x, y, placement, middlewareData } = await computePosition(
          targetElement,
          tooltipRef.current!,
          {
            placement: step.placement || 'bottom',
            middleware: [
              offset(10),
              flip(),
              shift({ padding: 10 }),
              arrow({ element: arrowRef.current! })
            ]
          }
        )

        setTooltipPosition({ x, y })

        // Position arrow
        if (arrowRef.current && middlewareData.arrow) {
          const { x: arrowX, y: arrowY } = middlewareData.arrow
          Object.assign(arrowRef.current.style, {
            left: arrowX != null ? `${arrowX}px` : '',
            top: arrowY != null ? `${arrowY}px` : ''
          })
        }
      })

      cleanupRef.current = cleanup
      setIsVisible(true)

      // Add spotlight
      targetElement.classList.add('hera-onboarding-spotlight')
    }

    setupStep()

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
      }
      // Remove spotlight from all elements
      document.querySelectorAll('.hera-onboarding-spotlight').forEach(el => {
        el.classList.remove('hera-onboarding-spotlight')
      })
    }
  }, [step])

  if (!isVisible) return null

  return createPortal(
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-background/50 z-[9998]" onClick={onClose} />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={`fixed z-[9999] max-w-sm ${theme === 'dark' ? 'bg-muted text-foreground' : 'bg-background text-gray-900'} rounded-lg shadow-2xl p-6`}
        style={{
          left: `${tooltipPosition.x}px`,
          top: `${tooltipPosition.y}px`
        }}
      >
        {/* Arrow */}
        <div
          ref={arrowRef}
          className={`absolute w-3 h-3 rotate-45 ${theme === 'dark' ? 'bg-muted' : 'bg-background'}`}
          style={{ bottom: '-6px' }}
        />

        {/* Close button */}
        <button
          onClick={onClose}
          className={`absolute top-2 right-2 p-1 rounded ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-muted'}`}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <h3 className="font-semibold text-lg mb-2">{step.titleKey}</h3>
        <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-muted-foreground'}`}>
          {step.bodyKey}
        </p>

        {/* Progress */}
        <div className="flex items-center justify-between mb-4">
          <div className={`text-xs ${theme === 'dark' ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
            Step {currentStep + 1} of {tour.steps.length}
          </div>
          <div className="flex gap-1">
            {tour.steps.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full ${
                  idx === currentStep
                    ? 'bg-blue-500'
                    : idx < currentStep
                      ? theme === 'dark'
                        ? 'bg-gray-600'
                        : 'bg-gray-400'
                      : theme === 'dark'
                        ? 'bg-muted-foreground/10'
                        : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            disabled={isFirstStep}
            className={`px-3 py-1 text-sm rounded flex items-center gap-1 ${
              isFirstStep
                ? 'opacity-50 cursor-not-allowed'
                : theme === 'dark'
                  ? 'hover:bg-slate-700'
                  : 'hover:bg-muted'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex gap-2">
            {tour.allowSkip && (
              <button
                onClick={onClose}
                className={`px-3 py-1 text-sm rounded ${
                  theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-muted'
                }`}
              >
                Skip Tour
              </button>
            )}

            <button
              onClick={onNext}
              className="px-3 py-1 text-sm bg-blue-500 text-foreground rounded hover:bg-blue-600 flex items-center gap-1"
            >
              {isLastStep ? 'Finish' : 'Next'}
              {!isLastStep && <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}

export function useOnboarding(): UseOnboardingReturn {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within HeraOnboardingProvider')
  }
  return context
}
