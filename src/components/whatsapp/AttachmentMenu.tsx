'use client'

import React, { useRef } from 'react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { 
  Paperclip,
  Image,
  FileText,
  User,
  MapPin,
  Camera,
  Mic,
  Sticker
} from 'lucide-react'

interface AttachmentMenuProps {
  onImageSelect?: (files: FileList) => void
  onDocumentSelect?: (files: FileList) => void
  onContactSelect?: () => void
  onLocationSelect?: () => void
  onCameraSelect?: () => void
  onAudioSelect?: () => void
  onStickerSelect?: () => void
}

export function AttachmentMenu({
  onImageSelect,
  onDocumentSelect,
  onContactSelect,
  onLocationSelect,
  onCameraSelect,
  onAudioSelect,
  onStickerSelect
}: AttachmentMenuProps) {
  const imageInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  
  const attachmentOptions = [
    {
      icon: Image,
      label: 'Photos & Videos',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20',
      onClick: () => imageInputRef.current?.click()
    },
    {
      icon: FileText,
      label: 'Document',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20',
      onClick: () => documentInputRef.current?.click()
    },
    {
      icon: User,
      label: 'Contact',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/20',
      onClick: onContactSelect
    },
    {
      icon: MapPin,
      label: 'Location',
      color: 'text-green-600',
      bgColor: 'bg-green-100 dark:bg-green-900/20',
      onClick: onLocationSelect
    },
    {
      icon: Camera,
      label: 'Camera',
      color: 'text-red-600',
      bgColor: 'bg-red-100 dark:bg-red-900/20',
      onClick: onCameraSelect
    },
    {
      icon: Sticker,
      label: 'Sticker',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
      onClick: onStickerSelect
    }
  ]
  
  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon">
            <Paperclip className="w-5 h-5" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56" align="start" side="top">
          <div className="grid gap-1">
            {attachmentOptions.map((option, index) => {
              const Icon = option.icon
              return (
                <button
                  key={index}
                  onClick={option.onClick}
                  className="flex items-center gap-3 w-full p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className={`p-2 rounded-full ${option.bgColor}`}>
                    <Icon className={`w-5 h-5 ${option.color}`} />
                  </div>
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
      
      {/* Hidden file inputs */}
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && onImageSelect?.(e.target.files)}
      />
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && onDocumentSelect?.(e.target.files)}
      />
    </>
  )
}