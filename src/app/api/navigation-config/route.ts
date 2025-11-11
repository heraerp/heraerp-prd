/**
 * Navigation Configuration API Endpoint
 * Smart Code: HERA.API.NAVIGATION.CONFIG.v1
 * 
 * API endpoint for serving navigation configuration
 * Provides fallback when database service is unavailable
 */

import { NextRequest, NextResponse } from 'next/server'
import { loadNavigationConfig } from '@/services/NavigationService'
import navigationConfigJSON from '@/config/hera-navigation.json'

export async function GET(request: NextRequest) {
  try {
    // Try to load from database first
    const config = await loadNavigationConfig()
    
    return NextResponse.json(config, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600', // Cache for 5 minutes
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Error loading navigation config from database:', error)
    
    // Fallback to JSON file
    console.log('Falling back to JSON configuration file')
    
    return NextResponse.json(navigationConfigJSON, {
      headers: {
        'Cache-Control': 'public, s-maxage=60', // Shorter cache for fallback
        'Content-Type': 'application/json'
      }
    })
  }
}

export async function POST(request: NextRequest) {
  return NextResponse.json(
    { error: 'Method not allowed. Navigation config is read-only.' },
    { status: 405 }
  )
}