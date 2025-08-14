'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function OrdersDashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
          Orders Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Take orders fast, deliver on time, get paid quickly
        </p>
        
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Orders Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Your orders dashboard page is ready to be customized.</p>
            <Button className="mt-4 bg-orange-500 hover:bg-orange-600">
              Get Started
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}