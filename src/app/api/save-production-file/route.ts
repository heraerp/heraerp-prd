import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { content, originalPath, fileName } = await request.json()
    
    if (!content || !originalPath) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 })
    }

    // Extract the directory from the original progressive path
    // e.g., "salon-progressive/customers" -> "salon/customers"
    const productionPath = originalPath.replace('-progressive', '')
    
    // Construct the file path
    const baseDir = process.cwd()
    const dirPath = path.join(baseDir, 'src/app', path.dirname(productionPath))
    const filePath = path.join(dirPath, fileName || 'page.tsx')
    
    try {
      // Create directory if it doesn't exist
      await fs.mkdir(dirPath, { recursive: true })
      
      // Write the file
      await fs.writeFile(filePath, content, 'utf-8')
      
      return NextResponse.json({ 
        success: true, 
        filePath: filePath.replace(baseDir, ''),
        message: `File saved successfully to ${filePath.replace(baseDir, '')}`
      })
    } catch (error) {
      console.error('Error writing file:', error)
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to write file',
        details: error.message 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error in save-production-file:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}