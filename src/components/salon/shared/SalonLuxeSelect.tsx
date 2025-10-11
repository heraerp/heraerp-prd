'use client'

import * as React from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SALON_LUXE_COLORS } from '@/lib/constants/salon-luxe-colors'

/**
 * SALON LUXE SELECT COMPONENTS
 *
 * Enterprise-grade select/dropdown components with salon luxe theme.
 * Complete set of styled select components with glassmorphism and golden accents.
 *
 * Features:
 * - Glassmorphism with backdrop blur
 * - Golden borders and hover states
 * - Smooth spring animations
 * - Professional dropdown styling
 * - Dark mode optimized
 *
 * @example
 * <SalonLuxeSelect>
 *   <SalonLuxeSelectTrigger>
 *     <SalonLuxeSelectValue placeholder="Select an option" />
 *   </SalonLuxeSelectTrigger>
 *   <SalonLuxeSelectContent>
 *     <SalonLuxeSelectItem value="option1">Option 1</SalonLuxeSelectItem>
 *     <SalonLuxeSelectItem value="option2">Option 2</SalonLuxeSelectItem>
 *   </SalonLuxeSelectContent>
 * </SalonLuxeSelect>
 */

const SalonLuxeSelect = SelectPrimitive.Root

const SalonLuxeSelectGroup = SelectPrimitive.Group

const SalonLuxeSelectValue = SelectPrimitive.Value

const SalonLuxeSelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  const [isFocused, setIsFocused] = React.useState(false)

  return (
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        'flex h-12 w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium',
        'transition-all duration-500 ease-out',
        'disabled:cursor-not-allowed disabled:opacity-50',
        '[&>span]:line-clamp-1',
        className
      )}
      style={{
        background:
          'linear-gradient(135deg, rgba(245,230,200,0.08) 0%, rgba(212,175,55,0.05) 50%, rgba(184,134,11,0.03) 100%)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        border: `1px solid ${isFocused ? 'rgba(212, 175, 55, 0.60)' : 'rgba(212, 175, 55, 0.25)'}`,
        boxShadow: isFocused
          ? '0 8px 24px rgba(212, 175, 55, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.15)'
          : '0 4px 16px rgba(0, 0, 0, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        color: SALON_LUXE_COLORS.champagne.light,
        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDown
          className="h-4 w-4 transition-all duration-300"
          style={{ color: isFocused ? SALON_LUXE_COLORS.gold.base : SALON_LUXE_COLORS.bronze }}
        />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  )
})
SalonLuxeSelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SalonLuxeSelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronUp className="h-4 w-4" style={{ color: SALON_LUXE_COLORS.gold.base }} />
  </SelectPrimitive.ScrollUpButton>
))
SalonLuxeSelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SalonLuxeSelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn('flex cursor-default items-center justify-center py-1', className)}
    {...props}
  >
    <ChevronDown className="h-4 w-4" style={{ color: SALON_LUXE_COLORS.gold.base }} />
  </SelectPrimitive.ScrollDownButton>
))
SalonLuxeSelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName

const SalonLuxeSelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        'relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-xl',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2',
        'data-[side=left]:slide-in-from-right-2',
        'data-[side=right]:slide-in-from-left-2',
        'data-[side=top]:slide-in-from-bottom-2',
        position === 'popper' &&
          'data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1',
        className
      )}
      position={position}
      style={{
        background:
          'linear-gradient(135deg, rgba(26,26,26,0.98) 0%, rgba(15,15,15,0.98) 100%)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(212, 175, 55, 0.35)',
        boxShadow:
          '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(212, 175, 55, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
      }}
      {...props}
    >
      <SalonLuxeSelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          'p-1',
          position === 'popper' &&
            'h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]'
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SalonLuxeSelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SalonLuxeSelectContent.displayName = SelectPrimitive.Content.displayName

const SalonLuxeSelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn('py-1.5 pl-8 pr-2 text-sm font-semibold', className)}
    style={{ color: SALON_LUXE_COLORS.gold.base }}
    {...props}
  />
))
SalonLuxeSelectLabel.displayName = SelectPrimitive.Label.displayName

const SalonLuxeSelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => {
  const [isHovered, setIsHovered] = React.useState(false)

  return (
    <SelectPrimitive.Item
      ref={ref}
      className={cn(
        'relative flex w-full cursor-pointer select-none items-center rounded-lg py-2.5 pl-8 pr-2 text-sm',
        'outline-none transition-all duration-300',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      style={{
        background: isHovered
          ? 'linear-gradient(135deg, rgba(212, 175, 55, 0.15) 0%, rgba(212, 175, 55, 0.08) 100%)'
          : 'transparent',
        color: isHovered ? SALON_LUXE_COLORS.champagne.light : SALON_LUXE_COLORS.champagne.dark,
        transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="h-4 w-4" style={{ color: SALON_LUXE_COLORS.gold.base }} />
        </SelectPrimitive.ItemIndicator>
      </span>

      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  )
})
SalonLuxeSelectItem.displayName = SelectPrimitive.Item.displayName

const SalonLuxeSelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn('-mx-1 my-1 h-px', className)}
    style={{ background: 'rgba(212, 175, 55, 0.2)' }}
    {...props}
  />
))
SalonLuxeSelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  SalonLuxeSelect,
  SalonLuxeSelectGroup,
  SalonLuxeSelectValue,
  SalonLuxeSelectTrigger,
  SalonLuxeSelectContent,
  SalonLuxeSelectLabel,
  SalonLuxeSelectItem,
  SalonLuxeSelectSeparator,
  SalonLuxeSelectScrollUpButton,
  SalonLuxeSelectScrollDownButton
}
