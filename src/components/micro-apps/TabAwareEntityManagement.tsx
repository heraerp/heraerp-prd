/**
 * Tab-Aware Entity Management Component
 * Smart Code: HERA.MICRO_APPS.TAB_AWARE.ENTITY_MANAGEMENT.v1
 * 
 * Displays context-specific entity tiles based on the active workspace tab
 * Provides dynamic entity management that changes with tab selection
 */

'use client'

import React, { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  Database,
  Users,
  Package,
  FileText,
  Building,
  Receipt,
  Settings,
  Plus,
  List,
  BarChart3,
  TrendingUp,
  GitBranch,
  Workflow,
  CreditCard,
  PieChart,
  Activity,
  Target,
  Zap,
  Clock,
  CheckCircle
} from 'lucide-react'

// UI Components
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

// HERA Components
import { UniversalEntityListIntegration } from '@/components/micro-apps/UniversalEntityListIntegration'

// Services and Types
import type { WorkspaceEntityContext } from '@/lib/micro-apps/UniversalEntityListRegistry'

// Utils
import { cn } from '@/lib/utils'
import { fadeSlide, staggerChildren } from '@/components/ui-kit/design-tokens'

interface EntityTile {
  entityType: string
  label: string
  labelPlural: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  count: number
  gradient: string
  href: string
  mockActions: Array<{
    id: string
    label: string
    icon: React.ComponentType<{ className?: string }>
  }>
}

interface TabAwareEntityManagementProps {
  activeTab: string
  workspaceContext: WorkspaceEntityContext
  className?: string
}

/**
 * Get entity configuration based on active tab
 */
