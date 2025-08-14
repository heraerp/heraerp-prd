/**
 * HERA CRM Document Management Service
 * Handles file uploads, document storage, and organization
 * 
 * Project Manager Priority #4: File Upload & Document Management
 */

export interface CRMDocument {
  id: string
  filename: string
  originalName: string
  size: number
  mimeType: string
  uploadedAt: string
  uploadedBy: string
  contactId?: string | number
  opportunityId?: string | number
  category: 'contract' | 'proposal' | 'presentation' | 'invoice' | 'correspondence' | 'other'
  tags: string[]
  notes?: string
  isPublic: boolean
  downloadUrl: string
  organizationId: string
}

export interface DocumentUploadResult {
  success: boolean
  document?: CRMDocument
  error?: string
}

export interface DocumentFilter {
  contactId?: string | number
  opportunityId?: string | number
  category?: string
  tags?: string[]
  uploadedBy?: string
  dateRange?: {
    start: string
    end: string
  }
}

/**
 * CRM Document Management Service
 * Integrates with HERA universal tables for document metadata
 * Uses local storage or cloud storage for actual files
 */
export class CRMDocumentService {
  private organizationId: string
  private storageProvider: 'local' | 'supabase' | 'aws' | 's3'

  constructor(organizationId: string, provider: 'local' | 'supabase' | 'aws' | 's3' = 'local') {
    this.organizationId = organizationId
    this.storageProvider = provider
  }

