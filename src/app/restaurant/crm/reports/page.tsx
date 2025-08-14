'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function CrmReportsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
          Crm Reports
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage your crm better, make more money
        </p>
        
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Crm Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Your crm reports page is ready to be customized.</p>
            <Button className="mt-4 bg-orange-500 hover:bg-orange-600">
              Get Started
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}