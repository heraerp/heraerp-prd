/**
 * Domain Apps Tab Component
 * Smart Code: HERA.RETAIL.DOMAIN.APPS_TAB.v1
 * 
 * Tabbed interface for discovering and accessing domain-specific apps
 * Filters and organizes apps by usage patterns and domain relevance
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ChevronDown,
  Search,
  Star,
  Clock,
  TrendingUp,
  Users,
  Zap,
  ShoppingCart,
  Receipt,
  BarChart3,
  Target,
  Shield,
  FileText,
  Package,
  Truck,
  Calculator,
  Activity,
  Database,
  LineChart,
  ClipboardCheck,
  Globe,
  AlertTriangle,
  UserCheck,
  Settings,
  Warehouse,
  Tag,
  CreditCard,
  PieChart,
  Mail,
  Calendar
} from 'lucide-react'

interface AppItem {
  id: string
  title: string
  subtitle: string
  description: string
  icon: any
  href: string
  category: string
  domain_relevance: number // 1-10 scale
  usage_stats: {
    last_used?: string
    frequency: number
    user_rating: number
  }
  tags: string[]
  featured?: boolean
  new?: boolean
}

interface DomainAppsTabProps {
  domain: string
  config: any  // DomainConfig from universal types
  className?: string
}

export default function DomainAppsTab({ domain, config, className }: DomainAppsTabProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('favorites')
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredApps, setFilteredApps] = useState<Record<string, AppItem[]>>({})
  const [isExpanded, setIsExpanded] = useState(true)

  // Icon mapping for apps
  const iconMap: Record<string, any> = {
    'search': Search,
    'shopping-cart': ShoppingCart,
    'receipt': Receipt,
    'users': Users,
    'file-text': FileText,
    'bar-chart-3': BarChart3,
    'user-check': UserCheck,
    'target': Target,
    'shield': Shield,
    'database': Database,
    'line-chart': LineChart,
    'clipboard-check': ClipboardCheck,
    'globe': Globe,
    'zap': Zap,
    'alert-triangle': AlertTriangle,
    'calculator': Calculator,
    'activity': Activity,
    'warehouse': Warehouse,
    'tag': Tag,
    'credit-card': CreditCard,
    'pie-chart': PieChart,
    'mail': Mail,
    'calendar': Calendar,
    'package': Package,
    'truck': Truck,
    'settings': Settings
  }

  useEffect(() => {
    loadDomainApps()
  }, [domain])

  useEffect(() => {
    filterApps()
  }, [searchQuery, domain])

  const loadDomainApps = async () => {
    try {
      // Generate domain-specific apps based on the current domain
      const domainApps = generateDomainSpecificApps(domain)
      setFilteredApps(domainApps)
    } catch (error) {
      console.error('Error loading domain apps:', error)
    }
  }

  const generateDomainSpecificApps = (domain: string): Record<string, AppItem[]> => {
    const baseApps = getBaseAppsForDomain(domain)
    
    // Categorize apps based on usage patterns
    const favorites = baseApps
      .filter(app => app.usage_stats.frequency > 7 || app.featured)
      .sort((a, b) => b.usage_stats.frequency - a.usage_stats.frequency)
      .slice(0, 8)

    const mostUsed = baseApps
      .filter(app => app.usage_stats.frequency > 5)
      .sort((a, b) => b.usage_stats.frequency - a.usage_stats.frequency)
      .slice(0, 8)

    const recentlyUsed = baseApps
      .filter(app => app.usage_stats.last_used)
      .sort((a, b) => {
        const aTime = new Date(app.usage_stats.last_used || 0).getTime()
        const bTime = new Date(b.usage_stats.last_used || 0).getTime()
        return bTime - aTime
      })
      .slice(0, 8)

    const recommended = baseApps
      .filter(app => app.domain_relevance >= 8 || app.new)
      .sort((a, b) => b.domain_relevance - a.domain_relevance)
      .slice(0, 8)

    return {
      favorites,
      mostUsed,
      recentlyUsed,
      recommended
    }
  }

  const getBaseAppsForDomain = (domain: string): AppItem[] => {
    // Domain-specific app configurations
    const commonApps: AppItem[] = [
      {
        id: 'search-products',
        title: 'Product Search',
        subtitle: 'Find products quickly',
        description: 'Advanced product search with filters and recommendations',
        icon: iconMap['search'],
        href: `/retail/domains/${domain}/apps/product-search`,
        category: 'operations',
        domain_relevance: 9,
        usage_stats: { frequency: 8, user_rating: 4.5, last_used: '2 hours ago' },
        tags: ['products', 'search', 'inventory'],
        featured: true
      },
      {
        id: 'dashboard',
        title: `${domain.charAt(0).toUpperCase() + domain.slice(1)} Dashboard`,
        subtitle: 'Overview & analytics',
        description: `Comprehensive ${domain} performance dashboard with real-time insights`,
        icon: iconMap['bar-chart-3'],
        href: `/retail/domains/${domain}/dashboard`,
        category: 'analytics',
        domain_relevance: 10,
        usage_stats: { frequency: 9, user_rating: 4.8, last_used: '30 minutes ago' },
        tags: ['dashboard', 'analytics', 'overview'],
        featured: true
      },
      {
        id: 'reports',
        title: 'Reports & Analytics',
        subtitle: 'Generate insights',
        description: 'Create custom reports and analyze performance metrics',
        icon: iconMap['file-text'],
        href: `/retail/domains/${domain}/reports`,
        category: 'analytics',
        domain_relevance: 8,
        usage_stats: { frequency: 6, user_rating: 4.2, last_used: '1 day ago' },
        tags: ['reports', 'analytics', 'insights']
      }
    ]

    // Domain-specific apps
    const domainSpecificApps = getDomainSpecificApps(domain)
    
    return [...commonApps, ...domainSpecificApps]
  }

  const getDomainSpecificApps = (domain: string): AppItem[] => {
    switch (domain) {
      case 'inventory':
        return [
          {
            id: 'stock-management',
            title: 'Stock Management',
            subtitle: 'Track inventory levels',
            description: 'Real-time stock tracking with automated alerts and replenishment',
            icon: iconMap['warehouse'],
            href: `/retail/domains/${domain}/apps/stock-management`,
            category: 'operations',
            domain_relevance: 10,
            usage_stats: { frequency: 9, user_rating: 4.7, last_used: '1 hour ago' },
            tags: ['stock', 'inventory', 'tracking'],
            featured: true
          },
          {
            id: 'cycle-counting',
            title: 'Cycle Counting',
            subtitle: 'Inventory accuracy',
            description: 'Systematic cycle counting for maintaining inventory accuracy',
            icon: iconMap['clipboard-check'],
            href: `/retail/domains/${domain}/apps/cycle-counting`,
            category: 'operations',
            domain_relevance: 9,
            usage_stats: { frequency: 5, user_rating: 4.3, last_used: '3 days ago' },
            tags: ['counting', 'accuracy', 'audit']
          },
          {
            id: 'receiving',
            title: 'Goods Receiving',
            subtitle: 'Inbound processing',
            description: 'Process inbound shipments with quality checks and put-away',
            icon: iconMap['truck'],
            href: `/retail/domains/${domain}/apps/receiving`,
            category: 'operations',
            domain_relevance: 8,
            usage_stats: { frequency: 7, user_rating: 4.4, last_used: '6 hours ago' },
            tags: ['receiving', 'inbound', 'quality']
          }
        ]

      case 'merchandising':
        return [
          {
            id: 'pricing-management',
            title: 'Pricing Management',
            subtitle: 'Dynamic pricing',
            description: 'AI-powered pricing optimization with competitor analysis',
            icon: iconMap['tag'],
            href: `/retail/domains/${domain}/apps/pricing-management`,
            category: 'strategy',
            domain_relevance: 10,
            usage_stats: { frequency: 8, user_rating: 4.6, last_used: '2 hours ago' },
            tags: ['pricing', 'strategy', 'AI'],
            featured: true
          },
          {
            id: 'promotion-campaigns',
            title: 'Promotion Campaigns',
            subtitle: 'Campaign management',
            description: 'Create and manage promotional campaigns across channels',
            icon: iconMap['zap'],
            href: `/retail/domains/${domain}/apps/promotion-campaigns`,
            category: 'marketing',
            domain_relevance: 9,
            usage_stats: { frequency: 6, user_rating: 4.4, last_used: '1 day ago' },
            tags: ['promotions', 'campaigns', 'marketing']
          },
          {
            id: 'category-management',
            title: 'Category Management',
            subtitle: 'Product categories',
            description: 'Optimize product categories and merchandising strategies',
            icon: iconMap['package'],
            href: `/retail/domains/${domain}/apps/category-management`,
            category: 'strategy',
            domain_relevance: 8,
            usage_stats: { frequency: 5, user_rating: 4.2, last_used: '2 days ago' },
            tags: ['categories', 'strategy', 'optimization']
          }
        ]

      case 'planning':
        return [
          {
            id: 'demand-forecasting',
            title: 'Demand Forecasting',
            subtitle: 'AI predictions',
            description: 'Machine learning-powered demand forecasting and planning',
            icon: iconMap['line-chart'],
            href: `/retail/domains/${domain}/apps/demand-forecasting`,
            category: 'planning',
            domain_relevance: 10,
            usage_stats: { frequency: 9, user_rating: 4.8, last_used: '3 hours ago' },
            tags: ['forecasting', 'AI', 'planning'],
            featured: true,
            new: true
          },
          {
            id: 'replenishment-planning',
            title: 'Replenishment Planning',
            subtitle: 'Auto replenishment',
            description: 'Automated replenishment planning with safety stock optimization',
            icon: iconMap['activity'],
            href: `/retail/domains/${domain}/apps/replenishment-planning`,
            category: 'planning',
            domain_relevance: 9,
            usage_stats: { frequency: 7, user_rating: 4.5, last_used: '5 hours ago' },
            tags: ['replenishment', 'automation', 'optimization']
          },
          {
            id: 'allocation-planning',
            title: 'Allocation Planning',
            subtitle: 'Store allocation',
            description: 'Optimize product allocation across stores based on performance',
            icon: iconMap['pie-chart'],
            href: `/retail/domains/${domain}/apps/allocation-planning`,
            category: 'planning',
            domain_relevance: 8,
            usage_stats: { frequency: 6, user_rating: 4.3, last_used: '1 day ago' },
            tags: ['allocation', 'stores', 'optimization']
          }
        ]

      default:
        return []
    }
  }

  const filterApps = () => {
    if (!searchQuery) {
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered: Record<string, AppItem[]> = {}

    Object.entries(filteredApps).forEach(([category, apps]) => {
      filtered[category] = apps.filter(app =>
        app.title.toLowerCase().includes(query) ||
        app.subtitle.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query) ||
        app.tags.some(tag => tag.toLowerCase().includes(query))
      )
    })

    if (Object.values(filtered).some(apps => apps.length > 0)) {
      setFilteredApps(filtered)
    }
  }

  const handleAppClick = (app: AppItem) => {
    console.log(`Opening app: ${app.title} - ${app.href}`)
    // For now, show app details
    alert(`${app.title}\n\n${app.description}\n\nCategory: ${app.category}\nRating: ${app.usage_stats.user_rating}/5\nTags: ${app.tags.join(', ')}`)
    // TODO: Navigate to app
    // router.push(app.href)
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3 h-3 ${i < Math.floor(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
        <span className="text-xs text-gray-500 ml-1">{rating}</span>
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">
            {domain.charAt(0).toUpperCase() + domain.slice(1)} Apps
          </h2>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
          </button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder={`Search ${domain} apps...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="favorites" className="flex items-center gap-2">
                <Star className="w-4 h-4" />
                <span className="hidden sm:inline">Favorites</span>
              </TabsTrigger>
              <TabsTrigger value="mostUsed" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="hidden sm:inline">Most Used</span>
              </TabsTrigger>
              <TabsTrigger value="recentlyUsed" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span className="hidden sm:inline">Recent</span>
              </TabsTrigger>
              <TabsTrigger value="recommended" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Recommended</span>
              </TabsTrigger>
            </TabsList>

            {Object.entries(filteredApps).map(([key, apps]) => (
              <TabsContent key={key} value={key} className="mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {apps.map((app) => {
                    const Icon = app.icon || iconMap['package']
                    return (
                      <Card 
                        key={app.id} 
                        className="border border-gray-200 hover:shadow-md transition-all duration-200 hover:scale-102 cursor-pointer group"
                        onClick={() => handleAppClick(app)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg border border-blue-100 group-hover:bg-blue-100 transition-colors">
                              <Icon className="w-5 h-5 text-blue-600" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between mb-1">
                                <h4 className="font-medium text-sm text-gray-900 truncate">
                                  {app.title}
                                </h4>
                                <div className="flex gap-1 ml-2">
                                  {app.featured && (
                                    <Badge className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200">
                                      ⭐ Featured
                                    </Badge>
                                  )}
                                  {app.new && (
                                    <Badge className="text-xs bg-green-100 text-green-800 border-green-200">
                                      🆕 New
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              
                              <p className="text-xs text-gray-500 truncate mb-2">
                                {app.subtitle}
                              </p>
                              
                              <p className="text-xs text-gray-600 line-clamp-2 mb-3 leading-relaxed">
                                {app.description}
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {renderStars(app.usage_stats.user_rating)}
                                </div>
                                
                                <div className="flex items-center gap-2">
                                  {app.usage_stats.last_used && (
                                    <span className="text-xs text-gray-500">
                                      {app.usage_stats.last_used}
                                    </span>
                                  )}
                                  <Badge variant="outline" className="text-xs">
                                    {app.category}
                                  </Badge>
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap gap-1 mt-2">
                                {app.tags.slice(0, 3).map((tag, i) => (
                                  <Badge key={i} variant="outline" className="text-xs bg-gray-50">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {apps.length === 0 && searchQuery && (
                  <div className="text-center py-8">
                    <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-600">No apps found matching "{searchQuery}"</p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </>
      )}
    </div>
  )
}