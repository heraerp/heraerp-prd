'use client'

import { ReactNode } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog'

interface HERAModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  icon?: ReactNode
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

/**
 * HERA MODAL COMPONENT
 *
 * Enterprise-grade modal component with HERA platform theme.
 * Features glassmorphism, indigo accents, and HERA DNA styling.
 *
 * Features:
 * - Card-glass backdrop with blur
 * - Indigo gradient icon container
 * - Responsive sizing
 * - Accessible with keyboard navigation
 * - HERA color system (ink, ink-muted)
 *
 * @example
 * <HERAModal
 *   open={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Create Organization"
 *   description="Set up your new organization"
 *   icon={<Building className="w-6 h-6" />}
 *   footer={<HERAButton>Create</HERAButton>}
 * >
 *   <p>Modal content here</p>
 * </HERAModal>
 */
export function HERAModal({
  open,
  onClose,
  title,
  description,
  icon,
  children,
  footer,
  size = 'md'
}: HERAModalProps) {
  const sizeClasses = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl'
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`card-glass backdrop-blur-xl border-border ${sizeClasses[size]} max-h-[90vh] overflow-y-auto`}>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {icon && (
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0">
                {icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <DialogTitle className="ink text-2xl font-bold">{title}</DialogTitle>
              {description && (
                <DialogDescription className="ink-muted mt-1">
                  {description}
                </DialogDescription>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          {children}
        </div>

        {footer && (
          <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
