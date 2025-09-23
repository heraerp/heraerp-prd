'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import NProgress from 'nprogress'
import 'nprogress/nprogress.css'
import '@/app/isp/isp-progress.css'

// Configure NProgress
if (typeof window !== 'undefined') {
  NProgress.configure({ 
    showSpinner: false,
    trickleSpeed: 200,
    minimum: 0.3
  })
}

interface NavigationLoadingContextType {
  isLoading: boolean
  setIsLoading: (loading: boolean) => void
}

const NavigationLoadingContext = createContext<NavigationLoadingContextType>({
  isLoading: false,
  setIsLoading: () => {}
})

export function useNavigationLoading() {
  return useContext(NavigationLoadingContext)
}

export function OptimizedNavigationLoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false)
  const pathname = usePathname()

  // Handle route changes
  useEffect(() => {
    const handleStart = () => {
      setIsLoading(true)
      NProgress.start()
    }

    const handleComplete = () => {
      setIsLoading(false)
      NProgress.done()
    }

    // Complete loading when pathname changes
    handleComplete()

    return () => {
      handleComplete()
    }
  }, [pathname])

  return (
    <NavigationLoadingContext.Provider value={{ isLoading, setIsLoading }}>
      {children}
      {isLoading && (
        <div className="fixed inset-0 z-50 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0099CC] via-[#E91E63] to-[#FFD700] animate-pulse" />
        </div>
      )}
    </NavigationLoadingContext.Provider>
  )
}