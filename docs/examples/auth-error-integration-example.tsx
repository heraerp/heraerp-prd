/**
 * 📚 EXAMPLE: Integrating Auth Error Handling into Login Page
 *
 * This example shows how to integrate the authentication error handling
 * system into your auth/login pages.
 */

// ============================================================================
// EXAMPLE 1: Basic Integration
// ============================================================================

'use client'

import { AuthErrorDisplay } from '@/components/auth/AuthErrorDisplay'
import { getAndClearReturnUrl } from '@/lib/auth/authentication-error-handler'
import { useRouter } from 'next/navigation'

export default function SalonAuthPage() {
  const router = useRouter()

  const handleLogin = async (email: string, password: string) => {
    // Your login logic here
    const success = await performLogin(email, password)

    if (success) {
      // ✅ Get return URL and redirect
      const returnUrl = getAndClearReturnUrl()
      router.push(returnUrl || '/salon/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full space-y-8">
        {/* ✅ Display auth error if redirected from 401 */}
        <AuthErrorDisplay />

        {/* Your login form */}
        <div className="bg-white p-8 rounded-lg shadow">
          <h2 className="text-2xl font-bold mb-4">Login</h2>
          <form onSubmit={(e) => {
            e.preventDefault()
            handleLogin(email, password)
          }}>
            {/* Form fields... */}
          </form>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// EXAMPLE 2: With Loading State
// ============================================================================

export function EnhancedAuthPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const { supabase } = await import('@/lib/supabase/client')
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        setError(authError.message)
        return
      }

      // ✅ Success - redirect to return URL or default
      const returnUrl = getAndClearReturnUrl()
      router.push(returnUrl || '/salon/dashboard')
    } catch (err) {
      setError('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full px-4">
        {/* ✅ Show session expired / 401 error */}
        <AuthErrorDisplay />

        <div className="bg-white p-8 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-6 text-center">Welcome Back</h2>

          {/* Show login-specific errors */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={(e) => {
            e.preventDefault()
            const formData = new FormData(e.currentTarget)
            handleLogin(
              formData.get('email') as string,
              formData.get('password') as string
            )
          }}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  className="w-full px-3 py-2 border rounded focus:ring-2"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  required
                  className="w-full px-3 py-2 border rounded focus:ring-2"
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Logging in...' : 'Log In'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// EXAMPLE 3: With Inline Error Display
// ============================================================================

import { InlineAuthError } from '@/components/auth/AuthErrorDisplay'

export function LoginFormWithInlineErrors() {
  const [loginError, setLoginError] = useState<string | null>(null)

  return (
    <form className="space-y-4">
      {/* ✅ Top-level auth errors (from 401 redirect) */}
      <AuthErrorDisplay />

      {/* ✅ Inline login errors */}
      {loginError && (
        <InlineAuthError message={loginError} severity="error" />
      )}

      {/* Form fields... */}
    </form>
  )
}

// ============================================================================
// EXAMPLE 4: Logout with State Clearing
// ============================================================================

import { clearAuthenticationState } from '@/lib/auth/authentication-error-handler'

export function LogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      // ✅ Clear all authentication state
      await clearAuthenticationState()

      // Redirect to login
      router.push('/salon/auth')
    } catch (error) {
      console.error('Logout error:', error)
      // Still redirect even if error
      router.push('/salon/auth')
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
    >
      Logout
    </button>
  )
}

// ============================================================================
// EXAMPLE 5: Complete Salon Auth Page
// ============================================================================

export default function CompleteSalonAuthPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { supabase } = await import('@/lib/supabase/client')

      // Attempt login
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (authError) {
        setError(authError.message)
        setIsLoading(false)
        return
      }

      if (data.user) {
        // Store user info in localStorage
        localStorage.setItem('salonUserEmail', email)
        localStorage.setItem('salonUserName', data.user.user_metadata?.full_name || email)

        // ✅ Get return URL if user was redirected from 401
        const returnUrl = getAndClearReturnUrl()

        console.log('[Auth] Login successful, redirecting to:', returnUrl || '/salon/dashboard')

        // Redirect to return URL or default dashboard
        router.push(returnUrl || '/salon/dashboard')
      }
    } catch (err: any) {
      console.error('[Auth] Login error:', err)
      setError(err.message || 'Login failed. Please try again.')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="max-w-md w-full px-6">
        {/* ✅ CRITICAL: Display authentication errors from 401 redirects */}
        <AuthErrorDisplay />

        <div className="bg-white rounded-xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Salon Login</h1>
            <p className="text-gray-600 mt-2">Welcome back! Please login to continue.</p>
          </div>

          {/* Login-specific errors */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 rounded">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Logging in...
                </>
              ) : (
                'Log In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/salon/auth/forgot-password" className="text-sm text-blue-600 hover:text-blue-700">
              Forgot your password?
            </a>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-400">
            Don't have an account?{' '}
            <a href="/salon/auth/register" className="text-blue-400 hover:text-blue-300">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Helper Functions
// ============================================================================

async function performLogin(email: string, password: string): Promise<boolean> {
  const { supabase } = await import('@/lib/supabase/client')
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return !error && !!data.user
}

/**
 * USAGE NOTES:
 *
 * 1. Add <AuthErrorDisplay /> at the top of your auth pages
 * 2. Use getAndClearReturnUrl() after successful login
 * 3. Use clearAuthenticationState() on logout
 * 4. That's it! All API calls automatically handle 401 errors
 */
