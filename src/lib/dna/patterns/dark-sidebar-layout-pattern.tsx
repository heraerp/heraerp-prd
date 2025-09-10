/**
 * HERA DNA Pattern: Dark Sidebar Layout
 * 
 * LEARNINGS FROM FURNITURE MODULE:
 * 1. Compact 80px sidebar works better than full navigation
 * 2. Icon-only navigation with tooltips is cleaner
 * 3. Industry-specific theme colors (amber/orange for furniture)
 * 4. Responsive sidebar that hides on mobile
 * 5. Consistent dark theme throughout
 * 
 * This pattern accelerates industry-specific module development
 */

import React from 'react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Button } from '@/components/ui/button'
import { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export interface SidebarItem {
  icon: LucideIcon
  label: string
  href: string
  badge?: string | number
}

export interface DarkSidebarConfig {
  logo: React.ReactNode
  items: SidebarItem[]
  themeColor: string // e.g., 'amber' for furniture, 'blue' for healthcare
  baseUrl: string // e.g., '/furniture'
}

export function DarkSidebarLayout({ 
  children, 
  config 
}: { 
  children: React.ReactNode
  config: DarkSidebarConfig 
}) {
  const pathname = usePathname()
  
  const getColorClasses = (color: string) => {
    const colorMap: Record<string, { bg: string; hover: string; text: string }> = {
      amber: {
        bg: 'bg-amber-600',
        hover: 'hover:bg-amber-700',
        text: 'text-amber-600'
      },
      blue: {
        bg: 'bg-blue-600',
        hover: 'hover:bg-blue-700', 
        text: 'text-blue-600'
      },
      green: {
        bg: 'bg-green-600',
        hover: 'hover:bg-green-700',
        text: 'text-green-600'
      },
      purple: {
        bg: 'bg-purple-600',
        hover: 'hover:bg-purple-700',
        text: 'text-purple-600'
      }
    }
    return colorMap[color] || colorMap.amber
  }

  const colors = getColorClasses(config.themeColor)

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar - fixed width 80px */}
      <div className="w-20 bg-gray-950 border-r border-gray-800">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 flex items-center justify-center">
            {config.logo}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            <TooltipProvider>
              {config.items.map((item) => {
                const isActive = pathname === item.href
                
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>
                      <Link href={item.href}>
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "w-full h-12 relative",
                            isActive && `${colors.bg} ${colors.text} hover:${colors.bg}`,
                            !isActive && "hover:bg-gray-800"
                          )}
                        >
                          <item.icon className={cn(
                            "h-5 w-5",
                            isActive ? "text-white" : "text-gray-400"
                          )} />
                          {item.badge && (
                            <span className={cn(
                              "absolute top-1 right-1 h-5 w-5 text-xs rounded-full flex items-center justify-center",
                              colors.bg,
                              "text-white"
                            )}>
                              {item.badge}
                            </span>
                          )}
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                )
              })}
            </TooltipProvider>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 px-4 py-2 flex justify-around md:hidden">
        {config.items.slice(0, 5).map((item) => {
          const isActive = pathname === item.href
          
          return (
            <Link key={item.href} href={item.href}>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "relative",
                  isActive && `${colors.text}`
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5",
                  isActive ? colors.text : "text-gray-400"
                )} />
              </Button>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

/**
 * Industry Theme Presets
 */
export const industryThemes = {
  furniture: 'amber',
  healthcare: 'blue',
  restaurant: 'green',
  salon: 'purple',
  retail: 'red',
  manufacturing: 'gray'
}