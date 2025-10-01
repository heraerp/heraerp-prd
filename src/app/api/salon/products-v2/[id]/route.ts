import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'
import { verifyAuth } from '@/lib/auth/verify-auth'

// DELETE endpoint - Soft delete using hera_entity_delete_v1
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id
    
    if (!productId || !productId.match(/^[0-9a-f-]{36}$/i)) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }
    
    // Authenticate
    const authResult = await verifyAuth(request)
    
    if (!authResult || !authResult.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const organizationId = authResult.organizationId
    
    // Get Supabase service client
    const supabase = getSupabaseService()
    
    // Soft delete the product (with cascade to delete dynamic data)
    const { data: result, error } = await supabase.rpc('hera_entity_delete_v1', {
      p_organization_id: organizationId,
      p_entity_id: productId,
      p_hard_delete: false,  // Soft delete by default
      p_cascade: true        // Delete related dynamic data
    })
    
    if (error) {
      console.error('Failed to delete product:', error)
      return NextResponse.json(
        { error: 'Failed to delete product', details: error.message },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Product archived successfully'
    })
    
  } catch (error) {
    console.error('Delete product error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}