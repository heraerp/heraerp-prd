// PWM API integration layer using HERA's universal APIs with real market data

import { 
  WealthEntity, 
  WealthTransaction, 
  WealthOverview, 
  AssetAllocation,
  AIInsight,
  PerformanceMetrics,
  WealthDynamicData,
  WealthEntityType,
  WealthTransactionType
} from './types';
import { yahooFinanceService, StockQuote } from './yahoo-finance';

const API_BASE = '/api/v1';

// Helper to handle API responses
async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// Wealth calculation using universal tables with real market data
export async function getWealthOverview(organizationId: string): Promise<WealthOverview> {
  try {
    // Check if this is demo mode with real market data
    if (organizationId === 'demo-org-001' || organizationId === 'o2222222-2222-2222-2222-222222222222') {
      // Use real market data for demo portfolio
      return await calculateRealMarketWealthOverview();
    }

    // Get all wealth-related entities
    const assets = await getWealthEntities(organizationId);
    
    // Update valuations with real market data
    const valuations = await updateAssetValuationsWithMarketData(assets);
    
    // Get recent transactions
    const transactions = await getRecentTransactions(organizationId, 10);
    
    // Calculate totals and allocations
    const totalWealth = valuations.reduce((sum, val) => sum + (val || 0), 0);
    const assetAllocation = await calculateAssetAllocationWithMarketData(assets, valuations);
    
    // Get performance metrics with real market data
    const dailyPerformance = await getPerformanceMetrics(organizationId, 'day');
    const monthlyPerformance = await getPerformanceMetrics(organizationId, 'month');
    const yearlyPerformance = await getPerformanceMetrics(organizationId, 'year');
    
    return {
      totalWealth,
      currency: 'USD',
      lastUpdated: new Date().toISOString(),
      dailyChange: dailyPerformance.absoluteReturn,
      dailyChangePercent: dailyPerformance.percentageReturn,
      monthlyChange: monthlyPerformance.absoluteReturn,
      yearlyChange: yearlyPerformance.absoluteReturn,
      assetAllocation,
      topHoldings: assets.slice(0, 10),
      recentTransactions: transactions
    };
  } catch (error) {
    console.error('Error fetching wealth overview:', error);
    throw error;
  }
}

// Get all wealth-related entities
export async function getWealthEntities(
  organizationId: string,
  entityType?: WealthEntityType
): Promise<WealthEntity[]> {
  const params = new URLSearchParams({
    organization_id: organizationId,
    ...(entityType && { entity_type: entityType })
  });
  
  const response = await fetch(`${API_BASE}/entities?${params}`);
  const entities = await handleApiResponse<any[]>(response);
  
  // Filter for wealth-related entity types
  const wealthTypes: WealthEntityType[] = [
    'asset', 'portfolio', 'account', 'investment', 
    'real_estate', 'crypto', 'commodity', 'private_equity',
    'hedge_fund', 'trust', 'foundation'
  ];
  
  return entities.filter(e => wealthTypes.includes(e.entity_type));
}

// Get current value from dynamic data
export async function getCurrentValue(entityId: string): Promise<number> {
  const response = await fetch(
    `${API_BASE}/dynamic-data/${entityId}?field_name=current_value&is_current=true`
  );
  
  const data = await handleApiResponse<WealthDynamicData[]>(response);
  return data[0]?.field_value || 0;
}

// Get performance data from transactions
export async function getPerformanceMetrics(
  organizationId: string,
  period: PerformanceMetrics['period']
): Promise<PerformanceMetrics> {
  const startDate = getStartDateForPeriod(period);
  
  const params = new URLSearchParams({
    organization_id: organizationId,
    transaction_type: 'valuation_update',
    start_date: startDate.toISOString(),
    end_date: new Date().toISOString()
  });
  
  const response = await fetch(`${API_BASE}/transactions?${params}`);
  const transactions = await handleApiResponse<WealthTransaction[]>(response);
  
  // Calculate performance from valuation updates
  const startValue = transactions[0]?.total_amount || 0;
  const endValue = transactions[transactions.length - 1]?.total_amount || 0;
  const absoluteReturn = endValue - startValue;
  const percentageReturn = startValue > 0 ? (absoluteReturn / startValue) * 100 : 0;
  
  return {
    period,
    startValue,
    endValue,
    absoluteReturn,
    percentageReturn,
    benchmarkReturn: 0, // TODO: Implement benchmark comparison
    alpha: 0,
    sharpeRatio: 0,
    volatility: 0
  };
}

