'use client'

import { useState, useRef } from 'react'
import React from 'react'
import { PullToRefresh } from '@/lib/dna/components/mobile/PullToRefresh'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Calendar, Package, Users, TrendingUp } from 'lucide-react'

// Demo data
const generateDemoData = () => ({
  sales: Math.floor(Math.random() * 50000) + 150000,
  customers: Math.floor(Math.random() * 200) + 800,
  orders: Math.floor(Math.random() * 100) + 300,
  revenue: Math.floor(Math.random() * 100000) + 400000,
  lastUpdated: new Date().toLocaleTimeString()
})

export default function PullToRefreshDemo() {
  const [data, setData] = useState(generateDemoData())
  const [refreshCount, setRefreshCount] = useState(0)
  const refreshRef = useRef<{ refresh: () => Promise<void> }>(null)

  const handleRefresh = async () => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Update data
    setData(generateDemoData())
    setRefreshCount(prev => prev + 1)
  }

  const triggerProgrammaticRefresh = async () => {
    await refreshRef.current?.refresh()
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900">
      <Tabs defaultValue="circular" className="h-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="circular">Circular</TabsTrigger>
          <TabsTrigger value="linear">Linear</TabsTrigger>
          <TabsTrigger value="custom">Custom</TabsTrigger>
        </TabsList>

        <TabsContent value="circular" className="h-[calc(100%-3rem)]">
          <PullToRefresh 
            onRefresh={handleRefresh}
            className="h-full"
          >
            <DemoContent 
              data={data} 
              refreshCount={refreshCount}
              onProgrammaticRefresh={triggerProgrammaticRefresh}
            />
          </PullToRefresh>
        </TabsContent>

        <TabsContent value="linear" className="h-[calc(100%-3rem)]">
          <PullToRefresh 
            onRefresh={handleRefresh}
            indicatorStyle="linear"
            className="h-full"
            messages={{
              pull: "Pull down for latest sales data",
              release: "Release to update dashboard",
              refreshing: "Updating sales metrics..."
            }}
          >
            <DemoContent 
              data={data} 
              refreshCount={refreshCount}
              onProgrammaticRefresh={triggerProgrammaticRefresh}
            />
          </PullToRefresh>
        </TabsContent>

        <TabsContent value="custom" className="h-[calc(100%-3rem)]">
          <PullToRefresh 
            ref={refreshRef}
            onRefresh={handleRefresh}
            indicatorStyle="custom"
            className="h-full"
            customIndicator={(state, progress) => (
              <div className="flex flex-col items-center gap-2">
                <div 
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"
                  style={{
                    transform: `scale(${0.5 + progress * 0.5})`,
                    opacity: 0.5 + progress * 0.5
                  }}
                >
                  <TrendingUp 
                    className="h-6 w-6 text-primary"
                    style={{
                      transform: state === 'refreshing' 
                        ? 'rotate(0deg)' 
                        : `rotate(${progress * 360}deg)`
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {state === 'refreshing' 
                    ? 'Syncing data...' 
                    : `${Math.round(progress * 100)}% - ${state === 'readyToRefresh' ? 'Release!' : 'Pull more'}`
                  }
                </span>
              </div>
            )}
            onPull={(progress) => {
              console.log('Pull progress:', progress)
            }}
            onRefreshStart={() => {
              console.log('Refresh started')
            }}
            onRefreshEnd={() => {
              console.log('Refresh completed')
            }}
          >
            <DemoContent 
              data={data} 
              refreshCount={refreshCount}
              onProgrammaticRefresh={triggerProgrammaticRefresh}
            />
          </PullToRefresh>
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface DemoContentProps {
  data: ReturnType<typeof generateDemoData>
  refreshCount: number
  onProgrammaticRefresh: () => void
}

function DemoContent({ data, refreshCount, onProgrammaticRefresh }: DemoContentProps) {
  return (
    <div className="min-h-full bg-white p-4 dark:bg-gray-950">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Sales Dashboard
        </h1>
        <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
          <span>Last updated: {data.lastUpdated}</span>
          <Badge variant="secondary">
            Refreshed {refreshCount} time{refreshCount !== 1 ? 's' : ''}
          </Badge>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Sales"
          value={`$${data.sales.toLocaleString()}`}
          icon={TrendingUp}
          trend="+12.5%"
          color="text-green-600"
        />
        <StatCard
          title="Customers"
          value={data.customers.toLocaleString()}
          icon={Users}
          trend="+5.3%"
          color="text-blue-600"
        />
        <StatCard
          title="Orders"
          value={data.orders.toLocaleString()}
          icon={Package}
          trend="+8.7%"
          color="text-purple-600"
        />
        <StatCard
          title="Revenue"
          value={`$${data.revenue.toLocaleString()}`}
          icon={Calendar}
          trend="+15.2%"
          color="text-orange-600"
        />
      </div>

      {/* Actions */}
      <Card className="mb-6 p-6">
        <h2 className="mb-4 text-lg font-semibold">Actions</h2>
        <div className="flex flex-wrap gap-4">
          <Button onClick={onProgrammaticRefresh}>
            Programmatic Refresh
          </Button>
          <Button variant="outline">
            Export Data
          </Button>
          <Button variant="outline">
            View Reports
          </Button>
        </div>
      </Card>

      {/* Instructions */}
      <Card className="mb-6 bg-gray-50 p-6 dark:bg-gray-900/50">
        <h2 className="mb-4 text-lg font-semibold">Pull-to-Refresh Demo</h2>
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          <p>• Pull down from the top to refresh the dashboard data</p>
          <p>• Try different indicator styles using the tabs above</p>
          <p>• The custom indicator shows progress percentage</p>
          <p>• Use the "Programmatic Refresh" button to trigger refresh via code</p>
          <p>• Check console for event callbacks in the custom tab</p>
        </div>
      </Card>

      {/* Scrollable Content */}
      <div className="space-y-4">
        {[...Array(20)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Order #{1000 + i}</h3>
                <p className="text-sm text-gray-500">Customer {i + 1}</p>
              </div>
              <Badge>${(Math.random() * 500 + 50).toFixed(2)}</Badge>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  icon: React.ElementType
  trend: string
  color: string
}

function StatCard({ title, value, icon: Icon, trend, color }: StatCardProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="mt-2 text-2xl font-bold">{value}</p>
          <p className={`mt-1 text-sm ${color}`}>{trend}</p>
        </div>
        <Icon className={`h-8 w-8 ${color} opacity-20`} />
      </div>
    </Card>
  )
}