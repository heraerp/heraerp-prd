'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Filter, DollarSign, Clock, Users, TrendingUp, AlertCircle, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { useOrganizationCurrency } from '@/hooks/use-organization-currency'
import { CurrencyInput, CurrencyDisplay } from '@/components/ui/currency-input'

interface ServiceEntity {
  id: string
  entity_type: string
  entity_name: string
  entity_code: string
  organization_id: string
  created_at: string
  updated_at: string
  metadata?: any
  status?: string
  // Dynamic fields merged
  price?: number
  cost?: number
  duration?: number
  description?: string
  category?: string
  commission_rate?: number
  max_daily_bookings?: number
  booking_buffer_minutes?: number
  is_active?: boolean
  requires_consultation?: boolean
}

interface ServiceCategory {
  id: string
  entity_name: string
  entity_code: string
  metadata?: any
}

interface ServiceAnalytics {
  total_services: number
  active_services: number
  average_price: number
  revenue_contribution: number
  popular_services: Array<{
    name: string
    bookings: number
    revenue: number
  }>
  category_breakdown: Array<{
    category: string
    category_code: string
    count: number
    revenue: number
  }>
}

interface DurationOption {
  value: string
  label: string
}

const API_BASE = '/api/v1/salon/services'

// Default organization ID for development
const DEFAULT_ORG_ID = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'