// Get recent transactions
export async function getRecentTransactions(
  organizationId: string,
  limit: number = 10
): Promise<WealthTransaction[]> {
  const params = new URLSearchParams({
    organization_id: organizationId,
    limit: limit.toString(),
    order_by: 'transaction_date',
    order_direction: 'desc'
  });
  
  const response = await fetch(`${API_BASE}/transactions?${params}`);
  return handleApiResponse<WealthTransaction[]>(response);
}

// Get AI insights
export async function getAIInsights(organizationId: string): Promise<AIInsight[]> {
  // Check if this is demo mode
  if (organizationId === 'demo-org-001' || organizationId === 'o2222222-2222-2222-2222-222222222222') {
    const { DEMO_AI_INSIGHTS } = await import('./demo');
    return DEMO_AI_INSIGHTS;
  }

  // For now, return mock insights - integrate with AI service later
  return [
    {
      id: '1',
      type: 'opportunity',
      title: 'Tech Sector Rotation Opportunity',
      description: 'Based on market patterns, rotating 15% from bonds to tech equities could yield additional 12% annual returns',
      impact: 1500000,
      confidence: 0.85,
      priority: 'high',
      created_at: new Date().toISOString(),
      actions: [
        {
          id: '1',
          action_type: 'rebalance',
          description: 'Shift allocation from bonds to tech stocks',
          suggested_amount: 15000000
        }
      ]
    },
    {
      id: '2',
      type: 'risk',
      title: 'Currency Exposure Risk',
      description: 'EUR exposure exceeds recommended threshold by 20%',
      impact: -500000,
      confidence: 0.92,
      priority: 'medium',
      created_at: new Date().toISOString()
    },
    {
      id: '3',
      type: 'recommendation',
      title: 'Tax Loss Harvesting Available',
      description: 'Identified $2.3M in tax loss harvesting opportunities',
      impact: 800000,
      confidence: 0.95,
      priority: 'high',
      created_at: new Date().toISOString()
    }
  ];
}

