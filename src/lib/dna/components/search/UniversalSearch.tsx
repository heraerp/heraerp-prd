'use client'

// ================================================================================
// HERA DNA UNIVERSAL SEARCH
// Smart Code: HERA.UI.SEARCH.UNIVERSAL.ENGINE.V1
// AI-powered global search with command palette interface
// ================================================================================

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import {
  Search,
  X,
  Clock,
  TrendingUp,
  Zap,
  FileText,
  Users,
  Package,
  CreditCard,
  Calendar,
  Mic,
  Command as CommandIcon,
  ChevronRight,
  Sparkles,
  Database,
  Globe,
  Building2,
  ShoppingCart,
  Heart,
  Scissors,
  UtensilsCrossed,
  Factory
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import { useDebounce } from '@/hooks/use-debounce'

// ================================================================================
// TYPES AND INTERFACES
// ================================================================================

export interface SearchResult {
  id: string
  type: 'entity' | 'transaction' | 'report' | 'action' | 'help'
  category: string
  title: string
  subtitle?: string
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  url?: string
  action?: () => void | Promise<void>
  metadata?: Record<string, any>
  score?: number
  smartCode?: string
}

export interface SearchScope {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  enabled: boolean
}

export interface UniversalSearchProps {
  // Core configuration
  placeholder?: string
  scopes?: SearchScope[]

  // Features
  aiSuggestions?: boolean
  recentSearches?: boolean
  popularSearches?: boolean
  voiceSearch?: boolean
  commandPalette?: boolean

  // Data source
  searchEndpoint?: string
  staticResults?: SearchResult[]

  // Behavior
  debounceMs?: number
  maxResults?: number
  minQueryLength?: number

  // Callbacks
  onSelect: (result: SearchResult) => void
  onSearch?: (query: string) => void

  // Customization
  className?: string
  theme?: 'default' | 'minimal' | 'command'
  position?: 'center' | 'top'
}

// ================================================================================
// DEFAULT DATA
// ================================================================================

const defaultScopes: SearchScope[] = [
  { id: 'entities', label: 'Entities', icon: Database, enabled: true },
  { id: 'transactions', label: 'Transactions', icon: CreditCard, enabled: true },
  { id: 'reports', label: 'Reports', icon: FileText, enabled: true },
  { id: 'actions', label: 'Actions', icon: Zap, enabled: true },
  { id: 'help', label: 'Help', icon: Heart, enabled: true }
]

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  customer: Users,
  vendor: Building2,
  product: Package,
  employee: Users,
  sale: ShoppingCart,
  purchase: CreditCard,
  payment: CreditCard,
  appointment: Calendar,
  report: FileText,
  action: Zap,
  help: Heart
}

const industryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  salon: Scissors,
  restaurant: UtensilsCrossed,
  healthcare: Heart,
  retail: ShoppingCart,
  manufacturing: Factory,
  general: Globe
}

// Mock recent searches - in real app, from localStorage/API
const mockRecentSearches: SearchResult[] = [
  {
    id: 'recent-1',
    type: 'entity',
    category: 'customer',
    title: 'John Smith',
    subtitle: 'Last visited 2 days ago',
    url: '/customers/john-smith'
  },
  {
    id: 'recent-2',
    type: 'transaction',
    category: 'sale',
    title: 'Order #12345',
    subtitle: '$450.00 - Yesterday',
    url: '/transactions/12345'
  }
]

// Mock popular searches - in real app, from analytics
const mockPopularSearches: SearchResult[] = [
  {
    id: 'popular-1',
    type: 'report',
    category: 'report',
    title: 'Daily Sales Report',
    subtitle: 'Most viewed report',
    url: '/reports/daily-sales'
  },
  {
    id: 'popular-2',
    type: 'action',
    category: 'action',
    title: 'Create New Invoice',
    subtitle: 'Quick action',
    action: () => console.log('Create invoice')
  }
]

// ================================================================================
// SEARCH ENGINE
// ================================================================================

class SearchEngine {
  private staticResults: SearchResult[]

  constructor(staticResults: SearchResult[] = []) {
    this.staticResults = staticResults
  }

