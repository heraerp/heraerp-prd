'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { SalonProductionSidebar } from '@/components/salon/SalonProductionSidebar'
import { useToast } from '@/components/ui/use-toast'
import { useSalonSettings } from '@/contexts/salon-settings-context'
import { 
  ChevronLeft,
  Trophy,
  Gift,
  Users,
  TrendingUp,
  Star,
  Award,
  Zap,
  Target,
  Crown,
  Coins,
  Activity,
  Plus,
  Edit,
  Search,
  Filter,
  Download,
  Upload,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Clock,
  ShoppingBag,
  Sparkles,
  Heart,
  Gem,
  PlusCircle,
  MinusCircle,
  UserPlus,
  Settings,
  BarChart3,
  Calendar,
  Info
} from 'lucide-react'

// Default organization ID for development
const DEFAULT_ORG_ID = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'

interface LoyaltyProgram {
  id: string
  name: string
  description: string
  points_per_currency: number
  currency_per_point: number
  signup_bonus: number
  referral_bonus: number
  birthday_bonus: number
  tiers: LoyaltyTier[]
  rewards: LoyaltyReward[]
  active: boolean
}

interface LoyaltyTier {
  id: string
  name: string
  min_points: number
  benefits: string[]
  discount_percentage: number
  points_multiplier: number
  color: string
  icon?: string
}

interface LoyaltyReward {
  id: string
  name: string
  description: string
  points_required: number
  reward_type: 'discount' | 'service' | 'product' | 'cash_value'
  reward_value: number
  reward_details?: any
  active: boolean
  stock?: number
  expires_in_days?: number
  redemption_count?: number
}

interface CustomerLoyalty {
  customer_id: string
  customer_name: string
  customer_email?: string
  customer_phone?: string
  points_balance: number
  lifetime_points: number
  current_tier: string
  tier_progress: number
  join_date: string
  last_activity: string
  total_redemptions: number
  available_rewards: LoyaltyReward[]
  transaction_history: LoyaltyTransaction[]
}

interface LoyaltyTransaction {
  id: string
  customer_id: string
  customer_name: string
  transaction_type: 'earned' | 'redeemed' | 'bonus' | 'expired' | 'adjustment'
  points: number
  balance_after: number
  description: string
  reference_id?: string
  reference_type?: string
  created_at: string
}

interface LoyaltyAnalytics {
  totalMembers: number
  activeMembers: number
  totalPointsIssued: number
  totalPointsBalance: number
  totalRedemptions: number
  averagePointsPerMember: number
  redemptionRate: string
  tierDistribution: { [key: string]: number }
  recentActivity: {
    earned: number
    redeemed: number
  }
  topMembers: Array<{
    id: string
    name: string
    points: number
    tier: string
  }>
}

