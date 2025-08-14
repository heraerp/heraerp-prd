'use client'

import React, { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Building2,
  Users,
  FileText,
  MessageSquare,
  BarChart3,
  Settings,
  HelpCircle,
  ChevronRight,
  Menu,
  X,
  Bell,
  Calendar,
  Shield,
  FolderOpen,
  ClipboardCheck,
  TrendingUp,
  UserCheck,
  FileSearch,
  Package,
  Upload,
  CheckCircle2,
  Clock,
  Eye,
  PieChart,
  FileCheck,
  Target,
  AlertCircle,
  BookOpen,
  Download
} from 'lucide-react'
import { Button } from '@/components/ui/button'
// Removed tooltip imports for simpler implementation
import { Badge } from '@/components/ui/badge'

interface NavItem {
  id: string
  label: string
  icon: React.ElementType
  href: string
  badge?: number
  description?: string
  subItems?: NavItem[]
}

interface AuditSidebarProps {
  isClient?: boolean
  user?: {
    name: string
    role: string
    avatar?: string
  }
}

export function AuditSidebar({ isClient = false, user }: AuditSidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeItem, setActiveItem] = useState<string>('')

  // Define navigation items based on user type
  const auditorNavItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      href: '/audit-progressive',
      description: 'Overview and statistics'
    },
    {
      id: 'clients',
      label: 'Clients',
      icon: Building2,
      href: '/audit-progressive/clients',
      badge: 12,
      description: 'Manage audit clients'
    },
    {
      id: 'teams',
      label: 'Teams',
      icon: Users,
      href: '/audit-progressive/teams',
      description: 'Team management'
    },
    {
      id: 'documents',
      label: 'Documents',
      icon: FileText,
      href: '/audit-progressive/documents',
      badge: 47,
      description: 'Document tracking'
    },
    {
      id: 'workpapers',
      label: 'Working Papers',
      icon: ClipboardCheck,
      href: '/audit-progressive/workpapers',
      description: 'Audit work papers'
    },
    {
      id: 'planning',
      label: 'Planning',
      icon: Calendar,
      href: '/audit-progressive/planning',
      description: 'Audit planning'
    },
    {
      id: 'risk',
      label: 'Risk Assessment',
      icon: Shield,
      href: '/audit-progressive/risk',
      description: 'Risk evaluation'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      href: '/audit-progressive/analytics',
      description: 'Reports and insights'
    },
    {
      id: 'messages',
      label: 'Messages',
      icon: MessageSquare,
      href: '/audit-progressive/messages',
      badge: 3,
      description: 'Team communication'
    }
  ]

  const clientNavItems: NavItem[] = [
    {
      id: 'overview',
      label: 'My Audit',
      icon: PieChart,
      href: '/audit-progressive/client-portal/dashboard',
      description: 'Audit progress overview'
    },
    {
      id: 'documents',
      label: 'Upload Documents',
      icon: Upload,
      href: '/audit-progressive/client-portal/documents',
      badge: 5,
      description: 'Submit required documents'
    },
    {
      id: 'status',
      label: 'Progress Tracker',
      icon: Target,
      href: '/audit-progressive/client-portal/status',
      description: 'Track audit milestones'
    },
    {
      id: 'pending',
      label: 'Action Required',
      icon: AlertCircle,
      href: '/audit-progressive/client-portal/pending',
      badge: 3,
      description: 'Items needing attention'
    },
    {
      id: 'messages',
      label: 'Chat with Auditors',
      icon: MessageSquare,
      href: '/audit-progressive/client-portal/messages',
      badge: 2,
      description: 'Direct communication'
    },
    {
      id: 'team',
      label: 'My Audit Team',
      icon: Users,
      href: '/audit-progressive/client-portal/team',
      description: 'Meet your auditors'
    },
    {
      id: 'timeline',
      label: 'Audit Timeline',
      icon: Clock,
      href: '/audit-progressive/client-portal/timeline',
      description: 'Key dates and deadlines'
    },
    {
      id: 'reports',
      label: 'Final Reports',
      icon: Download,
      href: '/audit-progressive/client-portal/reports',
      description: 'Download completed reports'
    }
  ]

  const navItems = isClient ? clientNavItems : auditorNavItems

  const bottomNavItems: NavItem[] = [
    {
      id: 'notifications',
      label: 'Notifications',
      icon: Bell,
      href: '#',
      badge: 5,
      description: 'View notifications'
    },
    {
      id: 'help',
      label: 'Help',
      icon: HelpCircle,
      href: '/audit-progressive/help',
      description: 'Get support'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      href: '/audit-progressive/settings',
      description: 'Preferences'
    }
  ]

  const handleNavClick = (item: NavItem) => {
    if (item.href !== '#') {
      router.push(item.href)
    }
    setActiveItem(item.id)
  }

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <>
      {/* Mobile Toggle Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-white border-r border-gray-200 transition-all duration-300",
          isExpanded ? "w-64" : "w-16",
          "lg:relative lg:block",
          !isExpanded && "hidden lg:block"
        )}
        onMouseEnter={() => !isExpanded && setIsExpanded(true)}
        onMouseLeave={() => isExpanded && setIsExpanded(false)}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="h-16 flex items-center justify-center border-b border-gray-200 px-3">
            {isExpanded ? (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="font-semibold text-gray-900">
                  {isClient ? 'Client Portal' : 'GSPU Audit'}
                </span>
              </div>
            ) : (
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
            )}
          </div>

          {/* User Profile (when expanded) */}
          {isExpanded && user && (
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500">{user.role}</p>
                </div>
              </div>
            </div>
          )}

          {/* Main Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {navItems.map((item) => {
                const isItemActive = isActive(item.href)
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => handleNavClick(item)}
                      title={!isExpanded ? `${item.label}${item.badge ? ` (${item.badge})` : ''}` : ''}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                        isItemActive 
                          ? "bg-gradient-to-r from-emerald-50 to-blue-50 text-emerald-700 shadow-sm" 
                          : "hover:bg-gray-100 text-gray-700 hover:text-gray-900",
                        !isExpanded && "justify-center"
                      )}
                    >
                      <item.icon className={cn(
                        "flex-shrink-0 transition-colors",
                        isItemActive ? "w-5 h-5 text-emerald-600" : "w-5 h-5 text-gray-500 group-hover:text-gray-700"
                      )} />
                      
                      {isExpanded && (
                        <>
                          <span className="flex-1 text-left text-sm font-medium">
                            {item.label}
                          </span>
                          {item.badge && item.badge > 0 && (
                            <Badge 
                              variant="secondary" 
                              className={cn(
                                "ml-auto",
                                isItemActive 
                                  ? "bg-emerald-600 text-white" 
                                  : "bg-gray-200 text-gray-700"
                              )}
                            >
                              {item.badge}
                            </Badge>
                          )}
                          {item.subItems && (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </>
                      )}
                      {!isExpanded && item.badge && item.badge > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Bottom Navigation */}
          <div className="border-t border-gray-200 py-2">
            <ul className="space-y-1 px-2">
              {bottomNavItems.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => handleNavClick(item)}
                    title={!isExpanded ? item.label : ''}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                      "hover:bg-gray-100 text-gray-700 hover:text-gray-900",
                      !isExpanded && "justify-center"
                    )}
                  >
                    <div className="relative">
                      <item.icon className="w-5 h-5 text-gray-500 group-hover:text-gray-700" />
                      {item.badge && item.badge > 0 && !isExpanded && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </div>
                    
                    {isExpanded && (
                      <>
                        <span className="flex-1 text-left text-sm font-medium">
                          {item.label}
                        </span>
                        {item.badge && item.badge > 0 && (
                          <Badge variant="destructive" size="sm">
                            {item.badge}
                          </Badge>
                        )}
                      </>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Expand/Collapse Toggle for Desktop */}
          <div className="hidden lg:block border-t border-gray-200 p-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "w-full",
                !isExpanded && "px-0"
              )}
            >
              {isExpanded ? (
                <>
                  <ChevronRight className="w-4 h-4 rotate-180 mr-2" />
                  <span className="text-xs">Collapse</span>
                </>
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {isExpanded && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsExpanded(false)}
        />
      )}
    </>
  )
}