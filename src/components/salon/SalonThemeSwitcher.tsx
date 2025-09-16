'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/src/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/src/components/ui/dropdown-menu'

export default function SalonThemeSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  const currentTheme = pathname.includes('salon-data') ? 'dark' : 'light'

  const switchTheme = (theme: 'light' | 'dark') => {
    // Save preference
    localStorage.setItem('salon-theme-preference', theme)

    // Navigate to appropriate page
    if (theme === 'dark' && !pathname.includes('salon-data')) {
      router.push('/salon-data')
    } else if (theme === 'light' && pathname.includes('salon-data')) {
      router.push('/salon')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed top-4 right-20 z-50 bg-background/80 dark:bg-muted/80 backdrop-blur-sm border-border dark:border-border"
        >
          {currentTheme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => switchTheme('light')}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light Theme</span>
          {currentTheme === 'light' && <span className="ml-2">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => switchTheme('dark')}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark Theme</span>
          {currentTheme === 'dark' && <span className="ml-2">✓</span>}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push('/salon-pro')}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>Theme Selector</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
