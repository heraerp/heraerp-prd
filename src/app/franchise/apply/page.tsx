'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'
import { FranchiseLayout } from '@/src/components/franchise/FranchiseLayout'
import { FranchiseHero } from '@/src/components/franchise/FranchiseHero'
import { Button } from '@/src/components/ui/button'
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  DollarSign,
  Target,
  Clock,
  FileText,
  CheckCircle,
  ArrowRight,
  Shield,
  Award,
  Users,
  Globe
} from 'lucide-react'

const applicationSteps = [
  {
    step: 1,
    title: 'Personal Information',
    description: 'Basic contact details and background',
    time: '1 minute'
  },
  {
    step: 2,
    title: 'Business Experience',
    description: 'Professional background and skills',
    time: '1 minute'
  },
  {
    step: 3,
    title: 'Investment & Goals',
    description: 'Financial capacity and objectives',
    time: '1 minute'
  }
]

const benefits = [
  {
    icon: Clock,
    title: '24-48 Hour Response',
    description: 'Rapid application review and feedback'
  },
  {
    icon: Shield,
    title: 'Territory Protection',
    description: 'Exclusive market area guaranteed'
  },
  {
    icon: Users,
    title: 'Complete Training',
    description: '5-day intensive certification program'
  },
  {
    icon: Award,
    title: '95% Success Rate',
    description: 'Proven franchise model with high success'
  }
]

