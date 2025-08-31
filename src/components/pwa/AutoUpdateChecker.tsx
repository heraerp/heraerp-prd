'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { APP_VERSION } from '@/lib/constants/version'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { RefreshCw, AlertCircle } from 'lucide-react'

export function AutoUpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [isChecking, setIsChecking] = useState(false)
  const currentVersion = APP_VERSION.build
  const checkingRef = useRef(false)

  const checkForUpdates = useCallback(async () => {
    // Use ref to prevent multiple simultaneous checks
    if (checkingRef.current) return
    
    checkingRef.current = true
    setIsChecking(true)
    
    try {
      // Add timestamp to prevent caching
      const response = await fetch(`/api/version?t=${Date.now()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.version !== currentVersion) {
          console.log(`Update available: ${currentVersion} -> ${data.version}`)
          setUpdateAvailable(true)
          // Don't send skip waiting here - only when user clicks update
        }
      }
    } catch (error) {
      console.error('Version check failed:', error)
    } finally {
      setIsChecking(false)
      checkingRef.current = false
    }
  }, [currentVersion])

  const handleUpdate = useCallback(async () => {
    try {
      // Send skip waiting message to service worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SKIP_WAITING' })
      }

      // Wait a moment for service worker to update
      await new Promise(resolve => setTimeout(resolve, 100))

      // Clear all caches
      if ('caches' in window) {
        const names = await caches.keys()
        await Promise.all(names.map(name => caches.delete(name)))
      }

      // Force reload with cache bypass
      window.location.reload()
    } catch (error) {
      console.error('Update failed:', error)
      // Fallback: just reload
      window.location.reload()
    }
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    let mounted = true

    const setupUpdateChecker = async () => {
      if (!mounted) return
      
      // Initial check
      await checkForUpdates()

      // Check every 5 minutes (300000ms) instead of 30 seconds
      interval = setInterval(() => {
        if (mounted && !checkingRef.current) {
          checkForUpdates()
        }
      }, 300000)

      // Listen for service worker updates
      if ('serviceWorker' in navigator) {
        const handleMessage = (event: MessageEvent) => {
          if (event.data && event.data.type === 'SW_UPDATE_AVAILABLE' && mounted) {
            setUpdateAvailable(true)
          }
        }
        
        navigator.serviceWorker.addEventListener('message', handleMessage)

        // Check for waiting service worker
        try {
          const registration = await navigator.serviceWorker.ready
          if (registration.waiting && mounted) {
            setUpdateAvailable(true)
          }

          const handleUpdateFound = () => {
            const newWorker = registration.installing
            if (newWorker) {
              const handleStateChange = () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller && mounted) {
                  setUpdateAvailable(true)
                }
              }
              newWorker.addEventListener('statechange', handleStateChange)
            }
          }
          
          registration.addEventListener('updatefound', handleUpdateFound)
        } catch (error) {
          console.error('Service worker registration error:', error)
        }
      }
    }

    // Listen for visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden && mounted && !checkingRef.current) {
        checkForUpdates()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    setupUpdateChecker()

    return () => {
      mounted = false
      if (interval) {
        clearInterval(interval)
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, []) // Empty dependency array - setup only once

  if (!updateAvailable) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      <Alert className="border-blue-500 bg-blue-50 dark:bg-blue-950">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertTitle className="text-blue-900 dark:text-blue-100">
          Update Available
        </AlertTitle>
        <AlertDescription className="text-blue-800 dark:text-blue-200">
          A new version of HERA is available. Update now to get the latest features and improvements.
        </AlertDescription>
        <div className="mt-3 flex gap-2">
          <Button
            onClick={handleUpdate}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Update Now
          </Button>
          <Button
            onClick={() => setUpdateAvailable(false)}
            size="sm"
            variant="outline"
          >
            Later
          </Button>
        </div>
      </Alert>
    </div>
  )
}