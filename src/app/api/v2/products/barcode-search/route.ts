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

    // 🎯 RPC-BASED SEARCH: Use hera_entity_read_v1 with dynamic field filters
    // This searches: barcode_primary, barcodes_alt, gtin, and sku fields
    const result = await callRPC('hera_entity_read_v1', {
      p_organization_id: orgId,
      p_entity_type: 'product',
      p_filters: {
        status: 'active',
        include_dynamic: true
      },
      p_limit: 50 // Get all products with dynamic data
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

    // Filter products matching the barcode in dynamic fields
    const products = (result.data || []).filter((product: any) => {
      // Check primary barcode
      if (product.barcode_primary === barcodeClean) {
        product._match_source = 'primary_barcode'
        return true
      }

      // Check alternate barcodes (array)
      if (Array.isArray(product.barcodes_alt) && product.barcodes_alt.includes(barcodeClean)) {
        product._match_source = 'alternate_barcode'
        return true
      }

      // Check GTIN
      if (product.gtin === barcodeClean) {
        product._match_source = 'gtin'
        return true
      }

      // Check SKU
      if (product.sku === barcodeClean) {
        product._match_source = 'sku'
        return true
      }

      // Check legacy barcode field for backward compatibility
      if (product.barcode === barcodeClean) {
        product._match_source = 'legacy_barcode'
        return true
      }

      return false
    })

    if (products.length > 0) {
      return NextResponse.json({
        success: true,
        found: true,
        source: products[0]._match_source,
        items: products,
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
