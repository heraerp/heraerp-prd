'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function RestaurantReservationsReportsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
          Restaurant-reservations Reports
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your restaurant-reservations better, make more money
        </p>
        
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Restaurant-reservations Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Your restaurant-reservations reports page is ready to be customized.</p>
            <Button className="mt-4 bg-orange-500 hover:bg-orange-600">
              Get Started
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}