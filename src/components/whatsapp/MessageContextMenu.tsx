'use client'

import React from 'react'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import { 
  Reply, 
  Forward, 
  Copy, 
  Star, 
  Trash2, 
  Info,
  CheckSquare,
  Download,
  Share
} from 'lucide-react'

interface MessageContextMenuProps {
  children: React.ReactNode
  messageId: string
  messageText: string
  isStarred?: boolean
  hasMedia?: boolean
  isOutbound?: boolean
  onReply?: () => void
  onForward?: () => void
  onCopy?: () => void
  onStar?: () => void
  onDelete?: () => void
  onInfo?: () => void
  onSelect?: () => void
  onDownload?: () => void
}

export function MessageContextMenu({
  children,
  messageId,
  messageText,
  isStarred = false,
  hasMedia = false,
  isOutbound = false,
  onReply,
  onForward,
  onCopy,
  onStar,
  onDelete,
  onInfo,
  onSelect,
  onDownload
}: MessageContextMenuProps) {
  
  const handleCopy = () => {
    navigator.clipboard.writeText(messageText)
    onCopy?.()
  }
  
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={onReply}>
          <Reply className="mr-2 h-4 w-4" />
          Reply
        </ContextMenuItem>
        
        <ContextMenuItem onClick={onForward}>
          <Forward className="mr-2 h-4 w-4" />
          Forward
        </ContextMenuItem>
        
        <ContextMenuItem onClick={handleCopy}>
          <Copy className="mr-2 h-4 w-4" />
          Copy
        </ContextMenuItem>
        
        {hasMedia && (
          <ContextMenuItem onClick={onDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </ContextMenuItem>
        )}
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={onStar}>
          <Star className={`mr-2 h-4 w-4 ${isStarred ? 'fill-current text-yellow-500' : ''}`} />
          {isStarred ? 'Unstar' : 'Star'}
        </ContextMenuItem>
        
        <ContextMenuItem onClick={onSelect}>
          <CheckSquare className="mr-2 h-4 w-4" />
          Select
        </ContextMenuItem>
        
        {isOutbound && (
          <ContextMenuItem onClick={onInfo}>
            <Info className="mr-2 h-4 w-4" />
            Message info
          </ContextMenuItem>
        )}
        
        <ContextMenuSeparator />
        
        <ContextMenuItem onClick={onDelete} className="text-red-600 focus:text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}