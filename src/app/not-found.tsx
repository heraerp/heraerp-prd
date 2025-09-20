'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function NotFound() {
  return (
    <div className="container mx-auto py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Page Not Found</CardTitle>
            <CardDescription>
              The page you're looking for doesn't exist or has been moved.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-6xl font-bold text-gray-300 mb-4">404</div>
              <p className="text-gray-600 mb-6">We couldn't find what you were looking for.</p>
              <div className="flex gap-2 justify-center">
                <Button asChild>
                  <Link href="/">Go home</Link>
                </Button>
                <Button variant="outline" onClick={() => window.history.back()}>
                  Go back
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
