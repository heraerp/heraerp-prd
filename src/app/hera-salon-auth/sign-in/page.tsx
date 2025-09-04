'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/hera-salon/Button'
import { Input } from '@/components/ui/hera-salon/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/hera-salon/Card'
import { Alert, AlertDescription } from '@/components/ui/hera-salon/Alert'
import { Label } from '@/components/ui/hera-salon/Label'
import { Checkbox } from '@/components/ui/hera-salon/Checkbox'
import { 
  Scissors,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Heart
} from 'lucide-react'

export default function HERASalonSignIn() {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Simulate auth request
    try {
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (formData.email === 'demo@herasalon.com' && formData.password === 'demo123') {
            resolve('success')
          } else {
            reject('Invalid credentials')
          }
        }, 1500)
      })
      
      // Success - would redirect in real app
      console.log('Authentication successful')
    } catch (err) {
      setError('Invalid email or password. Try demo@herasalon.com / demo123')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-hera-bg-50 via-white to-hera-primary-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-hera-primary-500 to-hera-pink-500 flex items-center justify-center shadow-hera-lg">
            <Scissors className="w-8 h-8 text-white" />
          </div>
          <h1 className="hera-h2 mb-2">Welcome to HERA Salon</h1>
          <p className="hera-subtle">Sign in to manage your beauty appointments</p>
        </div>

        {/* Sign In Card */}
        <Card className="shadow-hera-xl">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  leftIcon={<Mail />}
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  leftIcon={<Lock />}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={formData.remember}
                    onCheckedChange={(checked) => handleInputChange('remember', checked as boolean)}
                  />
                  <Label htmlFor="remember" className="text-sm">
                    Remember me
                  </Label>
                </div>
                <button
                  type="button"
                  className="text-sm text-hera-primary-600 hover:underline focus:outline-none focus:ring-2 focus:ring-hera-primary-400 rounded"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full"
                size="lg"
                loading={loading}
                rightIcon={!loading ? <ArrowRight /> : undefined}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className="text-center">
                <p className="text-sm text-hera-ink-muted">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    className="text-hera-primary-600 hover:underline focus:outline-none focus:ring-2 focus:ring-hera-primary-400 rounded"
                  >
                    Sign up here
                  </button>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="mt-6 border-hera-teal-200 bg-hera-teal-50 dark:bg-hera-teal-950/10">
          <CardContent className="p-4">
            <div className="flex items-start space-x-2">
              <Sparkles className="w-4 h-4 text-hera-teal-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-hera-teal-800 dark:text-hera-teal-200 mb-1">
                  Demo Credentials
                </p>
                <p className="text-hera-teal-700 dark:text-hera-teal-300">
                  <strong>Email:</strong> demo@herasalon.com<br />
                  <strong>Password:</strong> demo123
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mt-8 text-center">
          <div className="flex items-center justify-center space-x-6 text-sm text-hera-ink-muted">
            <div className="flex items-center space-x-1">
              <Heart className="w-4 h-4 text-hera-pink-500" />
              <span>Premium Beauty</span>
            </div>
            <div className="flex items-center space-x-1">
              <Sparkles className="w-4 h-4 text-hera-teal-500" />
              <span>Expert Stylists</span>
            </div>
            <div className="flex items-center space-x-1">
              <Scissors className="w-4 h-4 text-hera-primary-500" />
              <span>Luxury Experience</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}