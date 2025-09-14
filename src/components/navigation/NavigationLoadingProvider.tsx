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
    if (isNavigating) {
      const timer = setTimeout(() => {
        setIsNavigating(false)
        setNavigationTarget(null)
      }, 100) // Small delay to prevent flash

      return () => clearTimeout(timer)
    }
  }, [pathname, isNavigating])

  return (
    <NavigationLoadingContext.Provider 
      value={{ 
        isNavigating, 
        setNavigating, 
        navigationTarget 
      }}
    >
      {children}
      
      {/* Global Loading Overlay */}
      {isNavigating && (
        <div className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl p-6 shadow-2xl border border-white/20">
            <div className="flex items-center gap-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Loading page...</p>
                {navigationTarget && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Navigating to {navigationTarget}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </NavigationLoadingContext.Provider>
  )
}