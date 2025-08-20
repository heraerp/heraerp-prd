'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, UserPlus, AlertCircle, ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '@/components/auth/DualAuthProvider'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const { register, isAuthenticated } = useAuth()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    ownerName: '',
    phone: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [step, setStep] = useState(1) // 1: Account details, 2: Business details

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/salon')
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      // Register user with Supabase
      await register(formData.email, formData.password, {
        business_name: formData.businessName,
        owner_name: formData.ownerName,
        phone: formData.phone,
        business_type: 'salon'
      })

      // Note: In production, you would also:
      // 1. Create organization in core_organizations
      // 2. Create user entity in core_entities
      // 3. Set up initial salon data (services, staff, etc.)
      // 4. Send welcome email

      // Redirect to salon dashboard
      router.push('/salon')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  const nextStep = () => {
    if (!formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setError(null)
    setStep(2)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
            Start Your Salon Journey
          </CardTitle>
          <CardDescription>
            {step === 1 ? 'Create your account' : 'Tell us about your salon'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {step === 1 ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <Button
                  type="button"
                  onClick={nextStep}
                  className="w-full bg-pink-600 hover:bg-pink-700"
                  disabled={isLoading}
                >
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="businessName">Salon Name</Label>
                  <Input
                    id="businessName"
                    type="text"
                    placeholder="Glamour Beauty Salon"
                    value={formData.businessName}
                    onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ownerName">Your Name</Label>
                  <Input
                    id="ownerName"
                    type="text"
                    placeholder="Sarah Johnson"
                    value={formData.ownerName}
                    onChange={(e) => setFormData({...formData, ownerName: e.target.value})}
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+971 50 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-pink-600 hover:bg-pink-700"
                    disabled={isLoading || !formData.businessName || !formData.ownerName}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create Account
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>
          
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>Already have an account?</p>
            <Link href="/auth/login" className="text-pink-600 hover:text-pink-700 font-medium">
              Sign in here
            </Link>
          </div>
          
          {step === 2 && (
            <div className="mt-4 p-4 bg-purple-50 rounded-lg text-sm text-purple-700">
              <p className="font-medium mb-1">What happens next?</p>
              <ul className="space-y-1 text-xs">
                <li>✓ Your salon will be set up instantly</li>
                <li>✓ Default services and settings will be created</li>
                <li>✓ You can start managing appointments right away</li>
                <li>✓ 30-day free trial, no credit card required</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}