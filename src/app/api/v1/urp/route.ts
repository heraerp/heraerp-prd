/**
 * Universal Report Pattern API
 * Smart Code: HERA.API.URP.ENDPOINT.v1
 * 
 * RESTful API for executing URP reports
 */

import { NextRequest, NextResponse } from 'next/server'
import { UniversalReportEngine } from '@/lib/dna/urp/report-engine'
import { universalApiAuth } from '@/lib/auth/universal-api-auth'

export async function POST(request: NextRequest) {
  try {
    // Authenticate request
    const authResult = await universalApiAuth(request)
    if (!authResult.authenticated || !authResult.organizationId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const {
      action,
      recipe,
      parameters = {},
      format = 'json',
      locale = 'en-US',
      currency = 'USD',
      useCache = true,
      refreshCache = false
    } = body
    
    // Initialize report engine
    const reportEngine = new UniversalReportEngine({
      organizationId: authResult.organizationId,
      smartCodePrefix: 'HERA.URP',
      enableCaching: true,
      enableMaterializedViews: false,
      cacheTTL: 300
    })
    
    switch (action) {
      case 'execute':
        // Execute a report recipe
        if (!recipe) {
          return NextResponse.json(
            { error: 'Recipe name is required' },
            { status: 400 }
          )
        }
        
        const result = await reportEngine.executeRecipe(
          recipe,
          parameters,
          {
            format,
            locale,
            currency,
            useCache,
            refreshCache
          }
        )
        
        return NextResponse.json({
          success: true,
          recipe,
          data: result,
          timestamp: new Date().toISOString()
        })
        
      case 'list':
        // List available recipes
        const recipes = reportEngine.getAvailableRecipes()
        
        return NextResponse.json({
          success: true,
          recipes: recipes.map(r => ({
            name: r.name,
            description: r.description,
            category: r.category,
            parameters: r.parameters,
            smartCode: r.smartCode
          })),
          total: recipes.length
        })
        
      case 'clearCache':
        // Clear cache for specific recipe or all
        await reportEngine.clearCache(body.recipeName)
        
        return NextResponse.json({
          success: true,
          message: body.recipeName
            ? `Cache cleared for recipe: ${body.recipeName}`
            : 'All cache cleared'
        })
        
      case 'primitive':
        // Direct primitive access for advanced users
        const { primitive, config } = body
        
        let primitiveResult: any
        
        switch (primitive) {
          case 'entityResolver':
            primitiveResult = await reportEngine.entityResolver.resolve(config)
            break
            
          case 'transactionFacts':
            primitiveResult = await reportEngine.transactionFacts.aggregate(config)
            break
            
          case 'hierarchyBuilder':
            primitiveResult = await reportEngine.hierarchyBuilder.build(config)
            break
            
          case 'dynamicJoin':
            primitiveResult = await reportEngine.dynamicJoin.join(config)
            break
            
          case 'rollupBalance':
            primitiveResult = reportEngine.rollupBalance.calculate(config)
            break
            
          case 'presentationFormatter':
            primitiveResult = reportEngine.presentationFormatter.format(config)
            break
            
          default:
            return NextResponse.json(
              { error: `Unknown primitive: ${primitive}` },
              { status: 400 }
            )
        }
        
        return NextResponse.json({
          success: true,
          primitive,
          data: primitiveResult
        })
        
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
    
  } catch (error: any) {
    console.error('URP API Error:', error)
    
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error.message
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Simple health check and API info
  return NextResponse.json({
    name: 'Universal Report Pattern API',
    version: '1.0.0',
    smartCode: 'HERA.API.URP.ENDPOINT.v1',
    status: 'operational',
    endpoints: {
      execute: 'Execute a report recipe',
      list: 'List available recipes',
      clearCache: 'Clear report cache',
      primitive: 'Direct primitive access'
    }
  })
}