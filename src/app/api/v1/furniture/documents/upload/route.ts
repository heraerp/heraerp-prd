import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { v4 as uuidv4 } from 'uuid'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Storage bucket for furniture documents
const STORAGE_BUCKET = 'furniture-documents'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const organizationId = formData.get('organizationId') as string
    const documentType = (formData.get('documentType') as string) || 'furniture_invoice'

    if (!file || !organizationId) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: file, organizationId'
        },
        { status: 400 }
      )
    }

    // Validate file
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          success: false,
          message: 'File size exceeds 50MB limit'
        },
        { status: 400 }
      )
    }

    const allowedTypes = ['pdf', 'jpg', 'jpeg', 'png', 'heic']
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      return NextResponse.json(
        {
          success: false,
          message: `File type .${fileExtension} not supported. Allowed: ${allowedTypes.join(', ')}`
        },
        { status: 400 }
      )
    }

    // Create document entity in core_entities
    const documentId = uuidv4()
    const documentCode = `FRN-DOC-${Date.now()}`

    // Create entity record for the document
    const { data: entityData, error: entityError } = await supabase
      .from('core_entities')
      .insert({
        id: documentId,
        organization_id: organizationId,
        entity_type: 'document',
        entity_code: documentCode,
        entity_name: file.name,
        smart_code: 'HERA.FURNITURE.DOCUMENT.INVOICE.v1',
        metadata: {
          document_type: documentType,
          file_size: file.size,
          file_type: file.type,
          original_name: file.name,
          upload_date: new Date().toISOString()
        }
      })
      .select()
      .single()

    if (entityError) {
      console.error('Error creating document entity:', entityError)
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to create document record'
        },
        { status: 500 }
      )
    }

    // Upload file to Supabase storage
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`
    const filePath = `${organizationId}/invoices/${documentId}/${fileName}`

    // First check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some(b => b.name === STORAGE_BUCKET)

    if (!bucketExists) {
      // Create bucket if it doesn't exist
      const { error: bucketError } = await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: false,
        allowedMimeTypes: ['application/pdf', 'image/*']
      })

      if (bucketError && !bucketError.message.includes('already exists')) {
        console.error('Error creating storage bucket:', bucketError)
      }
    }

    // Upload to storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      // Cleanup entity if upload failed
      await supabase.from('core_entities').delete().eq('id', documentId)

      return NextResponse.json(
        {
          success: false,
          message: 'Failed to upload file to storage'
        },
        { status: 500 }
      )
    }

    // Get public URL
    const {
      data: { publicUrl }
    } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath)

    // Store file metadata in core_dynamic_data
    const { error: metadataError } = await supabase.from('core_dynamic_data').insert({
      entity_id: documentId,
      organization_id: organizationId,
      field_name: 'file_url',
      field_value_text: publicUrl,
      smart_code: 'HERA.FURNITURE.DOCUMENT.URL.v1',
      field_value_json: {
        storage_path: filePath,
        upload_timestamp: new Date().toISOString()
      }
    })

    if (metadataError) {
      console.error('Error storing file metadata:', metadataError)
    }

    // Create transaction record for document upload
    const { error: transactionError } = await supabase.from('universal_transactions').insert({
      organization_id: organizationId,
      transaction_type: 'document_upload',
      transaction_code: `DOC-${Date.now()}`,
      transaction_date: new Date().toISOString(),
      source_entity_id: documentId,
      smart_code: 'HERA.FURNITURE.DOCUMENT.UPLOAD.TXN.V1',
      metadata: {
        document_type: documentType,
        file_name: file.name,
        file_size: file.size,
        action: 'upload'
      }
    })

    if (transactionError) {
      console.error('Error creating transaction record:', transactionError)
    }

    // Return file info
    const fileInfo = {
      id: documentId,
      name: file.name,
      size: file.size,
      type: file.type,
      url: publicUrl,
      uploaded_at: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        file: fileInfo,
        documentId: documentId
      }
    })
  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Document upload failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
