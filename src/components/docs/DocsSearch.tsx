'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { Search, FileText, Hash, TrendingUp, Clock, Sparkles } from 'lucide-react'
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

interface PopularSearch {
  query: string
  count: number
}

interface DocsSearchProps {
  className?: string
}

export function DocsSearch({ className }: DocsSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [popularSearches, setPopularSearches] = useState<PopularSearch[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()

  // Load popular searches on mount
  useEffect(() => {
    fetch('/api/docs/search?action=popular&limit=5')
      .then(res => res.json())
      .then(data => setPopularSearches(data.popular || []))
      .catch(console.error)
  }, [])

  // Search function using the API
  const searchDocs = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([])
      setSuggestions([])
      return
    }

    setIsLoading(true)

    try {
      // Fetch search results
      const searchResponse = await fetch(
        `/api/docs/search?q=${encodeURIComponent(searchQuery)}&limit=10`
      )
      const searchData = await searchResponse.json()
      setResults(searchData.results || [])

      // Fetch suggestions
      const suggestResponse = await fetch(
        `/api/docs/search?action=suggestions&q=${encodeURIComponent(searchQuery)}&limit=5`
      )
      const suggestData = await suggestResponse.json()
      setSuggestions(suggestData.suggestions || [])
      setShowSuggestions(true)
    } catch (error) {
      console.error('Search error:', error)
      setResults([])
      setSuggestions([])
    } finally {
      setIsLoading(false)
    }
  }

  // Handle search input with debouncing
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchDocs(query)
    }, 300)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [query])

  // Track search selection
  const trackSelection = async (result: SearchResult) => {
    try {
      await fetch('/api/docs/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'track-selection',
          searchId: new Date().toISOString(),
          selectedPath: result.path
        })
      })
    } catch (error) {
      console.error('Failed to track selection:', error)
    }
  }

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => (prev + 1) % results.length)
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
          break
        case 'Enter':
          e.preventDefault()
          if (results[selectedIndex]) {
            trackSelection(results[selectedIndex])
            router.push(results[selectedIndex].path)
            setIsOpen(false)
            setQuery('')
          }
          break
        case 'Escape':
          setIsOpen(false)
          inputRef.current?.blur()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, results, selectedIndex, router])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (resultsRef.current && !resultsRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Keyboard shortcut to focus search
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  return (
    <div className={cn('relative', className)} ref={resultsRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value)
            setIsOpen(true)
            setSelectedIndex(0)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search documentation... (⌘K)"
          className={cn(
            'w-full rounded-lg border border-gray-300 dark:border-gray-700',
            'bg-white dark:bg-gray-900 pl-10 pr-4 py-2',
            'text-sm text-gray-900 dark:text-gray-100',
            'placeholder-gray-500 dark:placeholder-gray-400',
            'focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400'
          )}
        />
      </div>

      {/* Search dropdown */}
      {isOpen && (query || popularSearches.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
          {/* Loading state */}
          {isLoading && (
            <div className="p-4 text-center text-sm text-slate-500 dark:text-slate-400">
              <div className="inline-flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600"></div>
                Searching...
              </div>
            </div>
          )}

          {/* Search results */}
          {!isLoading && results.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800">
                Search Results
              </div>
              <ul className="max-h-96 overflow-y-auto">
                {results.map((result, index) => (
                  <li key={result.id}>
                    <button
                      onClick={() => {
                        trackSelection(result)
                        router.push(result.path)
                        setIsOpen(false)
                        setQuery('')
                      }}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={cn(
                        'w-full px-4 py-3 text-left flex items-start gap-3',
                        'hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors',
                        selectedIndex === index && 'bg-slate-100 dark:bg-slate-800'
                      )}
                    >
                      {result.section === 'Full Document' ? (
                        <FileText className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Hash className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="font-medium text-slate-900 dark:text-slate-100"
                            dangerouslySetInnerHTML={{
                              __html: result.highlight?.title || result.title
                            }}
                          />
                          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {result.category}
                          </span>
                        </div>
                        <div
                          className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5"
                          dangerouslySetInnerHTML={{
                            __html: result.highlight?.content || result.content
                          }}
                        />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions */}
          {!isLoading && suggestions.length > 0 && results.length === 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800">
                <Sparkles className="inline-block h-3 w-3 mr-1" />
                Suggestions
              </div>
              <ul>
                {suggestions.map((suggestion, index) => (
                  <li key={suggestion}>
                    <button
                      onClick={() => {
                        setQuery(suggestion)
                        searchDocs(suggestion)
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                    >
                      {suggestion}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Popular searches when no query */}
          {!query && popularSearches.length > 0 && (
            <div>
              <div className="px-4 py-2 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800">
                <TrendingUp className="inline-block h-3 w-3 mr-1" />
                Popular Searches
              </div>
              <ul>
                {popularSearches.map(popular => (
                  <li key={popular.query}>
                    <button
                      onClick={() => {
                        setQuery(popular.query)
                        searchDocs(popular.query)
                      }}
                      className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-between"
                    >
                      <span className="text-slate-700 dark:text-slate-300">{popular.query}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {popular.count} searches
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* No results */}
          {!isLoading && query && results.length === 0 && suggestions.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                No results found for "<span className="font-semibold">{query}</span>"
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">
                Try searching with different keywords
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
