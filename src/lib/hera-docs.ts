import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

// Types for HERA documentation system
export interface DocPage {
  id: string
  title: string
  slug: string
  content: string
  description?: string
  author?: string
  createdAt: string
  updatedAt: string
  readingTime?: number
  breadcrumb: Array<{ title: string; href: string }>
  tableOfContents?: Array<{ id: string; title: string; level: number }>
  nextPage?: { title: string; slug: string }
  prevPage?: { title: string; slug: string }
  editUrl?: string
  section?: string
}

export interface DocNavigation {
  id: string
  title: string
  slug: string
  section?: string
  children?: DocNavigation[]
  order?: number
}

export interface SearchResult {
  id: string
  title: string
  slug: string
  docType: 'dev' | 'user'
  excerpt: string
  section?: string
}

// HERA API base configuration
const HERA_API_BASE = '/api/v1'

/**
 * Fetch a documentation page from HERA system
 */
export async function getDocPage(slug: string, docType: 'dev' | 'user'): Promise<DocPage | null> {
  // Return mock data during build time or when API is not available
  if (typeof window === 'undefined') {
    return null
  }
  
  try {
    // Query HERA entities for the documentation page
    const response = await fetch(`${HERA_API_BASE}/entities/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entity_type: 'doc_page',
        filters: {
          entity_code: slug,
          metadata: { doc_type: docType }
        },
        include_dynamic_data: true,
        include_relationships: true
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch page: ${response.statusText}`)
    }

    const data = await response.json()
    if (!data.entities || data.entities.length === 0) {
      return null
    }

    const entity = data.entities[0]
    const dynamicData = entity.dynamic_data || []
    
    // Extract content and metadata from dynamic data
    const contentField = dynamicData.find((field: any) => field.field_name === 'content')
    const descriptionField = dynamicData.find((field: any) => field.field_name === 'description')
    const authorField = dynamicData.find((field: any) => field.field_name === 'author')
    const sectionField = dynamicData.find((field: any) => field.field_name === 'section')

    // Convert markdown content to HTML
    const rawContent = contentField?.field_value || ''
    const htmlContent = await markdownToHtml(rawContent)
    
    // Calculate reading time (rough estimate: 200 words per minute)
    const wordCount = rawContent.split(/\s+/).length
    const readingTime = Math.ceil(wordCount / 200)

    // Generate breadcrumb from relationships
    const breadcrumb = await generateBreadcrumb(entity.id, docType)

    // Get navigation context (prev/next)
    const navContext = await getNavigationContext(entity.id, docType)

    return {
      id: entity.id,
      title: entity.entity_name,
      slug: entity.entity_code,
      content: htmlContent,
      description: descriptionField?.field_value,
      author: authorField?.field_value,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
      readingTime,
      breadcrumb,
      nextPage: navContext.nextPage,
      prevPage: navContext.prevPage,
      editUrl: generateEditUrl(slug, docType),
      section: sectionField?.field_value
    }
  } catch (error) {
    console.error('Error fetching doc page:', error)
    return null
  }
}

/**
 * Get navigation structure for documentation
 */
export async function getDocNavigation(docType: 'dev' | 'user'): Promise<DocNavigation[]> {
  // Return default navigation during build time or when API is not available
  if (typeof window === 'undefined') {
    return generateDefaultNavigation(docType)
  }
  
  try {
    // Fetch all documentation pages for the type
    const pagesResponse = await fetch(`${HERA_API_BASE}/entities/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entity_type: 'doc_page',
        filters: {
          metadata: { doc_type: docType, status: 'published' }
        },
        include_dynamic_data: true,
        sort: [{ field: 'metadata.order', direction: 'asc' }]
      })
    })

    if (!pagesResponse.ok) {
      throw new Error(`Failed to fetch navigation: ${pagesResponse.statusText}`)
    }

    const pagesData = await pagesResponse.json()
    const pages = pagesData.entities || []

    // Fetch navigation relationships
    const relationshipsResponse = await fetch(`${HERA_API_BASE}/relationships/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        relationship_type: 'navigation_parent',
        include_entities: true
      })
    })

    const relationshipsData = relationshipsResponse.ok 
      ? await relationshipsResponse.json()
      : { relationships: [] }

    // Build navigation tree
    return buildNavigationTree(pages, relationshipsData.relationships || [])
  } catch (error) {
    console.error('Error fetching navigation:', error)
    return generateDefaultNavigation(docType)
  }
}

