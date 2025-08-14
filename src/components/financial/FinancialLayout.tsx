'use client'

import React from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen,
  Settings,
  FileText,
  BarChart3,
  Calculator,
  TrendingUp,
  Building,
  Users,
  ChevronRight,
  Home,
  ArrowLeft
} from 'lucide-react'
import { HeraThemeToggle } from '@/components/universal/ui/HeraThemeProvider'

interface FinancialLayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
  showBackButton?: boolean
  backUrl?: string
  actions?: React.ReactNode
}

interface NavItem {
  id: string
  label: string
  href: string
  icon: React.ComponentType<any>
  description: string
  isActive?: boolean
  badge?: string
}

export default function FinancialLayout({ 
  children, 
  title, 
  subtitle, 
  showBackButton = false, 
  backUrl = '/coa',
  actions 
}: FinancialLayoutProps) {
  const router = useRouter()
  const pathname = usePathname()

  const navigationItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'COA Dashboard',
      href: '/coa',
      icon: BookOpen,
      description: 'Chart of Accounts overview and management',
      isActive: pathname === '/coa'
    },
    {
      id: 'setup',
      label: 'COA Setup',
      href: '/coa/setup',
      icon: Settings,
      description: 'Configure Chart of Accounts templates',
      isActive: pathname.startsWith('/coa/setup')
    },
    {
      id: 'accounts',
      label: 'GL Accounts',
      href: '/coa/accounts',
      icon: Calculator,
      description: 'Manage General Ledger accounts',
      isActive: pathname.startsWith('/coa/accounts')
    },
    {
      id: 'templates',
      label: 'Templates',
      href: '/coa/templates',
      icon: FileText,
      description: 'Industry-specific COA templates',
      isActive: pathname.startsWith('/coa/templates')
    },
    {
      id: 'reports',
      label: 'Financial Reports',
      href: '/financial/reports',
      icon: BarChart3,
      description: 'Generate financial statements and reports',
      isActive: pathname.startsWith('/financial/reports'),
      badge: 'New'
    },
    {
      id: 'accounting',
      label: 'Accounting Hub',
      href: '/accounting',
      icon: Building,
      description: 'Main accounting operations center',
      isActive: pathname === '/accounting'
    }
  ]

  const getBreadcrumbs = () => {
    const pathSegments = pathname.split('/').filter(Boolean)
    const breadcrumbs = [
      { label: 'Home', href: '/', icon: Home }
    ]

    if (pathSegments.includes('coa')) {
      breadcrumbs.push({ label: 'Financial', href: '/coa', icon: BookOpen })
      
      if (pathSegments.includes('setup')) {
        breadcrumbs.push({ label: 'COA Setup', href: '/coa/setup', icon: Settings })
      } else if (pathSegments.includes('accounts')) {
        breadcrumbs.push({ label: 'GL Accounts', href: '/coa/accounts', icon: Calculator })
      } else if (pathSegments.includes('templates')) {
        breadcrumbs.push({ label: 'Templates', href: '/coa/templates', icon: FileText })
      }
    } else if (pathSegments.includes('financial')) {
      breadcrumbs.push({ label: 'Financial', href: '/coa', icon: BookOpen })
      breadcrumbs.push({ label: 'Reports', href: '/financial/reports', icon: BarChart3 })
    } else if (pathSegments.includes('accounting')) {
      breadcrumbs.push({ label: 'Accounting', href: '/accounting', icon: Building })
    }

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Header */}
      <div className="bg-card border-b border-border transition-colors duration-300 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumbs */}
          <div className="flex items-center space-x-2 py-3 border-b border-border/50">
            {breadcrumbs.map((crumb, index) => {
              const Icon = crumb.icon
              const isLast = index === breadcrumbs.length - 1
              
              return (
                <div key={crumb.href} className="flex items-center">
                  <button
                    onClick={() => router.push(crumb.href)}
                    className={`flex items-center space-x-1 text-sm transition-colors ${
                      isLast 
                        ? 'text-foreground font-medium' 
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{crumb.label}</span>
                  </button>
                  {!isLast && (
                    <ChevronRight className="w-4 h-4 text-muted-foreground mx-2" />
                  )}
                </div>
              )
            })}
          </div>

          {/* Main Header */}
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {showBackButton && (
                  <Button 
                    variant="ghost" 
                    onClick={() => router.push(backUrl)}
                    className="p-2"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                )}
                <div>
                  <h1 className="text-3xl font-bold text-foreground">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="text-muted-foreground mt-1">
                      {subtitle}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <HeraThemeToggle />
                {actions}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Bar */}
      <div className="bg-card/50 border-b border-border/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-1 py-3 overflow-x-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon
              
              return (
                <button
                  key={item.id}
                  onClick={() => router.push(item.href)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                    item.isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }`}
                  title={item.description}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {item.badge && (
                    <Badge variant="secondary" className="ml-1 text-xs px-1.5 py-0.5">
                      {item.badge}
                    </Badge>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">HERA</span> Universal Financial System
              </div>
              <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                <span>6-Table Architecture</span>
                <span>•</span>
                <span>Universal Business Logic</span>
                <span>•</span>
                <span>Multi-Tenant Ready</span>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Documentation
              </button>
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Support
              </button>
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                API Reference
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}