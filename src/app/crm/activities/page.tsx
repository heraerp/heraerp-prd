'use client'

import React, { useState, useEffect } from 'react'
import { MobilePageLayout } from '@/components/mobile/MobilePageLayout'
import { MobileFilters, type FilterField } from '@/components/mobile/MobileFilters'
import { MobileDataTable, type TableColumn, type TableRecord } from '@/components/mobile/MobileDataTable'
import { MobileCard } from '@/components/mobile/MobileCard'
import { MobileChart } from '@/components/mobile/MobileCharts'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { 
  Activity, 
  CheckSquare, 
  Clock, 
  Plus, 
  Phone, 
  Mail,
  MessageCircle,
  Calendar,
  User,
  Building2,
  Target,
  AlertCircle,
  TrendingUp,
  Users,
  FileText
} from 'lucide-react'

interface ActivityRecord extends TableRecord {
  id: string
  title: string
  type: 'Call' | 'Email' | 'Meeting' | 'Task' | 'Note'
  description: string
  status: 'Completed' | 'Pending' | 'Overdue' | 'In Progress'
  priority: 'High' | 'Medium' | 'Low'
  assignee: string
  account?: string
  contact?: string
  dueDate: string
  createdDate: string
  completedDate?: string
  duration?: number
  outcome?: string
  nextAction?: string
}