  async search(
    query: string,
    scopes: SearchScope[],
    maxResults: number = 20
  ): Promise<SearchResult[]> {
    if (!query || query.length < 2) return []

    const lowerQuery = query.toLowerCase()
    const enabledScopes = scopes.filter(s => s.enabled).map(s => s.id)

    // In real app, this would be an API call
    // For demo, we'll use fuzzy search on static data
    const results = this.staticResults
      .filter(result => {
        // Check scope
        if (!enabledScopes.includes(result.type)) return false

        // Fuzzy search on title, subtitle, description
        const searchableText = [result.title, result.subtitle, result.description]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()

        return searchableText.includes(lowerQuery)
      })
      .map(result => ({
        ...result,
        score: this.calculateScore(result, lowerQuery)
      }))
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, maxResults)

    return results
  }

  private calculateScore(result: SearchResult, query: string): number {
    let score = 0
    const lowerQuery = query.toLowerCase()
    const lowerTitle = result.title.toLowerCase()

    // Exact match
    if (lowerTitle === lowerQuery) score += 100

    // Starts with query
    if (lowerTitle.startsWith(lowerQuery)) score += 50

    // Contains query
    if (lowerTitle.includes(lowerQuery)) score += 25

    // Recent/popular boost
    if (result.metadata?.isRecent) score += 20
    if (result.metadata?.isPopular) score += 15

    return score
  }
}

// ================================================================================
// AI SUGGESTION ENGINE
// ================================================================================

const getAISuggestions = async (query: string): Promise<string[]> => {
  // In real app, this would call AI API
  // For demo, return intelligent suggestions based on query

  const suggestions: Record<string, string[]> = {
    revenue: ['Show revenue report', 'Compare revenue by month', 'Top revenue customers'],
    customer: ['Add new customer', 'View customer list', 'Customer payment history'],
    invoice: ['Create invoice', 'Pending invoices', 'Invoice template settings'],
    inventory: ['Low stock items', 'Inventory valuation', 'Stock movement report']
  }

  const lowerQuery = query.toLowerCase()

  for (const [key, values] of Object.entries(suggestions)) {
    if (lowerQuery.includes(key)) {
      return values
    }
  }

  return []
}

// ================================================================================
// SPEECH RECOGNITION TYPES
// ================================================================================

interface SpeechRecognitionResult {
  transcript: string
  confidence: number
}

interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: SpeechRecognitionResult
    }
  }
}

declare global {
  interface Window {
    webkitSpeechRecognition: any
    SpeechRecognition: any
  }
}

// ================================================================================
// MAIN COMPONENT
// ================================================================================

