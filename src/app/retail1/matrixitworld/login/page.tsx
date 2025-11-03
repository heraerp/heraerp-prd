'use client'

/**
 * MatrixIT World ERP - Login Page
 * Branded login experience for PC & Mobile retail platform
 */

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { 
  Monitor,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle,
  Truck,
  Smartphone,
  Building,
  Loader2,
  Package,
  DollarSign,
  BarChart3
} from 'lucide-react'

export default function MatrixITWorldLoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, isLoading: authLoading } = useHERAAuth()
  const [formData, setFormData] = useState({
    email: 'team@hanaset.com',
    password: 'HERA2025!'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/retail1/matrixitworld')
    }
  }, [isAuthenticated, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await login(formData.email, formData.password)
      // HERAAuth will handle the redirect
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading MatrixIT World...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="flex min-h-screen">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600 to-blue-800 p-12 flex-col justify-between relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20">
              <Monitor className="w-32 h-32 text-white" />
            </div>
            <div className="absolute top-40 right-20">
              <Smartphone className="w-24 h-24 text-white" />
            </div>
            <div className="absolute bottom-40 left-32">
              <Package className="w-28 h-28 text-white" />
            </div>
            <div className="absolute bottom-20 right-32">
              <Truck className="w-20 h-20 text-white" />
            </div>
          </div>

          {/* Header */}
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Monitor className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">MatrixIT World</h1>
                <p className="text-blue-100">Kerala's Premier Tech Retail Platform</p>
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-white leading-tight">
                Complete PC & Mobile
                <br />
                Retail ERP Solution
              </h2>
              <p className="text-xl text-blue-100 leading-relaxed">
                Streamline inventory, sales, and customer management across 6 branches 
                with AI-powered insights and real-time analytics.
              </p>
            </div>
          </div>

          {/* Features */}
          <div className="relative z-10 space-y-4">
            <div className="flex items-center space-x-3 text-white">
              <CheckCircle className="w-5 h-5 text-blue-200" />
              <span>Multi-branch inventory management</span>
            </div>
            <div className="flex items-center space-x-3 text-white">
              <CheckCircle className="w-5 h-5 text-blue-200" />
              <span>Real-time sales tracking across Kerala</span>
            </div>
            <div className="flex items-center space-x-3 text-white">
              <CheckCircle className="w-5 h-5 text-blue-200" />
              <span>AI-powered demand forecasting</span>
            </div>
            <div className="flex items-center space-x-3 text-white">
              <CheckCircle className="w-5 h-5 text-blue-200" />
              <span>Integrated supplier rebate management</span>
            </div>
          </div>

          {/* Stats */}
          <div className="relative z-10 grid grid-cols-3 gap-6 mt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">6</div>
              <div className="text-sm text-blue-200">Active Branches</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">5K+</div>
              <div className="text-sm text-blue-200">Products</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">₹10Cr+</div>
              <div className="text-sm text-blue-200">Annual Revenue</div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile Logo */}
            <div className="lg:hidden text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Monitor className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">MatrixIT World</h1>
              <p className="text-gray-600">PC & Mobile Retail Platform</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                <p className="text-gray-600">Sign in to access your MatrixIT World dashboard</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      required
                      value={formData.password}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50" />
                    <span className="ml-2 text-sm text-gray-600">Remember me</span>
                  </label>
                  <Link href="/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-500">
                    Forgot password?
                  </Link>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Sign In
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link href="/auth/signup" className="text-blue-600 hover:text-blue-500 font-medium">
                      Contact Administrator
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            {/* Demo Access */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500 mb-4">Quick Demo Access</p>
              <div className="grid grid-cols-3 gap-3">
                <Link 
                  href="/retail1/matrixitworld"
                  className="p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
                >
                  <BarChart3 className="w-6 h-6 text-blue-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                  <div className="text-xs text-blue-700 font-medium">Dashboard</div>
                </Link>
                <Link 
                  href="/inventory/products"
                  className="p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
                >
                  <Package className="w-6 h-6 text-green-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                  <div className="text-xs text-green-700 font-medium">Inventory</div>
                </Link>
                <Link 
                  href="/crm/customers"
                  className="p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
                >
                  <Building className="w-6 h-6 text-purple-600 mx-auto mb-1 group-hover:scale-110 transition-transform" />
                  <div className="text-xs text-purple-700 font-medium">Customers</div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}