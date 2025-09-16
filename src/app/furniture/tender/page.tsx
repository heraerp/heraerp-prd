'use client'

import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/src/components/ui/tabs'
import { Button } from '@/src/components/ui/button'
import { Card } from '@/src/components/ui/card'
import { Input } from '@/src/components/ui/input'
import { Badge } from '@/src/components/ui/badge'
import { FileText, Search, Filter, Plus, TrendingUp, AlertCircle, Clock, Trophy, Brain, Shield, DollarSign, Truck, Target, Eye, Sparkles
} from 'lucide-react'
import Link from 'next/link'
import { useFurnitureOrg } from '@/src/components/furniture/FurnitureOrgContext'
import FurniturePageHeader from '@/src/components/furniture/FurniturePageHeader'
import { StatCardGrid } from '@/src/lib/dna/components/ui/stat-card-dna'
import { FurnitureStatCard } from '@/src/components/furniture/FurnitureStatCard'
import { universalApi } from '@/src/lib/universal-api'
import { tenderService } from '@/src/lib/services/tender-service'
import type { CoreEntity } from '@/src/types/hera-database.types'
import type { TenderMetrics, TenderListItem } from '@/src/lib/services/tender-service'
import { useToast } from '@/src/hooks/use-toast'
import TenderListTable from '@/src/components/furniture/tender/TenderListTable'
import TenderWorkflowStatus from '@/src/components/furniture/tender/TenderWorkflowStatus'


export const dynamic = 'force-dynamic'

// Default stats for loading state
  const defaultTenderStats = [
  {
    label: 'Active Tenders',
    value: '12',
    change: '3 closing soon',
    trend: 'neutral' as const,
    icon: FileText,
    gradient: 'from-blue-500 to-cyan-500'
  },
  {
    label: 'Bids Submitted',
    value: '24',
    change: '+8 this month',
    trend: 'up' as const,
    icon: Target,
    gradient: 'from-[var(--color-accent-teal)] to-[var(--color-accent-teal)]'
  },
  {
    label: 'Win Rate',
    value: '42%',
    change: '+5% vs last quarter',
    trend: 'up' as const,
    icon: Trophy,
    gradient: 'from-green-500 to-emerald-500'
  },
  {
    label: 'Total EMD',
    value: '₹8.2L',
    change: '₹2.1L locked',
    trend: 'neutral' as const,
    icon: Shield,
    gradient: 'from-[var(--color-accent-teal)] to-[var(--color-accent-teal)]'
  }
]

const mockActiveTenders = [
  {
    id: '1',
    code: 'KFD/2025/WOOD/001',
    title: 'Teak Wood Supply - Nilambur Range',
    department: 'Kerala Forest Department',
    lots: 15,
    estimatedValue: '₹45,00,000',
    closingDate: '2025-01-25',
    daysLeft: 5,
    status: 'active',
    emdRequired: '₹90,000',
    bidStrategy: 'aggressive'
  },
  {
    id: '2',
    code: 'KFD/2025/WOOD/002',
    title: 'Rosewood Logs - Wayanad Division',
    department: 'Kerala Forest Department',
    lots: 8,
    estimatedValue: '₹32,00,000',
    closingDate: '2025-01-28',
    daysLeft: 8,
    status: 'active',
    emdRequired: '₹64,000',
    bidStrategy: 'conservative'
  },
  {
    id: '3',
    code: 'KFD/2025/TIMBER/003',
    title: 'Mixed Timber - Palakkad Region',
    department: 'Kerala Forest Department',
    lots: 22,
    estimatedValue: '₹18,00,000',
    closingDate: '2025-02-05',
    daysLeft: 16,
    status: 'watchlist',
    emdRequired: '₹36,000',
    bidStrategy: 'moderate'
  }
]

const mockCompetitors = [
  {
    id: '1',
    name: 'ABC Timber Works',
    winRate: '55%',
    avgBidMargin: '8.5%',
    totalWins: 42,
    lastEncounter: '2024-12-15',
    strengthLevel: 'high'
  },
  {
    id: '2',
    name: 'XYZ Wood Industries',
    winRate: '38%',
    avgBidMargin: '12.3%',
    totalWins: 28,
    lastEncounter: '2024-12-20',
    strengthLevel: 'medium'
  },
  {
    id: '3',
    name: 'PQR Timbers',
    winRate: '25%',
    avgBidMargin: '15.2%',
    totalWins: 15,
    lastEncounter: '2024-11-30',
    strengthLevel: 'low'
  }
]

