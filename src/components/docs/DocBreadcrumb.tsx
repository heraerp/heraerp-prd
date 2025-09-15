'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  title: string
  href: string
}

interface DocBreadcrumbProps {
  path: BreadcrumbItem[]
  docType: 'dev' | 'user'
  className?: string
}

export default function DocBreadcrumb({ path, docType, className }: DocBreadcrumbProps) {
  const basePath = [
    { title: 'Home', href: '/' },
    { title: 'Docs', href: '/docs' },
    {
      title: docType === 'dev' ? 'Developer Guide' : 'User Guide',
      href: `/docs/${docType}`
    }
  ]

  const fullPath = [...basePath, ...path]

  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center space-x-1 text-sm text-muted-foreground mb-6', className)}
    >
      <ol className="flex items-center space-x-1">
        {fullPath.map((item, index) => {
          const isLast = index === fullPath.length - 1

          return (
            <li key={item.href} className="flex items-center space-x-1">
              {index === 0 && <Home className="h-3 w-3 mr-1" />}

              {isLast ? (
                <span className="font-medium text-foreground" aria-current="page">
                  {item.title}
                </span>
              ) : (
                <Link href={item.href} className="hover:text-foreground transition-colors">
                  {item.title}
                </Link>
              )}

              {!isLast && <ChevronRight className="h-3 w-3 mx-1" />}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
