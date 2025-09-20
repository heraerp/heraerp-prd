'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart3,
  Globe,
  Zap,
  RefreshCcw
} from 'lucide-react'

interface MarketQuote {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
}

interface MarketDataWidgetProps {
  className?: string
}

export function MarketDataWidget({ className }: MarketDataWidgetProps) {
  const [marketData, setMarketData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchMarketData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/v1/market-data?action=overview')
      const result = await response.json()

      if (result.success) {
        setMarketData(result.data)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Error fetching market data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMarketData()

    // Auto-refresh every 60 seconds
    const interval = setInterval(fetchMarketData, 60000)

    return () => clearInterval(interval)
  }, [])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(price)
  }

  const formatPercent = (percent: number) => {
    const formatted = Math.abs(percent).toFixed(2)
    const sign = percent >= 0 ? '+' : '-'
    return `${sign}${formatted}%`
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-emerald-400'
    if (change < 0) return 'text-red-400'
    return 'text-muted-foreground'
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3" />
    if (change < 0) return <TrendingDown className="h-3 w-3" />
    return null
  }

  if (loading && !marketData) {
    return (
      <Card className={`bg-background/50 border-border ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-200 text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Market Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex justify-between items-center">
                <div className="h-4 bg-slate-700 rounded animate-pulse w-20"></div>
                <div className="h-4 bg-slate-700 rounded animate-pulse w-16"></div>
                <div className="h-4 bg-slate-700 rounded animate-pulse w-12"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`bg-background/50 border-border ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-200 text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Market Overview
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-slate-500">{lastUpdated.toLocaleTimeString()}</span>
            )}
            <button
              onClick={fetchMarketData}
              className="p-1 hover:bg-slate-700 rounded"
              disabled={loading}
            >
              <RefreshCcw
                className={`h-3 w-3 text-muted-foreground ${loading ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="indices" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-muted">
            <TabsTrigger value="indices" className="text-xs">
              Indices
            </TabsTrigger>
            <TabsTrigger value="stocks" className="text-xs">
              Stocks
            </TabsTrigger>
            <TabsTrigger value="forex" className="text-xs">
              Forex
            </TabsTrigger>
            <TabsTrigger value="commodities" className="text-xs">
              Commodities
            </TabsTrigger>
          </TabsList>

          <TabsContent value="indices" className="mt-3">
            <div className="space-y-2">
              {marketData?.indices?.slice(0, 4).map((quote: MarketQuote) => (
                <MarketQuoteRow key={quote.symbol} quote={quote} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="stocks" className="mt-3">
            <div className="space-y-2">
              {marketData?.quotes?.slice(0, 6).map((quote: MarketQuote) => (
                <MarketQuoteRow key={quote.symbol} quote={quote} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="forex" className="mt-3">
            <div className="space-y-2">
              {marketData?.currencies?.slice(0, 4).map((quote: MarketQuote) => (
                <MarketQuoteRow key={quote.symbol} quote={quote} showCurrency={false} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="commodities" className="mt-3">
            <div className="space-y-2">
              {marketData?.commodities?.slice(0, 4).map((quote: MarketQuote) => (
                <MarketQuoteRow key={quote.symbol} quote={quote} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

interface MarketQuoteRowProps {
  quote: MarketQuote
  showCurrency?: boolean
}

function MarketQuoteRow({ quote, showCurrency = true }: MarketQuoteRowProps) {
  const formatPrice = (price: number) => {
    if (showCurrency) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
      }).format(price)
    }
    return price.toFixed(4)
  }

  const formatPercent = (percent: number) => {
    const formatted = Math.abs(percent).toFixed(2)
    const sign = percent >= 0 ? '+' : '-'
    return `${sign}${formatted}%`
  }

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-emerald-400'
    if (change < 0) return 'text-red-400'
    return 'text-muted-foreground'
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3" />
    if (change < 0) return <TrendingDown className="h-3 w-3" />
    return null
  }

  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-slate-200 truncate">{quote.symbol}</div>
        <div className="text-xs text-slate-500 truncate">{quote.name}</div>
      </div>

      <div className="text-right">
        <div className="text-sm font-medium text-slate-200">{formatPrice(quote.price)}</div>
        <div className={`text-xs flex items-center gap-1 ${getChangeColor(quote.changePercent)}`}>
          {getChangeIcon(quote.changePercent)}
          {formatPercent(quote.changePercent)}
        </div>
      </div>
    </div>
  )
}
