'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TestTube, CheckCircle, XCircle, AlertCircle, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface TestingSummaryCardProps {
  recentTests?: {
    ruleName: string
    passRate: number
    lastTested: string
  }[]
}

export function TestingSummaryCard({ recentTests = [] }: TestingSummaryCardProps) {
  // Mock data for demo
  const demoTests = [
    {
      ruleName: 'Salon Cancellation Policy',
      passRate: 100,
      lastTested: '2 hours ago'
    },
    {
      ruleName: 'VIP Discount Rules',
      passRate: 83,
      lastTested: '1 day ago'
    },
    {
      ruleName: 'Peak Hour Pricing',
      passRate: 67,
      lastTested: '3 days ago'
    }
  ]

  const tests = recentTests.length > 0 ? recentTests : demoTests

  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-blue-200 dark:border-blue-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <TestTube className="w-5 h-5 text-foreground" />
            </div>
            <div>
              <CardTitle>Rule Testing</CardTitle>
              <CardDescription>Test your business rules before deployment</CardDescription>
            </div>
          </div>
          <Link href="/salon-data/config?tab=rules">
            <Button variant="ghost" size="sm">
              View All
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Testing Benefits */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-3 bg-background/50 dark:bg-muted/50 rounded-lg">
            <CheckCircle className="w-6 h-6 mx-auto mb-1 text-green-600" />
            <p className="text-xs font-medium ink dark:text-gray-300">Validate Logic</p>
          </div>
          <div className="text-center p-3 bg-background/50 dark:bg-muted/50 rounded-lg">
            <AlertCircle className="w-6 h-6 mx-auto mb-1 text-yellow-600" />
            <p className="text-xs font-medium ink dark:text-gray-300">Find Edge Cases</p>
          </div>
          <div className="text-center p-3 bg-background/50 dark:bg-muted/50 rounded-lg">
            <XCircle className="w-6 h-6 mx-auto mb-1 text-red-600" />
            <p className="text-xs font-medium ink dark:text-gray-300">Prevent Errors</p>
          </div>
        </div>

        {/* Recent Tests */}
        <div>
          <h4 className="text-sm font-medium mb-3 text-gray-100 dark:text-foreground">
            Recent Test Results
          </h4>
          <div className="space-y-2">
            {tests.map((test, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-background/70 dark:bg-muted/70 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      test.passRate === 100
                        ? 'bg-green-500'
                        : test.passRate >= 80
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-100 dark:text-foreground">
                      {test.ruleName}
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                      Tested {test.lastTested}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={
                    test.passRate === 100
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                      : test.passRate >= 80
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                  }
                >
                  {test.passRate}% Pass
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Test Scenarios */}
        <div className="mt-4 p-3 bg-blue-100/50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Pre-built scenarios</strong> for cancellations, pricing, notifications, and
            more. Create custom tests for your specific business needs.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
