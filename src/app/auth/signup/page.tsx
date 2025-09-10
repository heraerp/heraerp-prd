'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, UserPlus, AlertCircle, ArrowRight } from 'lucide-react'
import { useMultiOrgAuth } from '@/components/auth/MultiOrgAuthProvider'

export default function SignUpPage() {
  const router = useRouter()
  const { register } = useMultiOrgAuth()
  
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Form data
  const [formData, setFormData] = useState({
    // Step 1: Account
    email: '',
    password: '',
    confirmPassword: '',
    
    // Step 2: Profile
    full_name: '',
    phone: '',
  })

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password strength
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setIsLoading(true)

    try {
      // Register with Supabase
      const result = await register(formData.email, formData.password, {
        full_name: formData.full_name || formData.email.split('@')[0],
        phone: formData.phone
      })

      // Check if this was an existing user
      // Supabase returns a user object but no session for existing users
      // The user object has identities array empty for existing users
      if (result && result.user) {
        // For new users, identities array will have entries
        // For existing users, it will be empty or the user object will have different characteristics
        const isExistingUser = !result.session || 
                              (result.user.identities && result.user.identities.length === 0) ||
                              result.user.email_confirmed_at !== null

        if (isExistingUser) {
          setError('An account with this email already exists. Please sign in instead.')
          // Redirect to login after 2 seconds
          setTimeout(() => {
            router.push('/auth/login')
          }, 2000)
          return
        }
      }

      // Move to next step only for new users
      setStep(2)
    } catch (err) {
      // Handle specific Supabase errors
      const errorMessage = err instanceof Error ? err.message : 'Failed to create account'
      
      // Check for common existing user error messages
      if (errorMessage.toLowerCase().includes('already registered') || 
          errorMessage.toLowerCase().includes('already exists')) {
        setError('An account with this email already exists. Please sign in instead.')
        // Redirect to login after 2 seconds
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
      } else {
        setError(errorMessage)
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault()
    // After profile completion, redirect to organization creation
    router.push('/auth/organizations/new')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-blue-950">
      {/* Background Pattern - Same as home page */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 sm:w-96 h-72 sm:h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-2xl opacity-10 animate-blob dark:bg-blue-600 dark:opacity-20" />
        <div className="absolute top-40 right-20 w-72 sm:w-96 h-72 sm:h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-2xl opacity-10 animate-blob animation-delay-2000 dark:bg-purple-600 dark:opacity-20" />
        <div className="absolute -bottom-20 left-40 w-72 sm:w-96 h-72 sm:h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-2xl opacity-10 animate-blob animation-delay-4000 dark:bg-pink-600 dark:opacity-20" />
      </div>

      {/* Header with Logo - Same as home page */}
      <header className="sticky top-0 z-50 backdrop-blur-lg bg-white/70 dark:bg-slate-900/70 border-b border-slate-200 dark:border-slate-800">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm sm:text-lg">H</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">HERA ERP</h1>
                <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 hidden sm:block">Universal Business Platform</p>
              </div>
            </Link>
            
            <Link href="/auth/login">
              <Button variant="ghost" className="text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-lg mx-auto">
        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                step >= 1 ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white transform scale-110' : 'bg-slate-200 dark:bg-slate-700'
              }`}>
                <span className="font-semibold">1</span>
              </div>
              <span className="ml-2 hidden sm:inline font-medium">Account</span>
            </div>
            <div className={`w-16 h-1 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-slate-200 dark:bg-slate-700'}`} />
            <div className={`flex items-center ${step >= 2 ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                step >= 2 ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-white transform scale-110' : 'bg-slate-200 dark:bg-slate-700'
              }`}>
                <span className="font-semibold">2</span>
              </div>
              <span className="ml-2 hidden sm:inline font-medium">Profile</span>
            </div>
            <div className={`w-16 h-1 rounded-full bg-slate-200 dark:bg-slate-700`} />
            <div className="flex items-center text-slate-400 dark:text-slate-500">
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shadow-lg">
                <span className="font-semibold">3</span>
              </div>
              <span className="ml-2 hidden sm:inline font-medium">Organization</span>
            </div>
          </div>
        </div>

        {step === 1 && (
          <Card className="backdrop-blur-lg bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">Create Your HERA Account</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Start your journey to enterprise-grade ERP in minutes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStep1Submit} className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
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
                    minLength={8}
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Must be at least 8 characters
                  </p>
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
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
              
              <div className="mt-6 text-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">Already have an account?</span>
                {' '}
                <Link href="/auth/login" className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 font-medium transition-all duration-200">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="backdrop-blur-lg bg-white/80 dark:bg-slate-900/80 border-slate-200 dark:border-slate-800 shadow-xl">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">Complete Your Profile</CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-400">
                Tell us a bit about yourself (optional)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleStep2Submit} className="space-y-4">
                <div className="mb-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✓ Account created successfully! Check your email to verify your address.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    disabled={isLoading}
                  />
                </div>
                
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                    onClick={() => router.push('/auth/organizations/new')}
                  >
                    Skip
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg transition-all duration-200 transform hover:scale-[1.02]"
                    disabled={isLoading}
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    </div>
  )
}