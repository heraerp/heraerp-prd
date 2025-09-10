'use client'

import React from 'react'
import { useFurnitureOrg } from './FurnitureOrgContext'
import { cn } from '@/lib/utils'

interface FurniturePageHeaderProps {
  title: string
  subtitle: string
  actions?: React.ReactNode
  className?: string
}

function FurniturePageHeader({ 
  title, 
  subtitle, 
  actions,
  className 
}: FurniturePageHeaderProps) {
  const { organizationName, organizationId } = useFurnitureOrg()
  
  return (
    <div className={cn("flex justify-between items-start", className)}>
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          {title}
        </h1>
        <p className="text-muted-foreground mt-1">
          {organizationName}
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {subtitle} • ID: {organizationId}
        </p>
      </div>
      {actions && (
        <div className="flex gap-3">
          {actions}
        </div>
      )}
    </div>
  )
}

export default React.memo(FurniturePageHeader)