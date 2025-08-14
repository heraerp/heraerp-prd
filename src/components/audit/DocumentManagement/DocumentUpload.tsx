'use client'

import React, { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Upload, 
  FileText, 
  Image, 
  File, 
  X, 
  Check, 
  AlertCircle,
  Download,
  Eye,
  Trash2,
  Plus
} from 'lucide-react'

interface DocumentFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploaded_at: string
  uploaded_by: string
}

interface DocumentUploadProps {
  documentId: string
  documentName: string
  organizationId: string
  currentFiles: DocumentFile[]
  onFilesUpdate: (files: DocumentFile[]) => void
  onStatusChange?: (status: string) => void
  maxFiles?: number
  maxFileSize?: number // in MB
  acceptedTypes?: string[]
}

export function DocumentUpload({
  documentId,
  documentName,
  organizationId,
  currentFiles,
  onFilesUpdate,
  onStatusChange,
  maxFiles = 10,
  maxFileSize = 50,
  acceptedTypes = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'jpg', 'jpeg', 'png']
}: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <Image className="w-4 h-4" />
    if (type.includes('pdf')) return <FileText className="w-4 h-4 text-red-600" />
    if (type.includes('excel') || type.includes('spreadsheet')) return <FileText className="w-4 h-4 text-green-600" />
    if (type.includes('word') || type.includes('document')) return <FileText className="w-4 h-4 text-blue-600" />
    return <File className="w-4 h-4" />
  }

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `File size must be less than ${maxFileSize}MB`
    }

    // Check file type
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (extension && !acceptedTypes.includes(extension)) {
      return `File type .${extension} is not supported. Accepted types: ${acceptedTypes.join(', ')}`
    }

    // Check file count
    if (currentFiles.length >= maxFiles) {
      return `Maximum ${maxFiles} files allowed`
    }

    return null
  }

  const uploadFile = async (file: File): Promise<DocumentFile | null> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('documentId', documentId)
    formData.append('organizationId', organizationId)

    try {
      const response = await fetch('/api/v1/audit/documents/upload', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        return result.data.file
      } else {
        throw new Error(result.message || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      throw error
    }
  }

  const handleFileSelect = async (files: FileList) => {
    setError(null)
    setSuccess(null)
    setUploading(true)
    setUploadProgress(0)

    try {
      const newFiles: DocumentFile[] = []
      const totalFiles = files.length
      
      for (let i = 0; i < totalFiles; i++) {
        const file = files[i]
        
        // Validate file
        const validationError = validateFile(file)
        if (validationError) {
          setError(validationError)
          continue
        }

        // Upload file
        try {
          const uploadedFile = await uploadFile(file)
          if (uploadedFile) {
            newFiles.push(uploadedFile)
          }
          setUploadProgress(((i + 1) / totalFiles) * 100)
        } catch (error) {
          console.error(`Failed to upload ${file.name}:`, error)
          setError(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      if (newFiles.length > 0) {
        const updatedFiles = [...currentFiles, ...newFiles]
        onFilesUpdate(updatedFiles)
        setSuccess(`Successfully uploaded ${newFiles.length} file(s)`)
        
        // Auto-update document status to 'received' if this is the first file
        if (currentFiles.length === 0 && onStatusChange) {
          onStatusChange('received')
        }
      }
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelect(e.target.files)
    }
  }

  const handleDeleteFile = async (fileId: string) => {
    try {
      const response = await fetch(`/api/v1/audit/documents/files/${fileId}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      
      if (result.success) {
        const updatedFiles = currentFiles.filter(f => f.id !== fileId)
        onFilesUpdate(updatedFiles)
        setSuccess('File deleted successfully')
      } else {
        setError(result.message || 'Failed to delete file')
      }
    } catch (error) {
      setError('Failed to delete file')
    }
  }

  const handleDownloadFile = (file: DocumentFile) => {
    // Create download link
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePreviewFile = (file: DocumentFile) => {
    window.open(file.url, '_blank')
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Document Files - {documentName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Upload Area */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver
              ? 'border-blue-500 bg-blue-50'
              : uploading
              ? 'border-gray-300 bg-gray-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
        >
          {uploading ? (
            <div className="space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-600">Uploading files...</p>
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-xs text-gray-500">{Math.round(uploadProgress)}% complete</p>
            </div>
          ) : (
            <div className="space-y-4">
              <Upload className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <p className="text-lg font-medium text-gray-900">
                  Drop files here or click to browse
                </p>
                <p className="text-sm text-gray-600">
                  Max {maxFiles} files, {maxFileSize}MB each. Accepted: {acceptedTypes.join(', ')}
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={currentFiles.length >= maxFiles}
                className="mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Choose Files
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={acceptedTypes.map(type => `.${type}`).join(',')}
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Status Messages */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="border-green-200 bg-green-50">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Current Files */}
        {currentFiles.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">
              Uploaded Files ({currentFiles.length}/{maxFiles})
            </h4>
            <div className="space-y-3">
              {currentFiles.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileIcon(file.type)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{file.name}</p>
                      <p className="text-sm text-gray-500">
                        {formatFileSize(file.size)} • Uploaded {new Date(file.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePreviewFile(file)}
                      title="Preview file"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownloadFile(file)}
                      title="Download file"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteFile(file.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      title="Delete file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* File Upload Guidelines */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 mb-2">Upload Guidelines</h5>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Ensure all documents are clear and readable</li>
            <li>• Include certified copies where required</li>
            <li>• Files should be current and complete</li>
            <li>• Use descriptive filenames when possible</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}