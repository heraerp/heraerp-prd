'use client'

import React, { useState } from 'react'
import { useAuth } from '@/components/auth/DualAuthProvider'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChefHat, Utensils, Loader2, AlertCircle } from 'lucide-react'

export function RestaurantLogin() {
  const { login, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    
    try {
      const result = await login(email, password)
      if (!result.success) {
        setError(result.error || 'Login failed')
      }
    } catch (err) {
      setError('Login failed. Please try again.')
    }
  }

  const useDemoCredentials = () => {
    setEmail('mario@restaurant.com')
    setPassword('demo123')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center p-4">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-200 to-red-200 rounded-full opacity-30 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-red-200 to-pink-200 rounded-full opacity-30 blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        <Card className="backdrop-blur-xl bg-white/90 border border-orange-200/50 shadow-2xl shadow-orange-500/10">
          {/* Header */}
          <div className="p-8 text-center border-b border-orange-100">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
              <ChefHat className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Restaurant Manager</h1>
            <p className="text-gray-600 text-sm">Sign in to manage your restaurant</p>
          </div>

          {/* Login Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 h-12 border-orange-200 focus:border-orange-400 focus:ring-orange-400/20"
                    placeholder="your@email.com"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-2 h-12 border-orange-200 focus:border-orange-400 focus:ring-orange-400/20"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            {/* Demo Credentials */}
            <div className="mt-8 pt-6 border-t border-orange-100">
              <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 border border-orange-200/50">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Try Demo Account
                </h3>
                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Restaurant:</span>
                    <span className="font-medium">Mario's Italian Bistro</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Owner:</span>
                    <span className="font-medium">Mario Rossi</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Email:</span>
                    <span className="font-medium">mario@restaurant.com</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Password:</span>
                    <span className="font-medium">demo123</span>
                  </div>
                </div>
                <Button
                  onClick={useDemoCredentials}
                  variant="outline"
                  className="w-full mt-4 border-orange-300 text-orange-700 hover:bg-orange-50"
                >
                  Use Demo Credentials
                </Button>
              </div>
            </div>

            {/* HERA Attribution */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-400">
                Powered by <span className="font-semibold text-gray-600">HERA Universal Platform</span>
              </p>
              <p className="text-xs text-gray-400 mt-1">
                One platform, infinite business possibilities
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}