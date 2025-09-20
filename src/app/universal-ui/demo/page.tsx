'use client'

import React, { useState, useEffect } from 'react'
import { UniversalRenderer } from '@/components/universal-ui/UniversalRenderer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Info,
  Package,
  List,
  BarChart3,
  FileText,
  Workflow,
  Heart,
  Utensils,
  Briefcase,
  ShoppingCart,
  Sparkles
} from 'lucide-react'
import {
  industryConfigurations,
  getIndustryViews
} from '@/lib/universal-ui/industry-configurations'
import { ViewMetaService } from '@/lib/universal-ui/view-meta-service'

// Demo configurations showing SAME widgets used across ALL industries
const DEMO_CONFIGS = [
  {
    category: 'Healthcare',
    icon: Heart,
    color: 'text-red-500',
    items: [
      {
        name: 'Patient Record',
        viewKey: 'patientDetail',
        viewType: 'detail',
        description: 'Complete patient medical history and vitals',
        highlights: [
          'Stats Widget for vitals',
          'Form Widget for patient info',
          'Grid Widget for appointments',
          'Timeline Widget for medical history'
        ]
      },
      {
        name: 'Patient Registry',
        viewKey: 'patientList',
        viewType: 'list',
        description: 'Search and manage all patients',
        highlights: ['Grid Widget with medical context', 'Same grid as Restaurant/Retail']
      }
    ]
  },
  {
    category: 'Restaurant',
    icon: Utensils,
    color: 'text-orange-500',
    items: [
      {
        name: 'POS Order Entry',
        viewKey: 'orderEntry',
        viewType: 'form',
        description: 'Restaurant point of sale system',
        highlights: [
          'Stats Widget for totals',
          'Form Widget for table/server',
          'Grid Widget for menu items',
          'Grid Widget for order items'
        ]
      },
      {
        name: 'Kitchen Display',
        viewKey: 'kitchenDisplay',
        viewType: 'dashboard',
        description: 'Real-time order tracking for kitchen',
        highlights: ['Kanban Widget for order status', 'Same widget as project management']
      }
    ]
  },
  {
    category: 'Professional Services',
    icon: Briefcase,
    color: 'text-blue-500',
    items: [
      {
        name: 'Time Entry',
        viewKey: 'timeEntry',
        viewType: 'form',
        description: 'Track billable hours and projects',
        highlights: [
          'Form Widget for time details',
          'Stats Widget for weekly summary',
          'Grid Widget for recent entries',
          'Same widgets as other industries'
        ]
      },
      {
        name: 'Project Dashboard',
        viewKey: 'projectDashboard',
        viewType: 'dashboard',
        description: 'Project health and burn down',
        highlights: [
          'Stats Widget for KPIs',
          'Chart Widget for burn down',
          'Tree Widget for WBS',
          'Universal components'
        ]
      }
    ]
  },
  {
    category: 'Retail',
    icon: ShoppingCart,
    color: 'text-green-500',
    items: [
      {
        name: 'Inventory Management',
        viewKey: 'inventoryManagement',
        viewType: 'detail',
        description: 'Stock levels and reorder management',
        highlights: [
          'Stats Widget for inventory KPIs',
          'Grid Widget with progress bars',
          'Chart Widget for movements',
          'Related Widget for transactions'
        ]
      },
      {
        name: 'Sales Dashboard',
        viewKey: 'salesDashboard',
        viewType: 'dashboard',
        description: 'Real-time sales analytics',
        highlights: [
          'Stats Widget for daily KPIs',
          'Chart Widget for hourly sales',
          'Chart Widget for top products',
          'Same components everywhere'
        ]
      }
    ]
  },
  {
    category: 'Furniture BOM',
    icon: Package,
    color: 'text-purple-500',
    items: [
      {
        name: 'BOM Detail View',
        smartCode: 'HERA.FURN.BOM.ITEM.PRODUCT.V1',
        viewType: 'detail',
        description: 'Complete BOM management with components, costs, and revisions',
        highlights: ['Stats, Form, Grid, Chart, Timeline widgets']
      },
      {
        name: 'BOM List View',
        smartCode: 'HERA.FURN.BOM.ITEM.LIST.V1',
        viewType: 'list',
        description: 'Browse and search all products with BOMs',
        highlights: ['Grid Widget with filters']
      },
      {
        name: 'BOM Dashboard',
        smartCode: 'HERA.FURN.BOM.DASHBOARD.v1',
        viewType: 'dashboard',
        description: 'Analytics and KPIs for BOM management',
        highlights: ['Stats, Chart, Grid widgets']
      }
    ]
  }
]

