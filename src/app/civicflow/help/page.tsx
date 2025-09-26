'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { useOrgStore } from '@/state/org'
import {
  Zap,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Bug,
  Shield,
  Rocket,
  HelpCircle,
  ArrowLeft,
  Sparkles,
  MessageSquare,
  Code,
  Palette
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface FeatureCategory {
  id: string
  label: string
  description: string
  icon: React.ElementType
  color: string
}

const categories: FeatureCategory[] = [
  {
    id: 'feature',
    label: 'Feature Request',
    description: 'Suggest a new feature or enhancement',
    icon: Lightbulb,
    color: 'text-yellow-500'
  },
  {
    id: 'bug',
    label: 'Bug Report',
    description: 'Report an issue or problem',
    icon: Bug,
    color: 'text-red-500'
  },
  {
    id: 'integration',
    label: 'Integration Request',
    description: 'Request a new integration or API',
    icon: Zap,
    color: 'text-purple-500'
  },
  {
    id: 'security',
    label: 'Security Enhancement',
    description: 'Suggest security improvements',
    icon: Shield,
    color: 'text-blue-500'
  },
  {
    id: 'ui-ux',
    label: 'UI/UX Improvement',
    description: 'Suggest design or usability improvements',
    icon: Palette,
    color: 'text-pink-500'
  },
  {
    id: 'api',
    label: 'API Enhancement',
    description: 'Request API features or improvements',
    icon: Code,
    color: 'text-green-500'
  },
  {
    id: 'other',
    label: 'Other',
    description: 'General feedback or suggestions',
    icon: MessageSquare,
    color: 'text-gray-500'
  }
]

const priorityLevels = [
  { value: 'low', label: 'Low', description: 'Nice to have' },
  { value: 'medium', label: 'Medium', description: 'Would improve my workflow' },
  { value: 'high', label: 'High', description: 'Critical for my use case' }
]

export default function HelpPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { currentOrgId } = useOrgStore()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    priority: 'medium',
    title: '',
    description: '',
    currentApp: typeof window !== 'undefined' ? window.location.pathname : '',
    organizationId: currentOrgId || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.name ||
      !formData.email ||
      !formData.category ||
      !formData.title ||
      !formData.description
    ) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/request-feature', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          organizationId: currentOrgId || 'unknown',
          timestamp: new Date().toISOString()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit request')
      }

      setSubmitted(true)
      toast({
        title: 'Request Submitted!',
        description: "Thank you for your feedback. We'll review it and get back to you soon."
      })

      // Reset form after 3 seconds
      setTimeout(() => {
        router.push(formData.currentApp || '/civicflow')
      }, 3000)
    } catch (error) {
      console.error('Error submitting request:', error)
      toast({
        title: 'Submission Failed',
        description:
          error instanceof Error
            ? error.message
            : 'Failed to submit your request. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedCategory = categories.find(c => c.id === formData.category)

  if (submitted) {
    return (
      <div className="container max-w-2xl mx-auto py-12">
        <Card className="bg-panel border-border">
          <CardContent className="pt-12 pb-8 text-center">
            <div className="mb-6 inline-flex p-4 rounded-full bg-green-500/20">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Thank You!</h2>
            <p className="text-text-200 mb-6">
              Your feature request has been submitted successfully.
            </p>
            <p className="text-sm text-text-300">Redirecting you back...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-text-300 hover:text-text-100"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <div className="p-2 rounded-xl bg-[rgb(0,166,166)]/20">
                <Rocket className="h-8 w-8 text-[rgb(0,166,166)]" />
              </div>
              Request a Feature
            </h1>
            <p className="text-text-200 mt-1">Help us improve by sharing your ideas and feedback</p>
          </div>
        </div>
      </div>

      {/* Info Alert */}
      <Alert className="bg-[rgb(0,166,166)]/10 border-[rgb(0,166,166)]/20">
        <Sparkles className="h-4 w-4 text-[rgb(0,166,166)]" />
        <AlertDescription className="text-text-200">
          Your feedback helps shape the future of our platform. We review every request and
          prioritize based on community needs.
        </AlertDescription>
      </Alert>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Category Selection */}
          <div className="lg:col-span-1">
            <Card className="bg-panel-alt border-border sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Category</CardTitle>
                <CardDescription>Select the type of request</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map(category => {
                  const Icon = category.icon
                  const isSelected = formData.category === category.id

                  return (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: category.id })}
                      className={cn(
                        'w-full p-3 rounded-lg border transition-all text-left',
                        isSelected
                          ? 'bg-[rgb(0,166,166)]/10 border-[rgb(0,166,166)] shadow-sm'
                          : 'bg-panel border-border hover:border-[rgb(0,166,166)]/50'
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={cn(
                            'p-1.5 rounded-lg bg-white/5',
                            isSelected && 'bg-[rgb(0,166,166)]/20'
                          )}
                        >
                          <Icon className={cn('h-5 w-5', category.color)} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-text-100">{category.label}</p>
                          <p className="text-xs text-text-300 mt-0.5">{category.description}</p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Form Fields */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <Card className="bg-panel border-border">
              <CardHeader>
                <CardTitle className="text-lg">Contact Information</CardTitle>
                <CardDescription>So we can follow up on your request</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-text-200">
                      Your Name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Doe"
                      className="bg-panel-alt border-border text-text-100"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-text-200">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@example.com"
                      className="bg-panel-alt border-border text-text-100"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Request Details */}
            <Card className="bg-panel border-border">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Request Details
                  {selectedCategory && (
                    <Badge variant="outline" className="ml-2">
                      <selectedCategory.icon
                        className={cn('h-3 w-3 mr-1', selectedCategory.color)}
                      />
                      {selectedCategory.label}
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>Describe your request in detail</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-text-200">
                    Priority Level
                  </Label>
                  <Select
                    value={formData.priority}
                    onValueChange={value => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger
                      id="priority"
                      className="bg-panel-alt border-border text-text-100"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-panel border-border">
                      {priorityLevels.map(level => (
                        <SelectItem key={level.value} value={level.value}>
                          <div>
                            <p className="font-medium">{level.label}</p>
                            <p className="text-xs text-text-300">{level.description}</p>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title" className="text-text-200">
                    Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Brief summary of your request"
                    className="bg-panel-alt border-border text-text-100"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-text-200">
                    Description <span className="text-red-500">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Provide as much detail as possible about your request..."
                    className="bg-panel-alt border-border text-text-100 min-h-[150px]"
                    required
                  />
                  <p className="text-xs text-text-300">
                    Include use cases, benefits, and any specific requirements
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="border-[rgb(0,166,166)] text-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !formData.category}
                className="bg-[rgb(0,166,166)] hover:bg-[rgb(0,166,166)]/90 text-white min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Request
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
