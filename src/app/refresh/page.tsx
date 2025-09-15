'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RefreshCw, CheckCircle } from 'lucide-react'

export default function RefreshPage() {
  useEffect(() => {
    // Clear all caches and reload
    const clearAndReload = async () => {
      try {
        // Clear local storage
        localStorage.clear()

        // Clear session storage
        sessionStorage.clear()

        // Force reload after 2 seconds
        setTimeout(() => {
          window.location.href = '/icecream'
        }, 2000)
      } catch (error) {
        console.error('Error clearing cache:', error)
      }
    }

    clearAndReload()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-purple-900">
      <Card className="max-w-md w-full mx-4">
        <CardHeader>
          <CardTitle className="text-center flex items-center justify-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin" />
            Refreshing HERA...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span>Clearing browser cache...</span>
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span>Loading latest version...</span>
            </div>
            <p className="text-sm text-muted-foreground text-center mt-4">
              You will be redirected to the latest version in a moment...
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
