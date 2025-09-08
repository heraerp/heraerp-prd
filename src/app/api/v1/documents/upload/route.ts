/**
 * HERA Document Upload API
 * Smart Code: HERA.DOCS.UPLOAD.API.v1
 * 
 * Handles document uploads for transaction evidence
 * Supports PDF and image formats with multi-tenant isolation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { z } from 'zod'

// Validation schema
const UploadSchema = z.object({
  organizationId: z.string().uuid(),
  fileType: z.string(),
  fileName: z.string(),
  transactionId: z.string().uuid().optional(),
  entityId: z.string().uuid().optional(),
  metadata: z.record(z.any()).optional()
})

// Initialize Supabase Admin
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const organizationId = formData.get('organizationId') as string
    const fileType = formData.get('fileType') as string
    const fileName = formData.get('fileName') as string
    const transactionId = formData.get('transactionId') as string | undefined
    const entityId = formData.get('entityId') as string | undefined
    const metadata = formData.get('metadata') ? JSON.parse(formData.get('metadata') as string) : {}

    // Validate input
    const validationResult = UploadSchema.safeParse({
      organizationId,
      fileType,
      fileName,
      transactionId,
      entityId,
      metadata
    })

    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: validationResult.error.errors 
        },
        { status: 400 }
      )
    }

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/heic']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload PDF or image files.' },
        { status: 400 }
      )
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      )
    }

    // Generate unique file path
    const timestamp = Date.now()
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${organizationId}/documents/${timestamp}_${safeFileName}`

    // Convert File to ArrayBuffer then to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from('documents')
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: 'Failed to upload file', details: uploadError.message },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = supabaseAdmin
      .storage
      .from('documents')
      .getPublicUrl(filePath)

    // Create document record in core_entities
    const { data: documentEntity, error: entityError } = await supabaseAdmin
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: 'document',
        entity_name: fileName,
        entity_code: `DOC-${timestamp}`,
        smart_code: 'HERA.DOCS.EVIDENCE.UPLOAD.v1',
        metadata: {
          file_path: filePath,
          file_type: file.type,
          file_size: file.size,
          public_url: publicUrl,
          upload_timestamp: new Date().toISOString(),
          ...metadata
        }
      })
      .select()
      .single()

    if (entityError) {
      console.error('Entity creation error:', entityError)
      return NextResponse.json(
        { error: 'Failed to create document record', details: entityError.message },
        { status: 500 }
      )
    }

    // If transactionId provided, create relationship
    if (transactionId && documentEntity) {
      const { error: relError } = await supabaseAdmin
        .from('core_relationships')
        .insert({
          organization_id: organizationId,
          from_entity_id: transactionId,
          to_entity_id: documentEntity.id,
          relationship_type: 'has_document',
          smart_code: 'HERA.DOCS.REL.TRANSACTION.v1',
          metadata: {
            document_type: 'evidence',
            upload_timestamp: new Date().toISOString()
          }
        })

      if (relError) {
        console.error('Relationship creation error:', relError)
      }
    }

    // If entityId provided, create relationship to entity
    if (entityId && documentEntity) {
      const { error: relError } = await supabaseAdmin
        .from('core_relationships')
        .insert({
          organization_id: organizationId,
          from_entity_id: entityId,
          to_entity_id: documentEntity.id,
          relationship_type: 'has_document',
          smart_code: 'HERA.DOCS.REL.ENTITY.v1',
          metadata: {
            document_type: 'attachment',
            upload_timestamp: new Date().toISOString()
          }
        })

      if (relError) {
        console.error('Entity relationship creation error:', relError)
      }
    }

    // Return success response
    return NextResponse.json({
      success: true,
      data: {
        documentId: documentEntity.id,
        fileName: fileName,
        fileType: file.type,
        fileSize: file.size,
        publicUrl: publicUrl,
        uploadedAt: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('Document upload error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve document
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')
    const organizationId = searchParams.get('organizationId')

    if (!documentId || !organizationId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    // Fetch document entity
    const { data: document, error } = await supabaseAdmin
      .from('core_entities')
      .select('*')
      .eq('id', documentId)
      .eq('organization_id', organizationId)
      .eq('entity_type', 'document')
      .single()

    if (error || !document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      )
    }

    // Return document information
    return NextResponse.json({
      success: true,
      data: {
        documentId: document.id,
        fileName: document.entity_name,
        fileType: document.metadata?.file_type,
        fileSize: document.metadata?.file_size,
        publicUrl: document.metadata?.public_url,
        uploadedAt: document.created_at
      }
    })

  } catch (error) {
    console.error('Document retrieval error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}