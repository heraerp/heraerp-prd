'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import {
  Search,
  Plus,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Award,
  Camera,
  FileText,
  Package,
  Star,
  Diamond,
  Sparkles,
  RefreshCw,
  Edit,
  Trash2,
  Filter,
  Download,
  Upload,
  AlertTriangle,
  Microscope,
  Shield,
  Calendar,
  User,
  MapPin,
  Gem
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { apiV2 } from '@/lib/client/fetchV2'
import { useOrgId } from '@/lib/runtime/useOrgId'
import '@/styles/jewelry-glassmorphism.css'

interface QualityItem {
  id: string
  entityId: string
  productName: string
  sku: string
  category: string
  image?: string
  status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'requires_attention'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  inspector: {
    id: string
    name: string
    certification: string
  }
  specifications: {
    metal: string
    purity: string
    weight: string
    stones?: string
    size?: string
  }
  qualityTests: {
    visual: { status: string; notes?: string; score?: number }
    weight: { status: string; actual?: number; expected?: number }
    purity: { status: string; tested?: string; expected?: string }
    stones: { status: string; notes?: string; verified?: boolean }
    craftsmanship: { status: string; notes?: string; score?: number }
  }
  certification?: {
    lab: string
    number: string
    grade?: string
    date?: string
  }
  dateReceived: string
  dateCompleted?: string
  notes?: string
}

interface QualityStats {
  total: number
  passed: number
  failed: number
  pending: number
  avgProcessingTime: number
  passRate: number
}

