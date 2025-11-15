'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function PartnerExperienceHub() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to new franchise system
    router.replace('/franchise')
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-emerald-500 mx-auto mb-8"></div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Upgrading to Franchise Model</h1>
        <p className="text-muted-foreground">Experience the new HERA Franchise opportunity...</p>
      </div>
    </div>
  )
}

// OLD PARTNER SYSTEM - REPLACED BY FRANCHISE MODEL
function OldPartnerExperienceHub() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [isReady, setIsReady] = useState(false)

  // The Steve Jobs Partner Journey - Each step builds anticipation for the next
  const partnerJourney: PartnerJourneyStep[] = [
    {
      id: 'discover',
      title: 'Discover the Revolution',
      description: 'See why 500+ partners chose HERA over traditional ERP reselling',
      icon: Lightbulb,
      duration: '3 min',
      status: 'available',
      value: 'Understanding',
      action: 'Learn Why HERA',
      path: '/partners'
    },
    {
      id: 'envision',
      title: 'Envision Your Success',
      description: 'See your potential: $25 per customer, forever. No quotas. No politics.',
      icon: TrendingUp,
      duration: '5 min',
      status: 'available',
      value: '$25 Per Customer',
      action: 'Calculate My Earnings',
      path: '/partners#calculator'
    },
    {
      id: 'join',
      title: 'Join the Movement',
      description: '4 simple steps. 48 hours to approval. Start earning immediately.',
      icon: Users,
      duration: '8 min',
      status: 'available',
      value: '48-Hour Approval',
      action: 'Become a Partner',
      path: '/partner-system/register'
    },
    {
      id: 'master',
      title: 'Master Modern Sales',
      description: 'Learn the viral growth tactics that top 1% of salespeople use',
      icon: Award,
      duration: '6 hours',
      status: 'available',
      value: '10x Sales Skills',
      action: 'Start Training',
      path: '/partner-system/training'
    },
    {
      id: 'thrive',
      title: 'Thrive & Scale',
      description: 'Real-time dashboard. Automatic payouts. Viral referral systems.',
      icon: Zap,
      duration: 'Ongoing',
      status: 'available',
      value: 'Unlimited Growth',
      action: 'View Dashboard',
      path: '/partner-system/dashboard'
    }
  ]

  useEffect(() => {
    // Smooth entry animation
    setTimeout(() => setIsReady(true), 100)
  }, [])

  const handleStepClick = (step: PartnerJourneyStep, index: number) => {
    setCurrentStep(index)

    // Smooth transition to the experience
    setTimeout(() => {
      router.push(step.path)
    }, 300)
  }

  const getStepStatus = (index: number) => {
    if (index < currentStep) return 'completed'
    if (index === currentStep) return 'current'
    return 'available'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50">
      {/* Hero Section - Steve Jobs Style Announcement */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-blue-500/10" />
        <div className="relative max-w-7xl mx-auto px-6 py-20">
          <div
            className={`text-center transition-all duration-1000 ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
          >
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500/10 rounded-full mb-8 backdrop-blur">
              <Sparkles className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold text-emerald-700">The Future of ERP Partnerships</span>
            </div>

            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-slate-900 to-emerald-700 bg-clip-text text-transparent">
              Think Different.
              <br />
              <span className="text-emerald-600">Sell Better.</span>
            </h1>

            <p className="text-2xl text-muted-foreground max-w-4xl mx-auto mb-12 leading-relaxed">
              Join the partners who are building real businesses, not just billable hours.
              <br />
              <strong className="text-emerald-600">50% revenue share, forever.</strong>
            </p>

            {/* Key Differentiators - Jobs Style */}
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16">
              <div className="text-center">
                <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="h-8 w-8 text-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">50% Forever</h3>
                <p className="text-muted-foreground">
                  Not 5%, not 15%. Half of everything. Always.
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-8 w-8 text-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">48-Hour Onboarding</h3>
                <p className="text-muted-foreground">Not 6 months. Not 6 weeks. 48 hours.</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Target className="h-8 w-8 text-foreground" />
                </div>
                <h3 className="text-xl font-bold mb-2">No Quotas</h3>
                <p className="text-muted-foreground">No politics. No tiers. Just results.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* The Journey - Each Step Builds on the Last */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div
          className={`text-center mb-16 transition-all duration-1000 delay-300 ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <h2 className="text-4xl font-bold mb-4">Your Journey to Success</h2>
          <p className="text-xl text-muted-foreground">Five steps. Unlimited potential.</p>
        </div>

        {/* Journey Steps */}
        <div className="space-y-8">
          {partnerJourney.map((step, index) => (
            <Card
              key={step.id}
              className={`group cursor-pointer transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] ${
                currentStep === index ? 'ring-4 ring-emerald-500 shadow-2xl' : ''
              } ${isReady ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'}`}
              style={{ transitionDelay: `${index * 150}ms` }}
              onClick={() => handleStepClick(step, index)}
            >
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    {/* Step Number & Icon */}
                    <div className="relative">
                      <div
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                          getStepStatus(index) === 'completed'
                            ? 'bg-emerald-500'
                            : getStepStatus(index) === 'current'
                              ? 'bg-blue-500'
                              : 'bg-slate-100 group-hover:bg-emerald-100'
                        }`}
                      >
                        {getStepStatus(index) === 'completed' ? (
                          <CheckCircle className="h-8 w-8 text-foreground" />
                        ) : (
                          <step.icon
                            className={`h-8 w-8 transition-colors ${
                              getStepStatus(index) === 'current'
                                ? 'text-foreground'
                                : 'text-muted-foreground group-hover:text-emerald-600'
                            }`}
                          />
                        )}
                      </div>
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-background text-foreground rounded-full flex items-center justify-center text-sm font-bold">
                        {index + 1}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-2xl font-bold">{step.title}</h3>
                        <Badge variant="outline" className="text-emerald-600 border-emerald-200">
                          {step.duration}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-lg mb-3">{step.description}</p>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-semibold text-emerald-600">
                          Value: {step.value}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="text-right">
                    <Button
                      size="lg"
                      className={`transition-all duration-300 ${
                        getStepStatus(index) === 'completed'
                          ? 'bg-emerald-500 hover:bg-emerald-600'
                          : getStepStatus(index) === 'current'
                            ? 'bg-blue-500 hover:bg-blue-600'
                            : 'bg-background hover:bg-emerald-600'
                      }`}
                    >
                      {step.action}
                      <ArrowRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* The Jobs Touch - Emotional Connection */}
        <div
          className={`mt-20 text-center transition-all duration-1000 delay-700 ${isReady ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
        >
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Heart className="h-6 w-6 text-red-500" />
              <span className="text-lg font-semibold ink">Made with passion in Cupertino</span>
              <Heart className="h-6 w-6 text-red-500" />
            </div>

            <blockquote className="text-2xl font-light ink italic mb-8 leading-relaxed">
              "The people who are crazy enough to think they can change the world are the ones who
              do."
            </blockquote>
            <cite className="ink-muted">— Steve Jobs</cite>

            <div className="mt-12">
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-foreground px-12 py-4 text-lg font-semibold rounded-2xl shadow-xl"
                onClick={() => router.push('/partner-system/register')}
              >
                <Globe className="h-6 w-6 mr-3" />
                Change the World with HERA
                <Sparkles className="h-6 w-6 ml-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Meta Breakthrough Badge */}
      <div className="text-center py-12">
        <Badge className="bg-gradient-to-r from-slate-900 to-emerald-600 text-foreground px-6 py-3 text-lg">
          🚀 Seamless Experience Powered by HERA's Universal Architecture
        </Badge>
      </div>
    </div>
  )
}
