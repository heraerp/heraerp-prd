'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  TrendingUp,
  DollarSign,
  Zap,
  Clock,
  Shield,
  Globe,
  Database,
  Cpu,
  BarChart3,
  Mail,
  CheckCircle,
  AlertCircle,
  Building2,
  Users,
  Calendar,
  Phone,
  MapPin,
  Sparkles,
  ArrowRight,
  Star,
  Rocket,
  Send
} from 'lucide-react'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

interface FormData {
  // Company Information
  companyName: string
  industry: string
  companySize: string
  country: string
  
  // Contact Information
  firstName: string
  lastName: string
  email: string
  phone: string
  jobTitle: string
  
  // Business Requirements
  urgency: string
  currentSystem: string
  mainChallenges: string
  expectedROI: string
  
  // Implementation Details
  timeline: string
  budget: string
  additionalInfo: string
}

const INDUSTRIES = [
  'Salon & Beauty',
  'Restaurant & Food Service',
  'Healthcare & Medical',
  'Manufacturing',
  'Retail & E-commerce',
  'Professional Services',
  'Real Estate',
  'Education',
  'Other'
]

const COMPANY_SIZES = [
  '1-10 employees',
  '11-50 employees', 
  '51-200 employees',
  '201-1000 employees',
  '1000+ employees'
]

const URGENCIES = [
  'Immediate (Within 30 days)',
  'Short-term (1-3 months)',
  'Medium-term (3-6 months)', 
  'Long-term (6+ months)',
  'Exploring options'
]

const BUDGETS = [
  'Under $50K',
  '$50K - $200K',
  '$200K - $500K', 
  '$500K - $1M',
  '$1M+'
]

