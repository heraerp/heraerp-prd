/**
 * WMS Demo Login Page
 * Smart Code: HERA.WMS.AUTH.LOGIN.v1
 * 
 * Dedicated login page for WMS demo environment
 * Demo Credentials: wms@heraerp.com / demo2025!
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Truck, Recycle, MapPin, Shield } from 'lucide-react'

export default function WMSLoginPage() {
  const router = useRouter()
  const { login, isAuthenticated, isLoading } = useHERAAuth()
  
  const [formData, setFormData] = useState({
    email: 'wms@heraerp.com',
    password: 'demo2025!'
  })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/wms/dashboard')
    }
  }, [isAuthenticated, isLoading, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      await login(formData.email, formData.password, { clearFirst: true })
      console.log('✅ WMS Login successful, redirecting...')
      router.push('/wms/dashboard')
    } catch (err: any) {
      console.error('❌ WMS Login error:', err)
      setError(err.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleDemoLogin = () => {
    setFormData({
      email: 'wms@heraerp.com',
      password: 'demo2025!'
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-green-400 mx-auto mb-4" />
          <p className="text-slate-300">Initializing WMS authentication...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(34,197,94,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(34,197,94,0.05)_50%,transparent_75%)]" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full blur-lg opacity-30" />
              <div className="relative bg-slate-800 p-4 rounded-2xl border border-slate-700">
                <Truck className="h-8 w-8 text-green-400" />
              </div>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">
            HERA WMS Demo
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Professional Waste Management System
            <br />
            Route Optimization • Environmental Compliance
          </p>
        </div>

        {/* Demo Features Banner */}
        <div className="mb-6 p-4 bg-slate-800/60 backdrop-blur-sm rounded-xl border border-slate-700">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="h-4 w-4 text-green-400" />
            <span className="text-green-400 font-medium text-sm">Demo Environment</span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Recycle className="h-3 w-3 text-green-400" />
              <span>Fleet Management</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <MapPin className="h-3 w-3 text-green-400" />
              <span>Route Planning</span>
            </div>
          </div>
        </div>

        {/* Login Form */}
        <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-700 shadow-2xl">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-white text-xl">
              Access WMS Demo
            </CardTitle>
            <CardDescription className="text-slate-400">
              Enter your credentials to continue
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert className="border-red-600/50 bg-red-900/20 text-red-400">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-slate-300">
                  Email Address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className="bg-slate-900/50 border-slate-600 text-white placeholder-slate-400 focus:border-green-400"
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-slate-300">
                  Password
                </label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className="bg-slate-900/50 border-slate-600 text-white placeholder-slate-400 focus:border-green-400"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing In...
                  </div>
                ) : (
                  'Sign In to WMS'
                )}
              </Button>
            </form>

            {/* Demo Quick Access */}
            <div className="mt-6 pt-4 border-t border-slate-700">
              <button
                type="button"
                onClick={handleDemoLogin}
                className="w-full text-center text-sm text-slate-400 hover:text-green-400 transition-colors duration-200"
              >
                Use demo credentials: wms@heraerp.com
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Organization Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Organization: HERA Waste Management Demo
            <br />
            Environment: Development • Version: v2.4
          </p>
        </div>
      </div>
    </div>
  )
}