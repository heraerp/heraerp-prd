'use client'

import { useState } from 'react'
import { 
  Search, 
  Filter,
  Download,
  Plus,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  Wifi,
  Users,
  Calendar,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  TrendingUp,
  AlertCircle
} from 'lucide-react'

interface Subscriber {
  id: string
  name: string
  email: string
  phone: string
  planType: string
  speed: string
  status: 'active' | 'inactive' | 'suspended'
  location: string
  joinDate: string
  billAmount: number
  dataUsage: number
  paymentStatus: 'paid' | 'pending' | 'overdue'
}

const mockSubscribers: Subscriber[] = [
  {
    id: 'CUST-100001',
    name: 'ABC Enterprises',
    email: 'contact@abc-enterprises.com',
    phone: '+91 9876543210',
    planType: 'Business',
    speed: '100 Mbps',
    status: 'active',
    location: 'Kochi',
    joinDate: '2024-01-15',
    billAmount: 2499,
    dataUsage: 850,
    paymentStatus: 'paid'
  },
  {
    id: 'CUST-100002',
    name: 'John Doe',
    email: 'john.doe@email.com',
    phone: '+91 9876543211',
    planType: 'Home',
    speed: '50 Mbps',
    status: 'active',
    location: 'Thiruvananthapuram',
    joinDate: '2024-02-20',
    billAmount: 799,
    dataUsage: 420,
    paymentStatus: 'pending'
  },
  {
    id: 'CUST-100003',
    name: 'XYZ Shopping Mall',
    email: 'admin@xyz-mall.com',
    phone: '+91 9876543212',
    planType: 'Enterprise',
    speed: '200 Mbps',
    status: 'active',
    location: 'Kozhikode',
    joinDate: '2023-11-10',
    billAmount: 9999,
    dataUsage: 2100,
    paymentStatus: 'paid'
  },
  {
    id: 'CUST-100004',
    name: 'Sarah Johnson',
    email: 'sarah.j@email.com',
    phone: '+91 9876543213',
    planType: 'Home',
    speed: '50 Mbps',
    status: 'suspended',
    location: 'Kochi',
    joinDate: '2024-03-05',
    billAmount: 799,
    dataUsage: 0,
    paymentStatus: 'overdue'
  },
]

