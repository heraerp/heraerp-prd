/**
 * Universal Entity API v2 - DELETE endpoint
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseService } from '@/lib/supabase-service'
import { verifyAuth } from '@/lib/auth/verify-auth'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const entityId = params.id

    if (!entityId || !entityId.match(/^[0-9a-f-]{36}$/i)) {
      return NextResponse.json({ error: 'Invalid entity ID' }, { status: 400 })
    }

    const authResult = await verifyAuth(request)

    if (!authResult || !authResult.organizationId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { organizationId } = authResult
    const { searchParams } = new URL(request.url)

    // Options from query params
    const hard_delete = searchParams.get('hard_delete') === 'true'
    const cascade = searchParams.get('cascade') !== 'false' // Default true

    const supabase = getSupabaseService()

    // Try to delete entity using HERA RPC v2
    const { data: result, error } = await supabase.rpc('hera_entity_delete_v2', {
      p_organization_id: organizationId,
      p_entity_id: entityId,
      p_hard_delete: hard_delete,
      p_cascade: cascade
    })

    if (error) {
      console.error('RPC delete failed, using fallback soft delete:', error)
      
      // Fallback: perform soft delete by updating status in dynamic data
      if (!hard_delete) {
        // First, check if status field exists in dynamic data
        const { data: existingStatus } = await supabase
          .from('core_dynamic_data')
          .select('id')
          .eq('entity_id', entityId)
          .eq('field_name', 'status')
          .eq('organization_id', organizationId)
          .single()
        
        if (existingStatus) {
          // Update existing status field
          const { error: updateError } = await supabase
            .from('core_dynamic_data')
            .update({ 
              field_value_text: 'archived',
              updated_at: new Date().toISOString()
            })
            .eq('entity_id', entityId)
            .eq('field_name', 'status')
            .eq('organization_id', organizationId)
          
          if (updateError) {
            console.error('Failed to update status in dynamic data:', updateError)
            return NextResponse.json(
              { error: 'Failed to archive entity', details: updateError.message },
              { status: 500 }
            )
          }
        } else {
          // Insert new status field
          const { error: insertError } = await supabase
            .from('core_dynamic_data')
            .insert({
              entity_id: entityId,
              organization_id: organizationId,
              field_name: 'status',
              field_type: 'text',
              field_value_text: 'archived',
              smart_code: 'HERA.SALON.CATEGORY.DYN.STATUS.V1'
            })
          
          if (insertError) {
            console.error('Failed to insert status in dynamic data:', insertError)
            return NextResponse.json(
              { error: 'Failed to archive entity', details: insertError.message },
              { status: 500 }
            )
          }
        }
        
        // Update the entity's updated_at timestamp
        const { error: entityUpdateError } = await supabase
          .from('core_entities')
          .update({ 
            updated_at: new Date().toISOString()
          })
          .eq('id', entityId)
          .eq('organization_id', organizationId)
        
        if (entityUpdateError) {
          console.error('Failed to update entity timestamp:', entityUpdateError)
        }
        
        return NextResponse.json({
          success: true,
          message: 'Entity archived successfully',
          data: { operation: 'soft_delete_via_dynamic_data' }
        })
      } else {
        // For hard delete, perform actual deletion
        const { error: deleteError } = await supabase
          .from('core_entities')
          .delete()
          .eq('id', entityId)
          .eq('organization_id', organizationId)
        
        if (deleteError) {
          console.error('Fallback hard delete failed:', deleteError)
          return NextResponse.json(
            { error: 'Failed to delete entity', details: deleteError.message },
            { status: 500 }
          )
        }
        
        return NextResponse.json({
          success: true,
          message: 'Entity permanently deleted',
          data: { operation: 'hard_delete_fallback' }
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: hard_delete ? 'Entity permanently deleted' : 'Entity archived successfully',
      data: result
    })
  } catch (error) {
    console.error('Universal entity delete error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
