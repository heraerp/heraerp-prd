'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { Play, Download, File, FileText, X } from 'lucide-react'
import { cn } from '@/src/lib/utils'
import { Dialog, DialogContent } from '@/src/components/ui/dialog'
import { Button } from '@/src/components/ui/button'

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
          return <File className="w-8 h-8 text-muted-foreground" />
      }
    }
    return <File className="w-8 h-8 text-muted-foreground" />
  }

  if (type === 'image') {
    return (
      <>
        <div className={cn('relative cursor-pointer', className)}>
          <div
            className="relative rounded-lg overflow-hidden max-w-xs"
            onClick={() => setShowPreview(true)}
          >
            {url ? (
              <img src={url} alt="Image" className="w-full h-auto max-h-64 object-cover" />
            ) : (
              <div className="w-64 h-48 bg-gray-700 dark:bg-muted-foreground/10 flex items-center justify-center">
                <span className="text-muted-foreground">Loading image...</span>
              </div>
            )}
          </div>
          {caption && <p className="mt-2 text-sm">{caption}</p>}
        </div>

        {/* Image Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-4xl p-0 bg-background">
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 z-10 text-foreground hover:bg-background/20"
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
                  <p className="text-foreground">{caption}</p>
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
      <div className={cn('relative', className)}>
        <div className="relative rounded-lg overflow-hidden max-w-xs bg-background">
          {thumbnail ? (
            <div className="relative">
              <img
                src={thumbnail}
                alt="Video thumbnail"
                className="w-full h-auto max-h-48 object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-background/30">
                <div className="bg-background/90 rounded-full p-3">
                  <Play className="w-6 h-6 text-white" />
                </div>
              </div>
              {duration && (
                <span className="absolute bottom-2 left-2 bg-background/70 text-foreground text-xs px-2 py-1 rounded">
                  {duration}
                </span>
              )}
            </div>
          ) : (
            <div className="w-64 h-48 bg-gray-700 dark:bg-muted-foreground/10 flex items-center justify-center">
              <Play className="w-12 h-12 text-muted-foreground" />
            </div>
          )}
        </div>
        {caption && <p className="mt-2 text-sm">{caption}</p>}
      </div>
    )
  }

  if (type === 'document') {
    return (
      <div
        className={cn(
          'flex items-center gap-3 p-3 bg-muted dark:bg-muted rounded-lg max-w-xs',
          className
        )}
      >
        {getFileIcon()}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{fileName || 'Document'}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(fileSize)}</p>
        </div>
        <Button variant="ghost" size="icon" className="flex-shrink-0" onClick={onDownload}>
          <Download className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  if (type === 'audio') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 p-2 bg-muted dark:bg-muted rounded-lg max-w-xs',
          className
        )}
      >
        <Button variant="ghost" size="icon" className="flex-shrink-0">
          <Play className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="h-8 bg-gray-300 dark:bg-muted-foreground/10 rounded-full" />
        </div>
        <span className="text-xs text-muted-foreground">{duration || '0:00'}</span>
      </div>
    )
  }

  return null
}
