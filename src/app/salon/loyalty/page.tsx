// TODO: Update this page to use production data from useLoyalty_program
// 1. Replace hardcoded data arrays with: const data = items.map(transformToUILoyalty_program)
// 2. Update create handlers to use: await createLoyalty_program(formData)
// 3. Update delete handlers to use: await deleteLoyalty_program(id)
// 4. Replace loading states with: loading ? <Skeleton /> : <YourComponent />

'use client'

import { useAuth } from '@/components/auth/DualAuthProvider'
import { useUserContext } from '@/hooks/useUserContext'
import { useLoyalty_program } from '@/hooks/useLoyalty_program'

import React, { useState, useEffect } from 'react'
import '../salon-styles.css'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SalonProductionSidebar } from '@/components/salon/SalonProductionSidebar'
import { 
  Crown, 
  Search, 
  Plus, 
  Gift,
  Star,
  Users,
  TrendingUp,
  Save,
  TestTube,
  ArrowLeft,
  Award,
  Heart,
  Sparkles,
  Calendar,
  DollarSign,
  Trophy,
  Target,
  Zap,
  AlertCircle,
  Loader2
} from 'lucide-react'
import Link from 'next/link'

// Progressive Demo Data
const initialLoyaltyMembers = [
  {
    id: 1,
    clientName: 'Sarah Johnson',
    email: 'sarah@email.com',
    phone: '(555) 123-4567',
    tier: 'gold',
    points: 850,
    totalSpent: 1240,
    visits: 12,
    joinDate: '2024-06-15',
    birthday: '1992-05-15',
    lastVisit: '2025-01-05',
    nextReward: 'Free Hair Treatment',
    pointsToNextTier: 150,
    preferences: 'Loves color services',
    status: 'active'
  },
  {
    id: 2,
    clientName: 'Lisa Wang',
    email: 'lisa@email.com',
    phone: '(555) 456-7890',
    tier: 'platinum',
    points: 1200,
    totalSpent: 2150,
    visits: 18,
    joinDate: '2024-03-10',
    birthday: '1995-12-08',
    lastVisit: '2025-01-08',
    nextReward: 'VIP Event Access',
    pointsToNextTier: 0,
    preferences: 'Experimental styles',
    status: 'vip'
  },
  {
    id: 3,
    clientName: 'Mike Chen',
    email: 'mike@email.com',
    phone: '(555) 987-6543',
    tier: 'silver',
    points: 420,
    totalSpent: 380,
    visits: 8,
    joinDate: '2024-08-20',
    birthday: '1988-09-22',
    lastVisit: '2025-01-02',
    nextReward: 'Free Beard Trim',
    pointsToNextTier: 80,
    preferences: 'Quick services',
    status: 'active'
  },
  {
    id: 4,
    clientName: 'Emma Rodriguez',
    email: 'emma@email.com',
    phone: '(555) 321-9876',
    tier: 'bronze',
    points: 180,
    totalSpent: 240,
    visits: 3,
    joinDate: '2024-11-05',
    birthday: '1990-08-14',
    lastVisit: '2024-12-20',
    nextReward: 'First Visit Bonus',
    pointsToNextTier: 70,
    preferences: 'Natural products',
    status: 'new'
  }
]

const loyaltyTiers = {
  bronze: {
    name: 'Bronze',
    minPoints: 0,
    color: 'bg-orange-100 text-orange-800 border-orange-200',
    icon: <Award className="h-4 w-4" />,
    benefits: ['5% discount', 'Birthday bonus', 'Special offers'],
    pointsPerDollar: 1
  },
  silver: {
    name: 'Silver',
    minPoints: 250,
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: <Star className="h-4 w-4" />,
    benefits: ['10% discount', 'Priority booking', 'Free treatments monthly'],
    pointsPerDollar: 1.25
  },
  gold: {
    name: 'Gold',
    minPoints: 500,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: <Trophy className="h-4 w-4" />,
    benefits: ['15% discount', 'VIP services', 'Free styling consultation'],
    pointsPerDollar: 1.5
  },
  platinum: {
    name: 'Platinum',
    minPoints: 1000,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: <Crown className="h-4 w-4" />,
    benefits: ['20% discount', 'Personal stylist', 'Exclusive events', 'Free products'],
    pointsPerDollar: 2
  }
}

