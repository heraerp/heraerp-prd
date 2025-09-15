'use client'

import { useState, useEffect } from 'react'
import { universalApi } from '@/lib/universal-api'
import { Search, Plus, User, Phone, Mail, Star, Calendar, DollarSign } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { SalonCard, SalonStatCard } from '@/components/salon/SalonCard'

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
      case 'gold': return 'bg-yellow-400/20 text-yellow-400 border-yellow-400/30'
      case 'silver': return 'bg-gray-400/20 text-gray-300 border-gray-400/30'
      case 'bronze': return 'bg-orange-400/20 text-orange-400 border-orange-400/30'
      default: return 'bg-white/10 text-white/60 border-white/20'
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#DD97E2]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">Customers</h1>
          <p className="text-white/60 mt-1">Manage your customer relationships</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#DD97E2] text-white rounded-lg font-medium hover:shadow-lg hover:shadow-[#DD97E2]/40 transition-all duration-300">
          <Plus className="w-4 h-4" />
          Add Customer
        </button>
      </div>

      {/* Filters */}
      <SalonCard>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, phone, or email..."
                className="w-full bg-white/10 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-[#DD97E2] transition-all"
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
                    ? "bg-[#DD97E2] border-[#DD97E2] text-white"
                    : "bg-white/10 border-white/10 text-white/60 hover:text-white"
                )}
              >
                {tier === 'all' ? 'All Tiers' : tier}
              </button>
            ))}
          </div>
        </div>
      </SalonCard>

      {/* Customer Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SalonStatCard
          label="Total Customers"
          value={customers.length}
          icon={User}
        />
        <SalonStatCard
          label="Gold Members"
          value={customers.filter(c => c.loyalty_tier === 'gold').length}
          icon={Star}
        />
        <SalonStatCard
          label="New This Month"
          value={customers.filter(c => {
            const created = new Date(c.created_at)
            const now = new Date()
            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
          }).length}
          icon={Calendar}
        />
        <SalonStatCard
          label="Total Revenue"
          value={`AED ${customers.reduce((sum, c) => sum + (c.total_spent || 0), 0).toFixed(0)}`}
          icon={DollarSign}
        />
      </div>

      {/* Customer List */}
      <SalonCard className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/20">
                <th className="text-left p-6 text-white/60 font-semibold uppercase tracking-wider text-sm">Customer</th>
                <th className="text-left p-6 text-white/60 font-semibold uppercase tracking-wider text-sm">Contact</th>
                <th className="text-left p-6 text-white/60 font-semibold uppercase tracking-wider text-sm">Loyalty Tier</th>
                <th className="text-left p-6 text-white/60 font-semibold uppercase tracking-wider text-sm">Visits</th>
                <th className="text-left p-6 text-white/60 font-semibold uppercase tracking-wider text-sm">Total Spent</th>
                <th className="text-left p-6 text-white/60 font-semibold uppercase tracking-wider text-sm">Last Visit</th>
                <th className="text-left p-6 text-white/60 font-semibold uppercase tracking-wider text-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="border-b border-white/10 hover:bg-white/5 transition-all">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#DD97E2] rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-semibold">{customer.entity_name}</p>
                        <p className="text-white/60 text-sm">{customer.entity_code}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="space-y-1">
                      {customer.phone && (
                        <div className="flex items-center gap-2 text-white/80 text-sm">
                          <Phone className="w-4 h-4 text-white/40" />
                          {customer.phone}
                        </div>
                      )}
                      {customer.email && (
                        <div className="flex items-center gap-2 text-white/80 text-sm">
                          <Mail className="w-4 h-4 text-white/40" />
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
                    <div className="flex items-center gap-2 text-white/80">
                      <Calendar className="w-4 h-4 text-white/40" />
                      {customer.total_visits || 0}
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2 text-[#DD97E2]">
                      <DollarSign className="w-4 h-4 text-[#DD97E2]/60" />
                      AED {(customer.total_spent || 0).toFixed(2)}
                    </div>
                  </td>
                  <td className="p-6">
                    <p className="text-white/60 text-sm">{formatDate(customer.last_visit)}</p>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/salon/customers/${customer.id}`}
                        className="text-[#DD97E2] hover:text-[#DD97E2]/80 text-sm font-semibold hover:underline"
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
            <p className="text-white/60">No customers found matching your criteria</p>
          </div>
        )}
      </SalonCard>
    </div>
  )
}