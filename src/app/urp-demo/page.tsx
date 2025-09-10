/**
 * Universal Report Pattern Demo
 * Smart Code: HERA.DEMO.URP.v1
 * 
 * Demonstration of the Universal Report Pattern
 */

'use client'

import React from 'react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { UniversalReportViewer } from '@/components/urp/UniversalReportViewer'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  FileText, 
  Zap, 
  Database, 
  BarChart3,
  TrendingUp,
  Package,
  Users,
  DollarSign
} from 'lucide-react'

export default function URPDemoPage() {
  const { currentOrganization, isAuthenticated, contextLoading } = useMultiOrgAuth()

  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>
            Please log in to access the Universal Report Pattern demo.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!currentOrganization) {
    return (
      <div className="container mx-auto p-6">
        <Alert>
          <AlertDescription>
            Please select an organization to view reports.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Universal Report Pattern (URP) Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Revolutionary reporting system that standardizes HOW to query data across HERA's universal architecture
        </p>
      </div>

      {/* Key Benefits */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-purple-200 dark:border-purple-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">90% Faster</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  No custom SQL needed
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Database className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Universal</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Works with 6-table schema
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 dark:border-green-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Optimized</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Smart caching built-in
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-800">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <FileText className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Composable</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  6 reusable primitives
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* The 6 Primitives */}
      <Card>
        <CardHeader>
          <CardTitle>The 6 URP Primitives</CardTitle>
          <CardDescription>
            Building blocks that can be combined to create any report
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                name: 'Entity Resolver',
                description: 'Fetches entities with dynamic fields',
                smartCode: 'HERA.URP.PRIMITIVE.ENTITY.RESOLVER.v1',
                icon: Users,
                color: 'purple'
              },
              {
                name: 'Hierarchy Builder',
                description: 'Constructs parent-child relationships',
                smartCode: 'HERA.URP.PRIMITIVE.HIERARCHY.BUILDER.v1',
                icon: Package,
                color: 'blue'
              },
              {
                name: 'Transaction Facts',
                description: 'Aggregates transaction data',
                smartCode: 'HERA.URP.PRIMITIVE.TRANSACTION.FACTS.v1',
                icon: DollarSign,
                color: 'green'
              },
              {
                name: 'Dynamic Join',
                description: 'Joins across tables without SQL',
                smartCode: 'HERA.URP.PRIMITIVE.DYNAMIC.JOIN.v1',
                icon: Database,
                color: 'yellow'
              },
              {
                name: 'Rollup & Balance',
                description: 'Calculates running balances',
                smartCode: 'HERA.URP.PRIMITIVE.ROLLUP.BALANCE.v1',
                icon: TrendingUp,
                color: 'orange'
              },
              {
                name: 'Presentation Formatter',
                description: 'Formats output for display',
                smartCode: 'HERA.URP.PRIMITIVE.PRESENTATION.FORMAT.v1',
                icon: FileText,
                color: 'pink'
              }
            ].map((primitive, idx) => {
              const Icon = primitive.icon
              return (
                <div key={idx} className="p-4 border rounded-lg space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-8 h-8 rounded flex items-center justify-center',
                      `bg-${primitive.color}-100 dark:bg-${primitive.color}-900/30`
                    )}>
                      <Icon className={cn(
                        'h-4 w-4',
                        `text-${primitive.color}-600 dark:text-${primitive.color}-400`
                      )} />
                    </div>
                    <h4 className="font-medium">{primitive.name}</h4>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {primitive.description}
                  </p>
                  <Badge variant="outline" className="text-xs">
                    {primitive.smartCode}
                  </Badge>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Report Viewer */}
      <Card>
        <CardHeader>
          <CardTitle>Try It Now</CardTitle>
          <CardDescription>
            Select a report recipe and see URP in action
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UniversalReportViewer
            organizationId={currentOrganization.id}
            defaultRecipe="HERA.URP.RECIPE.FINANCE.COA.v1"
            onReportLoad={(data) => console.log('Report loaded:', data)}
          />
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold mb-2">Learn More</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            URP is a core HERA DNA component that revolutionizes reporting by standardizing patterns
            instead of creating custom queries for each report.
          </p>
          <div className="flex items-center gap-4 text-sm">
            <a href="/docs/urp" className="text-purple-600 hover:text-purple-700 dark:text-purple-400">
              Documentation →
            </a>
            <a href="/api/v1/urp" className="text-purple-600 hover:text-purple-700 dark:text-purple-400">
              API Reference →
            </a>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
              HERA.DNA.URP.v1
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}