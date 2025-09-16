'use client'

import React, { useState } from 'react'
import { AssetAllocationWheel } from './AssetAllocationWheel'
import { TopHoldingsGrid } from './TopHoldingsGrid'
import { GeographicMap } from './GeographicMap'
import { SectorTrends } from './SectorTrends'
import { PortfolioHoldings } from './PortfolioHoldings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card } from '@/components/ui/card'
import { PieChart, Globe, TrendingUp, Grid3x3 } from 'lucide-react'
import { AssetAllocation, WealthEntity } from '@/lib/pwm/types'
import { useQuery } from '@tanstack/react-query'
import { getWealthEntities, getCurrentValue } from '@/lib/pwm/api'

interface PortfolioCompositionProps {
  organizationId: string
}

export function PortfolioComposition({ organizationId }: PortfolioCompositionProps) {
  const [activeTab, setActiveTab] = useState('allocation')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  // Fetch portfolio data
  const { data: entities, isLoading } = useQuery({
    queryKey: ['portfolio-entities', organizationId],
    queryFn: () => getWealthEntities(organizationId)
  })

  // Mock data generation (replace with real data processing)
  const generateMockData = () => {
    if (!entities) return { allocations: [], holdings: [], totalValue: 0 }

    // Generate allocations
    const categoryMap = new Map<string, AssetAllocation>()
    const holdings: any[] = []
    let totalValue = 0

    entities.forEach((entity, index) => {
      const value = Math.random() * 10000000 + 1000000 // Mock value
      const change = (Math.random() - 0.5) * 10
      totalValue += value

      // Add to holdings
      holdings.push({
        ...entity,
        value,
        change24h: value * (change / 100),
        change24hPercent: change,
        allocation: 0, // Will calculate after
        aiScore: Math.floor(Math.random() * 4) + 6
      })

      // Categorize for allocation
      const category = mapEntityTypeToCategory(entity.entity_type)
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          category,
          value: 0,
          percentage: 0,
          change24h: 0,
          riskScore: 5,
          entities: []
        })
      }

      const alloc = categoryMap.get(category)!
      alloc.value += value
      alloc.entities.push(entity)
    })

    // Calculate percentages and sort holdings
    categoryMap.forEach(alloc => {
      alloc.percentage = (alloc.value / totalValue) * 100
      alloc.change24h = (Math.random() - 0.5) * 5
    })

    holdings.sort((a, b) => b.value - a.value)
    holdings.forEach(h => {
      h.allocation = (h.value / totalValue) * 100
    })

    return {
      allocations: Array.from(categoryMap.values()).sort((a, b) => b.value - a.value),
      holdings: holdings.slice(0, 10),
      totalValue
    }
  }

  const { allocations, holdings, totalValue } = generateMockData()

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category)
    // TODO: Filter holdings by category
  }

  const handleHoldingClick = (holding: any) => {
    console.log('Holding clicked:', holding)
    // TODO: Navigate to holding details
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <Card className="h-96 bg-muted animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Portfolio Composition</h2>
          <p className="text-muted-foreground mt-1">
            Comprehensive analysis of your investment distribution
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl bg-muted/50 p-1">
          <TabsTrigger
            value="allocation"
            className="data-[state=active]:bg-slate-700 flex items-center gap-2"
          >
            <PieChart className="h-4 w-4" />
            <span className="hidden sm:inline">Allocation</span>
          </TabsTrigger>
          <TabsTrigger
            value="holdings"
            className="data-[state=active]:bg-slate-700 flex items-center gap-2"
          >
            <Grid3x3 className="h-4 w-4" />
            <span className="hidden sm:inline">Holdings</span>
          </TabsTrigger>
          <TabsTrigger
            value="geographic"
            className="data-[state=active]:bg-slate-700 flex items-center gap-2"
          >
            <Globe className="h-4 w-4" />
            <span className="hidden sm:inline">Geographic</span>
          </TabsTrigger>
          <TabsTrigger
            value="sectors"
            className="data-[state=active]:bg-slate-700 flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Sectors</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Content */}
        <TabsContent value="allocation" className="space-y-6">
          <AssetAllocationWheel
            allocations={allocations}
            totalValue={totalValue}
            currency="USD"
            onCategoryClick={handleCategoryClick}
          />
        </TabsContent>

        <TabsContent value="holdings" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TopHoldingsGrid
                holdings={holdings}
                currency="USD"
                onHoldingClick={handleHoldingClick}
              />
            </div>
            <div>
              <PortfolioHoldings organizationId={organizationId} />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="geographic" className="space-y-6">
          <GeographicMap organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="sectors" className="space-y-6">
          <SectorTrends organizationId={organizationId} />
        </TabsContent>
      </Tabs>

      {/* Selected Category Details */}
      {selectedCategory && (
        <Card className="p-6 bg-background/50 backdrop-blur-sm border-slate-800">
          <h3 className="text-lg font-semibold text-foreground mb-4">{selectedCategory} Details</h3>
          {/* TODO: Add detailed breakdown of selected category */}
        </Card>
      )}
    </div>
  )
}

// Helper function
function mapEntityTypeToCategory(entityType: string): string {
  const categoryMap: Record<string, string> = {
    asset: 'General Assets',
    portfolio: 'Managed Portfolios',
    account: 'Cash & Equivalents',
    investment: 'Public Equities',
    real_estate: 'Real Estate',
    crypto: 'Cryptocurrency',
    commodity: 'Commodities',
    private_equity: 'Private Equity',
    hedge_fund: 'Hedge Funds',
    trust: 'Trusts',
    foundation: 'Foundations'
  }

  return categoryMap[entityType] || 'Other'
}
