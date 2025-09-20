'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Code, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DocGuideSelectorProps {
  currentType: 'dev' | 'user'
}

export default function DocGuideSelector({ currentType }: DocGuideSelectorProps) {
  const pathname = usePathname()

  return (
    <div className="flex items-center space-x-1 rounded-lg border p-1">
      <Button
        asChild
        variant={currentType === 'dev' ? 'default' : 'ghost'}
        size="sm"
        className={cn(
          'h-7 text-xs',
          currentType === 'dev' && 'bg-hera-primary hover:bg-hera-primary/90'
        )}
      >
        <Link href="/docs/dev" className="flex items-center gap-1">
          <Code className="h-3 w-3" />
          <span className="hidden sm:inline">Developer</span>
          <span className="sm:hidden">Dev</span>
        </Link>
      </Button>

      <Button
        asChild
        variant={currentType === 'user' ? 'default' : 'ghost'}
        size="sm"
        className={cn(
          'h-7 text-xs',
          currentType === 'user' && 'bg-hera-primary hover:bg-hera-primary/90'
        )}
      >
        <Link href="/docs/user" className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          User
        </Link>
      </Button>
    </div>
  )
}
