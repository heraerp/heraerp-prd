/**
 * HERA Barcode Search API Endpoint
 * Smart Code: HERA.API.V2.PRODUCTS.BARCODE.SEARCH.V1
 *
 * ✅ ENTERPRISE FEATURES:
 * - Searches both primary and alternate barcodes
 * - Indexed lookups for instant results
 * - Organization isolation via RLS
 * - Supports EAN13, UPC, CODE128, QR codes
 *
 * USAGE:
 * GET /api/v2/products/barcode-search?barcode=6291041500213
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

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

    // Step 1: Search by primary barcode (most common case)
    // Using indexed lookup on core_dynamic_data.field_value_text
    const { data: primaryResults, error: primaryError } = await supabase
      .from('core_dynamic_data')
      .select(
        `
        entity_id,
        field_value_text,
        entity:core_entities!inner(
          id,
          entity_name,
          entity_code,
          entity_type,
          smart_code,
          status,
          organization_id
        )
      `
      )
      .eq('smart_code', 'HERA.SALON.PRODUCT.DYN.BARCODE.PRIMARY.V1')
      .eq('field_value_text', barcodeClean)
      .eq('entity.organization_id', orgId)
      .eq('entity.entity_type', 'PRODUCT')
      .eq('entity.status', 'active')
      .limit(1)

    if (primaryError) {
      console.error('[Barcode Search] Primary search error:', primaryError)
    }

    // If found in primary barcode, return immediately
    if (primaryResults && primaryResults.length > 0 && primaryResults[0].entity) {
      const product = primaryResults[0].entity as any

      // Fetch all dynamic fields for the product
      const { data: dynamicFields } = await supabase
        .from('core_dynamic_data')
        .select('*')
        .eq('entity_id', product.id)
        .eq('organization_id', orgId)

      // Flatten dynamic fields into product object
      const flattenedProduct = { ...product }
      if (dynamicFields) {
        dynamicFields.forEach((field: any) => {
          const value =
            field.field_value_number ??
            field.field_value_boolean ??
            field.field_value_text ??
            field.field_value_json ??
            null

          flattenedProduct[field.field_name] = value
        })
      }

      return NextResponse.json({
        success: true,
        found: true,
        source: 'primary_barcode',
        items: [flattenedProduct],
        barcode_searched: barcodeClean
      })
    }

    // Step 2: Search by alternate barcodes (JSON array contains)
    // Using GIN index on core_dynamic_data.field_value_json
    const { data: altResults, error: altError } = await supabase.rpc(
      'search_products_by_alt_barcode',
      {
        p_barcode: barcodeClean,
        p_organization_id: orgId
      }
    )

    if (altError) {
      console.warn(
        '[Barcode Search] Alternate barcode RPC not found, using fallback query:',
        altError
      )

      // Fallback: Direct query with JSONB contains operator
      const { data: altFallback, error: altFallbackError } = await supabase
        .from('core_dynamic_data')
        .select(
          `
          entity_id,
          field_value_json,
          entity:core_entities!inner(
            id,
            entity_name,
            entity_code,
            entity_type,
            smart_code,
            status,
            organization_id
          )
        `
        )
        .eq('smart_code', 'HERA.SALON.PRODUCT.DYN.BARCODES.ALT.V1')
        .contains('field_value_json', [barcodeClean])
        .eq('entity.organization_id', orgId)
        .eq('entity.entity_type', 'PRODUCT')
        .eq('entity.status', 'active')
        .limit(10)

      if (!altFallbackError && altFallback && altFallback.length > 0) {
        const products = []
        for (const result of altFallback) {
          if (!result.entity) continue
          const product = result.entity as any

          // Fetch all dynamic fields
          const { data: dynamicFields } = await supabase
            .from('core_dynamic_data')
            .select('*')
            .eq('entity_id', product.id)
            .eq('organization_id', orgId)

          const flattenedProduct = { ...product }
          if (dynamicFields) {
            dynamicFields.forEach((field: any) => {
              const value =
                field.field_value_number ??
                field.field_value_boolean ??
                field.field_value_text ??
                field.field_value_json ??
                null
              flattenedProduct[field.field_name] = value
            })
          }
          products.push(flattenedProduct)
        }

        if (products.length > 0) {
          return NextResponse.json({
            success: true,
            found: true,
            source: 'alternate_barcodes',
            items: products,
            barcode_searched: barcodeClean
          })
        }
      }
    }

    // If RPC succeeded
    if (altResults && altResults.length > 0) {
      return NextResponse.json({
        success: true,
        found: true,
        source: 'alternate_barcodes',
        items: altResults,
        barcode_searched: barcodeClean
      })
    }

    // Step 3: No results found
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
