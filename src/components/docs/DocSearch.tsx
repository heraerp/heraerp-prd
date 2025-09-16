'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, FileText, Hash } from 'lucide-react'
import { Input } from '@/src/components/ui/input'
import { Button } from '@/src/components/ui/button'
import { cn } from '@/src/lib/utils'
import { searchDocs } from '@/src/lib/hera-docs'

interface SearchResult {
  id: string
  title: string
  slug: string
  docType: 'dev' | 'user'
  excerpt: string
  section?: string
}

interface DocSearchProps {
  docType?: 'dev' | 'user'
}

export default function DocSearch({ docType }: DocSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)

  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  // Search functionality
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setIsOpen(false)
      return
    }

    const searchTimeout = setTimeout(async () => {
      setIsLoading(true)
      try {
        const searchResults = await searchDocs(query, docType)
        setResults(searchResults)
        setIsOpen(true)
        setSelectedIndex(-1)
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query, docType])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(Math.min(selectedIndex + 1, results.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(Math.max(selectedIndex - 1, -1))
          break
        case 'Enter':
          e.preventDefault()
          if (selectedIndex >= 0 && results[selectedIndex]) {
            handleSelectResult(results[selectedIndex])
          }
          break
        case 'Escape':
          setIsOpen(false)
          setSelectedIndex(-1)
          inputRef.current?.blur()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, results])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectResult = (result: SearchResult) => {
    router.push(`/docs/${result.docType}/${result.slug}`)
    setIsOpen(false)
    setQuery('')
    setSelectedIndex(-1)
    inputRef.current?.blur()
  }

  const clearSearch = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  const highlightText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text

    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-hera-primary/20 text-hera-primary">
          {part}
        </mark>
      ) : (
        part
      )
    )
  }

  return (
    <div ref={searchRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={`Search ${docType === 'dev' ? 'developer' : docType === 'user' ? 'user' : ''} docs...`}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => query && setIsOpen(true)}
          className="pl-8 pr-8"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-1 top-1 h-6 w-6 p-0 hover:bg-transparent"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full z-50 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Searching...</div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleSelectResult(result)}
                  className={cn(
                    'w-full px-4 py-3 text-left hover:bg-accent transition-colors',
                    selectedIndex === index && 'bg-accent'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="font-medium text-sm truncate">
                          {highlightText(result.title, query)}
                        </div>
                        <div className="text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                          {result.docType}
                        </div>
                      </div>

                      {result.section && (
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Hash className="h-3 w-3" />
                          {result.section}
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {highlightText(result.excerpt, query)}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No results found for "{query}"
            </div>
          ) : null}

          {/* Search Tips */}
          {!isLoading && results.length === 0 && query && (
            <div className="border-t p-3">
              <div className="text-xs text-muted-foreground">
                <div className="font-medium mb-1">Search Tips:</div>
                <ul className="space-y-0.5">
                  <li>• Try different keywords</li>
                  <li>• Use broader terms</li>
                  <li>• Check spelling</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      <div className="sr-only">Use arrow keys to navigate, Enter to select, Escape to close</div>
    </div>
  )
}
