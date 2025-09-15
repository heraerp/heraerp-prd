'use client'

import React, { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  FileText,
  Search,
  Filter,
  Plus,
  TrendingUp,
  AlertCircle,
  Clock,
  Trophy,
  Brain,
  Shield,
  DollarSign,
  Truck,
  Target,
  Eye
} from 'lucide-react'
import Link from 'next/link'
import { useFurnitureOrg } from '@/components/furniture/FurnitureOrgContext'
import FurniturePageHeader from '@/components/furniture/FurniturePageHeader'
import { StatCardGrid } from '@/lib/dna/components/ui/stat-card-dna'
import { FurnitureStatCard } from '@/components/furniture/FurnitureStatCard'
import { universalApi } from '@/lib/universal-api'
import { tenderService } from '@/lib/services/tender-service'
import type { CoreEntity } from '@/types/hera-database.types'
import type { TenderMetrics, TenderListItem } from '@/lib/services/tender-service'
import { useToast } from '@/hooks/use-toast'

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
    gradient: 'from-purple-500 to-pink-500'
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
    gradient: 'from-amber-500 to-orange-500'
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

        // Load metrics
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
            gradient: 'from-purple-500 to-pink-500'
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
            gradient: 'from-amber-500 to-orange-500'
          }
        ])

        // Load tender list
        const { tenders: tenderList } = await tenderService.getTenderList({
          status: 'active',
          limit: 10
        })
        setTenders(tenderList)
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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2">
            <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground">Loading tender management...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="p-6 space-y-6">
        {/* Header */}
        <FurniturePageHeader
          title="Tender Management"
          subtitle="Kerala Forest Department wood tenders"
          actions={
            <>
              <Link href="/furniture/tender/documents">
                <Button variant="outline" size="sm" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Documents
                </Button>
              </Link>
              <Link href="/furniture/tender/watchlist">
                <Button variant="outline" size="sm" className="gap-2">
                  <Eye className="h-4 w-4" />
                  Watchlist
                </Button>
              </Link>
              <Link href="/furniture/tender/bids">
                <Button variant="outline" size="sm" className="gap-2">
                  <Target className="h-4 w-4" />
                  My Bids
                </Button>
              </Link>
              <Link href="/furniture/tender/new">
                <Button
                  size="sm"
                  className="gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
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
          <h2 className="text-xl font-semibold text-foreground">Tender Performance</h2>
          <StatCardGrid>
            {tenderStats.map(stat => (
              <FurnitureStatCard key={stat.label} {...stat} />
            ))}
          </StatCardGrid>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-muted/50 backdrop-blur-sm">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="active">Active Tenders</TabsTrigger>
            <TabsTrigger value="bidding">Bid Strategy</TabsTrigger>
            <TabsTrigger value="competitors">Competitors</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
              <Input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search tenders by code, title, or department..."
                className="pl-10 bg-muted/50 border-border text-foreground placeholder-gray-400"
              />
            </div>

            {/* Active Tenders List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-foreground">Active Tenders</h3>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Filter
                </Button>
              </div>

              <div className="grid gap-4">
                {loading ? (
                  <Card className="p-6 bg-muted/70 backdrop-blur-sm border-border/50">
                    <div className="flex items-center justify-center">
                      <div className="text-muted-foreground">Loading tenders...</div>
                    </div>
                  </Card>
                ) : tenders.length === 0 ? (
                  <Card className="p-6 bg-muted/70 backdrop-blur-sm border-border/50">
                    <div className="text-center text-muted-foreground">No active tenders found</div>
                  </Card>
                ) : (
                  tenders.map(tender => (
                    <Card
                      key={tender.id}
                      className="p-6 bg-muted/70 backdrop-blur-sm border-border/50 hover:border-amber-500/50 transition-colors"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h4 className="text-lg font-semibold text-foreground">{tender.title}</h4>
                              <Badge variant={tender.status === 'active' ? 'default' : 'secondary'}>
                                {tender.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {tender.code} • {tender.department}
                            </p>
                          </div>
                          <Link href={`/furniture/tender/${tender.id}`}>
                            <Button size="sm" className="gap-2">
                              <Eye className="h-4 w-4" />
                              View Details
                            </Button>
                          </Link>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Lots</p>
                            <p className="text-sm font-medium text-foreground">{tender.lots || 0}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Estimated Value</p>
                            <p className="text-sm font-medium text-foreground">
                              ₹{(tender.estimated_value / 100000).toFixed(1)}L
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">EMD Required</p>
                            <p className="text-sm font-medium text-foreground">
                              ₹{(tender.emd_amount / 1000).toFixed(0)}K
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Closing Date</p>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3 text-amber-400" />
                              <p className="text-sm font-medium text-amber-400">
                                {tender.days_left} days left
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                          <div className="flex items-center gap-2">
                            <Brain className="h-4 w-4 text-purple-400" />
                            <span className="text-sm text-muted-foreground">
                              AI Strategy:{' '}
                              <span className="text-foreground font-medium">
                                {tender.bid_strategy || 'moderate'}
                              </span>
                            </span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={async () => {
                                try {
                                  toast({
                                    title: 'Calculating Bid',
                                    description: 'AI is analyzing the tender...'
                                  })

                                  const result = await tenderService.calculateBid(tender.id, {
                                    estimated_amount: tender.estimated_value,
                                    costs: {
                                      transport_mt: 3200,
                                      handling_mt: 900
                                    },
                                    margin_preference: 'moderate'
                                  })

                                  toast({
                                    title: 'Bid Calculated Successfully',
                                    description: `Draft bid: ₹${(result.bid_amount / 100000).toFixed(1)}L with ${result.ai_confidence || 78}% confidence. Margin: ${result.margin_percentage?.toFixed(1) || '12.5'}%`
                                  })

                                  console.log('Bid calculation result:', result)

                                  // Optional: Navigate to bid details or refresh the list
                                  // router.push(`/furniture/tender/${tender.id}/bid/${result.draft_bid_id}`)
                                } catch (error) {
                                  console.error('Error calculating bid:', error)
                                  const errorMessage = error.message || 'Unknown error'

                                  if (errorMessage.includes('Supabase not configured')) {
                                    toast({
                                      title: 'Database Not Configured',
                                      description:
                                        'Please configure Supabase credentials in your .env file. See SETUP_SUPABASE.md for instructions.',
                                      variant: 'destructive'
                                    })
                                  } else {
                                    toast({
                                      title: 'Calculation Failed',
                                      description: `Unable to calculate bid: ${errorMessage}`,
                                      variant: 'destructive'
                                    })
                                  }
                                }
                              }}
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Calculate Bid
                            </Button>
                            <Button variant="outline" size="sm">
                              <FileText className="h-4 w-4 mr-1" />
                              Documents
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>

            {/* AI Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="p-6 bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-700/50">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-purple-600/20">
                    <Brain className="h-6 w-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">AI Bid Recommendations</h4>
                    <p className="text-sm text-gray-300 mt-1">
                      3 tenders identified with high win probability based on historical data and
                      current market conditions.
                    </p>
                    <Button size="sm" className="mt-3" variant="secondary">
                      View Analysis
                    </Button>
                  </div>
                </div>
              </Card>

              <Card className="p-6 bg-gradient-to-br from-amber-900/20 to-orange-900/20 border-amber-700/50">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-amber-600/20">
                    <AlertCircle className="h-6 w-6 text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-foreground">Compliance Alerts</h4>
                    <p className="text-sm text-gray-300 mt-1">
                      2 tenders require document updates. EMD payment due for KFD/2025/WOOD/001.
                    </p>
                    <Button size="sm" className="mt-3" variant="secondary">
                      Review Items
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="competitors" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Competitor Analysis</h3>
              <div className="grid gap-4">
                {mockCompetitors.map(competitor => (
                  <Card
                    key={competitor.id}
                    className="p-6 bg-muted/70 backdrop-blur-sm border-border/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground">{competitor.name}</h4>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-muted-foreground">
                            Win Rate:{' '}
                            <span className="text-foreground font-medium">{competitor.winRate}</span>
                          </span>
                          <span className="text-muted-foreground">
                            Avg Margin:{' '}
                            <span className="text-foreground font-medium">
                              {competitor.avgBidMargin}
                            </span>
                          </span>
                          <span className="text-muted-foreground">
                            Total Wins:{' '}
                            <span className="text-foreground font-medium">{competitor.totalWins}</span>
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
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