  /**
   * Upload document and store metadata
   */
  async uploadDocument(
    file: File,
    metadata: {
      contactId?: string | number
      opportunityId?: string | number
      category: CRMDocument['category']
      tags?: string[]
      notes?: string
      isPublic?: boolean
    },
    uploadedBy: string
  ): Promise<DocumentUploadResult> {
    try {
      // Validate file
      const maxSize = 10 * 1024 * 1024 // 10MB limit
      if (file.size > maxSize) {
        throw new Error('File size exceeds 10MB limit')
      }

      // Allowed file types
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'image/jpeg',
        'image/png',
        'image/gif',
        'text/plain',
        'text/csv'
      ]

      if (!allowedTypes.includes(file.type)) {
        throw new Error('File type not supported')
      }

      // Generate unique filename
      const timestamp = Date.now()
      const randomId = Math.random().toString(36).substring(2, 15)
      const fileExtension = file.name.split('.').pop()
      const uniqueFilename = `${timestamp}_${randomId}.${fileExtension}`

      // Upload file based on storage provider
      let downloadUrl: string
      switch (this.storageProvider) {
        case 'local':
          downloadUrl = await this.uploadToLocal(file, uniqueFilename)
          break
        case 'supabase':
          downloadUrl = await this.uploadToSupabase(file, uniqueFilename)
          break
        case 'aws':
        case 's3':
          downloadUrl = await this.uploadToS3(file, uniqueFilename)
          break
        default:
          throw new Error('Unsupported storage provider')
      }

      // Create document metadata in HERA universal tables
      const document: CRMDocument = {
        id: `doc_${timestamp}_${randomId}`,
        filename: uniqueFilename,
        originalName: file.name,
        size: file.size,
        mimeType: file.type,
        uploadedAt: new Date().toISOString(),
        uploadedBy,
        contactId: metadata.contactId,
        opportunityId: metadata.opportunityId,
        category: metadata.category,
        tags: metadata.tags || [],
        notes: metadata.notes,
        isPublic: metadata.isPublic || false,
        downloadUrl,
        organizationId: this.organizationId
      }

      // Store document metadata in HERA
      await this.storeDocumentMetadata(document)

      return { success: true, document }
    } catch (error) {
      console.error('Error uploading document:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload document'
      }
    }
  }

  /**
   * Get documents with filtering
   */
  async getDocuments(filter?: DocumentFilter): Promise<CRMDocument[]> {
    try {
      // TODO: Implement HERA API call to get document entities
      // For now, return mock data
      const mockDocuments: CRMDocument[] = [
        {
          id: 'doc_1',
          filename: 'proposal_techsolutions.pdf',
          originalName: 'Tech Solutions Proposal.pdf',
          size: 2048576,
          mimeType: 'application/pdf',
          uploadedAt: '2024-01-15T10:30:00Z',
          uploadedBy: 'john.doe@company.com',
          contactId: '1',
          category: 'proposal',
          tags: ['proposal', 'tech-solutions'],
          notes: 'Q1 implementation proposal for Tech Solutions Inc',
          isPublic: false,
          downloadUrl: '/api/v1/crm/documents/download/doc_1',
          organizationId: this.organizationId
        },
        {
          id: 'doc_2',
          filename: 'contract_signed.pdf',
          originalName: 'Signed Contract - Global Enterprises.pdf',
          size: 1536000,
          mimeType: 'application/pdf',
          uploadedAt: '2024-01-18T14:15:00Z',
          uploadedBy: 'jane.smith@company.com',
          contactId: '3',
          category: 'contract',
          tags: ['contract', 'signed', 'global-enterprises'],
          notes: 'Fully executed contract with Global Enterprises',
          isPublic: false,
          downloadUrl: '/api/v1/crm/documents/download/doc_2',
          organizationId: this.organizationId
        }
      ]

      // Apply filters
      let filteredDocs = mockDocuments

      if (filter) {
        if (filter.contactId) {
          filteredDocs = filteredDocs.filter(doc => doc.contactId?.toString() === filter.contactId?.toString())
        }
        if (filter.opportunityId) {
          filteredDocs = filteredDocs.filter(doc => doc.opportunityId?.toString() === filter.opportunityId?.toString())
        }
        if (filter.category) {
          filteredDocs = filteredDocs.filter(doc => doc.category === filter.category)
        }
        if (filter.tags && filter.tags.length > 0) {
          filteredDocs = filteredDocs.filter(doc => 
            filter.tags!.some(tag => doc.tags.includes(tag))
          )
        }
      }

      return filteredDocs
    } catch (error) {
      console.error('Error fetching documents:', error)
      throw new Error('Failed to fetch documents')
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      // TODO: Implement actual deletion
      // 1. Delete file from storage
      // 2. Remove metadata from HERA
      console.log('Deleting document:', documentId)
      return true
    } catch (error) {
      console.error('Error deleting document:', error)
      return false
    }
  }

  /**
   * Update document metadata
   */
  async updateDocument(documentId: string, updates: Partial<CRMDocument>): Promise<CRMDocument | null> {
    try {
      // TODO: Implement HERA API update
      console.log('Updating document:', documentId, updates)
      return null
    } catch (error) {
      console.error('Error updating document:', error)
      return null
    }
  }

  /**
   * Generate download URL with access token
   */
  async getDownloadUrl(documentId: string, expiresIn: number = 3600): Promise<string> {
    try {
      // TODO: Generate secure download URL
      return `/api/v1/crm/documents/download/${documentId}?token=temp_token`
    } catch (error) {
      console.error('Error generating download URL:', error)
      throw new Error('Failed to generate download URL')
    }
  }

  /**
   * Private methods for different storage providers
   */
  private async uploadToLocal(file: File, filename: string): Promise<string> {
    // For demo purposes - in production, this would use proper file storage
    // Convert file to base64 for mock storage
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => {
        // Mock local storage URL
        resolve(`/api/v1/crm/documents/download/${filename}`)
      }
      reader.readAsDataURL(file)
    })
  }

  private async uploadToSupabase(file: File, filename: string): Promise<string> {
    // TODO: Implement Supabase storage integration
    throw new Error('Supabase storage not yet implemented')
  }

  private async uploadToS3(file: File, filename: string): Promise<string> {
    // TODO: Implement AWS S3 integration
    throw new Error('S3 storage not yet implemented')
  }

  /**
   * Store document metadata in HERA universal tables
   */
  private async storeDocumentMetadata(document: CRMDocument): Promise<void> {
    try {
      // TODO: Implement HERA API call
      const entityData = {
        entity_type: 'document',
        entity_name: document.originalName,
        organization_id: this.organizationId,
        smart_code: 'HERA.CRM.DOCUMENT.v1',
        dynamic_data: {
          filename: document.filename,
          original_name: document.originalName,
          size: document.size.toString(),
          mime_type: document.mimeType,
          uploaded_by: document.uploadedBy,
          contact_id: document.contactId?.toString(),
          opportunity_id: document.opportunityId?.toString(),
          category: document.category,
          tags: JSON.stringify(document.tags),
          notes: document.notes,
          is_public: document.isPublic.toString(),
          download_url: document.downloadUrl
        }
      }

      console.log('Document metadata to store:', entityData)
      // await heraApi.createEntity(entityData)
    } catch (error) {
      console.error('Error storing document metadata:', error)
      throw error
    }
  }
}

/**
 * Create document service instance
 */
export const createDocumentService = (organizationId: string, provider?: 'local' | 'supabase' | 'aws' | 's3') => {
  return new CRMDocumentService(organizationId, provider)
}