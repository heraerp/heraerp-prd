'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Play, Download, File, FileText, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface MediaMessageProps {
  type: 'image' | 'video' | 'document' | 'audio'
  url?: string
  thumbnail?: string
  fileName?: string
  fileSize?: number
  duration?: string
  caption?: string
  className?: string
  onDownload?: () => void
}

export function MediaMessage({
  type,
  url,
  thumbnail,
  fileName,
  fileSize,
  duration,
  caption,
  className,
  onDownload
}: MediaMessageProps) {
  const [showPreview, setShowPreview] = useState(false)
  
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i]
  }
  
  const getFileIcon = () => {
    if (fileName) {
      const ext = fileName.split('.').pop()?.toLowerCase()
      switch (ext) {
        case 'pdf':
          return <FileText className="w-8 h-8 text-red-500" />
        case 'doc':
        case 'docx':
          return <FileText className="w-8 h-8 text-blue-500" />
        case 'xls':
        case 'xlsx':
          return <FileText className="w-8 h-8 text-green-500" />
        default:
          return <File className="w-8 h-8 text-gray-500" />
      }
    }
    return <File className="w-8 h-8 text-gray-500" />
  }
  
  if (type === 'image') {
    return (
      <>
        <div className={cn("relative cursor-pointer", className)}>
          <div 
            className="relative rounded-lg overflow-hidden max-w-xs"
            onClick={() => setShowPreview(true)}
          >
            {url ? (
              <img
                src={url}
                alt="Image"
                className="w-full h-auto max-h-64 object-cover"
              />
            ) : (
              <div className="w-64 h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <span className="text-gray-500">Loading image...</span>
              </div>
            )}
          </div>
          {caption && (
            <p className="mt-2 text-sm">{caption}</p>
          )}
        </div>
        
        {/* Image Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl p-0 bg-black">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 text-white hover:bg-white/20"
                onClick={() => setShowPreview(false)}
              >
                <X className="w-5 h-5" />
              </Button>
              {url && (
                <img
                  src={url}
                  alt="Preview"
                  className="w-full h-auto max-h-[90vh] object-contain"
                />
              )}
              {caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <p className="text-white">{caption}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    )
  }
  
  if (type === 'video') {
    return (
      <div className={cn("relative", className)}>
        <div className="relative rounded-lg overflow-hidden max-w-xs bg-black">
          {thumbnail ? (
            <div className="relative">
              <img
                src={thumbnail}
                alt="Video thumbnail"
                className="w-full h-auto max-h-48 object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="bg-white/90 rounded-full p-3">
                  <Play className="w-6 h-6 text-black" />
                </div>
              </div>
              {duration && (
                <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {duration}
                </span>
              )}
            </div>
          ) : (
            <div className="w-64 h-48 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
              <Play className="w-12 h-12 text-gray-500" />
            </div>
          )}
        </div>
        {caption && (
          <p className="mt-2 text-sm">{caption}</p>
        )}
      </div>
    )
  }
  
  if (type === 'document') {
    return (
      <div className={cn("flex items-center gap-3 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg max-w-xs", className)}>
        {getFileIcon()}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{fileName || 'Document'}</p>
          <p className="text-xs text-gray-500">{formatFileSize(fileSize)}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0"
          onClick={onDownload}
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
    )
  }
  
  if (type === 'audio') {
    return (
      <div className={cn("flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg max-w-xs", className)}>
        <Button
          variant="ghost"
          size="icon"
          className="flex-shrink-0"
        >
          <Play className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="h-8 bg-gray-300 dark:bg-gray-700 rounded-full" />
        </div>
        <span className="text-xs text-gray-500">{duration || '0:00'}</span>
      </div>
    )
  }
  
  return null
}