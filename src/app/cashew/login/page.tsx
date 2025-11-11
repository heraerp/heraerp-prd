'use client'

/**
 * HERA Cashew Manufacturing Login Page
 * Smart Code: HERA.CASHEW.LOGIN.PAGE.v1
 * 
 * Simplified authentication portal for cashew processing industry
 * Uses dedicated CashewAuthProvider for simple credential-based auth
 */

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCashewAuth } from '@/components/auth/CashewAuthProvider'
import { 
  Leaf,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle,
  Package,
  Truck,
  Award,
  Globe,
  Loader2
} from 'lucide-react'

export default function CashewLoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, isLoading: authLoading } = useCashewAuth()
  
  // Pre-fill with cashew credentials
  const [formData, setFormData] = useState({
    email: 'admin@keralacashew.com',
    password: 'CashewAdmin2024!'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect to cashew dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/cashew')
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      // Use simplified CashewAuthProvider login
      await login(formData.email, formData.password)
      
      // Redirect to cashew dashboard
      router.push('/cashew')
      
    } catch (error: any) {
      console.error('Login error:', error)
      setError(error.message || 'Login failed. Please check your credentials and try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const features = [
    {
      icon: Package,
      title: 'Complete Processing',
      description: 'Raw cashew nuts to export-ready kernels'
    },
    {
      icon: Award,
      title: 'Quality Control',
      description: 'AQL-based inspections and certifications'
    },
    {
      icon: Globe,
      title: 'Export Ready',
      description: 'Global markets compliance and traceability'
    }
  ]

  return (
    <>
      {/* Emergency CSS Fallback */}
      <link rel="stylesheet" href="/emergency-login-styles.css" />
      
      <div 
        className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100"
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(to bottom right, rgb(255 251 235), rgb(255 247 237), rgb(254 243 199))'
        }}
      >
        {/* Mobile Status Bar Spacer */}
        <div className="h-11 bg-gradient-to-b from-black/20 to-transparent md:hidden" />

        <div className="flex min-h-screen">
          {/* Left Panel - Cashew Branding & Features */}
          <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-amber-700 to-orange-800 text-white p-12 flex-col justify-between">
            {/* Header */}
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <span className="text-2xl">🥜</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Kerala Cashew Processors</h1>
                  <p className="text-amber-100">Premium Cashew Manufacturing</p>
                </div>
              </div>

              <div className="space-y-6">
                <h2 className="text-3xl font-bold leading-tight">
                  From Raw Nuts to Export Excellence
                </h2>
                <p className="text-amber-100 text-lg">
                  Complete cashew processing and manufacturing ERP system 
                  built with enterprise-grade HERA architecture.
                </p>
                
                <div className="bg-white/10 rounded-lg p-4">
                  <h3 className="font-semibold text-amber-200 mb-2">🏆 Premium Quality Standards</h3>
                  <div className="text-sm text-amber-100 space-y-1">
                    <div>• HACCP & ISO 22000 Certified</div>
                    <div>• Organic & Fair Trade Compliant</div>
                    <div>• 1000 MT/month Processing Capacity</div>
                    <div>• Export to USA, Europe, Middle East, Asia</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-6">
              {features.map((feature, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{feature.title}</h3>
                    <p className="text-amber-100 text-sm">{feature.description}</p>
                  </div>
                </div>
              ))}
              
              {/* Processing Steps */}
              <div className="mt-8 bg-white/10 rounded-lg p-4">
                <h3 className="font-semibold text-amber-200 mb-3">🥜 Complete Processing Chain</h3>
                <div className="text-xs text-amber-100 grid grid-cols-2 gap-2">
                  <div>• Steaming & Drying</div>
                  <div>• Shelling & Peeling</div>
                  <div>• Grading & Sorting</div>
                  <div>• Roasting & Packing</div>
                  <div>• Quality Testing</div>
                  <div>• Export Documentation</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel - Login Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
            <div className="w-full max-w-md">
              {/* Mobile Header */}
              <div className="lg:hidden text-center mb-8">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                    <span className="text-2xl">🥜</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-amber-900">Kerala Cashew</h1>
                    <p className="text-amber-700 text-sm">Manufacturing ERP</p>
                  </div>
                </div>
              </div>

              {/* Login Form */}
              <div className="bg-white rounded-2xl shadow-2xl p-8">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Welcome Back
                  </h2>
                  <p className="text-gray-600">
                    Sign in to your cashew processing account
                  </p>
                </div>

                {/* Demo Credentials Display */}
                <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-amber-800 text-sm">Demo Account Ready</h4>
                      <p className="text-amber-700 text-xs mt-1">
                        Email: admin@keralacashew.com<br/>
                        Password: CashewAdmin2024!
                      </p>
                      <p className="text-amber-600 text-xs mt-2">
                        Full access to Kerala Cashew Processors ERP system.
                      </p>
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-red-800 text-sm">Login Failed</h4>
                        <p className="text-red-700 text-xs mt-1">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Email Input */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        required
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="Enter your password"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        ) : (
                          <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Login Button */}
                  <button
                    type="submit"
                    disabled={isLoading || authLoading}
                    className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
                  >
                    {isLoading || authLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Signing In...
                      </>
                    ) : (
                      <>
                        Sign In to Cashew ERP
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </button>
                </form>

                {/* Footer */}
                <div className="mt-6 text-center">
                  <p className="text-gray-500 text-sm">
                    Need access?{' '}
                    <Link href="/contact" className="text-amber-600 hover:text-amber-700 font-medium">
                      Contact Support
                    </Link>
                  </p>
                  <p className="text-gray-400 text-xs mt-2">
                    Powered by HERA ERP Platform
                  </p>
                </div>
              </div>

              {/* Mobile Features */}
              <div className="lg:hidden mt-8 space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <feature.icon className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm">{feature.title}</h3>
                      <p className="text-gray-600 text-xs">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}