'use client'

import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { User } from 'lucide-react'

interface GraderAvatarProps {
  name?: string
  certification?: string
  image?: string
  size?: 'sm' | 'md' | 'lg'
  showCertification?: boolean
  className?: string
}

export default function GraderAvatar({
  name = 'Unassigned',
  certification,
  image,
  size = 'sm',
  showCertification = true,
  className = ''
}: GraderAvatarProps) {
  const getInitials = (name: string) => {
    if (name === 'Unassigned' || name === '-') return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base'
  }

  const isUnassigned = name === 'Unassigned' || name === '-' || !name

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Avatar className={sizeClasses[size]}>
        {image && !isUnassigned ? (
          <AvatarImage src={image} alt={name} />
        ) : null}
        <AvatarFallback className={`
          ${isUnassigned 
            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500' 
            : 'bg-jewelry-blue-100 dark:bg-jewelry-blue-900 text-jewelry-blue-800 dark:text-jewelry-blue-200'
          }
        `}>
          {isUnassigned ? <User className="h-3 w-3" /> : getInitials(name)}
        </AvatarFallback>
      </Avatar>
      
      {size !== 'sm' && (
        <div className="flex flex-col">
          <span className={`
            font-medium 
            ${isUnassigned 
              ? 'text-gray-400 dark:text-gray-500 text-xs' 
              : 'jewelry-text-high-contrast text-sm'
            }
          `}>
            {isUnassigned ? 'Unassigned' : name}
          </span>
          
          {showCertification && certification && !isUnassigned && (
            <Badge 
              variant="outline" 
              className="text-xs jewelry-status-luxury w-fit"
            >
              {certification}
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}