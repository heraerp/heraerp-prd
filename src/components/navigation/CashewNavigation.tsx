/**
 * HERA Cashew Manufacturing Navigation Component
 * Smart Code: HERA.CASHEW.NAVIGATION.COMPONENT.v1
 * 
 * Industry-specific navigation for cashew manufacturing operations
 */

'use client'

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  Package, 
  Factory, 
  ClipboardList, 
  MapPin, 
  Settings, 
  DollarSign, 
  BarChart3,
  ArrowRight,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

interface CashewNavigationProps {
  onNavigate?: (path: string) => void
  compact?: boolean
}

export function CashewNavigation({ onNavigate, compact = false }: CashewNavigationProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['materials', 'manufacturing'])

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const handleNavigate = (path: string) => {
    if (onNavigate) {
      onNavigate(path)
    } else {
      window.location.href = path
    }
  }

  const navigationSections = [
    {
      id: 'materials',
      title: 'Master Data',
      description: 'Manage materials, products, and master data',
      icon: Package,
      color: 'bg-blue-500',
      items: [
        {
          title: 'Materials',
          description: 'Raw nuts, packaging, consumables',
          path: '/cashew/materials',
          icon: '📦',
          badge: 'Master'
        },
        {
          title: 'Products (Grades)',
          description: 'Cashew kernel grades (W320, W240, LWP)',
          path: '/cashew/products/list',
          icon: '🥜',
          badge: 'Master'
        },
        {
          title: 'Locations',
          description: 'Plants, warehouses, quality labs',
          path: '/cashew/locations/list',
          icon: '🏢',
          badge: 'Setup'
        },
        {
          title: 'Work Centers',
          description: 'Processing stations and work centers',
          path: '/cashew/work-centers/list',
          icon: '⚙️',
          badge: 'Setup'
        }
      ]
    },
    {
      id: 'manufacturing',
      title: 'Manufacturing',
      description: 'Production operations and batch tracking',
      icon: Factory,
      color: 'bg-green-500',
      items: [
        {
          title: 'Production Batches',
          description: 'Track cashew processing batches',
          path: '/cashew/batches/list',
          icon: '🏭',
          badge: 'Live'
        },
        {
          title: 'Material Issues',
          description: 'Issue raw materials to production',
          path: '/cashew/manufacturing/issue/list',
          icon: '📤',
          badge: 'Txn'
        },
        {
          title: 'Labor Booking',
          description: 'Track labor hours and costs',
          path: '/cashew/manufacturing/labor/list',
          icon: '👷',
          badge: 'Txn'
        },
        {
          title: 'Overhead Absorption',
          description: 'Allocate overhead costs',
          path: '/cashew/manufacturing/overhead/list',
          icon: '⚡',
          badge: 'Txn'
        },
        {
          title: 'Finished Goods Receipt',
          description: 'Receive graded kernels',
          path: '/cashew/manufacturing/receipt/list',
          icon: '🥜',
          badge: 'Txn'
        },
        {
          title: 'Batch Costing',
          description: 'Calculate production costs',
          path: '/cashew/manufacturing/costing/list',
          icon: '🧮',
          badge: 'Cost'
        },
        {
          title: 'Quality Control',
          description: 'AQL-based quality inspections',
          path: '/cashew/manufacturing/qc/list',
          icon: '🔍',
          badge: 'QC'
        }
      ]
    },
    {
      id: 'engineering',
      title: 'Engineering',
      description: 'BOMs and engineering data',
      icon: ClipboardList,
      color: 'bg-purple-500',
      items: [
        {
          title: 'Bills of Materials',
          description: 'Production recipes and BOMs',
          path: '/cashew/boms/list',
          icon: '📋',
          badge: 'Setup'
        }
      ]
    },
    {
      id: 'finance',
      title: 'Finance & Costing',
      description: 'Cost centers and financial tracking',
      icon: DollarSign,
      color: 'bg-amber-500',
      items: [
        {
          title: 'Cost Centers',
          description: 'Track production and overhead costs',
          path: '/cashew/cost-centers/list',
          icon: '💰',
          badge: 'Setup'
        }
      ]
    }
  ]

  const quickActions = [
    {
      title: 'Materials',
      description: 'Manage raw nuts, packaging, consumables',
      path: '/cashew/materials',
      icon: '📦',
      color: 'bg-blue-500'
    },
    {
      title: 'Suppliers',
      description: 'Manage cashew suppliers',
      path: '/cashew/suppliers',
      icon: '🏭',
      color: 'bg-orange-500'
    },
    {
      title: 'Purchase Orders',
      description: 'Create and manage purchase orders',
      path: '/cashew/purchases',
      icon: '🛒',
      color: 'bg-indigo-500'
    },
    {
      title: 'Production Orders',
      description: 'Start new production batches',
      path: '/cashew/production',
      icon: '⚙️',
      color: 'bg-amber-500'
    },
    {
      title: 'Sales Orders',
      description: 'Create customer sales orders',
      path: '/cashew/sales',
      icon: '💰',
      color: 'bg-green-500'
    },
    {
      title: 'Customers',
      description: 'Manage customer database',
      path: '/cashew/customers',
      icon: '👥',
      color: 'bg-purple-500'
    }
  ]

  if (compact) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              onClick={() => handleNavigate(action.path)}
              className="h-auto p-3 flex flex-col items-start gap-1"
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-lg">{action.icon}</span>
                <span className="text-xs font-medium">{action.title}</span>
              </div>
            </Button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <span className="text-2xl">🥜</span>
            <div>
              <h1 className="text-2xl font-bold">Cashew Manufacturing ERP</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Complete cashew processing from raw nuts to graded kernels
              </p>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => handleNavigate(action.path)}
                className="h-auto p-4 flex flex-col items-start gap-2"
              >
                <div className={`w-8 h-8 rounded-lg ${action.color} flex items-center justify-center text-white text-sm`}>
                  {action.icon}
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm">{action.title}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Sections */}
      <div className="space-y-4">
        {navigationSections.map((section) => {
          const isExpanded = expandedSections.includes(section.id)
          const SectionIcon = section.icon

          return (
            <Card key={section.id}>
              <CardHeader 
                className="cursor-pointer"
                onClick={() => toggleSection(section.id)}
              >
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${section.color} flex items-center justify-center text-white`}>
                      <SectionIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{section.title}</h3>
                      <p className="text-sm text-muted-foreground">{section.description}</p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </CardTitle>
              </CardHeader>
              
              {isExpanded && (
                <CardContent>
                  <div className="grid gap-3">
                    {section.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer group"
                        onClick={() => handleNavigate(item.path)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{item.icon}</span>
                          <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-sm text-muted-foreground">{item.description}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {item.badge}
                          </Badge>
                          <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )
        })}
      </div>

      {/* Footer */}
      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              Cashew Manufacturing ERP powered by <strong>HERA Universal Platform</strong>
            </div>
            <Badge variant="outline">
              Zero-Duplication Architecture
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CashewNavigation