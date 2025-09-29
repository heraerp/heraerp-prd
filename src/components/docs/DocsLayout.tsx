'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { ChevronRight, Menu, X, Book, FileText, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MarkdownRenderer } from './MarkdownRenderer'
import { TableOfContents } from './TableOfContents'
import { DocsSearch } from './DocsSearch'

interface DocItem {
  title: string
  href: string
  items?: DocItem[]
}

interface DocsLayoutProps {
  content: string
  sidebar: DocItem[]
  breadcrumbs?: { label: string; href: string }[]
}

export function DocsLayout({ content, sidebar, breadcrumbs = [] }: DocsLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  const renderSidebarItem = (item: DocItem, level = 0) => {
    const isActive = pathname === item.href
    const hasChildren = item.items && item.items.length > 0

    return (
      <li key={item.href}>
        <Link
          href={item.href}
          className={cn(
            'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200',
            'hover:bg-slate-100 dark:hover:bg-slate-800',
            isActive && 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700',
            !isActive && 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100'
          )}
          style={{ paddingLeft: `${level * 16 + 16}px` }}
        >
          {level === 0 ? (
            <Book className={cn('h-4 w-4', isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400')} />
          ) : (
            <FileText className={cn('h-4 w-4', isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500')} />
          )}
          {item.title}
        </Link>
        {hasChildren && (
          <ul className="mt-1">
            {item.items!.map((child) => renderSidebarItem(child, level + 1))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <div className="flex min-h-screen">
      {/* Mobile sidebar toggle */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed left-4 top-20 z-50 lg:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-72 transform bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform lg:relative lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex-1 overflow-y-auto px-6 py-8">
            <h3 className="mb-6 text-xl font-semibold text-slate-900 dark:text-slate-100">Documentation</h3>
            <nav>
              <ul className="space-y-1">
                {sidebar.map((item) => renderSidebarItem(item))}
              </ul>
            </nav>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1">
        {/* Header with search */}
        <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-slate-200 dark:border-slate-700">
          <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
            <Link href="/docs/civicflow" className="text-xl font-semibold text-slate-900 dark:text-slate-100">
              Civicflow Docs
            </Link>
            <DocsSearch className="w-96" />
          </div>
        </header>
        
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <nav className="mb-8 flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
              <Link href="/docs" className="hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                <Home className="h-4 w-4" />
              </Link>
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center space-x-2">
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 dark:text-slate-600" />
                  <Link
                    href={crumb.href}
                    className={cn(
                      'hover:text-slate-700 dark:hover:text-slate-300 transition-colors',
                      index === breadcrumbs.length - 1 && 'text-slate-900 dark:text-slate-100 font-semibold'
                    )}
                  >
                    {crumb.label}
                  </Link>
                </div>
              ))}
            </nav>
          )}

          {/* Content with TOC */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr,200px]">
            <div className="min-w-0">
              <MarkdownRenderer content={content} />
            </div>
            
            {/* Table of contents - desktop only */}
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <TableOfContents content={content} className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 backdrop-blur-sm p-5" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  )
}