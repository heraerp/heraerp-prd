'use client'

import React, { createContext, useContext, ReactNode } from 'react'

interface SimpleTourContextType {
  startTour: (industryKey: string) => Promise<void>
  isAvailable: boolean
  currentIndustry: string | null
}

const SimpleTourContext = createContext<SimpleTourContextType | null>(null)

interface SimpleTourProviderProps {
  children: ReactNode
  industryKey: string
  autoStart?: boolean
}

export function SimpleTourProvider({
  children,
  industryKey,
  autoStart = false
}: SimpleTourProviderProps) {
  const handleStartTour = async (industry: string) => {
    console.log(`🎪 Tour would start for: ${industry}`)
    // Placeholder for tour functionality
    alert(
      `Welcome to HERA ${industry} Tour! 🚀\n\nFull guided tours will be available soon.\nFor now, explore the interface to discover all features.`
    )
  }

  const contextValue: SimpleTourContextType = {
    startTour: handleStartTour,
    isAvailable: true,
    currentIndustry: industryKey
  }

  return <SimpleTourContext.Provider value={contextValue}>{children}</SimpleTourContext.Provider>
}

export function useSimpleTour() {
  const context = useContext(SimpleTourContext)
  if (!context) {
    throw new Error('useSimpleTour must be used within a SimpleTourProvider')
  }
  return context
}

// Simple tour element wrapper
export function SimpleTourElement({ children, tourId }: { children: ReactNode; tourId: string }) {
  return <div data-tour={tourId}>{children}</div>
}

// Export compatible names for existing code
export { SimpleTourProvider as UniversalTourProvider }
export { SimpleTourElement as TourElement }
export { useSimpleTour as useTour }
