'use client'

import React, { useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

interface OptimizedNavigationLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  onClick?: () => void
  prefetch?: boolean
}

export default function OptimizedNavigationLink({
  href,
  children,
  className,
  onClick,
  prefetch = true
}: OptimizedNavigationLinkProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()

    // Call onClick if provided (for closing mobile menu)
    onClick?.()

    // Use transition for smoother navigation
    startTransition(() => {
      router.push(href)
    })
  }

  return (
    <Link
      href={href}
      className={cn(className, isPending && 'opacity-50 pointer-events-none')}
      onClick={handleClick}
      prefetch={prefetch}
    >
      {children}
    </Link>
  )
}
