'use client'

import React from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
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
import { ISPModal } from '@/components/isp/ISPModal'
import { ISPTable } from '@/components/isp/ISPTable'
import { ISPInput, ISPSelect, ISPButton } from '@/components/isp/ISPForm'

// India Vision Organization ID
const INDIA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001'

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
  }
]

export default function SubscribersPage() {
  const supabase = createClientComponentClient()
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedSubscriber, setSelectedSubscriber] = useState<Subscriber | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    planType: 'Home',
    speed: '50 Mbps',
    location: '',
    billAmount: 799,
    paymentStatus: 'paid' as const
  })

  // Fetch subscribers from Supabase
  async function fetchSubscribers() {
    try {
      setLoading(true)
      const { data: subscriberEntities, error } = await supabase
        .from('core_entities')
        .select('*')
        .eq('organization_id', INDIA_VISION_ORG_ID)
        .eq('entity_type', 'isp_subscriber')
        .order('created_at', { ascending: true })

      if (error) throw error

      if (subscriberEntities && subscriberEntities.length > 0) {
        const mappedSubscribers: Subscriber[] = subscriberEntities.map(entity => ({
          id: entity.entity_code || entity.id,
          name: entity.entity_name,
          email: entity.metadata?.email || '',
          phone: entity.metadata?.phone || '',
          planType: entity.metadata?.plan_type || 'Home',
          speed: entity.metadata?.speed || '50 Mbps',
          status: entity.metadata?.status || 'active',
          location: entity.metadata?.location || '',
          joinDate: entity.metadata?.join_date || new Date().toISOString().split('T')[0],
          billAmount: entity.metadata?.bill_amount || 799,
          dataUsage: entity.metadata?.data_usage || 0,
          paymentStatus: entity.metadata?.payment_status || 'paid'
        }))
        setSubscribers(mappedSubscribers)
      } else {
        // If no data exists, use mock data as fallback
        setSubscribers(mockSubscribers)
      }
    } catch (error) {
      console.error('Error fetching subscribers:', error)
      // Use mock data as fallback
      if (subscribers.length === 0) {
        setSubscribers(mockSubscribers)
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscribers()
  }, [])

  const filteredSubscribers = subscribers.filter(subscriber => {
    const matchesSearch =
      subscriber.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscriber.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      subscriber.id.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesFilter = selectedFilter === 'all' || subscriber.status === selectedFilter

    return matchesSearch && matchesFilter
  })

  const handleAdd = async () => {
    try {
      const subscriberCode = `CUST-${String((subscribers.length || 0) + 100001).padStart(6, '0')}`

      const { data, error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: INDIA_VISION_ORG_ID,
          entity_type: 'isp_subscriber',
          entity_name: formData.name,
          entity_code: subscriberCode,
          metadata: {
            email: formData.email,
            phone: formData.phone,
            plan_type: formData.planType,
            speed: formData.speed,
            status: 'active',
            location: formData.location,
            join_date: new Date().toISOString().split('T')[0],
            bill_amount: formData.billAmount,
            data_usage: 0,
            payment_status: formData.paymentStatus
          }
        })
        .select()
        .single()

      if (error) throw error

      if (data) {
        const newSubscriber: Subscriber = {
          id: data.entity_code || data.id,
          name: data.entity_name,
          email: data.metadata?.email || '',
          phone: data.metadata?.phone || '',
          planType: data.metadata?.plan_type || 'Home',
          speed: data.metadata?.speed || '50 Mbps',
          status: data.metadata?.status || 'active',
          location: data.metadata?.location || '',
          joinDate: data.metadata?.join_date || new Date().toISOString().split('T')[0],
          billAmount: data.metadata?.bill_amount || 799,
          dataUsage: data.metadata?.data_usage || 0,
          paymentStatus: data.metadata?.payment_status || 'paid'
        }
        setSubscribers([...subscribers, newSubscriber])
        setShowAddModal(false)
        resetForm()
        alert('Subscriber added successfully!')
      }
    } catch (error) {
      console.error('Error adding subscriber:', error)
      alert('Failed to add subscriber. Please try again.')
    }
  }

  const handleEdit = (subscriber: Subscriber) => {
    setSelectedSubscriber(subscriber)
    setFormData({
      name: subscriber.name,
      email: subscriber.email,
      phone: subscriber.phone,
      planType: subscriber.planType,
      speed: subscriber.speed,
      location: subscriber.location,
      billAmount: subscriber.billAmount,
      paymentStatus: subscriber.paymentStatus
    })
    setShowEditModal(true)
  }

  const handleUpdate = async () => {
    if (selectedSubscriber) {
      try {
        // First find the entity by code
        const { data: entity, error: findError } = await supabase
          .from('core_entities')
          .select('id')
          .eq('organization_id', INDIA_VISION_ORG_ID)
          .eq('entity_type', 'isp_subscriber')
          .eq('entity_code', selectedSubscriber.id)
          .single()

        if (findError) throw findError

        if (entity) {
          // Update the entity
          const { error: updateError } = await supabase
            .from('core_entities')
            .update({
              entity_name: formData.name,
              metadata: {
                email: formData.email,
                phone: formData.phone,
                plan_type: formData.planType,
                speed: formData.speed,
                status: selectedSubscriber.status,
                location: formData.location,
                join_date: selectedSubscriber.joinDate,
                bill_amount: formData.billAmount,
                data_usage: selectedSubscriber.dataUsage,
                payment_status: formData.paymentStatus
              }
            })
            .eq('id', entity.id)

          if (updateError) throw updateError

          // Update local state
          setSubscribers(
            subscribers.map(s => (s.id === selectedSubscriber.id ? { ...s, ...formData } : s))
          )
          setShowEditModal(false)
          setSelectedSubscriber(null)
          resetForm()
          alert('Subscriber updated successfully!')
        }
      } catch (error) {
        console.error('Error updating subscriber:', error)
        alert('Failed to update subscriber. Please try again.')
      }
    }
  }

  const handleDelete = async (subscriber: Subscriber) => {
    if (confirm(`Are you sure you want to delete subscriber ${subscriber.name}?`)) {
      try {
        // First find the entity by code
        const { data: entity, error: findError } = await supabase
          .from('core_entities')
          .select('id')
          .eq('organization_id', INDIA_VISION_ORG_ID)
          .eq('entity_type', 'isp_subscriber')
          .eq('entity_code', subscriber.id)
          .single()

        if (findError) throw findError

        if (entity) {
          // Delete the entity
          const { error: deleteError } = await supabase
            .from('core_entities')
            .delete()
            .eq('id', entity.id)

          if (deleteError) throw deleteError

          // Update local state
          setSubscribers(subscribers.filter(s => s.id !== subscriber.id))
          alert('Subscriber deleted successfully!')
        }
      } catch (error) {
        console.error('Error deleting subscriber:', error)
        alert('Failed to delete subscriber. Please try again.')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      planType: 'Home',
      speed: '50 Mbps',
      location: '',
      billAmount: 799,
      paymentStatus: 'paid'
    })
  }

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
          <div className="flex items-center space-x-1 px-3 py-1 rounded-full bg-muted/10 border border-border/20">
            <XCircle className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Inactive</span>
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
        return <span className="text-xs font-medium text-[#FFD700]">Pending</span>
      case 'overdue':
        return <span className="text-xs font-medium text-[#E91E63]">Overdue</span>
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-[#F5E6C8]">Subscribers</h1>
          <p className="text-slate-400 mt-1">Manage your broadband and cable TV subscribers</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="mt-4 sm:mt-0 flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#0099CC] to-[#0049B7] text-foreground rounded-lg font-medium hover:shadow-lg hover:shadow-[#0099CC]/40 transition-all duration-300"
        >
          <Plus className="h-5 w-5" />
          <span>Add Subscriber</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#0099CC] to-[#0049B7] rounded-xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
          <div className="relative bg-background/50 backdrop-blur-xl border border-border/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Subscribers</p>
                <p className="text-2xl font-bold text-white mt-1">45,832</p>
              </div>
              <div className="p-2 bg-gradient-to-br from-[#0099CC] to-[#0049B7] rounded-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
          <div className="relative bg-background/50 backdrop-blur-xl border border-border/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Active</p>
                <p className="text-2xl font-bold text-white mt-1">42,156</p>
              </div>
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FFD700] to-[#0099CC] rounded-xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
          <div className="relative bg-background/50 backdrop-blur-xl border border-border/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">New This Month</p>
                <p className="text-2xl font-bold text-white mt-1">1,245</p>
              </div>
              <div className="p-2 bg-gradient-to-br from-[#FFD700] to-[#0099CC] rounded-lg">
                <TrendingUp className="h-6 w-6 text-[#0049B7]" />
              </div>
            </div>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-[#E91E63] to-[#C2185B] rounded-xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-300" />
          <div className="relative bg-background/50 backdrop-blur-xl border border-border/10 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Churn Rate</p>
                <p className="text-2xl font-bold text-white mt-1">2.3%</p>
              </div>
              <div className="p-2 bg-gradient-to-br from-[#E91E63] to-[#C2185B] rounded-lg">
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
                ? 'bg-gradient-to-r from-[#0099CC] to-[#0049B7] text-white shadow-lg shadow-[#0099CC]/40'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setSelectedFilter('active')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedFilter === 'active'
                ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-lg shadow-emerald-500/40'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setSelectedFilter('suspended')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
              selectedFilter === 'suspended'
                ? 'bg-gradient-to-r from-[#E91E63] to-[#C2185B] text-white shadow-lg shadow-[#E91E63]/40'
                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white'
            }`}
          >
            Suspended
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search subscribers..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#0099CC] focus:bg-slate-800 transition-all duration-200"
            />
          </div>
          <button className="p-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-400 hover:bg-slate-700/50 hover:text-white transition-all duration-200">
            <Filter className="h-5 w-5" />
          </button>
          <button className="p-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-400 hover:bg-slate-700/50 hover:text-white transition-all duration-200">
            <Download className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Subscribers Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0099CC]"></div>
        </div>
      ) : (
        <ISPTable
          data={filteredSubscribers}
          columns={[
            {
              key: 'id',
              label: 'Subscriber ID',
              render: item => <span className="text-sm font-medium text-[#0099CC]">{item.id}</span>
            },
            {
              key: 'name',
              label: 'Customer Info',
              render: item => (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                  <div className="flex items-center space-x-3 text-xs text-foreground/60">
                    <div className="flex items-center space-x-1">
                      <Mail className="h-3 w-3" />
                      <span>{item.email}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Phone className="h-3 w-3" />
                      <span>{item.phone}</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-xs text-foreground/60">
                    <MapPin className="h-3 w-3" />
                    <span>{item.location}</span>
                  </div>
                </div>
              )
            },
            {
              key: 'planType',
              label: 'Plan Details',
              render: item => (
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <Wifi className="h-4 w-4 text-[#0099CC]" />
                    <span className="text-sm font-medium text-foreground">{item.planType}</span>
                  </div>
                  <p className="text-xs text-foreground/60">{item.speed}</p>
                  <div className="flex items-center space-x-1 text-xs text-foreground/60">
                    <Calendar className="h-3 w-3" />
                    <span>Since {item.joinDate}</span>
                  </div>
                </div>
              )
            },
            {
              key: 'status',
              label: 'Status',
              render: item => getStatusBadge(item.status)
            },
            {
              key: 'dataUsage',
              label: 'Usage',
              render: item => (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">{item.dataUsage} GB</p>
                  <div className="w-24 h-2 bg-background/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#0099CC] to-[#FFD700] rounded-full"
                      style={{ width: `${(item.dataUsage / 1000) * 100}%` }}
                    />
                  </div>
                </div>
              )
            },
            {
              key: 'billAmount',
              label: 'Billing',
              render: item => (
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">₹{item.billAmount}</p>
                  <div className="flex items-center space-x-1">
                    <CreditCard className="h-3 w-3 text-foreground/60" />
                    {getPaymentBadge(item.paymentStatus)}
                  </div>
                </div>
              )
            }
          ]}
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchPlaceholder="Search by ID, name, or email..."
        />
      )}

      {/* Add Subscriber Modal */}
      <ISPModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false)
          resetForm()
        }}
        title="Add New Subscriber"
        size="md"
      >
        <form
          onSubmit={e => {
            e.preventDefault()
            handleAdd()
          }}
          className="space-y-4"
        >
          <ISPInput
            label="Customer Name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter customer name"
            required
          />

          <ISPInput
            label="Email"
            type="email"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            placeholder="customer@example.com"
            icon={<Mail className="h-4 w-4 text-foreground/40" />}
            required
          />

          <ISPInput
            label="Phone"
            type="tel"
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+91 9876543210"
            icon={<Phone className="h-4 w-4 text-foreground/40" />}
            required
          />

          <ISPSelect
            label="Plan Type"
            value={formData.planType}
            onChange={e => setFormData({ ...formData, planType: e.target.value })}
            options={[
              { value: 'Home', label: 'Home' },
              { value: 'Business', label: 'Business' },
              { value: 'Enterprise', label: 'Enterprise' }
            ]}
          />

          <ISPSelect
            label="Speed"
            value={formData.speed}
            onChange={e => setFormData({ ...formData, speed: e.target.value })}
            options={[
              { value: '50 Mbps', label: '50 Mbps' },
              { value: '100 Mbps', label: '100 Mbps' },
              { value: '200 Mbps', label: '200 Mbps' },
              { value: '500 Mbps', label: '500 Mbps' },
              { value: '1 Gbps', label: '1 Gbps' }
            ]}
          />

          <ISPInput
            label="Location"
            value={formData.location}
            onChange={e => setFormData({ ...formData, location: e.target.value })}
            placeholder="Enter location"
            icon={<MapPin className="h-4 w-4 text-foreground/40" />}
            required
          />

          <ISPInput
            label="Monthly Bill Amount"
            type="number"
            value={formData.billAmount}
            onChange={e => setFormData({ ...formData, billAmount: parseInt(e.target.value) })}
            placeholder="Enter amount"
            icon={<CreditCard className="h-4 w-4 text-foreground/40" />}
            required
          />

          <div className="flex justify-end space-x-3 pt-4">
            <ISPButton
              type="button"
              variant="secondary"
              onClick={() => {
                setShowAddModal(false)
                resetForm()
              }}
            >
              Cancel
            </ISPButton>
            <ISPButton type="submit">Add Subscriber</ISPButton>
          </div>
        </form>
      </ISPModal>

      {/* Edit Subscriber Modal */}
      <ISPModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedSubscriber(null)
          resetForm()
        }}
        title="Edit Subscriber"
        size="md"
      >
        <form
          onSubmit={e => {
            e.preventDefault()
            handleUpdate()
          }}
          className="space-y-4"
        >
          <ISPInput
            label="Customer Name"
            value={formData.name}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter customer name"
            required
          />

          <ISPInput
            label="Email"
            type="email"
            value={formData.email}
            onChange={e => setFormData({ ...formData, email: e.target.value })}
            placeholder="customer@example.com"
            icon={<Mail className="h-4 w-4 text-foreground/40" />}
            required
          />

          <ISPInput
            label="Phone"
            type="tel"
            value={formData.phone}
            onChange={e => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+91 9876543210"
            icon={<Phone className="h-4 w-4 text-foreground/40" />}
            required
          />

          <ISPSelect
            label="Plan Type"
            value={formData.planType}
            onChange={e => setFormData({ ...formData, planType: e.target.value })}
            options={[
              { value: 'Home', label: 'Home' },
              { value: 'Business', label: 'Business' },
              { value: 'Enterprise', label: 'Enterprise' }
            ]}
          />

          <ISPSelect
            label="Speed"
            value={formData.speed}
            onChange={e => setFormData({ ...formData, speed: e.target.value })}
            options={[
              { value: '50 Mbps', label: '50 Mbps' },
              { value: '100 Mbps', label: '100 Mbps' },
              { value: '200 Mbps', label: '200 Mbps' },
              { value: '500 Mbps', label: '500 Mbps' },
              { value: '1 Gbps', label: '1 Gbps' }
            ]}
          />

          <ISPInput
            label="Location"
            value={formData.location}
            onChange={e => setFormData({ ...formData, location: e.target.value })}
            placeholder="Enter location"
            icon={<MapPin className="h-4 w-4 text-foreground/40" />}
            required
          />

          <ISPInput
            label="Monthly Bill Amount"
            type="number"
            value={formData.billAmount}
            onChange={e => setFormData({ ...formData, billAmount: parseInt(e.target.value) })}
            placeholder="Enter amount"
            icon={<CreditCard className="h-4 w-4 text-foreground/40" />}
            required
          />

          <ISPSelect
            label="Payment Status"
            value={formData.paymentStatus}
            onChange={e => setFormData({ ...formData, paymentStatus: e.target.value as any })}
            options={[
              { value: 'paid', label: 'Paid' },
              { value: 'pending', label: 'Pending' },
              { value: 'overdue', label: 'Overdue' }
            ]}
          />

          <div className="flex justify-end space-x-3 pt-4">
            <ISPButton
              type="button"
              variant="secondary"
              onClick={() => {
                setShowEditModal(false)
                setSelectedSubscriber(null)
                resetForm()
              }}
            >
              Cancel
            </ISPButton>
            <ISPButton type="submit">Update Subscriber</ISPButton>
          </div>
        </form>
      </ISPModal>
    </div>
  )
}