function getTabEntityConfig(activeTab: string, workspaceContext: WorkspaceEntityContext): {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  entities: EntityTile[]
} {
  const { domain, section } = workspaceContext

  switch (activeTab) {
    case 'transactions':
      return {
        title: 'Transaction Management',
        description: 'Manage financial transactions, payments, and records',
        icon: Receipt,
        color: 'blue',
        entities: [
          {
            entityType: 'payment',
            label: 'Payment',
            labelPlural: 'Payments',
            description: 'Payment records and transaction history',
            icon: CreditCard,
            count: 142,
            gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            href: `/retail/domains/${domain}/sections/${section}/entities?type=payment`,
            mockActions: [
              { id: 'create', label: 'New Payment', icon: Plus },
              { id: 'view', label: 'View All', icon: List }
            ]
          },
          {
            entityType: 'invoice',
            label: 'Invoice',
            labelPlural: 'Invoices',
            description: 'Invoice generation and billing records',
            icon: FileText,
            count: 87,
            gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            href: `/retail/domains/${domain}/sections/${section}/entities?type=invoice`,
            mockActions: [
              { id: 'create', label: 'New Invoice', icon: Plus },
              { id: 'view', label: 'View All', icon: List }
            ]
          },
          {
            entityType: 'transaction_record',
            label: 'Transaction Record',
            labelPlural: 'Transaction Records',
            description: 'Detailed financial transaction logs',
            icon: Receipt,
            count: 256,
            gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            href: `/retail/domains/${domain}/sections/${section}/entities?type=transaction_record`,
            mockActions: [
              { id: 'view', label: 'View All', icon: List },
              { id: 'export', label: 'Export', icon: FileText }
            ]
          }
        ]
      }

    case 'entities':
      return {
        title: 'Entity Management',
        description: 'Manage customers, vendors, products, and accounts',
        icon: Database,
        color: 'green',
        entities: [
          {
            entityType: 'customer',
            label: 'Customer',
            labelPlural: 'Customers',
            description: 'Customer profiles and contact information',
            icon: Users,
            count: 324,
            gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
            href: `/retail/domains/${domain}/sections/${section}/entities?type=customer`,
            mockActions: [
              { id: 'create', label: 'New Customer', icon: Plus },
              { id: 'view', label: 'View All', icon: List }
            ]
          },
          {
            entityType: 'vendor',
            label: 'Vendor',
            labelPlural: 'Vendors',
            description: 'Vendor accounts and supplier information',
            icon: Building,
            count: 89,
            gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            href: `/retail/domains/${domain}/sections/${section}/entities?type=vendor`,
            mockActions: [
              { id: 'create', label: 'New Vendor', icon: Plus },
              { id: 'view', label: 'View All', icon: List }
            ]
          },
          {
            entityType: 'product',
            label: 'Product',
            labelPlural: 'Products',
            description: 'Product catalog and inventory items',
            icon: Package,
            count: 567,
            gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            href: `/retail/domains/${domain}/sections/${section}/entities?type=product`,
            mockActions: [
              { id: 'create', label: 'New Product', icon: Plus },
              { id: 'view', label: 'View All', icon: List }
            ]
          },
          {
            entityType: 'account',
            label: 'Account',
            labelPlural: 'Accounts',
            description: 'Chart of accounts and financial accounts',
            icon: PieChart,
            count: 125,
            gradient: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
            href: `/retail/domains/${domain}/sections/${section}/entities?type=account`,
            mockActions: [
              { id: 'create', label: 'New Account', icon: Plus },
              { id: 'view', label: 'View All', icon: List }
            ]
          }
        ]
      }

    case 'relations':
      return {
        title: 'Relationship Management',
        description: 'Manage entity relationships and hierarchies',
        icon: GitBranch,
        color: 'purple',
        entities: [
          {
            entityType: 'entity_relationship',
            label: 'Entity Relationship',
            labelPlural: 'Entity Relationships',
            description: 'Connections between business entities',
            icon: GitBranch,
            count: 1847,
            gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            href: `/retail/domains/${domain}/sections/${section}/entities?type=entity_relationship`,
            mockActions: [
              { id: 'create', label: 'New Relationship', icon: Plus },
              { id: 'view', label: 'View All', icon: List }
            ]
          },
          {
            entityType: 'hierarchy_mapping',
            label: 'Hierarchy Mapping',
            labelPlural: 'Hierarchy Mappings',
            description: 'Organizational and data hierarchies',
            icon: Target,
            count: 156,
            gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
            href: `/retail/domains/${domain}/sections/${section}/entities?type=hierarchy_mapping`,
            mockActions: [
              { id: 'create', label: 'New Hierarchy', icon: Plus },
              { id: 'view', label: 'View All', icon: List }
            ]
          },
          {
            entityType: 'relationship_rule',
            label: 'Relationship Rule',
            labelPlural: 'Relationship Rules',
            description: 'Rules governing entity relationships',
            icon: Settings,
            count: 67,
            gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            href: `/retail/domains/${domain}/sections/${section}/entities?type=relationship_rule`,
            mockActions: [
              { id: 'create', label: 'New Rule', icon: Plus },
              { id: 'view', label: 'View All', icon: List }
            ]
          }
        ]
      }

    case 'workflow':
      return {
        title: 'Workflow Management',
        description: 'Manage process flows and automation workflows',
        icon: Workflow,
        color: 'orange',
        entities: [
          {
            entityType: 'approval_workflow',
            label: 'Approval Workflow',
            labelPlural: 'Approval Workflows',
            description: 'Automated approval processes and rules',
            icon: CheckCircle,
            count: 34,
            gradient: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
            href: `/retail/domains/${domain}/sections/${section}/entities?type=approval_workflow`,
            mockActions: [
              { id: 'create', label: 'New Workflow', icon: Plus },
              { id: 'view', label: 'View All', icon: List }
            ]
          },
          {
            entityType: 'process_step',
            label: 'Process Step',
            labelPlural: 'Process Steps',
            description: 'Individual workflow steps and actions',
            icon: Workflow,
            count: 189,
            gradient: 'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)',
            href: `/retail/domains/${domain}/sections/${section}/entities?type=process_step`,
            mockActions: [
              { id: 'create', label: 'New Step', icon: Plus },
              { id: 'view', label: 'View All', icon: List }
            ]
          },
          {
            entityType: 'automation_rule',
            label: 'Automation Rule',
            labelPlural: 'Automation Rules',
            description: 'Automated business process rules',
            icon: Zap,
            count: 78,
            gradient: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
            href: `/retail/domains/${domain}/sections/${section}/entities?type=automation_rule`,
            mockActions: [
              { id: 'create', label: 'New Rule', icon: Plus },
              { id: 'view', label: 'View All', icon: List }
            ]
          }
        ]
      }

    case 'analytics':
      return {
        title: 'Analytics Management',
        description: 'Manage reports, metrics, and dashboard configurations',
        icon: BarChart3,
        color: 'indigo',
        entities: [
          {
            entityType: 'analytics_report',
            label: 'Analytics Report',
            labelPlural: 'Analytics Reports',
            description: 'Financial reports and business analytics',
            icon: BarChart3,
            count: 45,
            gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            href: `/retail/domains/${domain}/sections/${section}/entities?type=analytics_report`,
            mockActions: [
              { id: 'create', label: 'New Report', icon: Plus },
              { id: 'view', label: 'View All', icon: List }
            ]
          },
          {
            entityType: 'operational_metric',
            label: 'Operational Metric',
            labelPlural: 'Operational Metrics',
            description: 'KPIs and performance measurements',
            icon: TrendingUp,
            count: 128,
            gradient: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
            href: `/retail/domains/${domain}/sections/${section}/entities?type=operational_metric`,
            mockActions: [
              { id: 'create', label: 'New Metric', icon: Plus },
              { id: 'view', label: 'View All', icon: List }
            ]
          },
          {
            entityType: 'dashboard_config',
            label: 'Dashboard Config',
            labelPlural: 'Dashboard Configs',
            description: 'Dashboard layouts and configurations',
            icon: Settings,
            count: 23,
            gradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
            href: `/retail/domains/${domain}/sections/${section}/entities?type=dashboard_config`,
            mockActions: [
              { id: 'create', label: 'New Dashboard', icon: Plus },
              { id: 'view', label: 'View All', icon: List }
            ]
          }
        ]
      }

    default:
      // Fall back to entities configuration
      return {
        title: 'Entity Management',
        description: 'Manage all your business data entities',
        icon: Database,
        color: 'blue',
        entities: []
      }
  }
}

