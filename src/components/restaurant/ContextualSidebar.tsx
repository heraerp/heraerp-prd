'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChevronLeft,
  ChevronRight,
  Home,
  MapPin,
  Utensils,
  Calendar,
  Users,
  BarChart3,
  Settings,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Zap,
  Clock,
  DollarSign,
  Activity,
  Bell,
  Star,
  Target,
  Layers,
  Command,
  ChefHat,
  Coffee,
  Package,
  Truck,
  CreditCard,
  FileText,
  HelpCircle,
  Lightbulb,
  Bookmark,
  Eye,
  Edit,
  Archive,
  Download,
  Upload,
  Share,
  Copy,
  Trash2,
  MoreVertical,
  ArrowUpRight
} from 'lucide-react'

// Steve Jobs principle: "Design is not just what it looks like and feels like. Design is how it works."

interface SidebarSection {
  id: string
  title: string
  items: SidebarItem[]
}

interface SidebarItem {
  id: string
  label: string
  icon: React.ReactNode
  href?: string
  action?: () => void
  badge?: string | number
  isActive?: boolean
  subitems?: SidebarItem[]
  description?: string
  hotkey?: string
}

interface ContextualSidebarProps {
  currentSection: string
  isCollapsed?: boolean
  onToggleCollapse?: () => void
  className?: string
}