export default function FinanceDemoPage() {
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    industry: '',
    companySize: '',
    country: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    jobTitle: '',
    urgency: '',
    currentSystem: '',
    mainChallenges: '',
    expectedROI: '',
    timeline: '',
    budget: '',
    additionalInfo: ''
  })

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { toast } = useToast()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = (): string[] => {
    const errors: string[] = []
    
    if (!formData.companyName.trim()) errors.push('Company name is required')
    if (!formData.industry) errors.push('Industry is required')
    if (!formData.firstName.trim()) errors.push('First name is required')
    if (!formData.lastName.trim()) errors.push('Last name is required')
    if (!formData.email.trim()) errors.push('Email is required')
    if (!formData.urgency) errors.push('Urgency is required')
    
    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.push('Please enter a valid email address')
    }
    
    return errors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const errors = validateForm()
    if (errors.length > 0) {
      toast({
        title: 'Validation Error',
        description: errors[0],
        variant: 'destructive'
      })
      return
    }

    setLoading(true)

    try {
      // Send via Resend integration
      const response = await fetch('/api/integrations/resend/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: ['finance-demo@heraerp.com'], // Demo request destination
          subject: `🚀 Finance DNA v2 Demo Request - ${formData.companyName}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; margin-bottom: 20px;">
                <h1 style="color: white; margin: 0; font-size: 24px;">🚀 New Finance DNA v2 Demo Request</h1>
                <p style="color: #e2e8f0; margin: 10px 0 0 0;">Enterprise-grade ERP demo request received</p>
              </div>
              
              <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #1e293b; margin-top: 0;">Company Information</h2>
                <p><strong>Company:</strong> ${formData.companyName}</p>
                <p><strong>Industry:</strong> ${formData.industry}</p>
                <p><strong>Size:</strong> ${formData.companySize || 'Not specified'}</p>
                <p><strong>Country:</strong> ${formData.country || 'Not specified'}</p>
              </div>
              
              <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #1e293b; margin-top: 0;">Contact Information</h2>
                <p><strong>Name:</strong> ${formData.firstName} ${formData.lastName}</p>
                <p><strong>Email:</strong> ${formData.email}</p>
                <p><strong>Phone:</strong> ${formData.phone || 'Not provided'}</p>
                <p><strong>Job Title:</strong> ${formData.jobTitle || 'Not specified'}</p>
              </div>
              
              <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
                <h2 style="color: #1e293b; margin-top: 0;">Business Requirements</h2>
                <p><strong>Urgency:</strong> ${formData.urgency}</p>
                <p><strong>Current System:</strong> ${formData.currentSystem || 'Not specified'}</p>
                <p><strong>Expected ROI:</strong> ${formData.expectedROI || 'Not specified'}</p>
                <p><strong>Timeline:</strong> ${formData.timeline || 'Not specified'}</p>
                <p><strong>Budget:</strong> ${formData.budget || 'Not specified'}</p>
              </div>
              
              ${formData.mainChallenges ? `
                <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
                  <h2 style="color: #1e293b; margin-top: 0;">Main Challenges</h2>
                  <p>${formData.mainChallenges}</p>
                </div>
              ` : ''}
              
              ${formData.additionalInfo ? `
                <div style="background: #f8fafc; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
                  <h2 style="color: #1e293b; margin-top: 0;">Additional Information</h2>
                  <p>${formData.additionalInfo}</p>
                </div>
              ` : ''}
              
              <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 20px; border-radius: 8px; text-align: center;">
                <p style="color: white; margin: 0; font-weight: bold;">🎯 Priority: ${formData.urgency}</p>
                <p style="color: #d1fae5; margin: 5px 0 0 0; font-size: 14px;">Response within 24 hours guaranteed</p>
              </div>
            </div>
          `,
          // Also send confirmation to the requester
          reply_to: formData.email,
          organization_id: 'system' // Use system organization for demo requests
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send demo request')
      }

      const result = await response.json()

      if (result.success) {
        setSubmitted(true)
        toast({
          title: 'Demo Request Sent!',
          description: 'We\'ll contact you within 24 hours to schedule your personalized demo.',
        })
      } else {
        throw new Error(result.error || 'Failed to send demo request')
      }

    } catch (error) {
      console.error('Error submitting demo request:', error)
      toast({
        title: 'Submission Failed',
        description: 'Please try again or contact us directly at finance-demo@heraerp.com',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        {/* Background */}
        <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-emerald-900 to-green-900" />
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-900/30 via-transparent to-transparent" />
        
        {/* Success Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
          <Card className="max-w-2xl w-full bg-gray-900/80 backdrop-blur-xl border-emerald-500/30 shadow-2xl">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              
              <h1 className="text-3xl font-bold text-white mb-4">
                Demo Request Received!
              </h1>
              
              <p className="text-emerald-200 text-lg mb-6">
                Thank you for your interest in HERA Finance DNA v2. Our team will contact you within 24 hours to schedule your personalized demo.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <Clock className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  <p className="text-white font-medium">24 Hour</p>
                  <p className="text-emerald-200 text-sm">Response Time</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <Zap className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  <p className="text-white font-medium">30 Second</p>
                  <p className="text-emerald-200 text-sm">Demo Setup</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <DollarSign className="w-6 h-6 text-emerald-400 mx-auto mb-2" />
                  <p className="text-white font-medium">$2.8M+</p>
                  <p className="text-emerald-200 text-sm">Potential Savings</p>
                </div>
              </div>
              
              <Button 
                onClick={() => window.location.href = '/docs/hub'}
                size="lg" 
                className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white"
              >
                <BarChart3 className="w-5 h-5 mr-2" />
                Explore Documentation
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-violet-900 to-purple-900" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-900/30 via-transparent to-transparent" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-purple-900/30 via-transparent to-transparent" />

      {/* Floating orbs */}
      {mounted && (
        <>
          <div className="fixed top-20 left-10 w-72 h-72 bg-gradient-to-r from-violet-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse" />
          <div
            className="fixed bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-indigo-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse"
            style={{ animationDelay: '2s' }}
          />
        </>
      )}

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-gray-900/70 border-b border-white/10 shadow-lg">
          <div className="max-w-6xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 backdrop-blur-sm border border-violet-500/30">
                  <Rocket className="w-6 h-6 text-violet-300" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-white">HERA Finance DNA v2</h1>
                  <p className="text-sm text-gray-300">Enterprise Demo Request</p>
                </div>
              </div>
              <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/40">
                <Sparkles className="w-3 h-3 mr-1" />
                ENTERPRISE GRADE
              </Badge>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              Experience the Future of
              <span className="block bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                Enterprise Finance
              </span>
            </h1>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8">
              See how HERA Finance DNA v2 delivers <strong className="text-violet-300">$2.8M+ cost savings</strong> and 
              <strong className="text-violet-300"> 99.9% faster implementation</strong> compared to traditional ERP systems.
            </p>
            
            {/* Key Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
              <Card className="bg-gray-900/60 backdrop-blur-xl border-white/10 shadow-xl">
                <CardContent className="p-4 text-center">
                  <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <p className="text-white font-semibold">30 Second</p>
                  <p className="text-gray-300 text-sm">Implementation</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-900/60 backdrop-blur-xl border-white/10 shadow-xl">
                <CardContent className="p-4 text-center">
                  <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
                  <p className="text-white font-semibold">$2.8M+</p>
                  <p className="text-gray-300 text-sm">Cost Savings</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-900/60 backdrop-blur-xl border-white/10 shadow-xl">
                <CardContent className="p-4 text-center">
                  <Zap className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-white font-semibold">83ms</p>
                  <p className="text-gray-300 text-sm">Trial Balance</p>
                </CardContent>
              </Card>
              
              <Card className="bg-gray-900/60 backdrop-blur-xl border-white/10 shadow-xl">
                <CardContent className="p-4 text-center">
                  <Shield className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-white font-semibold">100%</p>
                  <p className="text-gray-300 text-sm">IFRS Compliant</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Demo Request Form */}
          <Card className="max-w-4xl mx-auto bg-gray-900/80 backdrop-blur-xl border-violet-500/30 shadow-2xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl text-white mb-2">
                Request Your Personalized Demo
              </CardTitle>
              <CardDescription className="text-violet-200 text-lg">
                See HERA Finance DNA v2 configured for your specific industry and business needs
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Company Information */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Building2 className="w-5 h-5 text-violet-400" />
                    <h3 className="text-lg font-semibold text-white">Company Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="companyName" className="text-gray-300">Company Name *</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                        placeholder="Your Company Name"
                        className="bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="industry" className="text-gray-300">Industry *</Label>
                      <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                        <SelectTrigger className="bg-gray-800/50 border-gray-600/50 text-white">
                          <SelectValue placeholder="Select your industry" />
                        </SelectTrigger>
                        <SelectContent className="hera-select-content">
                          {INDUSTRIES.map(industry => (
                            <SelectItem key={industry} value={industry} className="hera-select-item">
                              {industry}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="companySize" className="text-gray-300">Company Size</Label>
                      <Select value={formData.companySize} onValueChange={(value) => handleInputChange('companySize', value)}>
                        <SelectTrigger className="bg-gray-800/50 border-gray-600/50 text-white">
                          <SelectValue placeholder="Select company size" />
                        </SelectTrigger>
                        <SelectContent className="hera-select-content">
                          {COMPANY_SIZES.map(size => (
                            <SelectItem key={size} value={size} className="hera-select-item">
                              {size}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="country" className="text-gray-300">Country</Label>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        placeholder="Country"
                        className="bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400"
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-700/50" />

                {/* Contact Information */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="w-5 h-5 text-violet-400" />
                    <h3 className="text-lg font-semibold text-white">Contact Information</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="firstName" className="text-gray-300">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder="First Name"
                        className="bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="lastName" className="text-gray-300">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        placeholder="Last Name"
                        className="bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-300">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="your.email@company.com"
                        className="bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-300">Phone Number</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400"
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="jobTitle" className="text-gray-300">Job Title</Label>
                      <Input
                        id="jobTitle"
                        value={formData.jobTitle}
                        onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                        placeholder="CEO, CFO, CTO, etc."
                        className="bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400"
                      />
                    </div>
                  </div>
                </div>

                <Separator className="bg-gray-700/50" />

                {/* Business Requirements */}
                <div className="space-y-6">
                  <div className="flex items-center gap-3 mb-4">
                    <BarChart3 className="w-5 h-5 text-violet-400" />
                    <h3 className="text-lg font-semibold text-white">Business Requirements</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="urgency" className="text-gray-300">Urgency *</Label>
                      <Select value={formData.urgency} onValueChange={(value) => handleInputChange('urgency', value)}>
                        <SelectTrigger className="bg-gray-800/50 border-gray-600/50 text-white">
                          <SelectValue placeholder="When do you need this?" />
                        </SelectTrigger>
                        <SelectContent className="hera-select-content">
                          {URGENCIES.map(urgency => (
                            <SelectItem key={urgency} value={urgency} className="hera-select-item">
                              {urgency}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="budget" className="text-gray-300">Budget Range</Label>
                      <Select value={formData.budget} onValueChange={(value) => handleInputChange('budget', value)}>
                        <SelectTrigger className="bg-gray-800/50 border-gray-600/50 text-white">
                          <SelectValue placeholder="Select budget range" />
                        </SelectTrigger>
                        <SelectContent className="hera-select-content">
                          {BUDGETS.map(budget => (
                            <SelectItem key={budget} value={budget} className="hera-select-item">
                              {budget}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="currentSystem" className="text-gray-300">Current ERP/Finance System</Label>
                      <Input
                        id="currentSystem"
                        value={formData.currentSystem}
                        onChange={(e) => handleInputChange('currentSystem', e.target.value)}
                        placeholder="SAP, Oracle, QuickBooks, Excel, etc."
                        className="bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400"
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="mainChallenges" className="text-gray-300">Main Challenges with Current System</Label>
                      <Textarea
                        id="mainChallenges"
                        value={formData.mainChallenges}
                        onChange={(e) => handleInputChange('mainChallenges', e.target.value)}
                        placeholder="e.g., slow reporting, high costs, complex customization, poor user experience..."
                        className="bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 min-h-[100px]"
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="expectedROI" className="text-gray-300">Expected ROI/Business Impact</Label>
                      <Input
                        id="expectedROI"
                        value={formData.expectedROI}
                        onChange={(e) => handleInputChange('expectedROI', e.target.value)}
                        placeholder="Cost reduction, efficiency gains, compliance improvements, etc."
                        className="bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400"
                      />
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="additionalInfo" className="text-gray-300">Additional Information</Label>
                      <Textarea
                        id="additionalInfo"
                        value={formData.additionalInfo}
                        onChange={(e) => handleInputChange('additionalInfo', e.target.value)}
                        placeholder="Any specific requirements, questions, or additional context..."
                        className="bg-gray-800/50 border-gray-600/50 text-white placeholder-gray-400 min-h-[80px]"
                      />
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-6">
                  <Button
                    type="submit"
                    disabled={loading}
                    size="lg"
                    className="w-full bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white shadow-lg text-lg py-6"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                        Sending Demo Request...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-3" />
                        Request Personalized Demo
                        <ArrowRight className="w-5 h-5 ml-3" />
                      </>
                    )}
                  </Button>
                  
                  <p className="text-center text-gray-400 text-sm mt-4">
                    🔒 Your information is secure and will only be used to provide you with a personalized demo
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
          
          {/* Trust Indicators */}
          <div className="max-w-4xl mx-auto mt-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-green-500 rounded-full flex items-center justify-center mb-4">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-white font-semibold mb-2">24-Hour Response</h4>
                <p className="text-gray-400 text-sm">Our enterprise team will contact you within 24 hours to schedule your demo</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-white font-semibold mb-2">Tailored Experience</h4>
                <p className="text-gray-400 text-sm">Demo customized for your specific industry and business requirements</p>
              </div>
              
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-white font-semibold mb-2">Enterprise Security</h4>
                <p className="text-gray-400 text-sm">Bank-grade security with complete data privacy and confidentiality</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}