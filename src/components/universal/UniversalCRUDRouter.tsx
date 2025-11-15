'use client'

/**
 * Universal CRUD Router Component
 * Smart Code: HERA.UNIVERSAL.COMPONENT.CRUD_ROUTER.v1
 * 
 * Seamless navigation and routing between Universal CRUD systems:
 * - Context-aware navigation between Entity, Transaction, Relationship, and Workflow systems
 * - Deep linking with preserved state and filters
 * - Cross-system data relationships and references
 * - Breadcrumb navigation with system awareness
 * - Mobile-first responsive navigation
 * - Search across all CRUD systems
 * - Recent items and favorites
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { 
  Search,
  Star,
  Clock,
  ArrowRight,
  Home,
  Database,
  FileText,
  GitBranch,
  Activity,
  Users,
  Building,
  Package,
  Target,
  Link,
  Filter,
  Settings,
  BookOpen,
  BarChart3,
  Zap,
  Grid3X3,
  List,
  Eye,
  Edit3,
  Plus,
  ExternalLink,
  ChevronRight,
  ChevronDown
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from '@/components/ui/dropdown-menu'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'

export interface CRUDSystem {
  id: string
  name: string
  description: string
  icon: React.ComponentType<any>
  color: string
  baseRoute: string
  features: string[]
  status: 'active' | 'beta' | 'coming_soon'
}

export interface CRUDRoute {
  id: string
  system_id: string
  path: string
  title: string
  description: string
  icon?: React.ComponentType<any>
  params?: Record<string, string>
  requiresAuth?: boolean
  metadata?: Record<string, any>
}

export interface RecentItem {
  id: string
  system_id: string
  route_id: string
  title: string
  subtitle?: string
  icon?: React.ComponentType<any>
  accessed_at: string
  metadata?: Record<string, any>
}

export interface CrossSystemLink {
  id: string
  from_system: string
  to_system: string
  from_entity_id: string
  to_entity_id: string
  link_type: string
  title: string
  description?: string
  created_at: string
}

interface UniversalCRUDRouterProps {
  currentSystem?: string
  currentRoute?: string
  onNavigate?: (route: CRUDRoute) => void
  onSystemChange?: (systemId: string) => void
  showGlobalSearch?: boolean
  showRecentItems?: boolean
  showFavorites?: boolean
  className?: string
}

// CRUD Systems Definition
const crudSystems: CRUDSystem[] = [
  {
    id: 'entities',
    name: 'Entity Management',
    description: 'Manage customers, vendors, products, and all business entities',
    icon: Database,
    color: 'text-blue-600 bg-blue-50',
    baseRoute: '/universal/entities',
    features: ['CRUD Operations', 'Advanced Search', 'Bulk Operations', 'Import/Export'],
    status: 'active'
  },
  {
    id: 'transactions',
    name: 'Transaction Processing',
    description: 'Create, manage, and track business transactions',
    icon: FileText,
    color: 'text-green-600 bg-green-50',
    baseRoute: '/universal/transactions',
    features: ['Transaction Builder', 'Line Items', 'AI Insights', 'Approval Workflow'],
    status: 'active'
  },
  {
    id: 'relationships',
    name: 'Relationship Mapping',
    description: 'Visualize and manage entity relationships and hierarchies',
    icon: GitBranch,
    color: 'text-purple-600 bg-purple-50',
    baseRoute: '/universal/relationships',
    features: ['Graph Visualization', 'Tree Views', 'Bulk Import', 'Relationship Types'],
    status: 'active'
  },
  {
    id: 'workflows',
    name: 'Workflow Designer',
    description: 'Design, execute, and monitor business workflows',
    icon: Activity,
    color: 'text-orange-600 bg-orange-50',
    baseRoute: '/universal/workflows',
    features: ['Visual Designer', 'Template Library', 'Execution Monitoring', 'User Tasks'],
    status: 'active'
  }
]

// Route Definitions
const crudRoutes: CRUDRoute[] = [
  // Entity Routes
  {
    id: 'entities-list',
    system_id: 'entities',
    path: '/universal/entities',
    title: 'All Entities',
    description: 'Browse and manage all entities',
    icon: List
  },
  {
    id: 'entities-create',
    system_id: 'entities',
    path: '/universal/entities/create',
    title: 'Create Entity',
    description: 'Add a new entity',
    icon: Plus
  },
  {
    id: 'entities-customers',
    system_id: 'entities',
    path: '/universal/entities?type=CUSTOMER',
    title: 'Customers',
    description: 'Manage customer entities',
    icon: Users
  },
  {
    id: 'entities-vendors',
    system_id: 'entities',
    path: '/universal/entities?type=VENDOR',
    title: 'Vendors',
    description: 'Manage vendor entities',
    icon: Building
  },
  {
    id: 'entities-products',
    system_id: 'entities',
    path: '/universal/entities?type=PRODUCT',
    title: 'Products',
    description: 'Manage product catalog',
    icon: Package
  },

  // Transaction Routes
  {
    id: 'transactions-list',
    system_id: 'transactions',
    path: '/universal/transactions',
    title: 'All Transactions',
    description: 'Browse and manage all transactions',
    icon: List
  },
  {
    id: 'transactions-create',
    system_id: 'transactions',
    path: '/universal/transactions/create',
    title: 'Create Transaction',
    description: 'Start a new transaction',
    icon: Plus
  },
  {
    id: 'transactions-sales',
    system_id: 'transactions',
    path: '/universal/transactions?type=SALE',
    title: 'Sales Transactions',
    description: 'Manage sales and invoices',
    icon: Target
  },
  {
    id: 'transactions-purchases',
    system_id: 'transactions',
    path: '/universal/transactions?type=PURCHASE',
    title: 'Purchase Orders',
    description: 'Manage purchases and expenses',
    icon: FileText
  },

  // Relationship Routes
  {
    id: 'relationships-graph',
    system_id: 'relationships',
    path: '/universal/relationships?view=graph',
    title: 'Relationship Graph',
    description: 'Interactive relationship visualization',
    icon: GitBranch
  },
  {
    id: 'relationships-tree',
    system_id: 'relationships',
    path: '/universal/relationships?view=tree',
    title: 'Hierarchy Tree',
    description: 'Hierarchical relationship view',
    icon: Grid3X3
  },
  {
    id: 'relationships-create',
    system_id: 'relationships',
    path: '/universal/relationships/create',
    title: 'Create Relationship',
    description: 'Link entities together',
    icon: Link
  },

  // Workflow Routes
  {
    id: 'workflows-list',
    system_id: 'workflows',
    path: '/universal/workflows',
    title: 'All Workflows',
    description: 'Browse workflow definitions',
    icon: List
  },
  {
    id: 'workflows-designer',
    system_id: 'workflows',
    path: '/universal/workflows/designer',
    title: 'Workflow Designer',
    description: 'Create and edit workflows',
    icon: Settings
  },
  {
    id: 'workflows-executions',
    system_id: 'workflows',
    path: '/universal/workflows/executions',
    title: 'Workflow Executions',
    description: 'Monitor running workflows',
    icon: Activity
  },
  {
    id: 'workflows-tasks',
    system_id: 'workflows',
    path: '/universal/workflows/tasks',
    title: 'My Tasks',
    description: 'Pending workflow tasks',
    icon: Clock
  }
]

export function UniversalCRUDRouter({
  currentSystem,
  currentRoute,
  onNavigate,
  onSystemChange,
  showGlobalSearch = true,
  showRecentItems = true,
  showFavorites = true,
  className = ''
}: UniversalCRUDRouterProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSystem, setSelectedSystem] = useState(currentSystem || 'entities')
  const [recentItems, setRecentItems] = useState<RecentItem[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [crossSystemLinks, setCrossSystemLinks] = useState<CrossSystemLink[]>([])
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [expandedSystems, setExpandedSystems] = useState<Set<string>>(new Set(['entities']))

  // Load recent items and favorites from localStorage
  useEffect(() => {
    const savedRecent = localStorage.getItem('hera_recent_crud_items')
    const savedFavorites = localStorage.getItem('hera_favorite_crud_routes')
    
    if (savedRecent) {
      try {
        setRecentItems(JSON.parse(savedRecent))
      } catch (e) {
        console.error('Failed to parse recent items:', e)
      }
    }

    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites))
      } catch (e) {
        console.error('Failed to parse favorites:', e)
      }
    }
  }, [])

  // Filter routes based on search
  const filteredRoutes = useMemo(() => {
    if (!searchQuery) return crudRoutes

    const query = searchQuery.toLowerCase()
    return crudRoutes.filter(route =>
      route.title.toLowerCase().includes(query) ||
      route.description.toLowerCase().includes(query) ||
      route.path.toLowerCase().includes(query)
    )
  }, [searchQuery])

  // Group routes by system
  const routesBySystem = useMemo(() => {
    return crudSystems.reduce((acc, system) => {
      acc[system.id] = filteredRoutes.filter(route => route.system_id === system.id)
      return acc
    }, {} as Record<string, CRUDRoute[]>)
  }, [filteredRoutes])

  // Handle navigation
  const handleNavigate = useCallback((route: CRUDRoute) => {
    // Add to recent items
    const recentItem: RecentItem = {
      id: `recent_${Date.now()}`,
      system_id: route.system_id,
      route_id: route.id,
      title: route.title,
      subtitle: crudSystems.find(s => s.id === route.system_id)?.name,
      icon: route.icon,
      accessed_at: new Date().toISOString()
    }

    setRecentItems(prev => {
      const filtered = prev.filter(item => item.route_id !== route.id)
      const updated = [recentItem, ...filtered].slice(0, 10) // Keep last 10 items
      localStorage.setItem('hera_recent_crud_items', JSON.stringify(updated))
      return updated
    })

    // Call navigation handler
    if (onNavigate) {
      onNavigate(route)
    } else {
      router.push(route.path)
    }

    setIsSearchOpen(false)
  }, [onNavigate, router])

  // Handle system change
  const handleSystemChange = useCallback((systemId: string) => {
    setSelectedSystem(systemId)
    onSystemChange?.(systemId)
    
    // Expand the selected system
    setExpandedSystems(prev => new Set([...prev, systemId]))
  }, [onSystemChange])

  // Toggle favorite
  const toggleFavorite = useCallback((routeId: string) => {
    setFavorites(prev => {
      const updated = prev.includes(routeId)
        ? prev.filter(id => id !== routeId)
        : [...prev, routeId]
      
      localStorage.setItem('hera_favorite_crud_routes', JSON.stringify(updated))
      return updated
    })
  }, [])

  // Toggle system expansion
  const toggleSystemExpansion = useCallback((systemId: string) => {
    setExpandedSystems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(systemId)) {
        newSet.delete(systemId)
      } else {
        newSet.add(systemId)
      }
      return newSet
    })
  }, [])

  // Get current breadcrumbs
  const breadcrumbs = useMemo(() => {
    const currentRouteObj = crudRoutes.find(r => r.path === pathname)
    const currentSystemObj = crudSystems.find(s => s.id === currentSystem)

    const crumbs = [{ label: 'Universal CRUD', path: '/universal' }]

    if (currentSystemObj) {
      crumbs.push({
        label: currentSystemObj.name,
        path: currentSystemObj.baseRoute
      })
    }

    if (currentRouteObj && currentRouteObj.path !== currentSystemObj?.baseRoute) {
      crumbs.push({
        label: currentRouteObj.title,
        path: currentRouteObj.path
      })
    }

    return crumbs
  }, [pathname, currentSystem])

  // Generate cross-system suggestions
  const crossSystemSuggestions = useMemo(() => {
    if (!currentSystem) return []

    const suggestions: Array<{ route: CRUDRoute; reason: string }> = []

    // Example logic for cross-system suggestions
    if (currentSystem === 'entities') {
      suggestions.push(
        {
          route: crudRoutes.find(r => r.id === 'relationships-graph')!,
          reason: 'Visualize entity relationships'
        },
        {
          route: crudRoutes.find(r => r.id === 'transactions-create')!,
          reason: 'Create transactions for entities'
        }
      )
    }

    if (currentSystem === 'transactions') {
      suggestions.push(
        {
          route: crudRoutes.find(r => r.id === 'workflows-designer')!,
          reason: 'Automate transaction approval'
        },
        {
          route: crudRoutes.find(r => r.id === 'entities-customers')!,
          reason: 'Manage transaction parties'
        }
      )
    }

    return suggestions.filter(s => s.route)
  }, [currentSystem])

  return (
    <div className={cn("w-full", className)}>
      {/* Global Search Command */}
      {showGlobalSearch && (
        <div className="mb-6">
          <Popover open={isSearchOpen} onOpenChange={setIsSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-muted-foreground"
              >
                <Search size={16} className="mr-2" />
                Search CRUD systems...
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[400px] p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Search routes, systems, features..."
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  
                  {/* Systems */}
                  <CommandGroup heading="Systems">
                    {crudSystems.map((system) => (
                      <CommandItem
                        key={system.id}
                        onSelect={() => {
                          handleNavigate(crudRoutes.find(r => r.system_id === system.id)!)
                        }}
                      >
                        <system.icon size={16} className="mr-2" />
                        <div className="flex-1">
                          <div className="font-medium">{system.name}</div>
                          <div className="text-xs text-muted-foreground">{system.description}</div>
                        </div>
                        <Badge variant="outline" className={system.color}>
                          {system.status}
                        </Badge>
                      </CommandItem>
                    ))}
                  </CommandGroup>

                  <CommandSeparator />

                  {/* Routes */}
                  {Object.entries(routesBySystem).map(([systemId, routes]) => {
                    const system = crudSystems.find(s => s.id === systemId)
                    if (!system || routes.length === 0) return null

                    return (
                      <CommandGroup key={systemId} heading={system.name}>
                        {routes.map((route) => {
                          const Icon = route.icon || system.icon
                          return (
                            <CommandItem
                              key={route.id}
                              onSelect={() => handleNavigate(route)}
                            >
                              <Icon size={16} className="mr-2" />
                              <div className="flex-1">
                                <div className="font-medium">{route.title}</div>
                                <div className="text-xs text-muted-foreground">{route.description}</div>
                              </div>
                              {favorites.includes(route.id) && (
                                <Star size={12} className="text-yellow-500 fill-current" />
                              )}
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    )
                  })}

                  {/* Recent Items */}
                  {showRecentItems && recentItems.length > 0 && (
                    <>
                      <CommandSeparator />
                      <CommandGroup heading="Recent">
                        {recentItems.slice(0, 5).map((item) => {
                          const route = crudRoutes.find(r => r.id === item.route_id)
                          if (!route) return null

                          const Icon = item.icon || Clock
                          return (
                            <CommandItem
                              key={item.id}
                              onSelect={() => handleNavigate(route)}
                            >
                              <Icon size={16} className="mr-2" />
                              <div className="flex-1">
                                <div className="font-medium">{item.title}</div>
                                <div className="text-xs text-muted-foreground">{item.subtitle}</div>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(item.accessed_at).toLocaleDateString()}
                              </div>
                            </CommandItem>
                          )
                        })}
                      </CommandGroup>
                    </>
                  )}
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}

      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Home size={14} />
        {breadcrumbs.map((crumb, index) => (
          <React.Fragment key={crumb.path}>
            {index > 0 && <ChevronRight size={14} />}
            <button
              onClick={() => router.push(crumb.path)}
              className="hover:text-foreground transition-colors"
            >
              {crumb.label}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* CRUD Systems Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {crudSystems.map((system) => {
          const Icon = system.icon
          const isSelected = selectedSystem === system.id
          const routeCount = routesBySystem[system.id]?.length || 0

          return (
            <Card
              key={system.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-lg",
                isSelected && "ring-2 ring-blue-500 shadow-lg"
              )}
              onClick={() => handleSystemChange(system.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={cn("p-2 rounded-lg", system.color)}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base truncate">{system.name}</CardTitle>
                    <Badge 
                      variant={system.status === 'active' ? 'default' : 'secondary'}
                      className="text-xs mt-1"
                    >
                      {system.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{system.description}</p>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{routeCount} routes</span>
                  <Button variant="ghost" size="sm" asChild>
                    <span>Explore <ExternalLink size={12} className="ml-1" /></span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* System Routes Navigation */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Navigation Tree */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid3X3 size={20} />
                Navigation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {crudSystems.map((system) => {
                  const routes = routesBySystem[system.id] || []
                  const Icon = system.icon
                  const isExpanded = expandedSystems.has(system.id)
                  
                  return (
                    <Collapsible
                      key={system.id}
                      open={isExpanded}
                      onOpenChange={() => toggleSystemExpansion(system.id)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button
                          variant="ghost"
                          className="w-full justify-start p-2 h-auto"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className={cn("p-1.5 rounded", system.color)}>
                              <Icon size={16} />
                            </div>
                            <div className="text-left">
                              <div className="font-medium text-sm">{system.name}</div>
                              <div className="text-xs text-muted-foreground">{routes.length} routes</div>
                            </div>
                          </div>
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pl-6 space-y-1">
                        {routes.map((route) => {
                          const RouteIcon = route.icon || ArrowRight
                          const isFavorite = favorites.includes(route.id)

                          return (
                            <div
                              key={route.id}
                              className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer group"
                              onClick={() => handleNavigate(route)}
                            >
                              <RouteIcon size={14} className="text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm truncate">{route.title}</div>
                                <div className="text-xs text-muted-foreground truncate">{route.description}</div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="opacity-0 group-hover:opacity-100 p-1 h-6"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleFavorite(route.id)
                                }}
                              >
                                <Star 
                                  size={12} 
                                  className={cn(
                                    isFavorite ? "text-yellow-500 fill-current" : "text-muted-foreground"
                                  )}
                                />
                              </Button>
                            </div>
                          )
                        })}
                      </CollapsibleContent>
                    </Collapsible>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Recent & Suggestions */}
        <div className="space-y-6">
          {/* Recent Items */}
          {showRecentItems && recentItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock size={16} />
                  Recent
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recentItems.slice(0, 5).map((item) => {
                    const route = crudRoutes.find(r => r.id === item.route_id)
                    if (!route) return null

                    const Icon = item.icon || Clock
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                        onClick={() => handleNavigate(route)}
                      >
                        <Icon size={14} className="text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{item.title}</div>
                          <div className="text-xs text-muted-foreground truncate">{item.subtitle}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Favorites */}
          {showFavorites && favorites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Star size={16} />
                  Favorites
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {favorites.map((routeId) => {
                    const route = crudRoutes.find(r => r.id === routeId)
                    if (!route) return null

                    const system = crudSystems.find(s => s.id === route.system_id)
                    const Icon = route.icon || system?.icon || Star

                    return (
                      <div
                        key={route.id}
                        className="flex items-center gap-2 p-2 rounded hover:bg-muted cursor-pointer"
                        onClick={() => handleNavigate(route)}
                      >
                        <Icon size={14} className="text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate">{route.title}</div>
                          <div className="text-xs text-muted-foreground truncate">{system?.name}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cross-System Suggestions */}
          {crossSystemSuggestions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap size={16} />
                  Suggestions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {crossSystemSuggestions.map((suggestion, index) => {
                    const Icon = suggestion.route.icon || ArrowRight
                    
                    return (
                      <div
                        key={index}
                        className="p-3 border rounded-lg hover:bg-muted cursor-pointer transition-colors"
                        onClick={() => handleNavigate(suggestion.route)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon size={14} />
                          <span className="font-medium text-sm">{suggestion.route.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{suggestion.reason}</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

export default UniversalCRUDRouter