import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const pagePath = searchParams.get('path')

    if (!pagePath) {
      return NextResponse.json({ success: false, error: 'No path provided' }, { status: 400 })
    }

    // Security: Only allow fetching from progressive pages
    if (!pagePath.includes('progressive')) {
      return NextResponse.json({ success: false, error: 'Invalid path' }, { status: 403 })
    }

    // Construct the file path
    const baseDir = process.cwd()
    const filePath = path.join(baseDir, 'src/app', pagePath, 'page.tsx')

    try {
      // Read the file content
      const content = await fs.readFile(filePath, 'utf-8')

      // Extract relevant demo data sections
      // Look for patterns like 'const initialCustomers =', 'const demoData =', etc.
      const demoDataPattern =
        /const\s+(initial\w+|demo\w+|sample\w+)\s*=\s*[\[\{][\s\S]*?[\]\}](?=\s*(?:const|let|var|function|export|$))/g
      const matches = content.match(demoDataPattern) || []

      // Also extract the full component for comprehensive analysis
      const fullContent = content

      return NextResponse.json({
        success: true,
        content: fullContent,
        demoDataSections: matches,
        filePath: pagePath
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Error reading file:', error)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to read page content',
          details: errorMessage
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in fetch-page-content:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}