export default function ActivitiesPage() {
  const { currentOrganization, isAuthenticated } = useHERAAuth()
  const [loading, setLoading] = useState(false)
  const [activities, setActivities] = useState<ActivityRecord[]>([])
  const [selectedActivities, setSelectedActivities] = useState<(string | number)[]>([])
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    assignee: '',
    priority: '',
    dateRange: '',
    search: ''
  })

  // Sample activities data
  const sampleActivities: ActivityRecord[] = [
    {
      id: 'ACT-001',
      title: 'Follow-up call with Acme Corp',
      type: 'Call',
      description: 'Discuss proposal feedback and next steps for enterprise license',
      status: 'Pending',
      priority: 'High',
      assignee: 'Sarah Wilson',
      account: 'Acme Corporation',
      contact: 'John Smith',
      dueDate: '2024-01-21',
      createdDate: '2024-01-20',
      duration: 30,
      nextAction: 'Send revised proposal'
    },
    {
      id: 'ACT-002',
      title: 'Product demo for Healthcare Solutions',
      type: 'Meeting',
      description: 'Demonstrate ERP capabilities for healthcare industry requirements',
      status: 'Completed',
      priority: 'High',
      assignee: 'Mike Johnson',
      account: 'Healthcare Solutions LLC',
      contact: 'David Chen',
      dueDate: '2024-01-19',
      createdDate: '2024-01-18',
      completedDate: '2024-01-19',
      duration: 60,
      outcome: 'Positive feedback, requested technical documentation',
      nextAction: 'Send technical specs'
    },
    {
      id: 'ACT-003',
      title: 'Send pricing proposal to Global Manufacturing',
      type: 'Email',
      description: 'Email customized pricing for manufacturing equipment integration',
      status: 'In Progress',
      priority: 'Medium',
      assignee: 'Alex Chen',
      account: 'Global Manufacturing Inc',
      contact: 'Maria Rodriguez',
      dueDate: '2024-01-20',
      createdDate: '2024-01-19'
    },
    {
      id: 'ACT-004',
      title: 'Quarterly business review preparation',
      type: 'Task',
      description: 'Prepare slides and reports for Q1 review with Retail Chain Co',
      status: 'Overdue',
      priority: 'High',
      assignee: 'Sarah Wilson',
      account: 'Retail Chain Co',
      contact: 'Lisa Park',
      dueDate: '2024-01-18',
      createdDate: '2024-01-15'
    },
    {
      id: 'ACT-005',
      title: 'Market research for TechStartup proposal',
      type: 'Task',
      description: 'Research competitive landscape for cloud infrastructure proposal',
      status: 'Completed',
      priority: 'Low',
      assignee: 'Mike Johnson',
      account: 'TechStartup Inc',
      contact: 'Robert Johnson',
      dueDate: '2024-01-17',
      createdDate: '2024-01-15',
      completedDate: '2024-01-16',
      outcome: 'Identified 3 key differentiators'
    },
    {
      id: 'ACT-006',
      title: 'Contract negotiation meeting notes',
      type: 'Note',
      description: 'Document key points from contract discussion with Acme legal team',
      status: 'Completed',
      priority: 'Medium',
      assignee: 'Alex Chen',
      account: 'Acme Corporation',
      contact: 'John Smith',
      dueDate: '2024-01-19',
      createdDate: '2024-01-19',
      completedDate: '2024-01-19',
      outcome: 'All terms agreed, awaiting final signature'
    }
  ]

  // Filter fields
  const filterFields: FilterField[] = [
    {
      key: 'type',
      label: 'Activity Type',
      type: 'select',
      placeholder: 'All Types',
      options: [
        { value: 'call', label: 'Call' },
        { value: 'email', label: 'Email' },
        { value: 'meeting', label: 'Meeting' },
        { value: 'task', label: 'Task' },
        { value: 'note', label: 'Note' }
      ],
      value: filters.type,
      onChange: (value) => setFilters(prev => ({ ...prev, type: value }))
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      placeholder: 'All Status',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
        { value: 'overdue', label: 'Overdue' }
      ],
      value: filters.status,
      onChange: (value) => setFilters(prev => ({ ...prev, status: value }))
    },
    {
      key: 'assignee',
      label: 'Assignee',
      type: 'select',
      placeholder: 'All Assignees',
      options: [
        { value: 'sarah', label: 'Sarah Wilson' },
        { value: 'mike', label: 'Mike Johnson' },
        { value: 'alex', label: 'Alex Chen' }
      ],
      value: filters.assignee,
      onChange: (value) => setFilters(prev => ({ ...prev, assignee: value }))
    },
    {
      key: 'priority',
      label: 'Priority',
      type: 'select',
      placeholder: 'All Priorities',
      options: [
        { value: 'high', label: 'High Priority' },
        { value: 'medium', label: 'Medium Priority' },
        { value: 'low', label: 'Low Priority' }
      ],
      value: filters.priority,
      onChange: (value) => setFilters(prev => ({ ...prev, priority: value }))
    },
    {
      key: 'search',
      label: 'Search',
      type: 'search',
      placeholder: 'Search activities...',
      value: filters.search,
      onChange: (value) => setFilters(prev => ({ ...prev, search: value }))
    }
  ]

  // Table columns
  const columns: TableColumn[] = [
    {
      key: 'title',
      label: 'Activity',
      render: (value, record) => (
        <div>
          <div className="flex items-center gap-2">
            {record.type === 'Call' && <Phone className="w-4 h-4 text-blue-500" />}
            {record.type === 'Email' && <Mail className="w-4 h-4 text-green-500" />}
            {record.type === 'Meeting' && <Users className="w-4 h-4 text-purple-500" />}
            {record.type === 'Task' && <CheckSquare className="w-4 h-4 text-orange-500" />}
            {record.type === 'Note' && <FileText className="w-4 h-4 text-gray-500" />}
            <span className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
              {value}
            </span>
          </div>
          <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
            {record.account && (
              <>
                <Building2 className="w-3 h-3" />
                {record.account}
                {record.contact && ` • ${record.contact}`}
              </>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      render: (value) => (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Completed' ? 'bg-green-100 text-green-800' :
          value === 'In Progress' ? 'bg-blue-100 text-blue-800' :
          value === 'Overdue' ? 'bg-red-100 text-red-800' :
          'bg-yellow-100 text-yellow-800'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'priority',
      label: 'Priority',
      align: 'center',
      render: (value) => (
        <div className="flex items-center justify-center gap-1">
          <div className={`w-2 h-2 rounded-full ${
            value === 'High' ? 'bg-red-500' :
            value === 'Medium' ? 'bg-yellow-500' :
            'bg-green-500'
          }`} />
          <span className="text-sm">{value}</span>
        </div>
      )
    },
    {
      key: 'assignee',
      label: 'Assignee',
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center text-xs text-white font-medium">
            {value.split(' ').map((n: string) => n[0]).join('')}
          </div>
          <span className="text-sm">{value}</span>
        </div>
      )
    },
    {
      key: 'dueDate',
      label: 'Due Date',
      render: (value, record) => {
        const isOverdue = new Date(value) < new Date() && record.status !== 'Completed'
        return (
          <div className={`flex items-center gap-1 text-sm ${
            isOverdue ? 'text-red-600' : 'text-gray-600'
          }`}>
            <Calendar className="w-3 h-3" />
            {new Date(value).toLocaleDateString()}
            {isOverdue && <AlertCircle className="w-3 h-3 text-red-500" />}
          </div>
        )
      }
    }
  ]

  // Mobile card renderer
  const mobileCardRender = (record: ActivityRecord) => {
    const isOverdue = new Date(record.dueDate) < new Date() && record.status !== 'Completed'
    
    return (
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {record.type === 'Call' && <Phone className="w-4 h-4 text-blue-500" />}
              {record.type === 'Email' && <Mail className="w-4 h-4 text-green-500" />}
              {record.type === 'Meeting' && <Users className="w-4 h-4 text-purple-500" />}
              {record.type === 'Task' && <CheckSquare className="w-4 h-4 text-orange-500" />}
              {record.type === 'Note' && <FileText className="w-4 h-4 text-gray-500" />}
              <h3 className="font-medium text-blue-600 cursor-pointer hover:text-blue-800">
                {record.title}
              </h3>
            </div>
            <p className="text-sm text-gray-600 line-clamp-2">{record.description}</p>
            {record.account && (
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                <Building2 className="w-3 h-3" />
                {record.account}
                {record.contact && ` • ${record.contact}`}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              record.status === 'Completed' ? 'bg-green-100 text-green-800' :
              record.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
              record.status === 'Overdue' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {record.status}
            </span>
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${
                record.priority === 'High' ? 'bg-red-500' :
                record.priority === 'Medium' ? 'bg-yellow-500' :
                'bg-green-500'
              }`} />
              <span className="text-xs font-medium">{record.priority}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Assignee</div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-xs text-white font-medium">
                {record.assignee.split(' ').map(n => n[0]).join('')}
              </div>
              {record.assignee}
            </div>
          </div>
          <div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Due Date</div>
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
              <Calendar className="w-3 h-3" />
              <span className="font-medium">{new Date(record.dueDate).toLocaleDateString()}</span>
              {isOverdue && <AlertCircle className="w-3 h-3 text-red-500" />}
            </div>
          </div>
        </div>

        {record.outcome && (
          <div className="text-sm">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Outcome</div>
            <div className="text-gray-700">{record.outcome}</div>
          </div>
        )}

        {record.nextAction && (
          <div className="text-sm">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Next Action</div>
            <div className="text-blue-600 font-medium">{record.nextAction}</div>
          </div>
        )}

        <div className="flex gap-2 pt-2 border-t border-gray-100">
          <button className="flex-1 text-sm text-blue-600 hover:text-blue-800 py-2 px-3 border border-blue-200 rounded hover:bg-blue-50 transition-colors flex items-center justify-center gap-1">
            <Activity className="w-4 h-4" />
            View
          </button>
          {record.status !== 'Completed' && (
            <button className="flex-1 text-sm text-green-600 hover:text-green-800 py-2 px-3 border border-green-200 rounded hover:bg-green-50 transition-colors flex items-center justify-center gap-1">
              <CheckSquare className="w-4 h-4" />
              Complete
            </button>
          )}
        </div>
      </div>
    )
  }

  // KPI data
  const kpiData = {
    totalActivities: sampleActivities.length,
    overdueTasks: sampleActivities.filter(a => new Date(a.dueDate) < new Date() && a.status !== 'Completed').length,
    completedToday: sampleActivities.filter(a => a.completedDate === '2024-01-20').length,
    avgResponseTime: 4.2 // hours
  }

  // Chart data
  const activityTypeData = [
    { name: 'Calls', value: 35, color: '#3b82f6' },
    { name: 'Emails', value: 40, color: '#10b981' },
    { name: 'Meetings', value: 15, color: '#8b5cf6' },
    { name: 'Tasks', value: 8, color: '#f59e0b' },
    { name: 'Notes', value: 2, color: '#6b7280' }
  ]

  const weeklyActivityData = [
    { day: 'Mon', calls: 8, emails: 12, meetings: 3 },
    { day: 'Tue', calls: 10, emails: 15, meetings: 2 },
    { day: 'Wed', calls: 6, emails: 18, meetings: 4 },
    { day: 'Thu', calls: 12, emails: 14, meetings: 5 },
    { day: 'Fri', calls: 9, emails: 16, meetings: 1 }
  ]

  // Group activities by date for timeline view
  const groupedActivities = sampleActivities.reduce((acc, activity) => {
    const date = activity.dueDate
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(activity)
    return acc
  }, {} as Record<string, ActivityRecord[]>)

  const sortedDates = Object.keys(groupedActivities).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  useEffect(() => {
    if (isAuthenticated && currentOrganization) {
      setActivities(sampleActivities)
    }
  }, [isAuthenticated, currentOrganization])

  const handleApplyFilters = () => {
    setLoading(true)
    setTimeout(() => {
      setActivities(sampleActivities)
      setLoading(false)
    }, 1000)
  }

  return (
    <MobilePageLayout title="HERA" breadcrumb="CRM / Activities & Tasks">
      <MobileFilters 
        title="Activity Filters"
        fields={filterFields}
        onApply={handleApplyFilters}
        onAdaptFilters={() => console.log('Adapt filters')}
      />

      <div className="px-3 sm:px-6 py-4 sm:py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MobileCard 
            title="Total Activities"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{kpiData.totalActivities}</div>
                <div className="text-sm text-gray-600">All activities</div>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </MobileCard>

          <MobileCard 
            title="Overdue Tasks"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-red-600">{kpiData.overdueTasks}</div>
                <div className="text-sm text-gray-600">Need attention</div>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </MobileCard>

          <MobileCard 
            title="Completed Today"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-green-600">{kpiData.completedToday}</div>
                <div className="text-sm text-gray-600">Today's progress</div>
              </div>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckSquare className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </MobileCard>

          <MobileCard 
            title="Avg Response Time"
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold text-gray-900">{kpiData.avgResponseTime}h</div>
                <div className="text-sm text-gray-600">Response time</div>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </MobileCard>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MobileChart 
            title="Activities by Type"
            type="pie"
            data={activityTypeData}
            height="300"
          />
          <MobileChart 
            title="Weekly Activity Breakdown"
            type="bar"
            data={weeklyActivityData}
            height="300"
          />
        </div>

        {/* Activity Timeline */}
        <MobileCard 
          title="Activity Timeline"
          className="bg-white rounded-lg shadow-sm border border-gray-200"
        >
          <div className="p-4 space-y-4">
            {sortedDates.slice(0, 3).map((date) => (
              <div key={date}>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <h3 className="font-medium text-gray-900">
                    {new Date(date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h3>
                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                    {groupedActivities[date].length} activities
                  </span>
                </div>
                <div className="space-y-2 ml-6 border-l-2 border-gray-200 pl-4">
                  {groupedActivities[date].map((activity) => (
                    <div key={activity.id} className="flex items-start gap-3 py-2">
                      <div className="flex-shrink-0 mt-1">
                        {activity.type === 'Call' && <Phone className="w-4 h-4 text-blue-500" />}
                        {activity.type === 'Email' && <Mail className="w-4 h-4 text-green-500" />}
                        {activity.type === 'Meeting' && <Users className="w-4 h-4 text-purple-500" />}
                        {activity.type === 'Task' && <CheckSquare className="w-4 h-4 text-orange-500" />}
                        {activity.type === 'Note' && <FileText className="w-4 h-4 text-gray-500" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                            <p className="text-xs text-gray-500">{activity.assignee}</p>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            activity.status === 'Completed' ? 'bg-green-100 text-green-700' :
                            activity.status === 'Overdue' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {activity.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </MobileCard>

        {/* Activities Table */}
        <MobileDataTable
          title={`Activities (${activities.length})`}
          subtitle="Track and manage all customer interactions and tasks"
          columns={columns}
          data={activities}
          loading={loading}
          selectable={true}
          selectedRows={selectedActivities}
          onRowSelect={setSelectedActivities}
          mobileCardRender={mobileCardRender}
          actions={
            <div className="flex gap-2">
              <button className="text-sm text-blue-600 hover:text-blue-800 px-3 py-2 border border-blue-200 rounded hover:bg-blue-50 transition-colors">
                Export
              </button>
              <button className="text-sm text-green-600 hover:text-green-800 px-3 py-2 border border-green-200 rounded hover:bg-green-50 transition-colors">
                Bulk Complete
              </button>
            </div>
          }
        />
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-6 right-6">
        <button className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center min-w-[56px] min-h-[56px]">
          <Plus className="w-6 h-6" />
        </button>
      </div>
    </MobilePageLayout>
  )
}