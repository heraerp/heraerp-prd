'use client'

/**
 * HERA Journey Progress Tracker Component
 * Smart Code: HERA.UI.JOURNEY.PROGRESS.TRACKER.v1
 *
 * Displays user progress through the HERA onboarding journey
 */

import React from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Search, CheckCircle2, Hammer, Rocket, ChevronRight, Check } from 'lucide-react'

interface JourneyStep {
  id: string
  title: string
  subtitle: string
  path: string
  icon: React.ElementType
  status: 'pending' | 'current' | 'completed'
}

interface JourneyProgressTrackerProps {
  currentStep?: string
  completedSteps?: string[]
  onStepClick?: (step: string) => void
}

export function JourneyProgressTracker({
  currentStep,
  completedSteps = [],
  onStepClick
}: JourneyProgressTrackerProps) {
  const pathname = usePathname()
  const router = useRouter()

  const journeySteps: JourneyStep[] = [
    {
      id: 'discover',
      title: 'Discover',
      subtitle: 'Explore live demos',
      path: '/discover',
      icon: Search,
      status: 'pending'
    },
    {
      id: 'validate',
      title: 'Validate',
      subtitle: 'Test features',
      path: '/validate',
      icon: CheckCircle2,
      status: 'pending'
    },
    {
      id: 'build',
      title: 'Build',
      subtitle: 'Configure your app',
      path: '/build',
      icon: Hammer,
      status: 'pending'
    },
    {
      id: 'deploy',
      title: 'Deploy',
      subtitle: 'Launch your business',
      path: '/deploy',
      icon: Rocket,
      status: 'pending'
    }
  ]

  // Determine current step based on pathname or prop
  const getCurrentStep = () => {
    if (currentStep) return currentStep
    const path = pathname.toLowerCase()
    if (path.includes('discover')) return 'discover'
    if (path.includes('validate')) return 'validate'
    if (path.includes('build')) return 'build'
    if (path.includes('deploy')) return 'deploy'
    return 'discover'
  }

  const current = getCurrentStep()

  // Update step statuses
  const steps = journeySteps.map((step, index) => {
    const currentIndex = journeySteps.findIndex(s => s.id === current)
    const stepIndex = journeySteps.findIndex(s => s.id === step.id)

    let status: 'pending' | 'current' | 'completed' = 'pending'

    if (completedSteps.includes(step.id) || stepIndex < currentIndex) {
      status = 'completed'
    } else if (step.id === current) {
      status = 'current'
    }

    return { ...step, status }
  })

  const handleStepClick = (step: JourneyStep) => {
    if (onStepClick) {
      onStepClick(step.id)
    } else {
      router.push(step.path)
    }
  }

  return (
    <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
      <nav aria-label="Progress">
        <ol className="flex items-center justify-between max-w-7xl mx-auto">
          {steps.map((step, stepIdx) => (
            <li
              key={step.id}
              className={cn('relative flex-1', stepIdx !== steps.length - 1 && 'pr-8 sm:pr-20')}
            >
              {/* Connector Line */}
              {stepIdx !== steps.length - 1 && (
                <div className="absolute top-4 left-8 -right-4 sm:-right-12">
                  <div
                    className={cn(
                      'h-0.5 w-full transition-all duration-500',
                      step.status === 'completed' ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-700'
                    )}
                  />
                </div>
              )}

              {/* Step */}
              <button
                onClick={() => handleStepClick(step)}
                className={cn(
                  'group relative flex flex-col items-start sm:items-center text-left sm:text-center',
                  'transition-all duration-300 hover:scale-105',
                  step.status === 'current' && 'cursor-default'
                )}
                disabled={step.status === 'pending' && stepIdx > 0}
              >
                {/* Icon Container with WSAG Glassmorphism */}
                <div
                  className={cn(
                    'relative flex h-8 w-8 items-center justify-center rounded-full',
                    'transition-all duration-500 group-hover:scale-110',
                    step.status === 'completed' && 'bg-purple-600 shadow-lg shadow-purple-600/30',
                    step.status === 'current' && 'shadow-lg',
                    step.status === 'pending' && 'bg-gray-300 dark:bg-gray-700'
                  )}
                  style={
                    step.status === 'current'
                      ? {
                          background: `
                      linear-gradient(135deg, 
                        rgba(147, 51, 234, 0.3) 0%, 
                        rgba(236, 72, 153, 0.2) 100%
                      )
                    `,
                          backdropFilter: 'blur(20px) saturate(180%)',
                          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                          border: '2px solid rgba(147, 51, 234, 0.5)',
                          boxShadow: `
                      0 8px 32px rgba(147, 51, 234, 0.3),
                      0 4px 16px rgba(0, 0, 0, 0.1),
                      inset 0 1px 0 rgba(255, 255, 255, 0.4)
                    `
                        }
                      : {}
                  }
                >
                  {step.status === 'completed' ? (
                    <Check className="h-5 w-5 text-white" />
                  ) : (
                    <step.icon
                      className={cn(
                        'h-4 w-4',
                        step.status === 'current' ? 'text-purple-600' : 'text-gray-500'
                      )}
                    />
                  )}
                </div>

                {/* Text */}
                <div className="mt-2">
                  <p
                    className={cn(
                      'text-xs sm:text-sm font-semibold transition-colors duration-300',
                      step.status === 'completed' && 'text-purple-600 dark:text-purple-400',
                      step.status === 'current' && 'text-gray-900 dark:text-white',
                      step.status === 'pending' && 'text-gray-500 dark:text-gray-400'
                    )}
                  >
                    {step.title}
                  </p>
                  <p
                    className={cn(
                      'hidden sm:block text-xs mt-0.5',
                      step.status === 'current'
                        ? 'text-gray-600 dark:text-gray-300'
                        : 'text-gray-500 dark:text-gray-400'
                    )}
                  >
                    {step.subtitle}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ol>
      </nav>

      {/* Current Step Indicator (Mobile) */}
      <div className="mt-6 sm:hidden">
        <div className="flex items-center justify-center gap-2 text-sm">
          <span className="text-gray-500">
            Step {steps.findIndex(s => s.status === 'current') + 1} of {steps.length}:
          </span>
          <span className="font-semibold text-gray-900 dark:text-white">
            {steps.find(s => s.status === 'current')?.title}
          </span>
        </div>
      </div>
    </div>
  )
}
