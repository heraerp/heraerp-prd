'use client'

import React, { useEffect, useState, createContext, useContext, ReactNode } from 'react'
import {
  UniversalTourManager,
  useUniversalTour,
  checkAutoStartTour,
  markTourCompleted
} from '@/lib/guided-tours/universal-tour'
import { Button } from '@/components/ui/button'
import { HelpCircle, X, Play } from 'lucide-react'

interface TourContextType {
  startTour: (industryKey: string) => Promise<void>
  isAvailable: boolean
  currentIndustry: string | null
}

const TourContext = createContext<TourContextType | null>(null)

interface UniversalTourProviderProps {
  children: ReactNode
  industryKey: string
  autoStart?: boolean
}

export function UniversalTourProvider({
  children,
  industryKey,
  autoStart = false
}: UniversalTourProviderProps) {
  const [isClient, setIsClient] = useState(false)
  const [shouldShowAutoStart, setShouldShowAutoStart] = useState(false)
  const { startTour } = useUniversalTour(industryKey)

  useEffect(() => {
    setIsClient(true)

    if (autoStart) {
      const shouldStart = checkAutoStartTour(industryKey)
      if (shouldStart) {
        setShouldShowAutoStart(true)
      }
    }
  }, [industryKey, autoStart])

  const handleStartTour = async (industry: string) => {
    await startTour(industry)
    setShouldShowAutoStart(false)
    markTourCompleted(industry)
  }

  const contextValue: TourContextType = {
    startTour: handleStartTour,
    isAvailable: isClient,
    currentIndustry: industryKey
  }

  return (
    <TourContext.Provider value={contextValue}>
      {children}

      {/* Auto-start Tour Modal */}
      {shouldShowAutoStart && isClient && (
        <AutoStartTourModal
          industryKey={industryKey}
          onStart={() => handleStartTour(industryKey)}
          onSkip={() => {
            setShouldShowAutoStart(false)
            markTourCompleted(industryKey)
          }}
        />
      )}

      {/* Floating Tour Button */}
      {isClient && !shouldShowAutoStart && (
        <FloatingTourButton onClick={() => handleStartTour(industryKey)} />
      )}
    </TourContext.Provider>
  )
}

interface AutoStartTourModalProps {
  industryKey: string
  onStart: () => Promise<void>
  onSkip: () => void
}

function AutoStartTourModal({ industryKey, onStart, onSkip }: AutoStartTourModalProps) {
  const industryNames = {
    restaurant: 'Restaurant Management',
    healthcare: 'Healthcare Practice',
    'enterprise-retail': 'Enterprise Retail',
    manufacturing: 'Manufacturing ERP',
    'real-estate': 'Real Estate Management'
  }

  const industryName =
    industryNames[industryKey as keyof typeof industryNames] || 'Business Management'

  return (
    <div className="fixed inset-0 bg-background/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-background rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-foreground">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-background/20 rounded-full flex items-center justify-center">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Welcome to HERA!</h2>
              <p className="text-foreground/90 text-sm">Ready for a quick tour?</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Discover Your {industryName} System
          </h3>

          <p className="text-muted-foreground mb-4">
            Take a 2-minute guided tour to learn the key features and get started quickly. You'll
            discover how to navigate, use modules, and maximize your productivity.
          </p>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🎯</div>
              <div>
                <div className="font-medium text-gray-900 text-sm">What you'll learn:</div>
                <ul className="text-sm text-muted-foreground mt-1 space-y-1">
                  <li>• Navigate your command center</li>
                  <li>• Understand live metrics</li>
                  <li>• Access key modules</li>
                  <li>• Use quick actions</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={onStart}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-foreground hover:shadow-lg transition-all duration-300"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Tour (2 min)
            </Button>
            <Button onClick={onSkip} variant="outline" className="px-4">
              Skip
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface FloatingTourButtonProps {
  onClick: () => void
}

function FloatingTourButton({ onClick }: FloatingTourButtonProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Show button after a delay to avoid overwhelming new users
    const timer = setTimeout(() => setIsVisible(true), 3000)
    return () => clearTimeout(timer)
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <Button
        onClick={onClick}
        className="bg-gradient-to-r from-blue-500 to-purple-600 text-foreground hover:shadow-xl transition-all duration-300 rounded-full w-14 h-14 shadow-lg hover:-translate-y-1"
        title="Start Guided Tour"
      >
        <HelpCircle className="w-6 h-6" />
      </Button>
    </div>
  )
}

// Hook to access tour context
export function useTourContext(): TourContextType {
  const context = useContext(TourContext)
  if (!context) {
    throw new Error('useTourContext must be used within a UniversalTourProvider')
  }
  return context
}

// Tour Trigger Button Component
interface TourTriggerProps {
  industryKey?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

export function TourTrigger({
  industryKey,
  variant = 'outline',
  size = 'sm',
  className = ''
}: TourTriggerProps) {
  const tourContext = useTourContext()
  const industry = industryKey || tourContext.currentIndustry

  if (!tourContext.isAvailable || !industry) return null

  return (
    <Button
      onClick={() => tourContext.startTour(industry)}
      variant={variant}
      size={size}
      className={`${className}`}
      title="Start Guided Tour"
    >
      <HelpCircle className="w-4 h-4 mr-2" />
      Help Tour
    </Button>
  )
}

// Tour Data Attributes Helper Component
interface TourElementProps {
  tourId: string
  moduleId?: string
  children: ReactNode
  className?: string
}

export function TourElement({ tourId, moduleId, children, className = '' }: TourElementProps) {
  return (
    <div data-tour={tourId} data-module={moduleId} className={className}>
      {children}
    </div>
  )
}
