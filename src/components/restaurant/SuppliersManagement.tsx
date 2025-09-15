'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { universalApi } from '@/lib/universal-api'
import {
  extractData,
  ensureDefaultEntities,
  formatCurrency,
  generateSmartCode
} from '@/lib/universal-helpers'
import { StatCardGrid, StatCardData } from '@/components/universal/StatCardGrid'
import { TransactionList } from '@/components/universal/TransactionList'
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  TrendingUp,
  Package,
  Truck,
  AlertTriangle,
  Clock,
  FileText,
  Plus,
  Edit,
  Search,
  Filter,
  Star,
  Calendar,
  DollarSign,
  Loader2,
  Check,
  X,
  ShoppingCart,
  BarChart3,
  Users,
  RefreshCw
} from 'lucide-react'
import { formatDate } from '@/lib/date-utils'

interface SuppliersManagementProps {
  organizationId: string
  smartCodes: Record<string, string>
  isDemoMode?: boolean
}

interface Supplier {
  id: string
  entity_name: string
  entity_code: string
  metadata?: {
    category?: string
    contact_person?: string
    phone?: string
    email?: string
    address?: string
    payment_terms?: string
    credit_limit?: number
    tax_id?: string
    rating?: number
    status?: 'active' | 'inactive' | 'blocked'
    notes?: string
    delivery_days?: string[]
    minimum_order?: number
    lead_time_days?: number
  }
}

interface PurchaseOrder {
  id: string
  transaction_code: string
  transaction_date: string
  total_amount: number
  metadata?: {
    supplier_id?: string
    supplier_name?: string
    status?: 'draft' | 'sent' | 'confirmed' | 'received' | 'cancelled'
    delivery_date?: string
    payment_terms?: string
    notes?: string
    items_count?: number
  }
}