export default function JewelryQualityPage() {
  const orgId = useOrgId()
  
  // State management
  const [qualityItems, setQualityItems] = useState<QualityItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [selectedItem, setSelectedItem] = useState<QualityItem | null>(null)
  const [showInspectionModal, setShowInspectionModal] = useState(false)
  const [stats, setStats] = useState<QualityStats>({
    total: 0,
    passed: 0,
    failed: 0,
    pending: 0,
    avgProcessingTime: 0,
    passRate: 0
  })

  // Sample data - in production this would come from the universal API
  const sampleQualityItems: QualityItem[] = [
    {
      id: '1',
      entityId: 'ent_1',
      productName: 'Diamond Solitaire Ring',
      sku: 'DSR-001',
      category: 'Rings',
      image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop&crop=center',
      status: 'passed',
      priority: 'high',
      inspector: {
        id: 'insp_1',
        name: 'Sarah Chen',
        certification: 'GIA Certified'
      },
      specifications: {
        metal: '18K White Gold',
        purity: '750',
        weight: '3.2g',
        stones: '1.2ct Round Diamond',
        size: '6.5'
      },
      qualityTests: {
        visual: { status: 'passed', score: 95, notes: 'Excellent finish, no visible flaws' },
        weight: { status: 'passed', actual: 3.21, expected: 3.20 },
        purity: { status: 'passed', tested: '750', expected: '750' },
        stones: { status: 'passed', verified: true, notes: 'GIA certified diamond, excellent clarity' },
        craftsmanship: { status: 'passed', score: 92, notes: 'Superior setting technique' }
      },
      certification: {
        lab: 'GIA',
        number: 'GIA-1234567',
        grade: 'VS1, G',
        date: '2024-01-15'
      },
      dateReceived: '2024-01-10T09:00:00Z',
      dateCompleted: '2024-01-15T16:30:00Z',
      notes: 'Premium quality piece, ready for display'
    },
    {
      id: '2',
      entityId: 'ent_2',
      productName: 'Pearl Drop Earrings',
      sku: 'PDE-078',
      category: 'Earrings',
      image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop&crop=center',
      status: 'in_progress',
      priority: 'medium',
      inspector: {
        id: 'insp_2',
        name: 'Marcus Rodriguez',
        certification: 'Certified Pearl Specialist'
      },
      specifications: {
        metal: '14K Yellow Gold',
        purity: '585',
        weight: '4.1g',
        stones: 'Tahitian Pearls'
      },
      qualityTests: {
        visual: { status: 'passed', score: 88 },
        weight: { status: 'passed', actual: 4.08, expected: 4.10 },
        purity: { status: 'pending' },
        stones: { status: 'in_progress', notes: 'Verifying pearl authenticity' },
        craftsmanship: { status: 'passed', score: 85 }
      },
      dateReceived: '2024-01-12T11:30:00Z',
      notes: 'Pearl luster verification in progress'
    },
    {
      id: '3',
      entityId: 'ent_3',
      productName: 'Tennis Bracelet',
      sku: 'TB-199',
      category: 'Bracelets',
      image: 'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop&crop=center',
      status: 'requires_attention',
      priority: 'urgent',
      inspector: {
        id: 'insp_1',
        name: 'Sarah Chen',
        certification: 'GIA Certified'
      },
      specifications: {
        metal: 'Platinum',
        purity: '950',
        weight: '15.3g',
        stones: '5.0ct Total Diamond Weight'
      },
      qualityTests: {
        visual: { status: 'failed', score: 65, notes: 'Minor surface scratches detected' },
        weight: { status: 'passed', actual: 15.28, expected: 15.30 },
        purity: { status: 'passed', tested: '950', expected: '950' },
        stones: { status: 'requires_attention', notes: 'One stone slightly loose' },
        craftsmanship: { status: 'requires_attention', score: 70, notes: 'Setting requires minor adjustment' }
      },
      dateReceived: '2024-01-08T14:20:00Z',
      notes: 'Requires minor repairs before approval'
    },
    {
      id: '4',
      entityId: 'ent_4',
      productName: 'Emerald Pendant',
      sku: 'EP-067',
      category: 'Pendants',
      image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop&crop=center',
      status: 'pending',
      priority: 'medium',
      inspector: {
        id: 'insp_3',
        name: 'Elena Kovač',
        certification: 'Colored Stone Expert'
      },
      specifications: {
        metal: '18K Yellow Gold',
        purity: '750',
        weight: '8.7g',
        stones: '2.5ct Colombian Emerald'
      },
      qualityTests: {
        visual: { status: 'pending' },
        weight: { status: 'pending' },
        purity: { status: 'pending' },
        stones: { status: 'pending' },
        craftsmanship: { status: 'pending' }
      },
      dateReceived: '2024-01-14T10:15:00Z',
      notes: 'Awaiting detailed gemological analysis'
    }
  ]

  // Load quality items
  useEffect(() => {
    const loadQualityItems = async () => {
      try {
        setLoading(true)
        // In production, this would fetch from universal API
        // const response = await apiV2.get('entities', { 
        //   entity_type: 'quality_inspection',
        //   organization_id: orgId 
        // })
        
        // For now, use sample data
        setQualityItems(sampleQualityItems)
        
        // Calculate stats
        const total = sampleQualityItems.length
        const passed = sampleQualityItems.filter(item => item.status === 'passed').length
        const failed = sampleQualityItems.filter(item => item.status === 'failed').length
        const pending = sampleQualityItems.filter(item => item.status === 'pending').length
        const passRate = total > 0 ? (passed / total) * 100 : 0
        
        setStats({
          total,
          passed,
          failed,
          pending,
          avgProcessingTime: 3.2,
          passRate
        })
        
      } catch (error) {
        console.error('Failed to load quality items:', error)
      } finally {
        setLoading(false)
      }
    }

    if (orgId) {
      loadQualityItems()
    }
  }, [orgId])

  // Filter quality items
  const filteredItems = useMemo(() => {
    return qualityItems.filter(item => {
      const matchesSearch = item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.inspector.name.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter
      const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter
      
      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [qualityItems, searchQuery, statusFilter, priorityFilter])

  // Status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'passed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'requires_attention':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Priority badge styling
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  // Status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'requires_attention':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-600" />
      default:
        return <Package className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen jewelry-gradient-premium flex items-center justify-center">
        <div className="jewelry-glass-card p-8 text-center">
          <RefreshCw className="h-8 w-8 animate-spin jewelry-icon-gold mx-auto mb-4" />
          <p className="jewelry-text-luxury">Loading quality control data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen jewelry-gradient-premium">
      <div className="jewelry-glass-backdrop min-h-screen">
        <div className="w-full max-w-7xl mx-auto p-6">
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div>
                <h1 className="jewelry-heading text-4xl font-bold flex items-center gap-3">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                    className="jewelry-crown-glow p-3 rounded-xl"
                  >
                    <Microscope className="h-8 w-8 jewelry-icon-gold" />
                  </motion.div>
                  Quality Control Center
                </h1>
                <p className="jewelry-text-luxury mt-2 text-lg">
                  Professional jewelry inspection and certification management
                </p>
              </div>
              
              <div className="flex items-center gap-4">
                <Button className="jewelry-btn-primary">
                  <Plus className="h-4 w-4 mr-2" />
                  New Inspection
                </Button>
                <Button variant="outline" className="jewelry-btn-secondary">
                  <Download className="h-4 w-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
          >
            <div className="jewelry-glass-card p-6 text-center">
              <Package className="mx-auto mb-3 jewelry-icon-gold" size={28} />
              <h3 className="jewelry-text-high-contrast text-3xl font-bold">{stats.total}</h3>
              <p className="jewelry-text-muted text-sm">Total Items</p>
            </div>
            
            <div className="jewelry-glass-card p-6 text-center">
              <CheckCircle className="mx-auto mb-3 text-green-600" size={28} />
              <h3 className="jewelry-text-high-contrast text-3xl font-bold">{stats.passed}</h3>
              <p className="jewelry-text-muted text-sm">Passed</p>
            </div>
            
            <div className="jewelry-glass-card p-6 text-center">
              <XCircle className="mx-auto mb-3 text-red-600" size={28} />
              <h3 className="jewelry-text-high-contrast text-3xl font-bold">{stats.failed}</h3>
              <p className="jewelry-text-muted text-sm">Failed</p>
            </div>
            
            <div className="jewelry-glass-card p-6 text-center">
              <Clock className="mx-auto mb-3 text-blue-600" size={28} />
              <h3 className="jewelry-text-high-contrast text-3xl font-bold">{stats.pending}</h3>
              <p className="jewelry-text-muted text-sm">Pending</p>
            </div>
            
            <div className="jewelry-glass-card p-6 text-center">
              <Star className="mx-auto mb-3 jewelry-icon-gold" size={28} />
              <h3 className="jewelry-text-high-contrast text-3xl font-bold">{stats.passRate.toFixed(1)}%</h3>
              <p className="jewelry-text-muted text-sm">Pass Rate</p>
            </div>
          </motion.div>

          {/* Search and Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="jewelry-glass-panel p-6 mb-8"
          >
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 jewelry-text-muted" />
                <Input
                  type="text"
                  placeholder="Search by product name, SKU, or inspector..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 jewelry-glass-input"
                />
              </div>
              
              <div className="flex gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40 jewelry-glass-input">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="jewelry-glass-dropdown">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="passed">Passed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                    <SelectItem value="requires_attention">Needs Attention</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="w-40 jewelry-glass-input">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent className="jewelry-glass-dropdown">
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>

          {/* Quality Items Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                className="jewelry-glass-card group hover:jewelry-scale-hover"
              >
                <div className="p-6 space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="jewelry-crown-glow aspect-square w-16 rounded-lg bg-gradient-to-br from-jewelry-cream to-jewelry-blue-50 relative overflow-hidden">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.productName}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-110"
                            sizes="64px"
                            placeholder="blur"
                            blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                          />
                        ) : (
                          <Gem className="h-8 w-8 jewelry-icon-gold m-4" />
                        )}
                      </div>
                      
                      <div>
                        <h3 className="jewelry-text-high-contrast font-bold text-sm group-hover:jewelry-text-gold transition-colors">
                          {item.productName}
                        </h3>
                        <p className="jewelry-text-muted text-xs">SKU: {item.sku}</p>
                        <p className="jewelry-text-muted text-xs">{item.category}</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2">
                      <Badge className={`text-xs ${getStatusBadge(item.status)}`}>
                        {getStatusIcon(item.status)}
                        <span className="ml-1 capitalize">{item.status.replace('_', ' ')}</span>
                      </Badge>
                      <Badge className={`text-xs ${getPriorityBadge(item.priority)}`}>
                        {item.priority.toUpperCase()}
                      </Badge>
                    </div>
                  </div>

                  {/* Inspector */}
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 jewelry-text-muted" />
                    <div>
                      <p className="jewelry-text-high-contrast text-sm font-medium">{item.inspector.name}</p>
                      <p className="jewelry-text-muted text-xs">{item.inspector.certification}</p>
                    </div>
                  </div>

                  {/* Quality Tests Progress */}
                  <div className="space-y-2">
                    <p className="jewelry-text-high-contrast text-sm font-medium">Quality Tests</p>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(item.qualityTests).map(([test, result]) => (
                        <div key={test} className="flex items-center gap-1">
                          {result.status === 'passed' && <CheckCircle className="h-3 w-3 text-green-600" />}
                          {result.status === 'failed' && <XCircle className="h-3 w-3 text-red-600" />}
                          {result.status === 'in_progress' && <Clock className="h-3 w-3 text-blue-600" />}
                          {result.status === 'requires_attention' && <AlertTriangle className="h-3 w-3 text-yellow-600" />}
                          {result.status === 'pending' && <Clock className="h-3 w-3 text-gray-600" />}
                          <span className="jewelry-text-muted text-xs capitalize">{test}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Specifications */}
                  <div className="space-y-2">
                    <p className="jewelry-text-high-contrast text-sm font-medium">Specifications</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Sparkles className="h-3 w-3 jewelry-icon-gold" />
                        <span className="jewelry-text-muted">{item.specifications.metal}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Diamond className="h-3 w-3 jewelry-icon-gold" />
                        <span className="jewelry-text-muted">{item.specifications.weight}</span>
                      </div>
                    </div>
                  </div>

                  {/* Certification */}
                  {item.certification && (
                    <div className="flex items-center gap-2 jewelry-glass-card-subtle p-2 rounded-lg">
                      <Award className="h-4 w-4 jewelry-icon-gold" />
                      <div>
                        <p className="jewelry-text-high-contrast text-xs font-medium">{item.certification.lab}</p>
                        <p className="jewelry-text-muted text-xs">{item.certification.number}</p>
                      </div>
                    </div>
                  )}

                  {/* Dates */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 jewelry-text-muted" />
                      <span className="jewelry-text-muted">
                        Received: {new Date(item.dateReceived).toLocaleDateString()}
                      </span>
                    </div>
                    {item.dateCompleted && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3 text-green-600" />
                        <span className="jewelry-text-muted">
                          {new Date(item.dateCompleted).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-white/20">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1 jewelry-btn-secondary"
                      onClick={() => setSelectedItem(item)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1 jewelry-btn-primary"
                      onClick={() => {
                        setSelectedItem(item)
                        setShowInspectionModal(true)
                      }}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Inspect
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Empty State */}
          {filteredItems.length === 0 && (
            <div className="jewelry-glass-panel text-center py-12">
              <Microscope className="h-16 w-16 jewelry-text-muted mx-auto mb-4" />
              <h3 className="jewelry-text-luxury text-xl font-semibold mb-2">
                No quality inspections found
              </h3>
              <p className="jewelry-text-muted mb-6">
                Try adjusting your search terms or filters to find quality control items.
              </p>
              <Button className="jewelry-btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Start New Inspection
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}