export default function ServicesPage() {
  const router = useRouter()
  const { currentOrganization, isAuthenticated, contextLoading } = useMultiOrgAuth()
  const organizationId = currentOrganization?.id || DEFAULT_ORG_ID
  const { format: formatCurrency, currencySymbol } = useOrganizationCurrency()
  
  const [services, setServices] = useState<ServiceEntity[]>([])
  const [categories, setCategories] = useState<ServiceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedService, setSelectedService] = useState<ServiceEntity | null>(null)
  const [analytics, setAnalytics] = useState<ServiceAnalytics | null>(null)
  
  // Dynamic configuration from database
  const [durationOptions, setDurationOptions] = useState<DurationOption[]>([])
  
  // Form states
  const [formData, setFormData] = useState({
    service_name: '',
    category: '',
    price: '',
    cost: '',
    duration: '60',
    description: '',
    is_active: true,
    requires_consultation: false,
    commission_rate: '40',
    max_daily_bookings: '10',
    booking_buffer_minutes: '15'
  })
  
  const { toast } = useToast()

  // Simple loading check
  if (contextLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading services management...</p>
        </div>
      </div>
    )
  }

  const fetchServices = async () => {
    try {
      const response = await fetch(`${API_BASE}?organization_id=${organizationId}`)
      if (!response.ok) throw new Error('Failed to fetch services')
      const data = await response.json()
      
      setServices(data.services || [])
      setCategories(data.categories || [])
      setAnalytics(data.analytics || null)
      
      // Set dynamic duration options if provided
      if (data.durationOptions) {
        setDurationOptions(data.durationOptions)
      } else {
        // Default duration options
        setDurationOptions([
          { value: '15', label: '15 minutes' },
          { value: '30', label: '30 minutes' },
          { value: '45', label: '45 minutes' },
          { value: '60', label: '1 hour' },
          { value: '90', label: '1.5 hours' },
          { value: '120', label: '2 hours' },
          { value: '180', label: '3 hours' },
          { value: '240', label: '4 hours' }
        ])
      }
    } catch (error) {
      console.error('Error fetching services:', error)
      toast({
        title: 'Error',
        description: 'Failed to load services',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (organizationId) {
      fetchServices()
    }
  }, [organizationId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const endpoint = selectedService 
        ? `${API_BASE}/${selectedService.id}`
        : API_BASE
      
      const response = await fetch(endpoint, {
        method: selectedService ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          organization_id: organizationId,
        }),
      })

      if (!response.ok) throw new Error('Failed to save service')

      toast({
        title: 'Success',
        description: `Service ${selectedService ? 'updated' : 'created'} successfully`,
      })

      setIsAddDialogOpen(false)
      setIsEditDialogOpen(false)
      resetForm()
      fetchServices()
    } catch (error) {
      console.error('Error saving service:', error)
      toast({
        title: 'Error',
        description: 'Failed to save service',
        variant: 'destructive',
      })
    }
  }

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    try {
      const response = await fetch(`${API_BASE}/${serviceId}`, {
        method: 'DELETE',
      })

      if (!response.ok) throw new Error('Failed to delete service')

      toast({
        title: 'Success',
        description: 'Service deleted successfully',
      })

      fetchServices()
    } catch (error) {
      console.error('Error deleting service:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete service',
        variant: 'destructive',
      })
    }
  }

  const resetForm = () => {
    setFormData({
      service_name: '',
      category: '',
      price: '',
      cost: '',
      duration: '60',
      description: '',
      is_active: true,
      requires_consultation: false,
      commission_rate: '40',
      max_daily_bookings: '10',
      booking_buffer_minutes: '15'
    })
    setSelectedService(null)
  }

  const filteredServices = services.filter(service => {
    const matchesSearch = service.entity_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || 
      service.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const getServicePrice = (service: ServiceEntity) => {
    return service.price || 0
  }

  const getServiceDuration = (service: ServiceEntity) => {
    return service.duration || 60
  }

  const getServiceCategory = (service: ServiceEntity) => {
    const category = categories.find(c => c.entity_code === service.category)
    return category?.entity_name || service.category || 'Other'
  }

  const getServiceStatus = (service: ServiceEntity) => {
    // Check metadata first, then direct property
    return service.metadata?.is_active !== false && service.is_active !== false
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Services Management</h1>
          <p className="text-muted-foreground">
            Manage your salon services, pricing, and availability
          </p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => router.push('/salon/categories')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Manage Categories
          </Button>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Service
          </Button>
        </div>
      </div>

      {/* Analytics Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Services</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total_services}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.active_services} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Price</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                <CurrencyDisplay value={analytics.average_price} />
              </div>
              <p className="text-xs text-muted-foreground">
                Per service
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue Share</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.revenue_contribution}%
              </div>
              <Progress value={analytics.revenue_contribution} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Categories</CardTitle>
              <Filter className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {analytics.category_breakdown.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Service types
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(category => (
                  <SelectItem key={category.entity_code} value={category.entity_code}>
                    {category.entity_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Services Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredServices.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No services found
                  </TableCell>
                </TableRow>
              ) : (
                filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.entity_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getServiceCategory(service)}</Badge>
                    </TableCell>
                    <TableCell>
                      <CurrencyDisplay value={getServicePrice(service)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {getServiceDuration(service)} min
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getServiceStatus(service) ? 'default' : 'secondary'}>
                        {getServiceStatus(service) ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedService(service)
                            setFormData({
                              service_name: service.entity_name,
                              category: service.category || '',
                              price: service.price?.toString() || '',
                              cost: service.cost?.toString() || '',
                              duration: service.duration?.toString() || '60',
                              description: service.description || '',
                              is_active: getServiceStatus(service),
                              requires_consultation: service.requires_consultation || service.metadata?.requires_consultation || false,
                              commission_rate: service.commission_rate?.toString() || '40',
                              max_daily_bookings: service.max_daily_bookings?.toString() || '10',
                              booking_buffer_minutes: service.booking_buffer_minutes?.toString() || '15'
                            })
                            setIsEditDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(service.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false)
          setIsEditDialogOpen(false)
          resetForm()
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedService ? 'Edit Service' : 'Add New Service'}
            </DialogTitle>
            <DialogDescription>
              {selectedService 
                ? 'Update the service details below' 
                : 'Create a new service for your salon'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="pricing">Pricing & Duration</TabsTrigger>
                <TabsTrigger value="settings">Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="service_name">Service Name</Label>
                  <Input
                    id="service_name"
                    value={formData.service_name}
                    onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                    placeholder="e.g., Classic Haircut"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={formData.category} 
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.entity_code} value={category.entity_code}>
                          {category.entity_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the service..."
                    rows={4}
                  />
                </div>
              </TabsContent>

              <TabsContent value="pricing" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <CurrencyInput
                      id="price"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cost">Cost</Label>
                    <CurrencyInput
                      id="cost"
                      value={formData.cost}
                      onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Select 
                      value={formData.duration} 
                      onValueChange={(value) => setFormData({ ...formData, duration: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {durationOptions.map(option => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="commission_rate">Commission Rate (%)</Label>
                    <Input
                      id="commission_rate"
                      type="number"
                      min="0"
                      max="100"
                      value={formData.commission_rate}
                      onChange={(e) => setFormData({ ...formData, commission_rate: e.target.value })}
                      placeholder="40"
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Active Service</Label>
                    <p className="text-sm text-muted-foreground">
                      Service is available for booking
                    </p>
                  </div>
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Requires Consultation</Label>
                    <p className="text-sm text-muted-foreground">
                      Client must have consultation before booking
                    </p>
                  </div>
                  <Switch
                    checked={formData.requires_consultation}
                    onCheckedChange={(checked) => setFormData({ ...formData, requires_consultation: checked })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="max_daily_bookings">Max Daily Bookings</Label>
                    <Input
                      id="max_daily_bookings"
                      type="number"
                      min="1"
                      value={formData.max_daily_bookings}
                      onChange={(e) => setFormData({ ...formData, max_daily_bookings: e.target.value })}
                      placeholder="10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="booking_buffer_minutes">Buffer Time (minutes)</Label>
                    <Input
                      id="booking_buffer_minutes"
                      type="number"
                      min="0"
                      value={formData.booking_buffer_minutes}
                      onChange={(e) => setFormData({ ...formData, booking_buffer_minutes: e.target.value })}
                      placeholder="15"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false)
                  setIsEditDialogOpen(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button type="submit">
                {selectedService ? 'Update Service' : 'Create Service'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}