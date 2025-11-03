'use client'

import React, { useState, useEffect } from 'react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Search, 
  Plus, 
  Filter,
  Download,
  MoreVertical,
  Phone,
  Mail,
  MapPin,
  Star,
  CreditCard,
  Calendar,
  Edit,
  Eye,
  Trash2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'
import { useJewelry1API } from '@/lib/jewelry1/hera-api'
import { toast } from 'sonner'

interface Customer {
  id: string
  name: string
  phone: string
  email: string
  category: 'retail' | 'wholesale' | 'premium' | 'vip'
  creditLimit: number
  totalPurchases: number
  lastPurchase: string
  joinedDate: string
  status: 'active' | 'inactive'
  city: string
}

export default function Jewelry1CustomersPage() {
  const { user, organization, isAuthenticated } = useHERAAuth()
  const jewelry1API = useJewelry1API()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [heraCustomers, setHeraCustomers] = useState<any[]>([])

  // Sample customers for demo
  const sampleCustomers: Customer[] = [
    {
      id: '1',
      name: 'Priya Shah',
      phone: '+91 98765 43210',
      email: 'priya.shah@email.com',
      category: 'vip',
      creditLimit: 500000,
      totalPurchases: 1250000,
      lastPurchase: '2024-01-15',
      joinedDate: '2023-03-15',
      status: 'active',
      city: 'Mumbai'
    },
    {
      id: '2',
      name: 'Rahul Mehta',
      phone: '+91 87654 32109',
      email: 'rahul.mehta@email.com',
      category: 'premium',
      creditLimit: 200000,
      totalPurchases: 650000,
      lastPurchase: '2024-01-10',
      joinedDate: '2023-07-22',
      status: 'active',
      city: 'Delhi'
    },
    {
      id: '3',
      name: 'Sunita Patel',
      phone: '+91 76543 21098',
      email: 'sunita.patel@email.com',
      category: 'wholesale',
      creditLimit: 300000,
      totalPurchases: 890000,
      lastPurchase: '2024-01-08',
      joinedDate: '2023-01-10',
      status: 'active',
      city: 'Ahmedabad'
    },
    {
      id: '4',
      name: 'Vikram Singh',
      phone: '+91 65432 10987',
      email: 'vikram.singh@email.com',
      category: 'retail',
      creditLimit: 50000,
      totalPurchases: 125000,
      lastPurchase: '2023-12-28',
      joinedDate: '2023-09-05',
      status: 'active',
      city: 'Jaipur'
    },
    {
      id: '5',
      name: 'Anjali Sharma',
      phone: '+91 54321 09876',
      email: 'anjali.sharma@email.com',
      category: 'premium',
      creditLimit: 150000,
      totalPurchases: 450000,
      lastPurchase: '2023-11-15',
      joinedDate: '2023-05-18',
      status: 'inactive',
      city: 'Bangalore'
    }
  ]

  // Load customers from HERA on component mount
  useEffect(() => {
    if (isAuthenticated && organization?.id) {
      loadCustomersFromHERA()
    }
  }, [isAuthenticated, organization?.id])

  const loadCustomersFromHERA = async () => {
    setIsLoading(true)
    try {
      const result = await jewelry1API.getCustomers({
        search: searchQuery,
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        limit: 100
      })

      if (result.success && result.data) {
        setHeraCustomers(result.data)
        toast.success(`Loaded ${result.data.length} customers from HERA`)
      } else {
        console.warn('Using sample data - HERA integration:', result.error)
        toast.info('Using sample data for demonstration')
        setCustomers(sampleCustomers)
      }
    } catch (error) {
      console.error('Error loading customers:', error)
      toast.info('Using sample data for demonstration')
      setCustomers(sampleCustomers)
    } finally {
      setIsLoading(false)
    }
  }

  // Use HERA customers if available, otherwise fall back to sample data
  const displayCustomers = heraCustomers.length > 0 ? 
    heraCustomers.map(convertHeraCustomerToDisplay) : 
    sampleCustomers

  // Convert HERA customer format to display format
  function convertHeraCustomerToDisplay(heraCustomer: any): Customer {
    return {
      id: heraCustomer.id,
      name: heraCustomer.entity_name,
      phone: heraCustomer.dynamic_data?.phone?.field_value_text || '',
      email: heraCustomer.dynamic_data?.email?.field_value_text || '',
      category: heraCustomer.dynamic_data?.category?.field_value_text || 'retail',
      creditLimit: heraCustomer.dynamic_data?.credit_limit?.field_value_number || 50000,
      totalPurchases: 0, // Would need transaction aggregation
      lastPurchase: heraCustomer.updated_at || heraCustomer.created_at,
      joinedDate: heraCustomer.created_at,
      status: 'active' as const,
      city: heraCustomer.dynamic_data?.city?.field_value_text || ''
    }
  }

  const filteredCustomers = displayCustomers.filter(customer => {
    const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.phone.includes(searchQuery) ||
                         customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         customer.city.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = selectedCategory === 'all' || customer.category === selectedCategory
    
    return matchesSearch && matchesCategory
  })

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'vip': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'premium': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'wholesale': return 'bg-green-100 text-green-800 border-green-200'
      case 'retail': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    return status === 'active' 
      ? 'bg-green-100 text-green-800 border-green-200'
      : 'bg-red-100 text-red-800 border-red-200'
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>Please log in to access customer management</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* SAP Fiori Header */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">Customer Management</h1>
                <p className="text-sm text-slate-500">Manage customer relationships and data</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="outline" className="text-blue-700 border-blue-200 bg-blue-50">
                {filteredCustomers.length} customers
              </Badge>
              {heraCustomers.length > 0 ? (
                <Badge variant="outline" className="text-green-700 border-green-200 bg-green-50">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  HERA Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="text-amber-700 border-amber-200 bg-amber-50">
                  <AlertTriangle className="w-4 h-4 mr-1" />
                  Sample Data
                </Badge>
              )}
              <Badge variant="outline" className="text-slate-700 border-slate-200 bg-slate-50">
                {organization?.entity_name || 'Demo Org'}
              </Badge>
              <Button size="sm" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Link href="/jewelry1/customers/new">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Customer
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    placeholder="Search customers by name, phone, email, or city..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-3 py-2 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="vip">VIP</option>
                  <option value="premium">Premium</option>
                  <option value="wholesale">Wholesale</option>
                  <option value="retail">Retail</option>
                </select>
                <Button variant="outline" size="sm">
                  <Filter className="w-4 h-4 mr-2" />
                  More Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Customer List</span>
              <div className="text-sm font-normal text-slate-500">
                Showing {filteredCustomers.length} of {sampleCustomers.length} customers
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">Loading Customers...</h3>
                <p className="text-slate-500">Connecting to HERA Sacred Six database</p>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No customers found</h3>
                <p className="text-slate-500 mb-4">Try adjusting your search criteria</p>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Customer
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredCustomers.map((customer) => (
                  <div key={customer.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-medium text-slate-900">{customer.name}</h3>
                          <Badge variant="outline" className={getCategoryColor(customer.category)}>
                            {customer.category.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(customer.status)}>
                            {customer.status.toUpperCase()}
                          </Badge>
                          {customer.category === 'vip' && (
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-slate-600">
                          <div className="flex items-center space-x-2">
                            <Phone className="w-4 h-4" />
                            <span>{customer.phone}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Mail className="w-4 h-4" />
                            <span>{customer.email}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4" />
                            <span>{customer.city}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>Joined {new Date(customer.joinedDate).toLocaleDateString()}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 pt-3 border-t border-slate-100">
                          <div>
                            <div className="text-xs text-slate-500">Total Purchases</div>
                            <div className="font-medium text-green-700">₹{customer.totalPurchases.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500">Credit Limit</div>
                            <div className="font-medium text-blue-700">₹{customer.creditLimit.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-xs text-slate-500">Last Purchase</div>
                            <div className="font-medium">{new Date(customer.lastPurchase).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </div>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Customer
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <CreditCard className="w-4 h-4 mr-2" />
                            View Purchases
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Customer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}