export default function ApplyPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Personal Information
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    city: '',
    state: '',

    // Business Experience
    currentRole: '',
    industry: '',
    salesExperience: '',
    businessOwnership: '',

    // Investment & Goals
    investmentLevel: '',
    timeCommitment: '',
    targetIncome: '',
    startTimeline: '',

    // Additional
    hearAbout: '',
    questions: ''
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    setIsSubmitting(false)
    setSubmitted(true)
  }

  if (submitted) {
    return (
      <FranchiseLayout>
        <section className="py-24 bg-gradient-to-br from-green-50 via-blue-50 to-indigo-50 dark:from-green-900/20 dark:via-blue-900/20 dark:to-indigo-900/20">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="h-8 w-8 text-foreground" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground dark:text-foreground mb-6">
                Application Received!
              </h1>
              <p className="text-xl text-muted-foreground dark:text-muted-foreground mb-8">
                Thank you for your interest in the HERA franchise opportunity. Our team will review
                your application and contact you within 24-48 hours.
              </p>

              <div className="bg-background dark:bg-muted rounded-xl p-6 border border-border dark:border-border mb-8">
                <h3 className="font-semibold text-foreground dark:text-foreground mb-4">
                  What Happens Next?
                </h3>
                <div className="space-y-3 text-left">
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-foreground text-xs font-semibold mr-3">
                      1
                    </div>
                    <span className="text-slate-700 dark:text-slate-300">
                      Application review (24-48 hours)
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-foreground text-xs font-semibold mr-3">
                      2
                    </div>
                    <span className="text-slate-700 dark:text-slate-300">
                      Phone interview with franchise team
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-foreground text-xs font-semibold mr-3">
                      3
                    </div>
                    <span className="text-slate-700 dark:text-slate-300">
                      Territory analysis and selection
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-foreground text-xs font-semibold mr-3">
                      4
                    </div>
                    <span className="text-slate-700 dark:text-slate-300">
                      Approval and welcome package
                    </span>
                  </div>
                </div>
              </div>

              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-foreground font-semibold px-8 py-4"
              >
                <Link href="/franchise">Return to Home</Link>
              </Button>
            </div>
          </div>
        </section>
      </FranchiseLayout>
    )
  }

  return (
    <FranchiseLayout>
      {/* Hero Section */}
      <FranchiseHero
        title="Apply for Your Territory"
        subtitle="3-Minute Application • 24-Hour Response"
        description="Take the first step toward owning your piece of the $50B ERP revolution. Limited territories available with exclusive protection."
        showStats={false}
      />

      {/* Application Form */}
      <section className="py-16 bg-background dark:bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-12">
              {/* Progress Sidebar */}
              <div className="lg:col-span-1">
                <div className="bg-slate-50 dark:bg-muted rounded-xl p-6 border border-border dark:border-border sticky top-8">
                  <h3 className="font-semibold text-foreground dark:text-foreground mb-6">
                    Application Progress
                  </h3>

                  <div className="space-y-4">
                    {applicationSteps.map(step => (
                      <div
                        key={step.step}
                        className={`flex items-start ${currentStep >= step.step ? 'text-primary' : 'text-muted-foreground'}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold mr-3 ${
                            currentStep > step.step
                              ? 'bg-green-500 text-foreground'
                              : currentStep === step.step
                                ? 'bg-blue-500 text-foreground'
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                          }`}
                        >
                          {currentStep > step.step ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            step.step
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{step.title}</p>
                          <p className="text-sm text-slate-500">{step.description}</p>
                          <p className="text-xs text-muted-foreground mt-1">{step.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Application Form */}
              <div className="lg:col-span-2">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {/* Step 1: Personal Information */}
                  {currentStep === 1 && (
                    <div className="bg-slate-50 dark:bg-muted rounded-xl p-8 border border-border dark:border-border">
                      <div className="flex items-center mb-6">
                        <User className="h-6 w-6 text-primary mr-3" />
                        <h2 className="text-2xl font-bold text-foreground dark:text-foreground">
                          Personal Information
                        </h2>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            First Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.firstName}
                            onChange={e => handleInputChange('firstName', e.target.value)}
                            className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-foreground"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Last Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.lastName}
                            onChange={e => handleInputChange('lastName', e.target.value)}
                            className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-foreground"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Email Address *
                          </label>
                          <input
                            type="email"
                            required
                            value={formData.email}
                            onChange={e => handleInputChange('email', e.target.value)}
                            className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-foreground"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Phone Number *
                          </label>
                          <input
                            type="tel"
                            required
                            value={formData.phone}
                            onChange={e => handleInputChange('phone', e.target.value)}
                            className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-foreground"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            City *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.city}
                            onChange={e => handleInputChange('city', e.target.value)}
                            className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-foreground"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            State/Province *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.state}
                            onChange={e => handleInputChange('state', e.target.value)}
                            className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-foreground"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Business Experience */}
                  {currentStep === 2 && (
                    <div className="bg-slate-50 dark:bg-muted rounded-xl p-8 border border-border dark:border-border">
                      <div className="flex items-center mb-6">
                        <Briefcase className="h-6 w-6 text-primary mr-3" />
                        <h2 className="text-2xl font-bold text-foreground dark:text-foreground">
                          Business Experience
                        </h2>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Current Role/Title *
                          </label>
                          <input
                            type="text"
                            required
                            value={formData.currentRole}
                            onChange={e => handleInputChange('currentRole', e.target.value)}
                            className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-foreground"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Industry Experience *
                          </label>
                          <select
                            required
                            value={formData.industry}
                            onChange={e => handleInputChange('industry', e.target.value)}
                            className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-foreground"
                          >
                            <option value="">Select Industry</option>
                            <option value="technology">Technology/Software</option>
                            <option value="sales">Sales & Business Development</option>
                            <option value="consulting">Consulting</option>
                            <option value="manufacturing">Manufacturing</option>
                            <option value="healthcare">Healthcare</option>
                            <option value="finance">Finance/Banking</option>
                            <option value="retail">Retail</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Sales Experience *
                          </label>
                          <select
                            required
                            value={formData.salesExperience}
                            onChange={e => handleInputChange('salesExperience', e.target.value)}
                            className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-foreground"
                          >
                            <option value="">Select Experience Level</option>
                            <option value="none">No formal sales experience</option>
                            <option value="1-3">1-3 years</option>
                            <option value="3-7">3-7 years</option>
                            <option value="7-15">7-15 years</option>
                            <option value="15+">15+ years</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Business Ownership Experience *
                          </label>
                          <select
                            required
                            value={formData.businessOwnership}
                            onChange={e => handleInputChange('businessOwnership', e.target.value)}
                            className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-foreground"
                          >
                            <option value="">Select Experience</option>
                            <option value="none">No business ownership experience</option>
                            <option value="franchise">Franchise owner</option>
                            <option value="small-business">Small business owner</option>
                            <option value="startup">Startup founder</option>
                            <option value="multiple">Multiple businesses</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Investment & Goals */}
                  {currentStep === 3 && (
                    <div className="bg-slate-50 dark:bg-muted rounded-xl p-8 border border-border dark:border-border">
                      <div className="flex items-center mb-6">
                        <Target className="h-6 w-6 text-primary mr-3" />
                        <h2 className="text-2xl font-bold text-foreground dark:text-foreground">
                          Investment & Goals
                        </h2>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Investment Level *
                          </label>
                          <select
                            required
                            value={formData.investmentLevel}
                            onChange={e => handleInputChange('investmentLevel', e.target.value)}
                            className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-foreground"
                          >
                            <option value="">Select Investment Range</option>
                            <option value="75-125k">$75K - $125K</option>
                            <option value="125-175k">$125K - $175K</option>
                            <option value="175-250k">$175K - $250K</option>
                            <option value="250k+">$250K+</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Time Commitment *
                          </label>
                          <select
                            required
                            value={formData.timeCommitment}
                            onChange={e => handleInputChange('timeCommitment', e.target.value)}
                            className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-foreground"
                          >
                            <option value="">Select Time Commitment</option>
                            <option value="part-time">Part-time (20-30 hours/week)</option>
                            <option value="full-time">Full-time (40+ hours/week)</option>
                            <option value="gradual">
                              Start part-time, transition to full-time
                            </option>
                            <option value="team">Build a team approach</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Target Annual Income *
                          </label>
                          <select
                            required
                            value={formData.targetIncome}
                            onChange={e => handleInputChange('targetIncome', e.target.value)}
                            className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-foreground"
                          >
                            <option value="">Select Income Goal</option>
                            <option value="50-100k">$50K - $100K</option>
                            <option value="100-200k">$100K - $200K</option>
                            <option value="200-500k">$200K - $500K</option>
                            <option value="500k+">$500K+</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Timeline to Start *
                          </label>
                          <select
                            required
                            value={formData.startTimeline}
                            onChange={e => handleInputChange('startTimeline', e.target.value)}
                            className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-foreground"
                          >
                            <option value="">Select Timeline</option>
                            <option value="immediately">Immediately</option>
                            <option value="1-3-months">1-3 months</option>
                            <option value="3-6-months">3-6 months</option>
                            <option value="6-12-months">6-12 months</option>
                            <option value="exploring">Just exploring options</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            How did you hear about HERA?
                          </label>
                          <select
                            value={formData.hearAbout}
                            onChange={e => handleInputChange('hearAbout', e.target.value)}
                            className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-foreground"
                          >
                            <option value="">Select Source</option>
                            <option value="google">Google Search</option>
                            <option value="linkedin">LinkedIn</option>
                            <option value="referral">Referral</option>
                            <option value="advertisement">Advertisement</option>
                            <option value="event">Industry Event</option>
                            <option value="other">Other</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Additional Questions or Comments
                          </label>
                          <textarea
                            rows={4}
                            value={formData.questions}
                            onChange={e => handleInputChange('questions', e.target.value)}
                            placeholder="Any specific questions about the opportunity, territory availability, or other concerns..."
                            className="w-full px-4 py-3 border border-input dark:border-input rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-slate-700 dark:text-foreground"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Navigation Buttons */}
                  <div className="flex justify-between">
                    {currentStep > 1 ? (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handlePrevious}
                        className="px-6 py-3"
                      >
                        Previous
                      </Button>
                    ) : (
                      <div />
                    )}

                    {currentStep < 3 ? (
                      <Button
                        type="button"
                        onClick={handleNext}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-foreground px-6 py-3"
                      >
                        Next Step
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-foreground px-8 py-3"
                      >
                        {isSubmitting ? (
                          'Submitting...'
                        ) : (
                          <>
                            Submit Application
                            <FileText className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Application Benefits */}
      <section className="py-16 bg-slate-50 dark:bg-muted">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-foreground dark:text-foreground mb-4">
              What Happens After You Apply
            </h2>
            <p className="text-lg text-muted-foreground dark:text-muted-foreground max-w-2xl mx-auto">
              Join hundreds of successful franchise partners who took this same first step
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="bg-background dark:bg-background rounded-xl p-6 border border-border dark:border-border shadow-sm text-center"
              >
                <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="h-6 w-6 text-foreground" />
                </div>
                <h3 className="font-semibold text-foreground dark:text-foreground mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-muted-foreground dark:text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </FranchiseLayout>
  )
}
