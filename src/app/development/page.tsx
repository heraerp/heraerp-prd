'use client'

import { useState, useEffect } from 'react'
import './development.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Zap, 
  Database, 
  Rocket, 
  Palette, 
  Brain,
  Settings,
  Factory,
  Users,
  DollarSign,
  Package,
  Utensils,
  Stethoscope,
  Building,
  Code,
  Target,
  TrendingUp,
  Shield,
  Play,
  Activity,
  Book
} from 'lucide-react'

interface BuildComponent {
  name: string
  progress: number
  status: 'complete' | 'progress' | 'critical' | 'pending'
}

interface Customer {
  name: string
  type: string
  icon: any
  description: string
  smartCodes: string[]
}

interface MatrixItem {
  component: string
  heraSystem: string
  standardSystem: string
  customRequests: string
  ourCustomers: string
  status: number
  priority: string
}

const DevelopmentMatrix = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [buildComponents, setBuildComponents] = useState<BuildComponent[]>([
    { name: 'Universal Architecture', progress: 100, status: 'complete' },
    { name: 'HERA-SPEAR Framework', progress: 100, status: 'complete' },
    { name: 'Smart Coding System', progress: 90, status: 'progress' },
    { name: 'Financial Module', progress: 25, status: 'critical' },
    { name: 'Restaurant Demo', progress: 5, status: 'pending' }
  ])

  const handleLogin = () => {
    if (password === 'developer@123') {
      setIsAuthenticated(true)
      setError('')
    } else {
      setError('Invalid password')
    }
  }

  const foundationStatus = [
    {
      title: 'Universal Tables',
      icon: Database,
      status: 'complete',
      progress: 100,
      description: '6-table architecture handles infinite business complexity without schema changes'
    },
    {
      title: 'Universal API',
      icon: Rocket,
      status: 'complete',
      progress: 100,
      description: 'Production-ready REST API with JWT auth, rate limiting, validation'
    },
    {
      title: 'Universal UI',
      icon: Palette,
      status: 'complete',
      progress: 100,
      description: 'Complete component library with themes, responsive design'
    },
    {
      title: 'Smart Coding',
      icon: Brain,
      status: 'progress',
      progress: 85,
      description: 'Universal coding patterns with version control and AI intelligence'
    },
    {
      title: 'Business Modules',
      icon: Settings,
      status: 'pending',
      progress: 25,
      description: 'MVP modules for finance, inventory, CRM using universal patterns'
    },
    {
      title: 'Industry Apps',
      icon: Factory,
      status: 'pending',
      progress: 5,
      description: 'Restaurant, healthcare, manufacturing specific implementations'
    }
  ]

  const customers: Customer[] = [
    {
      name: 'HERA as Customer',
      type: 'Internal Development (Dogfooding)',
      icon: Building,
      description: 'HERA builds HERA - Use our own system for development tracking, project management, and internal operations.',
      smartCodes: [
        'Development tasks as universal transactions',
        'Git integration with HERA task tracking',
        'Team collaboration via CRM module',
        'Project financials via FIN module'
      ]
    },
    {
      name: "Mario's Restaurant",
      type: 'Industry Demonstration',
      icon: Utensils,
      description: 'Restaurant POS & Management - Complete restaurant operations from menu management to customer orders to inventory.',
      smartCodes: [
        'HERA.REST.CRM.ENT.MENU.v1 - Menu items',
        'HERA.REST.CRM.TXN.ORDER.v1 - Customer orders',
        'HERA.REST.INV.RCV.TXN.FOOD.v1 - Food delivery',
        'HERA.REST.FIN.GL.RPT.FOOD.v1 - Food cost analysis'
      ]
    },
    {
      name: "Dr. Smith's Clinic",
      type: 'Healthcare Demonstration',
      icon: Stethoscope,
      description: 'Medical Practice Management - Patient records, appointments, treatments, billing, and insurance claims.',
      smartCodes: [
        'HERA.HLTH.CRM.ENT.PAT.v1 - Patient records',
        'HERA.HLTH.CRM.TXN.VISIT.v1 - Patient visits',
        'HERA.HLTH.FIN.AR.TXN.CLM.v1 - Insurance claims',
        'HERA.HLTH.INV.VAL.RPT.EXP.v1 - Drug expiration'
      ]
    },
    {
      name: 'Standard ERP Customers',
      type: 'Universal Implementation',
      icon: Users,
      description: 'Any Business Type - Standard ERP functions that work for manufacturing, professional services, retail, etc.',
      smartCodes: [
        'HERA.FIN.GL.TXN.JE.v1 - Journal entries',
        'HERA.INV.RCV.TXN.IN.v1 - Inventory receiving',
        'HERA.CRM.CUS.ENT.PROF.v1 - Customer profiles',
        'HERA.HR.PAY.TXN.RUN.v1 - Payroll processing'
      ]
    }
  ]

  const matrixData: MatrixItem[] = [
    {
      component: '🏗️ Core Architecture',
      heraSystem: 'DONE',
      standardSystem: 'DONE',
      customRequests: 'DONE',
      ourCustomers: 'DONE',
      status: 100,
      priority: 'Complete'
    },
    {
      component: '🗃️ Universal Tables',
      heraSystem: 'DONE',
      standardSystem: 'DONE',
      customRequests: 'DONE',
      ourCustomers: 'DONE',
      status: 100,
      priority: 'Complete'
    },
    {
      component: '🚀 Universal API',
      heraSystem: 'DONE',
      standardSystem: 'DONE',
      customRequests: 'DONE',
      ourCustomers: 'DONE',
      status: 100,
      priority: 'Complete'
    },
    {
      component: '🎨 UI Components',
      heraSystem: 'DONE',
      standardSystem: 'DONE',
      customRequests: 'WIP',
      ourCustomers: 'DONE',
      status: 90,
      priority: 'High'
    },
    {
      component: '🧠 Smart Coding',
      heraSystem: 'WIP',
      standardSystem: 'WIP',
      customRequests: 'TODO',
      ourCustomers: 'WIP',
      status: 85,
      priority: 'High'
    },
    {
      component: '💰 Financial Module',
      heraSystem: 'TODO',
      standardSystem: 'WIP',
      customRequests: 'TODO',
      ourCustomers: 'TODO',
      status: 25,
      priority: 'Critical'
    },
    {
      component: '📦 Inventory Module',
      heraSystem: 'TODO',
      standardSystem: 'TODO',
      customRequests: 'TODO',
      ourCustomers: 'TODO',
      status: 10,
      priority: 'Critical'
    },
    {
      component: '👥 CRM Module',
      heraSystem: 'TODO',
      standardSystem: 'TODO',
      customRequests: 'TODO',
      ourCustomers: 'TODO',
      status: 15,
      priority: 'Critical'
    },
    {
      component: '🍽️ Restaurant App',
      heraSystem: 'TODO',
      standardSystem: 'TODO',
      customRequests: 'TODO',
      ourCustomers: 'WIP',
      status: 5,
      priority: 'Demo'
    }
  ]

  const priorityActions = [
    {
      number: 1,
      title: 'Complete Smart Coding System',
      description: 'Finalize universal smart codes for all modules with version control integration.',
      timeline: '3-5 days',
      priority: 'Critical'
    },
    {
      number: 2,
      title: 'Implement Financial Core',
      description: 'Build GL, AR, AP modules using universal transaction patterns.',
      timeline: '1 week',
      priority: 'Critical'
    },
    {
      number: 3,
      title: 'Build HERA-builds-HERA',
      description: 'Implement our own development tracking using HERA platform (dogfooding).',
      timeline: '3-5 days',
      priority: 'High'
    },
    {
      number: 4,
      title: "Create Mario's Restaurant Demo",
      description: 'Complete restaurant POS implementation to validate industry-specific patterns.',
      timeline: '1 week',
      priority: 'High'
    }
  ]

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'DONE':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500">✅ DONE</Badge>
      case 'WIP':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500">🔄 WIP</Badge>
      case 'TODO':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500">📋 TODO</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getFoundationCardClass = (status: string) => {
    switch(status) {
      case 'complete':
        return 'border-green-500 bg-gradient-to-br from-green-500/10 to-green-500/5'
      case 'progress':
        return 'border-orange-500 bg-gradient-to-br from-orange-500/10 to-orange-500/5'
      case 'pending':
        return 'border-blue-500 bg-gradient-to-br from-blue-500/10 to-blue-500/5'
      default:
        return 'border-border'
    }
  }

  const overallProgress = Math.round(buildComponents.reduce((sum, comp) => sum + comp.progress, 0) / buildComponents.length)

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
              🔐 HERA Development Access
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-muted-foreground">
                Developer Password
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="Enter developer password"
                className="bg-card"
              />
            </div>
            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}
            <Button onClick={handleLogin} className="w-full">
              <Shield className="w-4 h-4 mr-2" />
              Access Development Matrix
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12 p-12 bg-gradient-to-r from-blue-600/10 to-emerald-600/10 rounded-3xl border border-border/50">
          <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
            🚀 HERA Development Matrix
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Complete Build Orchestration & Status Dashboard
          </p>
          <div className="inline-flex items-center gap-3 px-8 py-4 bg-green-500/20 border border-green-500 rounded-full text-green-400 font-bold text-lg">
            <Target className="w-6 h-6" />
            <span>{overallProgress}% COMPLETE - READY FOR FINAL BUILD!</span>
          </div>
        </div>

        {/* Foundation Status */}
        <Card className="mb-12 border-emerald-500/30">
          <CardHeader>
            <CardTitle className="text-3xl text-emerald-400 text-center">
              🏗️ Foundation Status: REVOLUTIONARY ARCHITECTURE COMPLETE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {foundationStatus.map((item, index) => {
                const IconComponent = item.icon
                return (
                  <Card key={index} className={`relative overflow-hidden transition-all hover:-translate-y-1 hover:shadow-lg ${getFoundationCardClass(item.status)}`}>
                    <CardContent className="p-6 text-center">
                      <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center text-lg">
                        {item.status === 'complete' && '✅'}
                        {item.status === 'progress' && '🔄'}
                        {item.status === 'pending' && '📋'}
                      </div>
                      <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 flex items-center justify-center text-white text-2xl mx-auto mb-4">
                        <IconComponent className="w-8 h-8" />
                      </div>
                      <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                      <Badge className={`mb-4 ${
                        item.status === 'complete' ? 'bg-green-500/20 text-green-400' :
                        item.status === 'progress' ? 'bg-orange-500/20 text-orange-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {item.status === 'complete' && '✅ 100% COMPLETE'}
                        {item.status === 'progress' && `🔄 ${item.progress}% COMPLETE`}
                        {item.status === 'pending' && `📋 ${item.progress}% COMPLETE`}
                      </Badge>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
            
            <Card className="bg-card/50 border-emerald-500/30">
              <CardContent className="p-6">
                <h4 className="text-xl font-bold text-emerald-400 mb-4">🎯 The Revolutionary Achievement:</h4>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  <span className="text-green-400 font-bold">The hardest work is DONE!</span> We've solved the impossible challenge - 
                  creating a universal ERP architecture that works for ANY business without schema changes. 
                  What remains is implementing business modules using our proven patterns.
                </p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        {/* Development Matrix Table */}
        <Card className="mb-12 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-3xl text-purple-400 text-center">
              📊 Complete Development Matrix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-card/50 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-card border-b border-border">
                    <th className="p-4 text-left font-bold">Component</th>
                    <th className="p-4 text-left font-bold">HERA System</th>
                    <th className="p-4 text-left font-bold">Standard System</th>
                    <th className="p-4 text-left font-bold">Custom Requests</th>
                    <th className="p-4 text-left font-bold">Our Customers</th>
                    <th className="p-4 text-left font-bold">Status</th>
                    <th className="p-4 text-left font-bold">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {matrixData.map((item, index) => (
                    <tr key={index} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="p-4 font-semibold">{item.component}</td>
                      <td className="p-4">{getStatusBadge(item.heraSystem)}</td>
                      <td className="p-4">{getStatusBadge(item.standardSystem)}</td>
                      <td className="p-4">{getStatusBadge(item.customRequests)}</td>
                      <td className="p-4">{getStatusBadge(item.ourCustomers)}</td>
                      <td className="p-4">
                        <Badge variant="outline">{item.status}%</Badge>
                      </td>
                      <td className="p-4 text-sm">{item.priority}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Customer Development Strategy */}
        <Card className="mb-12 border-amber-500/30">
          <CardHeader>
            <CardTitle className="text-3xl text-amber-400 text-center">
              👥 Multi-Customer Development Strategy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {customers.map((customer, index) => {
                const IconComponent = customer.icon
                return (
                  <Card key={index} className="border-border/50 hover:-translate-y-1 transition-all">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-blue-500 to-emerald-500 flex items-center justify-center text-white">
                          <IconComponent className="w-7 h-7" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold">{customer.name}</h3>
                          <p className="text-muted-foreground">{customer.type}</p>
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-6">
                        {customer.description}
                      </p>
                      <Card className="bg-card/50">
                        <CardContent className="p-4">
                          <h4 className="text-amber-400 font-semibold mb-3">
                            {customer.name.includes('HERA') ? 'Implementation:' : 'Smart Codes:'}
                          </h4>
                          <ul className="space-y-2 text-sm text-muted-foreground">
                            {customer.smartCodes.map((code, codeIndex) => (
                              <li key={codeIndex} className="leading-relaxed">• {code}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Priority Actions */}
        <Card className="mb-12 border-red-500/30">
          <CardHeader>
            <CardTitle className="text-3xl text-red-400 text-center">
              🔥 Immediate Priority Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {priorityActions.map((action, index) => (
                <Card key={index} className="border-border/50 text-center">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-4">
                      {action.number}
                    </div>
                    <h3 className="text-lg font-semibold mb-3">{action.title}</h3>
                    <p className="text-muted-foreground mb-4">{action.description}</p>
                    <Card className="bg-card/50">
                      <CardContent className="p-3 text-sm">
                        <div><strong>Timeline:</strong> {action.timeline}</div>
                        <div><strong>Priority:</strong> {action.priority}</div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Developer Tools - Jobs-inspired */}
        <Card className="mb-12 border-gradient-to-r from-indigo-500/30 to-purple-500/30">
          <CardHeader>
            <CardTitle className="text-2xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent text-center">
              🛠️ Developer Tools Laboratory
            </CardTitle>
            <p className="text-center text-muted-foreground mt-2">
              "The interface is the product" - Steve Jobs inspired developer experience
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/development/api-testing">
                <Button className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 border border-blue-500/30 text-white transition-all transform hover:scale-105">
                  <Play className="w-6 h-6" />
                  <span className="text-sm font-medium">API Testing Lab</span>
                  <span className="text-xs opacity-75">Execute & Validate</span>
                </Button>
              </Link>
              
              <Link href="/development/api-monitor">
                <Button className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-emerald-500/20 to-blue-500/20 hover:from-emerald-500/30 hover:to-blue-500/30 border border-emerald-500/30 text-white transition-all transform hover:scale-105">
                  <Activity className="w-6 h-6" />
                  <span className="text-sm font-medium">Performance Monitor</span>
                  <span className="text-xs opacity-75">Real-time Metrics</span>
                </Button>
              </Link>
              
              <Link href="/development/api-docs">
                <Button className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 hover:from-indigo-500/30 hover:to-purple-500/30 border border-indigo-500/30 text-white transition-all transform hover:scale-105">
                  <Book className="w-6 h-6" />
                  <span className="text-sm font-medium">API Documentation</span>
                  <span className="text-xs opacity-75">Complete Reference</span>
                </Button>
              </Link>
              
              <Link href="/development/build">
                <Button className="w-full h-20 flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/30 text-white transition-all transform hover:scale-105">
                  <Building className="w-6 h-6" />
                  <span className="text-sm font-medium">Build Management</span>
                  <span className="text-xs opacity-75">Deployment Control</span>
                </Button>
              </Link>
            </div>
            
            <div className="mt-6 p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg border border-indigo-500/20">
              <p className="text-center text-sm text-gray-300">
                <span className="font-semibold text-indigo-400">All tools require developer access:</span> password <code className="bg-black/30 px-2 py-1 rounded text-xs">developer@123</code>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Final CTA */}
        <Card className="bg-gradient-to-r from-blue-600/20 to-emerald-600/20 border-none">
          <CardContent className="p-12 text-center text-white">
            <h2 className="text-4xl font-bold mb-6">🎯 We're Ready to Build!</h2>
            <p className="text-xl mb-8 opacity-95">
              <strong>Foundation Complete. Architecture Proven. Time to Implement!</strong>
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-4">
                  <h3 className="font-bold mb-2">✅ {overallProgress}% Complete</h3>
                  <p className="text-sm opacity-90">Revolutionary architecture finished</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-4">
                  <h3 className="font-bold mb-2">🔥 {100 - overallProgress}% Remaining</h3>
                  <p className="text-sm opacity-90">Business module implementation</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-4">
                  <h3 className="font-bold mb-2">🚀 6-8 Weeks</h3>
                  <p className="text-sm opacity-90">To complete MVP demonstrations</p>
                </CardContent>
              </Card>
              <Card className="bg-white/10 border-white/20">
                <CardContent className="p-4">
                  <h3 className="font-bold mb-2">🌟 Market Ready</h3>
                  <p className="text-sm opacity-90">Universal ERP platform complete</p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white/10 border-white/20">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4">🎯 The Build Strategy:</h3>
                <p className="text-lg leading-relaxed opacity-95">
                  Use HERA to build HERA (dogfooding) → Create Mario's Restaurant demo → 
                  Add healthcare demo → Launch universal platform for any business type!
                </p>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default DevelopmentMatrix