export function SuppliersManagement({
  organizationId,
  smartCodes,
  isDemoMode = false
}: SuppliersManagementProps) {
  const [activeTab, setActiveTab] = useState('suppliers')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [showEditSupplier, setShowEditSupplier] = useState(false)
  const [showCreatePO, setShowCreatePO] = useState(false)

  // Stats
  const [stats, setStats] = useState({
    totalSuppliers: 0,
    activeSuppliers: 0,
    pendingOrders: 0,
    monthlySpend: 0,
    avgDeliveryTime: 0,
    overduePayments: 0
  })

  // Form states
  const [supplierForm, setSupplierForm] = useState<Partial<Supplier>>({
    entity_name: '',
    entity_code: '',
    metadata: {
      category: 'produce',
      contact_person: '',
      phone: '',
      email: '',
      address: '',
      payment_terms: 'NET30',
      credit_limit: 10000,
      tax_id: '',
      rating: 5,
      status: 'active',
      delivery_days: [],
      minimum_order: 100,
      lead_time_days: 2
    }
  })

  const [poForm, setPOForm] = useState({
    supplier_id: '',
    delivery_date: '',
    payment_terms: 'NET30',
    notes: '',
    items: [] as Array<{ item_id: string; quantity: number; unit_price: number }>
  })

  useEffect(() => {
    if (!isDemoMode) {
      universalApi.setOrganizationId(organizationId)
      loadData()
    }
  }, [organizationId, isDemoMode])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load suppliers
      const entitiesResponse = await universalApi.getEntities()
      const entities = extractData(entitiesResponse)
      let supplierEntities = entities.filter(e => e.entity_type === 'supplier')

      // Create default suppliers if none exist
      if (supplierEntities.length === 0) {
        await createDefaultSuppliers()
        const newEntitiesResponse = await universalApi.getEntities()
        const newEntities = extractData(newEntitiesResponse)
        supplierEntities = newEntities.filter(e => e.entity_type === 'supplier')
      }

      setSuppliers(supplierEntities)

      // Load purchase orders
      const transactionsResponse = await universalApi.getTransactions()
      const transactions = extractData(transactionsResponse)
      const pos = transactions
        .filter(t => t.transaction_type === 'purchase_order')
        .sort(
          (a, b) => new Date(b.transaction_date).getTime() - new Date(a.transaction_date).getTime()
        )

      setPurchaseOrders(pos)

      // Calculate stats
      calculateStats(supplierEntities, pos)
    } catch (err) {
      console.error('Error loading supplier data:', err)
      setError('Failed to load supplier data')
    } finally {
      setLoading(false)
    }
  }

  const createDefaultSuppliers = async () => {
    const defaultSuppliers = [
      {
        name: 'Fresh Produce Distributors',
        code: 'SUP-PROD-001',
        category: 'produce',
        contact: 'John Smith',
        phone: '+1-555-0101',
        email: 'orders@freshproduce.com',
        address: '123 Farm Road, Agriculture District',
        payment_terms: 'NET30',
        credit_limit: 50000,
        rating: 5,
        delivery_days: ['Mon', 'Wed', 'Fri'],
        minimum_order: 500,
        lead_time_days: 1
      },
      {
        name: 'Premium Meat & Seafood Co',
        code: 'SUP-MEAT-001',
        category: 'proteins',
        contact: 'Maria Garcia',
        phone: '+1-555-0102',
        email: 'supply@premiummeat.com',
        address: '456 Butcher Lane, Meat District',
        payment_terms: 'NET15',
        credit_limit: 75000,
        rating: 4,
        delivery_days: ['Tue', 'Thu', 'Sat'],
        minimum_order: 1000,
        lead_time_days: 2
      },
      {
        name: 'Italian Imports Specialty',
        code: 'SUP-SPEC-001',
        category: 'specialty',
        contact: 'Giuseppe Romano',
        phone: '+1-555-0103',
        email: 'info@italianimports.com',
        address: '789 Import Plaza, Downtown',
        payment_terms: 'NET45',
        credit_limit: 30000,
        rating: 5,
        delivery_days: ['Mon', 'Thu'],
        minimum_order: 300,
        lead_time_days: 5
      },
      {
        name: 'Beverage & Wine Suppliers',
        code: 'SUP-BEV-001',
        category: 'beverages',
        contact: 'Sarah Johnson',
        phone: '+1-555-0104',
        email: 'orders@beveragesupply.com',
        address: '321 Wine Street, Beverage Quarter',
        payment_terms: 'NET60',
        credit_limit: 40000,
        rating: 4,
        delivery_days: ['Wed', 'Fri'],
        minimum_order: 750,
        lead_time_days: 3
      },
      {
        name: 'Restaurant Equipment Pro',
        code: 'SUP-EQUIP-001',
        category: 'equipment',
        contact: 'Mike Wilson',
        phone: '+1-555-0105',
        email: 'sales@resequippro.com',
        address: '555 Industrial Ave, Equipment Zone',
        payment_terms: 'NET30',
        credit_limit: 100000,
        rating: 5,
        delivery_days: ['Mon-Fri'],
        minimum_order: 0,
        lead_time_days: 7
      }
    ]

    for (const supplier of defaultSuppliers) {
      await universalApi.createEntity({
        entity_type: 'supplier',
        entity_name: supplier.name,
        entity_code: supplier.code,
        smart_code: smartCodes.SUPPLIER,
        metadata: {
          category: supplier.category,
          contact_person: supplier.contact,
          phone: supplier.phone,
          email: supplier.email,
          address: supplier.address,
          payment_terms: supplier.payment_terms,
          credit_limit: supplier.credit_limit,
          rating: supplier.rating,
          status: 'active',
          delivery_days: supplier.delivery_days,
          minimum_order: supplier.minimum_order,
          lead_time_days: supplier.lead_time_days
        }
      })
    }
  }

  const calculateStats = (suppliers: Supplier[], orders: PurchaseOrder[]) => {
    const totalSuppliers = suppliers.length
    const activeSuppliers = suppliers.filter(s => (s.metadata as any)?.status === 'active').length

    // Get this month's orders
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const monthOrders = orders.filter(o => new Date(o.transaction_date) >= monthStart)

    const pendingOrders = orders.filter(o =>
      ['draft', 'sent', 'confirmed'].includes((o.metadata as any)?.status || '')
    ).length

    const monthlySpend = monthOrders.reduce((sum, o) => sum + o.total_amount, 0)

    // Mock delivery time (would calculate from actual delivery data)
    const avgDeliveryTime = 2.5

    // Mock overdue payments (would calculate from payment terms)
    const overduePayments = orders.filter(
      o =>
        (o.metadata as any)?.status === 'received' &&
        new Date(o.transaction_date) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length

    setStats({
      totalSuppliers,
      activeSuppliers,
      pendingOrders,
      monthlySpend,
      avgDeliveryTime,
      overduePayments
    })
  }

  const handleCreateSupplier = async () => {
    try {
      const response = await universalApi.createEntity({
        entity_type: 'supplier',
        entity_name: supplierForm.entity_name!,
        entity_code: supplierForm.entity_code || `SUP-${Date.now()}`,
        smart_code: smartCodes.SUPPLIER,
        metadata: supplierForm.metadata
      })

      if (response.success) {
        setShowAddSupplier(false)
        resetSupplierForm()
        await loadData()
      }
    } catch (err) {
      console.error('Error creating supplier:', err)
      setError('Failed to create supplier')
    }
  }

  const handleUpdateSupplier = async () => {
    if (!selectedSupplier) return

    try {
      const response = await universalApi.update('core_entities', selectedSupplier.id, {
        entity_name: supplierForm.entity_name,
        entity_code: supplierForm.entity_code,
        metadata: supplierForm.metadata
      })

      if (response.success) {
        setShowEditSupplier(false)
        resetSupplierForm()
        await loadData()
      }
    } catch (err) {
      console.error('Error updating supplier:', err)
      setError('Failed to update supplier')
    }
  }

  const handleCreatePO = async () => {
    try {
      const supplier = suppliers.find(s => s.id === poForm.supplier_id)
      if (!supplier) return

      // Calculate total from items
      const total = poForm.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0)

      const response = await universalApi.createTransaction({
        transaction_type: 'purchase_order',
        transaction_code: `PO-${Date.now()}`,
        smart_code: smartCodes.PURCHASE_ORDER,
        total_amount: total,
        metadata: {
          supplier_id: supplier.id,
          supplier_name: supplier.entity_name,
          status: 'draft',
          delivery_date: poForm.delivery_date,
          payment_terms: poForm.payment_terms,
          notes: poForm.notes,
          items_count: poForm.items.length
        }
      })

      if (response.success) {
        setShowCreatePO(false)
        resetPOForm()
        await loadData()
      }
    } catch (err) {
      console.error('Error creating PO:', err)
      setError('Failed to create purchase order')
    }
  }

  const resetSupplierForm = () => {
    setSupplierForm({
      entity_name: '',
      entity_code: '',
      metadata: {
        category: 'produce',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        payment_terms: 'NET30',
        credit_limit: 10000,
        tax_id: '',
        rating: 5,
        status: 'active',
        delivery_days: [],
        minimum_order: 100,
        lead_time_days: 2
      }
    })
    setSelectedSupplier(null)
  }

  const resetPOForm = () => {
    setPOForm({
      supplier_id: '',
      delivery_date: '',
      payment_terms: 'NET30',
      notes: '',
      items: []
    })
  }

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'fill-gray-200 text-gray-200'
        }`}
      />
    ))
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>
      case 'blocked':
        return <Badge variant="destructive">Blocked</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch =
      supplier.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supplier.entity_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supplier.metadata as any)?.contact_person
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (supplier.metadata as any)?.email?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory =
      selectedCategory === 'all' || (supplier.metadata as any)?.category === selectedCategory

    return matchesSearch && matchesCategory
  })

  // Stats for the grid
  const statCards: StatCardData[] = [
    {
      key: 'total',
      title: 'Total Suppliers',
      value: stats.totalSuppliers,
      subtitle: 'Registered',
      icon: Building2,
      format: 'number'
    },
    {
      key: 'active',
      title: 'Active Suppliers',
      value: stats.activeSuppliers,
      subtitle: 'Currently active',
      icon: Check,
      format: 'number',
      variant: 'success'
    },
    {
      key: 'pending',
      title: 'Pending Orders',
      value: stats.pendingOrders,
      subtitle: 'Awaiting delivery',
      icon: Package,
      format: 'number',
      variant: stats.pendingOrders > 5 ? 'warning' : 'default'
    },
    {
      key: 'spend',
      title: 'Monthly Spend',
      value: stats.monthlySpend,
      subtitle: 'This month',
      icon: DollarSign,
      format: 'currency'
    },
    {
      key: 'delivery',
      title: 'Avg Delivery',
      value: stats.avgDeliveryTime,
      subtitle: 'Days',
      icon: Truck,
      format: 'number'
    },
    {
      key: 'overdue',
      title: 'Overdue',
      value: stats.overduePayments,
      subtitle: 'Payments',
      icon: AlertTriangle,
      format: 'number',
      variant: stats.overduePayments > 0 ? 'warning' : 'default'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary" />
            Suppliers Management
          </h1>
          <p className="text-muted-foreground">
            Manage suppliers, purchase orders, and vendor relationships
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowAddSupplier(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Supplier
          </Button>
          <Button onClick={() => setShowCreatePO(true)} variant="outline">
            <ShoppingCart className="h-4 w-4 mr-2" />
            Create PO
          </Button>
          <Button onClick={() => loadData()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <StatCardGrid stats={statCards} columns={{ default: 1, sm: 2, md: 3, lg: 6 }} />

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>

        <TabsContent value="suppliers" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search suppliers..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="produce">Produce</SelectItem>
                    <SelectItem value="proteins">Proteins</SelectItem>
                    <SelectItem value="beverages">Beverages</SelectItem>
                    <SelectItem value="specialty">Specialty</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Suppliers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuppliers.map(supplier => (
              <Card key={supplier.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{supplier.entity_name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{supplier.entity_code}</p>
                    </div>
                    {getStatusBadge((supplier.metadata as any)?.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    {getRatingStars((supplier.metadata as any)?.rating || 0)}
                    <span className="text-sm text-muted-foreground">
                      ({(supplier.metadata as any)?.rating || 0}/5)
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    {(supplier.metadata as any)?.contact_person && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{supplier.metadata.contact_person}</span>
                      </div>
                    )}
                    {(supplier.metadata as any)?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{supplier.metadata.phone}</span>
                      </div>
                    )}
                    {(supplier.metadata as any)?.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="truncate">{supplier.metadata.email}</span>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Payment Terms</p>
                      <p className="font-medium">
                        {(supplier.metadata as any)?.payment_terms || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Credit Limit</p>
                      <p className="font-medium">
                        {formatCurrency((supplier.metadata as any)?.credit_limit || 0)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        setSelectedSupplier(supplier)
                        setSupplierForm(supplier)
                        setShowEditSupplier(true)
                      }}
                    >
                      <Pencil className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setPOForm({ ...poForm, supplier_id: supplier.id })
                        setShowCreatePO(true)
                      }}
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Create PO
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Purchase Orders</CardTitle>
            </CardHeader>
            <CardContent>
              {purchaseOrders.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No purchase orders found</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Delivery Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchaseOrders.map(po => (
                      <TableRow key={po.id}>
                        <TableCell className="font-mono">{po.transaction_code}</TableCell>
                        <TableCell>{(po.metadata as any)?.supplier_name || 'Unknown'}</TableCell>
                        <TableCell>
                          {formatDate(new Date(po.transaction_date), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          {(po.metadata as any)?.delivery_date
                            ? formatDate(new Date(po.metadata.delivery_date), 'MMM d, yyyy')
                            : 'Not set'}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(po.total_amount)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              (po.metadata as any)?.status === 'received'
                                ? 'success'
                                : (po.metadata as any)?.status === 'sent'
                                  ? 'default'
                                  : (po.metadata as any)?.status === 'cancelled'
                                    ? 'destructive'
                                    : 'secondary'
                            }
                          >
                            {(po.metadata as any)?.status || 'draft'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Suppliers by Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {suppliers.slice(0, 5).map(supplier => {
                    const orderCount = purchaseOrders.filter(
                      po => (po.metadata as any)?.supplier_id === supplier.id
                    ).length
                    const totalSpend = purchaseOrders
                      .filter(po => (po.metadata as any)?.supplier_id === supplier.id)
                      .reduce((sum, po) => sum + po.total_amount, 0)

                    return (
                      <div
                        key={supplier.id}
                        className="flex justify-between items-center p-3 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{supplier.entity_name}</p>
                          <p className="text-sm text-muted-foreground">{orderCount} orders</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(totalSpend)}</p>
                          <div className="flex items-center gap-1">
                            {getRatingStars((supplier.metadata as any)?.rating || 0)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {suppliers
                    .filter(s => (s.metadata as any)?.status === 'active')
                    .slice(0, 5)
                    .map(supplier => {
                      // Mock delivery performance data
                      const onTimeRate = 85 + Math.floor(Math.random() * 15)

                      return (
                        <div key={supplier.id} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <p className="font-medium text-sm">{supplier.entity_name}</p>
                            <span className="text-sm font-medium">{onTimeRate}%</span>
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                onTimeRate >= 95
                                  ? 'bg-green-600'
                                  : onTimeRate >= 85
                                    ? 'bg-yellow-600'
                                    : 'bg-red-600'
                              }`}
                              style={{ width: `${onTimeRate}%` }}
                            />
                          </div>
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Monthly Spending Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
              <BarChart3 className="h-16 w-16" />
              <p className="ml-4">Chart visualization would go here</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Supplier Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {['produce', 'proteins', 'beverages', 'specialty', 'equipment', 'other'].map(
                  category => {
                    const categorySuppliers = suppliers.filter(
                      s => (s.metadata as any)?.category === category
                    )
                    const categorySpend = purchaseOrders
                      .filter(po => {
                        const supplier = suppliers.find(
                          s => s.id === (po.metadata as any)?.supplier_id
                        )
                        return supplier?.metadata?.category === category
                      })
                      .reduce((sum, po) => sum + po.total_amount, 0)

                    return (
                      <Card key={category}>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base capitalize">{category}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Suppliers</span>
                              <span className="font-medium">{categorySuppliers.length}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-muted-foreground">Total Spend</span>
                              <span className="font-medium">{formatCurrency(categorySpend)}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  }
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Supplier Dialog */}
      <Dialog open={showAddSupplier} onOpenChange={setShowAddSupplier}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Supplier</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Supplier Name</Label>
                <Input
                  id="name"
                  value={supplierForm.entity_name}
                  onChange={e => setSupplierForm({ ...supplierForm, entity_name: e.target.value })}
                  placeholder="e.g., Fresh Produce Co"
                />
              </div>
              <div>
                <Label htmlFor="code">Supplier Code</Label>
                <Input
                  id="code"
                  value={supplierForm.entity_code}
                  onChange={e => setSupplierForm({ ...supplierForm, entity_code: e.target.value })}
                  placeholder="e.g., SUP-001"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={(supplierForm.metadata as any)?.category}
                  onValueChange={value =>
                    setSupplierForm({
                      ...supplierForm,
                      metadata: { ...supplierForm.metadata, category: value }
                    })
                  }
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="produce">Produce</SelectItem>
                    <SelectItem value="proteins">Proteins</SelectItem>
                    <SelectItem value="beverages">Beverages</SelectItem>
                    <SelectItem value="specialty">Specialty</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="contact">Contact Person</Label>
                <Input
                  id="contact"
                  value={(supplierForm.metadata as any)?.contact_person}
                  onChange={e =>
                    setSupplierForm({
                      ...supplierForm,
                      metadata: { ...supplierForm.metadata, contact_person: e.target.value }
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={(supplierForm.metadata as any)?.phone}
                  onChange={e =>
                    setSupplierForm({
                      ...supplierForm,
                      metadata: { ...supplierForm.metadata, phone: e.target.value }
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={(supplierForm.metadata as any)?.email}
                  onChange={e =>
                    setSupplierForm({
                      ...supplierForm,
                      metadata: { ...supplierForm.metadata, email: e.target.value }
                    })
                  }
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={(supplierForm.metadata as any)?.address}
                  onChange={e =>
                    setSupplierForm({
                      ...supplierForm,
                      metadata: { ...supplierForm.metadata, address: e.target.value }
                    })
                  }
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="payment">Payment Terms</Label>
                <Select
                  value={(supplierForm.metadata as any)?.payment_terms}
                  onValueChange={value =>
                    setSupplierForm({
                      ...supplierForm,
                      metadata: { ...supplierForm.metadata, payment_terms: value }
                    })
                  }
                >
                  <SelectTrigger id="payment">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COD">Cash on Delivery</SelectItem>
                    <SelectItem value="NET15">NET 15</SelectItem>
                    <SelectItem value="NET30">NET 30</SelectItem>
                    <SelectItem value="NET45">NET 45</SelectItem>
                    <SelectItem value="NET60">NET 60</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="credit">Credit Limit</Label>
                <Input
                  id="credit"
                  type="number"
                  value={(supplierForm.metadata as any)?.credit_limit}
                  onChange={e =>
                    setSupplierForm({
                      ...supplierForm,
                      metadata: {
                        ...supplierForm.metadata,
                        credit_limit: parseFloat(e.target.value) || 0
                      }
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="minorder">Minimum Order</Label>
                <Input
                  id="minorder"
                  type="number"
                  value={(supplierForm.metadata as any)?.minimum_order}
                  onChange={e =>
                    setSupplierForm({
                      ...supplierForm,
                      metadata: {
                        ...supplierForm.metadata,
                        minimum_order: parseFloat(e.target.value) || 0
                      }
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="leadtime">Lead Time (days)</Label>
                <Input
                  id="leadtime"
                  type="number"
                  value={(supplierForm.metadata as any)?.lead_time_days}
                  onChange={e =>
                    setSupplierForm({
                      ...supplierForm,
                      metadata: {
                        ...supplierForm.metadata,
                        lead_time_days: parseInt(e.target.value) || 0
                      }
                    })
                  }
                />
              </div>
              <div>
                <Label htmlFor="tax">Tax ID</Label>
                <Input
                  id="tax"
                  value={(supplierForm.metadata as any)?.tax_id}
                  onChange={e =>
                    setSupplierForm({
                      ...supplierForm,
                      metadata: { ...supplierForm.metadata, tax_id: e.target.value }
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddSupplier(false)
                resetSupplierForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateSupplier}>Create Supplier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pencil Supplier Dialog */}
      <Dialog open={showEditSupplier} onOpenChange={setShowEditSupplier}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Pencil Supplier</DialogTitle>
          </DialogHeader>
          {/* Same form as Add Supplier */}
          <div className="grid grid-cols-2 gap-4">
            {/* Copy the same form fields from Add Supplier dialog */}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEditSupplier(false)
                resetSupplierForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateSupplier}>Update Supplier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create PO Dialog */}
      <Dialog open={showCreatePO} onOpenChange={setShowCreatePO}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="supplier">Supplier</Label>
              <Select
                value={poForm.supplier_id}
                onValueChange={value => setPOForm({ ...poForm, supplier_id: value })}
              >
                <SelectTrigger id="supplier">
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers
                    .filter(s => (s.metadata as any)?.status === 'active')
                    .map(supplier => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.entity_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="delivery">Delivery Date</Label>
              <Input
                id="delivery"
                type="date"
                value={poForm.delivery_date}
                onChange={e => setPOForm({ ...poForm, delivery_date: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="terms">Payment Terms</Label>
              <Select
                value={poForm.payment_terms}
                onValueChange={value => setPOForm({ ...poForm, payment_terms: value })}
              >
                <SelectTrigger id="terms">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="COD">Cash on Delivery</SelectItem>
                  <SelectItem value="NET15">NET 15</SelectItem>
                  <SelectItem value="NET30">NET 30</SelectItem>
                  <SelectItem value="NET45">NET 45</SelectItem>
                  <SelectItem value="NET60">NET 60</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={poForm.notes}
                onChange={e => setPOForm({ ...poForm, notes: e.target.value })}
                rows={3}
                placeholder="Special instructions, delivery notes, etc."
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCreatePO(false)
                resetPOForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreatePO}>Create Order</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
