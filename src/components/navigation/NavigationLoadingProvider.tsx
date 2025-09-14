'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'

interface NavigationLoadingContextType {
  isNavigating: boolean
  setNavigating: (loading: boolean) => void
  navigationTarget: string | null
}

const NavigationLoadingContext = createContext<NavigationLoadingContextType>({
  isNavigating: false,
  setNavigating: () => {},
  navigationTarget: null
})

export function useNavigationLoading() {
  return useContext(NavigationLoadingContext)
}

export function NavigationLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isNavigating, setIsNavigating] = useState(false)
  const [navigationTarget, setNavigationTarget] = useState<string | null>(null)
  const pathname = usePathname()

  const setNavigating = (loading: boolean, target?: string) => {
    setIsNavigating(loading)
    setNavigationTarget(target || null)
  }

  // Reset loading state when pathname changes (navigation complete)
  useEffect(() => {
    if (isNavigating && pathname === navigationTarget) {
      // Navigation is complete, reset immediately for smooth transition
      setIsNavigating(false)
      setNavigationTarget(null)
    }
  }, [pathname, isNavigating, navigationTarget])

  return (
    <NavigationLoadingContext.Provider 
      value={{ 
        isNavigating, 
        setNavigating, 
        navigationTarget 
      }}
    >
      {children}
      
      {/* Subtle loading indicator at top of page */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-pulse" />
      )}
    </NavigationLoadingContext.Provider>
  )
}