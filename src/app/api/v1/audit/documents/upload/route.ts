import { NextRequest, NextResponse } from 'next/server'
import { enhancedAuditDocumentService } from '@/lib/supabase/enhanced-audit-documents'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const documentId = formData.get('documentId') as string
    const organizationId = formData.get('organizationId') as string
    
    if (!file || !documentId || !organizationId) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields: file, documentId, organizationId'
      }, { status: 400 })
    }

    // Validate file
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json({
        success: false,
        message: 'File size exceeds 50MB limit'
      }, { status: 400 })
    }

    const allowedTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png']
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    if (!fileExtension || !allowedTypes.includes(fileExtension)) {
      return NextResponse.json({
        success: false,
        message: `File type .${fileExtension} not supported. Allowed: ${allowedTypes.join(', ')}`
      }, { status: 400 })
    }

    // Upload file to Supabase storage
    const uploadResult = await enhancedAuditDocumentService.uploadFile(
      file,
      documentId,
      organizationId,
      'current_user' // TODO: Get from auth context
    )

    if (!uploadResult.success) {
      return NextResponse.json({
        success: false,
        message: uploadResult.error || 'Upload failed'
      }, { status: 500 })
    }

    // Get current document to update file list
    const document = await enhancedAuditDocumentService.getDocument(documentId, organizationId)
    if (!document) {
      return NextResponse.json({
        success: false,
        message: 'Document not found'
      }, { status: 404 })
    }

    // Add new file to document files array
    const updatedFiles = [...document.files, uploadResult.file!]
    
    // Update document with new files and status
    const updates = {
      files: updatedFiles,
      status: document.status === 'pending' ? 'received' : document.status,
      received_date: document.received_date || new Date().toISOString(),
      metadata: {
        ...document.metadata,
        file_count: updatedFiles.length,
        total_file_size: updatedFiles.reduce((sum, f) => sum + f.size, 0),
        last_activity: new Date().toISOString()
      }
    }

    const updatedDocument = await enhancedAuditDocumentService.updateDocument(
      documentId,
      updates as any,
      organizationId
    )

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        file: uploadResult.file,
        document: updatedDocument
      }
    })

  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json({
      success: false,
      message: 'File upload failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')
    const organizationId = searchParams.get('organizationId')

    if (!documentId || !organizationId) {
      return NextResponse.json({
        success: false,
        message: 'Missing required parameters: documentId, organizationId'
      }, { status: 400 })
    }

    const document = await enhancedAuditDocumentService.getDocument(documentId, organizationId)
    
    if (!document) {
      return NextResponse.json({
        success: false,
        message: 'Document not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        files: document.files,
        document_id: documentId,
        total_files: document.files.length,
        total_size: document.files.reduce((sum, f) => sum + f.size, 0)
      }
    })

  } catch (error) {
    console.error('Error fetching document files:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch document files'
    }, { status: 500 })
  }
}