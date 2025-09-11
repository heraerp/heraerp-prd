'use client'

import { useEffect, useState } from 'react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { LoadingSpinner } from '@/components/ui/loading-states'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { DollarSign, TrendingUp, Calendar, User, ChevronRight } from 'lucide-react'

export default function CRMOpportunitiesPage() {
  const { currentOrganization, isAuthenticated } = useMultiOrgAuth()
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const stages = [
    { name: 'Qualification', value: 'qualification', color: 'bg-gray-500' },
    { name: 'Needs Analysis', value: 'needs_analysis', color: 'bg-blue-500' },
    { name: 'Proposal', value: 'proposal', color: 'bg-yellow-500' },
    { name: 'Negotiation', value: 'negotiation', color: 'bg-orange-500' },
    { name: 'Closed Won', value: 'closed_won', color: 'bg-green-500' },
    { name: 'Closed Lost', value: 'closed_lost', color: 'bg-red-500' }
  ]

  useEffect(() => {
    if (currentOrganization && isAuthenticated) {
      loadOpportunities()
    }
  }, [currentOrganization, isAuthenticated])

  const loadOpportunities = async () => {
    if (!currentOrganization?.id) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch(
        `/api/v1/crm/entities?organization_id=${currentOrganization.id}&entity_type=opportunity&include_dynamic_data=true`
      )
      const data = await response.json()
      
      if (data.success) {
        // Group opportunities by stage
        const grouped = stages.reduce((acc, stage) => {
          acc[stage.value] = (data.data || []).filter(
            (opp: any) => (opp.dynamic_fields?.stage?.value || 'qualification') === stage.value
          )
          return acc
        }, {} as Record<string, any[]>)
        
        setOpportunities(grouped)
      } else {
        throw new Error(data.message || 'Failed to load opportunities')
      }
      
    } catch (error: any) {
      console.error('Error loading opportunities:', error)
      setError(error.message || 'Failed to load opportunities')
    } finally {
      setIsLoading(false)
    }
  }

  const getTotalValue = (stage: string) => {
    if (!opportunities[stage]) return 0
    return opportunities[stage].reduce(
      (sum, opp) => sum + (Number(opp.dynamic_fields?.amount?.value) || 0),
      0
    )
  }

  const getStageProgress = (stage: string) => {
    const stageIndex = stages.findIndex(s => s.value === stage)
    return ((stageIndex + 1) / (stages.length - 1)) * 100
  }

  if (!isAuthenticated || !currentOrganization) {
    return (
      <Alert className="m-8">
        <AlertDescription>Please log in and select an organization to continue.</AlertDescription>
      </Alert>
    )
  }

  if (isLoading) return <LoadingSpinner />

  if (error) {
    return (
      <Alert variant="destructive" className="m-8">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Sales Pipeline</h1>
        <p className="text-gray-600 dark:text-gray-400">Track and manage your opportunities</p>
      </div>

      {/* Pipeline View */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
        {stages.map((stage, index) => {
          const stageOpps = opportunities[stage.value] || []
          const totalValue = getTotalValue(stage.value)
          const isClosedStage = stage.value === 'closed_won' || stage.value === 'closed_lost'
          
          return (
            <div key={stage.value} className={`relative ${isClosedStage ? 'lg:col-span-1' : 'lg:col-span-1'}`}>
              {/* Stage Header */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{stage.name}</h3>
                  <Badge variant="outline" className="text-xs">
                    {stageOpps.length}
                  </Badge>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  ${totalValue.toLocaleString()}
                </div>
                <Progress value={getStageProgress(stage.value)} className="h-1 mt-2" />
              </div>

              {/* Opportunities Cards */}
              <div className="space-y-3">
                {stageOpps.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">
                    No opportunities
                  </div>
                ) : (
                  stageOpps.map((opp) => (
                    <Card
                      key={opp.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                    >
                      <CardContent className="p-4">
                        <h4 className="font-medium text-sm mb-2 text-gray-900 dark:text-gray-100">
                          {opp.entity_name}
                        </h4>
                        
                        <div className="space-y-2 text-xs text-gray-600 dark:text-gray-400">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center">
                              <DollarSign className="w-3 h-3 mr-1" />
                              ${(opp.dynamic_fields?.amount?.value || 0).toLocaleString()}
                            </span>
                            <span className="font-semibold">
                              {opp.dynamic_fields?.probability?.value || 0}%
                            </span>
                          </div>
                          
                          {opp.dynamic_fields?.account_name?.value && (
                            <div className="flex items-center">
                              <User className="w-3 h-3 mr-1" />
                              {opp.dynamic_fields.account_name.value}
                            </div>
                          )}
                          
                          {opp.dynamic_fields?.close_date?.value && (
                            <div className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(opp.dynamic_fields.close_date.value).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>

              {/* Stage Connector */}
              {index < stages.length - 1 && (
                <div className="hidden lg:block absolute top-12 -right-6 z-10">
                  <ChevronRight className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Summary Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Pipeline Value</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ${Object.values(opportunities)
                    .flat()
                    .filter((opp: any) => !['closed_won', 'closed_lost'].includes(opp.dynamic_fields?.stage?.value || 'qualification'))
                    .reduce((sum, opp: any) => sum + (Number(opp.dynamic_fields?.amount?.value) || 0), 0)
                    .toLocaleString()}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Closed Won This Month</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  ${getTotalValue('closed_won').toLocaleString()}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Win Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {(() => {
                    const won = opportunities['closed_won']?.length || 0
                    const lost = opportunities['closed_lost']?.length || 0
                    const total = won + lost
                    return total > 0 ? Math.round((won / total) * 100) : 0
                  })()}%
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800">+5% MoM</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}