'use client'

import { useState, useEffect } from 'react'
import { universalApi } from '@/lib/universal-api'
import { Search, Plus, User, Phone, Mail, Star, Calendar, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const SALON_ORG_ID = '84a3654b-907b-472a-ac8f-a1ffb6fb711b'

interface Customer {
  id: string
  entity_name: string
  entity_code: string
  smart_code: string
  created_at: string
  phone?: string
  email?: string
  loyalty_tier?: string
  total_visits?: number
  total_spent?: number
  last_visit?: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTier, setSelectedTier] = useState<string>('all')

  useEffect(() => {
    universalApi.setOrganizationId(SALON_ORG_ID)
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      setLoading(true)
      
      // Load customers
      const entitiesData = await universalApi.read('core_entities')
      const customerEntities = entitiesData.data.filter(
        (e: any) => e.entity_type === 'customer' && e.organization_id === SALON_ORG_ID
      )
      
      // Load dynamic data for customers
      const dynamicData = await universalApi.read('core_dynamic_data')
      const customerDynamicData = dynamicData.data.filter(
        (d: any) => d.organization_id === SALON_ORG_ID &&
                    customerEntities.some((c: any) => c.id === d.entity_id)
      )
      
      // Load transactions to calculate visits and spending
      const transactionsData = await universalApi.read('universal_transactions')
      const customerTransactions = transactionsData.data.filter(
        (t: any) => t.organization_id === SALON_ORG_ID && 
                    (t.transaction_type === 'pos_sale' || t.transaction_type === 'appointment')
      )
      
      // Transform customers with additional data
      const enrichedCustomers = customerEntities.map((customer: any) => {
        // Get dynamic fields
        const dynamicFields = customerDynamicData.filter((d: any) => d.entity_id === customer.id)
        const phone = dynamicFields.find((d: any) => d.field_name === 'phone')?.field_value_text
        const email = dynamicFields.find((d: any) => d.field_name === 'email')?.field_value_text
        const loyalty_tier = dynamicFields.find((d: any) => d.field_name === 'loyalty_tier')?.field_value_text
        
        // Calculate visits and spending
        const customerTxns = customerTransactions.filter(
          (t: any) => t.source_entity_id === customer.id
        )
        const total_visits = customerTxns.length
        const total_spent = customerTxns.reduce((sum: number, t: any) => sum + (t.total_amount || 0), 0)
        const last_visit = customerTxns.length > 0 
          ? new Date(Math.max(...customerTxns.map((t: any) => new Date(t.created_at).getTime())))
          : null
        
        return {
          ...customer,
          phone,
          email,
          loyalty_tier,
          total_visits,
          total_spent,
          last_visit: last_visit ? last_visit.toISOString() : null
        }
      })
      
      setCustomers(enrichedCustomers)
    } catch (error) {
      console.error('Error loading customers:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.phone?.includes(searchTerm) ||
                         customer.email?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTier = selectedTier === 'all' || customer.loyalty_tier === selectedTier
    
    return matchesSearch && matchesTier
  })

  const getTierColor = (tier?: string) => {
    switch (tier) {
      case 'gold': return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-700 border-amber-300'
      case 'silver': return 'bg-gradient-to-r from-gray-100 to-slate-100 text-slate-700 border-slate-300'
      case 'bronze': return 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 border-orange-300'
      default: return 'bg-gray-100 text-gray-600 border-gray-300'
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    const days = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24))
    if (days === 0) return 'Today'
    if (days === 1) return 'Yesterday'
    if (days < 7) return `${days} days ago`
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`
    return date.toLocaleDateString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">Customers</h1>
          <p className="text-gray-700 mt-2 font-medium">Manage your customer relationships</p>
        </div>
        <button className="bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl px-6 py-3 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-[1.02] flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Customer
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, phone, or email..."
                className="w-full bg-white/50 border border-white/20 rounded-lg pl-10 pr-4 py-3 text-gray-900 placeholder-gray-500 focus:outline-none focus:border-violet-500 focus:bg-white/70 transition-all"
              />
            </div>
          </div>

          {/* Tier Filter */}
          <div className="flex items-center gap-2">
            {['all', 'gold', 'silver', 'bronze'].map((tier) => (
              <button
                key={tier}
                onClick={() => setSelectedTier(tier)}
                className={cn(
                  "px-4 py-2 rounded-lg border transition-all capitalize font-medium",
                  selectedTier === tier
                    ? "bg-violet-600 border-violet-600 text-white shadow-lg"
                    : "bg-white/50 border-white/20 text-gray-700 hover:bg-white/70 hover:text-violet-600"
                )}
              >
                {tier === 'all' ? 'All Tiers' : tier}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white/70 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-white/20 hover:bg-white/80 transition-all">
          <p className="text-gray-600 text-sm font-medium">Total Customers</p>
          <p className="text-gray-900 text-2xl font-bold mt-1">{customers.length}</p>
        </div>
        <div className="bg-white/70 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-white/20 hover:bg-white/80 transition-all">
          <p className="text-gray-600 text-sm font-medium">Gold Members</p>
          <p className="text-gray-900 text-2xl font-bold mt-1">
            {customers.filter(c => c.loyalty_tier === 'gold').length}
          </p>
        </div>
        <div className="bg-white/70 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-white/20 hover:bg-white/80 transition-all">
          <p className="text-gray-600 text-sm font-medium">New This Month</p>
          <p className="text-gray-900 text-2xl font-bold mt-1">
            {customers.filter(c => {
              const created = new Date(c.created_at)
              const now = new Date()
              return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
            }).length}
          </p>
        </div>
        <div className="bg-white/70 backdrop-blur-xl rounded-xl p-4 shadow-lg border border-white/20 hover:bg-white/80 transition-all">
          <p className="text-gray-600 text-sm font-medium">Total Revenue</p>
          <p className="text-gray-900 text-2xl font-bold mt-1">
            AED {customers.reduce((sum, c) => sum + (c.total_spent || 0), 0).toFixed(0)}
          </p>
        </div>
      </div>

      {/* Customer List */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left p-6 text-gray-700 font-semibold uppercase tracking-wider text-sm">Customer</th>
                <th className="text-left p-6 text-gray-700 font-semibold uppercase tracking-wider text-sm">Contact</th>
                <th className="text-left p-6 text-gray-700 font-semibold uppercase tracking-wider text-sm">Loyalty Tier</th>
                <th className="text-left p-6 text-gray-700 font-semibold uppercase tracking-wider text-sm">Visits</th>
                <th className="text-left p-6 text-gray-700 font-semibold uppercase tracking-wider text-sm">Total Spent</th>
                <th className="text-left p-6 text-gray-700 font-semibold uppercase tracking-wider text-sm">Last Visit</th>
                <th className="text-left p-6 text-gray-700 font-semibold uppercase tracking-wider text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="border-b border-white/10 hover:bg-white/50 transition-all">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-full flex items-center justify-center shadow-md">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-gray-900 font-semibold">{customer.entity_name}</p>
                        <p className="text-gray-600 text-sm">{customer.entity_code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="space-y-1">
                      {customer.phone && (
                        <div className="flex items-center gap-2 text-gray-700 text-sm">
                          <Phone className="w-4 h-4 text-gray-500" />
                          {customer.phone}
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center gap-2 text-gray-700 text-sm">
                          <Mail className="w-4 h-4 text-gray-500" />
                          {customer.email}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-6">
                    {customer.loyalty_tier && (
                      <span className={cn(
                        "px-3 py-1 rounded-full text-sm font-medium border capitalize",
                        getTierColor(customer.loyalty_tier)
                      )}>
                        {customer.loyalty_tier}
                      </span>
                    )}
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      {customer.total_visits || 0}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2 text-gray-700">
                      <DollarSign className="w-4 h-4 text-gray-500" />
                      AED {(customer.total_spent || 0).toFixed(2)}
                    </div>
                  </td>
                  <td className="p-6">
                    <p className="text-gray-700 text-sm">{formatDate(customer.last_visit)}</p>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/salon/customers/${customer.id}`}
                        className="text-violet-600 hover:text-violet-700 text-sm font-semibold hover:underline"
                      >
                        View Profile
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="p-12 text-center">
            <p className="text-gray-600">No customers found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  )
}