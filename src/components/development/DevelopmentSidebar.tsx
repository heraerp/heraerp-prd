'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Zap,
  TestTube,
  Code,
  Database,
  Settings,
  Home,
  ChevronLeft,
  ChevronRight,
  Rocket,
  Sparkles,
  Building2,
  Package,
  Monitor,
  FileText,
  Activity,
  BarChart3
} from 'lucide-react'

/**
 * Development Tools Sidebar
 *
 * Navigation for HERA development tools:
 * - Module Generator (NEW)
 * - Module Testing (NEW)
 * - Existing development tools
 */

const navigationItems = [
  {
    id: 'overview',
    name: 'Development Overview',
    href: '/development',
    icon: Home,
    description: 'Development tools dashboard',
    badge: null
  },
  {
    id: 'dashboard',
    name: 'HERA Dashboard',
    href: '/development/dashboard',
    icon: BarChart3,
    description: 'Meta-system tracking HERA development',
    badge: 'Live'
  },
  {
    id: 'generator',
    name: 'Module Generator',
    href: '/development/generator',
    icon: Zap,
    description: '200x faster module creation',
    badge: 'New'
  },
  {
    id: 'test',
    name: 'Module Testing',
    href: '/development/test',
    icon: TestTube,
    description: 'Verify generated modules work',
    badge: 'New'
  },
  {
    id: 'api-testing',
    name: 'API Testing',
    href: '/development/api-testing',
    icon: Activity,
    description: 'Test API endpoints',
    badge: null
  },
  {
    id: 'api-monitor',
    name: 'API Monitor',
    href: '/development/api-monitor',
    icon: Monitor,
    description: 'Monitor API performance',
    badge: null
  },
  {
    id: 'api-docs',
    name: 'API Documentation',
    href: '/development/api-docs',
    icon: FileText,
    description: 'Browse API documentation',
    badge: null
  }
]

export function DevelopmentSidebar() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div
      className={`${sidebarCollapsed ? 'w-16' : 'w-80'} transition-all duration-300 bg-background border-r border-border flex flex-col`}
    >
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          {!sidebarCollapsed && (
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-foreground" />
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    HERA DNA
                  </h1>
                  <p className="text-xs text-muted-foreground">Development Tools</p>
                </div>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 h-8 w-8"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 space-y-2">
        {navigationItems.map(item => {
          const IconComponent = item.icon
          const isActive = pathname === item.href
          const isDisabled = item.badge === 'Coming Soon'

          return (
            <Link
              key={item.id}
              href={isDisabled ? '#' : item.href}
              className={`block ${isDisabled ? 'pointer-events-none' : ''}`}
            >
              <div
                className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-foreground shadow-lg'
                    : isDisabled
                      ? 'text-muted-foreground cursor-not-allowed'
                      : 'text-gray-700 hover:bg-muted'
                }`}
              >
                <IconComponent className={`w-5 h-5 ${sidebarCollapsed ? 'mx-auto' : ''}`} />

                {!sidebarCollapsed && (
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div
                          className={`text-xs ${isActive ? 'text-purple-100' : 'text-muted-foreground'}`}
                        >
                          {item.description}
                        </div>
                      </div>
                      {item.badge && (
                        <Badge
                          variant={item.badge === 'New' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </div>

      {/* Footer */}
      {!sidebarCollapsed && (
        <div className="p-4 border-t border-border">
          <Card className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-purple-700">200x Acceleration</span>
            </div>
            <p className="text-xs text-purple-600">
              Generate complete modules in 30 seconds vs 26+ weeks manual development
            </p>
          </Card>
        </div>
      )}
    </div>
  )
}
