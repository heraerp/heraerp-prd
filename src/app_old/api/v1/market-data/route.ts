import { NextRequest, NextResponse } from 'next/server'
import { yahooFinanceService } from '@/lib/pwm/yahoo-finance'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  try {
    switch (action) {
      case 'overview':
        const marketData = await yahooFinanceService.getMarketOverview()
        return NextResponse.json({ success: true, data: marketData })

      case 'quote':
        const symbol = searchParams.get('symbol')
        if (!symbol) {
          return NextResponse.json(
            { success: false, error: 'Symbol parameter required' },
            { status: 400 }
          )
        }
        const quote = await yahooFinanceService.getQuote(symbol)
        return NextResponse.json({ success: true, data: quote })

      case 'quotes':
        const symbols = searchParams.get('symbols')
        if (!symbols) {
          return NextResponse.json(
            { success: false, error: 'Symbols parameter required' },
            { status: 400 }
          )
        }
        const symbolArray = symbols.split(',').map(s => s.trim())
        const quotes = await yahooFinanceService.getMultipleQuotes(symbolArray)
        return NextResponse.json({ success: true, data: quotes })

      case 'historical':
        const histSymbol = searchParams.get('symbol')
        const period = searchParams.get('period') as
          | '1d'
          | '5d'
          | '1mo'
          | '3mo'
          | '6mo'
          | '1y'
          | '2y'
          | '5y'

        if (!histSymbol) {
          return NextResponse.json(
            { success: false, error: 'Symbol parameter required' },
            { status: 400 }
          )
        }

        const historical = await yahooFinanceService.getHistoricalData(histSymbol, period || '1y')
        return NextResponse.json({ success: true, data: historical })

      case 'search':
        const query = searchParams.get('query')
        if (!query) {
          return NextResponse.json(
            { success: false, error: 'Query parameter required' },
            { status: 400 }
          )
        }
        const searchResults = await yahooFinanceService.searchStocks(query)
        return NextResponse.json({ success: true, data: searchResults })

      case 'portfolio':
        const holdingsParam = searchParams.get('holdings')
        if (!holdingsParam) {
          return NextResponse.json(
            { success: false, error: 'Holdings parameter required' },
            { status: 400 }
          )
        }

        try {
          const holdings = JSON.parse(decodeURIComponent(holdingsParam))
          const performance = await yahooFinanceService.calculatePortfolioPerformance(holdings)
          return NextResponse.json({ success: true, data: performance })
        } catch (parseError) {
          return NextResponse.json(
            { success: false, error: 'Invalid holdings format' },
            { status: 400 }
          )
        }

      default:
        return NextResponse.json(
          {
            success: false,
            error:
              'Invalid action. Available: overview, quote, quotes, historical, search, portfolio'
          },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Market data API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
