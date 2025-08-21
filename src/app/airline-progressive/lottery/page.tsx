'use client'

import React, { useState } from 'react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'
import { AirlineTeamsSidebar } from '@/components/airline-progressive/AirlineTeamsSidebar'
import { 
  Trophy, Gift, Sparkles, Star, Zap, TrendingUp, Users,
  Clock, Calendar, Ticket, ChevronRight, Play, Crown,
  Medal, Target, Gem, Heart, DollarSign, Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function LotteryUpgradePage() {
  const { user, workspace } = useMultiOrgAuth()
  const [isSpinning, setIsSpinning] = useState(false)
  const [showWinAnimation, setShowWinAnimation] = useState(false)
  const [lastResult, setLastResult] = useState<string | null>(null)
  const [spinRotation, setSpinRotation] = useState(0)

  // User lottery stats
  const userStats = {
    entriesThisMonth: 12,
    winsAllTime: 3,
    currentStreak: 5,
    loyaltyBonus: 1.5,
    nextDrawIn: '23:47:12',
    eligibleFlights: 4
  }

  // Recent winners
  const recentWinners = [
    {
      id: 1,
      initials: 'JD',
      avatar: '👨‍💼',
      route: 'NYC → LAX',
      upgrade: 'Economy → Business',
      value: '$1,200',
      time: '2 hours ago',
      loyaltyTier: 'Gold'
    },
    {
      id: 2,
      initials: 'SM',
      avatar: '👩‍💻',
      route: 'ORD → DFW',
      upgrade: 'Economy → First',
      value: '$2,500',
      time: '5 hours ago',
      loyaltyTier: 'Platinum'
    },
    {
      id: 3,
      initials: 'AK',
      avatar: '👨‍⚕️',
      route: 'SEA → MIA',
      upgrade: 'Premium → Business',
      value: '$800',
      time: '8 hours ago',
      loyaltyTier: 'Silver'
    },
    {
      id: 4,
      initials: 'LR',
      avatar: '👩‍🎨',
      route: 'BOS → SFO',
      upgrade: 'Economy → Premium',
      value: '$450',
      time: '12 hours ago',
      loyaltyTier: 'Gold'
    }
  ]

  // Eligible flights
  const eligibleFlights = [
    {
      id: 'AA101',
      route: 'JFK → LAX',
      date: 'Dec 17, 2025',
      currentClass: 'Economy',
      possibleUpgrades: ['Premium Economy', 'Business'],
      probability: 5.2,
      smartCode: 'HERA.AIR.LOTTERY.ELIGIBLE.AA101.v1'
    },
    {
      id: 'UA456',
      route: 'LAX → JFK',
      date: 'Dec 24, 2025',
      currentClass: 'Economy',
      possibleUpgrades: ['Premium Economy', 'Business', 'First'],
      probability: 4.8,
      smartCode: 'HERA.AIR.LOTTERY.ELIGIBLE.UA456.v1'
    },
    {
      id: 'DL789',
      route: 'JFK → MIA',
      date: 'Jan 5, 2026',
      currentClass: 'Premium Economy',
      possibleUpgrades: ['Business'],
      probability: 8.3,
      smartCode: 'HERA.AIR.LOTTERY.ELIGIBLE.DL789.v1'
    }
  ]

  // Lottery prizes/tiers
  const upgradeTiers = [
    {
      tier: 'First Class',
      icon: Crown,
      color: 'from-yellow-400 to-yellow-600',
      probability: '2%',
      value: 'Up to $5,000'
    },
    {
      tier: 'Business Class',
      icon: Gem,
      color: 'from-purple-400 to-purple-600',
      probability: '5%',
      value: 'Up to $2,000'
    },
    {
      tier: 'Premium Economy',
      icon: Star,
      color: 'from-blue-400 to-blue-600',
      probability: '10%',
      value: 'Up to $500'
    }
  ]

  const handleSpin = () => {
    if (isSpinning) return
    
    setIsSpinning(true)
    setLastResult(null)
    setShowWinAnimation(false)
    
    // Calculate if user wins (25% probability)
    const isWinner = Math.random() < 0.25
    
    // Calculate random rotation (3-7 full rotations + final position)
    const baseRotations = 1080 + (Math.random() * 1440) // 3-7 rotations
    const segments = 8 // 8 possible outcomes
    const segmentDegrees = 360 / segments
    
    // Determine final position based on win/lose
    let finalPosition
    if (isWinner) {
      // Land on win segments (0-45°, 90-135°, 180-225°)
      const winSegments = [0, 2, 4] // Business, Premium, First segments
      const selectedWinSegment = winSegments[Math.floor(Math.random() * winSegments.length)]
      finalPosition = selectedWinSegment * segmentDegrees + (Math.random() * segmentDegrees)
    } else {
      // Land on lose segments (45-90°, 135-180°, 225-270°, 270-315°, 315-360°)
      const loseSegments = [1, 3, 5, 6, 7] // Better luck, Try again segments
      const selectedLoseSegment = loseSegments[Math.floor(Math.random() * loseSegments.length)]
      finalPosition = selectedLoseSegment * segmentDegrees + (Math.random() * segmentDegrees)
    }
    
    const totalRotation = baseRotations + finalPosition
    setSpinRotation(totalRotation)
    
    // Animation duration
    setTimeout(() => {
      setIsSpinning(false)
      
      if (isWinner) {
        // Determine upgrade type based on segment
        const upgradeTypes = ['Business Class', 'Premium Economy', 'First Class']
        const selectedUpgrade = upgradeTypes[Math.floor(Math.random() * upgradeTypes.length)]
        setLastResult(`🎉 WINNER! ${selectedUpgrade} Upgrade`)
        setShowWinAnimation(true)
        
        // Play celebration effect
        confettiCelebration()
      } else {
        setLastResult('Better luck next time!')
      }
      
      // Hide result after 8 seconds
      setTimeout(() => {
        setShowWinAnimation(false)
        setLastResult(null)
      }, 8000)
    }, 4000) // 4 second spin duration
  }
  
  const confettiCelebration = () => {
    // Create confetti effect
    const colors = ['#FFD700', '#FF6B35', '#F7931E', '#FFE135', '#36C9DD']
    for (let i = 0; i < 50; i++) {
      setTimeout(() => {
        createConfetti(colors[Math.floor(Math.random() * colors.length)])
      }, i * 50)
    }
  }
  
  const createConfetti = (color: string) => {
    const confetti = document.createElement('div')
    confetti.style.position = 'fixed'
    confetti.style.left = Math.random() * window.innerWidth + 'px'
    confetti.style.top = '-10px'
    confetti.style.width = '10px'
    confetti.style.height = '10px'
    confetti.style.backgroundColor = color
    confetti.style.borderRadius = '50%'
    confetti.style.pointerEvents = 'none'
    confetti.style.zIndex = '9999'
    confetti.style.animation = `confetti-fall 3s linear forwards`
    
    document.body.appendChild(confetti)
    
    setTimeout(() => {
      if (confetti.parentNode) {
        confetti.parentNode.removeChild(confetti)
      }
    }, 3000)
  }

  const shareWin = (platform: 'twitter' | 'facebook' | 'copy') => {
    const text = `🎉 I just won a ${lastResult?.split('! ')[1]?.split(' Upgrade')[0]} upgrade on HERA Airlines! Try your luck at the lottery wheel! ✈️ #HeraAirlines #UpgradeWin #Lucky`
    const url = `${window.location.origin}/airline/lottery`
    
    switch (platform) {
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank')
        break
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`, '_blank')
        break
      case 'copy':
        navigator.clipboard.writeText(`${text}\n\n${url}`)
        alert('Link copied to clipboard!')
        break
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex">
      <AirlineTeamsSidebar />
      
      <div className="flex-1 flex flex-col ml-16">
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-orange-200">
          <div className="px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  Upgrade Lottery
                  <Badge className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white border-0">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Beta Feature
                  </Badge>
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Win free cabin upgrades on your eligible flights
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm text-gray-600">Next Draw In</p>
                  <p className="text-2xl font-bold text-orange-600">{userStats.nextDrawIn}</p>
                </div>
                <Button className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white hover:shadow-lg">
                  <Gift className="w-4 h-4 mr-2" />
                  Buy Second Chance
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-8">
            {/* Lottery Wheel Section */}
            <Card className="mb-8 overflow-hidden">
              <div className="bg-gradient-to-br from-yellow-100 via-orange-100 to-red-100 p-8">
                <div className="max-w-4xl mx-auto">
                  <div className="text-center mb-8">
                    <h2 className="text-4xl font-bold text-gray-900 mb-2">Spin to Win!</h2>
                    <p className="text-lg text-gray-600">You have {userStats.eligibleFlights} eligible flights</p>
                  </div>

                  {/* Lottery Wheel Visualization */}
                  <div className="relative w-96 h-96 mx-auto mb-8">
                    {/* Outer Ring */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 p-2">
                      {/* Spinning Wheel */}
                      <div 
                        className="relative w-full h-full rounded-full overflow-hidden transition-transform duration-4000 ease-out"
                        style={{ 
                          transform: `rotate(${spinRotation}deg)`,
                          transitionDuration: isSpinning ? '4000ms' : '0ms'
                        }}
                      >
                        {/* Wheel Segments */}
                        <svg className="w-full h-full" viewBox="0 0 200 200">
                          {/* Business Class - Win */}
                          <path d="M 100 100 L 100 10 A 90 90 0 0 1 163.6 36.4 Z" 
                                fill="#10B981" stroke="white" strokeWidth="2"/>
                          <text x="130" y="35" textAnchor="middle" className="text-xs font-bold fill-white">
                            Business
                          </text>
                          
                          {/* Try Again - Lose */}
                          <path d="M 100 100 L 163.6 36.4 A 90 90 0 0 1 163.6 163.6 Z" 
                                fill="#EF4444" stroke="white" strokeWidth="2"/>
                          <text x="150" y="105" textAnchor="middle" className="text-xs font-bold fill-white">
                            Try Again
                          </text>
                          
                          {/* Premium - Win */}
                          <path d="M 100 100 L 163.6 163.6 A 90 90 0 0 1 36.4 163.6 Z" 
                                fill="#8B5CF6" stroke="white" strokeWidth="2"/>
                          <text x="130" y="170" textAnchor="middle" className="text-xs font-bold fill-white">
                            Premium
                          </text>
                          
                          {/* Better Luck - Lose */}
                          <path d="M 100 100 L 36.4 163.6 A 90 90 0 0 1 36.4 36.4 Z" 
                                fill="#F59E0B" stroke="white" strokeWidth="2"/>
                          <text x="70" y="170" textAnchor="middle" className="text-xs font-bold fill-white">
                            Next Time
                          </text>
                          
                          {/* First Class - Win */}
                          <path d="M 100 100 L 36.4 36.4 A 90 90 0 0 1 100 10 Z" 
                                fill="#F59E0B" stroke="white" strokeWidth="2"/>
                          <text x="70" y="35" textAnchor="middle" className="text-xs font-bold fill-white">
                            First
                          </text>
                        </svg>
                        
                        {/* Center Hub */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-32 h-32 rounded-full bg-white shadow-lg flex items-center justify-center border-4 border-gray-200">
                            <Trophy className="w-12 h-12 text-yellow-500" />
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Pointer */}
                    <div className="absolute top-2 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-red-600 drop-shadow-lg"></div>
                    </div>
                    
                    {/* Spin Button */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Button
                        size="lg"
                        onClick={handleSpin}
                        disabled={isSpinning}
                        className="bg-gradient-to-r from-yellow-500 to-orange-600 text-white hover:shadow-xl transform hover:scale-105 transition-all z-10 rounded-full w-24 h-24"
                      >
                        {isSpinning ? (
                          <div className="animate-pulse">
                            <Clock className="w-8 h-8" />
                          </div>
                        ) : (
                          <div className="text-center">
                            <div className="text-lg font-bold">SPIN</div>
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Loyalty Bonus */}
                  <div className="text-center">
                    <Badge className="bg-gradient-to-r from-indigo-100 to-purple-100 text-purple-700 px-4 py-2">
                      <Star className="w-4 h-4 mr-2" />
                      Gold Member: {userStats.loyaltyBonus}x Better Odds
                    </Badge>
                  </div>
                </div>
              </div>
            </Card>

            {/* Result Display */}
            {lastResult && (
              <div className={`mb-8 text-center p-6 rounded-xl border-2 ${
                lastResult.includes('WINNER') 
                  ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-300' 
                  : 'bg-gradient-to-r from-gray-50 to-blue-50 border-gray-300'
              }`}>
                <div className="text-4xl font-bold mb-4">
                  {lastResult}
                </div>
                
                {lastResult.includes('WINNER') ? (
                  <div className="space-y-4">
                    <p className="text-lg text-green-700">
                      Your upgrade has been applied to flight AA101 JFK→LAX!
                    </p>
                    
                    {/* Social Sharing Buttons */}
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        onClick={() => shareWin('twitter')}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        Share on Twitter
                      </Button>
                      <Button
                        onClick={() => shareWin('facebook')}
                        className="bg-blue-700 hover:bg-blue-800 text-white"
                      >
                        Share on Facebook
                      </Button>
                      <Button
                        onClick={() => shareWin('copy')}
                        variant="outline"
                      >
                        Copy Link
                      </Button>
                    </div>
                    
                    {/* Winner Perks */}
                    <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <DollarSign className="w-8 h-8 mx-auto mb-2 text-green-600" />
                        <p className="font-semibold">$1,200</p>
                        <p className="text-sm text-gray-600">Value Saved</p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <Star className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                        <p className="font-semibold">Bonus Miles</p>
                        <p className="text-sm text-gray-600">+500 miles</p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border">
                        <Gift className="w-8 h-8 mx-auto mb-2 text-orange-600" />
                        <p className="font-semibold">Priority</p>
                        <p className="text-sm text-gray-600">Boarding & Baggage</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-lg text-gray-700">
                      Don't worry! You're still entered in all upcoming draws.
                    </p>
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        onClick={() => setLastResult(null)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      >
                        Try Again Tomorrow
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => window.location.href = '/airline/lottery?tab=how'}
                      >
                        How to Improve Odds
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Spin Stats */}
            <div className="mb-8 text-center">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">25%</p>
                  <p className="text-sm text-gray-600">Win Probability</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{userStats.winsAllTime}</p>
                  <p className="text-sm text-gray-600">Your Total Wins</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-yellow-600">1.5x</p>
                  <p className="text-sm text-gray-600">Gold Bonus</p>
                </div>
                <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">$2,400</p>
                  <p className="text-sm text-gray-600">Value Won</p>
                </div>
              </div>
            </div>

            {/* Stats and Info Tabs */}
            <Tabs defaultValue="eligible" className="mb-8">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="eligible">Eligible Flights</TabsTrigger>
                <TabsTrigger value="stats">My Stats</TabsTrigger>
                <TabsTrigger value="winners">Recent Winners</TabsTrigger>
                <TabsTrigger value="how">How It Works</TabsTrigger>
              </TabsList>

              <TabsContent value="eligible" className="mt-6">
                <div className="space-y-4">
                  {eligibleFlights.map((flight) => (
                    <Card key={flight.id}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <Badge variant="secondary">{flight.id}</Badge>
                              <span className="text-lg font-semibold">{flight.route}</span>
                              <Badge variant="outline">{flight.date}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                              Current Class: <span className="font-medium">{flight.currentClass}</span>
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-gray-600">Possible Upgrades:</span>
                              {flight.possibleUpgrades.map((upgrade, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {upgrade}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="mb-2">
                              <p className="text-sm text-gray-600">Win Probability</p>
                              <p className="text-2xl font-bold text-orange-600">{flight.probability}%</p>
                            </div>
                            <Button size="sm" variant="outline">
                              <Info className="w-4 h-4 mr-2" />
                              View Details
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="stats" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Total Entries</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-gray-900">{userStats.entriesThisMonth}</p>
                      <p className="text-sm text-gray-600">This month</p>
                      <Progress value={60} className="mt-3" />
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Lifetime Wins</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-green-600">{userStats.winsAllTime}</p>
                      <p className="text-sm text-gray-600">Total upgrades won</p>
                      <div className="flex gap-1 mt-3">
                        {[...Array(userStats.winsAllTime)].map((_, i) => (
                          <Trophy key={i} className="w-5 h-5 text-yellow-500" />
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Lucky Streak</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-3xl font-bold text-purple-600">{userStats.currentStreak}</p>
                      <p className="text-sm text-gray-600">Days with entries</p>
                      <Badge className="mt-3 bg-purple-100 text-purple-700">
                        <Zap className="w-3 h-3 mr-1" />
                        Streak Bonus Active
                      </Badge>
                    </CardContent>
                  </Card>
                </div>

                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle>Upgrade History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Trophy className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium">Won Business Class Upgrade</p>
                            <p className="text-sm text-gray-600">NYC → LAX • March 15, 2025</p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700">+$1,200 value</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Trophy className="w-5 h-5 text-green-600" />
                          <div>
                            <p className="font-medium">Won Premium Economy Upgrade</p>
                            <p className="text-sm text-gray-600">LAX → HNL • January 8, 2025</p>
                          </div>
                        </div>
                        <Badge className="bg-green-100 text-green-700">+$450 value</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="winners" className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recentWinners.map((winner) => (
                    <Card key={winner.id} className="overflow-hidden">
                      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4">
                        <div className="flex items-center gap-4">
                          <div className="text-4xl">{winner.avatar}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-lg">{winner.initials}</p>
                              <Badge variant="secondary" className="text-xs">
                                {winner.loyaltyTier}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{winner.route}</p>
                            <p className="text-sm font-medium text-green-600">{winner.upgrade}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-gray-900">{winner.value}</p>
                            <p className="text-xs text-gray-500">{winner.time}</p>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="mt-6 text-center">
                  <Button variant="outline">
                    <Users className="w-4 h-4 mr-2" />
                    View All Winners
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="how" className="mt-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  {upgradeTiers.map((tier) => (
                    <Card key={tier.tier}>
                      <CardHeader>
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${tier.color} flex items-center justify-center mb-3`}>
                          <tier.icon className="w-6 h-6 text-white" />
                        </div>
                        <CardTitle>{tier.tier}</CardTitle>
                        <CardDescription>Win probability: {tier.probability}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-2xl font-bold text-gray-900">{tier.value}</p>
                        <p className="text-sm text-gray-600 mt-1">Average upgrade value</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>How the Lottery Works</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                        1
                      </div>
                      <div>
                        <p className="font-medium">Book an Eligible Flight</p>
                        <p className="text-sm text-gray-600">All economy and premium economy bookings automatically enter the lottery</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                        2
                      </div>
                      <div>
                        <p className="font-medium">Daily Draws</p>
                        <p className="text-sm text-gray-600">Lottery runs 36 hours before each flight departure</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                        3
                      </div>
                      <div>
                        <p className="font-medium">Instant Notification</p>
                        <p className="text-sm text-gray-600">Winners receive push, email, and in-app notifications</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold flex-shrink-0">
                        4
                      </div>
                      <div>
                        <p className="font-medium">Accept Your Upgrade</p>
                        <p className="text-sm text-gray-600">You have 24 hours to accept or decline the free upgrade</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}