export default function SubscribersPage() {
  const [subscribers] = useState<Subscriber[]>(mockSubscribers)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)

  const filteredSubscribers = subscribers.filter(subscriber => {
    const matchesSearch = subscriber.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subscriber.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subscriber.id.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = selectedFilter === 'all' || subscriber.status === selectedFilter
    
    return matchesSearch && matchesFilter
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle className="h-3 w-3 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">Active</span>
          </div>
        )
      case 'inactive':
        return (
          <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-gray-500/10 border border-gray-500/20">
            <XCircle className="h-3 w-3 text-gray-400" />
            <span className="text-xs font-medium text-gray-400">Inactive</span>
          </div>
        )
      case 'suspended':
        return (
          <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20">
            <AlertCircle className="h-3 w-3 text-red-400" />
            <span className="text-xs font-medium text-red-400">Suspended</span>
          </div>
        )
      default:
        return null
    }
  }

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <span className="text-xs font-medium text-emerald-400">Paid</span>
      case 'pending':
        return <span className="text-xs font-medium text-[#fff685]">Pending</span>
      case 'overdue':
        return <span className="text-xs font-medium text-[#ff1d58]">Overdue</span>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
            Subscribers
          </h1>
          <p className="text-white/60 mt-1">Manage your broadband and cable TV subscribers</p>
        </div>
        
        <button
          onClick={() => setShowAddModal(true)}
          className="mt-4 sm:mt-0 flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] text-white rounded-lg font-medium hover:shadow-lg hover:shadow-[#00DDFF]/30 transition-all duration-300"
        >
          <Plus className="h-5 w-5" />
          <span>Add Subscriber</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF] to-[#0049B7] rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Total Subscribers</p>
                <p className="text-2xl font-bold text-white mt-1">45,832</p>
              </div>
              <div className="p-2 bg-gradient-to-br from-[#00DDFF] to-[#0049B7] rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Active</p>
                <p className="text-2xl font-bold text-white mt-1">42,156</p>
              </div>
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#fff685] to-[#00DDFF] rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">New This Month</p>
                <p className="text-2xl font-bold text-white mt-1">1,245</p>
              </div>
              <div className="p-2 bg-gradient-to-br from-[#fff685] to-[#00DDFF] rounded-lg">
                <TrendingUp className="h-6 w-6 text-[#0049B7]" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#ff1d58] to-[#f75990] rounded-xl blur opacity-0 group-hover:opacity-30 transition-opacity duration-300" />
          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Churn Rate</p>
                <p className="text-2xl font-bold text-white mt-1">2.3%</p>
              </div>
              <div className="p-2 bg-gradient-to-br from-[#ff1d58] to-[#f75990] rounded-lg">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedFilter === 'all'
                ? 'bg-gradient-to-r from-[#00DDFF] to-[#0049B7] text-white shadow-lg shadow-[#00DDFF]/30'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedFilter === 'active'
                ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/30'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setSelectedFilter('suspended')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedFilter === 'suspended'
                ? 'bg-gradient-to-r from-[#ff1d58] to-[#f75990] text-white shadow-lg shadow-[#ff1d58]/30'
                : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
            }`}
          >
            Suspended
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
            <input
              type="text"
              placeholder="Search subscribers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:border-[#00DDFF]/50 focus:bg-white/10 transition-all duration-200"
            />
          </div>
          <button className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-all duration-200">
            <Filter className="h-5 w-5" />
          </button>
          <button className="p-2 bg-white/5 border border-white/10 rounded-lg text-white/60 hover:bg-white/10 hover:text-white transition-all duration-200">
            <Download className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="relative overflow-hidden">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00DDFF]/20 to-[#0049B7]/20 rounded-2xl blur" />
        <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="text-left px-6 py-4 text-xs font-medium text-white/60 uppercase tracking-wider">
                    Subscriber ID
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-white/60 uppercase tracking-wider">
                    Customer Info
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-white/60 uppercase tracking-wider">
                    Plan Details
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-white/60 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-white/60 uppercase tracking-wider">
                    Usage
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-white/60 uppercase tracking-wider">
                    Billing
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-medium text-white/60 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredSubscribers.map((subscriber) => (
                  <tr 
                    key={subscriber.id} 
                    className="hover:bg-white/5 transition-colors duration-200"
                  >
                    <td className="px-6 py-4">
                      <span className="text-sm font-medium text-[#00DDFF]">{subscriber.id}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-white">{subscriber.name}</p>
                        <div className="flex items-center space-x-3 text-xs text-white/60">
                          <div className="flex items-center space-x-1">
                            <Mail className="h-3 w-3" />
                            <span>{subscriber.email}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Phone className="h-3 w-3" />
                            <span>{subscriber.phone}</span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-white/60">
                          <MapPin className="h-3 w-3" />
                          <span>{subscriber.location}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <Wifi className="h-4 w-4 text-[#00DDFF]" />
                          <span className="text-sm font-medium text-white">{subscriber.planType}</span>
                        </div>
                        <p className="text-xs text-white/60">{subscriber.speed}</p>
                        <div className="flex items-center space-x-1 text-xs text-white/60">
                          <Calendar className="h-3 w-3" />
                          <span>Since {subscriber.joinDate}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(subscriber.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-white">{subscriber.dataUsage} GB</p>
                        <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-[#00DDFF] to-[#fff685] rounded-full"
                            style={{ width: `${(subscriber.dataUsage / 1000) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-white">₹{subscriber.billAmount}</p>
                        <div className="flex items-center space-x-1">
                          <CreditCard className="h-3 w-3 text-white/60" />
                          {getPaymentBadge(subscriber.paymentStatus)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-1 hover:bg-white/10 rounded-lg transition-colors duration-200">
                        <MoreVertical className="h-4 w-4 text-white/60" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}