'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Plus,
  Search,
  BarChart3,
  RefreshCcw
} from 'lucide-react';

interface Holding {
  symbol: string;
  shares: number;
  currentPrice: number;
  marketValue: number;
  costBasis: number;
  gainLoss: number;
  gainLossPercent: number;
}

interface PortfolioHoldingsProps {
  organizationId: string;
  className?: string;
}

export function PortfolioHoldings({ organizationId, className }: PortfolioHoldingsProps) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Demo portfolio for immediate real data
  const demoHoldings = [
    { symbol: 'AAPL', shares: 1000, costBasis: 150 },
    { symbol: 'MSFT', shares: 800, costBasis: 280 },
    { symbol: 'GOOGL', shares: 300, costBasis: 2800 },
    { symbol: 'AMZN', shares: 500, costBasis: 3200 },
    { symbol: 'TSLA', shares: 600, costBasis: 250 },
    { symbol: 'META', shares: 400, costBasis: 320 },
    { symbol: 'NVDA', shares: 200, costBasis: 900 },
    { symbol: 'SPY', shares: 2000, costBasis: 400 }
  ];

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      
      // For demo mode, use real market data with demo holdings
      const holdingsParam = encodeURIComponent(JSON.stringify(demoHoldings));
      const response = await fetch(`/api/v1/market-data?action=portfolio&holdings=${holdingsParam}`);
      const result = await response.json();
      
      if (result.success && result.data.holdings) {
        setHoldings(result.data.holdings);
        setLastUpdated(new Date());
      }
    } catch (error) {
      console.error('Error fetching portfolio data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolioData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPortfolioData, 30000);
    
    return () => clearInterval(interval);
  }, [organizationId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatPercent = (percent: number) => {
    const formatted = Math.abs(percent).toFixed(2);
    const sign = percent >= 0 ? '+' : '-';
    return `${sign}${formatted}%`;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-emerald-400';
    if (change < 0) return 'text-red-400';
    return 'text-gray-400';
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4" />;
    if (change < 0) return <TrendingDown className="h-4 w-4" />;
    return null;
  };

  const totalValue = holdings.reduce((sum, holding) => sum + holding.marketValue, 0);
  const totalGainLoss = holdings.reduce((sum, holding) => sum + holding.gainLoss, 0);
  const totalGainLossPercent = totalValue > 0 ? (totalGainLoss / (totalValue - totalGainLoss)) * 100 : 0;

  if (loading && holdings.length === 0) {
    return (
      <Card className={`bg-slate-900/50 border-slate-700 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-200 text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Portfolio Holdings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex justify-between items-center py-2">
                <div className="flex-1 space-y-1">
                  <div className="h-4 bg-slate-700 rounded animate-pulse w-16"></div>
                  <div className="h-3 bg-slate-700 rounded animate-pulse w-24"></div>
                </div>
                <div className="text-right space-y-1">
                  <div className="h-4 bg-slate-700 rounded animate-pulse w-20"></div>
                  <div className="h-3 bg-slate-700 rounded animate-pulse w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-slate-900/50 border-slate-700 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-slate-200 text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Portfolio Holdings
          </CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-slate-500">
                {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={fetchPortfolioData}
              className="p-1 hover:bg-slate-700 rounded"
              disabled={loading}
            >
              <RefreshCcw className={`h-3 w-3 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
        
        {/* Portfolio Summary */}
        <div className="flex items-center gap-4 mt-2">
          <div className="text-sm text-slate-400">
            Total Value: <span className="text-slate-200 font-medium">{formatCurrency(totalValue)}</span>
          </div>
          <div className={`text-sm flex items-center gap-1 ${getChangeColor(totalGainLoss)}`}>
            {getChangeIcon(totalGainLoss)}
            <span>{formatCurrency(totalGainLoss)} ({formatPercent(totalGainLossPercent)})</span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="max-h-96 overflow-y-auto">
        <div className="space-y-3">
          {holdings.map((holding) => (
            <div key={holding.symbol} className="flex items-center justify-between py-2 border-b border-slate-800 last:border-b-0">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-sm font-medium text-slate-200">{holding.symbol}</div>
                    <div className="text-xs text-slate-500">
                      {holding.shares.toLocaleString()} shares @ {formatCurrency(holding.currentPrice)}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm font-medium text-slate-200">
                  {formatCurrency(holding.marketValue)}
                </div>
                <div className={`text-xs flex items-center gap-1 justify-end ${getChangeColor(holding.gainLoss)}`}>
                  {getChangeIcon(holding.gainLoss)}
                  <span>{formatCurrency(holding.gainLoss)} ({formatPercent(holding.gainLossPercent)})</span>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {holdings.length === 0 && !loading && (
          <div className="text-center py-8 text-slate-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No holdings found</p>
            <Button variant="outline" size="sm" className="mt-2">
              <Plus className="h-4 w-4 mr-2" />
              Add Holdings
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}