// Create wealth transaction
export async function createTransaction(
  organizationId: string,
  transaction: Partial<WealthTransaction>
): Promise<WealthTransaction> {
  const response = await fetch(`${API_BASE}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...transaction,
      organization_id: organizationId
    })
  });
  
  return handleApiResponse<WealthTransaction>(response);
}

// WebSocket connection for real-time updates
export function subscribeToWealthUpdates(
  organizationId: string,
  onUpdate: (update: any) => void
): () => void {
  const ws = new WebSocket(`wss://api.hera.com/wealth/${organizationId}`);
  
  ws.onmessage = (event) => {
    const update = JSON.parse(event.data);
    onUpdate(update);
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
  };
  
  ws.onclose = () => {
    console.log('WebSocket connection closed');
    // Implement reconnection logic
  };
  
  return () => ws.close();
}

// Helper functions
function getStartDateForPeriod(period: PerformanceMetrics['period']): Date {
  const now = new Date();
  switch (period) {
    case 'day':
      return new Date(now.setDate(now.getDate() - 1));
    case 'week':
      return new Date(now.setDate(now.getDate() - 7));
    case 'month':
      return new Date(now.setMonth(now.getMonth() - 1));
    case 'quarter':
      return new Date(now.setMonth(now.getMonth() - 3));
    case 'year':
      return new Date(now.setFullYear(now.getFullYear() - 1));
    case 'all':
      return new Date('1900-01-01');
  }
}

function calculateAssetAllocation(
  entities: WealthEntity[],
  valuations: number[]
): AssetAllocation[] {
  const totalValue = valuations.reduce((sum, val) => sum + val, 0);
  const allocationMap = new Map<string, AssetAllocation>();
  
  entities.forEach((entity, index) => {
    const value = valuations[index] || 0;
    const category = mapEntityTypeToCategory(entity.entity_type);
    
    if (!allocationMap.has(category)) {
      allocationMap.set(category, {
        category,
        value: 0,
        percentage: 0,
        change24h: 0,
        riskScore: 0,
        entities: []
      });
    }
    
    const allocation = allocationMap.get(category)!;
    allocation.value += value;
    allocation.entities.push(entity);
  });
  
  // Calculate percentages
  allocationMap.forEach(allocation => {
    allocation.percentage = totalValue > 0 ? (allocation.value / totalValue) * 100 : 0;
    allocation.riskScore = calculateRiskScore(allocation.category);
  });
  
  return Array.from(allocationMap.values()).sort((a, b) => b.value - a.value);
}

function mapEntityTypeToCategory(entityType: WealthEntityType): string {
  const categoryMap: Record<WealthEntityType, string> = {
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
  };
  
  return categoryMap[entityType] || 'Other';
}

function calculateRiskScore(category: string): number {
  const riskScores: Record<string, number> = {
    'Cash & Equivalents': 1,
    'Real Estate': 3,
    'Public Equities': 5,
    'Managed Portfolios': 5,
    'Commodities': 6,
    'Hedge Funds': 7,
    'Private Equity': 8,
    'Cryptocurrency': 9,
    'General Assets': 5,
    'Trusts': 3,
    'Foundations': 3,
    'Other': 5
  };
  
  return riskScores[category] || 5;
}

// Real market data integration functions
async function calculateRealMarketWealthOverview(): Promise<WealthOverview> {
  // Demo portfolio with real market data
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

  try {
    const performance = await yahooFinanceService.calculatePortfolioPerformance(demoHoldings);
    const marketData = await yahooFinanceService.getMarketOverview();
    
    // Calculate allocations based on current market values
    const assetAllocation = calculatePortfolioAllocation(performance.holdings);
    
    // Get S&P 500 performance for benchmark comparison
    const spyQuote = await yahooFinanceService.getQuote('SPY');
    const spyChange = spyQuote?.changePercent || 0;

    return {
      totalWealth: performance.totalValue,
      currency: 'USD',
      lastUpdated: new Date().toISOString(),
      dailyChange: performance.totalValue * (spyChange / 100), // Approximate daily change
      dailyChangePercent: spyChange,
      monthlyChange: performance.totalGainLoss * 0.1, // Approximate
      yearlyChange: performance.totalGainLoss,
      assetAllocation,
      topHoldings: [], // Will be populated from holdings
      recentTransactions: generateRecentTransactions(performance.holdings)
    };
  } catch (error) {
    console.error('Error calculating real market data:', error);
    // Fallback to demo data if market API fails
    const { calculateDemoWealthOverview } = await import('./demo');
    return calculateDemoWealthOverview();
  }
}

async function updateAssetValuationsWithMarketData(assets: WealthEntity[]): Promise<number[]> {
  const valuations = [];
  
  for (const asset of assets) {
    try {
      // Try to get symbol from dynamic data
      const symbol = await getAssetSymbol(asset.entity_id);
      if (symbol) {
        const quote = await yahooFinanceService.getQuote(symbol);
        const shares = await getAssetShares(asset.entity_id);
        const marketValue = quote ? quote.price * (shares || 1) : 0;
        valuations.push(marketValue);
      } else {
        // Fallback to stored valuation
        const storedValue = await getCurrentValue(asset.entity_id);
        valuations.push(storedValue);
      }
    } catch (error) {
      console.error(`Error updating valuation for asset ${asset.entity_id}:`, error);
      const storedValue = await getCurrentValue(asset.entity_id);
      valuations.push(storedValue);
    }
  }
  
  return valuations;
}

async function calculateAssetAllocationWithMarketData(
  entities: WealthEntity[],
  valuations: number[]
): Promise<AssetAllocation[]> {
  const totalValue = valuations.reduce((sum, val) => sum + val, 0);
  const allocationMap = new Map<string, AssetAllocation>();
  
  // Get market data for change calculations
  const symbols = [];
  for (const entity of entities) {
    const symbol = await getAssetSymbol(entity.entity_id);
    if (symbol) symbols.push(symbol);
  }
  
  const quotes = await yahooFinanceService.getMultipleQuotes(symbols);
  const quoteMap = new Map(quotes.map(q => [q.symbol, q]));
  
  entities.forEach((entity, index) => {
    const value = valuations[index] || 0;
    const category = mapEntityTypeToCategory(entity.entity_type);
    
    if (!allocationMap.has(category)) {
      allocationMap.set(category, {
        category,
        value: 0,
        percentage: 0,
        change24h: 0,
        riskScore: 0,
        entities: []
      });
    }
    
    const allocation = allocationMap.get(category)!;
    allocation.value += value;
    allocation.entities.push(entity);
    
    // Add market change data
    const symbol = getEntitySymbol(entity);
    if (symbol) {
      const quote = quoteMap.get(symbol);
      if (quote) {
        allocation.change24h += quote.changePercent;
      }
    }
  });
  
  // Calculate percentages and average changes
  allocationMap.forEach(allocation => {
    allocation.percentage = totalValue > 0 ? (allocation.value / totalValue) * 100 : 0;
    allocation.riskScore = calculateRiskScore(allocation.category);
    allocation.change24h = allocation.change24h / allocation.entities.length; // Average change
  });
  
  return Array.from(allocationMap.values()).sort((a, b) => b.value - a.value);
}

function calculatePortfolioAllocation(holdings: Array<{
  symbol: string;
  marketValue: number;
  gainLoss: number;
  gainLossPercent: number;
}>): AssetAllocation[] {
  const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0);
  
  // Simplified allocation by sectors (this could be enhanced with sector API)
  const techStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA'];
  const etfs = ['SPY', 'QQQ', 'IWM'];
  
  let techValue = 0;
  let etfValue = 0;
  let otherValue = 0;
  let techChange = 0;
  let etfChange = 0;
  let otherChange = 0;
  
  holdings.forEach(holding => {
    if (techStocks.includes(holding.symbol)) {
      techValue += holding.marketValue;
      techChange += holding.gainLossPercent;
    } else if (etfs.includes(holding.symbol)) {
      etfValue += holding.marketValue;
      etfChange += holding.gainLossPercent;
    } else {
      otherValue += holding.marketValue;
      otherChange += holding.gainLossPercent;
    }
  });
  
  const allocations: AssetAllocation[] = [];
  
  if (techValue > 0) {
    allocations.push({
      category: 'Technology',
      value: techValue,
      percentage: (techValue / totalValue) * 100,
      change24h: techChange / techStocks.filter(s => holdings.find(h => h.symbol === s)).length,
      riskScore: 7,
      entities: []
    });
  }
  
  if (etfValue > 0) {
    allocations.push({
      category: 'ETFs',
      value: etfValue,
      percentage: (etfValue / totalValue) * 100,
      change24h: etfChange / etfs.filter(s => holdings.find(h => h.symbol === s)).length,
      riskScore: 4,
      entities: []
    });
  }
  
  if (otherValue > 0) {
    allocations.push({
      category: 'Other',
      value: otherValue,
      percentage: (otherValue / totalValue) * 100,
      change24h: otherChange,
      riskScore: 5,
      entities: []
    });
  }
  
  return allocations.sort((a, b) => b.value - a.value);
}

