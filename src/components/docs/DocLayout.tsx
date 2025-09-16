'use client'

import { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/src/lib/utils'
import { Button } from '@/src/components/ui/button'
import { Input } from '@/src/components/ui/input'
import { Search, BookOpen, Code, Users, Menu, X } from 'lucide-react'
import { useState } from 'react'
import DocNavigation from './DocNavigation'
import DocSearch from './DocSearch'
import DocGuideSelector from './DocGuideSelector'

interface DocLayoutProps {
  children: ReactNode
  navigation: any[]
  docType: 'dev' | 'user'
  currentPath?: string
}

export default function DocLayout({
  children,
  navigation,
  docType,
  currentPath = ''
}: DocLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 hidden md:flex">
            <Link href="/docs" className="mr-6 flex items-center space-x-2">
              <BookOpen className="h-6 w-6 text-hera-primary" />
              <span className="hidden font-bold sm:inline-block">HERA Docs</span>
            </Link>
          </div>

          <Button
            variant="ghost"
            className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>

          <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
            <div className="w-full flex-1 md:w-auto md:flex-none">
              <DocSearch docType={docType} />
            </div>
            <nav className="flex items-center space-x-1">
              <DocGuideSelector currentType={docType} />
            </nav>
          </div>
        </div>
      </header>

      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        {/* Sidebar */}
        <aside
          className={cn(
            'fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 md:sticky md:block',
            sidebarOpen && 'block'
          )}
        >
          {sidebarOpen && (
            <div className="fixed inset-0 z-20 bg-background/80 backdrop-blur-sm md:hidden">
              <div className="fixed right-4 top-16 z-30">
                <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="relative overflow-hidden h-full py-6 pr-6 lg:py-8">
            <div className="h-full w-full">
              <DocNavigation
                navigation={navigation}
                docType={docType}
                currentPath={currentPath}
                onNavigate={() => setSidebarOpen(false)}
              />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="relative py-6 lg:gap-10 lg:py-8 xl:grid xl:grid-cols-[1fr_300px]">
          <div className="mx-auto w-full min-w-0">
            <div className="mb-4 flex items-center space-x-1 text-sm text-muted-foreground">
              <Link href="/docs" className="hover:text-foreground">
                Docs
              </Link>
              <span>/</span>
              <Link href={`/docs/${docType}`} className="hover:text-foreground capitalize">
                {docType === 'dev' ? 'Developer' : 'User'} Guide
              </Link>
              {currentPath && (
                <>
                  <span>/</span>
                  <span className="font-medium text-foreground">
                    {currentPath.split('/').pop()?.replace(/-/g, ' ')}
                  </span>
                </>
              )}
            </div>
            {children}
          </div>

          {/* Table of Contents - will be populated by DocContent component */}
          <div className="hidden text-sm xl:block">
            <div className="sticky top-16 -mt-10 pt-4">
              <div className="pb-4">
                <p className="font-medium text-foreground">On This Page</p>
              </div>
              <div id="toc-container" className="space-y-2">
                {/* Table of contents will be inserted here by DocContent */}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
