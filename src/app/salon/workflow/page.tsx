'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/components/ui/use-toast'
import { 
  Users, UserCheck, Calendar, Clock, CreditCard, 
  MessageSquare, Star, TrendingUp, Award, Bell,
  CheckCircle2, ArrowRight, PhoneCall, Mail,
  Smartphone, MapPin, Gift, Heart
} from 'lucide-react'

// Workflow stages with icons and colors
const WORKFLOW_STAGES = [
  { 
    id: 'awareness', 
    name: 'Awareness', 
    icon: Users, 
    color: 'bg-blue-500',
    statuses: ['prospect', 'interested', 'contacted']
  },
  { 
    id: 'booking', 
    name: 'Booking', 
    icon: Calendar, 
    color: 'bg-purple-500',
    statuses: ['qualified', 'booked', 'confirmed']
  },
  { 
    id: 'pre_service', 
    name: 'Pre-Service', 
    icon: Bell, 
    color: 'bg-indigo-500',
    statuses: ['reminded', 'on_way', 'arrived']
  },
  { 
    id: 'check_in', 
    name: 'Check-In', 
    icon: UserCheck, 
    color: 'bg-cyan-500',
    statuses: ['checked_in', 'in_consultation', 'service_selected']
  },
  { 
    id: 'service', 
    name: 'Service', 
    icon: Clock, 
    color: 'bg-green-500',
    statuses: ['in_service', 'service_complete', 'quality_checked']
  },
  { 
    id: 'payment', 
    name: 'Payment', 
    icon: CreditCard, 
    color: 'bg-yellow-500',
    statuses: ['at_checkout', 'payment_processing', 'paid']
  },
  { 
    id: 'feedback', 
    name: 'Feedback', 
    icon: MessageSquare, 
    color: 'bg-orange-500',
    statuses: ['follow_up_scheduled', 'feedback_requested', 'feedback_received']
  },
  { 
    id: 'retention', 
    name: 'Retention', 
    icon: Heart, 
    color: 'bg-pink-500',
    statuses: ['active_client', 'loyal_client', 'vip_client']
  }
]

// Status configurations
const STATUS_CONFIG: Record<string, { label: string; color: string; next?: string[] }> = {
  // Awareness statuses
  prospect: { label: 'Prospect', color: 'bg-gray-500', next: ['interested', 'contacted'] },
  interested: { label: 'Interested', color: 'bg-blue-400', next: ['contacted', 'qualified'] },
  contacted: { label: 'Contacted', color: 'bg-blue-500', next: ['qualified', 'booked'] },
  
  // Booking statuses
  qualified: { label: 'Qualified', color: 'bg-purple-400', next: ['booked'] },
  booked: { label: 'Booked', color: 'bg-purple-500', next: ['confirmed', 'cancelled'] },
  confirmed: { label: 'Confirmed', color: 'bg-purple-600', next: ['reminded', 'no_show'] },
  
  // Pre-service statuses
  reminded: { label: 'Reminded', color: 'bg-indigo-400', next: ['on_way', 'arrived', 'rescheduled'] },
  on_way: { label: 'On Way', color: 'bg-indigo-500', next: ['arrived', 'delayed'] },
  arrived: { label: 'Arrived', color: 'bg-indigo-600', next: ['checked_in', 'walk_out'] },
  
  // Check-in statuses
  checked_in: { label: 'Checked In', color: 'bg-cyan-500', next: ['in_consultation', 'waiting'] },
  in_consultation: { label: 'In Consultation', color: 'bg-cyan-600', next: ['service_selected'] },
  service_selected: { label: 'Service Selected', color: 'bg-cyan-700', next: ['in_service'] },
  
  // Service statuses
  in_service: { label: 'In Service', color: 'bg-green-500', next: ['service_complete'] },
  service_complete: { label: 'Service Complete', color: 'bg-green-600', next: ['quality_checked'] },
  quality_checked: { label: 'Quality Checked', color: 'bg-green-700', next: ['at_checkout'] },
  
  // Payment statuses
  at_checkout: { label: 'At Checkout', color: 'bg-yellow-500', next: ['payment_processing'] },
  payment_processing: { label: 'Processing Payment', color: 'bg-yellow-600', next: ['paid', 'payment_failed'] },
  paid: { label: 'Paid', color: 'bg-yellow-700', next: ['follow_up_scheduled'] },
  
  // Feedback statuses
  follow_up_scheduled: { label: 'Follow-up Scheduled', color: 'bg-orange-400', next: ['feedback_requested'] },
  feedback_requested: { label: 'Feedback Requested', color: 'bg-orange-500', next: ['feedback_received'] },
  feedback_received: { label: 'Feedback Received', color: 'bg-orange-600', next: ['active_client'] },
  
  // Retention statuses
  active_client: { label: 'Active Client', color: 'bg-pink-400', next: ['loyal_client'] },
  loyal_client: { label: 'Loyal Client', color: 'bg-pink-500', next: ['vip_client'] },
  vip_client: { label: 'VIP Client', color: 'bg-pink-600', next: [] },
  
  // Exception statuses
  cancelled: { label: 'Cancelled', color: 'bg-red-500', next: ['rebooked'] },
  no_show: { label: 'No Show', color: 'bg-red-600', next: ['contacted'] },
  rescheduled: { label: 'Rescheduled', color: 'bg-yellow-500', next: ['confirmed'] },
  walk_out: { label: 'Walk Out', color: 'bg-red-700', next: ['contacted'] },
  payment_failed: { label: 'Payment Failed', color: 'bg-red-500', next: ['payment_processing'] },
  rebooked: { label: 'Rebooked', color: 'bg-green-500', next: ['confirmed'] }
}

