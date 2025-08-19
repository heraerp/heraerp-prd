import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const progressivePath = searchParams.get('path')
    
    if (!progressivePath) {
      return NextResponse.json({ success: false, error: 'No path provided' }, { status: 400 })
    }

    // Security: Only allow listing progressive directories
    if (!progressivePath.includes('progressive')) {
      return NextResponse.json({ success: false, error: 'Invalid path' }, { status: 403 })
    }

    // Construct the directory path
    const baseDir = process.cwd()
    const dirPath = path.join(baseDir, 'src/app', progressivePath)
    
    try {
      // Read the directory
      const entries = await fs.readdir(dirPath, { withFileTypes: true })
      
      // Find all subdirectories that contain page.tsx
      const pages = []
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const pagePath = path.join(dirPath, entry.name, 'page.tsx')
          try {
            await fs.access(pagePath)
            // Page exists, add to list
            pages.push({
              name: entry.name,
              path: `${progressivePath}/${entry.name}`,
              displayName: entry.name.charAt(0).toUpperCase() + entry.name.slice(1).replace(/-/g, ' ')
            })
          } catch {
            // No page.tsx in this directory, skip
          }
        }
      }
      
      // Also check if the main directory has a page.tsx
      try {
        const mainPagePath = path.join(dirPath, 'page.tsx')
        await fs.access(mainPagePath)
        pages.unshift({
          name: 'main',
          path: progressivePath,
          displayName: 'Main Dashboard'
        })
      } catch {
        // No main page
      }
      
      return NextResponse.json({ 
        success: true, 
        pages,
        basePath: progressivePath
      })
    } catch (error) {
      console.error('Error reading directory:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to read directory',
        details: error.message 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in list-progressive-pages:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}