export default function LoyaltyPage() {
  const router = useRouter()
  const { currentOrganization, contextLoading } = useMultiOrgAuth()
  const organizationId = currentOrganization?.id || DEFAULT_ORG_ID
  const { toast } = useToast()
  const { settings } = useSalonSettings()

  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [program, setProgram] = useState<LoyaltyProgram | null>(null)
  const [analytics, setAnalytics] = useState<LoyaltyAnalytics | null>(null)
  const [customers, setCustomers] = useState<CustomerLoyalty[]>([])
  const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([])
  const [rewards, setRewards] = useState<LoyaltyReward[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerLoyalty | null>(null)

  // Dialog states
  const [showAddPointsDialog, setShowAddPointsDialog] = useState(false)
  const [showRedeemDialog, setShowRedeemDialog] = useState(false)
  const [showCreateRewardDialog, setShowCreateRewardDialog] = useState(false)
  const [showCustomerDetailsDialog, setShowCustomerDetailsDialog] = useState(false)
  
  // Form states
  const [pointsForm, setPointsForm] = useState({
    customerId: '',
    points: '',
    description: '',
    type: 'earned'
  })
  
  const [rewardForm, setRewardForm] = useState({
    name: '',
    description: '',
    pointsRequired: '',
    rewardType: 'discount' as 'discount' | 'service' | 'product' | 'cash_value',
    rewardValue: '',
    stock: '',
    expiresInDays: '30'
  })

  useEffect(() => {
    if (organizationId && !contextLoading) {
      fetchLoyaltyData()
    }
  }, [organizationId, contextLoading])

  const fetchLoyaltyData = async (type?: string) => {
    try {
      setLoading(true)
      const url = `/api/v1/salon/loyalty?organization_id=${organizationId}${type ? `&type=${type}` : ''}`
      const response = await fetch(url)
      const data = await response.json()
      
      if (data.success) {
        setProgram(data.program)
        
        if (type === 'customers') {
          setCustomers(data.customers || [])
        } else if (type === 'transactions') {
          setTransactions(data.transactions || [])
        } else if (type === 'rewards') {
          setRewards(data.rewards || [])
        } else {
          setAnalytics(data.analytics || null)
        }
      }
    } catch (error) {
      console.error('Error fetching loyalty data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load loyalty data',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddPoints = async () => {
    if (!pointsForm.customerId || !pointsForm.points) {
      toast({
        title: 'Error',
        description: 'Please select a customer and enter points',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await fetch('/api/v1/salon/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          action: 'add_points',
          data: {
            customerId: pointsForm.customerId,
            points: parseInt(pointsForm.points),
            description: pointsForm.description || 'Manual points addition'
          }
        })
      })

      if (!response.ok) throw new Error('Failed to add points')

      toast({
        title: 'Success',
        description: 'Points added successfully'
      })

      setShowAddPointsDialog(false)
      setPointsForm({ customerId: '', points: '', description: '', type: 'earned' })
      fetchLoyaltyData('customers')
      fetchLoyaltyData('transactions')
    } catch (error) {
      console.error('Error adding points:', error)
      toast({
        title: 'Error',
        description: 'Failed to add points',
        variant: 'destructive'
      })
    }
  }

  const handleRedeemReward = async (customerId: string, rewardId: string) => {
    try {
      const response = await fetch('/api/v1/salon/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          action: 'redeem_reward',
          data: { customerId, rewardId }
        })
      })

      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to redeem reward')
      }

      toast({
        title: 'Success',
        description: `Reward redeemed successfully! New balance: ${result.newBalance} points`
      })

      setShowRedeemDialog(false)
      fetchLoyaltyData('customers')
      fetchLoyaltyData('transactions')
    } catch (error) {
      console.error('Error redeeming reward:', error)
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to redeem reward',
        variant: 'destructive'
      })
    }
  }

  const handleCreateReward = async () => {
    if (!rewardForm.name || !rewardForm.pointsRequired || !rewardForm.rewardValue) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    try {
      const response = await fetch('/api/v1/salon/loyalty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          action: 'create_reward',
          data: {
            name: rewardForm.name,
            description: rewardForm.description,
            pointsRequired: parseInt(rewardForm.pointsRequired),
            rewardType: rewardForm.rewardType,
            rewardValue: parseFloat(rewardForm.rewardValue),
            stock: rewardForm.stock ? parseInt(rewardForm.stock) : undefined,
            expiresInDays: parseInt(rewardForm.expiresInDays)
          }
        })
      })

      if (!response.ok) throw new Error('Failed to create reward')

      toast({
        title: 'Success',
        description: 'Reward created successfully'
      })

      setShowCreateRewardDialog(false)
      setRewardForm({
        name: '',
        description: '',
        pointsRequired: '',
        rewardType: 'discount',
        rewardValue: '',
        stock: '',
        expiresInDays: '30'
      })
      fetchLoyaltyData('rewards')
    } catch (error) {
      console.error('Error creating reward:', error)
      toast({
        title: 'Error',
        description: 'Failed to create reward',
        variant: 'destructive'
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return `${settings?.payment_settings.currency || 'AED'} ${amount.toFixed(2)}`
  }

  const getTierIcon = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'bronze':
        return <Award className="w-5 h-5" />
      case 'silver':
        return <Star className="w-5 h-5" />
      case 'gold':
        return <Crown className="w-5 h-5" />
      case 'platinum':
        return <Gem className="w-5 h-5" />
      default:
        return <Trophy className="w-5 h-5" />
    }
  }

  const getRewardTypeIcon = (type: string) => {
    switch (type) {
      case 'discount':
        return <Tag className="w-4 h-4" />
      case 'service':
        return <Scissors className="w-4 h-4" />
      case 'product':
        return <ShoppingBag className="w-4 h-4" />
      case 'cash_value':
        return <DollarSign className="w-4 h-4" />
      default:
        return <Gift className="w-4 h-4" />
    }
  }

  const filteredCustomers = customers.filter(customer => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      customer.customer_name.toLowerCase().includes(search) ||
      customer.customer_email?.toLowerCase().includes(search) ||
      customer.customer_phone?.includes(search)
    )
  })

  if (contextLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-600" />
          <p className="text-gray-600">Loading loyalty program...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-white flex">
      <SalonProductionSidebar />
      <div className="flex-1 ml-16">
        <div className="p-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push('/salon')}
              className="mb-4"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {program?.name || 'Loyalty Program'}
                </h1>
                <p className="text-gray-600 text-lg">
                  {program?.description || 'Reward your loyal customers'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => router.push('/salon/loyalty/settings')}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Button
                  onClick={() => setShowAddPointsDialog(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  Add Points
                </Button>
              </div>
            </div>
          </div>

          {/* Analytics Overview */}
          {analytics && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Total Members</p>
                      <p className="text-2xl font-bold">{analytics.totalMembers}</p>
                      <p className="text-sm text-green-600">
                        {analytics.activeMembers} active
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-purple-600 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Points Issued</p>
                      <p className="text-2xl font-bold">
                        {analytics.totalPointsIssued.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        {analytics.redemptionRate}% redeemed
                      </p>
                    </div>
                    <Coins className="w-8 h-8 text-yellow-600 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Points Balance</p>
                      <p className="text-2xl font-bold">
                        {analytics.totalPointsBalance.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Avg: {analytics.averagePointsPerMember}
                      </p>
                    </div>
                    <Wallet className="w-8 h-8 text-blue-600 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Recent Activity</p>
                      <p className="text-2xl font-bold">
                        {analytics.recentActivity.earned + analytics.recentActivity.redeemed}
                      </p>
                      <div className="flex gap-2 text-xs">
                        <span className="text-green-600">
                          +{analytics.recentActivity.earned}
                        </span>
                        <span className="text-red-600">
                          -{analytics.recentActivity.redeemed}
                        </span>
                      </div>
                    </div>
                    <Activity className="w-8 h-8 text-green-600 opacity-50" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Redemptions</p>
                      <p className="text-2xl font-bold">{analytics.totalRedemptions}</p>
                      <p className="text-sm text-gray-500">This month</p>
                    </div>
                    <Gift className="w-8 h-8 text-pink-600 opacity-50" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="rewards">Rewards</TabsTrigger>
              <TabsTrigger value="transactions">Transactions</TabsTrigger>
              <TabsTrigger value="tiers">Tiers</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Program Tiers */}
              <Card>
                <CardHeader>
                  <CardTitle>Loyalty Tiers</CardTitle>
                  <CardDescription>Customer progress through loyalty levels</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {program?.tiers.map((tier) => (
                      <div
                        key={tier.id}
                        className="border rounded-lg p-4 text-center"
                        style={{ borderColor: tier.color }}
                      >
                        <div className="flex justify-center mb-2" style={{ color: tier.color }}>
                          {getTierIcon(tier.name)}
                        </div>
                        <h4 className="font-semibold text-lg">{tier.name}</h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {tier.min_points}+ points
                        </p>
                        <Badge variant="outline" className="mb-3">
                          {tier.points_multiplier}x points
                        </Badge>
                        {tier.discount_percentage > 0 && (
                          <p className="text-sm font-medium text-green-600">
                            {tier.discount_percentage}% discount
                          </p>
                        )}
                        <p className="text-sm text-gray-500 mt-2">
                          {analytics?.tierDistribution[tier.name] || 0} members
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Top Members */}
              <Card>
                <CardHeader>
                  <CardTitle>Top Members</CardTitle>
                  <CardDescription>Your most loyal customers</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics?.topMembers && analytics.topMembers.length > 0 ? (
                    <div className="space-y-3">
                      {analytics.topMembers.map((member, index) => (
                        <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-bold text-purple-600">
                                {index + 1}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{member.name}</p>
                              <p className="text-sm text-gray-600">
                                {member.tier} Member
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{member.points.toLocaleString()}</p>
                            <p className="text-sm text-gray-500">points</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-8">No members yet</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Members Tab */}
            <TabsContent value="members" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Loyalty Members</CardTitle>
                      <CardDescription>Manage your loyalty program members</CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search members..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 w-64"
                        />
                      </div>
                      <Button
                        onClick={() => fetchLoyaltyData('customers')}
                        variant="outline"
                        size="sm"
                      >
                        Refresh
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredCustomers.length > 0 ? (
                    <div className="space-y-3">
                      {filteredCustomers.map((customer) => {
                        const currentTier = program?.tiers.find(t => t.name === customer.current_tier)
                        return (
                          <div
                            key={customer.customer_id}
                            className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                            onClick={() => {
                              setSelectedCustomer(customer)
                              setShowCustomerDetailsDialog(true)
                            }}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-medium">{customer.customer_name}</h4>
                                  <Badge
                                    variant="outline"
                                    style={{ 
                                      borderColor: currentTier?.color,
                                      color: currentTier?.color
                                    }}
                                  >
                                    {customer.current_tier}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                                  <div>
                                    <p className="font-medium text-gray-700">Points Balance</p>
                                    <p className="text-lg font-bold text-purple-600">
                                      {customer.points_balance.toLocaleString()}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-700">Lifetime Points</p>
                                    <p>{customer.lifetime_points.toLocaleString()}</p>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-700">Redemptions</p>
                                    <p>{customer.total_redemptions}</p>
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-700">Member Since</p>
                                    <p>{new Date(customer.join_date).toLocaleDateString()}</p>
                                  </div>
                                </div>
                                {customer.tier_progress < 100 && (
                                  <div className="mt-3">
                                    <div className="flex items-center justify-between text-sm mb-1">
                                      <span className="text-gray-600">Progress to next tier</span>
                                      <span className="font-medium">{customer.tier_progress.toFixed(0)}%</span>
                                    </div>
                                    <Progress value={customer.tier_progress} className="h-2" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setPointsForm({ ...pointsForm, customerId: customer.customer_id })
                                    setShowAddPointsDialog(true)
                                  }}
                                >
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add Points
                                </Button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No members found</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Rewards Tab */}
            <TabsContent value="rewards" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Available Rewards</CardTitle>
                      <CardDescription>Rewards that customers can redeem</CardDescription>
                    </div>
                    <Button
                      onClick={() => setShowCreateRewardDialog(true)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Reward
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {rewards.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {rewards.map((reward) => (
                        <Card key={reward.id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-2">
                                {getRewardTypeIcon(reward.reward_type)}
                                <Badge variant="outline">{reward.reward_type}</Badge>
                              </div>
                              <p className="text-lg font-bold text-purple-600">
                                {reward.points_required} pts
                              </p>
                            </div>
                            <h4 className="font-semibold mb-2">{reward.name}</h4>
                            <p className="text-sm text-gray-600 mb-4">{reward.description}</p>
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Value</span>
                                <span className="font-medium">
                                  {reward.reward_type === 'discount'
                                    ? `${reward.reward_value}% off`
                                    : formatCurrency(reward.reward_value)}
                                </span>
                              </div>
                              {reward.stock !== undefined && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">Stock</span>
                                  <span className={`font-medium ${reward.stock < 5 ? 'text-red-600' : ''}`}>
                                    {reward.stock} left
                                  </span>
                                </div>
                              )}
                              {reward.expires_in_days && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">Expires</span>
                                  <span className="font-medium">{reward.expires_in_days} days</span>
                                </div>
                              )}
                              {reward.redemption_count !== undefined && (
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-500">Redeemed</span>
                                  <span className="font-medium">{reward.redemption_count} times</span>
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No rewards created yet</p>
                      <Button onClick={() => setShowCreateRewardDialog(true)}>
                        Create First Reward
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Transactions Tab */}
            <TabsContent value="transactions" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Points Transactions</CardTitle>
                      <CardDescription>Recent loyalty points activity</CardDescription>
                    </div>
                    <Button
                      onClick={() => fetchLoyaltyData('transactions')}
                      variant="outline"
                      size="sm"
                    >
                      Refresh
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {transactions.length > 0 ? (
                    <div className="space-y-2">
                      {transactions.map((transaction) => (
                        <div key={transaction.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <p className="font-medium">{transaction.customer_name}</p>
                                <Badge
                                  variant={transaction.transaction_type === 'redeemed' ? 'destructive' : 'default'}
                                >
                                  {transaction.transaction_type}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{transaction.description}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(transaction.created_at).toLocaleString()}
                              </p>
                            </div>
                            <div className="text-right ml-4">
                              <p className={`text-lg font-bold ${
                                transaction.points > 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {transaction.points > 0 ? '+' : ''}{transaction.points}
                              </p>
                              <p className="text-sm text-gray-500">
                                Balance: {transaction.balance_after}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No transactions yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tiers Tab */}
            <TabsContent value="tiers" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tier Benefits</CardTitle>
                  <CardDescription>Detailed breakdown of tier benefits and requirements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {program?.tiers.map((tier) => (
                      <div key={tier.id} className="border rounded-lg p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div style={{ color: tier.color }}>
                              {getTierIcon(tier.name)}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold">{tier.name} Tier</h3>
                              <p className="text-sm text-gray-600">
                                Requires {tier.min_points.toLocaleString()} lifetime points
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Members</p>
                            <p className="text-2xl font-bold">
                              {analytics?.tierDistribution[tier.name] || 0}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-medium mb-3">Key Benefits</h4>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Coins className="w-4 h-4 text-yellow-600" />
                                <span className="text-sm">
                                  Earn {tier.points_multiplier}x points on every purchase
                                </span>
                              </div>
                              {tier.discount_percentage > 0 && (
                                <div className="flex items-center gap-2">
                                  <Tag className="w-4 h-4 text-green-600" />
                                  <span className="text-sm">
                                    {tier.discount_percentage}% discount on all services
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-3">Additional Perks</h4>
                            <ul className="space-y-1">
                              {tier.benefits.map((benefit, index) => (
                                <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                                  <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
                                  <span>{benefit}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Add Points Dialog */}
          <Dialog open={showAddPointsDialog} onOpenChange={setShowAddPointsDialog}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Loyalty Points</DialogTitle>
                <DialogDescription>
                  Award points to a customer manually
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="customer">Customer</Label>
                  <Select
                    value={pointsForm.customerId}
                    onValueChange={(value) => setPointsForm({ ...pointsForm, customerId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.customer_id} value={customer.customer_id}>
                          {customer.customer_name} ({customer.points_balance} pts)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="points">Points to Add</Label>
                  <Input
                    id="points"
                    type="number"
                    value={pointsForm.points}
                    onChange={(e) => setPointsForm({ ...pointsForm, points: e.target.value })}
                    placeholder="100"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={pointsForm.description}
                    onChange={(e) => setPointsForm({ ...pointsForm, description: e.target.value })}
                    placeholder="Reason for adding points..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddPointsDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddPoints}>
                  Add Points
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Create Reward Dialog */}
          <Dialog open={showCreateRewardDialog} onOpenChange={setShowCreateRewardDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Reward</DialogTitle>
                <DialogDescription>
                  Add a new reward to your loyalty program
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rewardName">Reward Name</Label>
                  <Input
                    id="rewardName"
                    value={rewardForm.name}
                    onChange={(e) => setRewardForm({ ...rewardForm, name: e.target.value })}
                    placeholder="10% Off Any Service"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pointsRequired">Points Required</Label>
                  <Input
                    id="pointsRequired"
                    type="number"
                    value={rewardForm.pointsRequired}
                    onChange={(e) => setRewardForm({ ...rewardForm, pointsRequired: e.target.value })}
                    placeholder="500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={rewardForm.description}
                  onChange={(e) => setRewardForm({ ...rewardForm, description: e.target.value })}
                  placeholder="Get 10% discount on your next service"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="rewardType">Reward Type</Label>
                  <Select
                    value={rewardForm.rewardType}
                    onValueChange={(value: any) => setRewardForm({ ...rewardForm, rewardType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="discount">Discount Percentage</SelectItem>
                      <SelectItem value="cash_value">Cash Value</SelectItem>
                      <SelectItem value="service">Free Service</SelectItem>
                      <SelectItem value="product">Free Product</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rewardValue">
                    {rewardForm.rewardType === 'discount' ? 'Discount %' : 'Value (AED)'}
                  </Label>
                  <Input
                    id="rewardValue"
                    type="number"
                    value={rewardForm.rewardValue}
                    onChange={(e) => setRewardForm({ ...rewardForm, rewardValue: e.target.value })}
                    placeholder={rewardForm.rewardType === 'discount' ? '10' : '50'}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="stock">Stock (Optional)</Label>
                  <Input
                    id="stock"
                    type="number"
                    value={rewardForm.stock}
                    onChange={(e) => setRewardForm({ ...rewardForm, stock: e.target.value })}
                    placeholder="Leave empty for unlimited"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiresInDays">Expires In (Days)</Label>
                  <Input
                    id="expiresInDays"
                    type="number"
                    value={rewardForm.expiresInDays}
                    onChange={(e) => setRewardForm({ ...rewardForm, expiresInDays: e.target.value })}
                    placeholder="30"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateRewardDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateReward}>
                  Create Reward
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Customer Details Dialog */}
          <Dialog open={showCustomerDetailsDialog} onOpenChange={setShowCustomerDetailsDialog}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedCustomer?.customer_name}</DialogTitle>
                <DialogDescription>
                  Loyalty member details and transaction history
                </DialogDescription>
              </DialogHeader>
              {selectedCustomer && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Member Information</h4>
                      <dl className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Current Tier</dt>
                          <dd className="font-medium">{selectedCustomer.current_tier}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Points Balance</dt>
                          <dd className="font-bold text-purple-600">
                            {selectedCustomer.points_balance.toLocaleString()}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Lifetime Points</dt>
                          <dd className="font-medium">
                            {selectedCustomer.lifetime_points.toLocaleString()}
                          </dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Member Since</dt>
                          <dd className="font-medium">
                            {new Date(selectedCustomer.join_date).toLocaleDateString()}
                          </dd>
                        </div>
                      </dl>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3">Contact Information</h4>
                      <dl className="space-y-2 text-sm">
                        {selectedCustomer.customer_email && (
                          <div className="flex justify-between">
                            <dt className="text-gray-600">Email</dt>
                            <dd className="font-medium">{selectedCustomer.customer_email}</dd>
                          </div>
                        )}
                        {selectedCustomer.customer_phone && (
                          <div className="flex justify-between">
                            <dt className="text-gray-600">Phone</dt>
                            <dd className="font-medium">{selectedCustomer.customer_phone}</dd>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Total Redemptions</dt>
                          <dd className="font-medium">{selectedCustomer.total_redemptions}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt className="text-gray-600">Last Activity</dt>
                          <dd className="font-medium">
                            {new Date(selectedCustomer.last_activity).toLocaleDateString()}
                          </dd>
                        </div>
                      </dl>
                    </div>
                  </div>

                  {selectedCustomer.available_rewards.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3">Available Rewards</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {selectedCustomer.available_rewards.map((reward) => (
                          <div key={reward.id} className="border rounded-lg p-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-sm">{reward.name}</p>
                                <p className="text-xs text-gray-600">{reward.points_required} points</p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleRedeemReward(selectedCustomer.customer_id, reward.id)}
                              >
                                Redeem
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium mb-3">Recent Transactions</h4>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {selectedCustomer.transaction_history.slice(0, 10).map((transaction) => (
                        <div key={transaction.id} className="border rounded p-3">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium">{transaction.description}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(transaction.created_at).toLocaleString()}
                              </p>
                            </div>
                            <div className={`font-bold ${
                              transaction.points > 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {transaction.points > 0 ? '+' : ''}{transaction.points}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  )
}

// Add missing imports
import { Tag } from 'lucide-react'
import { DollarSign } from 'lucide-react'
import { Scissors } from 'lucide-react'
import { Wallet } from 'lucide-react'