export function TabAwareEntityManagement({ 
  activeTab, 
  workspaceContext, 
  className 
}: TabAwareEntityManagementProps) {
  const router = useRouter()
  
  // Get configuration based on active tab
  const config = useMemo(() => 
    getTabEntityConfig(activeTab, workspaceContext), 
    [activeTab, workspaceContext]
  )

  const IconComponent = config.icon

  // Color mapping for dynamic Tailwind CSS classes
  const getColorClasses = (color: string) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-700',
        hover: 'hover:bg-blue-100'
      },
      green: {
        bg: 'bg-green-50',
        border: 'border-green-200', 
        text: 'text-green-700',
        hover: 'hover:bg-green-100'
      },
      purple: {
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        text: 'text-purple-700', 
        hover: 'hover:bg-purple-100'
      },
      orange: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-700',
        hover: 'hover:bg-orange-100'
      },
      indigo: {
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        text: 'text-indigo-700',
        hover: 'hover:bg-indigo-100'
      }
    }
    return colorMap[color as keyof typeof colorMap] || colorMap.blue
  }

  const colorClasses = getColorClasses(config.color)

  const handleTileClick = (entity: EntityTile) => {
    console.log(`🎯 Navigating to ${entity.entityType} list:`, entity.href)
    router.push(entity.href)
  }

  const handleQuickAction = (e: React.MouseEvent, entity: EntityTile, actionId: string) => {
    e.stopPropagation()
    console.log(`⚡ Executing ${actionId} for ${entity.entityType}`)
    
    if (actionId === 'create') {
      router.push(`${entity.href}/new`)
    } else if (actionId === 'view') {
      router.push(entity.href)
    }
  }

  // If no entities for this tab, show fallback to UniversalEntityListIntegration
  if (config.entities.length === 0) {
    return (
      <UniversalEntityListIntegration
        workspaceContext={workspaceContext}
        showQuickActions={true}
        showStatistics={true}
        maxTiles={4}
        tileSize="medium"
        layout="grid"
        className={className}
      />
    )
  }

  return (
    <div className={cn("space-y-6 w-full", className)}>
      {/* Section Header */}
      <div className="flex items-center justify-between w-full min-h-[80px]">
        <div className="flex items-center gap-3 flex-1">
          <div className={cn("p-3 rounded-lg border", colorClasses.bg, colorClasses.border)}>
            <IconComponent className={cn("w-6 h-6", colorClasses.text)} />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-slate-900 mb-1">
              {config.title}
            </h3>
            <p className="text-sm text-slate-600">
              {config.description}
            </p>
          </div>
        </div>
        <Button
          onClick={() => router.push(`/retail/domains/${workspaceContext.domain}/sections/${workspaceContext.section}/entities`)}
          variant="outline"
          className="bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors whitespace-nowrap"
        >
          <List className="w-4 h-4 mr-2" />
          View All Entities
        </Button>
      </div>

      {/* Entity Tiles Grid */}
      <motion.div {...staggerChildren} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {config.entities.map((entity, index) => {
          const EntityIcon = entity.icon
          
          return (
            <motion.div
              key={entity.entityType}
              {...fadeSlide(index * 0.1)}
              className="group cursor-pointer"
              onClick={() => handleTileClick(entity)}
              whileHover={{ y: -4, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="bg-white border border-slate-200 rounded-lg p-6 hover:border-indigo-300 hover:shadow-md transition-all duration-300 h-full">
                {/* Tile Header */}
                <div className="flex items-start justify-between mb-4">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: entity.gradient }}
                  >
                    <EntityIcon className="w-6 h-6 text-white" />
                  </div>
                  
                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-medium">
                    {entity.count}
                  </Badge>
                </div>

                {/* Tile Content */}
                <div className="space-y-3">
                  <div>
                    <h4 className="text-lg font-semibold text-slate-900 mb-1">{entity.labelPlural}</h4>
                    <p className="text-sm text-slate-600 line-clamp-2">{entity.description}</p>
                  </div>

                  {/* Statistics */}
                  <div className="flex items-center justify-between pt-3 border-t border-slate-200/50">
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Database className="w-4 h-4" />
                      <span>{entity.count} total</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-sm text-slate-500">
                      <Clock className="w-4 h-4" />
                      <span>Updated recently</span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-4 pt-4 border-t border-slate-200/50">
                  <div className="flex items-center gap-2">
                    {entity.mockActions.map(action => (
                      <Button
                        key={action.id}
                        variant="ghost"
                        size="sm"
                        onClick={(e) => handleQuickAction(e, entity, action.id)}
                        className="flex-1 h-8 text-xs hover:bg-indigo-50 transition-colors"
                      >
                        <action.icon className="w-3 h-3 mr-1" />
                        {action.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Summary Footer */}
      <motion.div {...fadeSlide(0.5)}>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <div className="flex items-center gap-4">
              <span className="font-medium">{config.entities.length} entity type{config.entities.length !== 1 ? 's' : ''} available</span>
              <span>•</span>
              <span>{config.entities.reduce((sum, entity) => sum + entity.count, 0)} total entities</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span className="font-medium">Context: {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default TabAwareEntityManagement