/**
 * Search documentation content
 */
export async function searchDocs(
  query: string, 
  docType?: 'dev' | 'user'
): Promise<SearchResult[]> {
  try {
    const searchBody: any = {
      query,
      entity_types: ['doc_page'],
      include_dynamic_data: true,
      limit: 20
    }

    if (docType) {
      searchBody.filters = {
        metadata: { doc_type: docType, status: 'published' }
      }
    }

    const response = await fetch(`${HERA_API_BASE}/universal/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(searchBody)
    })

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`)
    }

    const data = await response.json()
    const results = data.results || []

    return results.map((result: any) => {
      const dynamicData = result.dynamic_data || []
      const contentField = dynamicData.find((field: any) => field.field_name === 'content')
      const sectionField = dynamicData.find((field: any) => field.field_name === 'section')
      const docTypeField = dynamicData.find((field: any) => field.field_name === 'doc_type')

      // Generate excerpt from content
      const content = contentField?.field_value || ''
      const excerpt = generateExcerpt(content, query)

      return {
        id: result.id,
        title: result.entity_name,
        slug: result.entity_code,
        docType: docTypeField?.field_value || 'dev',
        excerpt,
        section: sectionField?.field_value
      }
    })
  } catch (error) {
    console.error('Error searching docs:', error)
    return []
  }
}

/**
 * Track documentation page view
 */
