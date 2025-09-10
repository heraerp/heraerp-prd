'use client'

import { Clock, User, Edit, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface DocMetaProps {
  lastUpdated?: string
  author?: string | { name: string; avatar?: string }
  readingTime?: number
  editUrl?: string
  createdAt?: string
}

export default function DocMeta({ 
  lastUpdated, 
  author, 
  readingTime, 
  editUrl,
  createdAt 
}: DocMetaProps) {
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  const formatReadingTime = (minutes: number) => {
    if (minutes < 1) return '< 1 min read'
    return `${Math.ceil(minutes)} min read`
  }

  if (!lastUpdated && !author && !readingTime && !editUrl && !createdAt) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-4 py-4 mb-8 text-sm text-muted-foreground border-b">
      {/* Author */}
      {author && (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span>
            {typeof author === 'string' ? author : author.name}
          </span>
        </div>
      )}

      {/* Created Date */}
      {createdAt && (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span>Created {formatDate(createdAt)}</span>
        </div>
      )}

      {/* Last Updated */}
      {lastUpdated && (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>Updated {formatDate(lastUpdated)}</span>
        </div>
      )}

      {/* Reading Time */}
      {readingTime && (
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span>{formatReadingTime(readingTime)}</span>
        </div>
      )}

      {/* Pencil Link */}
      {editUrl && (
        <div className="ml-auto">
          <Button asChild variant="ghost" size="sm">
            <Link 
              href={editUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2"
            >
              <Pencil className="h-4 w-4" />
              Pencil this page
            </Link>
          </Button>
        </div>
      )}
    </div>
  )
}