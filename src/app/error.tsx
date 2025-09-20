'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function Error({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to console (hook for APM integration later)
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Something went wrong!</CardTitle>
            <CardDescription>
              An error occurred while processing your request. This has been logged for
              investigation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {process.env.NODE_ENV === 'development' && (
              <div className="bg-gray-100 p-4 rounded-md">
                <h4 className="font-medium text-sm text-gray-700 mb-2">Error Details:</h4>
                <pre className="text-xs text-gray-600 overflow-auto">{error.message}</pre>
                {error.digest && (
                  <p className="text-xs text-gray-500 mt-2">Digest: {error.digest}</p>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={reset}>Try again</Button>
              <Button variant="outline" onClick={() => (window.location.href = '/')}>
                Go home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
