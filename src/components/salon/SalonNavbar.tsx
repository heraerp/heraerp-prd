'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { 
  User, 
  LogOut, 
  ChevronDown,
  Store,
  Settings,
  HelpCircle
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

export function SalonNavbar() {
  const router = useRouter()
  const { user, organization, signOut } = useHERAAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  // Get user info from localStorage for demo
  const [userInfo, setUserInfo] = useState(() => {
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('salonUser')
      if (storedUser) {
        try {
          return JSON.parse(storedUser)
        } catch {
          return null
        }
      }
    }
    return null
  })

  const displayUser = user || userInfo
  const displayName = displayUser?.user_metadata?.full_name || displayUser?.name || displayUser?.email || 'Demo User'
  const userInitials = displayName.split(' ').map((n: string) => n[0]).join('').toUpperCase()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      // Clear demo data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('salonUserId')
        localStorage.removeItem('salonUser')
        localStorage.removeItem('organizationId')
        localStorage.removeItem('salonRole')
      }

      // Sign out if authenticated
      if (signOut) {
        await signOut()
      }

      // Redirect to salon home
      router.push('/salon')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <nav className="fixed top-0 left-20 right-0 h-16 z-40 bg-background/80 backdrop-blur-md border-b border-border/50">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left side - Organization name */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-light tracking-wide text-foreground">
            Hair Talkz Salon
          </h1>
        </div>

        {/* Right side - User menu */}
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center gap-2 hover:bg-accent/50"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-violet-600 text-white text-sm">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{displayName}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{displayName}</p>
                <p className="text-xs text-muted-foreground">
                  {displayUser?.email || 'demo@hairtalkz.com'}
                </p>
              </div>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => router.push('/salon/settings/profile')}>
                <User className="mr-2 h-4 w-4" />
                Profile Settings
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => router.push('/salon/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                Salon Settings
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => router.push('/salon/help')}>
                <HelpCircle className="mr-2 h-4 w-4" />
                Help & Support
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="text-red-600 dark:text-red-400"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isLoggingOut ? 'Logging out...' : 'Logout'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  )
}