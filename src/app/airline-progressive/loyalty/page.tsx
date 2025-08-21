'use client'

import React, { useState, useEffect } from 'react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { AirlineTeamsSidebar } from '@/components/airline-progressive/AirlineTeamsSidebar'
import { 
  Star, Trophy, TrendingUp, Gift, Plane, Users, 
  Crown, Shield, Zap, Target, Award, Heart,
  Coffee, Wifi, Luggage, CreditCard, Calendar,
  ChevronRight, Info, Lock, Unlock, Check,
  ArrowUp, ArrowDown, Sparkles, Gem, Medal,
  AlertCircle, Car, Building2, Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { motion } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface TierBenefit {
  name: string
  description: string
  icon: React.ReactNode
  available: boolean
}

interface LoyaltyTier {
  name: string
  icon: React.ReactNode
  color: string
  bgGradient: string
  milesRequired: number
  benefits: TierBenefit[]
  bonusRate: number
}

interface Milestone {
  id: string
  name: string
  description: string
  miles: number
  completed: boolean
  reward: string
  icon: React.ReactNode
}

interface Transaction {
  id: string
  date: string
  description: string
  miles: number
  type: 'earned' | 'redeemed' | 'expired'
  status: 'completed' | 'pending'
}

export default function AirlineLoyaltyPage() {
  const { workspace, isAnonymous, updateData } = useMultiOrgAuth()
  const [currentMiles, setCurrentMiles] = useState(12450)
  const [lifetimeMiles, setLifetimeMiles] = useState(87650)
  const [currentTier, setCurrentTier] = useState('gold')
  const [selectedTab, setSelectedTab] = useState('overview')
  const [milesExpiring, setMilesExpiring] = useState(2500)
  const [expiringDate, setExpiringDate] = useState('2025-12-31')

  // Define loyalty tiers
  const tiers: Record<string, LoyaltyTier> = {
    silver: {
      name: 'Silver',
      icon: <Medal className="w-6 h-6" />,
      color: 'text-gray-600',
      bgGradient: 'from-gray-200 to-gray-300',
      milesRequired: 0,
      bonusRate: 1.25,
      benefits: [
        { name: 'Priority Check-in', description: 'Skip regular lines', icon: <Check className="w-4 h-4" />, available: true },
        { name: '25% Bonus Miles', description: 'On all flights', icon: <TrendingUp className="w-4 h-4" />, available: true },
        { name: 'Seat Selection', description: '24 hours early', icon: <Users className="w-4 h-4" />, available: true },
        { name: 'Extra Baggage', description: '10kg additional', icon: <Luggage className="w-4 h-4" />, available: false },
      ]
    },
    gold: {
      name: 'Gold',
      icon: <Crown className="w-6 h-6" />,
      color: 'text-yellow-600',
      bgGradient: 'from-yellow-400 to-orange-500',
      milesRequired: 10000,
      bonusRate: 1.5,
      benefits: [
        { name: 'Priority Check-in', description: 'Skip regular lines', icon: <Check className="w-4 h-4" />, available: true },
        { name: '50% Bonus Miles', description: 'On all flights', icon: <TrendingUp className="w-4 h-4" />, available: true },
        { name: 'Lounge Access', description: '2 visits per year', icon: <Coffee className="w-4 h-4" />, available: true },
        { name: 'Extra Baggage', description: '20kg additional', icon: <Luggage className="w-4 h-4" />, available: true },
        { name: 'Priority Boarding', description: 'Board first', icon: <Plane className="w-4 h-4" />, available: true },
        { name: 'Free WiFi', description: 'On all flights', icon: <Wifi className="w-4 h-4" />, available: false },
      ]
    },
    platinum: {
      name: 'Platinum',
      icon: <Gem className="w-6 h-6" />,
      color: 'text-purple-600',
      bgGradient: 'from-purple-500 to-indigo-600',
      milesRequired: 50000,
      bonusRate: 2.0,
      benefits: [
        { name: 'Priority Everything', description: 'VIP treatment', icon: <Star className="w-4 h-4" />, available: true },
        { name: '100% Bonus Miles', description: 'Double miles always', icon: <TrendingUp className="w-4 h-4" />, available: true },
        { name: 'Unlimited Lounge', description: 'Plus 2 guests', icon: <Coffee className="w-4 h-4" />, available: true },
        { name: 'Extra Baggage', description: '30kg additional', icon: <Luggage className="w-4 h-4" />, available: true },
        { name: 'Free WiFi', description: 'Unlimited on all flights', icon: <Wifi className="w-4 h-4" />, available: true },
        { name: 'Companion Ticket', description: '1 free ticket yearly', icon: <Users className="w-4 h-4" />, available: true },
        { name: 'Concierge Service', description: '24/7 assistance', icon: <Heart className="w-4 h-4" />, available: true },
      ]
    }
  }

  // Milestones
  const milestones: Milestone[] = [
    {
      id: '1',
      name: 'First Flight',
      description: 'Complete your first flight',
      miles: 500,
      completed: true,
      reward: '500 bonus miles',
      icon: <Plane className="w-5 h-5" />
    },
    {
      id: '2',
      name: '5 Flights',
      description: 'Fly 5 times with us',
      miles: 2500,
      completed: true,
      reward: '2,500 bonus miles',
      icon: <Target className="w-5 h-5" />
    },
    {
      id: '3',
      name: 'International Traveler',
      description: 'Take your first international flight',
      miles: 5000,
      completed: true,
      reward: '5,000 bonus miles + Free WiFi voucher',
      icon: <Globe className="w-5 h-5" />
    },
    {
      id: '4',
      name: 'Loyalty Champion',
      description: 'Reach 25,000 lifetime miles',
      miles: 10000,
      completed: false,
      reward: '10,000 bonus miles + Lounge passes',
      icon: <Trophy className="w-5 h-5" />
    },
    {
      id: '5',
      name: 'Sky Master',
      description: 'Reach 100,000 lifetime miles',
      miles: 25000,
      completed: false,
      reward: '25,000 bonus miles + Companion ticket',
      icon: <Crown className="w-5 h-5" />
    }
  ]

  // Recent transactions
  const transactions: Transaction[] = [
    {
      id: '1',
      date: '2025-12-10',
      description: 'Flight AA101 - JFK to LAX',
      miles: 2750,
      type: 'earned',
      status: 'completed'
    },
    {
      id: '2',
      date: '2025-12-08',
      description: 'Upgrade Lottery Win Bonus',
      miles: 500,
      type: 'earned',
      status: 'completed'
    },
    {
      id: '3',
      date: '2025-11-28',
      description: 'Redeemed for Priority Check-in',
      miles: -1000,
      type: 'redeemed',
      status: 'completed'
    },
    {
      id: '4',
      date: '2025-11-15',
      description: 'Flight UA456 - LAX to JFK',
      miles: 2750,
      type: 'earned',
      status: 'completed'
    },
    {
      id: '5',
      date: '2025-11-01',
      description: 'Partner Hotel Stay',
      miles: 500,
      type: 'earned',
      status: 'pending'
    }
  ]

  // Calculate progress to next tier
  const getNextTier = () => {
    if (currentTier === 'silver' && lifetimeMiles >= tiers.gold.milesRequired) return 'gold'
    if (currentTier === 'gold' && lifetimeMiles >= tiers.platinum.milesRequired) return 'platinum'
    if (currentTier === 'platinum') return null
    
    if (currentTier === 'silver') return 'gold'
    if (currentTier === 'gold') return 'platinum'
    return null
  }

  const nextTier = getNextTier()
  const progressToNextTier = nextTier ? 
    ((lifetimeMiles - tiers[currentTier].milesRequired) / 
     (tiers[nextTier].milesRequired - tiers[currentTier].milesRequired)) * 100 : 100

  // Track loyalty interactions
  useEffect(() => {
    if (isAnonymous && workspace) {
      updateData((current) => ({
        ...current,
        loyaltyInteractions: (current.loyaltyInteractions || 0) + 1,
        lastLoyaltyView: new Date().toISOString(),
        interestedInLoyalty: true
      }))
    }
  }, [isAnonymous, workspace, updateData])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex">
      <AirlineTeamsSidebar />
      
      <div className="flex-1 flex flex-col ml-16">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Loyalty Program</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Earn miles, unlock rewards, and enjoy exclusive benefits
                </p>
              </div>
              <Button 
                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg"
              >
                <Gift className="w-4 h-4 mr-2" />
                Redeem Miles
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto px-8 py-6">
          {/* Tier Status Card */}
          <Card className={`mb-6 overflow-hidden bg-gradient-to-r ${tiers[currentTier].bgGradient} text-white`}>
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    {tiers[currentTier].icon}
                    <h2 className="text-3xl font-bold">{tiers[currentTier].name} Member</h2>
                  </div>
                  <div className="grid grid-cols-3 gap-8">
                    <div>
                      <p className="text-white/80 text-sm">Current Miles</p>
                      <p className="text-3xl font-bold">{currentMiles.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-white/80 text-sm">Lifetime Miles</p>
                      <p className="text-3xl font-bold">{lifetimeMiles.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-white/80 text-sm">Bonus Rate</p>
                      <p className="text-3xl font-bold">{tiers[currentTier].bonusRate}x</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-white/20 text-white border-white/30 px-4 py-2">
                    Member since 2023
                  </Badge>
                </div>
              </div>

              {/* Progress to Next Tier */}
              {nextTier && (
                <div className="mt-6 pt-6 border-t border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white/80">Progress to {tiers[nextTier].name}</span>
                    <span className="font-medium">
                      {(tiers[nextTier].milesRequired - lifetimeMiles).toLocaleString()} miles to go
                    </span>
                  </div>
                  <Progress value={progressToNextTier} className="h-2 bg-white/20" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expiring Miles Alert */}
          {milesExpiring > 0 && (
            <Alert className="mb-6 border-orange-200 bg-orange-50">
              <AlertCircle className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-800">Miles Expiring Soon</AlertTitle>
              <AlertDescription className="text-orange-700">
                You have {milesExpiring.toLocaleString()} miles expiring on {new Date(expiringDate).toLocaleDateString()}.
                <Button variant="link" className="text-orange-700 font-semibold p-0 h-auto">
                  Redeem Now
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="benefits">Benefits</TabsTrigger>
              <TabsTrigger value="milestones">Milestones</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Miles This Year
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">15,750</span>
                      <Badge className="bg-green-100 text-green-700">
                        <ArrowUp className="w-3 h-3 mr-1" />
                        32%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Flights This Year
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">12</span>
                      <Badge className="bg-blue-100 text-blue-700">
                        <Plane className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-gray-600">
                      Lottery Entries
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">8</span>
                      <Badge className="bg-purple-100 text-purple-700">
                        <Trophy className="w-3 h-3 mr-1" />
                        2 Wins
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Tier Comparison */}
              <Card>
                <CardHeader>
                  <CardTitle>Tier Benefits Comparison</CardTitle>
                  <CardDescription>See what each tier offers</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Object.entries(tiers).map(([key, tier]) => (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-6 rounded-lg border-2 ${
                          key === currentTier 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${tier.bgGradient}`}>
                            {tier.icon}
                          </div>
                          <div>
                            <h3 className="font-semibold">{tier.name}</h3>
                            <p className="text-sm text-gray-600">
                              {tier.milesRequired.toLocaleString()}+ miles
                            </p>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Bonus Rate</span>
                            <span className="font-medium">{tier.bonusRate}x</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Benefits</span>
                            <span className="font-medium">{tier.benefits.length}</span>
                          </div>
                        </div>
                        {key === currentTier && (
                          <Badge className="mt-4 w-full justify-center">
                            Current Tier
                          </Badge>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Benefits Tab */}
            <TabsContent value="benefits" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Your {tiers[currentTier].name} Benefits</CardTitle>
                  <CardDescription>
                    Exclusive perks and privileges for {tiers[currentTier].name} members
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {tiers[currentTier].benefits.map((benefit, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${
                          benefit.available 
                            ? 'border-green-200 bg-green-50' 
                            : 'border-gray-200 bg-gray-50 opacity-60'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${
                            benefit.available ? 'bg-green-100' : 'bg-gray-200'
                          }`}>
                            {benefit.icon}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium flex items-center gap-2">
                              {benefit.name}
                              {benefit.available ? (
                                <Unlock className="w-4 h-4 text-green-600" />
                              ) : (
                                <Lock className="w-4 h-4 text-gray-400" />
                              )}
                            </h4>
                            <p className="text-sm text-gray-600">{benefit.description}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Partner Benefits */}
              <Card>
                <CardHeader>
                  <CardTitle>Partner Benefits</CardTitle>
                  <CardDescription>Earn and redeem miles with our partners</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <CreditCard className="w-5 h-5 text-blue-600" />
                        <h4 className="font-medium">Credit Cards</h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        Earn 2 miles per $1 spent on partner cards
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <Building2 className="w-5 h-5 text-purple-600" />
                        <h4 className="font-medium">Hotels</h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        500 miles per night at partner hotels
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center gap-3 mb-2">
                        <Car className="w-5 h-5 text-green-600" />
                        <h4 className="font-medium">Car Rentals</h4>
                      </div>
                      <p className="text-sm text-gray-600">
                        250 miles per rental day
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Milestones Tab */}
            <TabsContent value="milestones" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Achievement Milestones</CardTitle>
                  <CardDescription>
                    Complete challenges to earn bonus miles and exclusive rewards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {milestones.map((milestone) => (
                      <motion.div
                        key={milestone.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 rounded-lg border ${
                          milestone.completed 
                            ? 'border-green-200 bg-green-50' 
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${
                              milestone.completed 
                                ? 'bg-green-100 text-green-600' 
                                : 'bg-gray-200 text-gray-400'
                            }`}>
                              {milestone.icon}
                            </div>
                            <div>
                              <h4 className="font-medium flex items-center gap-2">
                                {milestone.name}
                                {milestone.completed && (
                                  <Badge className="bg-green-100 text-green-700">
                                    <Check className="w-3 h-3 mr-1" />
                                    Completed
                                  </Badge>
                                )}
                              </h4>
                              <p className="text-sm text-gray-600">{milestone.description}</p>
                              <p className="text-sm font-medium text-purple-600 mt-1">
                                Reward: {milestone.reward}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold">
                              +{milestone.miles.toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600">miles</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Miles History</CardTitle>
                  <CardDescription>Your recent earning and redemption activity</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 rounded-lg bg-gray-50"
                      >
                        <div className="flex items-center gap-4">
                          <div className={`p-2 rounded-lg ${
                            transaction.type === 'earned' 
                              ? 'bg-green-100 text-green-600' 
                              : 'bg-red-100 text-red-600'
                          }`}>
                            {transaction.type === 'earned' ? (
                              <ArrowUp className="w-4 h-4" />
                            ) : (
                              <ArrowDown className="w-4 h-4" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{transaction.description}</p>
                            <p className="text-sm text-gray-600">
                              {new Date(transaction.date).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`text-lg font-bold ${
                            transaction.type === 'earned' 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {transaction.type === 'earned' ? '+' : ''}
                            {transaction.miles.toLocaleString()}
                          </p>
                          <Badge variant={transaction.status === 'completed' ? 'default' : 'secondary'}>
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* CTA for Anonymous Users */}
          {isAnonymous && (
            <Card className="mt-8 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
              <CardContent className="p-8 text-center">
                <Sparkles className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Join Our Loyalty Program</h3>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Start earning miles today! Create an account to track your rewards, 
                  unlock exclusive benefits, and save on future flights.
                </p>
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:shadow-lg"
                  onClick={() => window.location.href = '/auth/register'}
                >
                  Join Now - It's Free
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}