/**
 * Universal Page Not Found Component
 * Smart Code: HERA.UNIVERSAL.COMPONENT.PAGE_NOT_FOUND.v1
 * 
 * Generic 404 page component for HERA dynamic routing
 */

'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Home, ArrowLeft, Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface PageNotFoundProps {
  requestedPath?: string
  suggestedPaths?: string[]
  moduleContext?: string
  industryContext?: string
}

export function PageNotFound({ 
  requestedPath, 
  suggestedPaths = [], 
  moduleContext,
  industryContext 
}: PageNotFoundProps) {
  const router = useRouter()

  const handleGoBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  const handleGoHome = () => {
    router.push('/')
  }

  const handleSearch = () => {
    // Could integrate with HERA search in the future
    router.push('/apps')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Page Not Found
          </CardTitle>
          <CardDescription className="text-lg">
            The page you're looking for doesn't exist or has been moved.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Request Details */}
          {requestedPath && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">Requested URL:</h3>
              <code className="text-sm bg-white px-2 py-1 rounded border">
                {requestedPath}
              </code>
            </div>
          )}

          {/* Context Information */}
          {(moduleContext || industryContext) && (
            <div className="flex gap-2 justify-center">
              {industryContext && (
                <Badge variant="outline" className="text-sm">
                  Industry: {industryContext}
                </Badge>
              )}
              {moduleContext && (
                <Badge variant="outline" className="text-sm">
                  Module: {moduleContext}
                </Badge>
              )}
            </div>
          )}

          {/* Suggested Paths */}
          {suggestedPaths.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">
                You might be looking for:
              </h3>
              <div className="space-y-2">
                {suggestedPaths.map((path, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => router.push(path)}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    {path}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={handleGoBack}
              variant="outline" 
              className="flex-1"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            <Button 
              onClick={handleSearch}
              variant="outline" 
              className="flex-1"
            >
              <Search className="w-4 h-4 mr-2" />
              Browse Apps
            </Button>
            <Button 
              onClick={handleGoHome}
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-2" />
              Home
            </Button>
          </div>

          {/* HERA Information */}
          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-600">
              HERA Universal Platform • Dynamic Routing System
            </p>
            <p className="text-xs text-gray-500 mt-1">
              If you believe this is an error, please check the URL or contact support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PageNotFound