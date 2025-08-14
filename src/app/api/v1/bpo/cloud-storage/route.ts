import { NextRequest, NextResponse } from 'next/server'
import { CloudStorageService, createCloudStorageService } from '@/lib/bpo/cloud-storage'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, settings, fileName, fileData } = body

    if (!action) {
      return NextResponse.json(
        { success: false, error: 'Action is required' },
        { status: 400 }
      )
    }

    // Create cloud storage service from settings
    const cloudStorageService = createCloudStorageService({ cloudStorage: settings })

    switch (action) {
      case 'test_connection':
        const connectionResult = await cloudStorageService.testConnection()
        return NextResponse.json({
          success: true,
          data: connectionResult,
          message: 'Connection test completed'
        })

      case 'test_permissions':
        const permissionsResult = await cloudStorageService.testPermissions()
        return NextResponse.json({
          success: true,
          data: permissionsResult,
          message: 'Permissions test completed'
        })

      case 'upload_file':
        if (!fileName || !fileData) {
          return NextResponse.json(
            { success: false, error: 'fileName and fileData are required for upload' },
            { status: 400 }
          )
        }
        
        // Convert base64 to blob if needed
        const fileBlob = new Blob([fileData], { type: 'application/octet-stream' })
        const uploadResult = await cloudStorageService.uploadFile(fileName, fileBlob)
        
        return NextResponse.json({
          success: true,
          data: uploadResult,
          message: 'File upload completed'
        })

      case 'list_files':
        const { path, limit } = body
        const files = await cloudStorageService.listFiles(path, limit)
        
        return NextResponse.json({
          success: true,
          data: { files },
          message: 'Files listed successfully'
        })

      case 'get_file':
        const { key } = body
        if (!key) {
          return NextResponse.json(
            { success: false, error: 'File key is required' },
            { status: 400 }
          )
        }
        
        const file = await cloudStorageService.getFile(key)
        return NextResponse.json({
          success: true,
          data: file,
          message: file ? 'File retrieved successfully' : 'File not found'
        })

      case 'delete_file':
        const { fileKey } = body
        if (!fileKey) {
          return NextResponse.json(
            { success: false, error: 'File key is required' },
            { status: 400 }
          )
        }
        
        const deleteResult = await cloudStorageService.deleteFile(fileKey)
        return NextResponse.json({
          success: deleteResult,
          message: deleteResult ? 'File deleted successfully' : 'Failed to delete file'
        })

      case 'process_file':
        const { processKey, processingType = 'text-extraction' } = body
        if (!processKey) {
          return NextResponse.json(
            { success: false, error: 'File key is required' },
            { status: 400 }
          )
        }
        
        const processResult = await cloudStorageService.processFile(processKey, processingType)
        return NextResponse.json({
          success: true,
          data: processResult,
          message: 'File processing completed'
        })

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Cloud storage API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'health') {
      return NextResponse.json({
        success: true,
        data: {
          status: 'healthy',
          supportedProviders: ['default', 'aws', 'azure', 'gcp', 'custom'],
          supportedOperations: ['upload', 'download', 'delete', 'list', 'process'],
          version: '1.0.0'
        },
        message: 'Cloud storage service is healthy'
      })
    }

    if (action === 'providers') {
      return NextResponse.json({
        success: true,
        data: {
          providers: [
            {
              id: 'default',
              name: 'HERA Default Storage',
              description: 'Managed storage with automatic backups',
              features: ['read', 'write', 'delete', 'process']
            },
            {
              id: 'aws',
              name: 'Amazon S3',
              description: 'AWS Simple Storage Service',
              features: ['read', 'write', 'delete', 'process', 'versioning', 'encryption']
            },
            {
              id: 'azure',
              name: 'Azure Blob Storage',
              description: 'Microsoft Azure Cloud Storage',
              features: ['read', 'write', 'delete', 'process', 'tiering', 'encryption']
            },
            {
              id: 'gcp',
              name: 'Google Cloud Storage',
              description: 'GCP Object Storage',
              features: ['read', 'write', 'delete', 'process', 'nearline', 'coldline']
            },
            {
              id: 'custom',
              name: 'Custom S3-Compatible',
              description: 'MinIO, DigitalOcean Spaces, Wasabi, etc.',
              features: ['read', 'write', 'delete', 'process']
            }
          ]
        },
        message: 'Supported providers retrieved successfully'
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action or missing action parameter' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Cloud storage GET error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}