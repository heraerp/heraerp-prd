'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import * as Avatar from '@radix-ui/react-avatar'
import { User, Settings, LogOut, Crown, Shield } from 'lucide-react'
import { createBrowserClient } from '@/lib/supabase/browserClient'

export function JewelryUserMenu() {
  const router = useRouter()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [user, setUser] = useState<any>(null)
  const supabase = createBrowserClient()

  useEffect(() => {
    const getUser = async () => {
      try {
        const {
          data: { user }
        } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.error('Error getting user:', error)
      }
    }
    getUser()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const initials = user?.email?.substring(0, 2).toUpperCase() || 'JU'
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Jewelry User'

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        ref={triggerRef}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-full"
      >
        <Avatar.Root className="inline-flex h-9 w-9 select-none items-center justify-center overflow-hidden rounded-full jewelry-glass-btn hover:scale-105 transition-transform">
          <Avatar.Image
            className="h-full w-full object-cover"
            src={user?.user_metadata?.avatar_url}
            alt={displayName}
          />
          <Avatar.Fallback className="text-sm font-medium jewelry-text-luxury" delayMs={100}>
            {initials}
          </Avatar.Fallback>
        </Avatar.Root>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="jewelry-glass-dropdown rounded-xl p-2 min-w-[220px] shadow-2xl border border-yellow-500/20"
          sideOffset={8}
          align="end"
          onCloseAutoFocus={() => triggerRef.current?.focus()}
        >
          {/* User Info */}
          {user && (
            <>
              <div className="px-3 py-3 border-b border-yellow-500/20">
                <div className="flex items-center gap-3">
                  <div className="jewelry-crown-glow p-2 rounded-lg">
                    <Crown className="h-4 w-4 jewelry-text-gold" />
                  </div>
                  <div>
                    <p className="text-sm font-medium jewelry-text-luxury">{displayName}</p>
                    <p className="text-xs jewelry-text-muted">{user.email}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Menu Items */}
          <div className="py-1">
            <DropdownMenu.Item asChild>
              <a
                href="/jewelry/profile"
                className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg jewelry-text-luxury hover:jewelry-text-gold hover:bg-yellow-500/10 transition-all cursor-pointer focus-visible:outline-none focus-visible:bg-yellow-500/10 group"
              >
                <User className="h-4 w-4" />
                <span className="group-hover:translate-x-1 transition-transform">Profile</span>
              </a>
            </DropdownMenu.Item>

            <DropdownMenu.Item asChild>
              <a
                href="/jewelry/settings"
                className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg jewelry-text-luxury hover:jewelry-text-gold hover:bg-yellow-500/10 transition-all cursor-pointer focus-visible:outline-none focus-visible:bg-yellow-500/10 group"
              >
                <Settings className="h-4 w-4" />
                <span className="group-hover:translate-x-1 transition-transform">Settings</span>
              </a>
            </DropdownMenu.Item>

            <DropdownMenu.Item asChild>
              <a
                href="/jewelry/security"
                className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg jewelry-text-luxury hover:jewelry-text-gold hover:bg-yellow-500/10 transition-all cursor-pointer focus-visible:outline-none focus-visible:bg-yellow-500/10 group"
              >
                <Shield className="h-4 w-4" />
                <span className="group-hover:translate-x-1 transition-transform">Security</span>
              </a>
            </DropdownMenu.Item>
          </div>

          <DropdownMenu.Separator className="my-2 h-px bg-yellow-500/20" />

          <DropdownMenu.Item asChild>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-3 py-2 text-sm rounded-lg jewelry-text-luxury hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer focus-visible:outline-none focus-visible:bg-red-500/10 w-full text-left group"
            >
              <LogOut className="h-4 w-4" />
              <span className="group-hover:translate-x-1 transition-transform">Sign out</span>
            </button>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