export default function TenderManagementPage() {
  const { organizationId, organizationName, orgLoading } = useFurnitureOrg()

const { toast } = useToast()

const [searchQuery, setSearchQuery] = useState('')

const [activeTab, setActiveTab] = useState('overview')

const [tenders, setTenders] = useState<TenderListItem[]>([])

const [metrics, setMetrics] = useState<TenderMetrics | null>(null)

const [loading, setLoading] = useState(true)

const [tenderStats, setTenderStats] = useState(defaultTenderStats)

  // Load tender data from API
  useEffect(() => {
    async function loadTenderData() {
      if (!organizationId) return
      
      try {
        // Set organization context
        universalApi.setOrganizationId(organizationId)
        
        // Try to load metrics, but continue with defaults if it fails
        try {
          const metricsData = await tenderService.getMetrics()
          setMetrics(metricsData)
          
          // Update stats with real data
          setTenderStats([
            {
              label: 'Active Tenders',
              value: metricsData.activeTenders.total.toString(),
              change: `${metricsData.activeTenders.closingSoon} closing soon`,
              trend: 'neutral' as const,
              icon: FileText,
              gradient: 'from-blue-500 to-cyan-500'
            },
            {
              label: 'Bids Submitted',
              value: metricsData.bidsSubmitted.current.toString(),
              change: `+${metricsData.bidsSubmitted.delta} this month`,
              trend: metricsData.bidsSubmitted.delta > 0 ? ('up' as const) : ('neutral' as const),
              icon: Target,
              gradient: 'from-[var(--color-accent-teal)] to-[var(--color-accent-teal)]'
            },
            {
              label: 'Win Rate',
              value: `${metricsData.winRate.percentage}%`,
              change: `${metricsData.winRate.wonBids}/${metricsData.winRate.totalBids} won`,
              trend: metricsData.winRate.percentage > 40 ? ('up' as const) : ('neutral' as const),
              icon: Trophy,
              gradient: 'from-green-500 to-emerald-500'
            },
            {
              label: 'Total EMD',
              value: `₹${(metricsData.emd.totalPaid / 100000).toFixed(1)}L`,
              change: `₹${(metricsData.emd.locked / 100000).toFixed(1)}L locked`,
              trend: 'neutral' as const,
              icon: Shield,
              gradient: 'from-[var(--color-accent-teal)] to-[var(--color-accent-teal)]'
            }
          ])
        } catch (metricsError) {
          console.log('Using default tender metrics for demo mode')
          // Keep default stats if metrics API fails
        }

// Try to load tender list
        try {
          const { tenders: tenderList } = await tenderService.getTenderList({
            status: 'active',
            limit: 10
          })
          setTenders(tenderList)
        } catch (listError) {
          console.log('Using mock tender data for demo mode')
          // Use mock data if API fails
          setTenders(mockActiveTenders)
        }
      } catch (error) {
        console.error('Error loading tender data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadTenderData()
  }, [organizationId])
  
  if (orgLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-body)]">
        <div className="p-6 flex items-center justify-center">
          <div className="text-[var(--color-text-secondary)]">Loading organization...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-body)]">
      <div className="p-6 space-y-6">
        {/* Header */}
        <FurniturePageHeader
          title="Tender Management"
          subtitle="Kerala Forest Department wood tenders"
          actions={
            <>
              <Link href="/furniture/tender/documents">
                <Button variant="outline" size="sm" className="gap-2 hover:bg-[var(--color-hover)]">
                  <FileText className="h-4 w-4" />
                  Documents
                </Button>
              </Link>
              <Link href="/furniture/tender/watchlist">
                <Button variant="outline" size="sm" className="gap-2 hover:bg-[var(--color-hover)]">
                  <Eye className="h-4 w-4" />
                  Watchlist
                </Button>
              </Link>
              <Link href="/furniture/tender/bids">
                <Button variant="outline" size="sm" className="gap-2 hover:bg-[var(--color-hover)]">
                  <Target className="h-4 w-4" />
                  My Bids
                </Button>
              </Link>
              <Link href="/furniture/tender/new">
                <Button
                  size="sm"
                  className="gap-2 bg-gradient-to-r from-[var(--color-accent-indigo)] to-[var(--color-accent-teal)] hover:from-[var(--color-accent-indigo)] hover:to-[var(--color-accent-teal)]"
                >
                  <Plus className="h-4 w-4" />
                  Add Tender
                </Button>
              </Link>
            </>
          }
        />

        {/* Key Metrics */}
        <div className="space-y-4">
          <h2 className="bg-[var(--color-body)] text-xl font-semibold text-[var(--color-text-primary)]">Tender Performance</h2>
          <StatCardGrid>
            {tenderStats.map(stat => (
              <FurnitureStatCard key={stat.label} {...stat} />
            ))}
          </StatCardGrid>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-[var(--color-body)] space-y-4">
          <TabsList className="bg-[var(--color-body)]/50 backdrop-blur-sm">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="active">Active Tenders</TabsTrigger>
            <TabsTrigger value="bidding">Bid Strategy</TabsTrigger>
            <TabsTrigger value="competitors">Competitors</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="bg-[var(--color-body)] space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--color-text-secondary)] h-5 w-5" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search tenders by code, title, or department..."
                className="pl-10 bg-[var(--color-body)]/50 border-[var(--color-border)] text-[var(--color-text-primary)] placeholder-gray-400"
              />
            </div>

            {/* Active Tenders List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="bg-[var(--color-body)] text-lg font-semibold text-[var(--color-text-primary)]">Active Tenders</h3>
                <Button variant="outline" size="sm" className="gap-2 hover:bg-[var(--color-hover)]">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </div>

              <div className="grid gap-4">
                {loading ? (
                  <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6 bg-[var(--color-body)]/70 backdrop-blur-sm border-[var(--color-border)]/50">
                    <div className="flex items-center justify-center">
                      <div className="text-[var(--color-text-secondary)]">Loading tenders...</div>
                    </div>
                  </Card>
                ) : tenders.length === 0 ? (
                  <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6 bg-[var(--color-body)]/70 backdrop-blur-sm border-[var(--color-border)]/50">
                    <div className="text-center text-[var(--color-text-secondary)]">No active tenders found</div>
                  </Card>
                ) : (
                  tenders.map(tender => (
                    <Card
                      key={tender.id}
                      className="p-6 bg-[var(--color-body)]/70 backdrop-blur-sm border-[var(--color-border)]/50 hover:border-[var(--color-accent-teal)]/50 transition-colors"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h4 className="bg-[var(--color-body)] text-lg font-semibold text-[var(--color-text-primary)]">{tender.title}</h4>
                              <Badge variant={tender.status === 'active' ? 'default' : 'secondary'}>
                                {tender.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                              {tender.code} • {tender.department}
                            </p>
                          </div>
                          <Link href={`/furniture/tender/${tender.id}`}>
                            <Button size="sm" className="bg-[var(--color-button-bg)] text-[var(--color-button-text)] hover:bg-[var(--color-button-hover)] gap-2">
                              <Eye className="h-4 w-4" />
                              View Details
                            </Button>
                          </Link>
                        </div>

                        <div className="bg-[var(--color-body)] grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-[var(--color-text-secondary)]">Lots</p>
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">{tender.lots || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-[var(--color-text-secondary)]">Estimated Value</p>
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">
                              ₹{(tender.estimated_value / 100000).toFixed(1)}L
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[var(--color-text-secondary)]">EMD Required</p>
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">
                              ₹{(tender.emd_amount / 1000).toFixed(0)}K
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-[var(--color-text-secondary)]">Closing Date</p>
                            <div className="bg-[var(--color-body)] flex items-center gap-1">
                              <Clock className="h-3 w-3 text-[#37353E]" />
                              <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                                {tender.days_left} days left
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)]/50">
                          <div className="bg-[var(--color-body)] flex items-center gap-2">
                            <Brain className="h-4 w-4 text-[#37353E]" />
                            <span className="text-sm text-[var(--color-text-secondary)]">
                              AI Strategy:{' '}
                              <span className="text-[var(--color-text-primary)] font-medium">
                                {tender.bid_strategy || 'moderate'}
                              </span>
                            </span>
                          </div>
                          <div className="bg-[var(--color-body)] flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  toast({
                                    title: 'Calculating Bid',
                                    description: 'AI is analyzing the tender...'
                                  })
                                  
                                  // Simulate AI analysis
                                  await new Promise(resolve => setTimeout(resolve, 2000))
                                  
                                  toast({
                                    title: 'Bid Recommendation',
                                    description: `Suggested bid: ₹${(tender.estimated_value * 0.92 / 100).toFixed(0)}/m³`
                                  })
                                } catch (error) {
                                  toast({
                                    title: 'Error',
                                    description: 'Failed to analyze bid',
                                    variant: 'destructive'
                                  })
                                }
                              }}
                            >
                              <Sparkles className="h-4 w-4" />
                              AI Bid
                            </Button>
                            <Link href={`/furniture/tender/${tender.code}/bid/new`}>
                              <Button variant="outline" size="sm">Submit Bid</Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="active" className="bg-[var(--color-body)] space-y-4">
            <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6 bg-[var(--color-body)]/70 backdrop-blur-sm border-[var(--color-border)]/50">
              <h3 className="bg-[var(--color-body)] text-lg font-semibold text-[var(--color-text-primary)] mb-4">Active Tender Pipeline</h3>
              <TenderListTable tenders={mockActiveTenders} />
            </Card>
          </TabsContent>

          <TabsContent value="bidding" className="bg-[var(--color-body)] space-y-4">
            <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6 bg-[var(--color-body)]/70 backdrop-blur-sm border-[var(--color-border)]/50">
              <h3 className="bg-[var(--color-body)] text-lg font-semibold text-[var(--color-text-primary)] mb-4">AI-Powered Bid Strategy</h3>
              <div className="bg-[var(--color-body)] space-y-4">
                <div className="bg-[var(--color-body)] grid grid-cols-1 md:grid-cols-3 gap-4">
                  {mockActiveTenders.map(tender => (
                    <Card key={tender.id} className="p-4 bg-[var(--color-body)]/50 border-[var(--color-border)]/50">
                      <h4 className="bg-[var(--color-body)] font-medium text-[var(--color-text-primary)] mb-2">{tender.code}</h4>
                      <div className="bg-[var(--color-body)] space-y-2">
                        <div className="bg-[var(--color-body)] flex justify-between">
                          <span className="text-sm text-[var(--color-text-secondary)]">Strategy</span>
                          <Badge
                            variant={
                              tender.bidStrategy === 'aggressive'
                                ? 'destructive'
                                : tender.bidStrategy === 'conservative'
                                ? 'secondary'
                                : 'default'
                            }
                          >
                            {tender.bidStrategy}
                          </Badge>
                        </div>
                        <div className="bg-[var(--color-body)] flex justify-between">
                          <span className="text-sm text-[var(--color-text-secondary)]">Win Probability</span>
                          <span className="text-sm font-medium text-[var(--color-text-primary)]">
                            {tender.bidStrategy === 'aggressive' ? '75%' : '45%'}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="competitors" className="bg-[var(--color-body)] space-y-4">
            <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6 bg-[var(--color-body)]/70 backdrop-blur-sm border-[var(--color-border)]/50">
              <h3 className="bg-[var(--color-body)] text-lg font-semibold text-[var(--color-text-primary)] mb-4">Competitor Analysis</h3>
              <div className="bg-[var(--color-body)] space-y-4">
                {mockCompetitors.map(competitor => (
                  <div
                    key={competitor.id}
                    className="bg-[var(--color-body)] flex items-center justify-between p-4 rounded-lg border border-[var(--color-border)]/50"
                  >
                    <div>
                      <h4 className="bg-[var(--color-body)] font-medium text-[var(--color-text-primary)]">{competitor.name}</h4>
                      <div className="bg-[var(--color-body)] flex items-center gap-4 mt-1">
                        <span className="text-sm text-[var(--color-text-secondary)]">
                          Win Rate: <span className="text-[var(--color-text-primary)]">{competitor.winRate}</span>
                        </span>
                        <span className="text-sm text-[var(--color-text-secondary)]">
                          Avg Margin: <span className="text-[var(--color-text-primary)]">{competitor.avgBidMargin}</span>
                        </span>
                      </div>
                    </div>
                    <Badge
                      variant={
                        competitor.strengthLevel === 'high'
                          ? 'destructive'
                          : competitor.strengthLevel === 'medium'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {competitor.strengthLevel} threat
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="bg-[var(--color-body)] space-y-4">
            <Card className="bg-[var(--color-surface-raised)] border-[var(--color-border)] p-6 bg-[var(--color-body)]/70 backdrop-blur-sm border-[var(--color-border)]/50">
              <h3 className="bg-[var(--color-body)] text-lg font-semibold text-[var(--color-text-primary)] mb-4">Performance Analytics</h3>
              <TenderWorkflowStatus />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}