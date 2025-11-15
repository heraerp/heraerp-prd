'use client'

import React from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'

interface JewelryNavDropdownProps {
  label: string
  items: { label: string; href: string }[]
}

export function JewelryNavDropdown({ label, items }: JewelryNavDropdownProps) {
  const triggerRef = useRef<HTMLButtonElement>(null)
  const prefersReducedMotion = usePrefersReducedMotion()

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger
        ref={triggerRef}
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium jewelry-text-luxury hover:jewelry-text-gold transition-colors rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-yellow-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
      >
        {label}
        <ChevronDown className="h-4 w-4" />
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="jewelry-glass-dropdown rounded-xl p-2 min-w-[220px] shadow-2xl will-change-[opacity,transform] border border-yellow-500/20"
          sideOffset={5}
          onCloseAutoFocus={() => triggerRef.current?.focus()}
        >
          <motion.div
            initial={prefersReducedMotion ? {} : { opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="space-y-1"
          >
            {items.map(item => (
              <DropdownMenu.Item key={item.href} asChild>
                <a
                  href={item.href}
                  className="flex items-center px-3 py-2 text-sm rounded-lg jewelry-text-luxury hover:jewelry-text-gold hover:bg-yellow-500/10 transition-all cursor-pointer focus-visible:outline-none focus-visible:bg-yellow-500/10 focus-visible:jewelry-text-gold group"
                >
                  <span className="group-hover:translate-x-1 transition-transform">
                    {item.label}
                  </span>
                </a>
              </DropdownMenu.Item>
            ))}
          </motion.div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
