'use client'

import { useEffect, useState } from 'react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-states'
import { Button } from '@/components/ui/button'
import { Plus, Users, Briefcase, Target, Activity, TrendingUp, Phone, Mail, Calendar, DollarSign } from 'lucide-react'
import { universalApi } from '@/lib/universal-api'
import { StatCardDNA } from '@/lib/dna/components/ui/stat-card-dna'

export default function CRMDashboard() {
  const { user, currentOrganization, isAuthenticated, isLoading: authLoading } = useMultiOrgAuth()
  const [stats, setStats] = useState<any>(null)
  const [recentActivities, setRecentActivities] = useState<any[]>([])
  const [topOpportunities, setTopOpportunities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (currentOrganization && isAuthenticated) {
      loadCRMData()
    }
  }, [currentOrganization, isAuthenticated])

  const loadCRMData = async () => {
    if (!currentOrganization?.id) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      universalApi.setOrganizationId(currentOrganization.id)
      
      // Load all CRM entities
      const entitiesResponse = await universalApi.read('core_entities')
      const entities = Array.isArray(entitiesResponse) ? entitiesResponse : entitiesResponse?.data || []
      
      // Filter CRM entities
      const leads = entities.filter((e: any) => e.entity_type === 'lead')
      const opportunities = entities.filter((e: any) => e.entity_type === 'opportunity')
      const accounts = entities.filter((e: any) => e.entity_type === 'account')
      const contacts = entities.filter((e: any) => e.entity_type === 'contact')
      const activities = entities.filter((e: any) => e.entity_type === 'activity')
      
      // Load transactions for pipeline value
      const transactionsResponse = await universalApi.read('universal_transactions')
      const transactions = Array.isArray(transactionsResponse) ? transactionsResponse : transactionsResponse?.data || []
      const crmTransactions = transactions.filter((t: any) => 
        t.smart_code?.includes('.CRM.') && t.status === 'active'
      )
      
      // Calculate stats
      const totalPipelineValue = crmTransactions
        .filter((t: any) => t.transaction_type === 'opportunity')
        .reduce((sum: number, t: any) => sum + (Number(t.total_amount) || 0), 0)
      
      setStats({
        totalLeads: leads.length,
        totalOpportunities: opportunities.length,
        totalAccounts: accounts.length,
        totalContacts: contacts.length,
        totalActivities: activities.length,
        pipelineValue: totalPipelineValue,
        conversionRate: opportunities.length > 0 ? ((opportunities.filter((o: any) => o.metadata?.stage === 'closed_won').length / opportunities.length) * 100).toFixed(1) : '0'
      })
      
      // Get recent activities (last 5)
      const recentActivitiesData = activities
        .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map((activity: any) => ({
          id: activity.id,
          type: activity.metadata?.activity_type || 'activity',
          subject: activity.entity_name,
          date: new Date(activity.created_at).toLocaleDateString(),
          assignedTo: activity.metadata?.assigned_to || 'Unassigned'
        }))
      
      setRecentActivities(recentActivitiesData)
      
      // Get top opportunities
      const topOpps = opportunities
        .filter((o: any) => o.metadata?.amount > 0)
        .sort((a: any, b: any) => (b.metadata?.amount || 0) - (a.metadata?.amount || 0))
        .slice(0, 5)
        .map((opp: any) => ({
          id: opp.id,
          name: opp.entity_name,
          amount: opp.metadata?.amount || 0,
          stage: opp.metadata?.stage || 'qualification',
          probability: opp.metadata?.probability || 0,
          closeDate: opp.metadata?.close_date ? new Date(opp.metadata.close_date).toLocaleDateString() : 'TBD'
        }))
      
      setTopOpportunities(topOpps)
      
    } catch (error: any) {
      console.error('Error loading CRM data:', error)
      setError(error.message || 'Failed to load CRM data')
    } finally {
      setIsLoading(false)
    }
  }

  // Handle loading states
  if (authLoading || !isAuthenticated) {
    return <LoadingSpinner />
  }

  if (!currentOrganization) {
    return (
      <Alert className="m-8">
        <AlertDescription>Please select an organization to continue.</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">CRM Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your customer relationships and sales pipeline</p>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 flex gap-4">
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          New Lead
        </Button>
        <Button variant="outline">
          <Briefcase className="w-4 h-4 mr-2" />
          New Opportunity
        </Button>
        <Button variant="outline">
          <Users className="w-4 h-4 mr-2" />
          New Contact
        </Button>
        <Button variant="outline">
          <Activity className="w-4 h-4 mr-2" />
          New Activity
        </Button>
      </div>

      {/* Stats Cards */}
      {isLoading ? (
        <LoadingSpinner />
      ) : error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCardDNA
              title="Total Leads"
              value={stats?.totalLeads || 0}
              icon={Users}
              change="+12% from last month"
              changeType="positive"
              iconGradient="from-blue-500 to-purple-500"
            />
            <StatCardDNA
              title="Opportunities"
              value={stats?.totalOpportunities || 0}
              icon={Target}
              change="+8% from last month"
              changeType="positive"
              iconGradient="from-green-500 to-emerald-500"
            />
            <StatCardDNA
              title="Pipeline Value"
              value={`$${(stats?.pipelineValue || 0).toLocaleString()}`}
              icon={DollarSign}
              change="+15% from last month"
              changeType="positive"
              iconGradient="from-amber-500 to-orange-500"
            />
            <StatCardDNA
              title="Conversion Rate"
              value={`${stats?.conversionRate || 0}%`}
              icon={TrendingUp}
              change="+3% from last month"
              changeType="positive"
              iconGradient="from-purple-500 to-pink-500"
            />
          </div>

          {/* Recent Activities and Top Opportunities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Activities */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 !text-gray-900 dark:!text-gray-100">Recent Activities</h2>
              <div className="space-y-4">
                {recentActivities.length === 0 ? (
                  <p className="text-gray-500">No recent activities</p>
                ) : (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 pb-3 border-b last:border-0">
                      {activity.type === 'call' ? (
                        <Phone className="w-5 h-5 text-blue-600 mt-0.5" />
                      ) : activity.type === 'email' ? (
                        <Mail className="w-5 h-5 text-green-600 mt-0.5" />
                      ) : (
                        <Calendar className="w-5 h-5 text-purple-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{activity.subject}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {activity.date} • {activity.assignedTo}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Top Opportunities */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4 !text-gray-900 dark:!text-gray-100">Top Opportunities</h2>
              <div className="space-y-4">
                {topOpportunities.length === 0 ? (
                  <p className="text-gray-500">No opportunities yet</p>
                ) : (
                  topOpportunities.map((opp) => (
                    <div key={opp.id} className="pb-3 border-b last:border-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{opp.name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {opp.stage} • {opp.probability}% • Close: {opp.closeDate}
                          </p>
                        </div>
                        <p className="font-semibold text-green-600">
                          ${opp.amount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}