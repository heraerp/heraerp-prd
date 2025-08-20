'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/DualAuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Building2, Store, Scissors, Heart, Gem, Factory, Briefcase, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const businessTypes = [
  { value: 'restaurant', label: 'Restaurant', icon: Store },
  { value: 'salon', label: 'Salon & Spa', icon: Scissors },
  { value: 'healthcare', label: 'Healthcare', icon: Heart },
  { value: 'jewelry', label: 'Jewelry', icon: Gem },
  { value: 'manufacturing', label: 'Manufacturing', icon: Factory },
  { value: 'professional', label: 'Professional Services', icon: Briefcase },
]

export default function OnboardingPage() {
  const router = useRouter()
  const { user, refreshContext } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    organizationName: '',
    businessType: '',
    ownerName: '',
  })

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      ownerName: user?.name || ''
    }))
  }, [user])

  const handleSubmit = async () => {
    if (!formData.organizationName || !formData.businessType) {
      toast.error('Please fill in all required fields')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/v1/create-business', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          organization_name: formData.organizationName,
          business_type: formData.businessType,
          owner_name: formData.ownerName || user?.name || 'Business Owner',
          user_email: user?.email,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create organization')
      }

      const result = await response.json()
      
      // Refresh auth context to get new organization
      await refreshContext()

      toast.success(`Your ${formData.businessType} business has been set up successfully!`)

      // Redirect to appropriate dashboard
      switch (formData.businessType) {
        case 'salon':
          router.push('/salon')
          break
        case 'restaurant':
          router.push('/restaurant')
          break
        case 'healthcare':
          router.push('/healthcare')
          break
        case 'jewelry':
          router.push('/jewelry-progressive')
          break
        default:
          router.push('/dashboard')
      }
    } catch (error) {
      console.error('Onboarding error:', error)
      toast.error('There was an error creating your organization. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold">Welcome to HERA</CardTitle>
          <CardDescription className="text-lg">
            Let's set up your business in just a few steps
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="organizationName">What's your business name?</Label>
                <Input
                  id="organizationName"
                  placeholder="e.g., ABC Company"
                  value={formData.organizationName}
                  onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                  className="text-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ownerName">Your name</Label>
                <Input
                  id="ownerName"
                  placeholder="e.g., John Doe"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                />
              </div>
              <Button 
                onClick={() => setStep(2)} 
                className="w-full"
                disabled={!formData.organizationName}
              >
                Next
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>What type of business do you run?</Label>
                <RadioGroup 
                  value={formData.businessType} 
                  onValueChange={(value) => setFormData({ ...formData, businessType: value })}
                >
                  <div className="grid grid-cols-2 gap-4">
                    {businessTypes.map((type) => {
                      const Icon = type.icon
                      return (
                        <Label
                          key={type.value}
                          htmlFor={type.value}
                          className={`relative flex cursor-pointer flex-col items-center space-y-3 rounded-lg border p-4 hover:bg-accent ${
                            formData.businessType === type.value ? 'border-primary bg-accent' : ''
                          }`}
                        >
                          <RadioGroupItem value={type.value} id={type.value} className="sr-only" />
                          <Icon className="h-8 w-8" />
                          <span className="text-sm font-medium">{type.label}</span>
                        </Label>
                      )
                    })}
                  </div>
                </RadioGroup>
              </div>
              <div className="flex gap-4">
                <Button 
                  variant="outline" 
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button 
                  onClick={handleSubmit} 
                  className="flex-1"
                  disabled={!formData.businessType || isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Complete Setup'
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}