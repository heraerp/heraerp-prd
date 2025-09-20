// ================================================================================
// HERA DNA UI - PAGE HEADER COMPONENT
// Smart Code: HERA.DNA.UI.PAGE.HEADER.V1
// Consistent page header with gradient background and proper dark mode
// ================================================================================

import React from 'react'
import { Button } from '@/components/ui/button'
import { LucideIcon, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface PageHeaderDNAProps {
  title: string
  subtitle?: string
  icon?: LucideIcon
  iconColor?: string
  gradientFrom?: string
  gradientTo?: string
  backUrl?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeaderDNA({
  title,
  subtitle,
  icon: Icon,
  iconColor = "from-violet-600 to-pink-600",
  gradientFrom = "from-violet-50 to-pink-50",
  gradientTo = "dark:from-violet-950/20 dark:to-pink-950/20",
  backUrl,
  actions,
  className
}: PageHeaderDNAProps) {
  const router = useRouter()

  return (
    <div className={cn(
      "bg-gradient-to-r",
      gradientFrom,
      gradientTo,
      "border-b",
      className
    )}>
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {backUrl && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push(backUrl)}
                className="hover:bg-violet-100 dark:hover:bg-violet-800"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}
            
            <div className="flex items-center gap-3">
              {Icon && (
                <div className={cn(
                  "w-10 h-10 rounded-full bg-gradient-to-r",
                  iconColor,
                  "flex items-center justify-center shadow-lg"
                )}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              )}
              
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {title}
                </h1>
                {subtitle && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {actions && (
            <div className="flex items-center gap-3">
              {actions}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}