const rewardCatalog = [
  { id: 1, name: 'Free Haircut', points: 200, category: 'services', popular: true },
  { id: 2, name: 'Hair Treatment', points: 150, category: 'treatments', popular: false },
  { id: 3, name: 'Professional Products', points: 100, category: 'products', popular: true },
  { id: 4, name: 'Styling Session', points: 180, category: 'services', popular: false },
  { id: 5, name: 'VIP Day Package', points: 500, category: 'packages', popular: true },
  { id: 6, name: 'Color Touch-up', points: 250, category: 'services', popular: false }
]

interface LoyaltyMember {
  id: number
  clientName: string
  email: string
  phone: string
  tier: 'bronze' | 'silver' | 'gold' | 'platinum'
  points: number
  totalSpent: number
  visits: number
  joinDate: string
  birthday: string
  lastVisit: string
  nextReward: string
  pointsToNextTier: number
  preferences: string
  status: 'new' | 'active' | 'vip' | 'inactive'
}

export default function LoyaltyProgressive() {
  const { isAuthenticated } = useAuth()
  const { organizationId, userContext, loading: contextLoading } = useUserContext()
  const { 
    items, 
    stats, 
    loading, 
    error, 
    refetch, 
    createLoyalty_program, 
    updateLoyalty_program, 
    deleteLoyalty_program 
  } = useLoyalty_program(organizationId)

  const [testMode, setTestMode] = useState(true)
  const [members, setMembers] = useState<LoyaltyMember[]>(initialLoyaltyMembers)
  const [hasChanges, setHasChanges] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [tierFilter, setTierFilter] = useState('all')
  const [selectedMember, setSelectedMember] = useState<LoyaltyMember | null>(null)
  const [showAddPointsForm, setShowAddPointsForm] = useState(false)
  const [pointsToAdd, setPointsToAdd] = useState(0)

  // Filter members based on search and tier
  const filteredMembers = members.filter(member => {
    const matchesSearch = member.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.phone.includes(searchTerm)
    const matchesTier = tierFilter === 'all' || member.tier === tierFilter
    return matchesSearch && matchesTier
  })

  const handleSaveProgress = () => {
    setLastSaved(new Date())
    setHasChanges(false)
    console.log('Loyalty data saved:', members)
  }

  const handleAddPoints = () => {
    if (!selectedMember || pointsToAdd <= 0) return

    setMembers(prev => prev.map(m => {
      if (m.id === selectedMember.id) {
        const newPoints = m.points + pointsToAdd
        const newTier = getTierFromPoints(newPoints)
        return { 
          ...m, 
          points: newPoints, 
          tier: newTier,
          pointsToNextTier: getPointsToNextTier(newPoints, newTier)
        }
      }
      return m
    }))

    setPointsToAdd(0)
    setShowAddPointsForm(false)
    setHasChanges(true)
  }

  const getTierFromPoints = (points: number): 'bronze' | 'silver' | 'gold' | 'platinum' => {
    if (points >= 1000) return 'platinum'
    if (points >= 500) return 'gold'
    if (points >= 250) return 'silver'
    return 'bronze'
  }

  const getPointsToNextTier = (points: number, currentTier: string) => {
    if (currentTier === 'platinum') return 0
    if (currentTier === 'gold') return 1000 - points
    if (currentTier === 'silver') return 500 - points
    return 250 - points
  }

  const getProgressToNextTier = (member: LoyaltyMember) => {
    if (member.tier === 'platinum') return 100
    
    const currentMin = loyaltyTiers[member.tier].minPoints
    const nextTierMin = member.tier === 'gold' ? 1000 : 
                       member.tier === 'silver' ? 500 : 250

    return ((member.points - currentMin) / (nextTierMin - currentMin)) * 100
  }

  const getLoyaltyStats = () => {
    return {
      totalMembers: members.length,
      activeMembers: members.filter(m => m.status === 'active' || m.status === 'vip').length,
      newThisMonth: members.filter(m => {
        const joinMonth = new Date(m.joinDate).getMonth()
        const currentMonth = new Date().getMonth()
        return joinMonth === currentMonth
      }).length,
      totalPointsAwarded: members.reduce((sum, m) => sum + m.points, 0),
      avgPointsPerMember: Math.round(members.reduce((sum, m) => sum + m.points, 0) / members.length),
      tierDistribution: {
        bronze: members.filter(m => m.tier === 'bronze').length,
        silver: members.filter(m => m.tier === 'silver').length,
        gold: members.filter(m => m.tier === 'gold').length,
        platinum: members.filter(m => m.tier === 'platinum').length
      }
    }
  }

  const loyaltyStats = getLoyaltyStats()

  // Layer 1: Authentication Check
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access the loyalty program.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Layer 2: Context Loading Check
  if (contextLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-pink-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading organization context...</p>
        </div>
      </div>
    )
  }

  // Layer 3: Organization Check
  if (!organizationId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No organization found. Please complete setup.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex">
      {/* Teams-Style Sidebar */}
      <SalonProductionSidebar />
      
      <div className="flex-1 flex flex-col ml-16">
        {/* Progressive Header */}
        <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
          <div className="px-8 py-4">
            <div className="flex items-center justify-between">
            <div className="text-right">
              {userContext && (
                <>
                  <p className="text-sm font-medium">{userContext.user.name}</p>
                  <p className="text-xs text-gray-600">{userContext.organization.name}</p>
                </>
              )}
            </div>
              <div className="flex items-center gap-4">
                <Button variant="outline" asChild>
                  <Link href="/salon-progressive">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                    Loyalty Program
                  </h1>
                  <p className="text-sm text-gray-600">Reward your best clients and build lasting relationships</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {testMode && hasChanges && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveProgress}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Save className="h-4 w-4" />
                    Save Progress
                  </Button>
                )}

                {lastSaved && (
                  <div className="text-xs text-gray-500">
                    Saved: {lastSaved.toLocaleTimeString()}
                  </div>
                )}

                <Badge variant="secondary" className="flex items-center gap-1">
                  <TestTube className="h-3 w-3" />
                  Test Mode
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-8">
          {/* Loyalty Program Stats */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                  <p className="text-2xl font-bold text-blue-600">{loyaltyStats.totalMembers}</p>
                  <p className="text-xs text-gray-600">Total Members</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <Heart className="h-8 w-8 mx-auto mb-2 text-red-500" />
                  <p className="text-2xl font-bold text-red-600">{loyaltyStats.activeMembers}</p>
                  <p className="text-xs text-gray-600">Active</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <Sparkles className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold text-purple-600">{loyaltyStats.newThisMonth}</p>
                  <p className="text-xs text-gray-600">New This Month</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                  <p className="text-2xl font-bold text-yellow-600">{loyaltyStats.totalPointsAwarded}</p>
                  <p className="text-xs text-gray-600">Total Points</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <Target className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  <p className="text-2xl font-bold text-green-600">{loyaltyStats.avgPointsPerMember}</p>
                  <p className="text-xs text-gray-600">Avg Points</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-center">
                  <Crown className="h-8 w-8 mx-auto mb-2 text-purple-500" />
                  <p className="text-2xl font-bold text-purple-600">{loyaltyStats.tierDistribution.platinum}</p>
                  <p className="text-xs text-gray-600">Platinum VIPs</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Loyalty Tiers Overview */}
          <Card className="bg-white/80 backdrop-blur-sm mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Loyalty Tiers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {Object.entries(loyaltyTiers).map(([tier, details]) => (
                  <div key={tier} className="text-center p-4 rounded-lg border-2 border-dashed border-gray-200">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium mb-3 ${details.color}`}>
                      {details.icon}
                      {details.name}
                    </div>
                    <p className="font-semibold text-gray-800">{loyaltyStats.tierDistribution[tier as keyof typeof loyaltyStats.tierDistribution]} members</p>
                    <p className="text-xs text-gray-600 mt-1">{details.minPoints}+ points</p>
                    <div className="mt-3 text-xs text-gray-500">
                      {details.benefits.slice(0, 2).map((benefit, idx) => (
                        <p key={idx}>• {benefit}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search members by name, email, or phone..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by tier" />
              </SelectTrigger>
              <SelectContent className="hera-select-content">
                <SelectItem value="all" className="hera-select-item">All Tiers</SelectItem>
                <SelectItem value="bronze" className="hera-select-item">Bronze</SelectItem>
                <SelectItem value="silver" className="hera-select-item">Silver</SelectItem>
                <SelectItem value="gold" className="hera-select-item">Gold</SelectItem>
                <SelectItem value="platinum" className="hera-select-item">Platinum</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Members List */}
            <div className="lg:col-span-2">
              <Card className="bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="h-5 w-5 text-pink-500" />
                    Loyalty Members ({filteredMembers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {filteredMembers.map((member) => (
                      <div 
                        key={member.id} 
                        className={`p-4 border rounded-lg cursor-pointer transition-all ${
                          selectedMember?.id === member.id 
                            ? 'border-pink-300 bg-pink-50' 
                            : 'border-gray-200 hover:border-pink-200 hover:bg-pink-25'
                        }`}
                        onClick={() => setSelectedMember(member)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              member.tier === 'platinum' ? 'bg-gradient-to-br from-purple-500 to-pink-600' :
                              member.tier === 'gold' ? 'bg-gradient-to-br from-yellow-500 to-orange-600' :
                              member.tier === 'silver' ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                              'bg-gradient-to-br from-orange-500 to-red-600'
                            }`}>
                              {member.tier === 'platinum' ? <Crown className="h-5 w-5 text-white" /> :
                               member.tier === 'gold' ? <Trophy className="h-5 w-5 text-white" /> :
                               member.tier === 'silver' ? <Star className="h-5 w-5 text-white" /> :
                               <Award className="h-5 w-5 text-white" />}
                            </div>
                            <div>
                              <p className="font-medium">{member.clientName}</p>
                              <p className="text-sm text-gray-600">{member.email}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={loyaltyTiers[member.tier].color} size="sm">
                                  {loyaltyTiers[member.tier].name}
                                </Badge>
                                <span className="text-xs text-gray-500">{member.visits} visits</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-purple-600">{member.points}</p>
                            <p className="text-xs text-gray-500">points</p>
                            {member.pointsToNextTier > 0 && (
                              <p className="text-xs text-gray-400">{member.pointsToNextTier} to next</p>
                            )}
                          </div>
                        </div>
                        
                        {member.pointsToNextTier > 0 && (
                          <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                              <span>Progress to next tier</span>
                              <span>{Math.round(getProgressToNextTier(member))}%</span>
                            </div>
                            <Progress value={getProgressToNextTier(member)} className="h-1" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Member Details / Rewards */}
            <div>
              {selectedMember ? (
                <div className="space-y-4">
                  <Card className="bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <Crown className="h-5 w-5 text-pink-500" />
                          Member Profile
                        </CardTitle>
                        <Button 
                          size="sm" 
                          onClick={() => setShowAddPointsForm(true)}
                          className="bg-purple-600 hover:bg-purple-700"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Points
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="text-center pb-4 border-b">
                        <div className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
                          selectedMember.tier === 'platinum' ? 'bg-gradient-to-br from-purple-500 to-pink-600' :
                          selectedMember.tier === 'gold' ? 'bg-gradient-to-br from-yellow-500 to-orange-600' :
                          selectedMember.tier === 'silver' ? 'bg-gradient-to-br from-gray-400 to-gray-600' :
                          'bg-gradient-to-br from-orange-500 to-red-600'
                        }`}>
                          {selectedMember.tier === 'platinum' ? <Crown className="h-8 w-8 text-white" /> :
                           selectedMember.tier === 'gold' ? <Trophy className="h-8 w-8 text-white" /> :
                           selectedMember.tier === 'silver' ? <Star className="h-8 w-8 text-white" /> :
                           <Award className="h-8 w-8 text-white" />}
                        </div>
                        <h3 className="font-semibold text-lg">{selectedMember.clientName}</h3>
                        <Badge className={`${loyaltyTiers[selectedMember.tier].color} mt-2`}>
                          {loyaltyTiers[selectedMember.tier].name} Member
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <Zap className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                          <p className="font-semibold text-purple-600">{selectedMember.points}</p>
                          <p className="text-xs text-gray-600">Total Points</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <DollarSign className="h-6 w-6 text-green-600 mx-auto mb-1" />
                          <p className="font-semibold text-green-600">${selectedMember.totalSpent}</p>
                          <p className="text-xs text-gray-600">Total Spent</p>
                        </div>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Next Reward</Label>
                        <p className="text-sm text-purple-600 font-medium">{selectedMember.nextReward}</p>
                      </div>

                      <div>
                        <Label className="text-sm font-medium">Member Benefits</Label>
                        <div className="mt-2 space-y-1">
                          {loyaltyTiers[selectedMember.tier].benefits.map((benefit, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
                              <Star className="h-3 w-3 text-yellow-500" />
                              {benefit}
                            </div>
                          ))}
                        </div>
                      </div>

                      {selectedMember.pointsToNextTier > 0 && (
                        <div>
                          <Label className="text-sm font-medium">Progress to Next Tier</Label>
                          <div className="mt-2">
                            <div className="flex justify-between text-sm text-gray-600 mb-1">
                              <span>{loyaltyTiers[selectedMember.tier].name}</span>
                              <span>{selectedMember.pointsToNextTier} points to go</span>
                            </div>
                            <Progress value={getProgressToNextTier(selectedMember)} />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Add Points Form */}
                  {showAddPointsForm && (
                    <Card className="bg-white/80 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Plus className="h-5 w-5 text-pink-500" />
                          Add Points
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label htmlFor="points">Points to Add</Label>
                          <Input
                            id="points"
                            type="number"
                            min="1"
                            value={pointsToAdd}
                            onChange={(e) => setPointsToAdd(parseInt(e.target.value) || 0)}
                            placeholder="Enter points"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleAddPoints}
                            className="flex-1 bg-purple-600 hover:bg-purple-700"
                            disabled={pointsToAdd <= 0}
                          >
                            Add Points
                          </Button>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              setShowAddPointsForm(false)
                              setPointsToAdd(0)
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <Card className="bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <Crown className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-600 mb-4">Select a member to view details</p>
                    <div className="space-y-2 text-sm text-gray-500">
                      <p>• View loyalty status</p>
                      <p>• Add bonus points</p>
                      <p>• Track tier progress</p>
                      <p>• Manage rewards</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Progressive Features Notice */}
          {testMode && (
            <Card className="mt-6 bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TestTube className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Test Mode Active</p>
                    <p className="text-sm text-blue-700">
                      Manage loyalty program freely. Add points, track tiers, and reward your best clients. 
                      All changes are saved locally in test mode. Click "Save Progress" to persist your loyalty data.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}