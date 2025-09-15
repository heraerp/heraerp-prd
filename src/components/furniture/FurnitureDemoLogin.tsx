'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useToast } from '@/hooks/use-toast'
import { LogIn, User, Key } from 'lucide-react'
import { useState } from 'react'
import type { Database } from '@/types/hera-database.types'

const DEMO_CREDENTIALS = {
  email: 'demo@keralafurniture.com',
  password: 'FurnitureDemo2025!',
  organizationId: 'f0af4ced-9d12-4a55-a649-b484368db249'
}

export function FurnitureDemoLogin() {
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClientComponentClient<Database>()
  const [isLoading, setIsLoading] = useState(false)

  const handleDemoLogin = async () => {
    setIsLoading(true)
    try {
      // Sign out first
      await supabase.auth.signOut()

      // Sign in with demo credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: DEMO_CREDENTIALS.email,
        password: DEMO_CREDENTIALS.password
      })

      if (error) {
        throw error
      }

      // Store flag to indicate demo login
      sessionStorage.setItem('isDemoLogin', 'true')
      sessionStorage.setItem('demoOrgId', DEMO_CREDENTIALS.organizationId)

      toast({
        title: 'Login Successful',
        description: 'Redirecting to furniture dashboard...'
      })

      // Use window.location for hard navigation to ensure clean state
      setTimeout(() => {
        window.location.href = '/furniture'
      }, 500)
    } catch (error: any) {
      console.error('Demo login error:', error)
      toast({
        title: 'Login Failed',
        description: error.message || 'Could not log in with demo credentials',
        variant: 'destructive'
      })
      setIsLoading(false)
    }
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-amber-900/10 to-orange-900/10 border-amber-700/30">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-600/20">
            <User className="h-6 w-6 text-amber-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Demo Account</h3>
            <p className="text-sm text-gray-400">Kerala Furniture Works</p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-gray-300">
            <LogIn className="h-4 w-4 text-amber-400" />
            <span>Email: {DEMO_CREDENTIALS.email}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-300">
            <Key className="h-4 w-4 text-amber-400" />
            <span>Password: FurnitureDemo2025!</span>
          </div>
        </div>

        <Button
          onClick={handleDemoLogin}
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
        >
          {isLoading ? (
            <>
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Logging in...
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4 mr-2" />
              Login with Demo Account
            </>
          )}
        </Button>
      </div>
    </Card>
  )
}
