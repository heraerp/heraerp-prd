'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

/**
 * HERA Validate Page - Test if HERA fits your business
 * Smart Code: HERA.UI.JOURNEY.VALIDATE.PAGE.v1
 *
 * Second step in the HERA journey - validate business fit
 */

import React, { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { JourneyProgressTracker } from '@/components/journey/JourneyProgressTracker'
import { cn } from '@/lib/utils'
import {
  Sparkles,
  ChevronRight,
  Check,
  X,
  Calculator,
  FileText,
  Users,
  Package,
  CreditCard,
  BarChart3,
  Shield,
  Globe,
  Zap,
  DollarSign,
  TrendingUp,
  HelpCircle,
  ArrowRight,
  ChevronLeft,
  Info,
  Calendar
} from 'lucide-react'

interface ValidationAnswer {
  questionId: string
  answer: string | string[]
}

interface ValidationResult {
  score: number
  recommendation: 'perfect' | 'good' | 'moderate' | 'poor'
  missingFeatures: string[]
  estimatedSavings: number
  implementationTime: string
}

export default function ValidatePage() {
  const router = useRouter()
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<ValidationAnswer[]>([])
  const [showResults, setShowResults] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [roiInputs, setRoiInputs] = useState({
    employees: '',
    monthlyRevenue: '',
    currentSoftwareCost: '',
    hoursWasted: ''
  })
  const containerRef = useRef<HTMLDivElement>(null)

  // Track mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setMousePosition({
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100
        })
      }
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('mousemove', handleMouseMove)
      return () => container.removeEventListener('mousemove', handleMouseMove)
    }
  }, [])

  const validationQuestions = [
    {
      id: 'business_type',
      title: 'What type of business do you run?',
      type: 'radio',
      options: [
        { value: 'salon', label: 'Beauty & Wellness', icon: '💇‍♀️' },
        { value: 'restaurant', label: 'Restaurant & Cafe', icon: '🍽️' },
        { value: 'retail', label: 'Retail Store', icon: '🛍️' },
        { value: 'healthcare', label: 'Healthcare & Clinic', icon: '⚕️' },
        { value: 'professional', label: 'Professional Services', icon: '💼' },
        { value: 'other', label: 'Other Business', icon: '🏢' }
      ]
    },
    {
      id: 'business_size',
      title: 'How many employees do you have?',
      type: 'radio',
      options: [
        { value: '1-5', label: '1-5 employees' },
        { value: '6-20', label: '6-20 employees' },
        { value: '21-50', label: '21-50 employees' },
        { value: '51-200', label: '51-200 employees' },
        { value: '200+', label: '200+ employees' }
      ]
    },
    {
      id: 'features_needed',
      title: 'Which features are critical for your business?',
      type: 'checkbox',
      options: [
        { value: 'inventory', label: 'Inventory Management', icon: Package },
        { value: 'appointments', label: 'Appointment Scheduling', icon: Calendar },
        { value: 'accounting', label: 'Accounting & Finance', icon: FileText },
        { value: 'crm', label: 'Customer Management', icon: Users },
        { value: 'pos', label: 'Point of Sale', icon: CreditCard },
        { value: 'reports', label: 'Analytics & Reports', icon: BarChart3 },
        { value: 'multi_location', label: 'Multiple Locations', icon: Globe },
        { value: 'online', label: 'Online Presence', icon: Globe }
      ]
    },
    {
      id: 'current_problems',
      title: 'What problems are you trying to solve?',
      type: 'checkbox',
      options: [
        { value: 'manual', label: 'Too many manual processes' },
        { value: 'scattered', label: 'Data scattered across systems' },
        { value: 'expensive', label: 'Current software too expensive' },
        { value: 'complex', label: 'Systems too complex to use' },
        { value: 'reporting', label: 'Poor reporting capabilities' },
        { value: 'integration', label: "Systems don't talk to each other" },
        { value: 'mobile', label: 'No mobile access' },
        { value: 'growth', label: "Can't scale with growth" }
      ]
    },
    {
      id: 'timeline',
      title: 'When do you need a solution?',
      type: 'radio',
      options: [
        { value: 'immediate', label: 'Immediately' },
        { value: '1month', label: 'Within 1 month' },
        { value: '3months', label: 'Within 3 months' },
        { value: '6months', label: 'Within 6 months' },
        { value: 'exploring', label: 'Just exploring options' }
      ]
    }
  ]

  const handleAnswer = (questionId: string, answer: string | string[]) => {
    const newAnswers = answers.filter(a => a.questionId !== questionId)
    newAnswers.push({ questionId, answer })
    setAnswers(newAnswers)
  }

  const handleNext = () => {
    if (currentStep < validationQuestions.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      calculateValidationResult()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const isStepComplete = () => {
    const currentQuestion = validationQuestions[currentStep]
    const answer = answers.find(a => a.questionId === currentQuestion.id)

    if (currentQuestion.type === 'checkbox') {
      return answer && Array.isArray(answer.answer) && answer.answer.length > 0
    }
    return answer && answer.answer !== ''
  }

  const calculateValidationResult = () => {
    // Simple scoring logic
    let score = 0
    const missingFeatures: string[] = []

    // Business type scoring
    const businessType = answers.find(a => a.questionId === 'business_type')?.answer
    if (['salon', 'restaurant', 'retail', 'healthcare'].includes(businessType as string)) {
      score += 25 // We have specific solutions for these
    } else {
      score += 15 // Generic solution still works
    }

    // Size scoring
    const size = answers.find(a => a.questionId === 'business_size')?.answer
    if (['1-5', '6-20', '21-50'].includes(size as string)) {
      score += 25 // Perfect fit for SMBs
    } else {
      score += 15 // Still works for larger businesses
    }

    // Features scoring
    const features = answers.find(a => a.questionId === 'features_needed')?.answer as string[]
    const supportedFeatures = [
      'inventory',
      'appointments',
      'accounting',
      'crm',
      'pos',
      'reports',
      'multi_location'
    ]
    if (features) {
      features.forEach(feature => {
        if (supportedFeatures.includes(feature)) {
          score += 5
        } else {
          missingFeatures.push(feature)
        }
      })
    }

    // Problems scoring
    const problems = answers.find(a => a.questionId === 'current_problems')?.answer as string[]
    if (problems && problems.length > 0) {
      score += Math.min(problems.length * 5, 20) // HERA solves these problems
    }

    // Timeline scoring
    const timeline = answers.find(a => a.questionId === 'timeline')?.answer
    if (['immediate', '1month'].includes(timeline as string)) {
      score += 10 // HERA's quick setup is perfect
    } else {
      score += 5
    }

    // Calculate recommendation
    let recommendation: 'perfect' | 'good' | 'moderate' | 'poor'
    if (score >= 80) recommendation = 'perfect'
    else if (score >= 60) recommendation = 'good'
    else if (score >= 40) recommendation = 'moderate'
    else recommendation = 'poor'

    // Calculate estimated savings
    const employees = parseInt(roiInputs.employees) || 10
    const monthlyRevenue = parseInt(roiInputs.monthlyRevenue) || 50000
    const currentCost = parseInt(roiInputs.currentSoftwareCost) || 500
    const hoursWasted = parseInt(roiInputs.hoursWasted) || 20

    const laborSavings = hoursWasted * 50 * 12 // $50/hour * months
    const softwareSavings = Math.max(currentCost * 12 - 1200, 0) // HERA costs ~$100/month
    const efficiencySavings = monthlyRevenue * 0.02 * 12 // 2% efficiency gain

    const estimatedSavings = laborSavings + softwareSavings + efficiencySavings

    setValidationResult({
      score,
      recommendation,
      missingFeatures,
      estimatedSavings,
      implementationTime: businessType === 'salon' ? '30 seconds' : '2-5 minutes'
    })

    setShowResults(true)
  }

  const renderQuestion = () => {
    const question = validationQuestions[currentStep]
    const answer = answers.find(a => a.questionId === question.id)

    return (
      <div className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold !text-gray-900 dark:!text-foreground mb-2">
            {question.title}
          </h3>
          <Progress
            value={((currentStep + 1) / validationQuestions.length) * 100}
            className="h-2"
          />
          <p className="text-sm !text-muted-foreground dark:!text-muted-foreground mt-1">
            Question {currentStep + 1} of {validationQuestions.length}
          </p>
        </div>

        {question.type === 'radio' ? (
          <RadioGroup
            value={(answer?.answer as string) || ''}
            onValueChange={value => handleAnswer(question.id, value)}
          >
            <div className="space-y-3">
              {question.options.map(option => (
                <label
                  key={option.value}
                  className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg border border-border dark:border-border hover:border-purple-500 transition-colors"
                >
                  <RadioGroupItem value={option.value} />
                  {option.icon && <span className="text-2xl">{option.icon}</span>}
                  <span className="!text-gray-900 dark:!text-foreground">{option.label}</span>
                </label>
              ))}
            </div>
          </RadioGroup>
        ) : (
          <div className="space-y-3">
            {question.options.map(option => (
              <label
                key={option.value}
                className="flex items-center space-x-3 cursor-pointer p-4 rounded-lg border border-border dark:border-border hover:border-purple-500 transition-colors"
              >
                <Checkbox
                  checked={((answer?.answer as string[]) || []).includes(option.value)}
                  onCheckedChange={checked => {
                    const currentValues = (answer?.answer as string[]) || []
                    const newValues = checked
                      ? [...currentValues, option.value]
                      : currentValues.filter(v => v !== option.value)
                    handleAnswer(question.id, newValues)
                  }}
                />
                {option.icon && <option.icon className="w-5 h-5 text-muted-foreground" />}
                <span className="!text-gray-900 dark:!text-foreground">{option.label}</span>
              </label>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            onClick={handleNext}
            disabled={!isStepComplete()}
            className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-foreground"
          >
            {currentStep === validationQuestions.length - 1 ? 'Get Results' : 'Next'}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    )
  }

  const renderResults = () => {
    if (!validationResult) return null

    const recommendationColors = {
      perfect: 'from-green-500 to-emerald-600',
      good: 'from-blue-500 to-cyan-600',
      moderate: 'from-yellow-500 to-orange-600',
      poor: 'from-red-500 to-pink-600'
    }

    const recommendationMessages = {
      perfect: 'HERA is a perfect fit for your business!',
      good: 'HERA can solve most of your business needs!',
      moderate: 'HERA can help, with some customization.',
      poor: 'HERA might require significant customization.'
    }

    return (
      <div className="space-y-8">
        {/* Score Card */}
        <div
          className={cn(
            'relative overflow-hidden rounded-2xl p-8 text-foreground',
            'bg-gradient-to-r',
            recommendationColors[validationResult.recommendation]
          )}
        >
          <div className="relative z-10">
            <h3 className="text-3xl font-bold mb-2">
              {recommendationMessages[validationResult.recommendation]}
            </h3>
            <p className="text-xl mb-4">Compatibility Score: {validationResult.score}%</p>
            <p className="text-lg">Implementation Time: {validationResult.implementationTime}</p>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 opacity-20">
            <div className="w-full h-full rounded-full bg-background/20 blur-3xl" />
          </div>
        </div>

        {/* ROI Calculator */}
        <Card
          style={{
            background: `
              linear-gradient(135deg, 
                rgba(255, 255, 255, 0.18) 0%, 
                rgba(255, 255, 255, 0.05) 100%
              )
            `,
            backdropFilter: 'blur(30px) saturate(200%)',
            WebkitBackdropFilter: 'blur(30px) saturate(200%)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-purple-600" />
              ROI Calculator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <Label htmlFor="employees">Number of Employees</Label>
                <Input
                  id="employees"
                  type="number"
                  placeholder="10"
                  value={roiInputs.employees}
                  onChange={e => setRoiInputs({ ...roiInputs, employees: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="revenue">Monthly Revenue ($)</Label>
                <Input
                  id="revenue"
                  type="number"
                  placeholder="50000"
                  value={roiInputs.monthlyRevenue}
                  onChange={e => setRoiInputs({ ...roiInputs, monthlyRevenue: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="current-cost">Current Software Cost ($/month)</Label>
                <Input
                  id="current-cost"
                  type="number"
                  placeholder="500"
                  value={roiInputs.currentSoftwareCost}
                  onChange={e =>
                    setRoiInputs({ ...roiInputs, currentSoftwareCost: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="hours">Hours Wasted per Month</Label>
                <Input
                  id="hours"
                  type="number"
                  placeholder="20"
                  value={roiInputs.hoursWasted}
                  onChange={e => setRoiInputs({ ...roiInputs, hoursWasted: e.target.value })}
                />
              </div>
            </div>

            <Button onClick={() => calculateValidationResult()} className="w-full mb-4">
              Recalculate Savings
            </Button>

            <div className="p-6 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <p className="text-sm !text-muted-foreground dark:!text-muted-foreground mb-2">
                Estimated Annual Savings with HERA:
              </p>
              <p className="text-3xl font-bold !text-purple-600 dark:!text-purple-400">
                ${validationResult.estimatedSavings.toLocaleString()}
              </p>
              <p className="text-sm !text-muted-foreground dark:!text-muted-foreground mt-2">
                ROI in less than 2 months
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Missing Features */}
        {validationResult.missingFeatures.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5 text-yellow-600" />
                Features to Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm !text-muted-foreground dark:!text-muted-foreground mb-3">
                These features may require custom configuration:
              </p>
              <div className="flex flex-wrap gap-2">
                {validationResult.missingFeatures.map(feature => (
                  <Badge
                    key={feature}
                    variant="outline"
                    className="text-yellow-700 border-yellow-300"
                  >
                    {feature}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <div className="text-center">
          <h3 className="text-2xl font-bold !text-gray-900 dark:!text-foreground mb-4">
            Ready to build your custom solution?
          </h3>
          <Button
            size="lg"
            onClick={() => router.push('/build')}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-foreground shadow-lg"
          >
            Start Building
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen relative overflow-hidden"
      style={{
        background: `
          linear-gradient(135deg, 
            rgba(255, 255, 255, 0.1) 0%, 
            rgba(255, 255, 255, 0.05) 25%,
            rgba(147, 51, 234, 0.02) 50%,
            rgba(236, 72, 153, 0.02) 75%,
            rgba(255, 255, 255, 0.1) 100%
          ),
          radial-gradient(circle at ${mousePosition.x}% ${mousePosition.y}%, 
            rgba(147, 51, 234, 0.15) 0%, 
            rgba(236, 72, 153, 0.1) 25%,
            rgba(59, 130, 246, 0.05) 50%,
            transparent 70%
          ),
          linear-gradient(45deg, #f8fafc 0%, #e2e8f0 100%)
        `
      }}
    >
      {/* WSAG Animated Background Orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute w-96 h-96 rounded-full transition-all duration-[3000ms] ease-in-out"
          style={{
            background: `radial-gradient(circle, 
              rgba(147, 51, 234, 0.4) 0%, 
              rgba(147, 51, 234, 0.2) 30%, 
              rgba(147, 51, 234, 0.05) 60%, 
              transparent 100%
            )`,
            filter: 'blur(40px)',
            left: `${30 + mousePosition.x * 0.1}%`,
            top: `${20 + mousePosition.y * 0.05}%`,
            transform: `translate(-50%, -50%) scale(${1 + mousePosition.x * 0.002})`
          }}
        />

        <div
          className="absolute w-80 h-80 rounded-full transition-all duration-[4000ms] ease-in-out"
          style={{
            background: `radial-gradient(circle, 
              rgba(59, 130, 246, 0.3) 0%, 
              rgba(59, 130, 246, 0.15) 30%, 
              rgba(59, 130, 246, 0.03) 60%, 
              transparent 100%
            )`,
            filter: 'blur(50px)',
            right: `${25 + mousePosition.x * 0.08}%`,
            bottom: `${30 + mousePosition.y * 0.03}%`,
            transform: `translate(50%, 50%) scale(${1 + mousePosition.y * 0.002})`
          }}
        />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header
          className="sticky top-0 z-50 border-b shadow-lg"
          style={{
            background: `
              linear-gradient(135deg, 
                rgba(255, 255, 255, 0.25) 0%, 
                rgba(255, 255, 255, 0.1) 50%,
                rgba(255, 255, 255, 0.05) 100%
              )
            `,
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            boxShadow: `
              0 8px 32px rgba(147, 51, 234, 0.15),
              0 4px 16px rgba(0, 0, 0, 0.1),
              inset 0 1px 0 rgba(255, 255, 255, 0.4),
              inset 0 -1px 0 rgba(255, 255, 255, 0.1)
            `
          }}
        >
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transform transition-all duration-300"
                  style={{
                    background: `
                      linear-gradient(135deg, 
                        rgba(147, 51, 234, 0.3) 0%, 
                        rgba(236, 72, 153, 0.2) 100%
                      )
                    `,
                    backdropFilter: 'blur(20px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    boxShadow: `
                      0 8px 32px rgba(147, 51, 234, 0.3),
                      0 4px 16px rgba(0, 0, 0, 0.1),
                      inset 0 1px 0 rgba(255, 255, 255, 0.4)
                    `
                  }}
                >
                  <Sparkles className="w-5 h-5 text-foreground drop-shadow-md" />
                </div>
                <div>
                  <h1 className="text-xl font-bold !text-gray-900 dark:!text-foreground">HERA</h1>
                  <p className="text-xs !text-muted-foreground dark:!text-gray-300 font-medium">
                    Business Validation
                  </p>
                </div>
              </Link>

              <Button
                onClick={() => router.push('/build')}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-foreground shadow-lg"
                disabled={!showResults}
              >
                Continue to Build
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </header>

        {/* Journey Progress */}
        <JourneyProgressTracker currentStep="validate" completedSteps={['discover']} />

        {/* Main Content */}
        <main className="px-4 sm:px-6 lg:px-8 py-8 max-w-4xl mx-auto">
          {!showResults ? (
            <>
              {/* Hero Section */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold !text-gray-900 dark:!text-foreground mb-4">
                  Let's Find Your Perfect Fit
                </h2>
                <p className="text-lg !text-gray-700 dark:!text-gray-300">
                  Answer a few questions to see how HERA can transform your business
                </p>
              </div>

              {/* Question Card */}
              <Card
                className="mb-8"
                style={{
                  background: `
                    linear-gradient(135deg, 
                      rgba(255, 255, 255, 0.18) 0%, 
                      rgba(255, 255, 255, 0.05) 100%
                    )
                  `,
                  backdropFilter: 'blur(30px) saturate(200%)',
                  WebkitBackdropFilter: 'blur(30px) saturate(200%)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: `
                    0 12px 40px rgba(0, 0, 0, 0.08),
                    0 4px 20px rgba(0, 0, 0, 0.05),
                    inset 0 1px 0 rgba(255, 255, 255, 0.35)
                  `
                }}
              >
                <CardContent className="p-6">{renderQuestion()}</CardContent>
              </Card>

              {/* Info Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div
                  className="p-4 rounded-lg text-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)'
                  }}
                >
                  <Zap className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <p className="text-sm font-semibold !text-gray-900 dark:!text-foreground">
                    Quick Setup
                  </p>
                  <p className="text-xs !text-muted-foreground dark:!text-muted-foreground">
                    30 seconds to 5 minutes
                  </p>
                </div>
                <div
                  className="p-4 rounded-lg text-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)'
                  }}
                >
                  <Shield className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <p className="text-sm font-semibold !text-gray-900 dark:!text-foreground">
                    Data Security
                  </p>
                  <p className="text-xs !text-muted-foreground dark:!text-muted-foreground">
                    Bank-level encryption
                  </p>
                </div>
                <div
                  className="p-4 rounded-lg text-center"
                  style={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.15)'
                  }}
                >
                  <DollarSign className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                  <p className="text-sm font-semibold !text-gray-900 dark:!text-foreground">
                    Cost Savings
                  </p>
                  <p className="text-xs !text-muted-foreground dark:!text-muted-foreground">
                    Average 92% reduction
                  </p>
                </div>
              </div>
            </>
          ) : (
            renderResults()
          )}
        </main>
      </div>
    </div>
  )
}
