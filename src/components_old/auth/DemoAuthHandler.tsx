'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export function DemoAuthHandler({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    // Simplified demo auth handler - just check if it's a demo route
    const isDemoRoute =
      pathname.startsWith('/salon') ||
      pathname.startsWith('/icecream') ||
      pathname.startsWith('/restaurant')

    if (isDemoRoute) {
      console.log('Demo route detected:', pathname)
      // For now, just log - the MultiOrgAuthProvider will handle the actual auth
    }
  }, [pathname])

  // Show loading state during demo auth
  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center bg-muted dark:bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary dark:text-blue-400 mx-auto" />
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">{message || 'Loading demo...'}</p>
        </div>
      </div>
    )
  }

  // Show message briefly
  if (message && !isProcessing) {
    return (
      <>
        <div className="fixed top-4 right-4 z-50 bg-blue-600 text-foreground px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-top-2 duration-300">
          {message}
        </div>
        {children}
      </>
    )
  }

  return <>{children}</>
}