export default function UniversalUIDemo() {
  const { currentOrganization, isAuthenticated, contextLoading } = useMultiOrgAuth()
  const [selectedConfig, setSelectedConfig] = useState<any>(DEMO_CONFIGS[0].items[0])
  const [selectedCategory, setSelectedCategory] = useState(DEMO_CONFIGS[0].category)
  const [demoEntityId, setDemoEntityId] = useState<string | undefined>()
  const [viewMetadata, setViewMetadata] = useState<any>(null)

  // Set up view metadata service
  useEffect(() => {
    if (currentOrganization && selectedConfig) {
      const metaService = new ViewMetaService(currentOrganization.id)

      // For industry examples, use the pre-configured metadata
      if (selectedConfig.viewKey && selectedCategory !== 'Furniture BOM') {
        const industryKey = selectedCategory.toLowerCase().replace(' ', '')
        const metadata =
          industryConfigurations[industryKey as keyof typeof industryConfigurations]?.[
            selectedConfig.viewKey
          ]
        setViewMetadata(metadata)
      } else {
        // For furniture BOM, use the dynamic generation
        metaService.getViewMeta(selectedConfig.smartCode, selectedConfig.viewType).then(meta => {
          setViewMetadata(meta)
        })
      }
    }
  }, [currentOrganization, selectedConfig, selectedCategory])

  // Authentication check
  if (!isAuthenticated) {
    return (
      <Alert>
        <AlertDescription>Please log in to access this page.</AlertDescription>
      </Alert>
    )
  }

  // Context loading check
  if (contextLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  // Organization check
  if (!currentOrganization) {
    return (
      <Alert>
        <AlertDescription>No organization context found.</AlertDescription>
      </Alert>
    )
  }

  const handleAction = (action: any) => {
    console.log('Action triggered:', action)

    // Handle navigation actions
    if (action.type === 'navigate' && action.target) {
      console.log('Navigating to:', action.target)
    }

    // In a real implementation, this would call the API
    // For demo, just log the action
  }

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category)
    const config = DEMO_CONFIGS.find(c => c.category === category)
    if (config && config.items.length > 0) {
      setSelectedConfig(config.items[0])
    }
  }

  // Get the smart code for rendering
  const getSmartCode = () => {
    if (selectedConfig.smartCode) {
      return selectedConfig.smartCode
    }
    // For industry examples, use the metadata's smart code
    return viewMetadata?.smart_code || 'HERA.UI.UNIVERSAL.v1'
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Universal UI Demo</h1>
        <p className="text-muted-foreground mt-2">
          Experience the SAME UI components rendering different business applications without code
          changes
        </p>
      </div>

      {/* Revolutionary Info Card */}
      <Card className="border-purple-200 dark:border-purple-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Revolutionary: One UI System, Infinite Applications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <p className="text-sm mb-3 font-medium">
              Watch how the EXACT SAME widgets adapt to different industries:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="font-semibold text-purple-700 dark:text-purple-300">
                  Universal Widgets
                </h4>
                <ul className="text-sm space-y-1">
                  <li>
                    • <strong>Grid Widget</strong> - Shows patients, menu items, time entries,
                    inventory
                  </li>
                  <li>
                    • <strong>Form Widget</strong> - Handles medical records, orders, time tracking
                  </li>
                  <li>
                    • <strong>Stats Widget</strong> - Displays vitals, sales, project KPIs
                  </li>
                  <li>
                    • <strong>Chart Widget</strong> - Visualizes any business metric
                  </li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold text-purple-700 dark:text-purple-300">
                  Zero Code Changes
                </h4>
                <ul className="text-sm space-y-1">
                  <li>• Same components across ALL industries</li>
                  <li>• Only ViewMeta configuration differs</li>
                  <li>• Smart codes drive behavior</li>
                  <li>• Infinite extensibility built-in</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold">1. Smart Code Driven</h3>
              <p className="text-sm text-muted-foreground">
                Every entity has a smart code that determines its UI behavior and available widgets
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">2. Metadata Powered</h3>
              <p className="text-sm text-muted-foreground">
                UI configuration stored as data, not hardcoded in components
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">3. Universal Components</h3>
              <p className="text-sm text-muted-foreground">
                Same widgets work for healthcare, restaurant, retail, any business
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Demo Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Select Industry & View</CardTitle>
          <CardDescription>
            Notice how the SAME widgets render completely different business applications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={handleCategoryChange}>
            <TabsList className="grid w-full grid-cols-5">
              {DEMO_CONFIGS.map(config => (
                <TabsTrigger key={config.category} value={config.category}>
                  <config.icon className={`h-4 w-4 mr-2 ${config.color}`} />
                  <span className="hidden md:inline">{config.category}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {DEMO_CONFIGS.map(config => (
              <TabsContent key={config.category} value={config.category} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {config.items.map(item => (
                    <Card
                      key={item.name}
                      className={`cursor-pointer transition-all ${
                        selectedConfig.name === item.name
                          ? 'ring-2 ring-primary'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => setSelectedConfig(item)}
                    >
                      <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                          {item.name}
                          {selectedConfig.name === item.name && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                              Active
                            </span>
                          )}
                        </CardTitle>
                        <CardDescription className="text-sm">{item.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Widgets Used:</p>
                          <div className="flex flex-wrap gap-1">
                            {item.highlights.map((highlight, idx) => (
                              <span key={idx} className="text-xs bg-muted px-2 py-1 rounded">
                                {highlight}
                              </span>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Universal Renderer */}
      <Card>
        <CardHeader>
          <CardTitle>Rendered View - {selectedConfig.name}</CardTitle>
          <CardDescription>
            This UI is generated dynamically using Universal UI components - NO custom code
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UniversalRenderer
            smartCode={getSmartCode()}
            viewType={selectedConfig.viewType as any}
            entityId={demoEntityId}
            organizationId={currentOrganization.id}
            onAction={handleAction}
          />
        </CardContent>
      </Card>

      {/* Metadata Viewer */}
      <Card>
        <CardHeader>
          <CardTitle>View Metadata Configuration</CardTitle>
          <CardDescription>
            The JSON metadata that drives the UI above - notice how only the configuration changes,
            not the components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                <strong>Key Insight:</strong> The Grid, Form, Stats, Chart, and other widgets are
                EXACTLY the same across all industries. Only this metadata configuration changes.
                This is the power of Universal UI!
              </AlertDescription>
            </Alert>

            <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
              {JSON.stringify(
                viewMetadata || {
                  smart_code: getSmartCode(),
                  view_type: selectedConfig.viewType,
                  title: selectedConfig.name,
                  widgets: 'Loading...',
                  note: 'The same widgets render different UIs based on this configuration'
                },
                null,
                2
              )}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Widget Reusability Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>Universal Widget Reusability Matrix</CardTitle>
          <CardDescription>See how the SAME widgets are used across ALL industries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Widget</th>
                  <th className="text-center p-2">Healthcare</th>
                  <th className="text-center p-2">Restaurant</th>
                  <th className="text-center p-2">Professional</th>
                  <th className="text-center p-2">Retail</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2 font-medium">Grid Widget</td>
                  <td className="text-center p-2">✓ Appointments</td>
                  <td className="text-center p-2">✓ Menu Items</td>
                  <td className="text-center p-2">✓ Time Entries</td>
                  <td className="text-center p-2">✓ Inventory</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Form Widget</td>
                  <td className="text-center p-2">✓ Patient Info</td>
                  <td className="text-center p-2">✓ Order Entry</td>
                  <td className="text-center p-2">✓ Time Entry</td>
                  <td className="text-center p-2">✓ Stock Adjust</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Stats Widget</td>
                  <td className="text-center p-2">✓ Vitals</td>
                  <td className="text-center p-2">✓ Order Totals</td>
                  <td className="text-center p-2">✓ Weekly Hours</td>
                  <td className="text-center p-2">✓ Inventory KPIs</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Chart Widget</td>
                  <td className="text-center p-2">✓ Health Trends</td>
                  <td className="text-center p-2">✓ Sales Hourly</td>
                  <td className="text-center p-2">✓ Burn Down</td>
                  <td className="text-center p-2">✓ Stock Movement</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Timeline Widget</td>
                  <td className="text-center p-2">✓ Medical History</td>
                  <td className="text-center p-2">✓ Order Status</td>
                  <td className="text-center p-2">✓ Project Timeline</td>
                  <td className="text-center p-2">✓ Price History</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground">
              <strong>100% Code Reuse</strong> - The exact same widget components power every
              industry
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