export async function trackDocView(
  pageId: string, 
  docType: 'dev' | 'user',
  metadata?: Record<string, any>
): Promise<void> {
  try {
    await fetch(`${HERA_API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transaction_type: 'doc_page_view',
        description: `Documentation page viewed: ${pageId}`,
        transaction_data: {
          page_id: pageId,
          doc_type: docType,
          ...metadata
        },
        transaction_lines: [{
          line_type: 'page_view',
          entity_id: pageId,
          quantity: 1,
          line_data: metadata
        }]
      })
    })
  } catch (error) {
    console.error('Error tracking page view:', error)
    // Don't throw - analytics shouldn't break the page
  }
}

// Helper functions

/**
 * Convert markdown to HTML with syntax highlighting
 */
async function markdownToHtml(markdown: string): Promise<string> {
  // Configure marked for better HTML output
  marked.setOptions({
    gfm: true,
    breaks: false
  })

  const html = await marked(markdown)
  
  // Sanitize HTML to prevent XSS
  return DOMPurify.sanitize(html as string, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'br', 'strong', 'em', 'u', 's',
      'a', 'img', 'ul', 'ol', 'li',
      'blockquote', 'code', 'pre',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'div', 'span'
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'id', 'class', 'target', 'rel']
  })
}

/**
 * Generate breadcrumb navigation from relationships
 */
async function generateBreadcrumb(
  pageId: string, 
  docType: 'dev' | 'user'
): Promise<Array<{ title: string; href: string }>> {
  try {
    // This would query the relationships to build proper breadcrumbs
    // For now, return a basic breadcrumb
    return []
  } catch (error) {
    console.error('Error generating breadcrumb:', error)
    return []
  }
}

/**
 * Get previous and next page context
 */
async function getNavigationContext(
  pageId: string, 
  docType: 'dev' | 'user'
): Promise<{ nextPage?: { title: string; slug: string }; prevPage?: { title: string; slug: string } }> {
  try {
    // This would query relationships to find adjacent pages in the navigation structure
    // For now, return empty context
    return {}
  } catch (error) {
    console.error('Error getting navigation context:', error)
    return {}
  }
}

/**
 * Build navigation tree from pages and relationships
 */
function buildNavigationTree(pages: any[], relationships: any[]): DocNavigation[] {
  // Create a map of page entities
  const pageMap = new Map(pages.map(page => [page.id, page]))
  
  // Find root pages (pages without parent relationships)
  const rootPages = pages.filter(page => 
    !relationships.some(rel => rel.target_entity_id === page.id)
  )

  // Build tree recursively
  function buildChildren(parentId: string): DocNavigation[] {
    return relationships
      .filter(rel => rel.source_entity_id === parentId)
      .sort((a, b) => (a.relationship_data?.nav_order || 0) - (b.relationship_data?.nav_order || 0))
      .map(rel => {
        const page = pageMap.get(rel.target_entity_id)
        if (!page) return null

        const children = buildChildren(page.id)
        const sectionField = page.dynamic_data?.find((field: any) => field.field_name === 'section')

        return {
          id: page.id,
          title: page.entity_name,
          slug: page.entity_code,
          section: sectionField?.field_value,
          children: children.length > 0 ? children : undefined,
          order: rel.relationship_data?.nav_order || 0
        }
      })
      .filter(Boolean) as DocNavigation[]
  }

  // Build navigation for root pages
  return rootPages
    .sort((a, b) => {
      const aOrder = a.dynamic_data?.find((field: any) => field.field_name === 'order')?.field_value || 0
      const bOrder = b.dynamic_data?.find((field: any) => field.field_name === 'order')?.field_value || 0
      return aOrder - bOrder
    })
    .map(page => {
      const children = buildChildren(page.id)
      const sectionField = page.dynamic_data?.find((field: any) => field.field_name === 'section')

      return {
        id: page.id,
        title: page.entity_name,
        slug: page.entity_code,
        section: sectionField?.field_value,
        children: children.length > 0 ? children : undefined
      }
    })
}

/**
 * Generate default navigation when API fails
 */
function generateDefaultNavigation(docType: 'dev' | 'user'): DocNavigation[] {
  if (docType === 'dev') {
    return [
      { id: '1', title: 'Getting Started', slug: 'getting-started' },
      { id: '2', title: 'Architecture Overview', slug: 'architecture/overview' },
      { id: '3', title: 'Database Development', slug: 'database/setup' },
      { id: '4', title: 'API Development', slug: 'api/development' },
      { id: '5', title: 'Component Development', slug: 'components/development' },
      { id: '6', title: 'Testing Guide', slug: 'testing/guide' },
      { id: '7', title: 'Deployment Guide', slug: 'deployment/guide' },
      { id: '8', title: 'Contributing', slug: 'contributing' }
    ]
  } else {
    return [
      { id: '1', title: 'Getting Started', slug: 'getting-started' },
      { id: '2', title: 'Dashboard Overview', slug: 'dashboard/overview' },
      { id: '3', title: 'Core Features', slug: 'features/core' },
      { id: '4', title: 'Account Management', slug: 'account/management' },
      { id: '5', title: 'Data Management', slug: 'data/management' },
      { id: '6', title: 'Troubleshooting', slug: 'troubleshooting' },
      { id: '7', title: 'FAQ', slug: 'faq' },
      { id: '8', title: 'Mobile Guide', slug: 'mobile/guide' }
    ]
  }
}

/**
 * Generate excerpt from content with search term highlighting
 */
function generateExcerpt(content: string, searchTerm: string, maxLength = 200): string {
  // Remove markdown formatting
  const plainText = content.replace(/[#*_`\[\]()]/g, '').trim()
  
  if (searchTerm) {
    // Find the first occurrence of the search term
    const termIndex = plainText.toLowerCase().indexOf(searchTerm.toLowerCase())
    if (termIndex !== -1) {
      // Extract text around the search term
      const start = Math.max(0, termIndex - 50)
      const end = Math.min(plainText.length, start + maxLength)
      let excerpt = plainText.substring(start, end)
      
      if (start > 0) excerpt = '...' + excerpt
      if (end < plainText.length) excerpt = excerpt + '...'
      
      return excerpt
    }
  }
  
  // Fallback to beginning of content
  return plainText.length > maxLength 
    ? plainText.substring(0, maxLength) + '...'
    : plainText
}

/**
 * Generate edit URL for documentation page
 */
function generateEditUrl(slug: string, docType: 'dev' | 'user'): string {
  // This would generate a URL to edit the documentation
  // Could link to a CMS, GitHub, or admin interface
  return `/admin/docs/${docType}/${slug}/edit`
}