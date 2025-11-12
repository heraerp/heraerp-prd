/**
 * HERA Retail Login Page
 * Smart Code: HERA.RETAIL.LOGIN.v1
 * 
 * Authentication page for HERA Retail & Distribution system
 * Organization: HERA Retail Demo (ff837c4c-95f2-43ac-a498-39597018b10c)
 * Demo Credentials: retail@heraerp.com / demo2025!
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ShoppingBag, 
  Mail, 
  Lock, 
  Loader2, 
  ArrowRight,
  Store,
  Package,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  Building
} from 'lucide-react'

export default function RetailLogin() {
  const router = useRouter()
  const { login, isAuthenticated, isLoading } = useHERAAuth()
  
  const [email, setEmail] = useState('retail@heraerp.com')
  const [password, setPassword] = useState('demo2025!')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [showCredentials, setShowCredentials] = useState(true)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/retail/dashboard')
    }
  }, [isAuthenticated, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError(null)

    try {
      await login(email, password)
      // Authentication provider will handle redirect
    } catch (error) {
      console.error('Retail login error:', error)
      setLoginError(error instanceof Error ? error.message : 'Login failed. Please try again.')
    } finally {
      setLoginLoading(false)
    }
  }

  const handleDemoLogin = () => {
    setEmail('retail@heraerp.com')
    setPassword('demo2025!')
    setShowCredentials(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600">Loading retail system...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
      
      {/* Header */}
      <header className="relative z-10 p-6">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-100 p-2 rounded-xl">
            <ShoppingBag className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">HERA Retail & Distribution</h1>
            <p className="text-sm text-slate-500">Enterprise Retail Management Platform</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center px-6 pb-12">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column - Features */}
          <div className="space-y-8">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-4">
                Welcome to
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600 block">
                  HERA Retail
                </span>
              </h2>
              <p className="text-xl text-slate-600 mb-8">
                Complete retail and distribution management with real-time analytics, 
                inventory control, and customer insights.
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-slate-200">
                <div className="bg-indigo-100 p-2 rounded-lg w-fit mb-3">
                  <Store className="h-5 w-5 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">Multi-Store POS</h3>
                <p className="text-sm text-slate-600">Unified point of sale across all locations</p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-slate-200">
                <div className="bg-blue-100 p-2 rounded-lg w-fit mb-3">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">Smart Inventory</h3>
                <p className="text-sm text-slate-600">Real-time stock tracking and auto-replenishment</p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-slate-200">
                <div className="bg-emerald-100 p-2 rounded-lg w-fit mb-3">
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">Live Analytics</h3>
                <p className="text-sm text-slate-600">Business intelligence and performance KPIs</p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-slate-200">
                <div className="bg-pink-100 p-2 rounded-lg w-fit mb-3">
                  <Users className="h-5 w-5 text-pink-600" />
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">Customer 360°</h3>
                <p className="text-sm text-slate-600">Complete customer profiles and loyalty</p>
              </div>
            </div>

            {/* Organization Info */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 p-6 rounded-xl border border-indigo-200">
              <div className="flex items-center gap-3 mb-3">
                <Building className="h-5 w-5 text-indigo-600" />
                <span className="font-semibold text-indigo-900">Demo Organization</span>
              </div>
              <h4 className="font-bold text-slate-900">HERA Retail Demo</h4>
              <p className="text-sm text-slate-600 font-mono mt-1">
                ID: ff837c4c-95f2-43ac-a498-39597018b10c
              </p>
            </div>
          </div>

          {/* Right Column - Login Form */}
          <div className="flex justify-center lg:justify-end">
            <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm border-slate-200 shadow-xl">
              <CardHeader className="text-center pb-4">
                <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-3 rounded-xl w-fit mx-auto mb-4">
                  <ShoppingBag className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-2xl text-slate-900">Sign In</CardTitle>
                <CardDescription className="text-slate-600">
                  Access your retail management dashboard
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Demo Credentials Alert */}
                {showCredentials && (
                  <Alert className="border-emerald-200 bg-emerald-50">
                    <CheckCircle className="h-4 w-4 text-emerald-600" />
                    <AlertDescription className="text-emerald-800">
                      <div className="font-semibold mb-2">Demo Credentials Ready</div>
                      <div className="text-sm space-y-1">
                        <div><strong>Email:</strong> retail@heraerp.com</div>
                        <div><strong>Password:</strong> demo2025!</div>
                      </div>
                      <Button 
                        onClick={handleDemoLogin}
                        size="sm" 
                        className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        Use Demo Login
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Login Error */}
                {loginError && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      {loginError}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-700">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-700">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 border-slate-300 focus:border-indigo-500 focus:ring-indigo-500"
                        placeholder="Enter your password"
                        required
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={loginLoading}
                    className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold py-3"
                  >
                    {loginLoading ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Signing In...
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span>Sign In</span>
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    )}
                  </Button>
                </form>

                {/* Footer Links */}
                <div className="text-center pt-4 border-t border-slate-200">
                  <p className="text-sm text-slate-500">
                    Need help?{' '}
                    <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">
                      Contact Support
                    </a>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}