'use client'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Lock, CheckCircle, AlertCircle, Eye, EyeOff, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [sessionChecked, setSessionChecked] = useState(false)
  const [hasValidSession, setHasValidSession] = useState(false)

  // Check if we have a valid session from the email link
  useEffect(() => {
    const checkSession = async () => {
      try {
        // First check for error parameters from Supabase
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const errorCode = hashParams.get('error_code')
        const errorDescription = hashParams.get('error_description')
        const error = hashParams.get('error')

        console.log('URL Parameters:', {
          fullURL: window.location.href,
          hash: window.location.hash,
          errorCode,
          errorDescription,
          error
        })

        // Handle Supabase errors
        if (errorCode || error) {
          let errorMessage = 'Invalid or expired reset link. Please request a new one.'

          if (errorCode === 'otp_expired') {
            errorMessage = 'This password reset link has expired. Please request a new one.'
          } else if (errorDescription) {
            errorMessage = decodeURIComponent(errorDescription.replace(/\+/g, ' '))
          }

          setError(errorMessage)
          setHasValidSession(false)
          setSessionChecked(true)
          return
        }

        // Check for existing session
        const {
          data: { session },
          error: sessionError
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('Session check error:', sessionError)
          setError('Invalid or expired reset link. Please request a new one.')
          setHasValidSession(false)
        } else if (session) {
          setHasValidSession(true)
        } else {
          // Check if we have recovery token in URL
          const accessToken = hashParams.get('access_token')
          const type = hashParams.get('type')

          console.log('Token check:', {
            accessToken: accessToken ? 'present' : 'missing',
            type: type
          })

          if (accessToken && type === 'recovery') {
            // Set the session with the recovery token
            const refreshToken = hashParams.get('refresh_token')
            console.log('Setting session with tokens:', {
              hasAccessToken: !!accessToken,
              hasRefreshToken: !!refreshToken
            })

            const { data: sessionData, error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || ''
            })

            if (setSessionError) {
              console.error('Failed to set session:', setSessionError)
              setError('Failed to validate reset link. Please request a new one.')
              setHasValidSession(false)
            } else {
              console.log('Session set successfully:', sessionData)
              setHasValidSession(true)
            }
          } else {
            console.log('Missing required parameters for password reset')
            setError('Invalid reset link. Please request a new password reset.')
            setHasValidSession(false)
          }
        }
      } catch (err) {
        console.error('Session check error:', err)
        setError('Unable to verify reset link. Please try again.')
        setHasValidSession(false)
      } finally {
        setSessionChecked(true)
      }
    }

    checkSession()
  }, [])

  const validatePassword = () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return false
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!validatePassword()) {
      return
    }

    setIsLoading(true)

    try {
      console.log('Attempting to update password...')

      const { data, error } = await supabase.auth.updateUser({
        password: password
      })

      console.log('Update password response:', { data, error })

      if (error) {
        console.error('Password update error:', error)
        throw error
      }

      // Check if update was successful
      if (!data || !data.user) {
        throw new Error('Password update failed - no user data returned')
      }

      console.log('Password updated successfully')
      setSuccess(true)

      // Sign out to ensure clean state
      console.log('Signing out...')
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) {
        console.error('Sign out error:', signOutError)
      }

      // Redirect to login after 2 seconds
      console.log('Redirecting to login in 2 seconds...')
      setTimeout(() => {
        router.push('/auth/login')
      }, 2000)
    } catch (err) {
      console.error('Password reset error:', err)
      setError(err instanceof Error ? err.message : 'Failed to reset password')
      setIsLoading(false)
    }
  }

  // Loading state while checking session
  if (!sessionChecked) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                <p className="text-muted-foreground">Verifying reset link...</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Invalid session state
  if (!hasValidSession) {
    const isExpired = error?.toLowerCase().includes('expired')

    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-amber-600" />
              </div>
              <CardTitle className="text-2xl">
                {isExpired ? 'Link Expired' : 'Invalid Reset Link'}
              </CardTitle>
              <CardDescription>
                {isExpired
                  ? 'This password reset link has expired'
                  : 'This password reset link is invalid'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {error && (
                <Alert className="border-amber-200 bg-amber-50">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800">{error}</AlertDescription>
                </Alert>
              )}

              <div className="text-sm text-muted-foreground space-y-2">
                <p className="text-center">
                  {isExpired
                    ? 'For security reasons, password reset links expire after 1 hour.'
                    : 'This link may have already been used or is invalid.'}
                </p>
                <p className="text-center font-medium">Please request a new password reset link.</p>
              </div>

              <div className="space-y-3">
                <Link href="/auth/forgot-password" className="block">
                  <Button className="w-full" size="lg">
                    <Mail className="mr-2 h-4 w-4" />
                    Request New Reset Link
                  </Button>
                </Link>

                <Link href="/auth/login" className="block">
                  <Button variant="outline" className="w-full">
                    Back to Login
                  </Button>
                </Link>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground text-center">
                  Tip: Check your email spam folder if you don't receive the reset email.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Success state
  if (success) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Password Reset Successfully</CardTitle>
              <CardDescription>Your password has been updated</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Your password has been reset successfully. You can now sign in with your new
                  password.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  Redirecting to login page in 2 seconds...
                </p>

                <Link href="/auth/login" className="block">
                  <Button className="w-full" size="lg">
                    <Lock className="mr-2 h-4 w-4" />
                    Sign In Now
                  </Button>
                </Link>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground text-center">
                  Your old password will no longer work. Please use your new password to sign in.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Reset password form
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Reset Your Password</CardTitle>
            <CardDescription>Enter your new password below</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">Must be at least 6 characters long</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !password || !confirmPassword}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Reset Password
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-gray-800">
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Make sure to use a strong password that you haven't used before. Your password should be
            at least 6 characters long.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
