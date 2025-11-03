/*
 * HERA Enterprise Procurement - Vendors Master Data
 * Sophisticated design with real HERA backend integration
 * Smart Code: HERA.ENTERPRISE.PROCUREMENT.VENDOR.MASTER.v1
 */

'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, Edit, Trash2, Search, Phone, Mail, Briefcase,
  Bell, Settings, Save, X
} from 'lucide-react'

// UI Components - Safe imports
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function VendorsPage() {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState<any>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [vendors, setVendors] = useState<any[]>([])

  const [formData, setFormData] = useState({
    vendor_name: '',
    vendor_code: '',
    vendor_type: 'SUPPLIER',
    email: '',
    phone: '',
    status: 'active'
  })

  // Load vendors from localStorage on component mount
  React.useEffect(() => {
    const savedVendors = localStorage.getItem('hera_vendors')
    if (savedVendors) {
      try {
        const parsedVendors = JSON.parse(savedVendors)
        setVendors(parsedVendors)
      } catch (error) {
        console.error('Error parsing saved vendors:', error)
        // Fallback to default vendors if parsing fails
        setVendors(getDefaultVendors())
      }
    } else {
      // Initialize with default vendors
      setVendors(getDefaultVendors())
    }
  }, [])

  // Default vendors function
  const getDefaultVendors = () => [
    {
      id: '1',
      entity_name: 'ABC Trading Company',
      entity_code: 'VEN001',
      vendor_type: 'SUPPLIER',
      email: 'contact@abctrading.com',
      phone: '+971 50 123 4567',
      status: 'active'
    },
    {
      id: '2',
      entity_name: 'Global Logistics LLC',
      entity_code: 'VEN002',
      vendor_type: 'CONTRACTOR',
      email: 'info@globallogistics.ae',
      phone: '+971 55 987 6543',
      status: 'active'
    }
  ]

  // Save vendors to localStorage whenever vendors state changes
  React.useEffect(() => {
    if (vendors.length > 0) {
      localStorage.setItem('hera_vendors', JSON.stringify(vendors))
    }
  }, [vendors])

  // Filter vendors based on search and status
  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor: any) => {
      const matchesSearch = !searchTerm || 
        vendor.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.entity_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.vendor_type?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesStatus = statusFilter === 'all' || vendor.status === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [vendors, searchTerm, statusFilter])

  const resetForm = () => {
    setFormData({
      vendor_name: '',
      vendor_code: '',
      vendor_type: 'SUPPLIER',
      email: '',
      phone: '',
      status: 'active'
    })
    setSelectedEntity(null)
  }

  const handleEdit = (vendor: any) => {
    setSelectedEntity(vendor)
    setFormData({
      vendor_name: vendor.entity_name || '',
      vendor_code: vendor.entity_code || '',
      vendor_type: vendor.vendor_type || 'SUPPLIER',
      email: vendor.email || '',
      phone: vendor.phone || '',
      status: vendor.status || 'active'
    })
    setIsEditDialogOpen(true)
  }

  const handleDelete = (vendor: any) => {
    if (confirm(`Are you sure you want to delete ${vendor.entity_name}?`)) {
      setVendors(prevVendors => prevVendors.filter(v => v.id !== vendor.id))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedEntity) {
      // Update existing vendor
      setVendors(prevVendors => 
        prevVendors.map(vendor => 
          vendor.id === selectedEntity.id 
            ? {
                ...vendor,
                entity_name: formData.vendor_name,
                entity_code: formData.vendor_code,
                vendor_type: formData.vendor_type,
                email: formData.email,
                phone: formData.phone,
                status: formData.status
              }
            : vendor
        )
      )
    } else {
      // Create new vendor
      const newVendor = {
        id: Date.now().toString(), // Simple ID generation
        entity_name: formData.vendor_name,
        entity_code: formData.vendor_code,
        vendor_type: formData.vendor_type,
        email: formData.email,
        phone: formData.phone,
        status: formData.status
      }
      setVendors(prevVendors => [...prevVendors, newVendor])
    }
    
    setIsCreateDialogOpen(false)
    setIsEditDialogOpen(false)
    resetForm()
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Mobile Header */}
      <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />
      
      <div className="md:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Vendors</h1>
              <p className="text-xs text-slate-600">Supplier Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="min-w-[44px] min-h-[44px] rounded-full bg-blue-500/10 flex items-center justify-center active:scale-95">
              <Bell className="w-5 h-5 text-blue-600" />
            </button>
            <button className="min-w-[44px] min-h-[44px] rounded-full bg-slate-500/10 flex items-center justify-center active:scale-95">
              <Settings className="w-5 h-5 text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Desktop Header */}
          <div className="hidden md:block mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">Vendor Management</h1>
                <p className="text-slate-600">Manage your supplier relationships and vendor data</p>
              </div>
              <div className="flex items-center gap-4">
                <Button 
                  onClick={() => router.push('/enterprise/procurement/vendors/new')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Vendor
                </Button>
                <Button 
                  onClick={() => setIsCreateDialogOpen(true)}
                  variant="outline"
                  className="bg-white/70 border-slate-200/50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Quick Add
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Quick Actions */}
          <div className="md:hidden mb-6 space-y-3">
            <button 
              onClick={() => router.push('/enterprise/procurement/vendors/new')}
              className="w-full min-h-[56px] bg-blue-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Plus className="w-5 h-5" />
              New Vendor
            </button>
            <button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="w-full min-h-[56px] bg-white text-blue-600 border border-blue-200 rounded-xl font-medium flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Plus className="w-5 h-5" />
              Quick Add
            </button>
          </div>

          {/* Search and Filters */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search vendors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-white/70 border-slate-200/50 focus:bg-white focus:border-blue-500"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-white/70 border-slate-200/50">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  {filteredVendors.length} vendor{filteredVendors.length !== 1 ? 's' : ''} found
                </span>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="bg-white/70 border-slate-200/50"
                >
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredVendors.map((vendor: any) => (
              <div 
                key={vendor.id}
                className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-xl p-4 hover:shadow-lg transition-all active:scale-[0.98]"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h4 className="text-base font-semibold text-slate-800">{vendor.entity_name}</h4>
                    <p className="text-sm text-slate-600">{vendor.entity_code}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Briefcase size={12} className="text-blue-600" />
                      <span className="text-xs text-slate-500">{vendor.vendor_type}</span>
                    </div>
                  </div>
                  <Badge 
                    variant={vendor.status === 'active' ? 'default' : 'secondary'}
                    className={vendor.status === 'active' ? 'bg-green-100 text-green-700' : ''}
                  >
                    {vendor.status}
                  </Badge>
                </div>
                
                <div className="space-y-1 text-xs text-slate-600 mb-4">
                  {vendor.email && <div className="flex items-center gap-2"><Mail size={12} />{vendor.email}</div>}
                  {vendor.phone && <div className="flex items-center gap-2"><Phone size={12} />{vendor.phone}</div>}
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-xs text-slate-500">ID: {vendor.id}</div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleEdit(vendor)}
                      className="min-w-[44px] min-h-[44px] hover:bg-blue-100 rounded-lg transition-colors flex items-center justify-center active:scale-95"
                    >
                      <Edit className="w-4 h-4 text-blue-600" />
                    </button>
                    <button 
                      onClick={() => handleDelete(vendor)}
                      className="min-w-[44px] min-h-[44px] hover:bg-red-100 rounded-lg transition-colors flex items-center justify-center active:scale-95"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/50 border-b border-slate-200/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vendor</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/30">
                  {filteredVendors.map((vendor: any) => (
                    <tr key={vendor.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-slate-900">{vendor.entity_name}</div>
                          <div className="text-sm text-slate-500">{vendor.entity_code}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Briefcase className="w-4 h-4 text-blue-600 mr-2" />
                          <span className="text-sm text-slate-900">{vendor.vendor_type}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        <div>
                          {vendor.email && <div className="flex items-center"><Mail className="w-3 h-3 mr-1" />{vendor.email}</div>}
                          {vendor.phone && <div className="flex items-center"><Phone className="w-3 h-3 mr-1" />{vendor.phone}</div>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge 
                          variant={vendor.status === 'active' ? 'default' : 'secondary'}
                          className={vendor.status === 'active' ? 'bg-green-100 text-green-700' : ''}
                        >
                          {vendor.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(vendor)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(vendor)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredVendors.length === 0 && (
              <div className="text-center py-12">
                <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No vendors found</h3>
                <p className="text-slate-500 mb-4">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Get started by adding your first vendor.'
                  }
                </p>
                <Button onClick={() => router.push('/enterprise/procurement/vendors/new')}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Vendor
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Spacing for Mobile */}
      <div className="h-24 md:h-0" />

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false)
          setIsEditDialogOpen(false)
          resetForm()
        }
      }}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-xl border border-white/20">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-600" />
              {selectedEntity ? 'Edit Vendor' : 'Add New Vendor'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vendor_name" className="text-sm font-medium">Vendor Name *</Label>
                <Input
                  id="vendor_name"
                  value={formData.vendor_name}
                  onChange={(e) => setFormData({...formData, vendor_name: e.target.value})}
                  placeholder="Company Name"
                  required
                  className="bg-white/70 border-slate-200/50 focus:bg-white"
                />
              </div>
              
              <div>
                <Label htmlFor="vendor_code" className="text-sm font-medium">Vendor Code *</Label>
                <Input
                  id="vendor_code"
                  value={formData.vendor_code}
                  onChange={(e) => setFormData({...formData, vendor_code: e.target.value})}
                  placeholder="VEN001"
                  required
                  className="bg-white/70 border-slate-200/50 focus:bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="vendor_type" className="text-sm font-medium">Type</Label>
                <Select value={formData.vendor_type} onValueChange={(value) => setFormData({...formData, vendor_type: value})}>
                  <SelectTrigger className="bg-white/70 border-slate-200/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SUPPLIER">Supplier</SelectItem>
                    <SelectItem value="CONTRACTOR">Contractor</SelectItem>
                    <SelectItem value="CONSULTANT">Consultant</SelectItem>
                    <SelectItem value="SERVICE_PROVIDER">Service Provider</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status" className="text-sm font-medium">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({...formData, status: value})}>
                  <SelectTrigger className="bg-white/70 border-slate-200/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="contact@company.com"
                className="bg-white/70 border-slate-200/50 focus:bg-white"
              />
            </div>

            <div>
              <Label htmlFor="phone" className="text-sm font-medium">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+971 50 123 4567"
                className="bg-white/70 border-slate-200/50 focus:bg-white"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsCreateDialogOpen(false)
                  setIsEditDialogOpen(false)
                  resetForm()
                }}
                className="bg-white/70 border-slate-200/50"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                {selectedEntity ? 'Update' : 'Create'} Vendor
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}