'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'

interface NavigationItem {
  id: string
  title: string
  slug: string
  children?: NavigationItem[]
  description?: string
}

interface DocNavigationProps {
  navigation: NavigationItem[]
  docType: 'dev' | 'user'
  currentPath: string
  onNavigate?: () => void
}

function NavigationTree({ 
  items, 
  docType, 
  currentPath, 
  onNavigate,
  level = 0 
}: {
  items: NavigationItem[]
  docType: 'dev' | 'user'
  currentPath: string
  onNavigate?: () => void
  level?: number
}) {
  const pathname = usePathname()
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId)
    } else {
      newExpanded.add(itemId)
    }
    setExpandedItems(newExpanded)
  }

  return (
    <ul className={cn("space-y-1", level > 0 && "ml-4 mt-2")}>
      {items.map((item) => {
        const href = `/docs/${docType}/${item.slug}`
        const isActive = pathname === href
        const hasChildren = item.children && item.children.length > 0
        const isExpanded = expandedItems.has(item.id)

        return (
          <li key={item.id}>
            <div className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium",
              isActive 
                ? "bg-hera-primary/10 text-hera-primary" 
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}>
              {hasChildren && (
                <button
                  onClick={() => toggleExpanded(item.id)}
                  className="flex items-center justify-center w-4 h-4 hover:bg-accent rounded-sm"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-3 w-3" />
                  ) : (
                    <ChevronRight className="h-3 w-3" />
                  )}
                </button>
              )}
              
              <Link
                href={href}
                onClick={onNavigate}
                className={cn(
                  "flex-1 truncate",
                  !hasChildren && "ml-6"
                )}
              >
                {item.title}
              </Link>
            </div>

            {hasChildren && (isExpanded || isActive) && (
              <NavigationTree
                items={item.children!}
                docType={docType}
                currentPath={currentPath}
                onNavigate={onNavigate}
                level={level + 1}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}

export default function DocNavigation({ 
  navigation, 
  docType, 
  currentPath, 
  onNavigate 
}: DocNavigationProps) {
  // Group navigation items by sections if they have a 'section' property
  const groupedNavigation = navigation.reduce((acc, item) => {
    const section = (item as any).section || 'General'
    if (!acc[section]) {
      acc[section] = []
    }
    acc[section].push(item)
    return acc
  }, {} as Record<string, NavigationItem[]>)

  const sections = Object.keys(groupedNavigation)

  return (
    <nav className="w-full">
      <div className="pb-4">
        <h4 className="mb-1 rounded-md px-2 py-1 text-sm font-semibold">
          {docType === 'dev' ? 'Developer Guide' : 'User Guide'}
        </h4>
      </div>

      {sections.length === 1 && sections[0] === 'General' ? (
        // Single section - don't show section headers
        <NavigationTree
          items={groupedNavigation.General}
          docType={docType}
          currentPath={currentPath}
          onNavigate={onNavigate}
        />
      ) : (
        // Multiple sections - show section headers
        <div className="space-y-4">
          {sections.map((section) => (
            <div key={section}>
              <h5 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {section}
              </h5>
              <NavigationTree
                items={groupedNavigation[section]}
                docType={docType}
                currentPath={currentPath}
                onNavigate={onNavigate}
              />
            </div>
          ))}
        </div>
      )}

      {/* Quick Links */}
      <div className="mt-8 pt-4 border-t">
        <h5 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Quick Links
        </h5>
        <ul className="space-y-1">
          <li>
            <Link
              href={docType === 'dev' ? '/docs/user' : '/docs/dev'}
              onClick={onNavigate}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              Switch to {docType === 'dev' ? 'User' : 'Developer'} Guide
            </Link>
          </li>
          <li>
            <Link
              href="/docs"
              onClick={onNavigate}
              className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent"
            >
              Documentation Home
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  )
}