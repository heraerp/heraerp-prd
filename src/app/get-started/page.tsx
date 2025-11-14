'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Loader2,
  LogIn,
  UserPlus,
  AlertCircle,
  Rocket,
  CheckCircle,
  Building2,
  Shield,
  Zap,
  Globe
} from 'lucide-react'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import Link from 'next/link'

export default function GetStartedPage() {
  const router = useRouter()
  const { login, register, isAuthenticated } = useHERAAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Login form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Register form state
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: ''
  })

  // Redirect if already authenticated
  React.useEffect(() => {
    if (isAuthenticated) {
      router.push('/auth/organizations')
    }
  }, [isAuthenticated, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      await login(loginEmail, loginPassword)
      const redirectUrl = localStorage.getItem('redirectAfterLogin') || '/auth/organizations'
      localStorage.removeItem('redirectAfterLogin')
      router.push(redirectUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to login')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate passwords match
    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    // Validate password strength
    if (registerData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    try {
      await register(registerData.email, registerData.password, {
        full_name: registerData.fullName
      })

      // After registration, redirect to organization creation
      router.push('/auth/organizations/new')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-white to-gray-900">
      {/* Header */}
      <header className="py-8 bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-background rounded-lg flex items-center justify-center">
                <span className="text-sm font-bold text-foreground">H</span>
              </div>
              <span className="text-xl font-light">HERA</span>
            </Link>
            <Link href="/apps" className="-muted hover:ink transition-colors">
              View All Apps
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-light ink mb-6">Start Your HERA Journey</h1>
            <p className="text-xl ink-muted max-w-3xl mx-auto">
              Enterprise-grade ERP that's live in 2 weeks. Join thousands of businesses already
              transforming their operations with HERA.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left Column - Benefits */}
            <div className="space-y-8">
              {/* Value Props */}
              <Card className="border-2 border-gray-100">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Rocket className="w-6 h-6 text-primary" />
                    Why Choose HERA?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium ink">2-Week Implementation Guarantee</p>
                        <p className="text-sm ink-muted">
                          Live in 14 days or your implementation is free
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium ink">70% Cost Savings</p>
                        <p className="text-sm ink-muted">
                          Enterprise features at small business prices
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium ink">Industry-Specific Solutions</p>
                        <p className="text-sm ink-muted">
                          Pre-configured for salon, restaurant, healthcare & more
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium ink">AI-Powered Automation</p>
                        <p className="text-sm ink-muted">
                          85% journal automation, smart insights, and more
                        </p>
                      </div>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Security & Trust */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-6 h-6 text-primary" />
                    <h3 className="text-lg font-semibold ink">Enterprise Security</h3>
                  </div>
                  <ul className="space-y-2 text-sm ink-muted">
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                      Perfect multi-tenant isolation
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                      SOC2 compliant infrastructure
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                      Daily automated backups
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-blue-600 rounded-full" />
                      99.9% uptime guarantee
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Demo Credentials */}
              <Alert className="border-amber-200 bg-amber-50">
                <Zap className="h-4 w-4 text-amber-600" />
                <AlertDescription className="ink">
                  <strong>Quick Demo:</strong> Use mario@restaurant.com / securepass123 to explore a
                  fully configured restaurant
                </AlertDescription>
              </Alert>
            </div>

            {/* Right Column - Auth Form */}
            <Card className="shadow-xl border-2 border-gray-100">
              <CardHeader>
                <CardTitle className="text-2xl">Create Your Account</CardTitle>
                <CardDescription>
                  Start your free trial and get your business running in minutes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="register" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="login">Sign In</TabsTrigger>
                    <TabsTrigger value="register">Sign Up</TabsTrigger>
                  </TabsList>

                  {/* Login Form */}
                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4">
                      {error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="login-email">Email</Label>
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="your@email.com"
                          value={loginEmail}
                          onChange={e => setLoginEmail(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="login-password">Password</Label>
                        <Input
                          id="login-password"
                          type="password"
                          placeholder="••••••••"
                          value={loginPassword}
                          onChange={e => setLoginPassword(e.target.value)}
                          required
                          disabled={isLoading}
                        />
                      </div>

                      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Signing In...
                          </>
                        ) : (
                          <>
                            <LogIn className="mr-2 h-4 w-4" />
                            Sign In
                          </>
                        )}
                      </Button>
                    </form>
                  </TabsContent>

                  {/* Register Form */}
                  <TabsContent value="register">
                    <form onSubmit={handleRegister} className="space-y-4">
                      {error && (
                        <Alert variant="destructive">
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>{error}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-2">
                        <Label htmlFor="full-name">Full Name</Label>
                        <Input
                          id="full-name"
                          type="text"
                          placeholder="John Doe"
                          value={registerData.fullName}
                          onChange={e =>
                            setRegisterData({ ...registerData, fullName: e.target.value })
                          }
                          required
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-email">Email</Label>
                        <Input
                          id="register-email"
                          type="email"
                          placeholder="your@email.com"
                          value={registerData.email}
                          onChange={e =>
                            setRegisterData({ ...registerData, email: e.target.value })
                          }
                          required
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="register-password">Password</Label>
                        <Input
                          id="register-password"
                          type="password"
                          placeholder="••••••••"
                          value={registerData.password}
                          onChange={e =>
                            setRegisterData({ ...registerData, password: e.target.value })
                          }
                          required
                          disabled={isLoading}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="confirm-password">Confirm Password</Label>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="••••••••"
                          value={registerData.confirmPassword}
                          onChange={e =>
                            setRegisterData({ ...registerData, confirmPassword: e.target.value })
                          }
                          required
                          disabled={isLoading}
                        />
                      </div>

                      <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                        {isLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Creating Account...
                          </>
                        ) : (
                          <>
                            <UserPlus className="mr-2 h-4 w-4" />
                            Create Free Account
                          </>
                        )}
                      </Button>

                      <p className="text-xs text-muted-foreground text-center mt-4">
                        By signing up, you agree to our Terms of Service and Privacy Policy
                      </p>
                    </form>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Available Industries */}
          <div className="mt-20">
            <h2 className="text-2xl font-light text-center text-gray-100 mb-8">
              Available Industry Solutions
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="text-center p-4 bg-background rounded-lg border border-border">
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">✂️</span>
                </div>
                <p className="text-sm font-medium">Salon & Spa</p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg border border-border">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">🍽️</span>
                </div>
                <p className="text-sm font-medium">Restaurant</p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg border border-border">
                <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">🍦</span>
                </div>
                <p className="text-sm font-medium">Ice Cream</p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg border border-border">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">🏥</span>
                </div>
                <p className="text-sm font-medium">Healthcare</p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg border border-border">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">💎</span>
                </div>
                <p className="text-sm font-medium">Jewelry</p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg border border-border">
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">🛍️</span>
                </div>
                <p className="text-sm font-medium">Retail</p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg border border-border">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">🏭</span>
                </div>
                <p className="text-sm font-medium">Manufacturing</p>
              </div>
              <div className="text-center p-4 bg-background rounded-lg border border-border">
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Globe className="w-6 h-6 text-emerald-600" />
                </div>
                <p className="text-sm font-medium">Any Business</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