export function UniversalSearch({
  placeholder = 'Search anything... (⌘K)',
  scopes = defaultScopes,
  aiSuggestions = true,
  recentSearches = true,
  popularSearches = true,
  voiceSearch = true,
  commandPalette = true,
  searchEndpoint,
  staticResults = [],
  debounceMs = 300,
  maxResults = 20,
  minQueryLength = 2,
  onSelect,
  onSearch,
  className,
  theme = 'command',
  position = 'center'
}: UniversalSearchProps) {
  // State
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [aiSuggestedQueries, setAiSuggestedQueries] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isListening, setIsListening] = useState(false)

  // Refs
  const inputRef = useRef<HTMLInputElement>(null)
  const recognitionRef = useRef<any>(null)

  // Hooks
  const router = useRouter()
  const { toast } = useToast()
  const debouncedQuery = useDebounce(query, debounceMs)

  // Search engine
  const searchEngine = useMemo(() => new SearchEngine(staticResults), [staticResults])

  // Keyboard shortcut
  useEffect(() => {
    if (!commandPalette) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }

      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [commandPalette, isOpen])

  // Search effect
  useEffect(() => {
    const performSearch = async () => {
      if (debouncedQuery.length < minQueryLength) {
        setResults([])
        setAiSuggestedQueries([])
        return
      }

      setIsLoading(true)

      try {
        // Perform search
        const searchResults = await searchEngine.search(debouncedQuery, scopes, maxResults)

        setResults(searchResults)

        // Get AI suggestions
        if (aiSuggestions) {
          const suggestions = await getAISuggestions(debouncedQuery)
          setAiSuggestedQueries(suggestions)
        }

        // Call external search handler
        if (onSearch) {
          onSearch(debouncedQuery)
        }
      } catch (error) {
        console.error('Search error:', error)
        toast({
          title: 'Search Error',
          description: 'Failed to perform search',
          variant: 'destructive'
        })
      } finally {
        setIsLoading(false)
      }
    }

    performSearch()
  }, [
    debouncedQuery,
    searchEngine,
    scopes,
    maxResults,
    minQueryLength,
    aiSuggestions,
    onSearch,
    toast
  ])

  // Voice search
  const startVoiceSearch = useCallback(() => {
    if (!voiceSearch || typeof window === 'undefined') {
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

    if (!SpeechRecognition) {
      toast({
        title: 'Voice Search Unavailable',
        description: 'Your browser does not support voice search',
        variant: 'destructive'
      })
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setQuery(transcript)
      setIsListening(false)
    }

    recognition.onerror = () => {
      setIsListening(false)
      toast({
        title: 'Voice Search Error',
        description: 'Failed to recognize speech',
        variant: 'destructive'
      })
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
    recognitionRef.current = recognition
  }, [voiceSearch, toast])

  // Stop voice search
  const stopVoiceSearch = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [])

  // Handle selection
  const handleSelect = useCallback(
    (result: SearchResult) => {
      setIsOpen(false)
      setQuery('')

      // Save to recent searches (in real app)
      // localStorage.setItem('recentSearches', ...)

      if (result.url) {
        router.push(result.url)
      } else if (result.action) {
        result.action()
      }

      onSelect(result)
    },
    [router, onSelect]
  )

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const totalResults = allResults.reduce((sum, section) => sum + section.items.length, 0)

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev => (prev + 1) % Math.max(1, totalResults))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev => (prev - 1 + totalResults) % Math.max(1, totalResults))
          break
        case 'Enter':
          e.preventDefault()
          if (totalResults > 0) {
            let currentIndex = 0
            for (const section of allResults) {
              for (const item of section.items) {
                if (currentIndex === selectedIndex) {
                  handleSelect(item)
                  return
                }
                currentIndex++
              }
            }
          }
          break
      }
    },
    [selectedIndex, handleSelect]
  )

  // Get all results to display
  const allResults = useMemo(() => {
    const sections: Array<{
      title: string
      items: SearchResult[]
      icon: React.ComponentType<{ className?: string }>
    }> = []

    // Current search results
    if (results.length > 0) {
      sections.push({
        title: 'Results',
        items: results,
        icon: Search
      })
    }

    // AI suggestions
    if (aiSuggestedQueries.length > 0 && query.length >= minQueryLength) {
      sections.push({
        title: 'AI Suggestions',
        items: aiSuggestedQueries.map((suggestion, index) => ({
          id: `ai-${index}`,
          type: 'action' as const,
          category: 'action',
          title: suggestion,
          icon: Sparkles,
          action: () => setQuery(suggestion)
        })),
        icon: Sparkles
      })
    }

    // Show recent/popular when no query
    if (query.length < minQueryLength) {
      if (recentSearches && mockRecentSearches.length > 0) {
        sections.push({
          title: 'Recent',
          items: mockRecentSearches,
          icon: Clock
        })
      }

      if (popularSearches && mockPopularSearches.length > 0) {
        sections.push({
          title: 'Popular',
          items: mockPopularSearches,
          icon: TrendingUp
        })
      }
    }

    return sections
  }, [results, aiSuggestedQueries, query, minQueryLength, recentSearches, popularSearches])

  // Render search result item
  const renderSearchItem = (result: SearchResult, index: number) => {
    const Icon = result.icon || categoryIcons[result.category] || FileText
    const isSelected = index === selectedIndex

    return (
      <div
        key={result.id}
        onClick={() => handleSelect(result)}
        className={cn(
          'flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors',
          'hover:bg-accent hover:text-accent-foreground',
          isSelected && 'bg-accent text-accent-foreground'
        )}
      >
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center',
            'bg-primary/10 text-primary'
          )}
        >
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{result.title}</p>
            {result.smartCode && (
              <Badge variant="outline" className="text-xs font-mono">
                {result.smartCode}
              </Badge>
            )}
          </div>
          {result.subtitle && (
            <p className="text-sm text-muted-foreground truncate">{result.subtitle}</p>
          )}
        </div>

        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      {/* Trigger Button/Input */}
      <div className={className}>
        <div
          onClick={() => setIsOpen(true)}
          className={cn(
            'relative flex items-center w-full cursor-text',
            theme === 'minimal' && 'border rounded-md px-3 py-2',
            theme === 'default' && 'border rounded-lg px-4 py-2.5 shadow-sm',
            theme === 'command' && 'border rounded-lg px-4 py-2.5 bg-muted/50'
          )}
        >
          <Search className="w-4 h-4 text-muted-foreground mr-2" />
          <span className="flex-1 text-sm text-muted-foreground">{placeholder}</span>
          {commandPalette && (
            <div className="flex items-center gap-1">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                <CommandIcon className="w-3 h-3" />K
              </kbd>
            </div>
          )}
        </div>
      </div>

      {/* Search Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className={cn('max-w-2xl p-0 gap-0', position === 'top' && 'top-[20%] translate-y-0')}
        >
          <div className="rounded-lg border shadow-lg">
            {/* Search Input */}
            <div className="flex items-center border-b px-3">
              <Search className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
              <Input
                ref={inputRef}
                placeholder={placeholder}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex h-12 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 focus-visible:ring-0"
                autoFocus
              />

              {/* Voice Search Button */}
              {voiceSearch && (
                <button
                  onClick={isListening ? stopVoiceSearch : startVoiceSearch}
                  className={cn(
                    'p-2 rounded-md transition-colors',
                    isListening
                      ? 'bg-destructive text-destructive-foreground animate-pulse'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}

              {/* Clear Button */}
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="p-2 rounded-md hover:bg-accent hover:text-accent-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Scope Filters */}
            {scopes.length > 1 && (
              <div className="flex items-center gap-2 p-3 border-b">
                {scopes.map(scope => {
                  const Icon = scope.icon || Zap
                  return (
                    <Badge
                      key={scope.id}
                      variant={scope.enabled ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        // Toggle scope - in real app, update state
                        console.log('Toggle scope:', scope.id)
                      }}
                    >
                      <Icon className="w-3 h-3 mr-1" />
                      {scope.label}
                    </Badge>
                  )
                })}
              </div>
            )}

            {/* Results */}
            <ScrollArea className="max-h-[400px] p-2">
              {isLoading && (
                <div className="p-8 space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-4">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div className="space-y-2 flex-1">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!isLoading && allResults.length === 0 && query.length >= minQueryLength && (
                <div className="p-8 text-center">
                  <p className="text-sm text-muted-foreground">No results found for "{query}"</p>
                  <p className="text-xs text-muted-foreground mt-2">Try a different search term</p>
                </div>
              )}

              {!isLoading &&
                allResults.map((section, sectionIndex) => {
                  let currentIndex = 0

                  return (
                    <div key={sectionIndex} className="mb-4">
                      <div className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground">
                        <section.icon className="w-3 h-3" />
                        {section.title}
                      </div>
                      <div>
                        {section.items.map(item => {
                          const itemIndex = currentIndex++
                          return renderSearchItem(item, itemIndex)
                        })}
                      </div>
                    </div>
                  )
                })}

              {!isLoading && query.length < minQueryLength && allResults.length === 0 && (
                <div className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto flex items-center justify-center">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium">Start typing to search</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Search across entities, transactions, reports and more
                    </p>
                  </div>
                </div>
              )}
            </ScrollArea>

            {/* Footer */}
            <div className="border-t p-2">
              <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">↑↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">↵</kbd>
                    Select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px]">esc</kbd>
                    Close
                  </span>
                </div>
                {aiSuggestions && (
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    AI-powered
                  </span>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

// ================================================================================
// EXPORTS
// ================================================================================

export default UniversalSearch

// Type exports for external use
export type { SearchResult, SearchScope, UniversalSearchProps }
