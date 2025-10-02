import { create, search as oramaSearch, insert, remove } from '@orama/orama'
import type { Results, SearchParams } from '@orama/orama'

export interface DocumentSection {
  id: string
  title: string
  content: string
  path: string
  section: string
  category: string
  keywords: string[]
  headings: string[]
}

export interface SearchResult {
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

export interface SearchAnalytics {
  query: string
  results: number
  timestamp: Date
  userId?: string
  selected?: string
}

class DocumentSearchIndex {
  private index: any = null
  private analytics: SearchAnalytics[] = []
  private popularSearches: Map<string, number> = new Map()

  async initialize() {
    this.index = await create({
      schema: {
        id: 'string',
        title: 'string',
        content: 'string',
        path: 'string',
        section: 'string',
        category: 'string',
        keywords: 'string[]',
        headings: 'string[]'
      } as const,
      components: {
        tokenizer: {
          stemming: true,
          stopWords: ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']
        }
      }
    })
  }

  async addDocument(doc: DocumentSection) {
    if (!this.index) await this.initialize()

    await insert(this.index, doc)
  }

  async addDocuments(docs: DocumentSection[]) {
    if (!this.index) await this.initialize()

    for (const doc of docs) {
      await insert(this.index, doc)
    }
  }

  async search(query: string, options: Partial<SearchParams> = {}): Promise<SearchResult[]> {
    if (!this.index) await this.initialize()

    // Track analytics
    this.trackSearch(query)

    // Perform search with fuzzy matching and boosting
    const searchParams: SearchParams = {
      term: query,
      properties: ['title', 'content', 'headings', 'keywords'],
      boost: {
        title: 2,
        headings: 1.5,
        keywords: 1.5,
        content: 1
      },
      tolerance: 1, // Allow fuzzy matching
      ...options
    }

    const results: Results<DocumentSection> = await oramaSearch(this.index, searchParams)

    // Track analytics with result count
    this.analytics[this.analytics.length - 1].results = results.hits.length

    // Transform results with highlights
    return results.hits.map(hit => ({
      id: hit.document.id,
      title: hit.document.title,
      content: this.truncateContent(hit.document.content, query),
      path: hit.document.path,
      section: hit.document.section,
      category: hit.document.category,
      score: hit.score,
      highlight: {
        title: this.highlightText(hit.document.title, query),
        content: this.highlightText(this.truncateContent(hit.document.content, query), query)
      }
    }))
  }

  async getSuggestions(query: string, limit: number = 5): Promise<string[]> {
    if (!this.index) await this.initialize()

    // Get search results
    const results = await this.search(query, { limit: limit * 2 })

    // Extract unique suggestions from titles and headings
    const suggestions = new Set<string>()

    results.forEach(result => {
      // Add title-based suggestions
      if (result.title.toLowerCase().includes(query.toLowerCase())) {
        suggestions.add(result.title)
      }

      // Add partial matches from content
      const words = query.toLowerCase().split(' ')
      const contentWords = result.content.toLowerCase().split(' ')

      contentWords.forEach((word, index) => {
        if (words.some(w => word.startsWith(w)) && index < contentWords.length - 1) {
          const phrase = contentWords.slice(index, index + 3).join(' ')
          if (phrase.length < 50) {
            suggestions.add(phrase)
          }
        }
      })
    })

    return Array.from(suggestions).slice(0, limit)
  }

  getPopularSearches(limit: number = 10): Array<{ query: string; count: number }> {
    return Array.from(this.popularSearches.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([query, count]) => ({ query, count }))
  }

  getRecentSearches(limit: number = 10, userId?: string): SearchAnalytics[] {
    const filtered = userId ? this.analytics.filter(a => a.userId === userId) : this.analytics

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()).slice(0, limit)
  }

  trackSearchSelection(searchId: string, selectedPath: string) {
    const search = this.analytics.find(a => a.timestamp.toISOString() === searchId)
    if (search) {
      search.selected = selectedPath
    }
  }