export function ContextualSidebar({
  currentSection,
  isCollapsed = false,
  onToggleCollapse,
  className = ''
}: ContextualSidebarProps) {
  const pathname = usePathname()
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['main']))

  // Dynamic sidebar content based on current section
  const getSidebarContent = (): SidebarSection[] => {
    const baseSection: SidebarSection = {
      id: 'main',
      title: 'Restaurant',
      items: [
        {
          id: 'overview',
          label: 'Overview',
          icon: <Home className="w-5 h-5" />,
          href: '/restaurant',
          hotkey: '⌘1'
        },
        {
          id: 'tables',
          label: 'Tables',
          icon: <MapPin className="w-5 h-5" />,
          href: '/restaurant/table-management',
          badge: '12/24',
          hotkey: '⌘2'
        },
        {
          id: 'orders',
          label: 'Orders',
          icon: <Utensils className="w-5 h-5" />,
          href: '/restaurant/orders',
          badge: 8,
          hotkey: '⌘3'
        },
        {
          id: 'reservations',
          label: 'Reservations',
          icon: <Calendar className="w-5 h-5" />,
          href: '/restaurant/reservations',
          badge: 'Today: 24',
          hotkey: '⌘4'
        },
        {
          id: 'customers',
          label: 'Customers',
          icon: <Users className="w-5 h-5" />,
          href: '/restaurant/customers',
          hotkey: '⌘5'
        },
        {
          id: 'kitchen',
          label: 'Kitchen',
          icon: <ChefHat className="w-5 h-5" />,
          href: '/restaurant/kitchen',
          badge: 'LIVE',
          hotkey: '⌘K'
        },
        {
          id: 'analytics',
          label: 'Analytics',
          icon: <BarChart3 className="w-5 h-5" />,
          href: '/restaurant/analytics',
          hotkey: '⌘6'
        }
      ]
    }

    // Add contextual sections based on current page
    const sections = [baseSection]

    if (currentSection === 'table-management') {
      sections.push({
        id: 'table-actions',
        title: 'Table Actions',
        items: [
          {
            id: 'floor-plan',
            label: 'Floor Plan',
            icon: <Layers className="w-5 h-5" />,
            action: () => setActiveTab('floor-plan'),
            description: 'Drag & drop editor'
          },
          {
            id: 'combine-tables',
            label: 'Combine Tables',
            icon: <Plus className="w-5 h-5" />,
            action: () => setActiveTab('combination'),
            description: 'Merge for large parties'
          },
          {
            id: 'reservations-calendar',
            label: 'Reservations',
            icon: <Calendar className="w-5 h-5" />,
            action: () => setActiveTab('reservations'),
            badge: '3 upcoming'
          },
          {
            id: 'table-analytics',
            label: 'Performance',
            icon: <Target className="w-5 h-5" />,
            action: () => setActiveTab('analytics'),
            description: 'Table insights'
          }
        ]
      })

      sections.push({
        id: 'quick-filters',
        title: 'Quick Filters',
        items: [
          {
            id: 'available-tables',
            label: 'Available',
            icon: <Eye className="w-5 h-5" />,
            action: () => applyFilter('available'),
            badge: '12'
          },
          {
            id: 'occupied-tables',
            label: 'Occupied',
            icon: <Users className="w-5 h-5" />,
            action: () => applyFilter('occupied'),
            badge: '8'
          },
          {
            id: 'reserved-tables',
            label: 'Reserved',
            icon: <Bookmark className="w-5 h-5" />,
            action: () => applyFilter('reserved'),
            badge: '4'
          },
          {
            id: 'cleaning-tables',
            label: 'Cleaning',
            icon: <RefreshCw className="w-5 h-5" />,
            action: () => applyFilter('cleaning'),
            badge: '2'
          }
        ]
      })
    }

    if (currentSection === 'orders') {
      sections.push({
        id: 'order-actions',
        title: 'Order Management',
        items: [
          {
            id: 'new-order',
            label: 'New Order',
            icon: <Plus className="w-5 h-5" />,
            action: () => createNewOrder(),
            hotkey: '⌘N'
          },
          {
            id: 'kitchen-display',
            label: 'Kitchen View',
            icon: <ChefHat className="w-5 h-5" />,
            href: '/restaurant/kitchen'
          },
          {
            id: 'order-history',
            label: 'Order History',
            icon: <Archive className="w-5 h-5" />,
            action: () => showOrderHistory()
          }
        ]
      })
    }

    if (currentSection === 'kitchen') {
      sections.push({
        id: 'kitchen-actions',
        title: 'Kitchen Operations',
        items: [
          {
            id: 'timer-management',
            label: 'Timers',
            icon: <Clock className="w-5 h-5" />,
            action: () => toggleTimers(),
            badge: '3 active'
          },
          {
            id: 'station-view',
            label: 'Station View',
            icon: <Layers className="w-5 h-5" />,
            action: () => switchToStationView(),
            description: 'Filter by cooking station'
          },
          {
            id: 'priority-orders',
            label: 'Priority Queue',
            icon: <Zap className="w-5 h-5" />,
            action: () => showPriorityOrders(),
            badge: '2 urgent'
          },
          {
            id: 'chef-assignments',
            label: 'Chef Assignments',
            icon: <Users className="w-5 h-5" />,
            action: () => manageChefAssignments(),
            description: 'Assign orders to chefs'
          }
        ]
      })

      sections.push({
        id: 'kitchen-stations',
        title: 'Stations',
        items: [
          {
            id: 'grill-station',
            label: 'Grill',
            icon: <Zap className="w-5 h-5" />,
            action: () => filterByStation('grill'),
            badge: '3'
          },
          {
            id: 'saute-station',
            label: 'Sauté',
            icon: <ChefHat className="w-5 h-5" />,
            action: () => filterByStation('saute'),
            badge: '2'
          },
          {
            id: 'fryer-station',
            label: 'Fryer',
            icon: <Activity className="w-5 h-5" />,
            action: () => filterByStation('fryer'),
            badge: '1'
          },
          {
            id: 'cold-station',
            label: 'Cold Prep',
            icon: <Coffee className="w-5 h-5" />,
            action: () => filterByStation('cold'),
            badge: '2'
          }
        ]
      })
    }

    // Add system section at the bottom
    sections.push({
      id: 'system',
      title: 'System',
      items: [
        {
          id: 'settings',
          label: 'Settings',
          icon: <Settings className="w-5 h-5" />,
          href: '/restaurant/settings',
          hotkey: '⌘,'
        },
        {
          id: 'help',
          label: 'Help & Support',
          icon: <HelpCircle className="w-5 h-5" />,
          action: () => openHelp(),
          hotkey: '⌘?'
        }
      ]
    })

    return sections
  }

  // Action handlers
  const setActiveTab = (tab: string) => {
    // This would integrate with the parent component to switch tabs
    console.log('Switch to tab:', tab)
  }

  const applyFilter = (filter: string) => {
    // This would apply filters to the current view
    console.log('Apply filter:', filter)
  }

  const createNewOrder = () => {
    console.log('Create new order')
  }

  const showOrderHistory = () => {
    console.log('Show order history')
  }

  const openHelp = () => {
    console.log('Open help')
  }

  // Kitchen-specific action handlers
  const toggleTimers = () => {
    console.log('Toggle kitchen timers')
  }

  const switchToStationView = () => {
    console.log('Switch to station view')
  }

  const showPriorityOrders = () => {
    console.log('Show priority orders')
  }

  const manageChefAssignments = () => {
    console.log('Manage chef assignments')
  }

  const filterByStation = (station: string) => {
    console.log('Filter by station:', station)
  }

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const sidebarContent = getSidebarContent()

  if (isCollapsed) {
    return (
      <div
        className={`w-16 bg-background border-r border-border flex flex-col items-center py-4 space-y-4 ${className}`}
      >
        {/* Collapsed view - only icons */}
        <Button variant="ghost" size="sm" onClick={onToggleCollapse} className="w-10 h-10 p-0">
          <ChevronRight className="w-4 h-4" />
        </Button>

        {sidebarContent[0].items.map(item => (
          <div
            key={item.id}
            className="relative group"
            onMouseEnter={() => setHoveredItem(item.id)}
            onMouseLeave={() => setHoveredItem(null)}
          >
            {item.href ? (
              <Link href={item.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`w-10 h-10 p-0 ${ pathname === item.href ?'bg-blue-100 text-primary' : ''
                  }`}
                >
                  {item.icon}
                  {item.badge && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-foreground text-xs rounded-full flex items-center justify-center">
                      {typeof item.badge === 'string' && item.badge.length > 3 ? '•' : item.badge}
                    </span>
                  )}
                </Button>
              </Link>
            ) : (
              <Button variant="ghost" size="sm" className="w-10 h-10 p-0" onClick={item.action}>
                {item.icon}
              </Button>
            )}

            {/* Tooltip on hover */}
            {hoveredItem === item.id && (
              <div className="absolute left-full ml-2 top-0 z-50 bg-background text-foreground text-sm px-3 py-2 rounded-lg shadow-lg whitespace-nowrap">
                {item.label}
                {item.hotkey && <span className="ml-2 text-muted-foreground">{item.hotkey}</span>}
              </div>
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={`w-80 bg-background border-r border-border flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-100">Navigation</h2>
            <p className="text-sm text-muted-foreground mt-1">Context-aware shortcuts</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onToggleCollapse} className="w-8 h-8 p-0">
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto py-4 space-y-6">
        {sidebarContent.map(section => (
          <div key={section.id} className="px-6">
            <div
              className="flex items-center justify-between mb-3 cursor-pointer"
              onClick={() => toggleSection(section.id)}
            >
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {section.title}
              </h3>
              <ChevronRight
                className={`w-3 h-3 text-muted-foreground transition-transform ${ expandedSections.has(section.id) ?'rotate-90' : ''
                }`}
              />
            </div>

            {expandedSections.has(section.id) && (
              <div className="space-y-1">
                {section.items.map(item => (
                  <div key={item.id} className="group">
                    {item.href ? (
                      <Link href={item.href}>
                        <div
                          className={`flex items-center justify-between p-3 rounded-lg transition-all hover:bg-muted ${ pathname === item.href ?'bg-blue-50 text-primary border-l-4 border-blue-500 pl-2'
                              : 'text-gray-700 hover:text-foreground'
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            {item.icon}
                            <div>
                              <span className="text-sm font-medium">{item.label}</span>
                              {item.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {item.description}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {item.badge && (
                              <Badge
                                variant="secondary"
                                className="text-xs bg-muted text-muted-foreground"
                              >
                                {item.badge}
                              </Badge>
                            )}
                            {item.hotkey && (
                              <span className="text-xs text-muted-foreground font-mono">
                                {item.hotkey}
                              </span>
                            )}
                            <ArrowUpRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      </Link>
                    ) : (
                      <div
                        className="flex items-center justify-between p-3 rounded-lg transition-all hover:bg-muted cursor-pointer ink hover:text-foreground"
                        onClick={item.action}
                      >
                        <div className="flex items-center space-x-3">
                          {item.icon}
                          <div>
                            <span className="text-sm font-medium">{item.label}</span>
                            {item.description && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {item.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {item.badge && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-muted text-muted-foreground"
                            >
                              {item.badge}
                            </Badge>
                          )}
                          {item.hotkey && (
                            <span className="text-xs text-muted-foreground font-mono">
                              {item.hotkey}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer with keyboard shortcuts hint */}
      <div className="p-6 border-t border-border">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Press ⌘K for quick actions</span>
          <div className="flex items-center space-x-1">
            <Command className="w-3 h-3" />
            <span>+</span>
            <span className="font-mono">K</span>
          </div>
        </div>
      </div>
    </div>
  )
}
