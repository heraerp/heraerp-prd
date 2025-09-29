import { NextRequest, NextResponse } from 'next/server'
import { searchIndex, extractDocumentSections, type SearchResult } from '@/lib/search/search-index'
import fs from 'fs'
import path from 'path'

// Initialize search index on first load
let isInitialized = false

async function initializeSearchIndex() {
  if (isInitialized) return

  try {
    await searchIndex.initialize()
    
    // Load all documentation files
    const docsPath = path.join(process.cwd(), 'docs', 'civicflow')
    const files = fs.readdirSync(docsPath)
      .filter(file => file.endsWith('.md'))
    
    for (const file of files) {
      const filePath = path.join(docsPath, file)
      const content = fs.readFileSync(filePath, 'utf8')
      const docPath = `/docs/civicflow/${file.replace('.md', '')}`
      const category = getCategoryFromFile(file)
      
      const sections = extractDocumentSections(content, docPath, category)
      await searchIndex.addDocuments(sections)
    }
    
    isInitialized = true
  } catch (error) {
    console.error('Failed to initialize search index:', error)
  }
}

function getCategoryFromFile(filename: string): string {
  const categoryMap: Record<string, string> = {
    'getting-started.md': 'Getting Started',
    'dashboard-navigation.md': 'Navigation',
    'crm-constituents.md': 'CRM',
    'crm-organizations.md': 'CRM',
    'case-management.md': 'CRM',
    'programs-grants.md': 'Programs',
    'communications.md': 'Communications',
    'automation.md': 'Automation',
    'ai-features.md': 'AI',
    'administration.md': 'Administration',
    'support.md': 'Support',
  }
  
  return categoryMap[filename] || 'General'
}

export async function GET(request: NextRequest) {
  await initializeSearchIndex()
  
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  const action = searchParams.get('action') || 'search'
  const limit = parseInt(searchParams.get('limit') || '10')
  
  try {
    switch (action) {
      case 'search':
        if (!query) {
          return NextResponse.json({ results: [] })
        }
        
        const results = await searchIndex.search(query, { limit })
        return NextResponse.json({ results })
      
      case 'suggestions':
        if (!query) {
          return NextResponse.json({ suggestions: [] })
        }
        
        const suggestions = await searchIndex.getSuggestions(query, limit)
        return NextResponse.json({ suggestions })
      
      case 'popular':
        const popular = searchIndex.getPopularSearches(limit)
        return NextResponse.json({ popular })
      
      case 'recent':
        const userId = searchParams.get('userId') || undefined
        const recent = searchIndex.getRecentSearches(limit, userId)
        return NextResponse.json({ recent })
      
      case 'analytics':
        const analytics = searchIndex.exportAnalytics()
        return NextResponse.json({ analytics })
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { action, searchId, selectedPath } = body
  
  try {
    switch (action) {
      case 'track-selection':
        if (!searchId || !selectedPath) {
          return NextResponse.json(
            { error: 'Missing searchId or selectedPath' },
            { status: 400 }
          )
        }
        
        searchIndex.trackSearchSelection(searchId, selectedPath)
        return NextResponse.json({ success: true })
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Search tracking error:', error)
    return NextResponse.json(
      { error: 'Tracking failed' },
      { status: 500 }
    )
  }
}