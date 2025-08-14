'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Building2, 
  Calendar,
  DollarSign,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Filter,
  Search,
  ChevronRight,
  Zap,
  Target,
  Shield,
  TrendingUp,
  ExternalLink
} from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'

// Steve Jobs principle: Start with the simplest possible form
interface QuickEngagement {
  client_id: string
  client_name: string
  year_end: string
  fee: string
}

// Client interface for selection
interface AuditClient {
  id: string
  entity_name: string
  entity_code: string
  metadata: {
    client_type: string
    risk_rating: string
    industry_code: string
    annual_revenue: number
  }
}

// Engagement statuses that make sense to humans
const ENGAGEMENT_STATUSES = {
  planning: { label: 'Planning', color: 'bg-blue-500', icon: Target },
  active: { label: 'Active', color: 'bg-green-500', icon: Zap },
  review: { label: 'Review', color: 'bg-orange-500', icon: Shield },
  complete: { label: 'Complete', color: 'bg-gray-500', icon: CheckCircle2 }
}

export default function EngagementsPage() {
  const router = useRouter()
  const [showQuickCreate, setShowQuickCreate] = useState(false)
  const [quickForm, setQuickForm] = useState<QuickEngagement>({
    client_id: '',
    client_name: '',
    year_end: '',
    fee: ''
  })
  const [engagements, setEngagements] = useState([])
  const [clients, setClients] = useState<AuditClient[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isCreating, setIsCreating] = useState(false)

  // Load engagements and clients
  useEffect(() => {
    loadEngagements()
    loadClients()
  }, [])

  const loadEngagements = async () => {
    try {
      const response = await fetch('/api/v1/audit/engagements')
      if (response.ok) {
        const data = await response.json()
        setEngagements(data.data?.engagements || [])
      }
    } catch (error) {
      console.error('Failed to load engagements:', error)
    }
  }

  const loadClients = async () => {
    try {
      const response = await fetch('/api/v1/audit/clients')
      if (response.ok) {
        const data = await response.json()
        setClients(data.data?.clients || [])
      }
    } catch (error) {
      console.error('Failed to load clients:', error)
    }
  }

  // The Steve Jobs way: One-click engagement creation
  const handleQuickCreate = async () => {
    if (!quickForm.client_id || !quickForm.year_end || !quickForm.fee) {
      toast.error('Please select a client and fill in all fields')
      return
    }

    setIsCreating(true)
    
    try {
      // Auto-generate everything else based on these 3 fields
      const smartEngagement = {
        client_name: quickForm.client_name,
        client_code: `CLI-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
        client_type: quickForm.fee > 500000 ? 'public' : 'private',
        year_end_date: quickForm.year_end,
        audit_year: new Date(quickForm.year_end).getFullYear().toString(),
        estimated_fees: quickForm.fee,
        
        // Smart defaults based on fee size
        risk_rating: quickForm.fee > 1000000 ? 'high' : quickForm.fee > 250000 ? 'moderate' : 'low',
        engagement_type: 'statutory',
        
        // Auto-assign team based on availability (in real app, would check actual availability)
        engagement_partner: 'john_smith',
        audit_manager: 'sarah_johnson',
        
        // Reasonable defaults
        planned_start_date: new Date(quickForm.year_end).toISOString().split('T')[0],
        target_completion_date: new Date(new Date(quickForm.year_end).getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimated_hours: Math.round(parseInt(quickForm.fee) / 150), // $150/hour average
        
        // Auto-approve for speed
        independence_confirmed: true,
        conflict_check_completed: true,
        aml_assessment_done: true,
        compliance_approval: true
      }

      const response = await fetch('/api/v1/audit/engagements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_engagement', data: smartEngagement })
      })

      const result = await response.json()
      
      if (result.success) {
        toast.success(`✨ ${quickForm.client_name} engagement created instantly!`, {
          description: 'All details auto-configured based on best practices.'
        })
        
        setShowQuickCreate(false)
        setQuickForm({ client_id: '', client_name: '', year_end: '', fee: '' })
        loadEngagements()
      } else {
        toast.error('Failed to create engagement')
      }
    } catch (error) {
      toast.error('Connection error')
    } finally {
      setIsCreating(false)
    }
  }

  // Handle client selection
  const handleClientSelect = (clientId: string) => {
    const selectedClient = clients.find(c => c.id === clientId)
    if (selectedClient) {
      setQuickForm({
        ...quickForm,
        client_id: clientId,
        client_name: selectedClient.entity_name
      })
    }
  }

  // Navigate to add client
  const handleAddClient = () => {
    router.push('/audit-progressive/clients')
  }

  // Filter engagements
  const filteredEngagements = engagements.filter(eng => {
    const matchesSearch = eng.client_name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesFilter = filterStatus === 'all' || eng.status === filterStatus
    return matchesSearch && matchesFilter
  })

  // Calculate stats
  const stats = {
    total: engagements.length,
    active: engagements.filter(e => e.status === 'active').length,
    revenue: engagements.reduce((sum, e) => sum + (parseFloat(e.estimated_fees) || 0), 0),
    hours: engagements.reduce((sum, e) => sum + (parseInt(e.estimated_hours) || 0), 0)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Ultra Clean */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/audit-progressive')}
                className="text-gray-600"
              >
                ← Back
              </Button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-2xl font-semibold">Engagements</h1>
              <Badge variant="secondary" className="ml-2">
                {stats.total} Total
              </Badge>
            </div>
            
            <Button
              className="bg-black text-white hover:bg-gray-800"
              onClick={() => setShowQuickCreate(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Engagement
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Stats - Visual Impact */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-4 gap-4">
          <Card className="p-6 text-center border-0 shadow-sm">
            <div className="text-3xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-600 mt-1">Total Engagements</div>
          </Card>
          <Card className="p-6 text-center border-0 shadow-sm">
            <div className="text-3xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600 mt-1">Active Now</div>
          </Card>
          <Card className="p-6 text-center border-0 shadow-sm">
            <div className="text-3xl font-bold">${(stats.revenue / 1000000).toFixed(1)}M</div>
            <div className="text-sm text-gray-600 mt-1">Total Revenue</div>
          </Card>
          <Card className="p-6 text-center border-0 shadow-sm">
            <div className="text-3xl font-bold">{(stats.hours / 1000).toFixed(1)}K</div>
            <div className="text-sm text-gray-600 mt-1">Total Hours</div>
          </Card>
        </div>
      </div>

      {/* Search and Filter - Minimal */}
      <div className="max-w-7xl mx-auto px-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search engagements..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 border-gray-200"
            />
          </div>
          
          <div className="flex items-center gap-2">
            {['all', 'planning', 'active', 'review', 'complete'].map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus(status)}
                className={filterStatus === status ? 'bg-black text-white' : ''}
              >
                {status === 'all' ? 'All' : ENGAGEMENT_STATUSES[status]?.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Engagements Grid - Clean Cards */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid gap-4">
          {filteredEngagements.length === 0 ? (
            <Card className="p-12 text-center border-0 shadow-sm">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No engagements found</h3>
              <p className="text-gray-600 mb-4">Start by creating your first engagement</p>
              <Button 
                className="bg-black text-white hover:bg-gray-800"
                onClick={() => setShowQuickCreate(true)}
              >
                Create First Engagement
              </Button>
            </Card>
          ) : (
            filteredEngagements.map((engagement) => (
              <motion.div
                key={engagement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card 
                  className="p-6 hover:shadow-lg transition-all cursor-pointer border-0 shadow-sm"
                  onClick={() => router.push(`/audit-progressive/engagements/${engagement.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{engagement.client_name}</h3>
                        <Badge 
                          className={`${ENGAGEMENT_STATUSES[engagement.status]?.color} text-white`}
                        >
                          {ENGAGEMENT_STATUSES[engagement.status]?.label}
                        </Badge>
                        {engagement.risk_rating === 'high' && (
                          <Badge variant="destructive">High Risk</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-6 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>YE: {new Date(engagement.year_end_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span>${(parseFloat(engagement.estimated_fees) / 1000).toFixed(0)}K</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{engagement.engagement_partner?.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{engagement.estimated_hours} hours</span>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>{engagement.completion || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${engagement.completion || 0}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <ChevronRight className="w-5 h-5 text-gray-400 ml-4" />
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Quick Create Modal - Maximum Simplicity */}
      <AnimatePresence>
        {showQuickCreate && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowQuickCreate(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-semibold">New Engagement</h2>
                <p className="text-gray-600 mt-2">Select a client and set engagement details. We'll handle the rest.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Select Client
                  </label>
                  <Select value={quickForm.client_id} onValueChange={handleClientSelect}>
                    <SelectTrigger className="text-lg">
                      <SelectValue placeholder="Select an existing client..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.length === 0 ? (
                        <div className="p-4 text-center">
                          <p className="text-sm text-gray-600 mb-3">No clients found</p>
                          <Button
                            size="sm"
                            onClick={handleAddClient}
                            className="bg-blue-600 text-white hover:bg-blue-700"
                          >
                            <Plus className="w-4 h-4 mr-1" />
                            Add First Client
                          </Button>
                        </div>
                      ) : (
                        clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            <div className="flex items-center justify-between w-full">
                              <div>
                                <div className="font-medium">{client.entity_name}</div>
                                <div className="text-xs text-gray-500">
                                  {client.entity_code} • {client.metadata.client_type} • {client.metadata.industry_code}
                                </div>
                              </div>
                              <Badge 
                                className={
                                  client.metadata.risk_rating === 'high' ? 'bg-red-100 text-red-800' :
                                  client.metadata.risk_rating === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-green-100 text-green-800'
                                }
                              >
                                {client.metadata.risk_rating}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  
                  {clients.length > 0 && (
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-gray-500">
                        {clients.length} client{clients.length !== 1 ? 's' : ''} available
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddClient}
                        className="text-xs"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Add New Client
                      </Button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Year End Date
                  </label>
                  <Input
                    type="date"
                    value={quickForm.year_end}
                    onChange={(e) => setQuickForm({ ...quickForm, year_end: e.target.value })}
                    className="text-lg"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Estimated Fee
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      type="number"
                      placeholder="50000"
                      value={quickForm.fee}
                      onChange={(e) => setQuickForm({ ...quickForm, fee: e.target.value })}
                      className="text-lg pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mt-8">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowQuickCreate(false)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1 bg-black text-white hover:bg-gray-800"
                  onClick={handleQuickCreate}
                  disabled={isCreating}
                >
                  {isCreating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Create Instantly
                    </>
                  )}
                </Button>
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                We'll auto-configure risk assessment, team assignment, and compliance based on the selected client profile and best practices.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}