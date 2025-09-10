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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 dark:from-black dark:via-blue-950/50 dark:to-black relative overflow-hidden">
      {/* Premium mesh gradient background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent" />
      </div>
      
      {/* Animated glassmorphic orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full blur-3xl animate-float animation-delay-2000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-full blur-3xl animate-float animation-delay-4000" />
      </div>
      
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" style={{
        backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32' width='32' height='32' fill='none' stroke='rgb(255 255 255 / 0.1)'%3e%3cpath d='M0 .5H31.5V32'/%3e%3c/svg%3e")`
      }} />

      {/* Header with Logo */}
      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-black/20 border-b border-white/10">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 sm:space-x-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm sm:text-lg">H</span>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-white">HERA ERP</h1>
                <p className="text-[10px] sm:text-xs text-gray-300 hidden sm:block">Universal Business Platform</p>
              </div>
            </Link>
            
            <Link href="/auth/login">
              <Button variant="ghost" className="text-gray-300 hover:text-white border border-white/20 hover:bg-white/10">
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
            <div className={`flex items-center ${step >= 1 ? 'text-white' : 'text-gray-500'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                step >= 1 ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white transform scale-110' : 'bg-white/10 backdrop-blur-xl border border-white/20'
              }`}>
                <span className="font-semibold">1</span>
              </div>
              <span className="ml-2 hidden sm:inline font-medium">Account</span>
            </div>
            <div className={`w-16 h-1 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' : 'bg-white/20'}`} />
            <div className={`flex items-center ${step >= 2 ? 'text-white' : 'text-gray-500'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
                step >= 2 ? 'bg-gradient-to-br from-blue-500 to-cyan-500 text-white transform scale-110' : 'bg-white/10 backdrop-blur-xl border border-white/20'
              }`}>
                <span className="font-semibold">2</span>
              </div>
              <span className="ml-2 hidden sm:inline font-medium">Profile</span>
            </div>
            <div className={`w-16 h-1 rounded-full bg-white/20`} />
            <div className="flex items-center text-gray-500">
              <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-lg">
                <span className="font-semibold">3</span>
              </div>
              <span className="ml-2 hidden sm:inline font-medium">Organization</span>
            </div>
          </div>
        </div>

        {step === 1 && (
          <Card className="bg-white/10 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-white/30 overflow-hidden">
            <CardHeader className="text-center pb-6 pt-8 bg-gradient-to-b from-white/5 to-transparent">
              <CardTitle className="text-2xl font-bold text-white">Create Your HERA Account</CardTitle>
              <CardDescription className="text-gray-300 mt-2">
                Start your journey to enterprise-grade ERP in minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              <form onSubmit={handleStep1Submit} className="space-y-4">
                {error && (
                  <Alert variant="destructive" className="bg-red-500/10 backdrop-blur-xl border-red-500/30 text-red-200">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium text-gray-200">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    required
                    disabled={isLoading}
                    className="h-12 bg-black/30 backdrop-blur-xl border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all hover:bg-black/40"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium text-gray-200">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    required
                    disabled={isLoading}
                    minLength={8}
                    className="h-12 bg-black/30 backdrop-blur-xl border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all hover:bg-black/40"
                  />
                  <p className="text-xs text-gray-400">
                    Must be at least 8 characters
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-200">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    required
                    disabled={isLoading}
                    className="h-12 bg-black/30 backdrop-blur-xl border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all hover:bg-black/40"
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold shadow-[0_5px_20px_0_rgba(59,130,246,0.5)] hover:shadow-[0_5px_20px_0_rgba(59,130,246,0.7)] transform hover:-translate-y-0.5 transition-all duration-200"
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
                <span className="text-gray-300">Already have an account?</span>
                {' '}
                <Link href="/auth/login" className="text-blue-400 hover:text-blue-300 font-medium transition-all duration-200">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="bg-white/10 backdrop-blur-2xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] border border-white/30 overflow-hidden">
            <CardHeader className="text-center pb-6 pt-8 bg-gradient-to-b from-white/5 to-transparent">
              <CardTitle className="text-2xl font-bold text-white">Complete Your Profile</CardTitle>
              <CardDescription className="text-gray-300 mt-2">
                Tell us a bit about yourself (optional)
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-8">
              <form onSubmit={handleStep2Submit} className="space-y-4">
                <div className="mb-4 p-4 bg-green-500/10 backdrop-blur-xl rounded-lg border border-green-500/30">
                  <p className="text-sm text-green-300">
                    ✓ Account created successfully! Check your email to verify your address.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-sm font-medium text-gray-200">Full Name</Label>
                  <Input
                    id="full_name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                    disabled={isLoading}
                    className="h-12 bg-black/30 backdrop-blur-xl border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all hover:bg-black/40"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium text-gray-200">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    disabled={isLoading}
                    className="h-12 bg-black/30 backdrop-blur-xl border-white/20 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all hover:bg-black/40"
                  />
                </div>
                
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1 h-12 bg-white/10 backdrop-blur-xl border-white/20 text-white hover:bg-white/20"
                    onClick={() => router.push('/auth/organizations/new')}
                  >
                    Skip
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold shadow-[0_5px_20px_0_rgba(59,130,246,0.5)] hover:shadow-[0_5px_20px_0_rgba(59,130,246,0.7)] transform hover:-translate-y-0.5 transition-all duration-200"
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