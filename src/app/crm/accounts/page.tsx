'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  Building2,
  Plus,
  Search,
  Filter,
  Globe,
  Users,
  DollarSign,
  Calendar,
  MoreVertical,
  Edit,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  ChevronRight,
  Star,
  AlertCircle,
  CheckCircle
} from 'lucide-react'

// India Vision Organization ID
const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001'

interface Account {
  id: string
  name: string
  industry: string
  segment: string
  revenue: number
  employees: number
  website: string
  status: 'active' | 'inactive' | 'prospect'
  rating: number
  lastContact: string
  opportunities: number
  wonDeals: number
  openCases: number
}

export default function AccountsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSegment, setSelectedSegment] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [isCreating, setIsCreating] = useState(false)

  // Sample accounts data
  const [accounts] = useState<Account[]>([
    {
      id: '1',
      name: 'Infosys Ltd',
      industry: 'Information Technology',
      segment: 'Enterprise',
      revenue: 18500000000,
      employees: 350000,
      website: 'www.infosys.com',
      status: 'active',
      rating: 5,
      lastContact: '2024-06-14',
      opportunities: 3,
      wonDeals: 12,
      openCases: 1
    },
    {
      id: '2',
      name: 'Tata Consultancy Services',
      industry: 'Information Technology',
      segment: 'Enterprise',
      revenue: 25700000000,
      employees: 600000,
      website: 'www.tcs.com',
      status: 'active',
      rating: 5,
      lastContact: '2024-06-12',
      opportunities: 2,
      wonDeals: 15,
      openCases: 0
    },
    {
      id: '3',
      name: 'Wipro Limited',
      industry: 'Information Technology',
      segment: 'Enterprise',
      revenue: 11000000000,
      employees: 250000,
      website: 'www.wipro.com',
      status: 'active',
      rating: 4,
      lastContact: '2024-06-10',
      opportunities: 1,
      wonDeals: 8,
      openCases: 0
    },
    {
      id: '4',
      name: 'HCL Technologies',
      industry: 'Information Technology',
      segment: 'Enterprise',
      revenue: 13000000000,
      employees: 220000,
      website: 'www.hcltech.com',
      status: 'active',
      rating: 4,
      lastContact: '2024-06-08',
      opportunities: 2,
      wonDeals: 10,
      openCases: 2
    },
    {
      id: '5',
      name: 'Tech Mahindra',
      industry: 'Information Technology',
      segment: 'SMB',
      revenue: 6500000000,
      employees: 150000,
      website: 'www.techmahindra.com',
      status: 'active',
      rating: 4,
      lastContact: '2024-06-05',
      opportunities: 1,
      wonDeals: 6,
      openCases: 0
    },
    {
      id: '6',
      name: 'Mindtree',
      industry: 'Information Technology',
      segment: 'SMB',
      revenue: 1200000000,
      employees: 35000,
      website: 'www.mindtree.com',
      status: 'prospect',
      rating: 3,
      lastContact: '2024-05-28',
      opportunities: 1,
      wonDeals: 0,
      openCases: 0
    },
    {
      id: '7',
      name: 'Cognizant',
      industry: 'Information Technology',
      segment: 'Enterprise',
      revenue: 19400000000,
      employees: 350000,
      website: 'www.cognizant.com',
      status: 'active',
      rating: 5,
      lastContact: '2024-06-01',
      opportunities: 4,
      wonDeals: 18,
      openCases: 1
    },
    {
      id: '8',
      name: 'Mphasis',
      industry: 'Information Technology',
      segment: 'SMB',
      revenue: 1600000000,
      employees: 30000,
      website: 'www.mphasis.com',
      status: 'inactive',
      rating: 2,
      lastContact: '2024-04-20',
      opportunities: 0,
      wonDeals: 3,
      openCases: 0
    }
  ])

  const supabase = createClientComponentClient()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'inactive':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'prospect':
        return 'bg-[#FF5A09]/20 text-[#FF5A09] border-[#FF5A09]/30'
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const getSegmentColor = (segment: string) => {
    switch (segment) {
      case 'Enterprise':
        return 'from-[#FF5A09] to-[#ec7f37]'
      case 'SMB':
        return 'from-[#ec7f37] to-[#be4f0c]'
      case 'Startup':
        return 'from-[#be4f0c] to-[#FF5A09]'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  const filteredAccounts = accounts.filter(account => {
    const matchesSearch =
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.industry.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSegment = selectedSegment === 'all' || account.segment === selectedSegment
    const matchesStatus = selectedStatus === 'all' || account.status === selectedStatus
    return matchesSearch && matchesSegment && matchesStatus
  })

  const stats = [
    {
      label: 'Total Accounts',
      value: accounts.length,
      icon: Building2,
      color: 'from-[#FF5A09] to-[#ec7f37]'
    },
    {
      label: 'Active Accounts',
      value: accounts.filter(a => a.status === 'active').length,
      icon: CheckCircle,
      color: 'from-emerald-500 to-green-600'
    },
    {
      label: 'Total Revenue',
      value: `₹${(accounts.reduce((sum, a) => sum + a.revenue, 0) / 100000000).toFixed(0)}Cr`,
      icon: DollarSign,
      color: 'from-[#ec7f37] to-[#be4f0c]'
    },
    {
      label: 'Avg Deal Size',
      value: '₹9.4L',
      icon: TrendingUp,
      color: 'from-[#be4f0c] to-[#FF5A09]'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Accounts</h1>
          <p className="text-white/60 mt-1">Manage your customer accounts and relationships</p>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="mt-4 sm:mt-0 flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#FF5A09] to-[#ec7f37] rounded-lg text-white font-medium hover:shadow-lg hover:shadow-[#FF5A09]/30 transition-all duration-300"
        >
          <Plus className="h-5 w-5" />
          <span>New Account</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div key={index} className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF5A09]/50 to-[#ec7f37]/50 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
              <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.color}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-xs text-emerald-400 font-medium">+12%</span>
                </div>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-xs text-white/60 mt-1">{stat.label}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
          <input
            type="text"
            placeholder="Search accounts..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#FF5A09] transition-colors"
          />
        </div>

        <select
          value={selectedSegment}
          onChange={e => setSelectedSegment(e.target.value)}
          className="px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF5A09] transition-colors"
        >
          <option value="all">All Segments</option>
          <option value="Enterprise">Enterprise</option>
          <option value="SMB">SMB</option>
          <option value="Startup">Startup</option>
        </select>

        <select
          value={selectedStatus}
          onChange={e => setSelectedStatus(e.target.value)}
          className="px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF5A09] transition-colors"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="prospect">Prospect</option>
        </select>

        <button className="flex items-center space-x-2 px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors">
          <Filter className="h-5 w-5" />
          <span>More Filters</span>
        </button>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAccounts.map(account => (
          <div key={account.id} className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF5A09]/30 to-[#ec7f37]/30 rounded-2xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start space-x-4">
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-br ${getSegmentColor(account.segment)}`}
                  >
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">{account.name}</h3>
                    <p className="text-sm text-white/60">{account.industry}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(account.status)}`}
                  >
                    {account.status}
                  </span>
                  <button className="text-white/40 hover:text-white transition-colors">
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Rating */}
              <div className="flex items-center space-x-1 mb-4">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= account.rating ? 'text-[#FF5A09] fill-[#FF5A09]' : 'text-white/20'
                    }`}
                  />
                ))}
                <span className="text-xs text-white/60 ml-2">({account.rating}.0)</span>
              </div>

              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-white/60 mb-1">Annual Revenue</p>
                  <p className="text-sm font-semibold text-white">
                    ₹{(account.revenue / 10000000).toFixed(0)} Cr
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/60 mb-1">Employees</p>
                  <p className="text-sm font-semibold text-white">
                    {(account.employees / 1000).toFixed(0)}K
                  </p>
                </div>
                <div>
                  <p className="text-xs text-white/60 mb-1">Segment</p>
                  <p className="text-sm font-semibold text-white">{account.segment}</p>
                </div>
                <div>
                  <p className="text-xs text-white/60 mb-1">Last Contact</p>
                  <p className="text-sm font-semibold text-white">
                    {new Date(account.lastContact).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center space-x-3 mb-4 text-xs">
                <div className="flex items-center space-x-1 text-white/60">
                  <Globe className="h-3 w-3" />
                  <span>{account.website}</span>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
                <div className="text-center">
                  <p className="text-lg font-semibold text-[#FF5A09]">{account.opportunities}</p>
                  <p className="text-xs text-white/60">Open Opps</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-emerald-400">{account.wonDeals}</p>
                  <p className="text-xs text-white/60">Won Deals</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-red-400">{account.openCases}</p>
                  <p className="text-xs text-white/60">Open Cases</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-white/40 hover:text-[#FF5A09] transition-colors">
                    <Mail className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-white/40 hover:text-[#FF5A09] transition-colors">
                    <Phone className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-white/40 hover:text-[#FF5A09] transition-colors">
                    <Calendar className="h-4 w-4" />
                  </button>
                </div>
                <button className="flex items-center space-x-1 text-[#FF5A09] hover:text-[#ec7f37] transition-colors">
                  <span className="text-sm">View Details</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredAccounts.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No accounts found</h3>
          <p className="text-white/60">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}
