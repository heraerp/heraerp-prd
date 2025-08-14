import { NextRequest, NextResponse } from 'next/server'
import { enhancedAuditDocumentService } from '@/lib/supabase/enhanced-audit-documents'

interface RouteParams {
  params: Promise<{ fileId: string }>
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { fileId } = await params
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')
    const organizationId = searchParams.get('organizationId')

    if (!documentId || !organizationId) {
      return NextResponse.json({
        success: false,
        message: 'Missing required parameters: documentId, organizationId'
      }, { status: 400 })
    }

    // Get current document
    const document = await enhancedAuditDocumentService.getDocument(documentId, organizationId)
    if (!document) {
      return NextResponse.json({
        success: false,
        message: 'Document not found'
      }, { status: 404 })
    }

    // Find the file to delete
    const fileToDelete = document.files.find(f => f.id === fileId)
    if (!fileToDelete) {
      return NextResponse.json({
        success: false,
        message: 'File not found'
      }, { status: 404 })
    }

    // Delete file from Supabase storage
    const filePath = extractFilePathFromUrl(fileToDelete.url)
    if (filePath) {
      const deleteResult = await enhancedAuditDocumentService.deleteFile(filePath)
      if (!deleteResult.success) {
        console.warn('Failed to delete file from storage:', deleteResult.error)
        // Continue with database update even if storage delete fails
      }
    }

    // Remove file from document files array
    const updatedFiles = document.files.filter(f => f.id !== fileId)
    
    // Update document with new file list and possibly change status
    const updates = {
      files: updatedFiles,
      status: updatedFiles.length === 0 ? 'pending' : document.status,
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
      message: 'File deleted successfully',
      data: {
        deleted_file: fileToDelete,
        document: updatedDocument,
        remaining_files: updatedFiles.length
      }
    })

  } catch (error) {
    console.error('File delete error:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to delete file',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { fileId } = await params
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')
    const organizationId = searchParams.get('organizationId')

    if (!documentId || !organizationId) {
      return NextResponse.json({
        success: false,
        message: 'Missing required parameters: documentId, organizationId'
      }, { status: 400 })
    }

    // Get document and find specific file
    const document = await enhancedAuditDocumentService.getDocument(documentId, organizationId)
    if (!document) {
      return NextResponse.json({
        success: false,
        message: 'Document not found'
      }, { status: 404 })
    }

    const file = document.files.find(f => f.id === fileId)
    if (!file) {
      return NextResponse.json({
        success: false,
        message: 'File not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        file,
        document_id: documentId,
        organization_id: organizationId
      }
    })

  } catch (error) {
    console.error('Error fetching file:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch file'
    }, { status: 500 })
  }
}

// Helper function to extract file path from Supabase URL
function extractFilePathFromUrl(url: string): string | null {
  try {
    const urlParts = new URL(url)
    const pathParts = urlParts.pathname.split('/')
    const bucketIndex = pathParts.findIndex(part => part === 'audit-documents')
    if (bucketIndex !== -1) {
      return pathParts.slice(bucketIndex + 1).join('/')
    }
    return null
  } catch {
    return null
  }
}