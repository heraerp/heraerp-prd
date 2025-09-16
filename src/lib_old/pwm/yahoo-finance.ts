// Yahoo Finance integration for real market data
import yahooFinance from 'yahoo-finance2'

export interface StockQuote {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  marketCap?: number
  pe?: number
  dividend?: number
  high52Week?: number
  low52Week?: number
  lastUpdated: string
}

export interface HistoricalData {
  date: Date
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface MarketData {
  quotes: StockQuote[]
  indices: StockQuote[]
  currencies: StockQuote[]
  commodities: StockQuote[]
}

// Popular stock symbols for portfolio tracking
const POPULAR_STOCKS = [
  'AAPL',
  'MSFT',
  'GOOGL',
  'AMZN',
  'TSLA',
  'META',
  'NVDA',
  'BRK-B',
  'JPM',
  'JNJ',
  'V',
  'PG',
  'DIS',
  'MA',
  'HD',
  'BAC'
]

// Major indices
const MAJOR_INDICES = [
  '^GSPC', // S&P 500
  '^DJI', // Dow Jones
  '^IXIC', // NASDAQ
  '^RUT' // Russell 2000
]

// Currency pairs (major forex)
const CURRENCY_PAIRS = ['EURUSD=X', 'GBPUSD=X', 'USDJPY=X', 'AUDUSD=X', 'USDCAD=X', 'USDCHF=X']

// Commodities
const COMMODITIES = [
  'GC=F', // Gold
  'SI=F', // Silver
  'CL=F', // Crude Oil
  'NG=F', // Natural Gas
  'ZC=F', // Corn
  'ZW=F' // Wheat
]

export class YahooFinanceService {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private readonly CACHE_DURATION = 60 * 1000 // 1 minute cache

  /**
   * Get real-time stock quote
   */
  async getQuote(symbol: string): Promise<StockQuote | null> {
    try {
      const cacheKey = `quote_${symbol}`
      const cached = this.getCachedData(cacheKey)
      if (cached) return cached

      const result = await yahooFinance.quote(symbol)

      const quote: StockQuote = {
        symbol: result.symbol || symbol,
        name: result.longName || result.shortName || symbol,
        price: result.regularMarketPrice || 0,
        change: result.regularMarketChange || 0,
        changePercent: result.regularMarketChangePercent || 0,
        volume: result.regularMarketVolume || 0,
        marketCap: result.marketCap,
        pe: result.trailingPE,
        dividend: result.dividendYield,
        high52Week: result.fiftyTwoWeekHigh,
        low52Week: result.fiftyTwoWeekLow,
        lastUpdated: new Date().toISOString()
      }

      this.setCacheData(cacheKey, quote)
      return quote
    } catch (error) {
      console.error(`Error fetching quote for ${symbol}:`, error)
      return null
    }
  }

  /**
   * Get multiple quotes at once
   */
  async getMultipleQuotes(symbols: string[]): Promise<StockQuote[]> {
    const promises = symbols.map(symbol => this.getQuote(symbol))
    const results = await Promise.allSettled(promises)

    return results
      .map(result => (result.status === 'fulfilled' ? result.value : null))
      .filter((quote): quote is StockQuote => quote !== null)
  }

  /**
   * Get historical data for charting
   */
  async getHistoricalData(
    symbol: string,
    period: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' = '1y'
  ): Promise<HistoricalData[]> {
    try {
      const cacheKey = `history_${symbol}_${period}`
      const cached = this.getCachedData(cacheKey)
      if (cached) return cached

      const endDate = new Date()
      const startDate = this.getStartDateForPeriod(period)

      const result = await yahooFinance.historical(symbol, {
        period1: startDate,
        period2: endDate,
        interval: '1d'
      })

      const historicalData = result.map(item => ({
        date: item.date,
        open: item.open || 0,
        high: item.high || 0,
        low: item.low || 0,
        close: item.close || 0,
        volume: item.volume || 0
      }))

      this.setCacheData(cacheKey, historicalData)
      return historicalData
    } catch (error) {
      console.error(`Error fetching historical data for ${symbol}:`, error)
      return []
    }
  }

  /**
   * Get comprehensive market data
   */
  async getMarketOverview(): Promise<MarketData> {
    const [quotes, indices, currencies, commodities] = await Promise.all([
      this.getMultipleQuotes(POPULAR_STOCKS),
      this.getMultipleQuotes(MAJOR_INDICES),
      this.getMultipleQuotes(CURRENCY_PAIRS),
      this.getMultipleQuotes(COMMODITIES)
    ])

    return {
      quotes,
      indices,
      currencies,
      commodities
    }
  }

  /**
   * Search for stocks by name or symbol
   */
  async searchStocks(query: string): Promise<StockQuote[]> {
    try {
      const result = await yahooFinance.search(query)

      // Get quotes for the top 10 results
      const symbols = result.quotes
        .slice(0, 10)
        .map(q => q.symbol)
        .filter(s => s)

      return await this.getMultipleQuotes(symbols)
    } catch (error) {
      console.error(`Error searching stocks for "${query}":`, error)
      return []
    }
  }

  /**
   * Get portfolio performance based on holdings
   */
  async calculatePortfolioPerformance(
    holdings: { symbol: string; shares: number; costBasis?: number }[]
  ): Promise<{
    totalValue: number
    totalCost: number
    totalGainLoss: number
    totalGainLossPercent: number
    holdings: Array<{
      symbol: string
      shares: number
      currentPrice: number
      marketValue: number
      costBasis: number
      gainLoss: number
      gainLossPercent: number
    }>
  }> {
    const symbols = holdings.map(h => h.symbol)
    const quotes = await this.getMultipleQuotes(symbols)
    const quoteMap = new Map(quotes.map(q => [q.symbol, q]))

    let totalValue = 0
    let totalCost = 0

    const calculatedHoldings = holdings.map(holding => {
      const quote = quoteMap.get(holding.symbol)
      const currentPrice = quote?.price || 0
      const marketValue = holding.shares * currentPrice
      const costBasis = holding.costBasis || 0
      const totalCostBasis = holding.shares * costBasis
      const gainLoss = marketValue - totalCostBasis
      const gainLossPercent = totalCostBasis > 0 ? (gainLoss / totalCostBasis) * 100 : 0

      totalValue += marketValue
      totalCost += totalCostBasis

      return {
        symbol: holding.symbol,
        shares: holding.shares,
        currentPrice,
        marketValue,
        costBasis: totalCostBasis,
        gainLoss,
        gainLossPercent
      }
    })

    const totalGainLoss = totalValue - totalCost
    const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0

    return {
      totalValue,
      totalCost,
      totalGainLoss,
      totalGainLossPercent,
      holdings: calculatedHoldings
    }
  }

  private getCachedData(key: string): any {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }
    return null
  }

  private setCacheData(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  private getStartDateForPeriod(period: string): Date {
    const now = new Date()
    switch (period) {
      case '1d':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000)
      case '5d':
        return new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
      case '1mo':
        return new Date(now.setMonth(now.getMonth() - 1))
      case '3mo':
        return new Date(now.setMonth(now.getMonth() - 3))
      case '6mo':
        return new Date(now.setMonth(now.getMonth() - 6))
      case '1y':
        return new Date(now.setFullYear(now.getFullYear() - 1))
      case '2y':
        return new Date(now.setFullYear(now.getFullYear() - 2))
      case '5y':
        return new Date(now.setFullYear(now.getFullYear() - 5))
      default:
        return new Date(now.setFullYear(now.getFullYear() - 1))
    }
  }
}

// Singleton instance
export const yahooFinanceService = new YahooFinanceService()
