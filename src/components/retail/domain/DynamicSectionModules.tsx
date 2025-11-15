/**
 * Dynamic Section Modules Component
 * Smart Code: HERA.RETAIL.DOMAIN.SECTION_MODULES.v1
 * 
 * Enhanced section cards with rich metadata, personas, and analytics
 * Provides comprehensive overview of domain sections with usage insights
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ChevronDown,
  Loader2,
  AlertTriangle,
  RefreshCw,
  Eye,
  TrendingUp,
  Users,
  BarChart3,
  Clock,
  Star,
  Zap,
  Target,
  Package,
  Warehouse,
  Calculator,
  Tag,
  Truck,
  Calendar,
  ClipboardCheck,
  PieChart,
  FileText,
  CreditCard,
  Receipt,
  Mail,
  Activity,
  Settings
} from 'lucide-react'

interface SectionModule {
  id: string
  entity_id: string
  title: string
  subtitle: string
  description: string
  icon: any
  bgColor: string
  textColor: string
  domain: string
  section: string
  entity_code: string
  smart_code: string
  route: string
  // Enhanced metadata
  persona_label: string
  visible_roles: string[]
  usage_stats: {
    daily_users: number
    weekly_usage: number
    last_used: string
    trending: boolean
  }
  features: string[]
  quick_actions: {
    label: string
    action: string
    icon: string
  }[]
  kpi?: {
    label: string
    value: string
    trend: 'up' | 'down' | 'stable'
  }
}

interface DynamicSectionModulesProps {
  domain: string
  domainEntity: any
  sectionEntities: any[]
  isLoading: boolean
  onRefresh: () => void
  config: any  // DomainConfig from universal types
  className?: string
}

export default function DynamicSectionModules({
  domain,
  domainEntity,
  sectionEntities,
  isLoading,
  onRefresh,
  config,
  className
}: DynamicSectionModulesProps) {
  const router = useRouter()
  const [sectionModules, setSectionModules] = useState<SectionModule[]>([])
  const [isExpanded, setIsExpanded] = useState(true)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'name' | 'usage' | 'trending'>('name')

  // Icon mapping with more comprehensive coverage
  const iconMap: Record<string, any> = {
    'trending-up': TrendingUp,
    'refresh-cw': RefreshCw,
    'pie-chart': PieChart,
    'warehouse': Warehouse,
    'clipboard-check': ClipboardCheck,
    'package': Package,
    'tag': Tag,
    'users': Users,
    'calculator': Calculator,
    'bar-chart-3': BarChart3,
    'file-text': FileText,
    'credit-card': CreditCard,
    'receipt': Receipt,
    'mail': Mail,
    'star': Star,
    'truck': Truck,
    'calendar': Calendar,
    'activity': Activity,
    'settings': Settings,
    'target': Target,
    'zap': Zap
  }

  useEffect(() => {
    if (!isLoading && sectionEntities && sectionEntities.length > 0) {
      processSectionEntities()
    }
  }, [sectionEntities, isLoading, domain])

  // Debug logging to understand why sections aren't showing
  useEffect(() => {
    console.log('🔍 DynamicSectionModules Debug:', {
      domain,
      domainEntityId: domainEntity?.id,
      totalSectionEntities: sectionEntities?.length,
      isLoading,
      sectionEntities: sectionEntities?.map(s => ({
        id: s.id,
        name: s.entity_name,
        parent_id: s.parent_entity_id,
        status: s.status
      }))
    })
    
    if (domainEntity && sectionEntities) {
      const filteredSections = sectionEntities.filter(entity => entity.parent_entity_id === domainEntity.id)
      console.log(`🎯 Filtered sections: ${filteredSections.length}`, filteredSections.map(s => s.entity_name))
    }
  }, [sectionEntities, domainEntity, isLoading, domain])

  const processSectionEntities = () => {
    const modules = sectionEntities
      .filter(entity => entity.parent_entity_id === domainEntity?.id)
      .map(parseSectionEntity)
      .sort((a, b) => {
        switch (sortBy) {
          case 'usage':
            return b.usage_stats.daily_users - a.usage_stats.daily_users
          case 'trending':
            return Number(b.usage_stats.trending) - Number(a.usage_stats.trending)
          default:
            return a.title.localeCompare(b.title)
        }
      })

    setSectionModules(modules)
  }

  const parseSectionEntity = (entity: any): SectionModule => {
    // Extract section slug from smart_code or entity_code
    let sectionSlug = 'unknown'
    
    if (entity.smart_code) {
      const parts = entity.smart_code.split('.')
      const lastPart = parts[parts.length - 2]
      if (lastPart) {
        sectionSlug = lastPart.toLowerCase()
      }
    }
    
    if (entity.entity_code?.startsWith('NAV-SEC-')) {
      const codeParts = entity.entity_code.replace('NAV-SEC-', '').split('-')
      sectionSlug = codeParts[codeParts.length - 1]?.toLowerCase() || sectionSlug
    }

    const route = `/${config.appCode.toLowerCase()}/domains/${domain}/sections/${sectionSlug}`

    // Enhanced icon and color mapping
    const { icon, bgColor, persona, features, kpi } = getEnhancedSectionData(entity.entity_name, entity.entity_code || '')

    // Mock usage statistics - in production, this would come from analytics service
    const usageStats = generateMockUsageStats(entity.entity_name)

    // Generate quick actions based on section type
    const quickActions = generateQuickActions(sectionSlug, entity.entity_name)

    return {
      id: entity.id,
      entity_id: entity.id,
      title: entity.entity_name,
      subtitle: entity.entity_description || generateSectionSubtitle(entity.entity_name),
      description: generateDetailedDescription(entity.entity_name),
      icon,
      bgColor,
      textColor: 'text-white',
      domain,
      section: sectionSlug,
      entity_code: entity.entity_code || '',
      smart_code: entity.smart_code || '',
      route,
      persona_label: persona,
      visible_roles: ['Manager', 'Operator', 'Analyst'],
      usage_stats: usageStats,
      features,
      quick_actions: quickActions,
      kpi
    }
  }

  const getEnhancedSectionData = (entityName: string, entityCode: string) => {
    const name = entityName.toLowerCase()
    const code = entityCode.toLowerCase()
    
    // Enhanced pattern matching with personas and features
    if (name.includes('demand') || name.includes('forecast')) {
      return {
        icon: iconMap['trending-up'],
        bgColor: 'bg-blue-600',
        persona: 'Demand Planner',
        features: ['AI Forecasting', 'Trend Analysis', 'Seasonal Planning'],
        kpi: { label: 'Forecast Accuracy', value: '94.2%', trend: 'up' as const }
      }
    }
    
    if (name.includes('replenishment') || name.includes('planning')) {
      return {
        icon: iconMap['refresh-cw'],
        bgColor: 'bg-green-600',
        persona: 'Replenishment Manager',
        features: ['Auto Replenishment', 'Safety Stock', 'Lead Time Optimization'],
        kpi: { label: 'Fill Rate', value: '97.8%', trend: 'up' as const }
      }
    }
    
    if (name.includes('allocation') || name.includes('distribution')) {
      return {
        icon: iconMap['pie-chart'],
        bgColor: 'bg-purple-600',
        persona: 'Allocation Specialist',
        features: ['Store Allocation', 'Distribution Logic', 'Performance Tracking'],
        kpi: { label: 'Allocation Accuracy', value: '89.5%', trend: 'stable' as const }
      }
    }
    
    if (name.includes('stock') || name.includes('inventory')) {
      return {
        icon: iconMap['warehouse'],
        bgColor: 'bg-teal-600',
        persona: 'Inventory Manager',
        features: ['Real-time Tracking', 'Stock Alerts', 'Movement History'],
        kpi: { label: 'Stock Accuracy', value: '99.1%', trend: 'up' as const }
      }
    }
    
    if (name.includes('receiving') || name.includes('inbound')) {
      return {
        icon: iconMap['clipboard-check'],
        bgColor: 'bg-orange-600',
        persona: 'Receiving Clerk',
        features: ['ASN Processing', 'Quality Checks', 'Put-away Rules'],
        kpi: { label: 'Receipt Efficiency', value: '92.7%', trend: 'up' as const }
      }
    }
    
    // Add more patterns...
    return {
      icon: iconMap['package'],
      bgColor: 'bg-gray-600',
      persona: 'Operations User',
      features: ['Standard Operations', 'Basic Tracking'],
      kpi: undefined
    }
  }

  const generateMockUsageStats = (sectionName: string) => {
    const base = sectionName.length * 3 // Consistent but varied
    return {
      daily_users: Math.floor(Math.random() * 50) + base,
      weekly_usage: Math.floor(Math.random() * 200) + base * 10,
      last_used: `${Math.floor(Math.random() * 24)} hours ago`,
      trending: Math.random() > 0.7
    }
  }

  const generateQuickActions = (sectionSlug: string, sectionName: string) => {
    const baseActions = [
      { label: 'Dashboard', action: 'navigate', icon: 'bar-chart-3' },
      { label: 'Reports', action: 'reports', icon: 'file-text' }
    ]

    // Add section-specific actions
    if (sectionName.toLowerCase().includes('inventory')) {
      baseActions.push({ label: 'Stock Check', action: 'stock-check', icon: 'warehouse' })
    }
    
    if (sectionName.toLowerCase().includes('planning')) {
      baseActions.push({ label: 'New Plan', action: 'create-plan', icon: 'calendar' })
    }

    return baseActions
  }

  const generateSectionSubtitle = (sectionName: string): string => {
    const name = sectionName.toLowerCase()
    if (name.includes('demand')) return 'AI-powered forecasting & demand analysis'
    if (name.includes('replenishment')) return 'Automated stock replenishment & optimization'
    if (name.includes('allocation')) return 'Smart store allocation strategies'
    if (name.includes('stock')) return 'Real-time inventory tracking & management'
    if (name.includes('receiving')) return 'Inbound goods processing & verification'
    if (name.includes('picking')) return 'Order fulfillment & pick optimization'
    if (name.includes('cycle')) return 'Inventory accuracy & cycle counting'
    if (name.includes('catalog')) return 'Product information & catalog management'
    if (name.includes('pricing')) return 'Dynamic pricing strategies & promotions'
    if (name.includes('promotion')) return 'Campaign & discount management'
    if (name.includes('customer')) return 'Customer profiles & behavior analytics'
    if (name.includes('loyalty')) return 'Points & rewards program management'
    if (name.includes('sales')) return 'Revenue analytics & performance tracking'
    if (name.includes('financial')) return 'Profitability & cost analysis'
    return 'Advanced operations management'
  }

  const generateDetailedDescription = (sectionName: string): string => {
    return `Comprehensive ${sectionName.toLowerCase()} management with advanced analytics, automation, and real-time insights for optimized operations.`
  }

  const handleSectionClick = (section: SectionModule) => {
    console.log(`🎯 Level 2→3: Navigating to section: ${section.route}`)
    console.log(`📋 Section: ${section.title} (${section.entity_code})`)

    // Navigate to the section workspace
    if (section.route) {
      router.push(section.route)
    } else {
      // Fallback: construct route if not provided
      const fallbackRoute = `/${config.appCode.toLowerCase()}/domains/${domain}/sections/${section.entity_code?.toLowerCase() || section.title.toLowerCase().replace(/\s+/g, '-')}`
      console.log(`🔄 Using fallback route: ${fallbackRoute}`)
      router.push(fallbackRoute)
    }
  }

  const handleQuickAction = (section: SectionModule, action: string) => {
    console.log(`Quick action: ${action} for ${section.title}`)
    // Implement quick actions
  }

  const renderTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-3 h-3 text-green-500" />
      case 'down':
        return <TrendingUp className="w-3 h-3 text-red-500 rotate-180" />
      default:
        return <Activity className="w-3 h-3 text-gray-500" />
    }
  }

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-gray-900">
            Section Modules ({sectionModules.length})
          </h2>
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`} />
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-sm border border-gray-200 rounded px-2 py-1"
          >
            <option value="name">Sort by Name</option>
            <option value="usage">Sort by Usage</option>
            <option value="trending">Sort by Trending</option>
          </select>
          
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/50 animate-pulse rounded-xl h-48"></div>
              ))}
            </div>
          )}

          {/* Error State - Domain Not Found */}
          {!isLoading && !domainEntity && (
            <div className="text-center py-8">
              <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-4" />
              <p className="text-red-800">Domain "{domain}" not found</p>
            </div>
          )}

          {/* No Sections State */}
          {!isLoading && domainEntity && sectionModules.length === 0 && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sections Available</h3>
              <p className="text-gray-600 mb-4">
                No sections found for "{domainEntity.entity_name}". This domain may be under development.
              </p>
              <Button variant="outline" onClick={onRefresh}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          )}

          {/* Sections Grid */}
          {!isLoading && sectionModules.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sectionModules.map((section) => {
                const Icon = section.icon
                return (
                  <Card
                    key={section.entity_id}
                    className={`${section.bgColor} ${section.textColor} border-0 hover:shadow-lg transition-all duration-200 hover:scale-105 cursor-pointer relative group overflow-hidden`}
                    onClick={() => handleSectionClick(section)}
                  >
                    {/* Trending indicator */}
                    {section.usage_stats.trending && (
                      <div className="absolute top-2 right-2 z-10">
                        <Badge className="bg-yellow-500 text-yellow-900 text-xs">
                          🔥 Trending
                        </Badge>
                      </div>
                    )}

                    <CardContent className="p-6 h-48 flex flex-col justify-between">
                      <div className="flex items-start justify-between mb-4">
                        <Icon className="h-8 w-8" />
                        <Eye className="w-4 h-4 opacity-75" />
                      </div>

                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1 leading-tight">{section.title}</h3>
                        <p className="text-sm opacity-90 mb-3 leading-tight">{section.subtitle}</p>
                        
                        {/* Persona and KPI */}
                        <div className="space-y-2">
                          <Badge variant="secondary" className="text-xs bg-white/20 text-white border-white/30">
                            {section.persona_label}
                          </Badge>
                          
                          {section.kpi && (
                            <div className="flex items-center gap-2 text-xs">
                              <span className="opacity-90">{section.kpi.label}:</span>
                              <span className="font-semibold">{section.kpi.value}</span>
                              {renderTrendIcon(section.kpi.trend)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Usage stats */}
                      <div className="flex items-center justify-between text-xs opacity-75 mt-4 pt-2 border-t border-white/20">
                        <span>{section.usage_stats.daily_users} daily users</span>
                        <span>{section.usage_stats.last_used}</span>
                      </div>

                      {/* Quick actions (visible on hover) */}
                      <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-2">
                          {section.quick_actions.slice(0, 2).map((action, idx) => (
                            <Button
                              key={idx}
                              size="sm"
                              variant="secondary"
                              className="text-xs bg-white/20 text-white border-white/30 hover:bg-white/30"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleQuickAction(section, action.action)
                              }}
                            >
                              {action.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}