  private trackSearch(query: string, userId?: string) {
    // Update popular searches
    const normalizedQuery = query.toLowerCase().trim()
    this.popularSearches.set(normalizedQuery, (this.popularSearches.get(normalizedQuery) || 0) + 1)

    // Add to analytics
    this.analytics.push({
      query,
      results: 0,
      timestamp: new Date(),
      userId
    })

    // Limit analytics size
    if (this.analytics.length > 1000) {
      this.analytics = this.analytics.slice(-500)
    }
  }

  private truncateContent(content: string, query: string, maxLength: number = 200): string {
    const lowerContent = content.toLowerCase()
    const lowerQuery = query.toLowerCase()
    const index = lowerContent.indexOf(lowerQuery)

    if (index === -1) {
      return content.slice(0, maxLength) + '...'
    }

    const start = Math.max(0, index - 50)
    const end = Math.min(content.length, index + query.length + 150)

    let excerpt = content.slice(start, end)

    if (start > 0) excerpt = '...' + excerpt
    if (end < content.length) excerpt += '...'

    return excerpt
  }

  private highlightText(text: string, query: string): string {
    const words = query
      .toLowerCase()
      .split(' ')
      .filter(w => w.length > 2)
    let highlighted = text

    words.forEach(word => {
      const regex = new RegExp(`(${word})`, 'gi')
      highlighted = highlighted.replace(regex, '<mark>$1</mark>')
    })

    return highlighted
  }

  async clearIndex() {
    if (this.index) {
      this.index = null
      await this.initialize()
    }
  }

  exportAnalytics(): SearchAnalytics[] {
    return [...this.analytics]
  }
}

// Export singleton instance
export const searchIndex = new DocumentSearchIndex()

// Helper function to extract sections from markdown
export function extractDocumentSections(
  markdown: string,
  path: string,
  category: string
): DocumentSection[] {
  const sections: DocumentSection[] = []
  const lines = markdown.split('\n')

  let currentSection = ''
  let currentContent: string[] = []
  let currentHeadings: string[] = []
  let sectionIndex = 0

  // Extract title from first heading
  const titleMatch = markdown.match(/^#\s+(.+)$/m)
  const title = titleMatch ? titleMatch[1] : 'Untitled'

  // Extract all headings for keywords
  const headingMatches = markdown.matchAll(/^#{1,3}\s+(.+)$/gm)
  const allHeadings = Array.from(headingMatches).map(m => m[1])

  lines.forEach(line => {
    const headingMatch = line.match(/^##\s+(.+)$/)

    if (headingMatch) {
      // Save previous section if exists
      if (currentSection) {
        sections.push({
          id: `${path}#${sectionIndex}`,
          title: `${title} - ${currentSection}`,
          content: currentContent.join('\n').trim(),
          path,
          section: currentSection,
          category,
          keywords: extractKeywords(currentContent.join(' ')),
          headings: currentHeadings
        })
      }

      // Start new section
      currentSection = headingMatch[1]
      currentContent = []
      currentHeadings = [currentSection]
      sectionIndex++
    } else {
      currentContent.push(line)

      // Check for sub-headings
      const subHeadingMatch = line.match(/^###\s+(.+)$/)
      if (subHeadingMatch) {
        currentHeadings.push(subHeadingMatch[1])
      }
    }
  })

  // Don't forget the last section
  if (currentSection) {
    sections.push({
      id: `${path}#${sectionIndex}`,
      title: `${title} - ${currentSection}`,
      content: currentContent.join('\n').trim(),
      path,
      section: currentSection,
      category,
      keywords: extractKeywords(currentContent.join(' ')),
      headings: currentHeadings
    })
  }

  // Also add the full document as a section
  sections.push({
    id: path,
    title,
    content: markdown,
    path,
    section: 'Full Document',
    category,
    keywords: extractKeywords(markdown),
    headings: allHeadings
  })

  return sections
}

function extractKeywords(text: string): string[] {
  // Extract important words (this is a simple implementation)
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 4)

  // Count frequency
  const frequency = new Map<string, number>()
  words.forEach(word => {
    frequency.set(word, (frequency.get(word) || 0) + 1)
  })

  // Return top keywords
  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word)
}
