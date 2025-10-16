'use client'

import React from 'react'
import { useEntitiesList, useEntityUpsert, useHera } from '@/lib/hooks/hera'
import { 
  Users, Search, Plus, Filter, Mail, Phone, 
  MapPin, Calendar, Star, TrendingUp, Edit3, Eye
} from 'lucide-react'

export default function RetailCRMPage() {
  const { auth } = useHera()
  const [search, setSearch] = React.useState('')
  const { data, isLoading } = useEntitiesList({
    entity_type: 'CUSTOMER',
    search,
    page: 1,
    page_size: 50
  })
  
  const customers = (data as any)?.items || []

  // Mock customer data with enhanced details
  const enhancedCustomers = customers.length > 0 ? customers : [
    {
      id: '1',
      entity_name: 'John Smith',
      email: 'john.smith@email.com',
      phone: '+91 98765 43210',
      total_spent: 12500,
      orders_count: 8,
      last_order: '2024-01-15',
      status: 'VIP',
      location: 'Mumbai'
    },
    {
      id: '2', 
      entity_name: 'Sarah Johnson',
      email: 'sarah.j@email.com',
      phone: '+91 87654 32109',
      total_spent: 8900,
      orders_count: 5,
      last_order: '2024-01-12',
      status: 'Regular',
      location: 'Delhi'
    },
    {
      id: '3',
      entity_name: 'Tech Solutions Inc',
      email: 'info@techsolutions.com',
      phone: '+91 76543 21098',
      total_spent: 45000,
      orders_count: 12,
      last_order: '2024-01-14',
      status: 'Enterprise',
      location: 'Bangalore'
    }
  ]

  const stats = {
    total: enhancedCustomers.length,
    new_this_month: 23,
    active: enhancedCustomers.filter(c => new Date(c.last_order) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length,
    vip: enhancedCustomers.filter(c => c.status === 'VIP' || c.status === 'Enterprise').length
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="modern-card modern-primary">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-gradient-to-br from-[#1E88E5]/30 to-[#1565C0]/20">
              <Users className="w-7 h-7 text-[#1565C0]" />
            </div>
            <div>
              <h1 className="modern-heading text-2xl text-[#1E1E20]">Customer Relationship Management</h1>
              <p className="modern-subheading">Manage customer relationships and engagement</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="modern-btn-secondary flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </button>
            <button className="modern-btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Customer
            </button>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="modern-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="modern-caption text-[#4B5563] mb-1">Total Customers</div>
              <div className="modern-heading text-2xl text-[#1E1E20]">{stats.total}</div>
            </div>
            <div className="p-3 rounded-full bg-[#1E88E5]/10">
              <Users className="w-6 h-6 text-[#1E88E5]" />
            </div>
          </div>
        </div>
        
        <div className="modern-card modern-kpi-success">
          <div className="flex items-center justify-between">
            <div>
              <div className="modern-caption text-[#4B5563] mb-1">Active This Month</div>
              <div className="modern-heading text-2xl text-[#1E1E20]">{stats.active}</div>
            </div>
            <div className="p-3 rounded-full bg-[#81C784]/10">
              <TrendingUp className="w-6 h-6 text-[#81C784]" />
            </div>
          </div>
        </div>
        
        <div className="modern-card modern-kpi-warning">
          <div className="flex items-center justify-between">
            <div>
              <div className="modern-caption text-[#4B5563] mb-1">New This Month</div>
              <div className="modern-heading text-2xl text-[#1E1E20]">{stats.new_this_month}</div>
            </div>
            <div className="p-3 rounded-full bg-[#FFB74D]/10">
              <Plus className="w-6 h-6 text-[#FFB74D]" />
            </div>
          </div>
        </div>
        
        <div className="modern-card">
          <div className="flex items-center justify-between">
            <div>
              <div className="modern-caption text-[#4B5563] mb-1">VIP Customers</div>
              <div className="modern-heading text-2xl text-[#1E1E20]">{stats.vip}</div>
            </div>
            <div className="p-3 rounded-full bg-[#9C8CFF]/10">
              <Star className="w-6 h-6 text-[#9C8CFF]" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="modern-card">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#4B5563]" />
            <input
              className="modern-input w-full pl-10"
              placeholder="Search customers by name, email, or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <select className="modern-input">
              <option>All Customers</option>
              <option>VIP Customers</option>
              <option>Regular Customers</option>
              <option>New Customers</option>
            </select>
            <select className="modern-input">
              <option>All Locations</option>
              <option>Mumbai</option>
              <option>Delhi</option>
              <option>Bangalore</option>
            </select>
          </div>
        </div>
      </div>

      {/* Customers List */}
      <div className="modern-card">
        {isLoading ? (
          <div className="modern-loading p-12 text-center">
            <Users className="w-8 h-8 text-[#4B5563] mx-auto mb-3 animate-pulse" />
            <p className="modern-subheading">Loading customers...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {enhancedCustomers.map((customer) => (
              <div key={customer.id} className="modern-elevated p-4 rounded-xl hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#1E88E5] to-[#1565C0] flex items-center justify-center text-white font-bold text-lg">
                      {customer.entity_name?.charAt(0) || '?'}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="modern-heading text-lg text-[#1E1E20]">
                          {customer.entity_name}
                        </h3>
                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                          customer.status === 'VIP' || customer.status === 'Enterprise'
                            ? 'modern-status-warning' 
                            : 'modern-status-info'
                        }`}>
                          {customer.status}
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-2 mb-3">
                        <div className="flex items-center gap-2 text-sm text-[#4B5563]">
                          <Mail className="w-4 h-4" />
                          {customer.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#4B5563]">
                          <Phone className="w-4 h-4" />
                          {customer.phone}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#4B5563]">
                          <MapPin className="w-4 h-4" />
                          {customer.location}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-[#4B5563]">
                          <Calendar className="w-4 h-4" />
                          Last order: {new Date(customer.last_order).toLocaleDateString()}
                        </div>
                      </div>
                      
                      <div className="flex gap-4">
                        <div className="text-center">
                          <div className="modern-heading text-[#1E88E5]">
                            ₹{customer.total_spent.toLocaleString('en-IN')}
                          </div>
                          <div className="modern-caption text-[#4B5563]">Total Spent</div>
                        </div>
                        <div className="text-center">
                          <div className="modern-heading text-[#1E1E20]">
                            {customer.orders_count}
                          </div>
                          <div className="modern-caption text-[#4B5563]">Orders</div>
                        </div>
                        <div className="text-center">
                          <div className="modern-heading text-[#81C784]">
                            ₹{Math.round(customer.total_spent / customer.orders_count).toLocaleString('en-IN')}
                          </div>
                          <div className="modern-caption text-[#4B5563]">Avg Order</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button className="modern-btn-secondary flex items-center gap-2 text-sm">
                      <Eye className="w-4 h-4" />
                      View Profile
                    </button>
                    <button className="modern-btn-secondary flex items-center gap-2 text-sm">
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </button>
                    <button className="modern-btn-accent flex items-center gap-2 text-sm">
                      <Mail className="w-4 h-4" />
                      Contact
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="text-center">
        <p className="modern-caption text-[#4B5563]">
          Showing {enhancedCustomers.length} customers • Last updated {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  )
}