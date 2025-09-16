// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { Suspense } from 'react'
import { searchDocs } from '@/src/lib/hera-docs'
import { Search, FileText, Hash, Filter } from 'lucide-react'
import { Input } from '@/src/components/ui/input'
import { Button } from '@/src/components/ui/button'
import { Badge } from '@/src/components/ui/badge'
import Link from 'next/link'

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    type?: 'dev' | 'user'
    section?: string
  }>
}

async function SearchResults({
  query,
  docType,
  section
}: {
  query: string
  docType?: 'dev' | 'user'
  section?: string
}) {
  if (!query.trim()) {
    return (
      <div className="text-center py-12">
        <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Search Documentation</h2>
        <p className="text-muted-foreground">
          Enter a search term to find relevant documentation pages
        </p>
      </div>
    )
  }

  const results = await searchDocs(query, docType)

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Results Found</h2>
        <p className="text-muted-foreground mb-4">No documentation pages found for "{query}"</p>
        <div className="text-sm text-muted-foreground">
          <p className="font-medium mb-2">Search Tips:</p>
          <ul className="text-left inline-block space-y-1">
            <li>• Try different keywords</li>
            <li>• Use broader terms</li>
            <li>• Check spelling</li>
            <li>• Try removing filters</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Found {results.length} result{results.length !== 1 ? 's' : ''} for "{query}"
        </p>
        <div className="flex items-center gap-2">
          {docType && (
            <Badge variant="secondary" className="capitalize">
              {docType === 'dev' ? 'Developer' : 'User'} Guide
            </Badge>
          )}
          {section && <Badge variant="outline">{section}</Badge>}
        </div>
      </div>

      <div className="space-y-4">
        {results.map(result => (
          <div key={result.id} className="hera-card p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Link
                    href={`/docs/${result.docType}/${result.slug}`}
                    className="text-lg font-semibold text-hera-primary hover:underline"
                  >
                    {result.title}
                  </Link>
                  <Badge variant="secondary" className="text-xs">
                    {result.docType === 'dev' ? 'Dev' : 'User'}
                  </Badge>
                </div>

                {result.section && (
                  <div className="flex items-center gap-1 mb-2 text-sm text-muted-foreground">
                    <Hash className="w-3 h-3" />
                    {result.section}
                  </div>
                )}

                <p className="text-sm text-muted-foreground line-clamp-3">{result.excerpt}</p>

                <div className="mt-3">
                  <Link
                    href={`/docs/${result.docType}/${result.slug}`}
                    className="text-sm text-hera-primary hover:underline"
                  >
                    Read more →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function SearchFilters({
  searchParams
}: {
  searchParams: { q?: string; type?: 'dev' | 'user'; section?: string }
}) {
  const currentType = searchParams.type
  const currentQuery = searchParams.q || ''

  const buildUrl = (params: Record<string, string | undefined>) => {
    const url = new URL('/docs/search', 'http://localhost')
    Object.entries({ ...searchParams, ...params }).forEach(([key, value]) => {
      if (value) url.searchParams.set(key, value)
    })
    return url.pathname + url.search
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-6">
      <Filter className="w-4 h-4 text-muted-foreground" />
      <span className="text-sm font-medium">Filter by:</span>

      <Link
        href={buildUrl({ type: undefined })}
        className={`px-3 py-1 text-sm rounded-full border transition-colors ${
          !currentType
            ? 'bg-hera-primary text-foreground border-hera-primary'
            : 'bg-background hover:bg-accent border-border'
        }`}
      >
        All Docs
      </Link>

      <Link
        href={buildUrl({ type: 'dev' })}
        className={`px-3 py-1 text-sm rounded-full border transition-colors ${
          currentType === 'dev'
            ? 'bg-hera-primary text-foreground border-hera-primary'
            : 'bg-background hover:bg-accent border-border'
        }`}
      >
        Developer
      </Link>

      <Link
        href={buildUrl({ type: 'user' })}
        className={`px-3 py-1 text-sm rounded-full border transition-colors ${
          currentType === 'user'
            ? 'bg-hera-primary text-foreground border-hera-primary'
            : 'bg-background hover:bg-accent border-border'
        }`}
      >
        User Guide
      </Link>
    </div>
  )
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const resolvedParams = await searchParams
  const query = resolvedParams.q || ''
  const docType = resolvedParams.type
  const section = resolvedParams.section

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Search Documentation</h1>

          {/* Search Form */}
          <form action="/docs/search" method="GET" className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                type="text"
                placeholder="Search documentation..."
                defaultValue={query}
                className="pl-10 text-base h-12"
                autoFocus
              />
              {docType && <input type="hidden" name="type" value={docType} />}
            </div>
            <div className="mt-3 flex gap-2">
              <Button type="submit" className="hera-button">
                Search
              </Button>
              {query && (
                <Button asChild variant="outline">
                  <Link href="/docs/search">Clear</Link>
                </Button>
              )}
            </div>
          </form>

          <SearchFilters searchParams={resolvedParams} />
        </div>

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Search className="w-8 h-8 mx-auto text-muted-foreground mb-2 animate-pulse" />
                <p className="text-muted-foreground">Searching...</p>
              </div>
            </div>
          }
        >
          <SearchResults query={query} docType={docType} section={section} />
        </Suspense>

        {/* Popular Searches */}
        {!query && (
          <div className="mt-12 pt-8 border-t">
            <h3 className="text-lg font-semibold mb-4">Popular Searches</h3>
            <div className="flex flex-wrap gap-2">
              {[
                'getting started',
                'api development',
                'database setup',
                'authentication',
                'components',
                'testing',
                'deployment',
                'troubleshooting'
              ].map(term => (
                <Link
                  key={term}
                  href={`/docs/search?q=${encodeURIComponent(term)}`}
                  className="px-3 py-1 text-sm bg-muted hover:bg-accent rounded-full transition-colors"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
