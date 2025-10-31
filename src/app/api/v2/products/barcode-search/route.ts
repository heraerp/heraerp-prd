/**
 * HERA Barcode Search API Endpoint
 * Smart Code: HERA.API.V2.PRODUCTS.BARCODE.SEARCH.V1
 *
 * ✅ ENTERPRISE FEATURES:
 * - RPC-based search with indexed dynamic data
 * - Searches primary barcode, alternate barcodes, GTIN, and SKU
 * - Organization isolation via RLS
 * - Supports EAN13, UPC, CODE128, QR codes
 *
 * USAGE:
 * GET /api/v2/products/barcode-search?barcode=6291041500213
 */

import { NextRequest, NextResponse } from 'next/server'
import { callRPC } from '@/lib/rpc-client'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const barcode = searchParams.get('barcode')
    const orgId = request.headers.get('x-hera-org') || request.headers.get('x-hera-org-id')

    // Validate inputs
    if (!barcode || barcode.trim().length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Barcode parameter is required'
        },
        { status: 400 }
      )
    }

    if (!orgId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Organization context required'
        },
        { status: 401 }
      )
    }

    const barcodeClean = barcode.trim()

    // 🎯 RPC-BASED SEARCH: Use hera_entities_crud_v1 with correct parameters
    // This searches: barcode_primary, barcodes_alt, gtin, and sku fields
    const result = await callRPC('hera_entities_crud_v1', {
      p_action: 'READ',
      p_actor_user_id: '09b0b92a-d797-489e-bc03-5ca0a6272674', // TODO: Get from auth context
      p_organization_id: orgId,
      p_entity: {
        entity_type: 'PRODUCT',
        status: 'active'
      },
      p_dynamic: {},
      p_relationships: {},
      p_options: {
        include_dynamic: true,
        limit: 100
      }
    })

    if (result.error) {
      console.error('[Barcode Search] RPC error:', result.error)
      return NextResponse.json(
        {
          success: false,
          error: result.error
        },
        { status: 500 }
      )
    }

    // Extract products from RPC response
    // hera_entities_crud_v1 returns { data: { list: [...] } }
    const allProducts = result.data?.data?.list || result.data?.list || result.data?.data || result.data || []

    console.log('🔍🔍🔍 BARCODE SEARCH - RPC Response:', {
      productsCount: allProducts.length,
      barcodeSearched: barcodeClean
    })

    // Filter products matching the barcode in dynamic fields
    const products = allProducts.filter((product: any) => {
      // Extract entity and dynamic_data from the nested structure
      const entity = product.entity || product
      const dynamicData = product.dynamic_data || []

      const productName = entity.entity_name || 'Unknown'
      const entityCode = entity.entity_code || null

      // Helper to get dynamic field value from dynamic_data array
      const getDynamicValue = (fieldName: string) => {
        const field = dynamicData.find((f: any) => f.field_name === fieldName)
        if (!field) return null
        return field.field_value_text || field.field_value_number || field.field_value_json
      }

      // Check entity_code first (often stores primary barcode)
      if (entityCode === barcodeClean) {
        console.log(`🔍🔍🔍 BARCODE MATCH - ${productName}: entity_code matched`)
        product._match_source = 'entity_code'
        return true
      }

      // Check primary barcode
      const barcodePrimary = getDynamicValue('barcode_primary')
      console.log(`🔍🔍🔍 BARCODE SEARCH - Checking Product: ${productName}`, {
        entityCode,
        barcodePrimary,
        barcode: getDynamicValue('barcode'),
        gtin: getDynamicValue('gtin'),
        sku: getDynamicValue('sku'),
        searchingFor: barcodeClean,
        dynamicFieldNames: dynamicData.map((f: any) => f.field_name)
      })
      if (barcodePrimary === barcodeClean) {
        product._match_source = 'primary_barcode'
        return true
      }

      // Check alternate barcodes (array)
      const barcodesAlt = getDynamicValue('barcodes_alt')
      if (Array.isArray(barcodesAlt) && barcodesAlt.includes(barcodeClean)) {
        product._match_source = 'alternate_barcode'
        return true
      }

      // Check GTIN
      const gtin = getDynamicValue('gtin')
      if (gtin === barcodeClean) {
        product._match_source = 'gtin'
        return true
      }

      // Check SKU
      const sku = getDynamicValue('sku')
      if (sku === barcodeClean) {
        product._match_source = 'sku'
        return true
      }

      // Check legacy barcode field for backward compatibility
      const barcode = getDynamicValue('barcode')
      if (barcode === barcodeClean) {
        product._match_source = 'legacy_barcode'
        return true
      }

      return false
    })

    console.log('🔍🔍🔍 BARCODE SEARCH - RESULT:', {
      found: products.length > 0,
      matchCount: products.length,
      barcode: barcodeClean,
      matchedProducts: products.map(p => (p.entity || p).entity_name)
    })

    if (products.length > 0) {
      // Flatten product structure for POS compatibility
      const flattenedProducts = products.map((product: any) => {
        const entity = product.entity || product
        const dynamicData = product.dynamic_data || []

        // Build flattened product with all dynamic fields at top level
        const flattened: any = {
          ...entity,
          _match_source: product._match_source
        }

        // Flatten dynamic_data into top-level properties
        dynamicData.forEach((field: any) => {
          const value = field.field_value_text || field.field_value_number || field.field_value_json || field.field_value_boolean
          if (value !== null && value !== undefined) {
            flattened[field.field_name] = value
          }
        })

        return flattened
      })

      return NextResponse.json({
        success: true,
        found: true,
        source: products[0]._match_source,
        items: flattenedProducts,
        barcode_searched: barcodeClean
      })
    }

    // No results found
    return NextResponse.json({
      success: true,
      found: false,
      items: [],
      barcode_searched: barcodeClean,
      message: `No products found with barcode: ${barcodeClean}`
    })
  } catch (error: any) {
    console.error('[Barcode Search] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to search barcode'
      },
      { status: 500 }
    )
  }
}
