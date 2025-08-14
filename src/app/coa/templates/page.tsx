'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft,
  Plus,
  Search,
  Download,
  Upload,
  Copy,
  Edit,
  Trash2,
  Eye,
  Globe,
  Building,
  Users,
  Star,
  Clock,
  CheckCircle,
  AlertTriangle,
  Utensils,
  Stethoscope,
  Factory,
  Store,
  GraduationCap,
  Truck,
  MoreHorizontal
} from 'lucide-react'
import { DualAuthProvider } from '@/components/auth/DualAuthProvider'

interface COATemplate {
  id: string
  name: string
  description: string
  industry: string
  country: string
  version: string
  accountCount: number
  organizationsUsing: number
  icon: React.ComponentType<any>
  color: string
  status: 'active' | 'draft' | 'deprecated'
  isOfficial: boolean
  createdBy: string
  createdDate: string
  lastModified: string
  features: string[]
}

interface TemplateStats {
  totalTemplates: number
  activeTemplates: number
  draftTemplates: number
  totalOrganizations: number
}

export default function COATemplatesManagement() {
  const [templates, setTemplates] = useState<COATemplate[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<COATemplate[]>([])
  const [stats, setStats] = useState<TemplateStats>({
    totalTemplates: 0,
    activeTemplates: 0,
    draftTemplates: 0,
    totalOrganizations: 0
  })
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    filterTemplates()
  }, [templates, searchTerm, filterStatus])

  const loadTemplates = async () => {
    try {
      // Mock data - replace with actual API call
      const mockTemplates: COATemplate[] = [
        {
          id: '1',
          name: 'Restaurant Industry (US GAAP)',
          description: 'Complete Chart of Accounts template specifically designed for restaurant operations including food service, hospitality, and multi-location management.',
          industry: 'Restaurant',
          country: 'USA',
          version: '2.1.0',
          accountCount: 85,
          organizationsUsing: 24,
          icon: Utensils,
          color: 'from-amber-500 to-orange-500',
          status: 'active',
          isOfficial: true,
          createdBy: 'HERA System',
          createdDate: '2024-01-15',
          lastModified: '2024-01-28',
          features: ['Food Cost Tracking', 'Labor Management', 'POS Integration', 'Multi-Location']
        },
        {
          id: '2',
          name: 'Healthcare Practice (US GAAP)',
          description: 'Medical practice and healthcare facility template with insurance billing, patient accounts, and compliance features.',
          industry: 'Healthcare',
          country: 'USA',
          version: '1.8.2',
          accountCount: 125,
          organizationsUsing: 18,
          icon: Stethoscope,
          color: 'from-blue-500 to-cyan-500',
          status: 'active',
          isOfficial: true,
          createdBy: 'HERA System',
          createdDate: '2024-01-10',
          lastModified: '2024-01-25',
          features: ['Insurance Billing', 'Patient AR', 'Compliance Tracking', 'EMR Integration']
        },
        {
          id: '3',
          name: 'Manufacturing (US GAAP)',
          description: 'Industrial manufacturing template with work-in-progress tracking, inventory management, and production costing.',
          industry: 'Manufacturing',
          country: 'USA',
          version: '3.0.1',
          accountCount: 150,
          organizationsUsing: 12,
          icon: Factory,
          color: 'from-purple-500 to-indigo-500',
          status: 'active',
          isOfficial: true,
          createdBy: 'HERA System',
          createdDate: '2024-01-05',
          lastModified: '2024-01-20',
          features: ['WIP Tracking', 'Raw Materials', 'Production Costing', 'Quality Control']
        },
        {
          id: '4',
          name: 'Retail Business (US GAAP)',
          description: 'Comprehensive retail template with inventory valuation, multi-channel sales, and customer management.',
          industry: 'Retail',
          country: 'USA',
          version: '1.5.0',
          accountCount: 95,
          organizationsUsing: 31,
          icon: Store,
          color: 'from-emerald-500 to-teal-500',
          status: 'active',
          isOfficial: true,
          createdBy: 'HERA System',
          createdDate: '2024-01-08',
          lastModified: '2024-01-22',
          features: ['Multi-Channel Sales', 'Inventory Valuation', 'Returns Management', 'E-commerce']
        },
        {
          id: '5',
          name: 'Educational Institution',
          description: 'Template for schools, colleges, and educational organizations with grant tracking and program costing.',
          industry: 'Education',
          country: 'USA',
          version: '2.0.0',
          accountCount: 110,
          organizationsUsing: 8,
          icon: GraduationCap,
          color: 'from-indigo-500 to-purple-500',
          status: 'draft',
          isOfficial: false,
          createdBy: 'John Smith',
          createdDate: '2024-01-12',
          lastModified: '2024-01-29',
          features: ['Grant Tracking', 'Student Accounts', 'Program Costing', 'Tuition Management']
        },
        {
          id: '6',
          name: 'Logistics & Transportation',
          description: 'Transportation and logistics template with vehicle costing, route profitability, and fuel management.',
          industry: 'Logistics',
          country: 'USA',
          version: '1.2.1',
          accountCount: 105,
          organizationsUsing: 6,
          icon: Truck,
          color: 'from-slate-500 to-gray-500',
          status: 'active',
          isOfficial: false,
          createdBy: 'Transport Solutions Inc',
          createdDate: '2024-01-18',
          lastModified: '2024-01-26',
          features: ['Vehicle Costing', 'Route Analysis', 'Fuel Management', 'Driver Payroll']
        }
      ]

      setTemplates(mockTemplates)
      
      // Calculate stats
      const activeTemplates = mockTemplates.filter(t => t.status === 'active')
      const draftTemplates = mockTemplates.filter(t => t.status === 'draft')
      const totalOrganizations = mockTemplates.reduce((sum, t) => sum + t.organizationsUsing, 0)

      setStats({
        totalTemplates: mockTemplates.length,
        activeTemplates: activeTemplates.length,
        draftTemplates: draftTemplates.length,
        totalOrganizations
      })
      
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to load templates:', error)
      setIsLoading(false)
    }
  }

  const filterTemplates = () => {
    let filtered = templates

    if (searchTerm) {
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.industry.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(template => template.status === filterStatus)
    }

    setFilteredTemplates(filtered)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">Active</Badge>
      case 'draft':
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">Draft</Badge>
      case 'deprecated':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Deprecated</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />
      case 'draft':
        return <Clock className="w-4 h-4 text-amber-500" />
      case 'deprecated':
        return <AlertTriangle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  return (
    <DualAuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        {/* Header */}
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button 
                  variant="ghost" 
                  onClick={() => router.push('/coa')}
                  className="p-2"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    COA Templates
                  </h1>
                  <p className="text-slate-600 mt-1">
                    Manage Chart of Accounts templates for different industries
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" className="flex items-center">
                  <Upload className="w-4 h-4 mr-2" />
                  Import Template
                </Button>
                <Button variant="outline" className="flex items-center">
                  <Download className="w-4 h-4 mr-2" />
                  Export All
                </Button>
                <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Template
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-cyan-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 mb-1">
                      Total Templates
                    </p>
                    <p className="text-3xl font-bold text-blue-900">
                      {stats.totalTemplates}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                    <Globe className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-emerald-600 mb-1">
                      Active Templates
                    </p>
                    <p className="text-3xl font-bold text-emerald-900">
                      {stats.activeTemplates}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-amber-600 mb-1">
                      Draft Templates
                    </p>
                    <p className="text-3xl font-bold text-amber-900">
                      {stats.draftTemplates}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-indigo-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-purple-600 mb-1">
                      Organizations
                    </p>
                    <p className="text-3xl font-bold text-purple-900">
                      {stats.totalOrganizations}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
                    <Building className="w-6 h-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filters */}
          <Card className="border-0 shadow-lg mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search templates by name, industry, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="draft">Draft</option>
                    <option value="deprecated">Deprecated</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Templates Grid */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mr-3" />
                Loading templates...
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTemplates.map((template) => {
                const Icon = template.icon
                
                return (
                  <Card 
                    key={template.id}
                    className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 group overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${template.color} opacity-0 group-hover:opacity-5 transition-all duration-300`} />
                    
                    <CardHeader className="relative">
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} flex items-center justify-center shadow-lg`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex items-center space-x-2">
                          {template.isOfficial && (
                            <Badge className="bg-blue-100 text-blue-800 border-blue-200 flex items-center">
                              <Star className="w-3 h-3 mr-1" />
                              Official
                            </Badge>
                          )}
                          {getStatusBadge(template.status)}
                        </div>
                      </div>
                      
                      <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                        {template.name}
                      </CardTitle>
                      <p className="text-sm text-slate-600 line-clamp-2">
                        {template.description}
                      </p>
                    </CardHeader>

                    <CardContent className="relative">
                      <div className="space-y-4">
                        {/* Template Info */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-slate-500">Industry:</span>
                            <div className="font-medium text-slate-900">{template.industry}</div>
                          </div>
                          <div>
                            <span className="text-slate-500">Version:</span>
                            <div className="font-medium text-slate-900">{template.version}</div>
                          </div>
                          <div>
                            <span className="text-slate-500">Accounts:</span>
                            <div className="font-medium text-slate-900">{template.accountCount}</div>
                          </div>
                          <div>
                            <span className="text-slate-500">In Use:</span>
                            <div className="font-medium text-slate-900">{template.organizationsUsing}</div>
                          </div>
                        </div>

                        {/* Features */}
                        <div>
                          <span className="text-sm text-slate-500 mb-2 block">Key Features:</span>
                          <div className="flex flex-wrap gap-1">
                            {template.features.slice(0, 2).map((feature, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {feature}
                              </Badge>
                            ))}
                            {template.features.length > 2 && (
                              <Badge variant="outline" className="text-xs">
                                +{template.features.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Created By */}
                        <div className="text-xs text-slate-500 pt-2 border-t border-slate-200">
                          Created by {template.createdBy} • {new Date(template.createdDate).toLocaleDateString()}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-between pt-4">
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" className="p-2">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="p-2">
                              <Copy className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="p-2">
                              <Edit className="w-4 h-4" />
                            </Button>
                            {!template.isOfficial && (
                              <Button variant="ghost" size="sm" className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                          <Button variant="ghost" size="sm" className="p-2">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}

          {filteredTemplates.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="text-slate-500">
                <Globe className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <p className="text-lg font-medium mb-2">No templates found</p>
                <p className="text-sm">Try adjusting your search or filters</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DualAuthProvider>
  )
}