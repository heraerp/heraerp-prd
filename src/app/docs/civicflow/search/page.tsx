'use client'

import { useState, useEffect } from 'react'
import { Search, TrendingUp, Clock, FileText, Filter, X, BarChart } from 'lucide-react'
import { DocsLayout } from '@/components/docs/DocsLayout'
import { civicflowSidebar } from '@/lib/docs/civicflow-sidebar'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface SearchResult {
  id: string
  title: string
  content: string
  path: string
  section: string
  category: string
  score: number
  highlight?: {
    title?: string
    content?: string
  }
}

interface SearchFilters {
  categories: string[]
}

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [popularSearches, setPopularSearches] = useState<Array<{ query: string; count: number }>>([])
  const [recentSearches, setRecentSearches] = useState<Array<{ query: string; timestamp: Date }>>([])
  const [isSearching, setIsSearching] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({ categories: [] })
  const [availableCategories, setAvailableCategories] = useState<string[]>([])
  const [showAnalytics, setShowAnalytics] = useState(false)

  // Load popular and recent searches
  useEffect(() => {
    Promise.all([
      fetch('/api/docs/search?action=popular&limit=10').then(res => res.json()),
      fetch('/api/docs/search?action=recent&limit=10').then(res => res.json()),
    ]).then(([popularData, recentData]) => {
      setPopularSearches(popularData.popular || [])
      setRecentSearches(recentData.recent || [])
    })
  }, [])

  // Extract categories from results
  useEffect(() => {
    const categories = new Set<string>()
    results.forEach(result => categories.add(result.category))
    setAvailableCategories(Array.from(categories))
  }, [results])

  // Perform search
  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/docs/search?q=${encodeURIComponent(searchQuery)}&limit=50`)
      const data = await response.json()
      setResults(data.results || [])
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Filter results
  const filteredResults = results.filter(result => {
    if (filters.categories.length > 0 && !filters.categories.includes(result.category)) {
      return false
    }
    return true
  })

  // Toggle category filter
  const toggleCategory = (category: string) => {
    setFilters(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  const content = `
# Documentation Search

Search across all Civicflow documentation to find exactly what you need.

## Search Tips

- Use **keywords** for best results
- Put phrases in **"quotes"** for exact matches
- Filter by **category** to narrow results
- Check **popular searches** for common topics
  `

  const breadcrumbs = [
    { label: 'Documentation', href: '/docs/civicflow' },
    { label: 'Search', href: '/docs/civicflow/search' },
  ]

  return (
    <DocsLayout content={content} sidebar={civicflowSidebar} breadcrumbs={breadcrumbs}>
      <div className="max-w-4xl mx-auto">
        {/* Search Input */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
              placeholder="Search documentation..."
              className={cn(
                'w-full pl-12 pr-4 py-3 text-base',
                'bg-white dark:bg-slate-900',
                'border-2 border-slate-300 dark:border-slate-700',
                'rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                'placeholder:text-slate-500 dark:placeholder:text-slate-400'
              )}
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-12 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
              >
                <X className="h-4 w-4 text-slate-500" />
              </button>
            )}
            <button
              onClick={() => handleSearch(query)}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Search
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        {!query && !results.length && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Popular Searches */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Popular Searches
              </h3>
              <ul className="space-y-2">
                {popularSearches.slice(0, 5).map((popular) => (
                  <li key={popular.query}>
                    <button
                      onClick={() => {
                        setQuery(popular.query)
                        handleSearch(popular.query)
                      }}
                      className="w-full text-left px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center justify-between"
                    >
                      <span className="text-sm">{popular.query}</span>
                      <span className="text-xs text-slate-500">{popular.count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recent Searches */}
            <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-purple-600" />
                Recent Searches
              </h3>
              <ul className="space-y-2">
                {recentSearches.slice(0, 5).map((recent, index) => (
                  <li key={index}>
                    <button
                      onClick={() => {
                        setQuery(recent.query)
                        handleSearch(recent.query)
                      }}
                      className="w-full text-left px-3 py-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <span className="text-sm">{recent.query}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Search Results */}
        {(isSearching || results.length > 0) && (
          <div>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-semibold">
                  {isSearching ? 'Searching...' : `${filteredResults.length} results found`}
                </h2>
                {results.length > 0 && availableCategories.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-500" />
                    <span className="text-sm text-slate-600 dark:text-slate-400">Filter:</span>
                    {availableCategories.map(category => (
                      <button
                        key={category}
                        onClick={() => toggleCategory(category)}
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-medium transition-colors',
                          filters.categories.includes(category)
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        )}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowAnalytics(!showAnalytics)}
                className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
              >
                <BarChart className="h-4 w-4" />
                Analytics
              </button>
            </div>

            {/* Analytics Panel */}
            {showAnalytics && (
              <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <h3 className="font-semibold mb-2">Search Analytics</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Total Results</p>
                    <p className="text-2xl font-bold">{results.length}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Categories</p>
                    <p className="text-2xl font-bold">{availableCategories.length}</p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Avg. Score</p>
                    <p className="text-2xl font-bold">
                      {(results.reduce((sum, r) => sum + r.score, 0) / results.length).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Results List */}
            <div className="space-y-4">
              {filteredResults.map((result) => (
                <Link
                  key={result.id}
                  href={result.path}
                  className="block bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-4">
                    <FileText className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 
                          className="text-lg font-semibold text-slate-900 dark:text-slate-100"
                          dangerouslySetInnerHTML={{ __html: result.highlight?.title || result.title }}
                        />
                        <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {result.category}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                          Score: {result.score.toFixed(2)}
                        </span>
                      </div>
                      <p 
                        className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: result.highlight?.content || result.content }}
                      />
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        {result.section !== 'Full Document' && `${result.section} → `}{result.path}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </DocsLayout>
  )
}