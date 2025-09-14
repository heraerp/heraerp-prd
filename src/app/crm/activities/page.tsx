'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { 
  Calendar,
  Plus,
  Search,
  Filter,
  Phone,
  Mail,
  MessageSquare,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Building2,
  User,
  FileText,
  Link2,
  Activity,
  Target,
  TrendingUp,
  Briefcase
} from 'lucide-react'

// India Vision Organization ID
const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001'

interface ActivityTransaction {
  id: string
  transaction_type: string
  transaction_code: string
  source_entity_id?: string
  target_entity_id?: string
  business_context?: {
    activity_type?: string
    title?: string
    duration_minutes?: number
    outcome?: string
    next_action?: string
    subject?: string
    attachments?: string[]
    scheduled_date?: string
    location?: string
    attendees?: string[]
  }
  created_at: string
  updated_at: string
}

interface RelatedEntity {
  id: string
  entity_name: string
  entity_type: string
}

export default function ActivitiesPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedDateRange, setSelectedDateRange] = useState('all')
  const [isCreating, setIsCreating] = useState(false)
  const [activities, setActivities] = useState<ActivityTransaction[]>([])
  const [relatedEntities, setRelatedEntities] = useState<Record<string, RelatedEntity>>({})
  const [isLoading, setIsLoading] = useState(true)
  
  const supabase = createClientComponentClient()

  useEffect(() => {
    loadActivities()
  }, [])

  const loadActivities = async () => {
    try {
      // Load CRM activities
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('universal_transactions')
        .select('*')
        .eq('organization_id', KERALA_VISION_ORG_ID)
        .eq('transaction_type', 'crm_activity')
        .order('created_at', { ascending: false })

      if (activitiesError) throw activitiesError

      // Get all entity IDs to load
      const entityIds = new Set<string>()
      activitiesData?.forEach(activity => {
        if (activity.source_entity_id) entityIds.add(activity.source_entity_id)
        if (activity.target_entity_id) entityIds.add(activity.target_entity_id)
      })

      // Load related entities
      const { data: entitiesData, error: entitiesError } = await supabase
        .from('core_entities')
        .select('id, entity_name, entity_type')
        .in('id', Array.from(entityIds))

      if (entitiesError) throw entitiesError

      // Build entity lookup
      const entityLookup: Record<string, RelatedEntity> = {}
      entitiesData?.forEach(entity => {
        entityLookup[entity.id] = entity
      })

      setActivities(activitiesData || [])
      setRelatedEntities(entityLookup)
    } catch (error) {
      console.error('Error loading activities:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'call': return Phone
      case 'email': return Mail
      case 'meeting': return Users
      case 'task': return CheckCircle
      case 'note': return FileText
      default: return Activity
    }
  }

  const getActivityColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'call': return 'from-[#FF5A09] to-[#ec7f37]'
      case 'email': return 'from-[#ec7f37] to-[#be4f0c]'
      case 'meeting': return 'from-purple-500 to-purple-600'
      case 'task': return 'from-emerald-500 to-green-600'
      case 'note': return 'from-blue-500 to-blue-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const getStatusFromContext = (activity: ActivityTransaction) => {
    if (activity.business_context?.scheduled_date) {
      const scheduled = new Date(activity.business_context.scheduled_date)
      return scheduled > new Date() ? 'scheduled' : 'completed'
    }
    return 'completed'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'overdue': return 'bg-red-500/20 text-red-400 border-red-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.business_context?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.transaction_code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || activity.business_context?.activity_type === selectedType
    
    // Date range filtering
    let matchesDate = true
    if (selectedDateRange !== 'all') {
      const activityDate = new Date(activity.created_at)
      const now = new Date()
      switch (selectedDateRange) {
        case 'today':
          matchesDate = activityDate.toDateString() === now.toDateString()
          break
        case 'week':
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDate = activityDate >= weekAgo
          break
        case 'month':
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          matchesDate = activityDate >= monthAgo
          break
      }
    }
    
    return matchesSearch && matchesType && matchesDate
  })

  // Group activities by date
  const groupedActivities = filteredActivities.reduce((groups, activity) => {
    const date = new Date(activity.created_at).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(activity)
    return groups
  }, {} as Record<string, ActivityTransaction[]>)

  const stats = [
    { 
      label: 'Total Activities', 
      value: activities.length, 
      icon: Activity, 
      color: 'from-[#FF5A09] to-[#ec7f37]' 
    },
    { 
      label: 'Calls Today', 
      value: activities.filter(a => 
        a.business_context?.activity_type === 'call' && 
        new Date(a.created_at).toDateString() === new Date().toDateString()
      ).length, 
      icon: Phone, 
      color: 'from-[#ec7f37] to-[#be4f0c]' 
    },
    { 
      label: 'Meetings This Week', 
      value: activities.filter(a => {
        const ismeeting = a.business_context?.activity_type === 'meeting'
        const activityDate = new Date(a.created_at)
        const weekAgo = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000)
        return ismeeting && activityDate >= weekAgo
      }).length, 
      icon: Users, 
      color: 'from-purple-500 to-purple-600' 
    },
    { 
      label: 'Conversion Rate', 
      value: '24%', 
      icon: TrendingUp, 
      color: 'from-[#be4f0c] to-[#FF5A09]' 
    }
  ]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading activities...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Activities</h1>
          <p className="text-white/60 mt-1">Track all your sales activities and engagements</p>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="mt-4 sm:mt-0 flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#FF5A09] to-[#ec7f37] rounded-lg text-white font-medium hover:shadow-lg hover:shadow-[#FF5A09]/30 transition-all duration-300"
        >
          <Plus className="h-5 w-5" />
          <span>Log Activity</span>
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
                  <span className="text-xs text-emerald-400 font-medium">+5%</span>
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
            placeholder="Search activities..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white placeholder:text-white/40 focus:outline-none focus:border-[#FF5A09] transition-colors"
          />
        </div>
        
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF5A09] transition-colors"
        >
          <option value="all">All Types</option>
          <option value="call">Calls</option>
          <option value="email">Emails</option>
          <option value="meeting">Meetings</option>
          <option value="task">Tasks</option>
          <option value="note">Notes</option>
        </select>

        <select
          value={selectedDateRange}
          onChange={(e) => setSelectedDateRange(e.target.value)}
          className="px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white focus:outline-none focus:border-[#FF5A09] transition-colors"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>

        <button className="flex items-center space-x-2 px-4 py-3 bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg text-white hover:bg-white/10 transition-colors">
          <Filter className="h-5 w-5" />
          <span>More Filters</span>
        </button>
      </div>

      {/* Activities Timeline */}
      <div className="space-y-6">
        {Object.entries(groupedActivities).map(([date, dateActivities]) => (
          <div key={date}>
            <h3 className="text-sm font-medium text-white/60 mb-4">{date}</h3>
            <div className="space-y-4">
              {dateActivities.map((activity) => {
                const activityType = activity.business_context?.activity_type || 'activity'
                const ActivityIcon = getActivityIcon(activityType)
                const status = getStatusFromContext(activity)
                const sourceEntity = activity.source_entity_id ? relatedEntities[activity.source_entity_id] : null
                const targetEntity = activity.target_entity_id ? relatedEntities[activity.target_entity_id] : null
                
                return (
                  <div key={activity.id} className="relative group">
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FF5A09]/30 to-[#ec7f37]/30 rounded-xl blur opacity-0 group-hover:opacity-50 transition-opacity duration-300" />
                    <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <div className={`p-3 rounded-xl bg-gradient-to-br ${getActivityColor(activityType)}`}>
                            <ActivityIcon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-base font-semibold text-white">
                              {activity.business_context?.title || 'Activity'}
                            </h4>
                            
                            {/* Related Entities */}
                            <div className="flex items-center space-x-4 mt-2 text-sm">
                              {sourceEntity && (
                                <div className="flex items-center space-x-1 text-white/60">
                                  <User className="h-4 w-4" />
                                  <span>{sourceEntity.entity_name}</span>
                                </div>
                              )}
                              {targetEntity && (
                                <>
                                  <ChevronRight className="h-4 w-4 text-white/40" />
                                  <div className="flex items-center space-x-1 text-white/60">
                                    {targetEntity.entity_type === 'opportunity' ? (
                                      <Target className="h-4 w-4" />
                                    ) : targetEntity.entity_type === 'account' ? (
                                      <Building2 className="h-4 w-4" />
                                    ) : (
                                      <Briefcase className="h-4 w-4" />
                                    )}
                                    <span>{targetEntity.entity_name}</span>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* Activity Details */}
                            <div className="mt-3 space-y-2">
                              {activity.business_context?.outcome && (
                                <p className="text-sm text-white/80">
                                  <span className="text-white/60">Outcome:</span> {activity.business_context.outcome}
                                </p>
                              )}
                              {activity.business_context?.next_action && (
                                <p className="text-sm text-white/80">
                                  <span className="text-white/60">Next Action:</span> {activity.business_context.next_action}
                                </p>
                              )}
                              {activity.business_context?.duration_minutes && (
                                <div className="flex items-center space-x-1 text-sm text-white/60">
                                  <Clock className="h-3 w-3" />
                                  <span>{activity.business_context.duration_minutes} minutes</span>
                                </div>
                              )}
                              {activity.business_context?.attachments && activity.business_context.attachments.length > 0 && (
                                <div className="flex items-center space-x-1 text-sm text-white/60">
                                  <Link2 className="h-3 w-3" />
                                  <span>{activity.business_context.attachments.length} attachments</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                            {status}
                          </span>
                          <span className="text-xs text-white/40">
                            {new Date(activity.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredActivities.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No activities found</h3>
          <p className="text-white/60">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  )
}