// Default organization ID for development
const DEFAULT_ORG_ID = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'

export default function SalonWorkflowPage() {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null)
  const [customers, setCustomers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Mock data for demonstration
  useEffect(() => {
    // In real implementation, fetch from API
    setCustomers([
      {
        id: '1',
        name: 'Sarah Johnson',
        current_status: 'in_service',
        stage: 'service',
        phone: '+971 50 123 4567',
        last_visit: '2024-01-15',
        total_visits: 12,
        lifetime_value: 4500,
        tier: 'Gold'
      },
      {
        id: '2',
        name: 'Emma Wilson',
        current_status: 'confirmed',
        stage: 'booking',
        phone: '+971 50 234 5678',
        last_visit: '2024-01-10',
        total_visits: 5,
        lifetime_value: 1200,
        tier: 'Silver'
      },
      {
        id: '3',
        name: 'Olivia Brown',
        current_status: 'feedback_requested',
        stage: 'feedback',
        phone: '+971 50 345 6789',
        last_visit: '2024-01-18',
        total_visits: 25,
        lifetime_value: 8900,
        tier: 'Platinum'
      }
    ])
    setLoading(false)
  }, [])

  const getStageProgress = (currentStatus: string) => {
    let totalSteps = 0
    let completedSteps = 0
    let stageFound = false

    for (const stage of WORKFLOW_STAGES) {
      for (const status of stage.statuses) {
        totalSteps++
        if (!stageFound) {
          completedSteps++
        }
        if (status === currentStatus) {
          stageFound = true
        }
      }
    }

    return (completedSteps / totalSteps) * 100
  }

  const updateCustomerStatus = async (customerId: string, newStatus: string) => {
    // In real implementation, this would call the API
    toast({
      title: 'Status Updated',
      description: `Customer status changed to ${STATUS_CONFIG[newStatus]?.label}`
    })
    
    // Update local state
    setCustomers(customers.map(c => 
      c.id === customerId 
        ? { ...c, current_status: newStatus, stage: getStageForStatus(newStatus) }
        : c
    ))
  }

  const getStageForStatus = (status: string): string => {
    for (const stage of WORKFLOW_STAGES) {
      if (stage.statuses.includes(status)) {
        return stage.id
      }
    }
    return 'awareness'
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Customer Service Workflow</h1>
          <p className="text-gray-700 mt-1">Complete customer journey management from awareness to retention</p>
        </div>
        <Button className="bg-gradient-to-r from-purple-500 to-pink-500">
          <Users className="mr-2 h-4 w-4" />
          Add New Customer
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="stages">Workflow Stages</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Workflow Stages Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-gray-900">Workflow Stages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-8 gap-2">
                {WORKFLOW_STAGES.map((stage, index) => (
                  <div key={stage.id} className="text-center">
                    <div className={`${stage.color} rounded-full p-4 mx-auto mb-2 w-16 h-16 flex items-center justify-center`}>
                      <stage.icon className="h-8 w-8 text-white" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">{stage.name}</p>
                    {index < WORKFLOW_STAGES.length - 1 && (
                      <ArrowRight className="h-4 w-4 mx-auto mt-2 text-gray-400" />
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Active Customers by Stage */}
          <div className="grid grid-cols-4 gap-4">
            {WORKFLOW_STAGES.slice(0, 4).map(stage => {
              const customersInStage = customers.filter(c => c.stage === stage.id)
              return (
                <Card key={stage.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg text-gray-900">{stage.name}</CardTitle>
                      <stage.icon className="h-5 w-5 text-gray-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-gray-900">{customersInStage.length}</div>
                    <p className="text-xs text-gray-600 mt-1">Active customers</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-gray-700">Loading customers...</div>
          ) : (
            <div className="space-y-4">
              {customers.map(customer => {
                const statusConfig = STATUS_CONFIG[customer.current_status]
                const progress = getStageProgress(customer.current_status)
                const currentStage = WORKFLOW_STAGES.find(s => s.id === customer.stage)
                
                return (
                  <Card key={customer.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                        onClick={() => setSelectedCustomer(customer)}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">{customer.name}</h3>
                          <p className="text-sm text-gray-700">{customer.phone}</p>
                        </div>
                        <div className="text-right">
                          <Badge className={`${statusConfig?.color || 'bg-gray-500'} text-white`}>
                            {statusConfig?.label || 'Unknown'}
                          </Badge>
                          <p className="text-sm text-gray-600 mt-1">
                            {currentStage && (
                              <>
                                <currentStage.icon className="inline h-3 w-3 mr-1" />
                                {currentStage.name}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      
                      <Progress value={progress} className="mb-4 h-2" />
                      
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Last Visit</p>
                          <p className="font-medium text-gray-900">{customer.last_visit}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Total Visits</p>
                          <p className="font-medium text-gray-900">{customer.total_visits}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Lifetime Value</p>
                          <p className="font-medium text-gray-900">AED {customer.lifetime_value}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Tier</p>
                          <Badge variant="outline" className="text-gray-900">{customer.tier}</Badge>
                        </div>
                      </div>
                      
                      {statusConfig?.next && statusConfig.next.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm text-gray-700 mb-2">Next Actions:</p>
                          <div className="flex gap-2">
                            {statusConfig.next.map(nextStatus => (
                              <Button
                                key={nextStatus}
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  updateCustomerStatus(customer.id, nextStatus)
                                }}
                              >
                                {STATUS_CONFIG[nextStatus]?.label || nextStatus}
                                <ArrowRight className="ml-1 h-3 w-3" />
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="stages" className="space-y-6">
          {WORKFLOW_STAGES.map(stage => (
            <Card key={stage.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className={`${stage.color} rounded-full p-3`}>
                    <stage.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-gray-900">{stage.name} Stage</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {stage.statuses.map(status => {
                    const config = STATUS_CONFIG[status]
                    const customerCount = customers.filter(c => c.current_status === status).length
                    
                    return (
                      <div key={status} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <Badge className={`${config.color} text-white`}>
                            {config.label}
                          </Badge>
                          {customerCount > 0 && (
                            <span className="text-sm text-gray-600">{customerCount} customers</span>
                          )}
                        </div>
                        {config.next && config.next.length > 0 && (
                          <div className="mt-2">
                            <p className="text-xs text-gray-600">Can transition to:</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {config.next.map(next => (
                                <Badge key={next} variant="outline" className="text-xs">
                                  {STATUS_CONFIG[next]?.label || next}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Conversion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">68%</div>
                <p className="text-sm text-gray-600">Prospect to Customer</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Satisfaction Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">4.8/5.0</div>
                <p className="text-sm text-gray-600">Based on feedback</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-gray-900">
                  <Award className="h-5 w-5 text-purple-500" />
                  Retention Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">85%</div>
                <p className="text-sm text-gray-600">Active customers</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}