'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface TooltipProps {
  children: React.ReactNode
  content?: React.ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  delayDuration?: number
}

const TooltipProvider: React.FC<{ children: React.ReactNode; delayDuration?: number }> = ({
  children
}) => {
  return <>{children}</>
}

const Tooltip: React.FC<TooltipProps> = ({ children }) => {
  return <>{children}</>
}

const TooltipTrigger = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { asChild?: boolean }
>(({ className, children, asChild, ...props }, ref) => {
  const [showTooltip, setShowTooltip] = React.useState(false)

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as any, {
      ...props,
      ...(children.props || {}),
      ref,
      onMouseEnter: (e: any) => {
        setShowTooltip(true)
        if (children.props?.onMouseEnter) {
          children.props.onMouseEnter(e)
        }
      },
      onMouseLeave: (e: any) => {
        setShowTooltip(false)
        if (children.props?.onMouseLeave) {
          children.props.onMouseLeave(e)
        }
      }
    })
  }

  return (
    <div
      ref={ref}
      className={className}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      {...props}
    >
      {children}
    </div>
  )
})
TooltipTrigger.displayName = 'TooltipTrigger'

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    side?: 'top' | 'right' | 'bottom' | 'left'
    sideOffset?: number
  }
>(({ className, children, side = 'top', sideOffset = 4, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        'z-50 overflow-hidden rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white shadow-md',
        'absolute pointer-events-none opacity-0 transition-opacity duration-300',
        'group-hover:opacity-100',
        side === 'right' && 'left-full top-1/2 -translate-y-1/2 ml-2',
        side === 'left' && 'right-full top-1/2 -translate-y-1/2 mr-2',
        side === 'top' && 'bottom-full left-1/2 -translate-x-1/2 mb-2',
        side === 'bottom' && 'top-full left-1/2 -translate-x-1/2 mt-2',
        className
      )}
      style={{ marginLeft: side === 'right' ? sideOffset : undefined }}
      {...props}
    >
      {children}
    </div>
  )
})
TooltipContent.displayName = 'TooltipContent'

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
