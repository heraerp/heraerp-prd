import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const STORAGE_BUCKET = 'furniture-documents'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id
    
    if (!documentId) {
      return NextResponse.json({
        success: false,
        message: 'Document ID required'
      }, { status: 400 })
    }

    // Get document details first
    const { data: document, error: fetchError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', documentId)
      .single()

    if (fetchError || !document) {
      return NextResponse.json({
        success: false,
        message: 'Document not found'
      }, { status: 404 })
    }

    // Get file path from dynamic data
    const { data: fileData } = await supabase
      .from('core_dynamic_data')
      .select('field_value_text, metadata')
      .eq('entity_id', documentId)
      .eq('field_name', 'file_url')
      .single()

    // Delete from storage if file exists
    if (fileData?.metadata?.storage_path) {
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([fileData.metadata.storage_path])

      if (storageError) {
        console.error('Storage deletion error:', storageError)
      }
    }

    // Delete dynamic data
    const { error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .delete()
      .eq('entity_id', documentId)

    if (dynamicError) {
      console.error('Dynamic data deletion error:', dynamicError)
    }

    // Delete entity
    const { error: entityError } = await supabase
      .from('core_entities')
      .delete()
      .eq('id', documentId)

    if (entityError) {
      return NextResponse.json({
        success: false,
        message: 'Failed to delete document'
      }, { status: 500 })
    }

    // Record deletion transaction
    const { error: transactionError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: document.organization_id,
        transaction_type: 'document_deletion',
        transaction_code: `DEL-${Date.now()}`,
        transaction_date: new Date().toISOString(),
        reference_entity_id: documentId,
        smart_code: 'HERA.FURNITURE.DOCUMENT.DELETE.TXN.v1',
        metadata: {
          document_name: document.entity_name,
          deleted_at: new Date().toISOString(),
          action: 'delete'
        }
      })

    if (transactionError) {
      console.error('Error creating deletion transaction:', transactionError)
    }

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully'
    })

  } catch (error) {
    console.error('Document deletion error:', error)
    return NextResponse.json({
      success: false,
      message: 'Document deletion failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}