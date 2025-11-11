/**
 * HERA Retail Dashboard
 * Smart Code: HERA.RETAIL.DASHBOARD.v1
 * 
 * SAP Fiori-style dashboard matching the reference design
 * Organization: HERA Retail Demo (ff837c4c-95f2-43ac-a498-39597018b10c)
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { apiV2 } from '@/lib/client/fetchV2'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  ShoppingBag,
  Truck,
  Tag,
  Warehouse,
  TrendingUp,
  Calculator,
  Heart,
  BarChart3,
  Settings,
  LogOut,
  Loader2,
  CheckCircle,
  AlertTriangle,
  Clock,
  DollarSign,
  Package,
  Users,
  Store,
  ChevronRight,
  Bell,
  Search,
  Menu,
  Home,
  Calendar,
  User,
  Receipt,
  Folder,
  FileText,
  CreditCard,
  Building,
  ArrowDown,
  ArrowRight,
  RefreshCw
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Tooltip } from 'recharts'

// Chart Data
const profitMarginData = [
  { month: 'Jan', value: 38.2, netValue: 1.8 },
  { month: 'Feb', value: 45.1, netValue: 2.5 },
  { month: 'Mar', value: 41.8, netValue: 2.1 },
  { month: 'Apr', value: 43.8, netValue: 1.9 }
]

const stockValueData = [
  { name: 'Raw Materials', value: 18.2, color: '#3B82F6' },
  { name: 'Finished Goods', value: 26.33, color: '#EF4444' }
]

const deadStockData = [
  { month: 'Jan', value: 2.4 },
  { month: 'Feb', value: 1.8 },
  { month: 'Mar', value: 3.1 },
  { month: 'Apr', value: 2.2 },
  { month: 'May', value: 1.9 },
  { month: 'Jun', value: 2.7 }
]

const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B']

// AI Message Interface
interface AIMessage {
  type: 'ai' | 'user'
  message: string
  timestamp: string
  features?: string[]
}

// Dynamic interface for workspace modules
interface DynamicRetailModule {
  id: string
  entity_id: string
  title: string
  subtitle: string
  icon: any
  bgColor: string
  textColor: string
  domain: string
  section: string
  workspace: string
  roles: string[]
  entity_code: string
  smart_code: string
}

// SAP Fiori-style Insights Tiles matching the screenshot layout
const insightsTiles = [
  {
    title: 'CFO Sales Dashboard',
    subtitle: '',
    value: '4.56',
    unit: 'M',
    note: 'new USD',
    icon: TrendingUp
  },
  {
    title: 'Monitor Predictive Accounting',
    subtitle: 'Predictive Quality',
    value: '0',
    unit: 'Percent',
    icon: CheckCircle
  },
  {
    title: 'Supplier Invoices List',
    value: '60',
    icon: FileText
  },
  {
    title: 'Sales Accounting Overview',
    icon: BarChart3
  },
  {
    title: 'Sales Volume',
    value: '4.51',
    unit: 'M',
    note: 'USD',
    icon: DollarSign
  },
  {
    title: 'Cash Flow Analyzer',
    icon: TrendingUp
  },
  {
    title: 'Manage Banks',
    subtitle: 'Cash Management',
    icon: Building
  }
]

// Insights Cards for the bottom section
const insightsCards = [
  {
    title: 'Profit Margin',
    subtitle: 'By Month',
    value: '43.8',
    unit: '%',
    chartType: 'bar',
    data: [1.5, 2.5, 2, 1.8]
  },
  {
    title: 'Stock Value by Stock Type',
    subtitle: 'Total Value USD',
    value: '44.53',
    unit: 'K',
    chartType: 'donut',
    description: 'Stock Value CC Currency by Stock Type'
  },
  {
    title: 'Dead Stock Analysis',
    subtitle: 'US Plants',
    chartType: 'line'
  },
  {
    title: 'G/L Item Changes',
    subtitle: 'Most Recent',
    items: [
      { entry: '4000000223', field: 'Reversal Org', oldValue: 'CB988000030', newValue: '2024', date: 'NOV 29, 2024' },
      { entry: '4000000223', field: 'Reversal Ref', oldValue: 'CB988000030', newValue: '4000000655', date: 'NOV 29, 2024' },
      { entry: '4000000223', field: 'ReversalRefTran', oldValue: 'CB988000030', newValue: 'MKPF', date: 'NOV 29, 2024' }
    ]
  }
]

export default function RetailDashboard() {
  const router = useRouter()
  const { 
    user, 
    organization, 
    isAuthenticated, 
    isLoading, 
    logout,
    contextLoading 
  } = useHERAAuth()

  // Dynamic modules state
  const [dynamicModules, setDynamicModules] = useState<DynamicRetailModule[]>([])
  const [modulesLoading, setModulesLoading] = useState(true)
  const [modulesError, setModulesError] = useState<string | null>(null)

  const [currentTime, setCurrentTime] = useState(new Date())
  const [aiMessage, setAiMessage] = useState('')
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([
    {
      type: 'ai',
      message: "Hi! I'm your HERA AI assistant. How can I help you with retail operations today?",
      timestamp: 'Just now'
    },
    {
      type: 'ai',
      message: "I can help you with:",
      features: [
        "• Inventory analysis",
        "• Sales forecasting", 
        "• Customer insights",
        "• Performance reports"
      ],
      timestamp: '2 min ago'
    }
  ])

  // Parse APP_WORKSPACE entities into retail modules
  const parseWorkspaceEntity = (entity: any): DynamicRetailModule => {
    // Extract domain, section, workspace from smart_code
    // Example: "HERA.PLATFORM.NAV.APPWORKSPACE.INVENTORY.STOCKMAIN.V1"
    const smartCodeParts = entity.smart_code?.split('.') || []
    const domain = smartCodeParts[4]?.toLowerCase() || 'retail'
    const section = smartCodeParts[5]?.toLowerCase().replace('stockmain', 'main') || 'inventory'  
    const workspace = 'main'

    // Icon mapping based on entity_code patterns
    const getIconAndColor = (entityCode: string, entityName: string) => {
      const code = entityCode.toLowerCase()
      const name = entityName.toLowerCase()
      
      if (code.includes('inventory') || name.includes('inventory')) {
        return { icon: Warehouse, bgColor: 'bg-teal-600' }
      }
      if (code.includes('pos') || name.includes('pos')) {
        return { icon: Store, bgColor: 'bg-indigo-600' }
      }
      if (code.includes('wholesale') || name.includes('wholesale')) {
        return { icon: Truck, bgColor: 'bg-slate-600' }
      }
      if (code.includes('finance') || name.includes('finance')) {
        return { icon: Calculator, bgColor: 'bg-red-800' }
      }
      if (code.includes('merchandise') || name.includes('catalog')) {
        return { icon: Tag, bgColor: 'bg-amber-600' }
      }
      if (code.includes('analytics') || name.includes('analytics')) {
        return { icon: BarChart3, bgColor: 'bg-purple-600' }
      }
      if (code.includes('admin') || name.includes('admin')) {
        return { icon: Settings, bgColor: 'bg-gray-600' }
      }
      if (code.includes('crm') || name.includes('customer')) {
        return { icon: Users, bgColor: 'bg-pink-600' }
      }
      // Default
      return { icon: Package, bgColor: 'bg-blue-600' }
    }

    const { icon, bgColor } = getIconAndColor(entity.entity_code, entity.entity_name)

    return {
      id: entity.id,
      entity_id: entity.id,
      title: entity.entity_name.replace(' Workspace', ''),
      subtitle: entity.entity_description || `${section.charAt(0).toUpperCase() + section.slice(1)} Management`,
      icon,
      bgColor,
      textColor: 'text-white',
      domain,
      section,
      workspace,
      roles: ['Manager', 'Operator'], // Default roles
      entity_code: entity.entity_code,
      smart_code: entity.smart_code
    }
  }

  // Fetch dynamic modules from APP_WORKSPACE entities
  const fetchDynamicModules = async () => {
    if (!organization?.id) return

    try {
      setModulesLoading(true)
      setModulesError(null)

      const response = await apiV2.get('entities', {
        entity_type: 'APP_WORKSPACE',
        organization_id: organization.id,
        limit: 50
      })

      if (response.data?.items) {
        const modules = response.data.items
          .filter((entity: any) => entity.entity_type === 'APP_WORKSPACE')
          .map(parseWorkspaceEntity)
          .sort((a: DynamicRetailModule, b: DynamicRetailModule) => a.title.localeCompare(b.title))

        setDynamicModules(modules)
        console.log('✅ Loaded dynamic modules:', modules.length, 'workspaces')
      } else {
        console.warn('No APP_WORKSPACE entities found, using fallback modules')
        // Fallback to hardcoded modules if no APP_WORKSPACE entities exist
        setDynamicModules([])
      }
    } catch (error) {
      console.error('❌ Error fetching dynamic modules:', error)
      setModulesError('Failed to load workspace modules')
      setDynamicModules([])
    } finally {
      setModulesLoading(false)
    }
  }

  // Load dynamic modules when organization is available
  useEffect(() => {
    if (organization?.id && isAuthenticated) {
      fetchDynamicModules()
    }
  }, [organization?.id, isAuthenticated])

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const handleAIMessage = async () => {
    if (!aiMessage.trim()) return
    
    // Add user message
    const userMessage: AIMessage = {
      type: 'user',
      message: aiMessage,
      timestamp: 'Just now'
    }
    
    setAiMessages(prev => [...prev, userMessage])
    setAiMessage('')
    
    // Simulate AI response
    setTimeout(() => {
      const aiResponse: AIMessage = {
        type: 'ai',
        message: "I understand you're asking about retail operations. This is a demo interface - in production, I would analyze your specific data and provide actionable insights.",
        timestamp: 'Just now'
      }
      setAiMessages(prev => [...prev, aiResponse])
    }, 1000)
  }

  // Show loading state
  if (isLoading || contextLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-indigo-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading retail dashboard...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    router.push('/retail/login')
    return null
  }

  // Show warning if no organization context
  if (!organization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4">
        <div className="max-w-2xl mx-auto pt-20">
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              No organization context found. Please contact your administrator.
            </AlertDescription>
          </Alert>
          
          <div className="mt-6 text-center">
            <Button onClick={logout} variant="outline">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }


  return (
    <div className="min-h-screen bg-gray-50">
      {/* HERA Fiori Header - Left Aligned */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-3">
          <div className="flex items-center justify-between">
            {/* HERA Logo and Navigation */}
            <div className="flex items-center gap-6">
              <div className="bg-indigo-600 text-white px-3 py-1 rounded text-sm font-bold">
                HERA
              </div>
              
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" className="flex items-center gap-1">
                  <span>Home</span>
                  <ArrowDown className="h-3 w-3" />
                </Button>
                
                <nav className="flex items-center gap-6 text-sm text-gray-600">
                  <span className="text-indigo-600 font-medium underline">My Home</span>
                  <span>Cash Management</span>
                  <span>General Ledger</span>
                  <span>Accounts Payable</span>
                  <span>Overhead Accounting</span>
                  <span>Fixed Assets</span>
                  <span>Store Operations</span>
                </nav>
              </div>
            </div>

            {/* Search and User */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <select className="bg-gray-100 border border-gray-300 rounded px-3 py-1 text-sm">
                  <option>All</option>
                </select>
              </div>
              
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  className="pl-9 pr-4 py-1 border border-gray-300 rounded text-sm w-64"
                />
              </div>

              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-gray-500" />
                <User className="h-4 w-4 text-gray-500" />
                <span className="bg-indigo-600 text-white text-xs px-2 py-1 rounded">HR</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="p-4 lg:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Left Column - Pages and Insights */}
          <div className="lg:col-span-3 space-y-6 lg:space-y-8">
            
            {/* Dynamic Retail Modules Section */}
            <div>
              <div className="flex items-center gap-2 mb-4 lg:mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Retail Modules ({modulesLoading ? '...' : dynamicModules.length})
                </h2>
                <ArrowDown className="h-4 w-4 text-gray-500" />
                {!modulesLoading && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={fetchDynamicModules}
                    className="ml-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Loading State */}
              {modulesLoading && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 lg:gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-28 lg:h-36"></div>
                  ))}
                </div>
              )}

              {/* Error State */}
              {modulesError && !modulesLoading && (
                <Alert className="border-red-200 bg-red-50 mb-4">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    {modulesError}. <Button variant="link" onClick={fetchDynamicModules} className="text-red-600 underline p-0 h-auto">Try again</Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Dynamic Modules Grid */}
              {!modulesLoading && dynamicModules.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 lg:gap-4">
                  {dynamicModules.map((module) => {
                    const Icon = module.icon
                    return (
                      <div
                        key={module.entity_id}
                        className={`${module.bgColor} ${module.textColor} rounded-lg cursor-pointer hover:opacity-90 transition-all duration-200 hover:scale-105 shadow-sm hover:shadow-md relative group`}
                        onClick={() => {
                          // Dynamic universal routing to workspace page
                          if (module.domain && module.section && module.workspace) {
                            const route = `/${module.domain}/${module.section}/${module.workspace}`
                            console.log(`🎯 Navigating to workspace: ${route}`)
                            router.push(route)
                          } else {
                            alert(`${module.title} workspace navigation:\n\nRoute: /${module.domain}/${module.section}/${module.workspace}\nEntity: ${module.entity_code}\nSmart Code: ${module.smart_code}`)
                          }
                        }}
                      >
                        <div className="p-4 lg:p-5 h-28 lg:h-36 flex flex-col justify-between">
                          <div className="flex items-start justify-between">
                            <Icon className="h-6 w-6 lg:h-7 lg:w-7" />
                            <div className="text-xs opacity-75 hidden lg:block">
                              {module.roles.join(' • ')}
                            </div>
                          </div>
                          <div>
                            <h3 className="font-semibold text-sm lg:text-base mb-1 leading-tight">{module.title}</h3>
                            <p className="text-xs lg:text-sm opacity-90 leading-tight">{module.subtitle}</p>
                            
                            {/* Entity code badge on hover */}
                            <div className="absolute bottom-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Badge variant="outline" className="text-xs bg-black/20 text-white border-white/30">
                                {module.entity_code.split('-').pop()}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Empty State */}
              {!modulesLoading && dynamicModules.length === 0 && !modulesError && (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Workspaces Found</h3>
                  <p className="text-gray-500 mb-4">No APP_WORKSPACE entities found in this organization.</p>
                  <Button onClick={fetchDynamicModules} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Reload Workspaces
                  </Button>
                </div>
              )}
            </div>

            {/* Insights Tiles */}
            <div>
              <div className="flex items-center justify-between mb-4 lg:mb-6">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-gray-900">Insights Tiles (7)</h2>
                  <ArrowDown className="h-4 w-4 text-gray-500" />
                </div>
                <Button variant="link" className="text-indigo-600 text-sm hidden lg:block">
                  Add Tiles
                </Button>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2 lg:gap-3">
                {insightsTiles.map((tile, index) => {
                  const Icon = tile.icon
                  return (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
                      <div className="space-y-2">
                        <div className="text-xs text-gray-600 font-medium">
                          {tile.title}
                        </div>
                        {tile.subtitle && (
                          <div className="text-xs text-gray-500">
                            {tile.subtitle}
                          </div>
                        )}
                        {tile.value && (
                          <div className="space-y-1">
                            <div className="text-2xl font-semibold text-gray-900">
                              {tile.value}
                              {tile.unit && (
                                <span className="text-sm font-normal text-gray-500 ml-1">
                                  {tile.unit}
                                </span>
                              )}
                            </div>
                            {tile.note && (
                              <div className="text-xs text-gray-500">
                                {tile.note}
                              </div>
                            )}
                          </div>
                        )}
                        {!tile.value && (
                          <div className="py-4">
                            <Icon className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Insights Cards */}
            <div>
              <div className="flex items-center gap-2 mb-4 lg:mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Insights Cards (4)</h2>
                <ArrowDown className="h-4 w-4 text-gray-500" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
                {insightsCards.map((card, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900 text-sm">{card.title}</h3>
                          {card.subtitle && (
                            <p className="text-xs text-gray-500 mt-1">{card.subtitle}</p>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" className="p-1">
                          <span className="text-gray-400">•••</span>
                        </Button>
                      </div>
                    </div>
                    
                    <div className="p-4">
                      {card.chartType === 'bar' && (
                        <div className="space-y-3">
                          <div className="text-2xl font-semibold text-gray-900">
                            {card.value}<span className="text-sm font-normal text-gray-500">{card.unit}</span>
                          </div>
                          <div className="text-xs text-gray-500 mb-3">Net Value</div>
                          <div className="h-20">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={profitMarginData}>
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                                <Bar dataKey="netValue" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                                <Tooltip 
                                  contentStyle={{ 
                                    backgroundColor: 'white', 
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '4px',
                                    fontSize: '12px'
                                  }}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      )}
                      
                      {card.chartType === 'donut' && (
                        <div className="space-y-3">
                          <div className="text-2xl font-semibold text-gray-900">
                            {card.value}<span className="text-sm font-normal text-gray-500">{card.unit}</span>
                          </div>
                          <div className="h-20">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={stockValueData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={20}
                                  outerRadius={35}
                                  dataKey="value"
                                  startAngle={90}
                                  endAngle={450}
                                >
                                  {stockValueData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip 
                                  contentStyle={{ 
                                    backgroundColor: 'white', 
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '4px',
                                    fontSize: '12px'
                                  }}
                                />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="text-xs text-gray-500">{card.description}</div>
                        </div>
                      )}
                      
                      {card.chartType === 'line' && (
                        <div className="h-20">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={deadStockData}>
                              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                              <YAxis hide />
                              <Line 
                                type="monotone" 
                                dataKey="value" 
                                stroke="#3B82F6" 
                                strokeWidth={2}
                                dot={{ fill: '#3B82F6', r: 3 }}
                              />
                              <Tooltip 
                                contentStyle={{ 
                                  backgroundColor: 'white', 
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '4px',
                                  fontSize: '12px'
                                }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                      
                      {card.items && (
                        <div className="space-y-2">
                          {card.items.map((item, i) => (
                            <div key={i} className="text-xs">
                              <div className="text-gray-900 font-medium">Journal Entry: {item.entry}</div>
                              <div className="text-gray-500">{item.field}: {item.oldValue} → {item.newValue}</div>
                              <div className="text-gray-400">{item.date}</div>
                              {i < card.items!.length - 1 && <hr className="my-2" />}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - News and AI Agent */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* AI Agent Chatbot */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold text-gray-900">HERA AI Assistant</h2>
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">AI</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm text-gray-900">HERA Assistant</h3>
                      <p className="text-xs text-green-600">Online</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 h-64 overflow-y-auto bg-gray-50">
                  <div className="space-y-3">
                    {aiMessages.map((msg, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          msg.type === 'ai' ? 'bg-indigo-500' : 'bg-gray-500'
                        }`}>
                          <span className="text-white text-xs">
                            {msg.type === 'ai' ? 'AI' : 'U'}
                          </span>
                        </div>
                        <div className={`rounded-lg px-3 py-2 shadow-sm ${
                          msg.type === 'ai' ? 'bg-white' : 'bg-indigo-100'
                        }`}>
                          <p className="text-sm text-gray-700">
                            {msg.message}
                          </p>
                          {msg.features && (
                            <ul className="text-xs text-gray-600 mt-1 space-y-1">
                              {msg.features.map((feature, i) => (
                                <li key={i}>{feature}</li>
                              ))}
                            </ul>
                          )}
                          <div className="text-xs text-gray-400 mt-1">{msg.timestamp}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="p-3 border-t border-gray-100">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={aiMessage}
                      onChange={(e) => setAiMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAIMessage()}
                      placeholder="Ask me anything about your retail data..."
                      className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
                    />
                    <Button 
                      size="sm" 
                      onClick={handleAIMessage}
                      disabled={!aiMessage.trim()}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 disabled:opacity-50"
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* News Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-lg font-semibold text-gray-900">News</h2>
                <ArrowDown className="h-4 w-4 text-gray-500" />
              </div>
              
              <div className="space-y-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                  <div className="relative h-32 lg:h-40 bg-gradient-to-r from-indigo-400 to-indigo-600 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                    <div className="relative text-center text-white z-10 px-4">
                      <h3 className="font-semibold text-sm lg:text-base mb-1">HERA Platform Updates</h3>
                      <p className="text-xs opacity-90">New features in v2.4</p>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-500">HERA Retail Cloud v2.4</p>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-900 mb-1">AI-Powered Inventory Optimization</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        New machine learning algorithms automatically optimize stock levels based on seasonal trends and customer behavior.
                      </p>
                      <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-900 mb-1">Mobile POS Enhancement</h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Updated mobile point-of-sale interface with faster checkout and improved customer experience.
                      </p>
                      <p className="text-xs text-gray-400 mt-1">1 day ago</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}