function generateRecentTransactions(holdings: Array<{
  symbol: string;
  shares: number;
  marketValue: number;
}>): WealthTransaction[] {
  return holdings.slice(0, 5).map((holding, index) => ({
    transaction_id: `txn-${index + 1}`,
    organization_id: 'demo-org-001',
    transaction_type: 'buy' as WealthTransactionType,
    transaction_date: new Date(Date.now() - (index + 1) * 24 * 60 * 60 * 1000).toISOString(),
    entity_id: `entity-${index + 1}`,
    total_amount: holding.marketValue,
    quantity: holding.shares,
    unit_price: holding.marketValue / holding.shares,
    currency: 'USD',
    reference_number: `REF-${index + 1}`,
    description: `Purchase of ${holding.shares} shares of ${holding.symbol}`,
    metadata: {
      symbol: holding.symbol,
      market_data: true
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }));
}

// Helper functions for market data integration
async function getAssetSymbol(entityId: string): Promise<string | null> {
  try {
    const response = await fetch(
      `${API_BASE}/dynamic-data/${entityId}?field_name=symbol&is_current=true`
    );
    const data = await handleApiResponse<WealthDynamicData[]>(response);
    return data[0]?.field_value || null;
  } catch {
    return null;
  }
}

async function getAssetShares(entityId: string): Promise<number> {
  try {
    const response = await fetch(
      `${API_BASE}/dynamic-data/${entityId}?field_name=shares&is_current=true`
    );
    const data = await handleApiResponse<WealthDynamicData[]>(response);
    return parseFloat(data[0]?.field_value || '1');
  } catch {
    return 1;
  }
}

function getEntitySymbol(entity: WealthEntity): string | null {
  // Extract symbol from entity name or code if available
  if (entity.entity_code && entity.entity_code.match(/^[A-Z]{1,5}$/)) {
    return entity.entity_code;
  }
  // Could also check entity_name for stock symbols
  return null;
}

// Market data API integration
export async function getMarketData(): Promise<any> {
  try {
    return await yahooFinanceService.getMarketOverview();
  } catch (error) {
    console.error('Error fetching market data:', error);
    return null;
  }
}

export async function getStockQuote(symbol: string): Promise<StockQuote | null> {
  try {
    return await yahooFinanceService.getQuote(symbol);
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    return null;
  }
}

export async function getHistoricalData(symbol: string, period: string = '1y'): Promise<any[]> {
  try {
    return await yahooFinanceService.getHistoricalData(
      symbol, 
      period as '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y'
    );
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error);
    return [];
  }
}